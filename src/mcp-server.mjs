#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadStaticAnalysisRun } from './lib/serve-static-site.js';

const require = createRequire(import.meta.url);
const packageMeta = require('../package.json');
const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'ironglancer-mcp';
const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:4173/bridge/v1/';

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    analysisDir: process.env.IRONGLANCER_ANALYSIS_DIR || process.cwd(),
    bridgeUrl: process.env.IRONGLANCER_BRIDGE_URL || '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--analysis-dir' || arg === '--out-dir') {
      options.analysisDir = argv[++index] || options.analysisDir;
    } else if (arg === '--bridge-url') {
      options.bridgeUrl = argv[++index] || options.bridgeUrl;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  return options;
}

function usage() {
  return [
    'Usage: ironglancer-mcp --analysis-dir ./docs/analysis [--bridge-url http://127.0.0.1:4173/bridge/v1]',
    '',
    'Environment:',
    '  IRONGLANCER_ANALYSIS_DIR   Generated IronGlancer output directory.',
    '  IRONGLANCER_BRIDGE_URL     Optional running viewer bridge URL.',
    '',
  ].join('\n');
}

function jsonText(value) {
  return JSON.stringify(value, null, 2);
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function compactFunction(index, node) {
  const evidence = node.placement?.evidence || {};
  return {
    id: node.id,
    stableId: node.stableId,
    modulePath: node.modulePath,
    name: node.name,
    kind: node.kind,
    component: Boolean(node.component),
    exported: Boolean(node.exported),
    reachable: node.reachable,
    startLine: node.startLine,
    endLine: node.endLine,
    lineCount: node.lineCount,
    dependencyCount: (index.dependenciesByFunctionId.get(node.id) || []).length,
    userCount: (index.usersByFunctionId.get(node.id) || []).length,
    placementAssessment: node.placement?.assessment?.assessment || null,
    placementConfidence: node.placement?.assessment?.confidence || null,
    sameFileCalleeCount: evidence.sameFileCalleeCount || 0,
    projectLocalCalleeCount: evidence.projectLocalCalleeCount || 0,
    sameFileCallerCount: evidence.sameFileCallerCount || 0,
    projectLocalCallerCount: evidence.projectLocalCallerCount || 0,
  };
}

function edgeSummary(index, edge) {
  const source = index.functionById.get(edge.sourceId);
  const target = index.functionById.get(edge.targetId);
  return {
    id: edge.id,
    stableId: edge.stableId,
    scope: edge.scope,
    relationKind: edge.relationKind,
    syntaxKinds: edge.syntaxKinds,
    usageLines: edge.usageLines,
    referenceCount: edge.referenceCount,
    source: source ? compactFunction(index, source) : null,
    target: target ? compactFunction(index, target) : null,
    ...(edge.import ? { import: edge.import } : {}),
  };
}

function resolveFunction(index, args = {}) {
  const id = String(args.id || args.functionId || '').trim();
  const stableId = String(args.stableId || args.functionStableId || '').trim();
  if (id) {
    const node = index.functionById.get(id) || index.functionByStableId.get(id);
    if (node) return node;
  }
  if (stableId) {
    const node = index.functionByStableId.get(stableId) || index.functionById.get(stableId);
    if (node) return node;
  }
  const name = String(args.name || args.functionName || '').trim();
  const modulePath = String(args.modulePath || '').trim();
  if (!name) throw new Error('Provide id, stableId, or name.');
  const matches = index.functions.filter((node) => (
    node.name === name
    && (!modulePath || node.modulePath === modulePath)
  ));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Function name "${name}" is ambiguous; provide modulePath or stableId.`);
  throw new Error('No saved function declaration matched.');
}

function sourceExcerpt(index, node, contextLines = 4) {
  const sourceModule = index.sourceModuleByPath.get(node.modulePath);
  if (!sourceModule) return null;
  const lines = sourceModule.code.split(/\r\n|\r|\n/);
  const startLine = Math.max(1, (node.startLine || 1) - contextLines);
  const endLine = Math.min(lines.length, (node.endLine || node.startLine || 1) + contextLines);
  return {
    modulePath: node.modulePath,
    startLine,
    endLine,
    lines: lines.slice(startLine - 1, endLine).map((text, offset) => ({
      line: startLine + offset,
      text,
    })),
  };
}

function runSummary({ outDir, index }) {
  const meta = index.output?.meta || {};
  return {
    outDir,
    apiVersion: meta.apiVersion || 'v1',
    schemaVersion: meta.schemaVersion || null,
    package: {
      name: meta.packageName || 'ironglancer',
      version: meta.version || null,
    },
    generatedAt: meta.generatedAt || null,
    buildId: meta.buildId || null,
    sourceCodeHash: meta.sourceCodeHash || null,
    rootDir: meta.rootDir || index.output.rootDir || null,
    entry: meta.entry || index.output.entry || null,
    summary: index.output.summary || {},
    counts: {
      modules: index.modules.length,
      functions: index.functions.length,
      functionEdges: index.functionEdges.length,
      symbols: index.symbols.length,
    },
    staticAnalysis: {
      functionDependencies: index.functionLimitations,
    },
  };
}

function searchFunctions({ index }, args = {}) {
  const q = lower(args.q || args.search || '');
  const modulePath = String(args.modulePath || '').trim();
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 25));
  const items = index.functions
    .filter((node) => !q || [node.name, node.declarationName, node.modulePath]
      .some((value) => lower(value).includes(q)))
    .filter((node) => !modulePath || node.modulePath === modulePath)
    .slice(0, limit)
    .map((node) => compactFunction(index, node));
  return { q, modulePath: modulePath || null, items, totalReturned: items.length };
}

function getFunction({ index }, args = {}) {
  const node = resolveFunction(index, args);
  return {
    function: compactFunction(index, node),
    placement: node.placement || null,
    dependencies: (index.dependenciesByFunctionId.get(node.id) || []).map((edge) => edgeSummary(index, edge)),
    users: (index.usersByFunctionId.get(node.id) || []).map((edge) => edgeSummary(index, edge)),
    source: sourceExcerpt(index, node, Number(args.contextLines) || 4),
    staticAnalysis: {
      functionDependencies: index.functionLimitations,
      placement: 'Static placement evidence is deterministic review context, not runtime ownership proof or definitive dead-code detection.',
    },
  };
}

function getSource({ index }, args = {}) {
  const modulePath = String(args.modulePath || args.path || '').trim();
  if (!modulePath) throw new Error('Provide modulePath.');
  const sourceModule = index.sourceModuleByPath.get(modulePath);
  if (!sourceModule) throw new Error(`Saved source is not available for ${modulePath}.`);
  const lines = sourceModule.code.split(/\r\n|\r|\n/);
  const startLine = Math.max(1, Number(args.startLine) || 1);
  const endLine = Math.min(lines.length, Math.max(startLine, Number(args.endLine) || startLine + 40));
  return {
    modulePath,
    startLine,
    endLine,
    lines: lines.slice(startLine - 1, endLine).map((text, offset) => ({
      line: startLine + offset,
      text,
    })),
  };
}

function bridgeUrlFor(options, args = {}) {
  return String(args.bridgeUrl || options.bridgeUrl || DEFAULT_BRIDGE_URL).replace(/\/?$/, '/');
}

async function fetchBridgeJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Viewer bridge returned HTTP ${response.status}.`);
  }
  return body.data || body;
}

async function viewerState(options, args = {}) {
  const bridgeUrl = bridgeUrlFor(options, args);
  return fetchBridgeJson(new URL('state', bridgeUrl));
}

async function viewerCommand(options, args = {}) {
  const bridgeUrl = bridgeUrlFor(options, args);
  const command = {
    type: args.type || args.command,
    targetStableId: args.targetStableId || args.functionStableId,
    targetId: args.targetId || args.functionId,
    modulePath: args.modulePath,
    name: args.name || args.functionName,
    startLine: args.startLine || args.line,
  };
  return fetchBridgeJson(new URL('commands', bridgeUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command }),
  });
}

const tools = [
  {
    name: 'ironglancer_run_summary',
    description: 'Return immutable IronGlancer run metadata and saved analysis counts.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'ironglancer_search_functions',
    description: 'Search saved function declarations and include compact placement assessment fields.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        q: { type: 'string' },
        search: { type: 'string' },
        modulePath: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'ironglancer_get_function',
    description: 'Return one saved function with placement evidence, static dependencies/users, and a source excerpt.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        functionId: { type: 'string' },
        functionStableId: { type: 'string' },
        name: { type: 'string' },
        modulePath: { type: 'string' },
        contextLines: { type: 'integer', minimum: 0, maximum: 40 },
      },
    },
  },
  {
    name: 'ironglancer_investigate_function_placement',
    description: 'Return focused function-placement/cohesion evidence for a saved function.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        stableId: { type: 'string' },
        name: { type: 'string' },
        modulePath: { type: 'string' },
      },
    },
  },
  {
    name: 'ironglancer_source_excerpt',
    description: 'Return a bounded excerpt from saved analyzed source.',
    inputSchema: {
      type: 'object',
      required: ['modulePath'],
      additionalProperties: false,
      properties: {
        modulePath: { type: 'string' },
        startLine: { type: 'integer', minimum: 1 },
        endLine: { type: 'integer', minimum: 1 },
      },
    },
  },
  {
    name: 'ironglancer_viewer_state',
    description: 'Read optional structured state from a running localhost IronGlancer viewer bridge.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        bridgeUrl: { type: 'string' },
      },
    },
  },
  {
    name: 'ironglancer_viewer_command',
    description: 'Queue a presentation-only command for a running IronGlancer viewer bridge.',
    inputSchema: {
      type: 'object',
      required: ['type'],
      additionalProperties: false,
      properties: {
        bridgeUrl: { type: 'string' },
        type: { enum: ['focusFunction', 'openFunction', 'openSource', 'highlightFunction', 'scrollToFunction', 'clearHighlight'] },
        targetStableId: { type: 'string' },
        targetId: { type: 'string' },
        functionStableId: { type: 'string' },
        functionId: { type: 'string' },
        modulePath: { type: 'string' },
        name: { type: 'string' },
        startLine: { type: 'integer', minimum: 1 },
      },
    },
  },
];

function contentResult(value) {
  return {
    content: [{ type: 'text', text: jsonText(value) }],
  };
}

function errorResult(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: error?.message || String(error) }],
  };
}

function createServer(options) {
  let runPromise = null;
  const getRun = () => {
    if (!runPromise) {
      runPromise = loadStaticAnalysisRun({ outDir: path.resolve(options.analysisDir) });
    }
    return runPromise;
  };

  const callTool = async (name, args = {}) => {
    if (name === 'ironglancer_viewer_state') return viewerState(options, args);
    if (name === 'ironglancer_viewer_command') return viewerCommand(options, args);

    const run = await getRun();
    if (name === 'ironglancer_run_summary') return runSummary(run);
    if (name === 'ironglancer_search_functions') return searchFunctions(run, args);
    if (name === 'ironglancer_get_function') return getFunction(run, args);
    if (name === 'ironglancer_investigate_function_placement') {
      const payload = getFunction(run, args);
      return {
        function: payload.function,
        placement: payload.placement,
        staticAnalysis: payload.staticAnalysis,
      };
    }
    if (name === 'ironglancer_source_excerpt') return getSource(run, args);
    throw new Error(`Unknown tool: ${name}`);
  };

  return {
    async handle(message) {
      if (!message || typeof message !== 'object') return null;
      const id = message.id;
      const method = String(message.method || '');
      if (!id && method.startsWith('notifications/')) return null;
      try {
        if (method === 'initialize') {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: message.params?.protocolVersion || MCP_PROTOCOL_VERSION,
              capabilities: { tools: {} },
              serverInfo: { name: SERVER_NAME, version: packageMeta.version || 'unknown' },
            },
          };
        }
        if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
        if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools } };
        if (method === 'tools/call') {
          const result = await callTool(message.params?.name, message.params?.arguments || {});
          return { jsonrpc: '2.0', id, result: contentResult(result) };
        }
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
      } catch (error) {
        if (method === 'tools/call') return { jsonrpc: '2.0', id, result: errorResult(error) };
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: error?.message || String(error) },
        };
      }
    },
  };
}

function writeMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`);
}

function headerEndIndex(buffer) {
  return buffer.indexOf('\r\n\r\n');
}

function contentLengthFromHeader(header) {
  const match = header.match(/content-length:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function runStdioServer(options) {
  const server = createServer(options);
  let buffer = Buffer.alloc(0);
  process.stdin.on('data', async (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const end = headerEndIndex(buffer);
      if (end === -1) return;
      const header = buffer.slice(0, end).toString('utf8');
      const length = contentLengthFromHeader(header);
      if (!Number.isInteger(length)) {
        buffer = Buffer.alloc(0);
        return;
      }
      const bodyStart = end + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) return;
      const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
      buffer = buffer.slice(bodyEnd);
      try {
        const response = await server.handle(JSON.parse(body));
        if (response) writeMessage(response);
      } catch (error) {
        writeMessage({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: error?.message || String(error) },
        });
      }
    }
  });
}

const options = parseArgs();
if (options.help) {
  process.stdout.write(usage());
} else {
  const isMain = process.argv[1]
    && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
  if (isMain) runStdioServer(options);
}
