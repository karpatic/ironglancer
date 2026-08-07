'use strict';

const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PLUGIN_NAME = 'IronGlancerWebpackPlugin';
const DEFAULT_OUT_DIR = '.ironglancer';
const DEFAULT_SERVICE_HOST = '127.0.0.1';
const DEFAULT_SERVICE_PORT = 4173;
const DEFAULT_MODULE_LIMIT = 500;

function noop() {}

function createFallbackLogger() {
  return {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
  };
}

function loggerMethod(logger, method) {
  return typeof logger?.[method] === 'function' ? logger[method].bind(logger) : noop;
}

function asArray(value) {
  if (value == null || value === false) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeAliases(value) {
  if (value instanceof Map) return Array.from(value, ([from, to]) => ({ from, to }));
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([from, to]) => ({ from, to }));
  }
  return asArray(value);
}

function normalizeAliasOptions(options) {
  return [
    ...normalizeAliases(options.aliases),
    ...normalizeAliases(options.alias),
  ];
}

function resolveProjectPath(rootDir, value, defaultValue) {
  const raw = value == null || value === '' ? defaultValue : value;
  if (raw == null || raw === '') return raw;
  return path.isAbsolute(String(raw)) ? String(raw) : path.resolve(rootDir, String(raw));
}

function parsePort(value, name) {
  const raw = value == null || value === '' ? '0' : String(value).trim();
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be an integer between 0 and 65535.`);
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${name} must be an integer between 0 and 65535.`);
  }
  return port;
}

function isLoopbackHost(host) {
  const normalized = String(host || '').trim().toLowerCase();
  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized.startsWith('127.')
    || normalized === '::1'
    || normalized === '[::1]';
}

function hostForUrl(host) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function normalizeServiceEnabled(value, defaultValue = true) {
  if (value == null) return defaultValue;
  return Boolean(value);
}

function importLocal(relativePath) {
  return import(pathToFileURL(path.join(__dirname, relativePath)).href);
}

function serviceUrls(serviceInfo) {
  return {
    serviceUrl: serviceInfo?.url || null,
    url: serviceInfo?.url || null,
    apiUrl: serviceInfo?.apiUrl || serviceInfo?.apiBaseUrl || null,
    apiBaseUrl: serviceInfo?.apiBaseUrl || serviceInfo?.apiUrl || null,
    bridgeUrl: serviceInfo?.bridgeUrl || null,
  };
}

function publicServiceState(serviceInfo) {
  if (!serviceInfo) return null;
  const urls = serviceUrls(serviceInfo);
  return {
    enabled: true,
    host: serviceInfo.host,
    port: serviceInfo.port,
    outDir: serviceInfo.outDir || null,
    ...urls,
  };
}

function statsHasErrors(stats) {
  if (typeof stats?.hasErrors === 'function') return stats.hasErrors();
  const errors = stats?.compilation?.errors;
  return Array.isArray(errors) && errors.length > 0;
}

function closeHttpServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  });
}

class ManagedStaticAnalysisService {
  constructor({ options, logger, createStaticAnalysisRequestHandler }) {
    this.options = options;
    this.logger = logger;
    this.createStaticAnalysisRequestHandler = createStaticAnalysisRequestHandler;
    this.handler = null;
    this.server = null;
    this.outDir = null;
    this.port = null;
    this.url = null;
    this.apiUrl = null;
    this.apiBaseUrl = null;
    this.bridgeUrl = null;
  }

  async refresh(outDir) {
    if (!this.options.enabled) return null;
    const nextHandler = await this.createStaticAnalysisRequestHandler({ outDir });
    const previousHandler = this.handler;
    const previousOutDir = this.outDir;
    this.handler = nextHandler;
    this.outDir = nextHandler.outDir || outDir;
    try {
      if (!this.server) await this.startServer();
    } catch (error) {
      this.handler = previousHandler;
      this.outDir = previousOutDir;
      throw error;
    }
    return this.info();
  }

  async startServer() {
    if (!isLoopbackHost(this.options.host)) {
      throw new Error('IronGlancer Webpack service is loopback-only; use 127.0.0.1 or localhost.');
    }
    const dispatcher = (request, response) => {
      if (!this.handler) {
        response.writeHead(503, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        });
        response.end(JSON.stringify({
          ok: false,
          error: {
            status: 503,
            code: 'viewer_not_ready',
            message: 'IronGlancer viewer is not ready.',
          },
        }) + '\n');
        return;
      }
      this.handler(request, response);
    };
    const server = http.createServer(dispatcher);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.options.port, this.options.host, () => {
        server.off('error', reject);
        resolve();
      });
    });
    this.server = server;
    const address = server.address();
    const resolvedPort = typeof address === 'object' && address ? address.port : this.options.port;
    const resolvedAddress = typeof address === 'object' && address?.address ? address.address : this.options.host;
    const urlHost = hostForUrl(resolvedAddress === '::' ? 'localhost' : resolvedAddress);
    this.port = resolvedPort;
    this.url = `http://${urlHost}:${resolvedPort}/`;
    this.apiUrl = `${this.url}api/v1`;
    this.apiBaseUrl = this.apiUrl;
    this.bridgeUrl = `${this.url}bridge/v1/`;
    loggerMethod(this.logger, 'info')(`IronGlancer service listening at ${this.url}`);
  }

  info() {
    if (!this.server) return null;
    return {
      server: this.server,
      host: this.options.host,
      port: this.port,
      outDir: this.outDir,
      url: this.url,
      serviceUrl: this.url,
      apiUrl: this.apiUrl,
      apiBaseUrl: this.apiBaseUrl,
      bridgeUrl: this.bridgeUrl,
      close: () => this.close(),
    };
  }

  async close() {
    await closeHttpServer(this.server);
    this.server = null;
    this.handler = null;
    this.outDir = null;
    this.port = null;
    this.url = null;
    this.apiUrl = null;
    this.apiBaseUrl = null;
    this.bridgeUrl = null;
  }
}

class IronGlancerWebpackPlugin {
  constructor(options = {}, dependencies = {}) {
    this.options = { ...options };
    this.dependencies = dependencies;
    this.compiler = null;
    this.logger = createFallbackLogger();
    this.service = null;
    this.running = false;
    this.pending = null;
    this.idlePromise = Promise.resolve(null);
    this.closePromise = null;
    this.closed = false;
    this.lastResult = null;
    this.lastError = null;
    this.runOrdinal = 0;
    this.state = {
      status: 'idle',
      running: false,
      pending: false,
      closed: false,
      outDir: null,
      service: null,
      serviceUrl: null,
      url: null,
      apiUrl: null,
      apiBaseUrl: null,
      bridgeUrl: null,
      lastError: null,
      lastSuccessfulAt: null,
    };
  }

  apply(compiler) {
    this.compiler = compiler;
    this.logger = typeof compiler.getInfrastructureLogger === 'function'
      ? compiler.getInfrastructureLogger(PLUGIN_NAME)
      : createFallbackLogger();

    const onDone = async (stats) => {
      if (statsHasErrors(stats)) {
        loggerMethod(this.logger, 'warn')('Skipping IronGlancer analysis because the Webpack compilation has errors.');
        return this.whenIdle();
      }
      return this.scheduleRefresh({ compiler, reason: 'webpack-done' });
    };

    if (typeof compiler.hooks.done?.tapPromise === 'function') {
      compiler.hooks.done.tapPromise(PLUGIN_NAME, onDone);
    } else {
      compiler.hooks.done.tap(PLUGIN_NAME, (stats) => {
        onDone(stats).catch((error) => {
          loggerMethod(this.logger, 'error')(`IronGlancer analysis failed: ${error?.message || error}`);
        });
      });
    }

    if (compiler.hooks.watchClose) {
      compiler.hooks.watchClose.tap(PLUGIN_NAME, () => {
        this.closePromise = this.close().catch((error) => {
          loggerMethod(this.logger, 'error')(`Failed to close IronGlancer service: ${error?.message || error}`);
          throw error;
        });
      });
    }

    if (compiler.hooks.shutdown?.tapPromise) {
      compiler.hooks.shutdown.tapPromise(PLUGIN_NAME, () => this.close());
    }
  }

  async start(overrides = {}) {
    return this.refresh(overrides);
  }

  async refresh(overrides = {}) {
    this.closed = false;
    this.closePromise = null;
    return this.scheduleRefresh({
      compiler: overrides.compiler || this.compiler,
      reason: overrides.reason || 'manual',
      overrides,
    });
  }

  scheduleRefresh(request) {
    if (this.closed) return this.whenIdle();
    this.pending = request;
    this.setState({ pending: true, closed: false });
    if (!this.running) {
      this.idlePromise = this.drainQueue();
    }
    return this.idlePromise;
  }

  whenIdle() {
    return this.idlePromise;
  }

  whenClosed() {
    return this.closePromise || Promise.resolve();
  }

  getState() {
    return {
      ...this.state,
      service: this.state.service ? { ...this.state.service } : null,
      lastError: this.lastError,
    };
  }

  getServiceInfo() {
    return this.service?.info() || null;
  }

  async drainQueue() {
    if (this.running) return this.idlePromise;
    this.running = true;
    this.setState({ running: true });
    try {
      while (this.pending && !this.closed) {
        const request = this.pending;
        this.pending = null;
        this.setState({ pending: false });
        await this.runOnce(request);
      }
    } finally {
      this.running = false;
      this.setState({ running: false, pending: Boolean(this.pending) });
    }
    return this.lastResult;
  }

  async runOnce(request = {}) {
    const ordinal = ++this.runOrdinal;
    const generationOptions = this.generationOptions(request.compiler, request.overrides || {});
    const logInfo = loggerMethod(this.logger, 'info');
    const logWarn = loggerMethod(this.logger, 'warn');
    logInfo(`Running IronGlancer analysis for ${generationOptions.entry || 'default entry'} into ${generationOptions.outDir}`);
    this.setState({ status: 'running', lastError: null });
    try {
      const deps = await this.loadDependencies();
      this.ensureService(deps);
      const result = await deps.generateStaticSite(generationOptions);
      const serviceInfo = await this.refreshService(result.outDir);
      if (ordinal >= (this.lastResult?.ordinal || 0)) {
        this.recordSuccess({ ordinal, result, serviceInfo });
      }
      logInfo(`IronGlancer analysis complete: ${result.outDir}`);
      if (serviceInfo) {
        logInfo(`IronGlancer URLs: viewer ${serviceInfo.url} api ${serviceInfo.apiUrl} bridge ${serviceInfo.bridgeUrl}`);
      }
      return this.lastResult;
    } catch (error) {
      this.lastError = error;
      this.setState({
        status: this.lastResult ? 'stale' : 'failed',
        lastError: error,
      });
      logWarn(`IronGlancer analysis failed; keeping the last successful report and service. ${error?.message || error}`);
      return this.lastResult;
    }
  }

  async loadDependencies() {
    const deps = { ...this.dependencies };
    if (!deps.generateStaticSite) {
      deps.generateStaticSite = (await importLocal('lib/generate-static-site.js')).generateStaticSite;
    }
    if (this.serviceOptions().enabled && !deps.createStaticAnalysisRequestHandler) {
      deps.createStaticAnalysisRequestHandler = (await importLocal('lib/serve-static-site.js')).createStaticAnalysisRequestHandler;
    }
    return deps;
  }

  ensureService(deps) {
    const options = this.serviceOptions();
    if (!options.enabled) return;
    if (!this.service) {
      this.service = new ManagedStaticAnalysisService({
        options,
        logger: this.logger,
        createStaticAnalysisRequestHandler: deps.createStaticAnalysisRequestHandler,
      });
    }
  }

  generationOptions(compiler, overrides = {}) {
    const merged = { ...this.options, ...overrides };
    const rootDir = path.resolve(merged.rootDir || compiler?.context || process.cwd());
    return {
      rootDir,
      entry: merged.entry,
      outDir: resolveProjectPath(rootDir, merged.outDir, DEFAULT_OUT_DIR),
      framework: merged.framework,
      sourceRoot: merged.sourceRoot,
      aliases: normalizeAliasOptions(merged),
      routeAliases: asArray(merged.routeAliases),
      includeUnreachable: Boolean(merged.includeUnreachable),
      exclude: asArray(merged.exclude),
      sourceMode: merged.includeSource ? 'full' : (merged.sourceMode || 'none'),
      includeSource: Boolean(merged.includeSource),
      moduleLimit: merged.moduleLimit || DEFAULT_MODULE_LIMIT,
    };
  }

  serviceOptions() {
    const service = this.options.service && typeof this.options.service === 'object'
      ? this.options.service
      : {};
    const host = String(service.host ?? this.options.host ?? DEFAULT_SERVICE_HOST).trim() || DEFAULT_SERVICE_HOST;
    return {
      enabled: normalizeServiceEnabled(service.enabled ?? this.options.enabled, true),
      host,
      port: parsePort(service.port ?? this.options.port ?? DEFAULT_SERVICE_PORT, 'port'),
    };
  }

  async refreshService(outDir) {
    if (!this.service) return null;
    return this.service.refresh(outDir);
  }

  recordSuccess({ ordinal, result, serviceInfo }) {
    const urls = serviceUrls(serviceInfo);
    const savedAt = new Date().toISOString();
    this.lastResult = {
      ordinal,
      outDir: result.outDir,
      analysis: result,
      service: serviceInfo,
      viewer: serviceInfo,
      urls,
    };
    this.lastError = null;
    this.setState({
      status: 'ready',
      outDir: result.outDir,
      service: publicServiceState(serviceInfo),
      ...urls,
      lastError: null,
      lastSuccessfulAt: savedAt,
    });
  }

  setState(patch) {
    this.state = {
      ...this.state,
      ...patch,
      running: patch.running ?? this.running,
      pending: patch.pending ?? Boolean(this.pending),
      closed: patch.closed ?? this.closed,
    };
  }

  async close() {
    if (this.closePromise) return this.closePromise;
    this.closed = true;
    this.pending = null;
    this.setState({ closed: true, pending: false });
    this.closePromise = (async () => {
      await this.whenIdle();
      if (this.service) await this.service.close();
      this.service = null;
      this.setState({
        status: this.lastResult ? 'closed' : 'idle',
        service: null,
        serviceUrl: null,
        url: null,
        apiUrl: null,
        apiBaseUrl: null,
        bridgeUrl: null,
        running: false,
        pending: false,
        closed: true,
      });
    })();
    return this.closePromise;
  }
}

module.exports = IronGlancerWebpackPlugin;
module.exports.IronGlancerWebpackPlugin = IronGlancerWebpackPlugin;
