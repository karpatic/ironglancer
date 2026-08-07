#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_SERVICE_URL = 'http://127.0.0.1:4173/';
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 60000;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MODULE_DISCOVERY_PAGE_LIMIT = 200;
const MAX_MODULE_DISCOVERY_ITEMS = 100_000;
const MAX_MODULE_DISCOVERY_PAGES = Math.ceil(MAX_MODULE_DISCOVERY_ITEMS / MODULE_DISCOVERY_PAGE_LIMIT);

class AgentCliError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'AgentCliError';
    this.code = code;
    this.details = details;
  }
}

function usage() {
  return [
    'Usage: ironglancer-agent --url http://127.0.0.1:4173 <command> [options]',
    '',
    'Commands:',
    '  status                                      Discover viewer/API/bridge readiness.',
    '  discover                                    Alias for status.',
    '  search <query> [--types module,function]   Search modules, functions, symbols, and exact occurrences.',
    '  modules [--q text] [--path src/app.jsx]    List modules or query one module path.',
    '  functions [--q text] [--module-path path]  List saved static function evidence.',
    '  symbols [--q text] [--module-path path]    List saved symbol evidence.',
    '  query [--module-path path] [--symbol name] Aggregate existing API query evidence.',
    '  cleanup-evidence <folder-or-module>        Summarize static cleanup evidence without conclusions.',
    '  viewer-state                               Read the presentation bridge state.',
    '  graph-view [--layout radial] [--wait]      Queue a graph/filter presentation update.',
    '  focus-function|open-function|highlight-function|open-source [target options] [--wait]',
    '  clear-focus [--wait]                       Clear presentation focus/highlight.',
    '',
    'Global:',
    '  --url <loopback-url>                       Running IronGlancer service, API, or bridge URL.',
    '  --help                                     Show this help.',
    '',
    'Target options:',
    '  --stable-id <id> | --id <id> | --module-path <path> --name <function> [--line <n>]',
    '',
  ].join('\n');
}

function isLoopbackHost(hostname = '') {
  const host = String(hostname || '').toLowerCase();
  return host === 'localhost'
    || host.endsWith('.localhost')
    || host === '127.0.0.1'
    || host.startsWith('127.')
    || host === '::1'
    || host === '[::1]';
}

function assertLoopbackUrl(url) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AgentCliError('invalid_url', 'IronGlancer agent service URLs must use http or https.');
  }
  if (url.username || url.password) {
    throw new AgentCliError('invalid_url', 'IronGlancer agent service URLs must not include credentials.');
  }
  if (!isLoopbackHost(url.hostname)) {
    throw new AgentCliError('non_loopback_url', 'IronGlancer agent service URLs are loopback-only.');
  }
}

function normalizeServiceRoot(rawValue) {
  const raw = String(rawValue || process.env.IRONGLANCER_URL || DEFAULT_SERVICE_URL).trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new AgentCliError('invalid_url', 'Provide a valid IronGlancer service URL.');
  }
  assertLoopbackUrl(url);
  let pathname = url.pathname || '/';
  pathname = pathname.replace(/\/+$/g, '/');
  for (const marker of ['/api/v1', '/bridge/v1']) {
    const index = pathname.indexOf(marker);
    if (index !== -1) {
      pathname = pathname.slice(0, index + 1);
      break;
    }
  }
  if (!pathname.endsWith('/')) pathname += '/';
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url;
}

function serviceUrls(options = {}) {
  const root = normalizeServiceRoot(options.url);
  return {
    viewerUrl: root.href,
    apiUrl: new URL('api/v1', root).href,
    bridgeUrl: new URL('bridge/v1/', root).href,
  };
}

function parseGlobalArgs(argv) {
  const options = {};
  const rest = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--url' || arg === '--service-url') {
      options.url = argv[++index] || '';
    } else {
      rest.push(arg);
    }
  }
  return { options, command: rest[0] || '', args: rest.slice(1) };
}

function parseCommandArgs(args = {}) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (['wait', 'help'].includes(name)) {
      options[name] = true;
      continue;
    }
    options[name] = args[++index] ?? '';
  }
  return { options, positionals };
}

function parseInteger(value, defaultValue, { min, max, name }) {
  if (value == null || value === '') return defaultValue;
  if (!/^\d+$/.test(String(value))) {
    throw new AgentCliError('invalid_option', `${name} must be an integer from ${min} to ${max}.`);
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new AgentCliError('invalid_option', `${name} must be an integer from ${min} to ${max}.`);
  }
  return number;
}

function parseLimit(options) {
  return parseInteger(options.limit, DEFAULT_LIMIT, { min: 1, max: MAX_LIMIT, name: '--limit' });
}

function parseOffset(options) {
  return parseInteger(options.offset, 0, { min: 0, max: Number.MAX_SAFE_INTEGER, name: '--offset' });
}

function parseTimeout(options) {
  return parseInteger(options['timeout-ms'], DEFAULT_TIMEOUT_MS, {
    min: 100,
    max: MAX_TIMEOUT_MS,
    name: '--timeout-ms',
  });
}

function parseBooleanOption(value, name) {
  if (value == null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  throw new AgentCliError('invalid_option', `${name} must be true or false.`);
}

function normalizeModulePath(value) {
  const raw = String(value || '').replace(/\\/g, '/').trim().replace(/^\.\//, '');
  if (!raw || raw.includes('\0') || raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) {
    throw new AgentCliError('invalid_module_path', 'Module paths must be exact analyzed relative paths.');
  }
  if (raw.split('/').includes('..')) {
    throw new AgentCliError('invalid_module_path', 'Module paths must not traverse outside the analyzed run.');
  }
  return raw;
}

function pathScope(input) {
  const rawInput = String(input || '').replace(/\\/g, '/').trim();
  if (rawInput === '.' || /^\.\/+$/.test(rawInput)) {
    return {
      input: '.',
      kind: 'folder',
      pathPrefix: '',
    };
  }
  const normalized = normalizeModulePath(input).replace(/\/+$/g, '');
  if (normalized === '.') {
    return {
      input: '.',
      kind: 'folder',
      pathPrefix: '',
    };
  }
  const hasExtension = /\.[A-Za-z0-9]+$/.test(normalized.split('/').at(-1) || '');
  if (hasExtension) {
    return {
      input: normalizeModulePath(input),
      kind: 'module',
      path: normalized,
    };
  }
  return {
    input: `${normalized}/`,
    kind: 'folder',
    pathPrefix: `${normalized}/`,
  };
}

function inScope(modulePath, scope) {
  if (scope.kind === 'module') return modulePath === scope.path;
  return modulePath.startsWith(scope.pathPrefix);
}

function appendSearchParams(url, entries) {
  for (const [name, value] of entries) {
    if (value == null || value === '') continue;
    url.searchParams.set(name, String(value));
  }
  return url;
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new AgentCliError('invalid_response', `IronGlancer returned non-JSON from ${url}.`);
  }
  if (!response.ok || body.ok === false) {
    const error = body.error || {};
    throw new AgentCliError(
      error.code || 'http_error',
      error.message || `IronGlancer returned HTTP ${response.status}.`,
      { status: response.status, details: error.details },
    );
  }
  return body.data ?? body;
}

async function apiGet(urls, pathAndQuery) {
  return fetchJson(new URL(pathAndQuery.replace(/^\//, ''), urls.apiUrl.replace(/\/?$/, '/')));
}

async function bridgeGet(urls, pathAndQuery = '') {
  return fetchJson(new URL(pathAndQuery.replace(/^\//, ''), urls.bridgeUrl));
}

async function bridgePost(urls, pathName, payload) {
  return fetchJson(new URL(pathName.replace(/^\//, ''), urls.bridgeUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function readStatus(urls) {
  const [discovery, run, bridge] = await Promise.all([
    apiGet(urls, ''),
    apiGet(urls, 'run'),
    bridgeGet(urls),
  ]);
  const snapshot = run.snapshot || {
    buildId: run.buildId || null,
    sourceCodeHash: run.sourceCodeHash || null,
    generatedAt: run.generatedAt || null,
    entry: run.entry || null,
  };
  if (bridge.snapshot?.buildId && snapshot.buildId && bridge.snapshot.buildId !== snapshot.buildId) {
    throw new AgentCliError('snapshot_mismatch', 'API and bridge snapshots do not match.');
  }
  return {
    readiness: {
      ready: true,
      api: true,
      bridge: true,
    },
    service: urls,
    snapshot,
    build: {
      apiVersion: run.apiVersion || discovery.apiVersion || 'v1',
      schemaVersion: run.schemaVersion || discovery.schemaVersion || null,
      package: run.package || null,
    },
    counts: run.summary || {},
    source: run.source || {},
    boundaries: discovery.agentInterop?.boundaries || {
      analysisApi: 'read-only',
      viewerBridge: 'presentation-only',
      execution: 'no shell execution endpoint, source mutation, arbitrary file reads, or natural-language job execution',
    },
    discovery,
    bridge,
  };
}

function envelope(command, status, data) {
  return {
    ok: true,
    command,
    service: status.service,
    snapshot: status.snapshot,
    readiness: status.readiness,
    boundaries: status.boundaries,
    data,
  };
}

async function statusCommand(urls, commandName = 'status') {
  const status = await readStatus(urls);
  return {
    ok: true,
    command: commandName,
    service: status.service,
    snapshot: status.snapshot,
    readiness: status.readiness,
    build: status.build,
    counts: status.counts,
    source: status.source,
    boundaries: status.boundaries,
    data: {
      api: {
        apiVersion: status.discovery.apiVersion,
        schemaVersion: status.discovery.schemaVersion,
        routes: status.discovery.routes,
      },
      bridge: {
        bridgeVersion: status.bridge.bridgeVersion,
        commands: status.bridge.commands,
        latestState: status.bridge.latestState || null,
        commandRevision: status.bridge.commandRevision || 0,
      },
    },
  };
}

async function searchCommand(urls, args) {
  const { options, positionals } = parseCommandArgs(args);
  const query = positionals[0] || options.q || options.search;
  if (!query) throw new AgentCliError('missing_query', 'Provide a search query.');
  const url = appendSearchParams(new URL('search', urls.apiUrl.replace(/\/?$/, '/')), [
    ['q', query],
    ['types', options.types],
    ['match', options.match],
    ['modulePath', options['module-path']],
    ['limit', parseLimit(options)],
    ['offset', parseOffset(options)],
  ]);
  const status = await readStatus(urls);
  return envelope('search', status, await fetchJson(url));
}

async function listCommand(urls, args, resource) {
  const { options } = parseCommandArgs(args);
  const url = appendSearchParams(new URL(resource, urls.apiUrl.replace(/\/?$/, '/')), [
    ['q', options.q || options.search],
    ['name', options.name],
    ['modulePath', options['module-path']],
    ['limit', parseLimit(options)],
    ['offset', parseOffset(options)],
  ]);
  const status = await readStatus(urls);
  return envelope(resource, status, await fetchJson(url));
}

async function modulesCommand(urls, args) {
  const { options } = parseCommandArgs(args);
  if (options.path || options['module-path']) {
    return queryCommand(urls, ['--module-path', options.path || options['module-path']]);
  }
  return listCommand(urls, args, 'modules');
}

async function queryCommand(urls, args) {
  const { options } = parseCommandArgs(args);
  const modulePath = options['module-path'] || options.path;
  const symbol = options.symbol || options.q;
  if (!modulePath && !symbol) {
    throw new AgentCliError('missing_query', 'Provide --module-path, --path, --symbol, or --q.');
  }
  const url = appendSearchParams(new URL('query', urls.apiUrl.replace(/\/?$/, '/')), [
    ['modulePath', modulePath],
    ['symbol', symbol],
    ['limit', parseLimit(options)],
    ['offset', parseOffset(options)],
  ]);
  const status = await readStatus(urls);
  return envelope('query', status, await fetchJson(url));
}

function countBy(items, valueFor) {
  const counts = {};
  for (const item of items) {
    const key = valueFor(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function addUniqueEdge(map, edge) {
  const key = [edge.sourcePath || '', edge.targetPath || '', edge.specifier || ''].join('\0');
  if (!map.has(key)) map.set(key, edge);
}

function sameSnapshot(left, right) {
  return (left?.buildId || null) === (right?.buildId || null)
    && (left?.sourceCodeHash || null) === (right?.sourceCodeHash || null)
    && (left?.generatedAt || null) === (right?.generatedAt || null)
    && (left?.entry || null) === (right?.entry || null);
}

function integerOrNull(value) {
  return value === null || Number.isSafeInteger(value);
}

function validateModulePage(page, requestedOffset) {
  if (!page || !Array.isArray(page.items) || !page.pagination) {
    throw new AgentCliError('invalid_response', 'IronGlancer module pagination returned an incomplete response.');
  }
  const { offset, limit, total, nextOffset } = page.pagination;
  if (!Number.isSafeInteger(offset)
    || !Number.isSafeInteger(limit)
    || !Number.isSafeInteger(total)
    || !integerOrNull(nextOffset)
    || offset < 0
    || limit < 1
    || limit > MODULE_DISCOVERY_PAGE_LIMIT
    || total < 0
    || total > MAX_MODULE_DISCOVERY_ITEMS
    || offset !== requestedOffset
    || page.items.length > limit) {
    throw new AgentCliError('invalid_response', 'IronGlancer module pagination returned invalid bounds.');
  }
  return { offset, limit, total, nextOffset };
}

async function fetchAllModuleSummaries(urls) {
  const modules = [];
  const seenOffsets = new Set();
  let offset = 0;
  let expectedTotal = null;

  for (let pageIndex = 0; pageIndex < MAX_MODULE_DISCOVERY_PAGES; pageIndex += 1) {
    if (seenOffsets.has(offset)) {
      throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination did not advance.');
    }
    seenOffsets.add(offset);

    const modulesUrl = appendSearchParams(new URL('modules', urls.apiUrl.replace(/\/?$/, '/')), [
      ['limit', MODULE_DISCOVERY_PAGE_LIMIT],
      ['offset', offset],
    ]);
    const page = await fetchJson(modulesUrl);
    const pagination = validateModulePage(page, offset);
    if (expectedTotal === null) expectedTotal = pagination.total;
    if (pagination.total !== expectedTotal) {
      throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination total changed during cleanup evidence collection.');
    }
    modules.push(...page.items);
    if (modules.length > expectedTotal || modules.length > MAX_MODULE_DISCOVERY_ITEMS) {
      throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination returned more modules than declared.');
    }
    if (pagination.nextOffset === null) {
      if (modules.length !== expectedTotal) {
        throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination ended before all modules were collected.');
      }
      return modules;
    }
    if (pagination.nextOffset <= offset
      || pagination.nextOffset > expectedTotal
      || pagination.nextOffset > MAX_MODULE_DISCOVERY_ITEMS) {
      throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination returned an invalid next offset.');
    }
    offset = pagination.nextOffset;
  }

  throw new AgentCliError('pagination_incomplete', 'IronGlancer module pagination exceeded the cleanup evidence collection bound.');
}

async function cleanupEvidenceCommand(urls, args) {
  const { options, positionals } = parseCommandArgs(args);
  const scope = pathScope(positionals[0] || options.path || options['module-path'] || '');
  const limit = parseLimit(options);
  const status = await readStatus(urls);
  const allModules = await fetchAllModuleSummaries(urls);
  const matchedModules = allModules.filter((module) => inScope(module.path, scope));
  const selectedModules = matchedModules.slice(0, limit);
  const outgoingOutsideScope = new Map();
  const incomingFromOutsideScope = new Map();
  const unresolvedImports = [];
  const remoteImports = [];
  const browserIncompatibleImports = [];
  const externalImports = [];
  const functions = [];
  const findings = [];

  for (const module of selectedModules) {
    const detail = await apiGet(urls, `modules/${encodeURIComponent(module.stableId)}?include=dependencies,dependents,imports`);
    for (const dependency of detail.dependencies?.local || []) {
      if (!inScope(dependency.path, scope)) {
        addUniqueEdge(outgoingOutsideScope, { sourcePath: module.path, targetPath: dependency.path });
      }
    }
    for (const dependent of detail.dependents?.local || []) {
      if (!inScope(dependent.path, scope)) {
        addUniqueEdge(incomingFromOutsideScope, { sourcePath: dependent.path, targetPath: module.path });
      }
    }
    for (const ref of detail.imports || []) {
      const record = {
        modulePath: module.path,
        specifier: ref.specifier,
        loadKind: ref.loadKind || ref.kind,
        resolution: ref.resolution,
        targetPath: ref.localRel || null,
        unresolvedReason: ref.unresolvedReason || null,
        remoteUrl: ref.remoteUrl || null,
        nodeBuiltin: ref.nodeBuiltin || null,
      };
      if (record.resolution === 'unresolved') unresolvedImports.push(record);
      else if (record.resolution === 'remote') remoteImports.push(record);
      else if (record.resolution === 'browser-incompatible') browserIncompatibleImports.push(record);
      else if (record.resolution === 'external') externalImports.push(record);
    }

    const moduleFunctions = await apiGet(
      urls,
      `modules/${encodeURIComponent(module.stableId)}/functions?detail=summary&limit=200`,
    );
    functions.push(...moduleFunctions.functions);

    const moduleFindings = await apiGet(
      urls,
      `findings?modulePath=${encodeURIComponent(module.path)}&limit=200`,
    );
    findings.push(...moduleFindings.items.map((finding) => ({ modulePath: module.path, ...finding })));
  }

  const latestStatus = await readStatus(urls);
  if (!sameSnapshot(status.snapshot, latestStatus.snapshot)) {
    throw new AgentCliError('snapshot_mismatch', 'API snapshot changed while collecting cleanup evidence.');
  }

  return envelope('cleanup-evidence', status, {
    scope,
    truncated: matchedModules.length > selectedModules.length,
    evidence: {
      modules: {
        total: matchedModules.length,
        returned: selectedModules.length,
        lines: selectedModules.reduce((total, module) => total + (module.lineCount || 0), 0),
        items: selectedModules.map((module) => ({
          stableId: module.stableId,
          path: module.path,
          lineCount: module.lineCount,
          reachable: module.reachable,
          dependencyCount: module.dependencyCount,
          dependentCount: module.dependentCount,
          functionCount: module.functionCount,
          sourceAvailable: module.sourceAvailable,
        })),
      },
      dependencies: {
        outgoingOutsideScope: Array.from(outgoingOutsideScope.values()),
        incomingFromOutsideScope: Array.from(incomingFromOutsideScope.values()),
      },
      imports: {
        unresolved: unresolvedImports,
        remote: remoteImports,
        browserIncompatible: browserIncompatibleImports,
        external: externalImports,
      },
      functions: {
        total: functions.length,
        exported: functions.filter((fn) => fn.exported).length,
        components: functions.filter((fn) => fn.component).length,
        privateZeroUsers: functions
          .filter((fn) => fn.exported === false && fn.standalone === true && fn.userCount === 0)
          .map((fn) => ({
            stableId: fn.stableId,
            modulePath: fn.modulePath,
            name: fn.name,
            lineCount: fn.lineCount,
            dependencyCount: fn.dependencyCount,
            userCount: fn.userCount,
            placementAssessment: fn.placementAssessment,
          })),
        placementAssessmentCounts: countBy(functions, (fn) => fn.placementAssessment),
      },
      findings: {
        total: findings.length,
        items: findings.slice(0, 50),
      },
    },
    semantics: 'Cleanup evidence is existing static evidence only. It does not infer intent, ownership, dead code, runtime behavior, or whether cleanup is safe.',
    bounds: {
      requestedModuleLimit: limit,
      maximumModuleLimit: MAX_LIMIT,
      selectedModuleCount: selectedModules.length,
    },
  });
}

function targetCommandFields(options) {
  const command = {};
  if (options['stable-id']) command.targetStableId = options['stable-id'];
  if (options['target-stable-id']) command.targetStableId = options['target-stable-id'];
  if (options['function-stable-id']) command.functionStableId = options['function-stable-id'];
  if (options.id) command.targetId = options.id;
  if (options['target-id']) command.targetId = options['target-id'];
  if (options['function-id']) command.functionId = options['function-id'];
  if (options['module-path']) command.modulePath = options['module-path'];
  if (options.name) command.name = options.name;
  if (options['function-name']) command.functionName = options['function-name'];
  if (options.line) command.startLine = parseInteger(options.line, null, { min: 1, max: Number.MAX_SAFE_INTEGER, name: '--line' });
  if (options['start-line']) {
    command.startLine = parseInteger(options['start-line'], null, {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      name: '--start-line',
    });
  }
  return command;
}

function graphCommandFields(options) {
  const command = {};
  if (options['primary-view']) command.primaryView = options['primary-view'];
  if (options.layout) command.layout = options.layout;
  if (options.scope) command.scope = options.scope;
  if (options.depth) command.depth = options.depth;
  const showFiles = parseBooleanOption(options['show-files'], '--show-files');
  const showFunctions = parseBooleanOption(options['show-functions'], '--show-functions');
  const showJsx = parseBooleanOption(options['show-jsx'], '--show-jsx');
  const showJs = parseBooleanOption(options['show-js'], '--show-js');
  if (showFiles !== null) command.showFiles = showFiles;
  if (showFunctions !== null) command.showFunctions = showFunctions;
  if (showJsx !== null) command.showJsx = showJsx;
  if (showJs !== null) command.showJs = showJs;
  if (options['source-file-types']) {
    command.sourceFileTypes = options['source-file-types']
      .split(/[,+\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return command;
}

function commandNameToBridgeType(commandName) {
  return {
    'graph-view': 'setGraphView',
    'focus-function': 'focusFunction',
    'open-function': 'openFunction',
    'highlight-function': 'highlightFunction',
    'open-source': 'openSource',
    'clear-focus': 'clearHighlight',
  }[commandName];
}

function sourceTypesMatch(expectedValues, actual = {}) {
  if (!Array.isArray(expectedValues) || expectedValues.length === 0) return true;
  const expected = new Set(expectedValues.map((value) => String(value).toLowerCase()));
  return Array.from(expected).every((value) => actual[value] === true);
}

function verifyAppliedState(command, latestState) {
  if (!latestState) {
    throw new AgentCliError('verification_failed', 'The bridge acknowledged the command but has no viewer state.');
  }
  if (command.type === 'setGraphView') {
    const graph = latestState.graph || {};
    const mismatches = [];
    if (command.primaryView && latestState.primaryView !== command.primaryView && graph.primaryView !== command.primaryView) {
      mismatches.push('primaryView');
    }
    if (command.layout && graph.layout !== command.layout) mismatches.push('layout');
    if (command.scope && graph.scope !== command.scope) mismatches.push('scope');
    if (command.depth && String(graph.depth) !== String(command.depth)) mismatches.push('depth');
    if (command.sourceFileTypes && !sourceTypesMatch(command.sourceFileTypes, graph.sourceFileTypes)) {
      mismatches.push('sourceFileTypes');
    }
    if (mismatches.length > 0) {
      throw new AgentCliError('verification_failed', 'Viewer state did not reflect the acknowledged graph command.', {
        mismatches,
      });
    }
  }
}

async function waitForAcknowledgement(urls, command, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await bridgeGet(urls, 'state');
    const ack = (state.acknowledgements || []).find((item) => item.commandId === command.commandId);
    if (ack) {
      if (ack.status !== 'applied') {
        throw new AgentCliError('viewer_command_failed', ack.message || 'Viewer reported that the command was not applied.');
      }
      verifyAppliedState(command.command, state.latestState);
      return {
        acknowledgement: ack,
        latestState: state.latestState || null,
        commandRevision: state.commandRevision,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new AgentCliError('ack_timeout', 'Timed out waiting for the viewer to acknowledge the bridge command.');
}

async function viewerStateCommand(urls) {
  const status = await readStatus(urls);
  return envelope('viewer-state', status, await bridgeGet(urls, 'state'));
}

async function presentationCommand(urls, args, commandName) {
  const { options } = parseCommandArgs(args);
  const type = commandNameToBridgeType(commandName);
  if (!type) throw new AgentCliError('unknown_command', `Unknown agent command: ${commandName}`);
  const status = await readStatus(urls);
  const command = {
    type,
    ...(type === 'setGraphView' ? graphCommandFields(options) : targetCommandFields(options)),
  };
  const queued = await bridgePost(urls, 'commands', {
    snapshot: status.snapshot,
    command,
  });
  const record = queued.command;
  let verified = null;
  let acknowledgement = null;
  if (options.wait) {
    verified = await waitForAcknowledgement(urls, record, parseTimeout(options));
    acknowledgement = verified.acknowledgement;
  }
  return envelope(commandName, status, {
    command: record,
    acknowledgement,
    verified,
  });
}

async function dispatch(command, args, urls) {
  if (!command || command === 'status') return statusCommand(urls, 'status');
  if (command === 'discover') return statusCommand(urls, 'discover');
  if (command === 'search') return searchCommand(urls, args);
  if (command === 'modules') return modulesCommand(urls, args);
  if (command === 'functions') return listCommand(urls, args, 'functions');
  if (command === 'symbols') return listCommand(urls, args, 'symbols');
  if (command === 'query') return queryCommand(urls, args);
  if (command === 'cleanup-evidence') return cleanupEvidenceCommand(urls, args);
  if (command === 'viewer-state') return viewerStateCommand(urls);
  if (commandNameToBridgeType(command)) return presentationCommand(urls, args, command);
  throw new AgentCliError('unknown_command', `Unknown agent command: ${command}`);
}

async function writeStream(stream, text) {
  await new Promise((resolve, reject) => {
    stream.write(text, (error) => (error ? reject(error) : resolve()));
  });
}

export async function runAgentCli(argv = process.argv.slice(2), {
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const { options, command, args } = parseGlobalArgs(argv);
  if (options.help || command === 'help') {
    await writeStream(stdout, usage());
    return 0;
  }
  try {
    const payload = await dispatch(command, args, serviceUrls(options));
    await writeStream(stdout, `${JSON.stringify(payload, null, 2)}\n`);
    return 0;
  } catch (error) {
    const code = error?.code || 'agent_error';
    const payload = {
      ok: false,
      command: command || null,
      error: {
        code,
        message: error?.message || String(error),
        ...(error?.details === undefined ? {} : { details: error.details }),
      },
    };
    await writeStream(stdout, `${JSON.stringify(payload, null, 2)}\n`);
    await writeStream(stderr, `${payload.error.message}\n`);
    return 1;
  }
}

const isMain = process.argv[1]
  && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;

if (isMain) {
  runAgentCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
