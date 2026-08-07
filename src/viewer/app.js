import mermaid from './vendor/mermaid.esm.min.mjs';

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default', flowchart: { htmlLabels: false } });

const svgNamespace = 'http://www.w3.org/2000/svg';
const filePalette = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#4d7c0f',
  '#c2410c',
  '#0f766e',
  '#475569',
  '#a21caf',
];
const relationFilters = [
  { id: 'all', label: 'All' },
  { id: 'used-by', label: 'Used by' },
  { id: 'uses', label: 'Uses' },
  { id: 'same-file', label: 'Same file' },
  { id: 'other-files', label: 'Other files' },
  { id: 'browser-library', label: 'Browser/library' },
  { id: 'couldnt-trace', label: "Couldn't trace" },
];
const primaryViewStorageKey = 'ironglancer:primary-visualization-view';
const primaryViewModes = [
  { id: 'jsx-map', label: 'Components', accessibilityLabel: 'Component/module map' },
  { id: 'function-graphs', label: 'Functions (advanced)', accessibilityLabel: 'Advanced function graph' },
];
const networkLayoutModeStorageKey = 'ironglancer:function-network-layout';
const networkLayoutModes = [
  { id: 'network', label: 'Network', statusLabel: 'Network graph' },
  { id: 'radial', label: 'Radial', statusLabel: 'Radial network graph' },
  { id: 'by-file', label: 'By file', statusLabel: 'By file' },
];
const networkLayoutModeAliases = new Map([
  ['force', 'network'],
  ['flow', 'radial'],
]);
const networkNodeVisibilityStorageKey = 'ironglancer:function-network-node-levels';
const networkNodeModes = [
  { id: 'files', label: 'Files', accessibilityLabel: 'Show file nodes' },
  { id: 'functions', label: 'Functions', accessibilityLabel: 'Show function nodes' },
];
const networkSourceFileTypeStorageKey = 'ironglancer:function-network-source-file-types';
const networkSourceFileTypeModes = [
  { id: 'jsx', label: 'JSX', accessibilityLabel: 'Show .jsx source files in the function graph' },
  { id: 'js', label: 'JS', accessibilityLabel: 'Show .js and .mjs source files in the function graph' },
];
const networkScopeStorageKey = 'ironglancer:function-network-scope';
const legacyNetworkDirectionStorageKey = 'ironglancer:function-network-direction';
const networkDepthStorageKey = 'ironglancer:function-network-depth';
const legacyNetworkHopsStorageKey = 'ironglancer:function-network-hops';
const networkScopeModes = [
  { id: 'full', label: 'Full', accessibilityLabel: 'Show the full function graph', statusLabel: 'Full scope' },
  { id: 'dependencies', label: 'Dependencies', accessibilityLabel: 'Show selected node dependencies', statusLabel: 'Dependencies' },
  { id: 'parents', label: 'Parents', accessibilityLabel: 'Show selected node parents and users', statusLabel: 'Parents' },
  { id: 'both', label: 'Both', accessibilityLabel: 'Show selected node dependencies and parents', statusLabel: 'Dependencies + parents' },
];
const networkScopeAliases = new Map([
  ['uses', 'dependencies'],
  ['used-by', 'parents'],
]);
const networkDepthModes = [
  { id: '1', label: '1', statusLabel: 'Depth 1', accessibilityLabel: 'Show one graph hop from the selected node' },
  { id: '2', label: '2', statusLabel: 'Depth 2', accessibilityLabel: 'Show two graph hops from the selected node' },
  { id: '3', label: '3', statusLabel: 'Depth 3', accessibilityLabel: 'Show three graph hops from the selected node' },
  { id: 'all', label: 'All', statusLabel: 'All depths', accessibilityLabel: 'Show all graph hops from the selected node' },
];

const subtitleEl = document.getElementById('subtitle');
const buildMetaEl = document.getElementById('build-meta');
const agentPanelEl = document.getElementById('agent-panel');
const agentConnectionEl = document.getElementById('agent-connection');
const agentContextEl = document.getElementById('agent-context');
const agentLastResultEl = document.getElementById('agent-last-result');
const statsEl = document.getElementById('stats');
const jsxTreeEl = document.getElementById('jsx-tree');
const treeEl = document.getElementById('tree');
const mermaidEl = document.getElementById('mermaid');
const componentsListEl = document.getElementById('components-list');
const routesListEl = document.getElementById('routes-list');
const lazyBoundariesListEl = document.getElementById('lazy-boundaries-list');
const assetsListEl = document.getElementById('assets-list');
const findingsListEl = document.getElementById('findings-list');
const copyJsxTreeBtn = document.getElementById('copy-jsx-tree-btn');
const copyTreeBtn = document.getElementById('copy-tree-btn');
const copyMermaidSourceBtn = document.getElementById('copy-mermaid-source-btn');
const copyJsxTreeStatusEl = document.getElementById('copy-jsx-tree-status');
const copyTreeStatusEl = document.getElementById('copy-tree-status');
const copyMermaidSourceStatusEl = document.getElementById('copy-mermaid-source-status');
const moduleDiagramEl = document.getElementById('module-diagram');
const moduleDiagramViewportEl = document.getElementById('module-diagram-viewport');
const moduleDiagramZoomStatusEl = document.getElementById('module-diagram-zoom-status');
const moduleDiagramZoomInBtn = document.getElementById('module-diagram-zoom-in-btn');
const moduleDiagramZoomOutBtn = document.getElementById('module-diagram-zoom-out-btn');
const moduleDiagramFitBtn = document.getElementById('module-diagram-fit-btn');
const moduleDiagramResetViewBtn = document.getElementById('module-diagram-reset-view-btn');
const selectedImportEl = document.getElementById('selected-import');
const downloadBtn = document.getElementById('download-svg-btn');
const networkStatusEl = document.getElementById('network-status');
const primaryViewSwitchEl = document.getElementById('primary-view-switch');
const functionGraphsViewEl = document.getElementById('function-graphs-view');
const jsxMapViewEl = document.getElementById('jsx-map-view');
const networkViewportEl = document.getElementById('function-network-viewport');
const networkSvgEl = document.getElementById('function-network-svg');
const networkZoomStatusEl = document.getElementById('network-zoom-status');
const networkZoomInBtn = document.getElementById('network-zoom-in-btn');
const networkZoomOutBtn = document.getElementById('network-zoom-out-btn');
const networkFitBtn = document.getElementById('network-fit-btn');
const networkResetViewBtn = document.getElementById('network-reset-view-btn');
const networkResetSelectionBtn = document.getElementById('network-reset-selection-btn');
const networkLayoutSwitchEl = document.getElementById('network-layout-switch');
const networkNodeSwitchEl = document.getElementById('network-node-switch');
const networkSourceSwitchEl = document.getElementById('network-source-switch');
const networkScopeSwitchEl = document.getElementById('network-scope-switch');
const networkDepthSwitchEl = document.getElementById('network-depth-switch');
const networkHelpEl = document.getElementById('function-network-help');
const fileLegendEl = document.getElementById('file-legend');
const selectedTitleEl = document.getElementById('selected-title');
const selectedFunctionEl = document.getElementById('selected-function');
const sourceDialogEl = document.getElementById('source-dialog');
const sourceDialogBodyEl = sourceDialogEl.querySelector('.source-dialog-body');
const sourceDialogTitleEl = document.getElementById('source-dialog-title');
const sourceDialogPathEl = document.getElementById('source-dialog-path');
const sourceDialogInsightEl = document.getElementById('source-dialog-insight');
const sourceDialogNeighborhoodEl = document.getElementById('source-dialog-neighborhood');
const sourceDialogConnectionsEl = document.getElementById('source-dialog-connections');
const sourceDialogConnectionsSummaryEl = document.getElementById('source-dialog-connections-summary');
const sourceDialogRelationshipsEl = document.getElementById('source-dialog-relationships');
const sourceDialogCodeEl = document.getElementById('source-dialog-code');
const sourceDialogPreviousBtn = document.getElementById('source-dialog-previous');
const sourceDialogNextBtn = document.getElementById('source-dialog-next');
const sourceDialogCloseBtn = document.getElementById('source-dialog-close');

let outputPayload = null;
let sourcePayload = null;
let moduleSourcePayload = null;
let functionMapPayload = { limitations: [], functions: [], edges: [] };
let latestModuleSvg = '';
let functions = [];
let edges = [];
let fileNodes = [];
let outputModuleByPath = new Map();
let functionById = new Map();
let functionByStableId = new Map();
let fileByPath = new Map();
let moduleSourceByPath = new Map();
let edgesBySourceId = new Map();
let edgesByTargetId = new Map();
let fileEdges = [];
let fileEdgesBySourcePath = new Map();
let fileEdgesByTargetPath = new Map();
let functionIdsByFile = new Map();
let declarationsByFunctionId = new Map();
let declarationsByFunctionStableId = new Map();
let declarationsByModule = new Map();
let declarationsByModuleIdAndName = new Map();
let fileColorByPath = new Map();
let networkLayout = null;
let networkZoom = 1;
let networkBaseWidth = 0;
let networkBaseHeight = 0;
let networkDragState = null;
let networkPinchState = null;
const activePointers = new Map();
let moduleDiagramSvgEl = null;
let moduleDiagramZoom = 1;
let moduleDiagramBaseWidth = 0;
let moduleDiagramBaseHeight = 0;
let moduleDiagramDragState = null;
let moduleDiagramPinchState = null;
const moduleDiagramPointers = new Map();
let expandedImportEdge = null;
let sourceMemberTargetCounter = 0;
let sourceMemberTargets = new Map();
let highlightedSourceRecord = null;
let selectedFunctionId = '';
let selectedFilePath = '';
let activeRelationFilter = 'all';
let activePrimaryView = 'jsx-map';
let activeNetworkLayoutMode = 'network';
let activeNetworkNodeVisibility = { files: false, functions: true };
let activeNetworkSourceFileTypes = { jsx: true, js: false };
let activeNetworkScope = 'full';
let activeNetworkDepth = '1';
let visibleNetworkGraph = null;
let latestFunctionGraphStatus = '';
let networkNeedsFit = true;
let moduleDiagramNeedsFit = true;
let sourceDialogState = { functionId: '', declaration: null, modulePath: '', group: [], index: -1 };
let sourceDialogRestoreFocusEl = null;
let viewerBridge = emptyViewerBridge();
const sourceMetricsSuffixPattern = /\s+\[lines:\s*\d+\s*\|\s*refs:\s*\d+\s*\|\s*importers:\s*\d+\]\s*$/i;

function emptyViewerBridge() {
  return {
    enabled: false,
    url: '',
    clientId: '',
    stateRevision: 0,
    commandRevision: 0,
    snapshot: null,
    lastCommand: null,
    lastResult: null,
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== '') element.textContent = text;
  return element;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(svgNamespace, tagName);
  for (const [key, value] of Object.entries(attributes)) {
    if (value == null) continue;
    element.setAttribute(key, String(value));
  }
  return element;
}

function compactCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : 0;
}

function plural(count, singular, pluralLabel = singular + 's') {
  return count === 1 ? singular : pluralLabel;
}

function sortFunctions(a, b) {
  return String(a.modulePath || '').localeCompare(String(b.modulePath || ''))
    || compactCount(a.startLine) - compactCount(b.startLine)
    || compactCount(a.endLine) - compactCount(b.endLine)
    || String(a.name || '').localeCompare(String(b.name || ''))
    || String(a.id || '').localeCompare(String(b.id || ''));
}

function sortEdges(a, b) {
  return String(a.sourceModulePath || '').localeCompare(String(b.sourceModulePath || ''))
    || compactCount(a.sourceStartLine) - compactCount(b.sourceStartLine)
    || String(a.targetModulePath || '').localeCompare(String(b.targetModulePath || ''))
    || compactCount(a.targetStartLine) - compactCount(b.targetStartLine)
    || String(a.id || '').localeCompare(String(b.id || ''));
}

function displayName(node = {}) {
  return String(node.name || node.declarationName || 'anonymous').trim() || 'anonymous';
}

function callableLabel(value) {
  const name = String(value || '').trim();
  return name ? name + '()' : 'anonymous()';
}

function shortLabel(value, maxLength = 18) {
  const raw = String(value || '').trim();
  if (raw.length <= maxLength) return raw;
  return raw.slice(0, Math.max(4, maxLength - 1)) + '...';
}

function fileName(modulePath = '') {
  return String(modulePath || '').split('/').filter(Boolean).at(-1) || String(modulePath || 'unknown');
}

function sourceFileTypeForPath(modulePath = '') {
  const lowerPath = String(modulePath || '').toLowerCase();
  if (lowerPath.endsWith('.jsx')) return 'jsx';
  if (lowerPath.endsWith('.js') || lowerPath.endsWith('.mjs')) return 'js';
  return '';
}

function lineRange(record = {}) {
  const start = record.startLine || record.declarationLine || '?';
  const end = record.endLine || start;
  return start === end ? 'L' + start : 'L' + start + '-' + end;
}

function lineCountFor(record = {}) {
  return compactCount(record.lineCount)
    || (compactCount(record.endLine) && compactCount(record.startLine)
      ? Math.max(1, record.endLine - record.startLine + 1)
      : 0);
}

function functionKindLabel(node = {}) {
  if (node.component) return 'Screen piece';
  if (node.kind === 'arrow') return 'Function value';
  return 'Function';
}

function usageLineText(lines) {
  const normalized = safeArray(lines)
    .map((line) => Number(line))
    .filter((line) => Number.isInteger(line) && line > 0)
    .slice(0, 4);
  return normalized.length > 0 ? 'L' + normalized.join(', ') : '';
}

function syntaxLabel(syntaxKinds) {
  return safeArray(syntaxKinds)
    .map((kind) => String(kind || '').replace(/-/g, ' '))
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

function formatBuildMeta(metadata = {}) {
  const version = metadata.version || 'unknown';
  const generatedAtRaw = metadata.generatedAt || '';
  const generatedAt = generatedAtRaw ? new Date(generatedAtRaw) : null;
  const generatedLabel = generatedAt && !Number.isNaN(generatedAt.valueOf())
    ? generatedAt.toLocaleString()
    : (generatedAtRaw || 'unknown time');
  return 'Built ' + generatedLabel + '  |  v' + version;
}

async function loadJson(url, fallback = null) {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

function setCopyStatus(statusEl, message, state) {
  statusEl.textContent = message;
  statusEl.classList.remove('is-success', 'is-error');
  if (state) statusEl.classList.add('is-' + state);
}

function copyTextWithTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.left = '-1000px';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let didCopy = false;
  try {
    if (typeof document.execCommand === 'function') didCopy = document.execCommand('copy');
  } finally {
    textarea.remove();
  }

  if (!didCopy) throw new Error('Copy command was unavailable');
}

async function writeClipboardText(text) {
  const clipboard = typeof navigator === 'object' ? navigator.clipboard : null;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea path for browsers that expose but reject Clipboard API.
    }
  }

  copyTextWithTextarea(text);
}

async function copyRawText(text, label, statusEl) {
  try {
    await writeClipboardText(text);
    setCopyStatus(statusEl, 'Copied ' + label + '.', 'success');
  } catch {
    setCopyStatus(statusEl, 'Could not copy ' + label + '.', 'error');
  }
}

function sourcePayloadMatchesOutput(payload = {}, source = {}) {
  const outputMeta = payload && typeof payload.meta === 'object' ? payload.meta : {};
  const sourceMeta = source && typeof source.meta === 'object' ? source.meta : {};
  return ['buildId', 'sourceCodeHash'].every((key) => outputMeta[key] && outputMeta[key] === sourceMeta[key]);
}

function sourceMode() {
  return String(outputPayload?.meta?.privacy?.sourceMode || 'full').trim() || 'full';
}

function unavailableSourceComment(kind) {
  return '// ' + kind + ' source was not saved for this run (sourceMode=' + sourceMode() + ').';
}

function safeOutputModulePath(modulePath = '') {
  const normalized = String(modulePath || '').replace(/\\/g, '/').trim();
  if (!normalized) return '';
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return '';
  if (normalized.split('/').includes('..')) return '';
  return normalized.replace(/^\.\//, '');
}

function outputModuleRecord(modulePath = '') {
  return outputModuleByPath.get(safeOutputModulePath(modulePath)) || null;
}

function moduleLineCount(modulePath = '') {
  return compactCount(outputModuleRecord(modulePath)?.lineCount)
    || compactCount(moduleSourceByPath.get(modulePath)?.lineCount);
}

function buildOutputModuleIndex(payload = {}) {
  outputModuleByPath = new Map();
  for (const module of safeArray(payload.modules)) {
    const modulePath = safeOutputModulePath(module?.path);
    if (!modulePath) continue;
    outputModuleByPath.set(modulePath, { ...module, path: modulePath });
  }
}

function buildModuleSourceIndex(payload = {}) {
  moduleSourceByPath = new Map();
  for (const moduleSource of safeArray(payload.modules)) {
    const modulePath = safeOutputModulePath(moduleSource?.path);
    const code = typeof moduleSource?.code === 'string' ? moduleSource.code : '';
    if (!modulePath || !outputModuleByPath.has(modulePath) || !code) continue;
    moduleSourceByPath.set(modulePath, {
      path: modulePath,
      lineCount: compactCount(moduleSource.lineCount) || code.split(/\r\n|\r|\n/).length,
      maxLineLength: compactCount(moduleSource.maxLineLength),
      code,
    });
  }
}

function sourceKey(moduleId, name) {
  return moduleId + '\u0000' + name;
}

function sourceNavigationGroup(declaration) {
  const moduleId = String(declaration?.moduleId || '').trim();
  const sourceOrigin = String(declaration?.sourceOrigin || '').trim();
  return moduleId && sourceOrigin ? sourceKey(moduleId, sourceOrigin) : '';
}

function sourceDialogGroupForDeclaration(declaration) {
  const groupKey = sourceNavigationGroup(declaration);
  if (!groupKey) return declaration ? [declaration] : [];
  return safeArray(sourcePayload?.declarations)
    .filter((candidate) => sourceNavigationGroup(candidate) === groupKey);
}

function sourceDialogPathForDeclaration(declaration = {}) {
  const start = declaration.startLine || '?';
  const end = declaration.endLine || start;
  return (declaration.modulePath || 'unknown source') + ':' + start + '-' + end;
}

function buildDeclarationIndexes(payload = {}) {
  declarationsByFunctionId = new Map();
  declarationsByFunctionStableId = new Map();
  declarationsByModule = new Map();
  declarationsByModuleIdAndName = new Map();
  for (const declaration of safeArray(payload.declarations)) {
    const functionId = String(declaration.functionId || '').trim();
    const stableId = String(declaration.functionStableId || '').trim();
    const moduleId = String(declaration.moduleId || '').trim();
    const modulePath = String(declaration.modulePath || '').trim();
    const name = String(declaration.name || declaration.declarationName || '').trim();
    if (functionId && !declarationsByFunctionId.has(functionId)) declarationsByFunctionId.set(functionId, declaration);
    if (stableId && !declarationsByFunctionStableId.has(stableId)) {
      declarationsByFunctionStableId.set(stableId, declaration);
    }
    if (moduleId && name && !declarationsByModuleIdAndName.has(sourceKey(moduleId, name))) {
      declarationsByModuleIdAndName.set(sourceKey(moduleId, name), declaration);
    }
    if (modulePath) {
      if (!declarationsByModule.has(modulePath)) declarationsByModule.set(modulePath, []);
      declarationsByModule.get(modulePath).push(declaration);
    }
  }
  for (const list of declarationsByModule.values()) {
    list.sort((a, b) => compactCount(a.startLine) - compactCount(b.startLine)
      || compactCount(a.endLine) - compactCount(b.endLine)
      || String(a.name || '').localeCompare(String(b.name || '')));
  }
}

function declarationForFunctionNode(node = {}) {
  const byId = declarationsByFunctionId.get(node.id);
  if (byId) return byId;
  const byStableId = node.stableId ? declarationsByFunctionStableId.get(node.stableId) : null;
  if (byStableId) return byStableId;
  return {
    modulePath: node.modulePath,
    name: node.name,
    declarationName: node.declarationName || node.name,
    startLine: node.startLine,
    endLine: node.endLine,
    code: '',
    functionId: node.id,
    functionStableId: node.stableId || null,
    placement: node.placement || null,
  };
}

function functionNodeForDeclaration(declaration = {}) {
  const id = String(declaration.functionId || '').trim();
  if (id && functionById.has(id)) return functionById.get(id);
  const stableId = String(declaration.functionStableId || '').trim();
  if (stableId && functionByStableId.has(stableId)) return functionByStableId.get(stableId);
  const modulePath = String(declaration.modulePath || '').trim();
  const name = String(declaration.name || declaration.declarationName || '').trim();
  const line = Number(declaration.startLine || 0);
  if (!modulePath || !name) return null;
  return functions.find((node) => (
    node.modulePath === modulePath
    && (node.name === name || node.declarationName === name)
    && (!line || node.startLine === line)
  )) || null;
}

function indexFunctions() {
  functions = safeArray(functionMapPayload.functions)
    .filter((node) => node && node.id && node.modulePath && node.name)
    .sort(sortFunctions);
  functionById = new Map(functions.map((node) => [node.id, node]));
  functionByStableId = new Map(functions
    .filter((node) => node.stableId)
    .map((node) => [node.stableId, node]));
  edges = safeArray(functionMapPayload.edges)
    .filter((edge) => edge && functionById.has(edge.sourceId) && functionById.has(edge.targetId))
    .sort(sortEdges);
  edgesBySourceId = new Map();
  edgesByTargetId = new Map();
  for (const edge of edges) {
    if (!edgesBySourceId.has(edge.sourceId)) edgesBySourceId.set(edge.sourceId, []);
    if (!edgesByTargetId.has(edge.targetId)) edgesByTargetId.set(edge.targetId, []);
    edgesBySourceId.get(edge.sourceId).push(edge);
    edgesByTargetId.get(edge.targetId).push(edge);
  }
}

function fileNodeId(modulePath) {
  return 'file:' + modulePath;
}

function callCountForFunctionEdge(edge = {}) {
  return Math.max(
    1,
    compactCount(edge.referenceCount)
      || safeArray(edge.usageLines).length
      || safeArray(edge.usages).length,
  );
}

function compareFileNodeRecords(a, b) {
  return String(a.modulePath || '').localeCompare(String(b.modulePath || ''));
}

function functionsForFile(modulePath) {
  return safeArray(functionIdsByFile.get(modulePath))
    .map((id) => functionById.get(id))
    .filter(Boolean)
    .sort(sortFunctions);
}

function indexFileGraph() {
  functionIdsByFile = new Map();
  const functionsByFile = new Map();

  for (const node of functions) {
    if (!functionsByFile.has(node.modulePath)) functionsByFile.set(node.modulePath, []);
    functionsByFile.get(node.modulePath).push(node);
  }

  fileNodes = Array.from(functionsByFile.entries())
    .map(([modulePath, list]) => {
      const sorted = list.slice().sort(sortFunctions);
      functionIdsByFile.set(modulePath, sorted.map((node) => node.id));
      const totalFunctionLines = sorted.reduce((total, node) => total + lineCountFor(node), 0);
      const moduleRecord = outputModuleRecord(modulePath) || {};
      return {
        nodeType: 'file',
        id: fileNodeId(modulePath),
        stableId: fileNodeId(modulePath),
        modulePath,
        path: modulePath,
        name: fileName(modulePath),
        functionCount: sorted.length,
        totalFunctionLines,
        lineCount: totalFunctionLines,
        moduleLineCount: compactCount(moduleRecord.lineCount),
        reachable: sorted.some((node) => node.reachable) || Boolean(moduleRecord.reachable),
      };
    })
    .sort(compareFileNodeRecords);
  fileByPath = new Map(fileNodes.map((node) => [node.modulePath, node]));

  const aggregateByPair = new Map();
  for (const edge of edges) {
    const source = functionById.get(edge.sourceId);
    const target = functionById.get(edge.targetId);
    if (!source || !target) continue;
    if (source.modulePath === target.modulePath) continue;
    const key = source.modulePath + '\u0000' + target.modulePath;
    if (!aggregateByPair.has(key)) {
      aggregateByPair.set(key, {
        id: 'file-edge:' + source.modulePath + '->' + target.modulePath,
        edgeType: 'file-call',
        sourceId: fileNodeId(source.modulePath),
        targetId: fileNodeId(target.modulePath),
        sourceFilePath: source.modulePath,
        targetFilePath: target.modulePath,
        functionEdgeCount: 0,
        callCount: 0,
        referenceCount: 0,
      });
    }
    const record = aggregateByPair.get(key);
    const callCount = callCountForFunctionEdge(edge);
    record.functionEdgeCount += 1;
    record.callCount += callCount;
    record.referenceCount += callCount;
  }

  fileEdges = Array.from(aggregateByPair.values())
    .sort((a, b) => a.sourceFilePath.localeCompare(b.sourceFilePath)
      || a.targetFilePath.localeCompare(b.targetFilePath));
  fileEdgesBySourcePath = new Map();
  fileEdgesByTargetPath = new Map();
  for (const edge of fileEdges) {
    if (!fileEdgesBySourcePath.has(edge.sourceFilePath)) fileEdgesBySourcePath.set(edge.sourceFilePath, []);
    if (!fileEdgesByTargetPath.has(edge.targetFilePath)) fileEdgesByTargetPath.set(edge.targetFilePath, []);
    fileEdgesBySourcePath.get(edge.sourceFilePath).push(edge);
    fileEdgesByTargetPath.get(edge.targetFilePath).push(edge);
  }
}

function buildModuleOrder() {
  const modules = new Map(safeArray(outputPayload?.modules).map((module) => [module.path, module]));
  const ordered = [];
  const seen = new Set();
  const add = (modulePath) => {
    const path = String(modulePath || '').trim();
    if (!path || seen.has(path)) return;
    seen.add(path);
    ordered.push(path);
  };

  const queue = [];
  if (outputPayload?.entry) queue.push(outputPayload.entry);
  while (queue.length > 0) {
    const modulePath = queue.shift();
    if (seen.has(modulePath)) continue;
    add(modulePath);
    const module = modules.get(modulePath);
    for (const dependency of safeArray(module?.localDependencies).sort()) {
      if (!seen.has(dependency)) queue.push(dependency);
    }
  }

  for (const modulePath of Array.from(new Set(functions.map((node) => node.modulePath))).sort()) add(modulePath);
  for (const modulePath of Array.from(modules.keys()).sort()) add(modulePath);
  return ordered;
}

function assignFileColors(fileOrder) {
  fileColorByPath = new Map();
  fileOrder.forEach((modulePath, index) => {
    fileColorByPath.set(modulePath, filePalette[index % filePalette.length]);
  });
}

function renderFileLegend(fileOrder) {
  fileLegendEl.textContent = '';
  const visibleFiles = fileOrder.filter((modulePath) => networkFunctions().some((node) => node.modulePath === modulePath));
  for (const modulePath of visibleFiles.slice(0, 12)) {
    const item = createElement('span', 'legend-item');
    const swatch = createElement('span', 'legend-swatch');
    swatch.style.background = fileColorByPath.get(modulePath) || '#64748b';
    const label = createElement('span', '', modulePath);
    label.setAttribute('title', modulePath);
    item.append(swatch, label);
    fileLegendEl.appendChild(item);
  }
  if (visibleFiles.length > 12) {
    fileLegendEl.appendChild(createElement('span', 'legend-item', '+' + (visibleFiles.length - 12) + ' files'));
  }
}

function scaledNodeRadius(node, minLines, maxLines) {
  const minRadius = 10;
  const maxRadius = 26;
  const lines = lineCountFor(node);
  if (maxLines <= minLines) return 15;
  const ratio = (lines - minLines) / Math.max(1, maxLines - minLines);
  return minRadius + (Math.sqrt(Math.max(0, Math.min(1, ratio))) * (maxRadius - minRadius));
}

function scaledFileRadius(node, minMeasure, maxMeasure) {
  const minRadius = 21;
  const maxRadius = 38;
  const measure = compactCount(node.totalFunctionLines) || compactCount(node.functionCount);
  if (maxMeasure <= minMeasure) return 27;
  const ratio = (measure - minMeasure) / Math.max(1, maxMeasure - minMeasure);
  return minRadius + (Math.sqrt(Math.max(0, Math.min(1, ratio))) * (maxRadius - minRadius));
}

function fileNodeWidth(node, radius) {
  const labelLength = shortLabel(node.modulePath, 24).length;
  return clamp(112 + radius * 2.25 + labelLength * 2.2, 142, 218);
}

function fileNodeHeight(radius) {
  return clamp(42 + radius * 0.42, 48, 58);
}

function layoutHorizontalRadius(item = {}) {
  return item.width ? item.width / 2 : item.radius;
}

function layoutVerticalRadius(item = {}) {
  return item.height ? item.height / 2 : item.radius;
}

function layoutCollisionPadding(item = {}) {
  return item.node?.nodeType === 'file' ? 28 : 14;
}

function layoutCollisionRadius(item = {}) {
  if (item.collisionRadius) return item.collisionRadius;
  const horizontalRadius = layoutHorizontalRadius(item) || 0;
  const verticalRadius = layoutVerticalRadius(item) || 0;
  if (item.width || item.height) {
    return Math.hypot(horizontalRadius, verticalRadius) + layoutCollisionPadding(item);
  }
  return Math.max(horizontalRadius, verticalRadius, item.radius || 0);
}

function layoutEdgeRadius(item = {}) {
  return item.edgeRadius || item.radius;
}

function membershipEdges() {
  if (!networkShowsFilesAndFunctions()) return [];
  return networkFunctions().map((node) => ({
    id: 'membership:' + node.id,
    edgeType: 'membership',
    sourceId: fileNodeId(node.modulePath),
    targetId: node.id,
    sourceFilePath: node.modulePath,
    targetFilePath: node.modulePath,
  }));
}

function compareFilePaths(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}

function networkFunctionIdsByFileFor(nodes) {
  const idsByFile = new Map();
  for (const node of nodes) {
    if (!idsByFile.has(node.modulePath)) idsByFile.set(node.modulePath, []);
    idsByFile.get(node.modulePath).push(node.id);
  }
  for (const ids of idsByFile.values()) ids.sort(compareFunctionIds);
  return idsByFile;
}

function sourceFilteredFunctionIds(ids) {
  return new Set(Array.from(ids || [])
    .filter((id) => {
      const node = functionById.get(id);
      return node && networkSourceMatchesPath(node.modulePath);
    }));
}

function sourceFilteredFilePaths(paths) {
  return new Set(Array.from(paths || [])
    .filter((modulePath) => networkSourceMatchesPath(modulePath)));
}

function createNetworkGraph({ functionIds, functionEdgeIds, filePaths, fileEdgeIds, filtered }) {
  const visibleFunctionIds = sourceFilteredFunctionIds(functionIds || new Set(functions.map((node) => node.id)));
  const visibleFilePaths = sourceFilteredFilePaths(filePaths || new Set(fileNodes.map((node) => node.modulePath)));
  const visibleFunctionEdgeIds = functionEdgeIds || new Set(edges.map((edge) => edge.id));
  const visibleFileEdgeIds = fileEdgeIds || new Set(fileEdges.map((edge) => edge.id));
  const graphFunctions = functions.filter((node) => visibleFunctionIds.has(node.id));
  const graphEdges = edges.filter((edge) => (
    visibleFunctionEdgeIds.has(edge.id)
    && visibleFunctionIds.has(edge.sourceId)
    && visibleFunctionIds.has(edge.targetId)
  ));
  const graphFileNodes = fileNodes.filter((node) => visibleFilePaths.has(node.modulePath));
  const graphFileEdges = fileEdges.filter((edge) => (
    visibleFileEdgeIds.has(edge.id)
    && visibleFilePaths.has(edge.sourceFilePath)
    && visibleFilePaths.has(edge.targetFilePath)
  ));
  return {
    filtered: Boolean(filtered || !networkSourceFilterIsFull()),
    functions: graphFunctions,
    edges: graphEdges,
    fileNodes: graphFileNodes,
    fileEdges: graphFileEdges,
    functionIds: new Set(graphFunctions.map((node) => node.id)),
    functionEdgeIds: new Set(graphEdges.map((edge) => edge.id)),
    filePaths: new Set(graphFileNodes.map((node) => node.modulePath)),
    fileEdgeIds: new Set(graphFileEdges.map((edge) => edge.id)),
    fileByPath: new Map(graphFileNodes.map((node) => [node.modulePath, node])),
    functionIdsByFile: networkFunctionIdsByFileFor(graphFunctions),
  };
}

function fullNetworkGraph() {
  return createNetworkGraph({ filtered: false });
}

function networkGraph() {
  return visibleNetworkGraph || fullNetworkGraph();
}

function networkFunctions() {
  return networkGraph().functions;
}

function networkEdges() {
  return networkGraph().edges;
}

function networkFileNodes() {
  return networkGraph().fileNodes;
}

function networkFileEdges() {
  return networkGraph().fileEdges;
}

function networkFileByPath() {
  return networkGraph().fileByPath;
}

function networkFunctionIdsByFile() {
  return networkGraph().functionIdsByFile;
}

function networkFunctionsForFile(modulePath) {
  return safeArray(networkFunctionIdsByFile().get(modulePath))
    .map((id) => functionById.get(id))
    .filter(Boolean)
    .sort(sortFunctions);
}

function networkDepthLimit() {
  return activeNetworkDepth === 'all' ? Infinity : Number(activeNetworkDepth) || 1;
}

function edgeEndpointId(edge, traversalDirection) {
  return traversalDirection === 'incoming' ? edge.sourceId : edge.targetId;
}

function sortedFunctionNeighborEdges(edgeList, traversalDirection) {
  return safeArray(edgeList)
    .filter((edge) => functionById.has(edgeEndpointId(edge, traversalDirection)))
    .sort((a, b) => compareFunctionIds(edgeEndpointId(a, traversalDirection), edgeEndpointId(b, traversalDirection))
      || sortEdges(a, b));
}

function functionTraversalDirections() {
  if (activeNetworkScope === 'dependencies') return ['outgoing'];
  if (activeNetworkScope === 'parents') return ['incoming'];
  if (activeNetworkScope === 'full') return [];
  return ['outgoing', 'incoming'];
}

function traverseFunctionDirection(rootId, traversalDirection, maxDepth, nodeIds, edgeIds) {
  const queue = [{ id: rootId, depth: 0 }];
  const visitedForDirection = new Set([rootId]);
  for (let position = 0; position < queue.length; position += 1) {
    const current = queue[position];
    if (current.depth >= maxDepth) continue;
    const sourceEdges = traversalDirection === 'outgoing'
      ? edgesBySourceId.get(current.id)
      : edgesByTargetId.get(current.id);
    for (const edge of sortedFunctionNeighborEdges(sourceEdges, traversalDirection)) {
      const nextId = edgeEndpointId(edge, traversalDirection);
      edgeIds.add(edge.id);
      if (visitedForDirection.has(nextId)) continue;
      visitedForDirection.add(nextId);
      nodeIds.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }
}

function traverseFunctionNeighborhood(rootId) {
  const maxDepth = networkDepthLimit();
  const nodeIds = new Set([rootId]);
  const edgeIds = new Set();
  for (const direction of functionTraversalDirections()) {
    traverseFunctionDirection(rootId, direction, maxDepth, nodeIds, edgeIds);
  }

  return { nodeIds, edgeIds };
}

function fileEdgeEndpointPath(edge, traversalDirection) {
  return traversalDirection === 'incoming' ? edge.sourceFilePath : edge.targetFilePath;
}

function sortedFileNeighborEdges(edgeList, traversalDirection) {
  return safeArray(edgeList)
    .filter((edge) => fileByPath.has(fileEdgeEndpointPath(edge, traversalDirection)))
    .sort((a, b) => compareFilePaths(fileEdgeEndpointPath(a, traversalDirection), fileEdgeEndpointPath(b, traversalDirection))
      || compareFilePaths(a.sourceFilePath, b.sourceFilePath)
      || compareFilePaths(a.targetFilePath, b.targetFilePath));
}

function fileTraversalDirections() {
  if (activeNetworkScope === 'dependencies') return ['outgoing'];
  if (activeNetworkScope === 'parents') return ['incoming'];
  if (activeNetworkScope === 'full') return [];
  return ['outgoing', 'incoming'];
}

function traverseFileDirection(rootPath, traversalDirection, maxDepth, filePaths, fileEdgeIds) {
  const queue = [{ modulePath: rootPath, depth: 0 }];
  const visitedForDirection = new Set([rootPath]);
  for (let position = 0; position < queue.length; position += 1) {
    const current = queue[position];
    if (current.depth >= maxDepth) continue;
    const sourceEdges = traversalDirection === 'outgoing'
      ? fileEdgesBySourcePath.get(current.modulePath)
      : fileEdgesByTargetPath.get(current.modulePath);
    for (const edge of sortedFileNeighborEdges(sourceEdges, traversalDirection)) {
      const nextPath = fileEdgeEndpointPath(edge, traversalDirection);
      fileEdgeIds.add(edge.id);
      if (visitedForDirection.has(nextPath)) continue;
      visitedForDirection.add(nextPath);
      filePaths.add(nextPath);
      queue.push({ modulePath: nextPath, depth: current.depth + 1 });
    }
  }
}

function traverseFileNeighborhood(rootPath) {
  const maxDepth = networkDepthLimit();
  const filePaths = new Set([rootPath]);
  const fileEdgeIds = new Set();
  for (const direction of fileTraversalDirections()) {
    traverseFileDirection(rootPath, direction, maxDepth, filePaths, fileEdgeIds);
  }

  return { filePaths, fileEdgeIds };
}

function functionsInFiles(filePaths) {
  const ids = new Set();
  for (const modulePath of Array.from(filePaths).sort(compareFilePaths)) {
    for (const id of safeArray(functionIdsByFile.get(modulePath))) ids.add(id);
  }
  return ids;
}

function computeVisibleNetworkGraph() {
  if (activeNetworkScope === 'full') return fullNetworkGraph();
  if (!hasNetworkSelection()) return fullNetworkGraph();
  if (selectedFunctionId && functionById.has(selectedFunctionId)) {
    const traversal = traverseFunctionNeighborhood(selectedFunctionId);
    const filePaths = new Set(Array.from(traversal.nodeIds)
      .map((id) => functionById.get(id)?.modulePath)
      .filter(Boolean));
    return createNetworkGraph({
      functionIds: traversal.nodeIds,
      functionEdgeIds: traversal.edgeIds,
      filePaths,
      filtered: true,
    });
  }

  if (selectedFilePath && fileByPath.has(selectedFilePath)) {
    const traversal = traverseFileNeighborhood(selectedFilePath);
    return createNetworkGraph({
      functionIds: functionsInFiles(traversal.filePaths),
      filePaths: traversal.filePaths,
      fileEdgeIds: traversal.fileEdgeIds,
      filtered: true,
    });
  }

  return fullNetworkGraph();
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(value) {
  return stableHash(value) / 4294967296;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function primaryViewRecord(viewId = activePrimaryView) {
  return primaryViewModes.find((mode) => mode.id === viewId) || primaryViewModes[0];
}

function normalizeNetworkLayoutModeId(modeId) {
  const rawMode = String(modeId || '').trim();
  return networkLayoutModeAliases.get(rawMode) || rawMode;
}

function networkLayoutModeRecord(modeId = activeNetworkLayoutMode) {
  const normalizedModeId = normalizeNetworkLayoutModeId(modeId);
  return networkLayoutModes.find((mode) => mode.id === normalizedModeId) || networkLayoutModes[0];
}

function networkScopeRecord(scopeId = activeNetworkScope) {
  const rawScope = String(scopeId || '').trim();
  const normalized = networkScopeAliases.get(rawScope) || rawScope;
  return networkScopeModes.find((mode) => mode.id === normalized) || networkScopeModes[0];
}

function networkDepthRecord(depthId = activeNetworkDepth) {
  const normalized = String(depthId || '').trim().toLowerCase();
  return networkDepthModes.find((mode) => mode.id === normalized) || networkDepthModes[0];
}

function hasNetworkSelection() {
  return Boolean(selectedFunctionId || selectedFilePath);
}

function storageForViewerPreferences() {
  try {
    if (typeof window !== 'object' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadPrimaryViewMode() {
  const storage = storageForViewerPreferences();
  const savedMode = storage ? storage.getItem(primaryViewStorageKey) : '';
  return primaryViewRecord(savedMode).id;
}

function persistPrimaryViewMode(modeId) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(primaryViewStorageKey, primaryViewRecord(modeId).id);
  } catch {
    // View persistence is a convenience; the viewer still works without it.
  }
}

function loadNetworkLayoutMode() {
  const storage = storageForViewerPreferences();
  const savedMode = storage ? storage.getItem(networkLayoutModeStorageKey) : '';
  const migratedMode = networkLayoutModeRecord(savedMode).id;
  if (storage && savedMode && savedMode !== migratedMode) {
    try {
      storage.setItem(networkLayoutModeStorageKey, migratedMode);
    } catch {
      // Migration is best-effort; the normalized mode is still used for this session.
    }
  }
  return migratedMode;
}

function persistNetworkLayoutMode(modeId) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(networkLayoutModeStorageKey, networkLayoutModeRecord(modeId).id);
  } catch {
    // Layout persistence is a convenience; the viewer still works without it.
  }
}

function loadNetworkScope() {
  const storage = storageForViewerPreferences();
  const savedScope = storage
    ? (storage.getItem(networkScopeStorageKey) || storage.getItem(legacyNetworkDirectionStorageKey))
    : '';
  return networkScopeRecord(savedScope).id;
}

function persistNetworkScope(scopeId) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(networkScopeStorageKey, networkScopeRecord(scopeId).id);
  } catch {
    // Scope persistence is a convenience; the viewer still works without it.
  }
}

function loadNetworkDepth() {
  const storage = storageForViewerPreferences();
  const savedDepth = storage
    ? (storage.getItem(networkDepthStorageKey) || storage.getItem(legacyNetworkHopsStorageKey))
    : '';
  return networkDepthRecord(savedDepth).id;
}

function persistNetworkDepth(depthId) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(networkDepthStorageKey, networkDepthRecord(depthId).id);
  } catch {
    // Depth persistence is a convenience; the viewer still works without it.
  }
}

function normalizeNetworkNodeVisibility(value = {}) {
  const files = Boolean(value.files);
  const nodeFunctions = Boolean(value.functions);
  if (!files && !nodeFunctions) return { files: false, functions: true };
  return { files, functions: nodeFunctions };
}

function parseNetworkNodeVisibility(savedValue) {
  const value = String(savedValue || '').trim();
  if (value === 'files') return { files: true, functions: false };
  if (value === 'functions') return { files: false, functions: true };
  if (value === 'files+functions' || value === 'functions+files') {
    return { files: true, functions: true };
  }
  if (value.startsWith('{')) {
    try {
      return normalizeNetworkNodeVisibility(JSON.parse(value));
    } catch {
      return { files: false, functions: true };
    }
  }
  return { files: false, functions: true };
}

function serializeNetworkNodeVisibility(visibility = activeNetworkNodeVisibility) {
  const normalized = normalizeNetworkNodeVisibility(visibility);
  if (normalized.files && normalized.functions) return 'files+functions';
  return normalized.files ? 'files' : 'functions';
}

function loadNetworkNodeVisibility() {
  const storage = storageForViewerPreferences();
  const savedValue = storage ? storage.getItem(networkNodeVisibilityStorageKey) : '';
  const visibility = parseNetworkNodeVisibility(savedValue);
  if (storage && savedValue && savedValue !== serializeNetworkNodeVisibility(visibility)) {
    try {
      storage.setItem(networkNodeVisibilityStorageKey, serializeNetworkNodeVisibility(visibility));
    } catch {
      // Migration is best-effort; the normalized visibility is still used for this session.
    }
  }
  return visibility;
}

function persistNetworkNodeVisibility(visibility = activeNetworkNodeVisibility) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(networkNodeVisibilityStorageKey, serializeNetworkNodeVisibility(visibility));
  } catch {
    // Node-level persistence is a convenience; the viewer still works without it.
  }
}

function normalizeNetworkSourceFileTypes(value = {}) {
  const jsx = Boolean(value.jsx);
  const js = Boolean(value.js);
  if (!jsx && !js) return { jsx: true, js: false };
  return { jsx, js };
}

function parseNetworkSourceFileTypes(savedValue) {
  const value = String(savedValue || '').trim().toLowerCase();
  if (value === 'jsx') return { jsx: true, js: false };
  if (value === 'js') return { jsx: false, js: true };
  const sourceTokens = value.split(/[,+\s]+/).filter(Boolean);
  if (sourceTokens.length > 0 && sourceTokens.every((token) => token === 'jsx' || token === 'js')) {
    return normalizeNetworkSourceFileTypes({
      jsx: sourceTokens.includes('jsx'),
      js: sourceTokens.includes('js'),
    });
  }
  if (value.startsWith('{')) {
    try {
      return normalizeNetworkSourceFileTypes(JSON.parse(value));
    } catch {
      return { jsx: true, js: false };
    }
  }
  return { jsx: true, js: false };
}

function serializeNetworkSourceFileTypes(sourceTypes = activeNetworkSourceFileTypes) {
  const normalized = normalizeNetworkSourceFileTypes(sourceTypes);
  if (normalized.jsx && normalized.js) return 'jsx+js';
  return normalized.jsx ? 'jsx' : 'js';
}

function loadNetworkSourceFileTypes() {
  const storage = storageForViewerPreferences();
  const savedValue = storage ? storage.getItem(networkSourceFileTypeStorageKey) : '';
  const sourceTypes = parseNetworkSourceFileTypes(savedValue);
  if (storage && savedValue && savedValue !== serializeNetworkSourceFileTypes(sourceTypes)) {
    try {
      storage.setItem(networkSourceFileTypeStorageKey, serializeNetworkSourceFileTypes(sourceTypes));
    } catch {
      // Migration is best-effort; the normalized filter is still used for this session.
    }
  }
  return sourceTypes;
}

function persistNetworkSourceFileTypes(sourceTypes = activeNetworkSourceFileTypes) {
  const storage = storageForViewerPreferences();
  if (!storage) return;
  try {
    storage.setItem(networkSourceFileTypeStorageKey, serializeNetworkSourceFileTypes(sourceTypes));
  } catch {
    // Source file filter persistence is a convenience; the viewer still works without it.
  }
}

function networkSourceFileTypeLabel(sourceTypes = activeNetworkSourceFileTypes) {
  const normalized = normalizeNetworkSourceFileTypes(sourceTypes);
  if (normalized.jsx && normalized.js) return 'JSX + JS files';
  return normalized.jsx ? 'JSX files' : 'JS files';
}

function networkSourceMatchesPath(modulePath, sourceTypes = activeNetworkSourceFileTypes) {
  const sourceType = sourceFileTypeForPath(modulePath);
  return Boolean(sourceType && normalizeNetworkSourceFileTypes(sourceTypes)[sourceType]);
}

function networkSourceFilterIsFull(sourceTypes = activeNetworkSourceFileTypes) {
  const normalized = normalizeNetworkSourceFileTypes(sourceTypes);
  return normalized.jsx && normalized.js;
}

function networkShowsFiles() {
  return Boolean(activeNetworkNodeVisibility.files);
}

function networkShowsFunctions() {
  return Boolean(activeNetworkNodeVisibility.functions);
}

function networkShowsFilesAndFunctions() {
  return networkShowsFiles() && networkShowsFunctions();
}

function networkLevelLabel(visibility = activeNetworkNodeVisibility) {
  const normalized = normalizeNetworkNodeVisibility(visibility);
  if (normalized.files && normalized.functions) return 'Files + functions';
  return normalized.files ? 'Files' : 'Functions';
}

function graphStatusLabel(modeId = networkLayout?.mode || activeNetworkLayoutMode) {
  const parts = [networkLayoutModeRecord(modeId).statusLabel, networkLevelLabel(), networkSourceFileTypeLabel()];
  const scope = networkScopeRecord(activeNetworkScope);
  if (activeNetworkScope === 'full') return parts.concat(scope.statusLabel).join(' · ');
  parts.push(scope.statusLabel);
  if (hasNetworkSelection()) parts.push(networkDepthRecord(activeNetworkDepth).statusLabel);
  return parts.join(' · ');
}

function networkUsesFileSemanticEdges() {
  return networkShowsFiles()
    && (!networkShowsFunctions() || (networkShowsFilesAndFunctions() && activeNetworkScope !== 'full' && selectedFilePath));
}

function networkSemanticEdgeCount(graph = networkGraph()) {
  return networkUsesFileSemanticEdges() ? graph.fileEdges.length : graph.edges.length;
}

function networkSemanticEdgeLabel(graph = networkGraph()) {
  return networkUsesFileSemanticEdges()
    ? 'aggregated file ' + plural(graph.fileEdges.length, 'link')
    : 'saved function ' + plural(graph.edges.length, 'link');
}

function networkVisibleNodeCount(graph = networkGraph()) {
  return (networkShowsFiles() ? graph.fileNodes.length : 0)
    + (networkShowsFunctions() ? graph.functions.length : 0);
}

function networkVisibleSummary(graph = networkGraph()) {
  const visibleNodes = networkVisibleNodeCount(graph);
  const prefix = visibleNodes + ' visible ' + plural(visibleNodes, 'node');
  if (networkShowsFilesAndFunctions()) {
    return prefix + ': ' + graph.fileNodes.length + ' '
      + plural(graph.fileNodes.length, 'file') + ', '
      + graph.functions.length + ' ' + plural(graph.functions.length, 'function') + ', '
      + networkSemanticEdgeCount(graph) + ' ' + networkSemanticEdgeLabel(graph);
  }
  if (networkShowsFiles()) {
    return prefix + ': ' + graph.fileNodes.length + ' '
      + plural(graph.fileNodes.length, 'file') + ', '
      + networkSemanticEdgeCount(graph) + ' ' + networkSemanticEdgeLabel(graph);
  }
  return prefix + ': ' + graph.functions.length + ' '
    + plural(graph.functions.length, 'function') + ', '
    + networkSemanticEdgeCount(graph) + ' ' + networkSemanticEdgeLabel(graph);
}

function emptyNetworkMessage(graph = networkGraph()) {
  if ((functions.length > 0 || fileNodes.length > 0)
    && graph.functions.length === 0
    && graph.fileNodes.length === 0) {
    return 'No saved function nodes match ' + networkSourceFileTypeLabel().toLowerCase() + '.';
  }
  return 'No saved function relationships were found.';
}

function networkHelpText() {
  const scope = networkScopeRecord(activeNetworkScope);
  const depth = networkDepthRecord(activeNetworkDepth);
  if (activeNetworkScope === 'full') {
    return 'Full scope shows the whole graph. Depth applies after choosing Dependencies, Parents, or Both.';
  }
  if (!hasNetworkSelection()) {
    return 'Select a file or function to apply scope and depth. The full graph is shown until then.';
  }
  if (networkShowsFilesAndFunctions()) {
    return scope.statusLabel + ' · ' + depth.statusLabel
      + ' filters the selected neighborhood. Select another file or function to move the focus.';
  }
  if (networkShowsFiles()) {
    return scope.statusLabel + ' · ' + depth.statusLabel
      + ' filters file neighborhoods from the selected file.';
  }
  return scope.statusLabel + ' · ' + depth.statusLabel
    + ' filters function neighborhoods from the selected function.';
}

function renderNetworkNodeSwitch() {
  networkNodeSwitchEl.textContent = '';
  for (const mode of networkNodeModes) {
    const active = Boolean(activeNetworkNodeVisibility[mode.id]);
    const otherActive = mode.id === 'files'
      ? activeNetworkNodeVisibility.functions
      : activeNetworkNodeVisibility.files;
    const button = createElement('button', active ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.accessibilityLabel);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (active && !otherActive) {
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('title', 'At least one node level stays visible.');
    }
    button.addEventListener('click', () => {
      if (active && !otherActive) return;
      setNetworkNodeVisibility({ ...activeNetworkNodeVisibility, [mode.id]: !active });
    });
    networkNodeSwitchEl.appendChild(button);
  }
}

function renderNetworkSourceSwitch() {
  networkSourceSwitchEl.textContent = '';
  for (const mode of networkSourceFileTypeModes) {
    const active = Boolean(activeNetworkSourceFileTypes[mode.id]);
    const otherActive = mode.id === 'jsx'
      ? activeNetworkSourceFileTypes.js
      : activeNetworkSourceFileTypes.jsx;
    const button = createElement('button', active ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.accessibilityLabel);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (active && !otherActive) {
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('title', 'At least one source file type stays visible.');
    }
    button.addEventListener('click', () => {
      if (active && !otherActive) return;
      setNetworkSourceFileTypes({ ...activeNetworkSourceFileTypes, [mode.id]: !active });
    });
    networkSourceSwitchEl.appendChild(button);
  }
}

function renderNetworkScopeSwitch() {
  networkScopeSwitchEl.textContent = '';
  for (const mode of networkScopeModes) {
    const active = mode.id === activeNetworkScope;
    const button = createElement('button', active ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.accessibilityLabel);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.addEventListener('click', () => setNetworkScope(mode.id));
    networkScopeSwitchEl.appendChild(button);
  }
}

function renderNetworkDepthSwitch() {
  networkDepthSwitchEl.textContent = '';
  for (const mode of networkDepthModes) {
    const active = mode.id === activeNetworkDepth;
    const button = createElement('button', active ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.accessibilityLabel);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.addEventListener('click', () => setNetworkDepth(mode.id));
    networkDepthSwitchEl.appendChild(button);
  }
}

function renderPrimaryViewSwitch() {
  primaryViewSwitchEl.textContent = '';
  for (const mode of primaryViewModes) {
    const button = createElement('button', mode.id === activePrimaryView ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.accessibilityLabel);
    button.setAttribute('aria-pressed', mode.id === activePrimaryView ? 'true' : 'false');
    button.addEventListener('click', () => setPrimaryViewMode(mode.id));
    primaryViewSwitchEl.appendChild(button);
  }
}

function renderNetworkLayoutSwitch() {
  networkLayoutSwitchEl.textContent = '';
  for (const mode of networkLayoutModes) {
    const button = createElement('button', mode.id === activeNetworkLayoutMode ? 'is-active' : '', mode.label);
    button.type = 'button';
    button.setAttribute('aria-label', mode.statusLabel);
    button.setAttribute('aria-pressed', mode.id === activeNetworkLayoutMode ? 'true' : 'false');
    button.addEventListener('click', () => setNetworkLayoutMode(mode.id));
    networkLayoutSwitchEl.appendChild(button);
  }
}

function updateVisualizationStatus() {
  if (activePrimaryView === 'jsx-map') {
    networkStatusEl.textContent = !outputPayload?.mermaid
      ? 'Components: no component diagram was saved.'
      : moduleDiagramSvgEl
      ? 'Components: module composition, member rows, and import edges.'
      : 'Components: loading module composition.';
    return;
  }
  networkHelpEl.textContent = networkHelpText();
  networkStatusEl.textContent = latestFunctionGraphStatus;
}

function fitCurrentNetworkLayout() {
  if (activePrimaryView !== 'function-graphs') {
    networkNeedsFit = true;
    return;
  }
  networkNeedsFit = false;
  requestAnimationFrame(() => {
    fitNetworkToViewport();
    if (selectedFunctionId) {
      scrollFunctionIntoView(selectedFunctionId);
    } else if (selectedFilePath) {
      scrollFileIntoView(selectedFilePath);
    }
  });
}

function fitModuleDiagramWhenVisible() {
  if (activePrimaryView !== 'jsx-map') {
    moduleDiagramNeedsFit = true;
    return;
  }
  if (!moduleDiagramSvgEl) return;
  moduleDiagramNeedsFit = false;
  requestAnimationFrame(() => fitModuleDiagramToViewport());
}

function applyPrimaryViewMode() {
  const showFunctionGraphs = activePrimaryView === 'function-graphs';
  functionGraphsViewEl.hidden = !showFunctionGraphs;
  jsxMapViewEl.hidden = showFunctionGraphs;
  renderPrimaryViewSwitch();
  updateVisualizationStatus();
  if (showFunctionGraphs && networkNeedsFit) fitCurrentNetworkLayout();
  if (!showFunctionGraphs && moduleDiagramNeedsFit) fitModuleDiagramWhenVisible();
}

function setPrimaryViewMode(modeId) {
  const nextMode = primaryViewRecord(modeId).id;
  if (nextMode === activePrimaryView) return;
  activePrimaryView = nextMode;
  persistPrimaryViewMode(nextMode);
  applyPrimaryViewMode();
}

function setNetworkLayoutMode(modeId) {
  const nextMode = networkLayoutModeRecord(modeId).id;
  if (nextMode === activeNetworkLayoutMode && networkLayout) return;
  activeNetworkLayoutMode = nextMode;
  persistNetworkLayoutMode(nextMode);
  reconcileSelectionForNodeVisibility();
  renderNetworkLayoutSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState('switch-network-layout');
}

function setNetworkScope(scopeId) {
  const nextScope = networkScopeRecord(scopeId).id;
  if (nextScope === activeNetworkScope) return;
  activeNetworkScope = nextScope;
  persistNetworkScope(nextScope);
  renderNetworkScopeSwitch();
  renderNetworkDepthSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState('switch-network-scope');
}

function setNetworkDepth(depthId) {
  const nextDepth = networkDepthRecord(depthId).id;
  if (nextDepth === activeNetworkDepth) return;
  activeNetworkDepth = nextDepth;
  persistNetworkDepth(nextDepth);
  renderNetworkDepthSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState('switch-network-depth');
}

function setNetworkNodeVisibility(nextVisibility, { reason = 'switch-node-levels', focusFilePath = '' } = {}) {
  const normalized = normalizeNetworkNodeVisibility(nextVisibility);
  const changed = normalized.files !== activeNetworkNodeVisibility.files
    || normalized.functions !== activeNetworkNodeVisibility.functions;
  if (!changed && !focusFilePath) return;

  activeNetworkNodeVisibility = normalized;
  persistNetworkNodeVisibility(normalized);
  if (focusFilePath && fileByPath.has(focusFilePath) && networkSourceMatchesPath(focusFilePath)) {
    selectedFilePath = focusFilePath;
    selectedFunctionId = '';
    activeRelationFilter = 'all';
  }
  reconcileSelectionForNodeVisibility();
  renderNetworkNodeSwitch();
  renderNetworkDepthSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState(reason);
}

function setNetworkSourceFileTypes(nextSourceFileTypes, { reason = 'switch-source-files' } = {}) {
  const normalized = normalizeNetworkSourceFileTypes(nextSourceFileTypes);
  const changed = normalized.jsx !== activeNetworkSourceFileTypes.jsx
    || normalized.js !== activeNetworkSourceFileTypes.js;
  if (!changed) return;

  activeNetworkSourceFileTypes = normalized;
  persistNetworkSourceFileTypes(normalized);
  reconcileSelectionForNodeVisibility();
  renderNetworkSourceSwitch();
  renderNetworkDepthSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState(reason);
}

function moduleClusterCenters(fileOrder, width, height) {
  const visibleFileOrder = fileOrder.filter((modulePath) => networkFunctions().some((node) => node.modulePath === modulePath));
  const centers = new Map();
  const centerX = width / 2;
  const centerY = height / 2;
  if (visibleFileOrder.length <= 1) {
    if (visibleFileOrder[0]) centers.set(visibleFileOrder[0], { x: centerX, y: centerY });
    return centers;
  }

  const radiusX = Math.max(260, width * 0.32);
  const radiusY = Math.max(180, height * 0.28);
  visibleFileOrder.forEach((modulePath, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / visibleFileOrder.length);
    centers.set(modulePath, {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    });
  });
  return centers;
}

function networkInitialPosition(node, index, count, clusterCenter, width, height) {
  const seed = node.stableId || node.id || (node.modulePath + ':' + node.name + ':' + index);
  const moduleSeed = node.modulePath + ':' + index;
  const spiralAngle = (Math.PI * 2 * index) / Math.max(1, count);
  const jitterAngle = seededUnit(seed + ':angle') * Math.PI * 2;
  const jitterRadius = 28 + seededUnit(seed + ':radius') * 95;
  return {
    x: clamp(
      clusterCenter.x + Math.cos(jitterAngle) * jitterRadius + Math.cos(spiralAngle) * 36,
      80,
      width - 80,
    ),
    y: clamp(
      clusterCenter.y + Math.sin(jitterAngle) * jitterRadius + Math.sin(spiralAngle) * 36
        + (seededUnit(moduleSeed) - 0.5) * 34,
      80,
      height - 80,
    ),
  };
}

function layoutUsesRectangularCollision(item = {}) {
  return item.node?.nodeType === 'file' || Boolean(item.width || item.height);
}

function layoutCollisionBox(item = {}, extraPadding = 0) {
  const padding = layoutCollisionPadding(item) + extraPadding;
  return {
    halfWidth: (layoutHorizontalRadius(item) || 0) + padding,
    halfHeight: (layoutVerticalRadius(item) || 0) + padding,
  };
}

function deterministicPairDirection(a, b, axis) {
  const first = a.node?.id || a.node?.stableId || '';
  const second = b.node?.id || b.node?.stableId || '';
  const key = first < second ? first + '|' + second : second + '|' + first;
  return seededUnit(key + ':' + axis) < 0.5 ? -1 : 1;
}

function clampLayoutNodeToCanvas(item, width, height) {
  const box = layoutCollisionBox(item);
  const minX = box.halfWidth + 28;
  const maxX = width - box.halfWidth - 28;
  const minY = box.halfHeight + 28;
  const maxY = height - box.halfHeight - 44;
  item.x = minX <= maxX ? clamp(item.x, minX, maxX) : width / 2;
  item.y = minY <= maxY ? clamp(item.y, minY, maxY) : height / 2;
}

function separateRectangularLayoutCollisions(nodes, width, height, { iterations = 36, extraPadding = 0 } = {}) {
  if (nodes.filter(layoutUsesRectangularCollision).length === 0) return;

  for (let tick = 0; tick < iterations; tick += 1) {
    let moved = false;
    const movedNodes = new Set();
    const strength = 1 - (tick / (iterations * 1.4));
    for (let index = 0; index < nodes.length; index += 1) {
      const a = nodes[index];
      const aBox = layoutCollisionBox(a, extraPadding);
      for (let next = index + 1; next < nodes.length; next += 1) {
        const b = nodes[next];
        if (!layoutUsesRectangularCollision(a) && !layoutUsesRectangularCollision(b)) continue;
        const bBox = layoutCollisionBox(b, extraPadding);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = aBox.halfWidth + bBox.halfWidth - Math.abs(dx);
        const overlapY = aBox.halfHeight + bBox.halfHeight - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        moved = true;
        if (overlapX <= overlapY) {
          const direction = dx === 0 ? deterministicPairDirection(a, b, 'x') : Math.sign(dx);
          const shift = ((overlapX / 2) + 1) * strength;
          a.x -= direction * shift;
          b.x += direction * shift;
        } else {
          const direction = dy === 0 ? deterministicPairDirection(a, b, 'y') : Math.sign(dy);
          const shift = ((overlapY / 2) + 1) * strength;
          a.y -= direction * shift;
          b.y += direction * shift;
        }
        movedNodes.add(a);
        movedNodes.add(b);
      }
    }

    for (const item of movedNodes) clampLayoutNodeToCanvas(item, width, height);
    if (!moved) return;
  }
}

function simulateForceLayout(layoutNodes, layoutEdges, clusterCenters, width, height, options = {}) {
  const nodes = Array.from(layoutNodes.values());
  if (nodes.length === 0) return;
  const center = { x: width / 2, y: height / 2 };
  const iterations = clamp(Math.round(520 - nodes.length * 2.2), 220, 520);
  const edgeStrength = nodes.length > 90 ? 0.018 : 0.026;
  const repelStrength = (nodes.length > 90 ? 5600 : 7200) * (options.repelScale || 1);
  const clusterStrength = (nodes.length > 90 ? 0.006 : 0.009) * (options.clusterScale || 1);
  const centerStrength = 0.0025;

  for (let tick = 0; tick < iterations; tick += 1) {
    const cooling = 1 - (tick / iterations);
    for (const item of nodes) {
      item.vx = (item.vx || 0) * 0.78;
      item.vy = (item.vy || 0) * 0.78;
    }

    for (let index = 0; index < nodes.length; index += 1) {
      const a = nodes[index];
      for (let next = index + 1; next < nodes.length; next += 1) {
        const b = nodes[next];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distanceSq = dx * dx + dy * dy;
        if (distanceSq < 0.01) {
          const seed = seededUnit(a.node.id + ':' + b.node.id);
          dx = Math.cos(seed * Math.PI * 2) * 0.1;
          dy = Math.sin(seed * Math.PI * 2) * 0.1;
          distanceSq = dx * dx + dy * dy;
        }
        const distance = Math.sqrt(distanceSq);
        const minDistance = layoutCollisionRadius(a) + layoutCollisionRadius(b) + 30;
        const collisionBoost = distance < minDistance ? (minDistance - distance) * 0.38 : 0;
        const force = ((repelStrength / Math.max(90, distanceSq)) + collisionBoost) * cooling;
        const ux = dx / distance;
        const uy = dy / distance;
        a.vx -= ux * force;
        a.vy -= uy * force;
        b.vx += ux * force;
        b.vy += uy * force;
      }
    }

    for (const edge of layoutEdges) {
      const source = layoutNodes.get(edge.sourceId);
      const target = layoutNodes.get(edge.targetId);
      if (!source || !target || source === target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const sameFile = source.node.modulePath === target.node.modulePath;
      const membership = edge.edgeType === 'membership';
      const desired = layoutCollisionRadius(source) + layoutCollisionRadius(target)
        + (membership ? 38 : (sameFile ? 74 : 118));
      const force = (distance - desired) * (membership ? edgeStrength * 2.7 : edgeStrength);
      const ux = dx / distance;
      const uy = dy / distance;
      source.vx += ux * force;
      source.vy += uy * force;
      target.vx -= ux * force;
      target.vy -= uy * force;
    }

    for (const item of nodes) {
      const cluster = clusterCenters.get(item.node.modulePath) || center;
      item.vx += (cluster.x - item.x) * clusterStrength * cooling;
      item.vy += (cluster.y - item.y) * clusterStrength * cooling;
      item.vx += (center.x - item.x) * centerStrength;
      item.vy += (center.y - item.y) * centerStrength;
      const collisionRadius = layoutCollisionRadius(item);
      item.x = clamp(item.x + item.vx, collisionRadius + 28, width - collisionRadius - 28);
      item.y = clamp(item.y + item.vy, collisionRadius + 28, height - collisionRadius - 44);
    }
  }

  separateRectangularLayoutCollisions(nodes, width, height, {
    iterations: options.rectangleSeparationIterations || 36,
    extraPadding: options.rectangleSeparationPadding || 0,
  });
}

function expandNetworkSpread(layoutNodes) {
  const nodes = Array.from(layoutNodes.values());
  if (nodes.length <= 1) return;
  const minX = Math.min(...nodes.map((item) => item.x));
  const maxX = Math.max(...nodes.map((item) => item.x));
  const minY = Math.min(...nodes.map((item) => item.y));
  const maxY = Math.max(...nodes.map((item) => item.y));
  const currentWidth = Math.max(1, maxX - minX);
  const currentHeight = Math.max(1, maxY - minY);
  const desiredWidth = clamp(Math.sqrt(nodes.length) * 122, 620, 980);
  const desiredHeight = clamp(Math.sqrt(nodes.length) * 84, 430, 660);
  const scaleX = Math.max(1, desiredWidth / currentWidth);
  const scaleY = Math.max(1, desiredHeight / currentHeight);
  if (scaleX <= 1.01 && scaleY <= 1.01) return;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  for (const item of nodes) {
    item.x = centerX + (item.x - centerX) * scaleX;
    item.y = centerY + (item.y - centerY) * scaleY;
  }
}

function normalizeNetworkBounds(layoutNodes) {
  const nodes = Array.from(layoutNodes.values());
  if (nodes.length === 0) {
    networkBaseWidth = 900;
    networkBaseHeight = 420;
    return { width: networkBaseWidth, height: networkBaseHeight };
  }

  const labelPadding = 72;
  const minX = Math.min(...nodes.map((item) => item.x - layoutHorizontalRadius(item) - labelPadding));
  const maxX = Math.max(...nodes.map((item) => item.x + layoutHorizontalRadius(item) + labelPadding));
  const minY = Math.min(...nodes.map((item) => item.y - layoutVerticalRadius(item) - 42));
  const maxY = Math.max(...nodes.map((item) => item.y + layoutVerticalRadius(item) + 54));
  const padding = 72;
  const width = Math.max(920, Math.ceil(maxX - minX + padding * 2));
  const height = Math.max(560, Math.ceil(maxY - minY + padding * 2));
  for (const item of nodes) {
    item.x = item.x - minX + padding;
    item.y = item.y - minY + padding;
  }
  networkBaseWidth = width;
  networkBaseHeight = height;
  return { width, height };
}

function networkLineExtents() {
  const lineCounts = networkFunctions().map(lineCountFor).filter((count) => count > 0);
  return {
    minLines: lineCounts.length ? Math.min(...lineCounts) : 1,
    maxLines: lineCounts.length ? Math.max(...lineCounts) : 1,
  };
}

function networkFileMeasureExtents() {
  const measures = networkFileNodes()
    .map((node) => compactCount(node.totalFunctionLines) || compactCount(node.functionCount))
    .filter((count) => count > 0);
  return {
    minMeasure: measures.length ? Math.min(...measures) : 1,
    maxMeasure: measures.length ? Math.max(...measures) : 1,
  };
}

function networkLayoutNode(node, x, y, { minLines, maxLines }, extra = {}) {
  return {
    node,
    x,
    y,
    radius: scaledNodeRadius(node, minLines, maxLines),
    color: fileColorByPath.get(node.modulePath) || '#64748b',
    ...extra,
  };
}

function fileLayoutNode(node, x, y, { minMeasure, maxMeasure }, extra = {}) {
  const radius = scaledFileRadius(node, minMeasure, maxMeasure);
  const width = fileNodeWidth(node, radius);
  const height = fileNodeHeight(radius);
  return {
    node,
    x,
    y,
    radius,
    width,
    height,
    edgeRadius: Math.max(width / 2, height / 2),
    collisionRadius: Math.hypot(width / 2, height / 2) + layoutCollisionPadding({ node }),
    color: fileColorByPath.get(node.modulePath) || '#64748b',
    ...extra,
  };
}

function functionNodesByFile(fileOrder) {
  const nodesByFile = new Map(fileOrder.map((modulePath) => [modulePath, []]));
  for (const node of networkFunctions()) {
    if (!nodesByFile.has(node.modulePath)) nodesByFile.set(node.modulePath, []);
    nodesByFile.get(node.modulePath).push(node);
  }
  for (const list of nodesByFile.values()) list.sort(sortFunctions);
  return nodesByFile;
}

function layoutForceFunctionNetwork(fileOrder, lineExtents, fileExtents) {
  const graphFunctions = networkFunctions();
  const graphEdges = networkEdges();
  const graphFileEdges = networkFileEdges();
  const graphFileByPath = networkFileByPath();
  if (!networkShowsFiles()) {
    const count = Math.max(1, graphFunctions.length);
    const width = Math.max(1040, Math.ceil(Math.sqrt(count) * 195));
    const height = Math.max(680, Math.ceil(Math.sqrt(count) * 155));
    const nodes = new Map();
    const clusterCenters = moduleClusterCenters(fileOrder, width, height);

    graphFunctions.forEach((node, index) => {
      const cluster = clusterCenters.get(node.modulePath) || { x: width / 2, y: height / 2 };
      const position = networkInitialPosition(node, index, graphFunctions.length, cluster, width, height);
      nodes.set(node.id, {
        ...networkLayoutNode(node, position.x, position.y, lineExtents),
        vx: 0,
        vy: 0,
      });
    });

    simulateForceLayout(nodes, graphEdges, clusterCenters, width, height);
    expandNetworkSpread(nodes);
    const bounds = normalizeNetworkBounds(nodes);
    networkLayout = { mode: 'network', width: bounds.width, height: bounds.height, nodes };
    return;
  }

  const visibleFileOrder = fileOrder.filter((modulePath) => graphFileByPath.has(modulePath));
  if (!networkShowsFunctions()) {
    const count = Math.max(1, visibleFileOrder.length);
    const width = Math.max(1120, Math.ceil(Math.sqrt(count) * 335));
    const height = Math.max(760, Math.ceil(Math.sqrt(count) * 245));
    const clusterCenters = moduleClusterCenters(visibleFileOrder, width, height);
    const nodes = new Map();

    visibleFileOrder.forEach((modulePath, index) => {
      const node = graphFileByPath.get(modulePath);
      const cluster = clusterCenters.get(modulePath) || { x: width / 2, y: height / 2 };
      const position = networkInitialPosition(node, index, visibleFileOrder.length, cluster, width, height);
      nodes.set(node.id, {
        ...fileLayoutNode(node, position.x, position.y, fileExtents),
        vx: 0,
        vy: 0,
      });
    });

    simulateForceLayout(nodes, graphFileEdges, clusterCenters, width, height, {
      repelScale: 1.35,
      clusterScale: 1.15,
      rectangleSeparationIterations: 60,
      rectangleSeparationPadding: 10,
    });
    expandNetworkSpread(nodes);
    const bounds = normalizeNetworkBounds(nodes);
    networkLayout = { mode: 'network', width: bounds.width, height: bounds.height, nodes };
    return;
  }

  const count = Math.max(1, graphFunctions.length + visibleFileOrder.length);
  const width = Math.max(1120, Math.ceil(Math.sqrt(count) * 185));
  const height = Math.max(760, Math.ceil(Math.sqrt(count) * 145));
  const nodes = new Map();
  const clusterCenters = moduleClusterCenters(fileOrder, width, height);

  visibleFileOrder.forEach((modulePath) => {
    const fileNode = graphFileByPath.get(modulePath);
    const cluster = clusterCenters.get(modulePath) || { x: width / 2, y: height / 2 };
    nodes.set(fileNode.id, {
      ...fileLayoutNode(fileNode, cluster.x, cluster.y, fileExtents),
      vx: 0,
      vy: 0,
    });
  });

  graphFunctions.forEach((node, index) => {
    const cluster = clusterCenters.get(node.modulePath) || { x: width / 2, y: height / 2 };
    const siblings = networkFunctionsForFile(node.modulePath);
    const siblingCount = siblings.length;
    const siblingIndex = siblings.findIndex((candidate) => candidate.id === node.id);
    const position = networkInitialPosition(node, siblingIndex >= 0 ? siblingIndex : index, siblingCount || graphFunctions.length, cluster, width, height);
    nodes.set(node.id, {
      ...networkLayoutNode(node, position.x, position.y, lineExtents),
      vx: 0,
      vy: 0,
    });
  });

  simulateForceLayout(nodes, [...graphEdges, ...membershipEdges()], clusterCenters, width, height);
  expandNetworkSpread(nodes);
  const bounds = normalizeNetworkBounds(nodes);
  networkLayout = { mode: 'network', width: bounds.width, height: bounds.height, nodes };
}

function layoutByFileFunctionNetwork(fileOrder, lineExtents, fileExtents) {
  const graphFileByPath = networkFileByPath();
  const nodesByFile = functionNodesByFile(fileOrder);
  const visibleFileOrder = fileOrder.filter((modulePath) => (nodesByFile.get(modulePath) || []).length > 0);

  if (networkShowsFiles() && !networkShowsFunctions()) {
    const columns = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(visibleFileOrder.length * 1.25))));
    const rows = Math.max(1, Math.ceil(visibleFileOrder.length / columns));
    const cellWidth = 245;
    const cellHeight = 155;
    const laneWidth = 212;
    const laneHeight = 116;
    const marginX = 126;
    const marginY = 96;
    const width = Math.max(920, marginX * 2 + Math.max(0, columns - 1) * cellWidth);
    const height = Math.max(560, marginY * 2 + Math.max(0, rows - 1) * cellHeight);
    const nodes = new Map();
    const lanes = [];

    visibleFileOrder.forEach((modulePath, fileIndex) => {
      const column = fileIndex % columns;
      const row = Math.floor(fileIndex / columns);
      const x = marginX + column * cellWidth;
      const y = marginY + row * cellHeight;
      lanes.push({
        modulePath,
        x: x - laneWidth / 2,
        y: y - laneHeight / 2,
        width: laneWidth,
        height: laneHeight,
      });
      const fileNode = graphFileByPath.get(modulePath);
      nodes.set(fileNode.id, fileLayoutNode(fileNode, x, y, fileExtents));
    });

    networkBaseWidth = width;
    networkBaseHeight = height;
    networkLayout = { mode: 'by-file', width, height, lanes, nodes };
    return;
  }

  if (networkShowsFilesAndFunctions()) {
    const columnGap = 255;
    const laneWidth = 218;
    const rowGap = 66;
    const marginX = 118;
    const hubY = 82;
    const firstFunctionY = 150;
    const maxRows = Math.max(1, ...visibleFileOrder.map((modulePath) => nodesByFile.get(modulePath).length));
    const width = Math.max(960, marginX * 2 + Math.max(1, visibleFileOrder.length - 1) * columnGap + laneWidth);
    const height = Math.max(620, firstFunctionY + (maxRows - 1) * rowGap + 110);
    const nodes = new Map();
    const lanes = [];

    visibleFileOrder.forEach((modulePath, fileIndex) => {
      const x = marginX + fileIndex * columnGap;
      lanes.push({
        modulePath,
        x: x - laneWidth / 2,
        y: 34,
        width: laneWidth,
        height: height - 68,
      });
      const fileNode = graphFileByPath.get(modulePath);
      nodes.set(fileNode.id, fileLayoutNode(fileNode, x, hubY, fileExtents));
      const list = nodesByFile.get(modulePath) || [];
      list.forEach((node, index) => {
        nodes.set(node.id, networkLayoutNode(node, x, firstFunctionY + index * rowGap, lineExtents));
      });
    });

    networkBaseWidth = width;
    networkBaseHeight = height;
    networkLayout = { mode: 'by-file', width, height, lanes, nodes };
    return;
  }

  const columnGap = 245;
  const laneWidth = 205;
  const rowGap = 66;
  const marginX = 110;
  const marginY = 78;
  const maxRows = Math.max(1, ...visibleFileOrder.map((modulePath) => nodesByFile.get(modulePath).length));
  const width = Math.max(920, marginX * 2 + Math.max(1, visibleFileOrder.length - 1) * columnGap + laneWidth);
  const height = Math.max(560, marginY * 2 + (maxRows - 1) * rowGap + 100);
  const nodes = new Map();
  const lanes = [];

  visibleFileOrder.forEach((modulePath, fileIndex) => {
    const x = marginX + fileIndex * columnGap;
    lanes.push({
      modulePath,
      x: x - laneWidth / 2,
      y: 34,
      width: laneWidth,
      height: height - 68,
    });
    const list = nodesByFile.get(modulePath) || [];
    list.forEach((node, index) => {
      nodes.set(node.id, networkLayoutNode(node, x, marginY + index * rowGap, lineExtents));
    });
  });

  networkBaseWidth = width;
  networkBaseHeight = height;
  networkLayout = { mode: 'by-file', width, height, lanes, nodes };
}

function compareFunctionIds(a, b) {
  return sortFunctions(functionById.get(a), functionById.get(b));
}

function sortedFunctionIds(ids) {
  return Array.from(ids || [])
    .filter((id) => functionById.has(id))
    .sort(compareFunctionIds);
}

function radialGraphIndexes() {
  const graphFunctions = networkFunctions();
  const graphEdges = networkEdges();
  const outgoing = new Map(graphFunctions.map((node) => [node.id, new Set()]));
  const incoming = new Map(graphFunctions.map((node) => [node.id, new Set()]));
  const undirected = new Map(graphFunctions.map((node) => [node.id, new Set()]));
  for (const edge of graphEdges) {
    if (!outgoing.has(edge.sourceId) || !outgoing.has(edge.targetId)) continue;
    outgoing.get(edge.sourceId).add(edge.targetId);
    incoming.get(edge.targetId).add(edge.sourceId);
    undirected.get(edge.sourceId).add(edge.targetId);
    undirected.get(edge.targetId).add(edge.sourceId);
  }
  return { outgoing, incoming, undirected };
}

function connectedRadialComponents(undirected) {
  const graphFunctions = networkFunctions();
  const remaining = new Set(graphFunctions.map((node) => node.id));
  const components = [];
  for (const node of graphFunctions) {
    if (!remaining.has(node.id)) continue;
    const component = [];
    const stack = [node.id];
    remaining.delete(node.id);
    while (stack.length > 0) {
      const currentId = stack.pop();
      component.push(currentId);
      for (const nextId of sortedFunctionIds(undirected.get(currentId))) {
        if (!remaining.has(nextId)) continue;
        remaining.delete(nextId);
        stack.push(nextId);
      }
    }
    component.sort(compareFunctionIds);
    components.push(component);
  }
  return components.sort((a, b) => compareFunctionIds(a[0], b[0]));
}

function neighborCountWithin(neighborIds, componentSet) {
  return sortedFunctionIds(neighborIds).filter((id) => componentSet.has(id)).length;
}

function compareRadialRootCandidates(a, b, componentSet, indexes) {
  const aIncoming = neighborCountWithin(indexes.incoming.get(a), componentSet);
  const bIncoming = neighborCountWithin(indexes.incoming.get(b), componentSet);
  const aOutgoing = neighborCountWithin(indexes.outgoing.get(a), componentSet);
  const bOutgoing = neighborCountWithin(indexes.outgoing.get(b), componentSet);
  const aSourceRank = aIncoming === 0 ? 0 : 1;
  const bSourceRank = bIncoming === 0 ? 0 : 1;
  if (aSourceRank !== bSourceRank) return aSourceRank - bSourceRank;
  if (aOutgoing !== bOutgoing) return bOutgoing - aOutgoing;
  const aBalance = aOutgoing - aIncoming;
  const bBalance = bOutgoing - bIncoming;
  if (aBalance !== bBalance) return bBalance - aBalance;
  return compareFunctionIds(a, b);
}

function radialRootsForComponent(componentIds, indexes) {
  const componentSet = new Set(componentIds);
  const sourceRoots = componentIds
    .filter((id) => neighborCountWithin(indexes.incoming.get(id), componentSet) === 0)
    .sort((a, b) => compareRadialRootCandidates(a, b, componentSet, indexes));
  if (sourceRoots.length > 0) return sourceRoots;
  return [componentIds.slice().sort((a, b) => compareRadialRootCandidates(a, b, componentSet, indexes))[0]];
}

function applyRadialBreadthFirstAssignment(queue, componentSet, adjacency, rootById, distanceById) {
  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentRootId = rootById.get(currentId);
    const currentDistance = distanceById.get(currentId) || 0;
    const neighbors = sortedFunctionIds(adjacency.get(currentId)).filter((id) => componentSet.has(id));
    for (const nextId of neighbors) {
      if (rootById.has(nextId)) continue;
      rootById.set(nextId, currentRootId);
      distanceById.set(nextId, currentDistance + 1);
      queue.push(nextId);
    }
  }
}

function radialAssignmentsForComponent(componentIds, rootIds, indexes) {
  const componentSet = new Set(componentIds);
  const rootById = new Map();
  const distanceById = new Map();
  const roots = rootIds.slice().sort(compareFunctionIds);
  for (const rootId of roots) {
    rootById.set(rootId, rootId);
    distanceById.set(rootId, 0);
  }

  applyRadialBreadthFirstAssignment(roots.slice(), componentSet, indexes.outgoing, rootById, distanceById);
  applyRadialBreadthFirstAssignment(roots.slice(), componentSet, indexes.undirected, rootById, distanceById);

  for (const id of componentIds) {
    if (rootById.has(id)) continue;
    const rootId = roots[0];
    rootById.set(id, rootId);
    distanceById.set(id, 1);
  }
  return { rootById, distanceById };
}

function radialRootGroups(indexes) {
  const groups = [];
  for (const componentIds of connectedRadialComponents(indexes.undirected)) {
    const roots = radialRootsForComponent(componentIds, indexes);
    const assignments = radialAssignmentsForComponent(componentIds, roots, indexes);
    const groupsByRoot = new Map(roots.map((rootId) => [rootId, {
      rootId,
      nodeIds: [],
      distanceById: new Map(),
      rings: new Map(),
    }]));
    for (const id of componentIds) {
      const rootId = assignments.rootById.get(id) || roots[0];
      const group = groupsByRoot.get(rootId) || groupsByRoot.get(roots[0]);
      const distance = assignments.distanceById.get(id) || 0;
      group.nodeIds.push(id);
      group.distanceById.set(id, distance);
      if (!group.rings.has(distance)) group.rings.set(distance, []);
      group.rings.get(distance).push(functionById.get(id));
    }
    for (const group of groupsByRoot.values()) {
      if (group.nodeIds.length === 0) continue;
      group.nodeIds.sort((a, b) => (group.distanceById.get(a) || 0) - (group.distanceById.get(b) || 0)
        || compareFunctionIds(a, b));
      for (const ring of group.rings.values()) ring.sort(sortFunctions);
      groups.push(group);
    }
  }
  return groups.sort((a, b) => compareFunctionIds(a.rootId, b.rootId));
}

function assignRadialSectors(groups) {
  if (groups.length === 0) return;
  if (groups.length === 1) {
    groups[0].startAngle = -Math.PI / 2;
    groups[0].endAngle = groups[0].startAngle + Math.PI * 2;
    return;
  }

  const gap = Math.min(0.11, (Math.PI * 2) / (groups.length * 7));
  const available = Math.PI * 2 - gap * groups.length;
  const weights = groups.map((group) => Math.sqrt(group.nodeIds.length));
  const totalWeight = weights.reduce((total, weight) => total + weight, 0) || 1;
  let cursor = -Math.PI / 2;
  groups.forEach((group, index) => {
    const span = available * (weights[index] / totalWeight);
    group.startAngle = cursor + gap / 2;
    group.endAngle = group.startAngle + span;
    cursor += span + gap;
  });
}

function radialRingRadii(groups) {
  const multipleRoots = groups.length > 1;
  const ringGap = 150;
  const minArcSpacing = 86;
  const baseRadius = multipleRoots
    ? Math.max(86, (groups.length * minArcSpacing) / (Math.PI * 2))
    : 0;
  const maxDistance = Math.max(0, ...groups.flatMap((group) => Array.from(group.rings.keys())));
  const radii = new Map([[0, baseRadius]]);

  for (let distance = 1; distance <= maxDistance; distance += 1) {
    let radius = baseRadius + distance * ringGap;
    for (const group of groups) {
      const count = safeArray(group.rings.get(distance)).length;
      if (count <= 1) continue;
      const span = Math.max(0.28, group.endAngle - group.startAngle);
      radius = Math.max(radius, (count * minArcSpacing) / span);
    }
    radii.set(distance, radius);
  }
  return radii;
}

function radialAngleFor(group, distance, index, count) {
  const middle = (group.startAngle + group.endAngle) / 2;
  if (distance === 0) return middle;
  const span = group.endAngle - group.startAngle;
  if (span >= Math.PI * 2 - 0.001) {
    if (count <= 1) return -Math.PI / 2;
    return -Math.PI / 2 + (index * Math.PI * 2) / count;
  }
  if (count <= 1) return middle;
  return group.startAngle + ((index + 0.5) * span) / count;
}

function layoutRadialFunctionNetwork(lineExtents) {
  const nodes = new Map();
  if (networkFunctions().length === 0) {
    networkBaseWidth = 900;
    networkBaseHeight = 420;
    networkLayout = { mode: 'radial', width: networkBaseWidth, height: networkBaseHeight, nodes, center: { x: 450, y: 210 } };
    return;
  }

  const groups = radialRootGroups(radialGraphIndexes());
  assignRadialSectors(groups);
  const radii = radialRingRadii(groups);
  const maxRadius = Math.max(0, ...radii.values());
  const padding = 160;
  const width = Math.max(980, Math.ceil(maxRadius * 2 + padding * 2));
  const height = Math.max(640, Math.ceil(maxRadius * 2 + padding * 2));
  const center = { x: width / 2, y: height / 2 };

  for (const group of groups) {
    for (const [distance, ring] of Array.from(group.rings.entries()).sort((a, b) => a[0] - b[0])) {
      const radius = radii.get(distance) || 0;
      ring.forEach((node, index) => {
        const angle = radialAngleFor(group, distance, index, ring.length);
        nodes.set(node.id, networkLayoutNode(
          node,
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius,
          lineExtents,
          { radialAngle: angle, radialDistance: distance, radialRootId: group.rootId },
        ));
      });
    }
  }

  networkBaseWidth = width;
  networkBaseHeight = height;
  networkLayout = { mode: 'radial', width, height, nodes, center };
}

function radialSectorForIndex(index, count) {
  if (count <= 1) {
    return { startAngle: -Math.PI / 2, endAngle: (-Math.PI / 2) + Math.PI * 2 };
  }
  const fullSpan = (Math.PI * 2) / count;
  const gap = Math.min(0.12, fullSpan * 0.18);
  const startAngle = (-Math.PI / 2) + index * fullSpan + gap / 2;
  return { startAngle, endAngle: startAngle + fullSpan - gap };
}

function layoutRadialFileNetwork(fileOrder, fileExtents) {
  const graphFileByPath = networkFileByPath();
  const visibleFileOrder = fileOrder.filter((modulePath) => graphFileByPath.has(modulePath));
  const nodes = new Map();
  if (visibleFileOrder.length === 0) {
    networkBaseWidth = 900;
    networkBaseHeight = 420;
    networkLayout = { mode: 'radial', width: networkBaseWidth, height: networkBaseHeight, nodes, center: { x: 450, y: 210 } };
    return;
  }

  const count = visibleFileOrder.length;
  const radius = count <= 1 ? 0 : Math.max(220, (count * 138) / (Math.PI * 2));
  const padding = 230;
  const width = Math.max(980, Math.ceil(radius * 2 + padding * 2));
  const height = Math.max(640, Math.ceil(radius * 2 + padding * 2));
  const center = { x: width / 2, y: height / 2 };

  visibleFileOrder.forEach((modulePath, index) => {
    const sector = radialSectorForIndex(index, count);
    const angle = (sector.startAngle + sector.endAngle) / 2;
    const node = graphFileByPath.get(modulePath);
    nodes.set(node.id, fileLayoutNode(
      node,
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius,
      fileExtents,
      { radialAngle: angle, radialDistance: 0, radialRootId: node.id },
    ));
  });

  networkBaseWidth = width;
  networkBaseHeight = height;
  networkLayout = { mode: 'radial', width, height, nodes, center };
}

function radialChildCapacity(sectorSpan, radius) {
  return Math.max(1, Math.floor((sectorSpan * Math.max(1, radius)) / 78));
}

function layoutRadialFileFunctionNetwork(fileOrder, lineExtents, fileExtents) {
  const graphFileByPath = networkFileByPath();
  const visibleFileOrder = fileOrder.filter((modulePath) => graphFileByPath.has(modulePath));
  const nodesByFile = functionNodesByFile(fileOrder);
  const nodes = new Map();
  if (visibleFileOrder.length === 0) {
    networkBaseWidth = 900;
    networkBaseHeight = 420;
    networkLayout = { mode: 'radial', width: networkBaseWidth, height: networkBaseHeight, nodes, center: { x: 450, y: 210 } };
    return;
  }

  const count = visibleFileOrder.length;
  const hubRadius = count <= 1 ? 0 : Math.max(220, (count * 136) / (Math.PI * 2));
  const baseChildRadius = count <= 1 ? 145 : hubRadius + 118;
  const ringGap = 92;
  let maxOuterRadius = baseChildRadius;
  const sectors = new Map();

  visibleFileOrder.forEach((modulePath, index) => {
    const sector = radialSectorForIndex(index, count);
    const sectorSpan = sector.endAngle - sector.startAngle;
    const childCount = (nodesByFile.get(modulePath) || []).length;
    let remaining = childCount;
    let ring = 0;
    while (remaining > 0) {
      const ringRadius = baseChildRadius + ring * ringGap;
      const capacity = count <= 1
        ? Math.max(6, radialChildCapacity(Math.PI * 2, ringRadius))
        : radialChildCapacity(sectorSpan, ringRadius);
      remaining -= capacity;
      maxOuterRadius = Math.max(maxOuterRadius, ringRadius);
      ring += 1;
    }
    sectors.set(modulePath, sector);
  });

  const padding = 230;
  const width = Math.max(1080, Math.ceil(maxOuterRadius * 2 + padding * 2));
  const height = Math.max(720, Math.ceil(maxOuterRadius * 2 + padding * 2));
  const center = { x: width / 2, y: height / 2 };

  visibleFileOrder.forEach((modulePath) => {
    const sector = sectors.get(modulePath);
    const angle = (sector.startAngle + sector.endAngle) / 2;
    const fileNode = graphFileByPath.get(modulePath);
    nodes.set(fileNode.id, fileLayoutNode(
      fileNode,
      center.x + Math.cos(angle) * hubRadius,
      center.y + Math.sin(angle) * hubRadius,
      fileExtents,
      { radialAngle: angle, radialDistance: 0, radialRootId: fileNode.id },
    ));

    const list = nodesByFile.get(modulePath) || [];
    let cursor = 0;
    let ring = 0;
    while (cursor < list.length) {
      const ringRadius = baseChildRadius + ring * ringGap;
      const sectorSpan = sector.endAngle - sector.startAngle;
      const capacity = count <= 1
        ? Math.max(6, radialChildCapacity(Math.PI * 2, ringRadius))
        : radialChildCapacity(sectorSpan, ringRadius);
      const ringItems = list.slice(cursor, cursor + capacity);
      ringItems.forEach((node, itemIndex) => {
        const itemAngle = count <= 1
          ? (-Math.PI / 2) + (Math.PI * 2 * itemIndex) / Math.max(1, ringItems.length)
          : (ringItems.length <= 1
            ? angle
            : sector.startAngle + ((itemIndex + 0.5) * sectorSpan) / ringItems.length);
        nodes.set(node.id, networkLayoutNode(
          node,
          center.x + Math.cos(itemAngle) * ringRadius,
          center.y + Math.sin(itemAngle) * ringRadius,
          lineExtents,
          { radialAngle: itemAngle, radialDistance: ring + 1, radialRootId: fileNode.id },
        ));
      });
      cursor += ringItems.length;
      ring += 1;
    }
  });

  networkBaseWidth = width;
  networkBaseHeight = height;
  networkLayout = { mode: 'radial', width, height, nodes, center };
}

function layoutFunctionNetwork() {
  visibleNetworkGraph = computeVisibleNetworkGraph();
  const fileOrder = buildModuleOrder();
  assignFileColors(fileOrder);
  renderFileLegend(fileOrder);
  const lineExtents = networkLineExtents();
  const fileExtents = networkFileMeasureExtents();

  networkNeedsFit = true;

  if (activeNetworkLayoutMode === 'radial') {
    if (networkShowsFilesAndFunctions()) {
      layoutRadialFileFunctionNetwork(fileOrder, lineExtents, fileExtents);
      return;
    }
    if (networkShowsFiles()) {
      layoutRadialFileNetwork(fileOrder, fileExtents);
      return;
    }
    layoutRadialFunctionNetwork(lineExtents);
    return;
  }
  if (activeNetworkLayoutMode === 'by-file') {
    layoutByFileFunctionNetwork(fileOrder, lineExtents, fileExtents);
    return;
  }
  layoutForceFunctionNetwork(fileOrder, lineExtents, fileExtents);
}

function edgeEndpoint(source, target, sourceRadius, targetRadius) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    startX: source.x + (dx / length) * sourceRadius,
    startY: source.y + (dy / length) * sourceRadius,
    endX: target.x - (dx / length) * (targetRadius + 5),
    endY: target.y - (dy / length) * (targetRadius + 5),
  };
}

function selfEdgePath(source) {
  if (networkLayout.mode === 'radial') {
    const r = source.radius + 28;
    const angle = Number.isFinite(source.radialAngle) ? source.radialAngle : -Math.PI / 2;
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const startX = source.x + radialX * source.radius;
    const startY = source.y + radialY * source.radius;
    return [
      'M', startX, startY,
      'C', startX + tangentX * r + radialX * 18, startY + tangentY * r + radialY * 18,
      startX - tangentX * r + radialX * 18, startY - tangentY * r + radialY * 18,
      source.x - radialX * source.radius, source.y - radialY * source.radius,
    ].join(' ');
  }
  if (networkLayout.mode === 'network') {
    const r = source.radius + 34;
    return [
      'M', source.x + source.radius, source.y,
      'C', source.x + r, source.y - r,
      source.x - r, source.y - r,
      source.x - source.radius, source.y,
    ].join(' ');
  }
  if (networkLayout.mode === 'by-file') {
    const r = source.radius + 20;
    return [
      'M', source.x + source.radius, source.y,
      'C', source.x + r, source.y - r,
      source.x + r, source.y + r,
      source.x + source.radius, source.y + 2,
    ].join(' ');
  }
  return forceEdgePath({ id: source.node.id, sourceId: source.node.id, targetId: source.node.id }, source, source);
}

function forceEdgePath(edge, source, target) {
  const endpoints = edgeEndpoint(source, target, layoutEdgeRadius(source), layoutEdgeRadius(target));
  const dx = endpoints.endX - endpoints.startX;
  const dy = endpoints.endY - endpoints.startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const bendSeed = seededUnit(edge.id || (edge.sourceId + ':' + edge.targetId));
  const bendSign = bendSeed < 0.5 ? -1 : 1;
  const sameFile = source.node.modulePath === target.node.modulePath;
  const offset = bendSign * Math.min(80, Math.max(18, length * (sameFile ? 0.16 : 0.1)));
  const middleX = (endpoints.startX + endpoints.endX) / 2 - (dy / length) * offset;
  const middleY = (endpoints.startY + endpoints.endY) / 2 + (dx / length) * offset;
  return [
    'M', endpoints.startX, endpoints.startY,
    'Q', middleX, middleY,
    endpoints.endX, endpoints.endY,
  ].join(' ');
}

function radialEdgePath(edge, source, target) {
  const endpoints = edgeEndpoint(source, target, layoutEdgeRadius(source), layoutEdgeRadius(target));
  const center = networkLayout.center || { x: networkLayout.width / 2, y: networkLayout.height / 2 };
  const dx = endpoints.endX - endpoints.startX;
  const dy = endpoints.endY - endpoints.startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const middleX = (endpoints.startX + endpoints.endX) / 2;
  const middleY = (endpoints.startY + endpoints.endY) / 2;
  const sourceDistance = source.radialDistance || 0;
  const targetDistance = target.radialDistance || 0;
  const sameRing = sourceDistance === targetDistance;
  const sameRoot = source.radialRootId && source.radialRootId === target.radialRootId;

  let controlX = middleX;
  let controlY = middleY;
  if (sameRing || !sameRoot) {
    const radialX = middleX - center.x;
    const radialY = middleY - center.y;
    const radialLength = Math.max(1, Math.hypot(radialX, radialY));
    const outward = sameRoot ? 1 : (seededUnit(edge.id || edge.sourceId + ':' + edge.targetId) < 0.5 ? -1 : 1);
    const offset = Math.min(180, Math.max(44, length * 0.24));
    controlX = middleX + (radialX / radialLength) * offset * outward;
    controlY = middleY + (radialY / radialLength) * offset * outward;
  } else {
    const bendSign = seededUnit(edge.id || edge.sourceId + ':' + edge.targetId) < 0.5 ? -1 : 1;
    const offset = bendSign * Math.min(120, Math.max(32, length * 0.16));
    controlX = middleX - (dy / length) * offset;
    controlY = middleY + (dx / length) * offset;
  }

  return [
    'M', endpoints.startX, endpoints.startY,
    'Q', controlX, controlY,
    endpoints.endX, endpoints.endY,
  ].join(' ');
}

function byFileEdgePath(source, target) {
  const endpoints = edgeEndpoint(source, target, layoutEdgeRadius(source), layoutEdgeRadius(target));
  if (source.node.modulePath === target.node.modulePath) {
    const curveX = Math.max(source.x, target.x) + 72;
    return [
      'M', endpoints.startX, endpoints.startY,
      'C', curveX, endpoints.startY,
      curveX, endpoints.endY,
      endpoints.endX, endpoints.endY,
    ].join(' ');
  }
  const middleX = (endpoints.startX + endpoints.endX) / 2;
  return [
    'M', endpoints.startX, endpoints.startY,
    'C', middleX, endpoints.startY,
    middleX, endpoints.endY,
    endpoints.endX, endpoints.endY,
  ].join(' ');
}

function edgePath(edge) {
  const source = networkLayout.nodes.get(edge.sourceId);
  const target = networkLayout.nodes.get(edge.targetId);
  if (!source || !target) return '';
  if (edge.sourceId === edge.targetId) return selfEdgePath(source);
  if (networkLayout.mode === 'radial') return radialEdgePath(edge, source, target);
  if (networkLayout.mode === 'by-file') return byFileEdgePath(source, target);
  return forceEdgePath(edge, source, target);
}

function connectionSummary(node) {
  const incoming = safeArray(edgesByTargetId.get(node.id)).length;
  const outgoing = safeArray(edgesBySourceId.get(node.id)).length;
  const extras = externalRelationshipsForNode(node).length;
  return incoming + ' ' + plural(incoming, 'function') + ' use it; it uses '
    + (outgoing + extras) + ' ' + plural(outgoing + extras, 'thing') + '.';
}

function fileConnectionSummary(node = {}) {
  const incoming = safeArray(fileEdgesByTargetPath.get(node.modulePath)).length;
  const outgoing = safeArray(fileEdgesBySourcePath.get(node.modulePath)).length;
  return incoming + ' ' + plural(incoming, 'file') + ' use it; it uses '
    + outgoing + ' ' + plural(outgoing, 'file') + '.';
}

function nodeAriaLabel(node) {
  if (node?.nodeType === 'file') {
    return node.modulePath + ', file. '
      + compactCount(node.functionCount) + ' ' + plural(compactCount(node.functionCount), 'function') + ', '
      + compactCount(node.totalFunctionLines) + ' total function '
      + plural(compactCount(node.totalFunctionLines), 'line') + '. '
      + fileConnectionSummary(node);
  }
  return displayName(node) + ', ' + fileName(node.modulePath) + ', '
    + lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line') + '. '
    + connectionSummary(node);
}

function fileEdgeCallLabel(edge = {}) {
  const callCount = compactCount(edge.callCount);
  const functionEdgeCount = compactCount(edge.functionEdgeCount);
  if (functionEdgeCount > 0 && functionEdgeCount !== callCount) {
    return callCount + ' saved ' + plural(callCount, 'call') + ' across '
      + functionEdgeCount + ' function ' + plural(functionEdgeCount, 'link');
  }
  return callCount + ' saved ' + plural(callCount, 'call');
}

function edgeAriaLabel(edge) {
  if (edge.edgeType === 'membership') {
    const source = fileByPath.get(edge.sourceFilePath);
    const target = functionById.get(edge.targetId);
    return displayName(target) + ' belongs to ' + (source?.modulePath || edge.sourceFilePath) + '.';
  }
  if (edge.edgeType === 'file-call') {
    return (edge.sourceFilePath || 'unknown file') + ' uses '
      + (edge.targetFilePath || 'unknown file') + ': '
      + fileEdgeCallLabel(edge) + '. Select ' + (edge.targetFilePath || 'that file') + '.';
  }
  const source = functionById.get(edge.sourceId);
  const target = functionById.get(edge.targetId);
  return displayName(source) + ' uses ' + displayName(target) + '. Select ' + displayName(target) + '.';
}

function addKeyboardActivation(element, callback) {
  element.addEventListener('click', callback);
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    callback(event);
  });
}

function renderFunctionNetwork() {
  networkSvgEl.textContent = '';
  const graph = networkGraph();
  const hasRenderableNodes = networkShowsFunctions()
    ? graph.functions.length > 0
    : graph.fileNodes.length > 0;
  if (!networkLayout || !hasRenderableNodes) {
    networkSvgEl.setAttribute('viewBox', '0 0 900 420');
    const message = createSvgElement('text', {
      x: 36,
      y: 54,
      fill: '#667085',
      'font-size': 16,
      'font-weight': 700,
    });
    const emptyMessage = emptyNetworkMessage(graph);
    message.textContent = emptyMessage;
    networkSvgEl.appendChild(message);
    latestFunctionGraphStatus = graphStatusLabel(activeNetworkLayoutMode)
      + ': ' + emptyMessage.charAt(0).toLowerCase() + emptyMessage.slice(1);
    updateVisualizationStatus();
    return;
  }

  networkSvgEl.setAttribute('viewBox', '0 0 ' + networkLayout.width + ' ' + networkLayout.height);
  networkSvgEl.setAttribute('aria-label', graphStatusLabel(networkLayout.mode));
  networkSvgEl.style.width = (networkLayout.width * networkZoom) + 'px';
  networkSvgEl.style.height = (networkLayout.height * networkZoom) + 'px';
  networkSvgEl.classList.toggle('has-file-nodes', networkShowsFiles());
  networkSvgEl.classList.toggle('has-function-nodes', networkShowsFunctions());
  networkSvgEl.classList.toggle('has-file-hubs', networkShowsFilesAndFunctions());

  const defs = createSvgElement('defs');
  const marker = createSvgElement('marker', {
    id: 'network-arrow',
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto',
  });
  const markerPath = createSvgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#718096' });
  marker.appendChild(markerPath);
  defs.appendChild(marker);
  networkSvgEl.appendChild(defs);

  if (safeArray(networkLayout.lanes).length > 0) {
    const laneGroup = createSvgElement('g', { class: 'file-lanes' });
    for (const lane of networkLayout.lanes) {
      laneGroup.appendChild(createSvgElement('rect', {
        class: 'file-lane',
        x: lane.x,
        y: lane.y,
        width: lane.width,
        height: lane.height,
        rx: 10,
      }));
      const label = createSvgElement('text', {
        class: 'file-lane-label',
        x: lane.x + 12,
        y: lane.y + 22,
      });
      label.textContent = shortLabel(lane.modulePath, 25);
      const title = createSvgElement('title');
      title.textContent = lane.modulePath;
      label.appendChild(title);
      laneGroup.appendChild(label);
    }
    networkSvgEl.appendChild(laneGroup);
  }

  const membershipGroup = createSvgElement('g', { class: 'network-membership-edges' });
  for (const edge of membershipEdges()) {
    const path = edgePath(edge);
    if (!path) continue;
    const label = edgeAriaLabel(edge);
    const visiblePath = createSvgElement('path', {
      class: 'network-edge is-membership',
      d: path,
      'data-edge-id': edge.id,
      'data-source-id': edge.sourceId,
      'data-target-id': edge.targetId,
      'data-source-file': edge.sourceFilePath,
      'data-target-file': edge.targetFilePath,
      'aria-hidden': 'true',
      focusable: 'false',
      'aria-label': label,
    });
    const title = createSvgElement('title');
    title.textContent = label;
    visiblePath.appendChild(title);
    membershipGroup.appendChild(visiblePath);
  }
  networkSvgEl.appendChild(membershipGroup);

  const edgeGroup = createSvgElement('g', { class: 'network-edges' });
  const visibleCallEdges = networkUsesFileSemanticEdges() ? networkFileEdges() : networkEdges();
  for (const edge of visibleCallEdges) {
    const path = edgePath(edge);
    if (!path) continue;
    const label = edgeAriaLabel(edge);
    const fileEdge = edge.edgeType === 'file-call';
    const visiblePath = createSvgElement('path', {
      class: 'network-edge' + (fileEdge ? ' is-file-call' : ''),
      d: path,
      'data-edge-id': edge.id,
      'data-source-id': edge.sourceId,
      'data-target-id': edge.targetId,
      'data-source-file': fileEdge ? edge.sourceFilePath : edge.sourceModulePath,
      'data-target-file': fileEdge ? edge.targetFilePath : edge.targetModulePath,
      'marker-end': 'url(#network-arrow)',
      role: 'button',
      tabindex: 0,
      focusable: 'true',
      'aria-label': label,
      style: fileEdge ? '--edge-width:' + clamp(1.8 + Math.sqrt(compactCount(edge.callCount)) * 0.36, 2.1, 4.8).toFixed(2) + 'px' : null,
    });
    const hitPath = createSvgElement('path', {
      class: 'network-edge-hit',
      d: path,
      'aria-hidden': 'true',
      'data-edge-id': edge.id,
    });
    const title = createSvgElement('title');
    title.textContent = label;
    visiblePath.appendChild(title);
    const activate = (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      if (fileEdge) {
        selectFile(edge.targetFilePath, { reason: 'select-file-edge', restoreFocusEl: visiblePath, scroll: true });
      } else {
        selectFunction(edge.targetId, { reason: 'select-function-edge', restoreFocusEl: visiblePath, scroll: true });
      }
    };
    addKeyboardActivation(visiblePath, activate);
    hitPath.addEventListener('click', activate);
    edgeGroup.append(hitPath, visiblePath);
  }
  networkSvgEl.appendChild(edgeGroup);

  const nodeGroup = createSvgElement('g', { class: 'network-nodes' });
  const layoutNodes = Array.from(networkLayout.nodes.values());
  const orderedLayoutNodes = networkShowsFilesAndFunctions()
    ? [
      ...layoutNodes.filter((layoutNode) => layoutNode.node.nodeType !== 'file'),
      ...layoutNodes.filter((layoutNode) => layoutNode.node.nodeType === 'file'),
    ]
    : layoutNodes;
  for (const layoutNode of orderedLayoutNodes) {
    const node = layoutNode.node;
    const isFileNode = node.nodeType === 'file';
    const group = createSvgElement('g', {
      class: 'network-node' + (isFileNode ? ' file-network-node' : ''),
      role: 'button',
      tabindex: 0,
      'data-node-kind': isFileNode ? 'file' : 'function',
      'data-function-id': isFileNode ? null : node.id,
      'data-file-path': isFileNode ? node.modulePath : node.modulePath,
      'aria-label': nodeAriaLabel(node),
    });
    const title = createSvgElement('title');
    title.textContent = isFileNode
      ? node.modulePath + ', ' + compactCount(node.functionCount) + ' '
        + plural(compactCount(node.functionCount), 'function') + ', '
        + compactCount(node.totalFunctionLines) + ' function '
        + plural(compactCount(node.totalFunctionLines), 'line') + '. '
        + fileConnectionSummary(node)
      : displayName(node) + ' in ' + node.modulePath + ', '
        + lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line') + '. '
        + connectionSummary(node);
    if (isFileNode) {
      const rect = createSvgElement('rect', {
        x: layoutNode.x - layoutNode.width / 2,
        y: layoutNode.y - layoutNode.height / 2,
        width: layoutNode.width,
        height: layoutNode.height,
        rx: 7,
        fill: layoutNode.color,
      });
      const label = createSvgElement('text', {
        x: layoutNode.x,
        y: layoutNode.y - 3,
        'text-anchor': 'middle',
      });
      label.textContent = shortLabel(node.modulePath, 24);
      const metric = createSvgElement('text', {
        class: 'file-node-metric',
        x: layoutNode.x,
        y: layoutNode.y + 14,
        'text-anchor': 'middle',
      });
      metric.textContent = compactCount(node.functionCount) + ' fn'
        + ' | ' + compactCount(node.totalFunctionLines) + ' lines';
      group.append(title, rect, label, metric);
      addKeyboardActivation(group, (event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        selectFile(node.modulePath, { reason: 'select-file', restoreFocusEl: group });
      });
    } else {
      const circle = createSvgElement('circle', {
        cx: layoutNode.x,
        cy: layoutNode.y,
        r: layoutNode.radius,
        fill: layoutNode.color,
      });
      const label = createSvgElement('text', {
        x: layoutNode.x,
        y: layoutNode.y + layoutNode.radius + 17,
        'text-anchor': 'middle',
      });
      label.textContent = shortLabel(displayName(node), 16);
      group.append(title, circle, label);
      addKeyboardActivation(group, (event) => {
        if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
        selectFunction(node.id, { reason: 'select-function', restoreFocusEl: group });
      });
      group.addEventListener('dblclick', () => showSourceDialogForFunctionId(node.id, group));
    }
    nodeGroup.appendChild(group);
  }
  networkSvgEl.appendChild(nodeGroup);
  updateNetworkHighlights();
}

function networkNodeElement(functionId) {
  return networkSvgEl.querySelector('.network-node[data-function-id="' + CSS.escape(functionId) + '"]');
}

function networkFileNodeElement(modulePath) {
  return networkSvgEl.querySelector('.network-node[data-file-path="' + CSS.escape(modulePath) + '"][data-node-kind="file"]');
}

function setNetworkZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
  if (!networkLayout) return;
  networkNeedsFit = false;
  const minZoom = 0.22;
  const maxZoom = 4;
  const clamped = Math.min(maxZoom, Math.max(minZoom, nextZoom));
  if (Math.abs(clamped - networkZoom) < 0.001) return;

  const rect = networkViewportEl.getBoundingClientRect();
  const anchorX = anchorClientX == null ? rect.left + networkViewportEl.clientWidth / 2 : anchorClientX;
  const anchorY = anchorClientY == null ? rect.top + networkViewportEl.clientHeight / 2 : anchorClientY;
  const localX = anchorX - rect.left + networkViewportEl.scrollLeft;
  const localY = anchorY - rect.top + networkViewportEl.scrollTop;
  const ratioX = localX / Math.max(0.001, networkZoom);
  const ratioY = localY / Math.max(0.001, networkZoom);

  networkZoom = clamped;
  networkSvgEl.style.width = (networkBaseWidth * networkZoom) + 'px';
  networkSvgEl.style.height = (networkBaseHeight * networkZoom) + 'px';
  networkZoomStatusEl.textContent = 'Zoom ' + Math.round(networkZoom * 100) + '%';
  networkViewportEl.scrollLeft = Math.max(0, ratioX * networkZoom - (anchorX - rect.left));
  networkViewportEl.scrollTop = Math.max(0, ratioY * networkZoom - (anchorY - rect.top));
  sendViewerBridgeState('zoom-network');
}

function centerNetwork() {
  networkViewportEl.scrollLeft = Math.max(0, (networkViewportEl.scrollWidth - networkViewportEl.clientWidth) / 2);
  networkViewportEl.scrollTop = Math.max(0, (networkViewportEl.scrollHeight - networkViewportEl.clientHeight) / 2);
}

function fitNetworkToViewport() {
  if (!networkLayout) return;
  networkNeedsFit = false;
  const availableWidth = Math.max(120, networkViewportEl.clientWidth - 28);
  const availableHeight = Math.max(120, networkViewportEl.clientHeight - 28);
  const nextZoom = Math.min(1, availableWidth / networkBaseWidth, availableHeight / networkBaseHeight);
  networkZoom = Math.max(0.22, nextZoom);
  networkSvgEl.style.width = (networkBaseWidth * networkZoom) + 'px';
  networkSvgEl.style.height = (networkBaseHeight * networkZoom) + 'px';
  networkZoomStatusEl.textContent = 'Zoom ' + Math.round(networkZoom * 100) + '%';
  centerNetwork();
  sendViewerBridgeState('fit-network');
}

function resetNetworkView() {
  if (!networkLayout) return;
  networkNeedsFit = false;
  networkZoom = 1;
  networkSvgEl.style.width = networkBaseWidth + 'px';
  networkSvgEl.style.height = networkBaseHeight + 'px';
  networkZoomStatusEl.textContent = 'Zoom 100%';
  centerNetwork();
  sendViewerBridgeState('reset-network-view');
}

function scrollFunctionIntoView(functionId) {
  const layoutNode = networkLayout?.nodes.get(functionId);
  if (!layoutNode) return false;
  networkViewportEl.scrollLeft = Math.max(0, (layoutNode.x * networkZoom) - networkViewportEl.clientWidth / 2);
  networkViewportEl.scrollTop = Math.max(0, (layoutNode.y * networkZoom) - networkViewportEl.clientHeight / 2);
  return true;
}

function scrollFileIntoView(modulePath) {
  const layoutNode = networkLayout?.nodes.get(fileNodeId(modulePath));
  if (!layoutNode) return false;
  networkViewportEl.scrollLeft = Math.max(0, (layoutNode.x * networkZoom) - networkViewportEl.clientWidth / 2);
  networkViewportEl.scrollTop = Math.max(0, (layoutNode.y * networkZoom) - networkViewportEl.clientHeight / 2);
  return true;
}

function layoutNodeIsVisible(layoutNode, padding = 72) {
  if (!layoutNode) return false;
  const x = layoutNode.x * networkZoom;
  const y = layoutNode.y * networkZoom;
  return x >= networkViewportEl.scrollLeft + padding
    && x <= networkViewportEl.scrollLeft + networkViewportEl.clientWidth - padding
    && y >= networkViewportEl.scrollTop + padding
    && y <= networkViewportEl.scrollTop + networkViewportEl.clientHeight - padding;
}

function scrollLayoutNodeIntoViewIfNeeded(layoutNode, { force = false } = {}) {
  if (!layoutNode) return false;
  if (!force && layoutNodeIsVisible(layoutNode)) return true;
  networkViewportEl.scrollLeft = Math.max(0, (layoutNode.x * networkZoom) - networkViewportEl.clientWidth / 2);
  networkViewportEl.scrollTop = Math.max(0, (layoutNode.y * networkZoom) - networkViewportEl.clientHeight / 2);
  return true;
}

function scrollSelectionIntoViewIfNeeded({ force = false } = {}) {
  const layoutNode = selectedFunctionId
    ? networkLayout?.nodes.get(selectedFunctionId)
    : (selectedFilePath ? networkLayout?.nodes.get(fileNodeId(selectedFilePath)) : null);
  return scrollLayoutNodeIntoViewIfNeeded(layoutNode, { force });
}

function hasClass(element, className) {
  if (!element) return false;
  if (element.classList && typeof element.classList.contains === 'function') {
    return element.classList.contains(className);
  }
  return (' ' + (element.getAttribute?.('class') || '') + ' ').includes(' ' + className + ' ');
}

function updateModuleDiagramZoomStatus() {
  moduleDiagramZoomStatusEl.textContent = 'Zoom ' + Math.round(moduleDiagramZoom * 100) + '%';
}

function setModuleDiagramSvgSizeForZoom() {
  if (!moduleDiagramSvgEl || !moduleDiagramBaseWidth || !moduleDiagramBaseHeight) return;
  moduleDiagramSvgEl.style.width = (moduleDiagramBaseWidth * moduleDiagramZoom) + 'px';
  moduleDiagramSvgEl.style.height = (moduleDiagramBaseHeight * moduleDiagramZoom) + 'px';
  updateModuleDiagramZoomStatus();
}

function centerModuleDiagram() {
  moduleDiagramViewportEl.scrollLeft = Math.max(0, (moduleDiagramViewportEl.scrollWidth - moduleDiagramViewportEl.clientWidth) / 2);
  moduleDiagramViewportEl.scrollTop = Math.max(0, (moduleDiagramViewportEl.scrollHeight - moduleDiagramViewportEl.clientHeight) / 2);
}

function setModuleDiagramZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
  if (!moduleDiagramSvgEl || !moduleDiagramBaseWidth || !moduleDiagramBaseHeight) return;
  moduleDiagramNeedsFit = false;
  const clamped = clamp(nextZoom, 0.2, 4);
  if (Math.abs(clamped - moduleDiagramZoom) < 0.001) return;

  const rect = moduleDiagramViewportEl.getBoundingClientRect();
  const anchorX = anchorClientX == null ? rect.left + moduleDiagramViewportEl.clientWidth / 2 : anchorClientX;
  const anchorY = anchorClientY == null ? rect.top + moduleDiagramViewportEl.clientHeight / 2 : anchorClientY;
  const localX = anchorX - rect.left + moduleDiagramViewportEl.scrollLeft;
  const localY = anchorY - rect.top + moduleDiagramViewportEl.scrollTop;
  const ratioX = localX / Math.max(0.001, moduleDiagramZoom);
  const ratioY = localY / Math.max(0.001, moduleDiagramZoom);

  moduleDiagramZoom = clamped;
  setModuleDiagramSvgSizeForZoom();
  moduleDiagramViewportEl.scrollLeft = Math.max(0, ratioX * moduleDiagramZoom - (anchorX - rect.left));
  moduleDiagramViewportEl.scrollTop = Math.max(0, ratioY * moduleDiagramZoom - (anchorY - rect.top));
  sendViewerBridgeState('zoom-file-diagram');
}

function fitModuleDiagramToViewport() {
  if (!moduleDiagramSvgEl || !moduleDiagramBaseWidth || !moduleDiagramBaseHeight) return;
  moduleDiagramNeedsFit = false;
  const availableWidth = Math.max(100, moduleDiagramViewportEl.clientWidth - 34);
  const availableHeight = Math.max(100, moduleDiagramViewportEl.clientHeight - 34);
  moduleDiagramZoom = clamp(Math.min(1, availableWidth / moduleDiagramBaseWidth, availableHeight / moduleDiagramBaseHeight), 0.2, 4);
  setModuleDiagramSvgSizeForZoom();
  centerModuleDiagram();
  sendViewerBridgeState('fit-file-diagram');
}

function resetModuleDiagramView() {
  if (!moduleDiagramSvgEl) return;
  moduleDiagramNeedsFit = false;
  moduleDiagramZoom = 1;
  setModuleDiagramSvgSizeForZoom();
  centerModuleDiagram();
  sendViewerBridgeState('reset-file-diagram-view');
}

function edgeTargetBasename(edge = {}) {
  const targetPath = typeof edge.targetPath === 'string' ? edge.targetPath : '';
  const target = targetPath || (typeof edge.target === 'string' ? edge.target : '');
  return target.split(/[\\/]/).filter(Boolean).at(-1) || target;
}

function prefixLineCount(label, lineCount) {
  return Number.isInteger(lineCount) && lineCount > 0 ? lineCount + ' ' + label : label;
}

function formatNamedImportBinding(binding = {}) {
  const imported = typeof binding.imported === 'string' ? binding.imported : '';
  const local = typeof binding.local === 'string' ? binding.local : '';
  if (!imported && !local) return '';
  const callable = (local || imported) + '()';
  const label = !imported || imported === local ? callable : imported + ' as ' + callable;
  return prefixLineCount(label, binding.lineCount);
}

function edgeImportLabels(edge = {}) {
  const labels = [];
  const targetLabel = edgeTargetBasename(edge);
  for (const binding of safeArray(edge.imports)) {
    const kind = typeof binding?.kind === 'string' ? binding.kind : 'named';
    if (kind === 'named') {
      labels.push(formatNamedImportBinding(binding));
    } else if (targetLabel) {
      labels.push(prefixLineCount(targetLabel, edge.targetLineCount));
    }
  }
  if (labels.length === 0 && targetLabel) labels.push(prefixLineCount(targetLabel, edge.targetLineCount));
  return Array.from(new Set(labels)).filter(Boolean);
}

function edgeDataIdPrefix(source, target) {
  return 'id_' + source + '_' + target + '_';
}

function findEdgeLabelGroup(label, dataId) {
  const groups = Array.from(label.querySelectorAll('g.label[data-id]'));
  return groups.find((group) => group.getAttribute('data-id') === dataId) || groups[0] || null;
}

function findRenderedEdgeLabel(labels, dataId) {
  for (const label of labels) {
    const labelGroup = findEdgeLabelGroup(label, dataId);
    if (labelGroup && labelGroup.getAttribute('data-id') === dataId) return { label, labelGroup };
  }
  return { label: null, labelGroup: null };
}

function originalEdgeLabelContent(labelGroup) {
  return Array.from(labelGroup.children)
    .find((child) => !hasClass(child, 'edge-import-label')) || null;
}

function renderEmptySelectedImport() {
  selectedImportEl.textContent = '';
  selectedImportEl.appendChild(createElement('p', 'empty-note', 'No import edge selected.'));
}

function appendSelectedImportRow(parent, label, value) {
  const row = createElement('div', 'selected-import-row');
  row.append(createElement('span', '', label), createElement('code', '', value || 'none'));
  parent.appendChild(row);
}

function renderSelectedImport(edge, labels) {
  selectedImportEl.textContent = '';
  const title = createElement('h3', '', (edge.source || 'unknown') + ' -> ' + (edge.target || 'unknown'));
  const rows = createElement('div', 'selected-import-rows');
  appendSelectedImportRow(rows, 'Source', edge.sourcePath || edge.source);
  appendSelectedImportRow(rows, 'Target', edge.targetPath || edge.target);
  appendSelectedImportRow(rows, 'Load', safeArray(edge.loadKinds).join(', ') || 'unknown');
  const listTitle = createElement('h4', '', 'Direct Imports');
  const list = createElement('ul', 'selected-import-list');
  for (const label of labels) {
    const item = createElement('li', '', label);
    list.appendChild(item);
  }
  selectedImportEl.append(title, rows, listTitle, list);
}

function collapseExpandedEdge() {
  if (!expandedImportEdge) return;
  const { customLabel, label, originalContent, originalDisplay, path } = expandedImportEdge;
  if (customLabel && typeof customLabel.remove === 'function') customLabel.remove();
  if (originalContent) originalContent.style.display = originalDisplay;
  if (label) label.classList.remove('is-expanded');
  if (path) path.classList.remove('is-selected');
  expandedImportEdge = null;
  renderEmptySelectedImport();
}

function expandEdgeLabel(edge, path, label, labelGroup) {
  collapseExpandedEdge();
  const originalContent = labelGroup && originalEdgeLabelContent(labelGroup);
  if (!labelGroup || !originalContent) return;
  const labels = edgeImportLabels(edge);
  const lines = labels.length > 0 ? labels : [edge.targetPath || edge.target || 'module import'];
  const width = Math.min(460, Math.max(120, Math.ceil(Math.max(...lines.map((line) => line.length)) * 7.2) + 24));
  const height = 12 + (lines.length * 20);
  const customLabel = createSvgElement('g', { class: 'edge-import-label' });
  const rect = createSvgElement('rect', {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    rx: 7,
  });
  const text = createSvgElement('text', { x: 0, y: (-height / 2) + 18, 'text-anchor': 'middle' });
  lines.forEach((line, index) => {
    const tspan = createSvgElement('tspan', { x: 0, dy: index > 0 ? 20 : null });
    tspan.textContent = line;
    text.appendChild(tspan);
  });
  customLabel.append(rect, text);
  const originalDisplay = originalContent.style.display;
  originalContent.style.display = 'none';
  labelGroup.appendChild(customLabel);
  label.classList.add('is-expanded');
  path.classList.add('is-selected');
  expandedImportEdge = { customLabel, label, originalContent, originalDisplay, path };
  renderSelectedImport(edge, lines);
  sendViewerBridgeState('select-import-edge');
}

function addEdgeActivation(element, callback) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  addKeyboardActivation(element, callback);
}

function sourceLabelBase(labelText) {
  return (typeof labelText === 'string' ? labelText : '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\\?[+#~-]\s*/, '')
    .replace(sourceMetricsSuffixPattern, '')
    .replace(/^\d+\s+/, '')
    .replace(/\s+:\s*$/, '')
    .trim();
}

function sourceMemberName(label) {
  let text = sourceLabelBase(label.textContent);
  const parametersIndex = text.indexOf('(');
  if (parametersIndex !== -1) text = text.slice(0, parametersIndex);
  return text.trim();
}

function sourceDeclarationLineCount(declaration) {
  const startLine = Number(declaration?.startLine);
  const endLine = Number(declaration?.endLine);
  return Number.isInteger(startLine) && Number.isInteger(endLine) && endLine >= startLine
    ? endLine - startLine + 1
    : 0;
}

function sourceMetricCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : 0;
}

function sourceMemberBaseText(labelText, declaration) {
  const raw = typeof labelText === 'string' ? labelText : '';
  const prefixMatch = raw.match(/^\s*(\\?[+#~-])\s*/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const displayName = sourceLabelBase(raw)
    || String(declaration?.name || declaration?.declarationName || '').trim();
  return prefix + displayName;
}

function appendSourceMemberMetrics(element, declaration) {
  const tagName = typeof element?.tagName === 'string' ? element.tagName.toLowerCase() : '';
  const isSvgText = tagName === 'text';
  const createInlineElement = (className) => {
    const node = isSvgText
      ? document.createElementNS(svgNamespace, 'tspan')
      : document.createElement('span');
    node.setAttribute('class', className);
    return node;
  };
  const labelText = createInlineElement('source-member-label-text');
  labelText.textContent = sourceMemberBaseText(element.textContent, declaration);

  const metricsGroup = createInlineElement('source-member-metrics');
  metricsGroup.setAttribute('aria-hidden', 'true');
  for (const [metric, text] of [
    ['lines', 'Lines ' + sourceDeclarationLineCount(declaration)],
    ['refs', 'Refs ' + sourceMetricCount(declaration?.referenceCount)],
    ['importers', 'Files ' + sourceMetricCount(declaration?.importerFileCount)],
  ]) {
    const badge = createInlineElement('source-member-metric');
    badge.setAttribute('data-metric', metric);
    badge.textContent = text;
    metricsGroup.appendChild(badge);
  }

  element.textContent = '';
  element.append(labelText, metricsGroup);
}

function addModuleIdCandidate(candidates, value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return;
  const classIdMatch = raw.match(/(?:^|-)classId-(.+?)(?:-\d+)?$/);
  if (classIdMatch) {
    candidates.push(classIdMatch[1]);
    return;
  }
  const classVariantMatch = raw.match(/^(?:class|flowchart)-(.+?)(?:-\d+)?$/);
  if (classVariantMatch) {
    candidates.push(classVariantMatch[1]);
    return;
  }
  candidates.push(raw);
}

function sourceModuleIdCandidatesFromElement(element) {
  const candidates = [];
  if (!element || typeof element.getAttribute !== 'function') return candidates;
  addModuleIdCandidate(candidates, element.getAttribute('data-id'));
  addModuleIdCandidate(candidates, element.getAttribute('data-node-id'));
  addModuleIdCandidate(candidates, element.getAttribute('data-class-id'));
  addModuleIdCandidate(candidates, element.getAttribute('id'));
  return Array.from(new Set(candidates));
}

function sourceDeclarationForLabel(label) {
  const name = sourceMemberName(label);
  if (!name) return null;
  let current = label;
  while (current && current !== moduleDiagramSvgEl) {
    for (const moduleId of sourceModuleIdCandidatesFromElement(current)) {
      const declaration = declarationsByModuleIdAndName.get(sourceKey(moduleId, name));
      if (declaration) return declaration;
    }
    current = current.parentNode;
  }
  return null;
}

function jsxOutputModuleRecords() {
  return Array.from(outputModuleByPath.values())
    .filter((module) => sourceFileTypeForPath(module.path) === 'jsx' && module.reachable !== false)
    .sort((a, b) => compareFilePaths(a.path, b.path));
}

function mermaidClassIdBase(modulePath) {
  const baseName = fileName(modulePath).replace(/\.[^.]+$/, '');
  return baseName.replace(/[^A-Za-z0-9_$]/g, '_') || 'Module';
}

function mermaidModulePathByClassId() {
  const baseCounts = new Map();
  const pathByClassId = new Map();
  for (const module of jsxOutputModuleRecords()) {
    const base = mermaidClassIdBase(module.path);
    const count = (baseCounts.get(base) || 0) + 1;
    baseCounts.set(base, count);
    pathByClassId.set(count === 1 ? base : base + '_' + count, module.path);
  }
  return pathByClassId;
}

function modulePathForDiagramElement(element, pathByClassId = mermaidModulePathByClassId()) {
  let current = element;
  while (current && current !== moduleDiagramSvgEl) {
    for (const moduleId of sourceModuleIdCandidatesFromElement(current)) {
      const modulePath = pathByClassId.get(moduleId);
      if (modulePath) return modulePath;
    }
    current = current.parentNode;
  }
  return '';
}

function moduleHeaderText(modulePath) {
  const lines = moduleLineCount(modulePath);
  return (lines ? lines + ' ' : '') + fileName(modulePath);
}

function moduleHeaderLabelMatches(element, modulePath) {
  if (!element || hasClass(element, 'source-member-trigger') || hasClass(element, 'source-module-trigger')) return false;
  const rawText = String(element.textContent || '').replace(/\s+/g, ' ').trim();
  if (!rawText) return false;
  const basename = fileName(modulePath);
  const withoutLineCount = rawText.replace(/^\d+\s+/, '').trim();
  return rawText === basename
    || rawText === moduleHeaderText(modulePath)
    || withoutLineCount === basename;
}

function diagramHeaderCandidates(classGroup, modulePath) {
  const candidates = [
    classGroup,
    ...Array.from(classGroup.querySelectorAll?.('text,p,span,div') || []),
  ];
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return moduleHeaderLabelMatches(candidate, modulePath);
  });
}

function addModuleHeaderActivation(element, modulePath) {
  element.classList.add('source-module-trigger');
  element.setAttribute('data-ironglancer-module-path', modulePath);
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('focusable', 'true');
  element.setAttribute('aria-label', 'Show full source for ' + modulePath);

  const titleText = 'Show full source for ' + modulePath;
  if (element.namespaceURI === svgNamespace) {
    const title = element.querySelector?.('title') || createSvgElement('title');
    title.textContent = titleText;
    if (!title.parentNode) element.insertBefore(title, element.firstChild);
  } else {
    element.setAttribute('title', titleText);
  }

  addKeyboardActivation(element, (event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    showSourceDialogForModulePath(modulePath, element);
  });
}

function wireModuleHeaders() {
  if (!moduleDiagramSvgEl || typeof moduleDiagramSvgEl.querySelectorAll !== 'function') return;
  const pathByClassId = mermaidModulePathByClassId();
  const classGroups = Array.from(moduleDiagramSvgEl.querySelectorAll('g'))
    .map((group) => ({ group, modulePath: modulePathForDiagramElement(group, pathByClassId) }))
    .filter((record) => record.modulePath);
  const candidatePaths = new Map();
  for (const { group, modulePath } of classGroups) {
    for (const candidate of diagramHeaderCandidates(group, modulePath)) {
      if (!candidatePaths.has(candidate)) candidatePaths.set(candidate, modulePath);
    }
  }
  const candidates = Array.from(candidatePaths.keys());
  for (const candidate of candidates) {
    const containsAnotherCandidate = candidates.some((other) => (
      other !== candidate
      && typeof candidate.contains === 'function'
      && candidate.contains(other)
    ));
    if (!containsAnotherCandidate) addModuleHeaderActivation(candidate, candidatePaths.get(candidate));
  }
}

function svgNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return String(Number(value.toFixed(3)));
}

function validSourceHitBox(box) {
  return box
    && Number.isFinite(box.x)
    && Number.isFinite(box.y)
    && Number.isFinite(box.width)
    && Number.isFinite(box.height)
    && box.width > 0
    && box.height > 0;
}

function sourceHitBoxFromAttributes(element) {
  if (!element || typeof element.getAttribute !== 'function') return null;
  const box = {
    x: Number.parseFloat(element.getAttribute('x')),
    y: Number.parseFloat(element.getAttribute('y')),
    width: Number.parseFloat(element.getAttribute('width')),
    height: Number.parseFloat(element.getAttribute('height')),
  };
  return validSourceHitBox(box) ? box : null;
}

function sourceHitTargetReference(element) {
  let current = element;
  while (current && current !== moduleDiagramSvgEl) {
    if (typeof current.getBBox === 'function') {
      try {
        const box = current.getBBox();
        if (validSourceHitBox(box)) return { element: current, box };
      } catch {
        // Mermaid can expose getBBox before every nested label has finished layout.
      }
    }
    const attributeBox = sourceHitBoxFromAttributes(current);
    if (attributeBox) return { element: current, box: attributeBox };
    current = current.parentNode;
  }
  return null;
}

function sourceMemberRecordForElement(element) {
  let current = element;
  while (current && current !== moduleDiagramViewportEl) {
    if (typeof current.getAttribute === 'function') {
      const targetId = current.getAttribute('data-source-member-target-id');
      if (targetId && sourceMemberTargets.has(targetId)) return sourceMemberTargets.get(targetId);
    }
    current = current.parentNode;
  }
  return null;
}

function sourceClientRectForRecord(record) {
  if (!record?.element || typeof record.element.getBoundingClientRect !== 'function') return null;
  const rawRect = record.element.getBoundingClientRect();
  if (!rawRect) return null;
  const left = Number(rawRect.left);
  const top = Number(rawRect.top);
  const width = Number.isFinite(rawRect.width) ? Number(rawRect.width) : Number(rawRect.right) - left;
  const height = Number.isFinite(rawRect.height) ? Number(rawRect.height) : Number(rawRect.bottom) - top;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;
  return {
    left,
    top,
    right: Number.isFinite(rawRect.right) ? Number(rawRect.right) : left + width,
    bottom: Number.isFinite(rawRect.bottom) ? Number(rawRect.bottom) : top + height,
    width,
    height,
  };
}

function sourcePointInsideRecord(record, clientX, clientY) {
  const rect = sourceClientRectForRecord(record);
  if (!rect) return null;
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function sourceElementsFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint !== 'function') return [];
  try {
    return Array.from(document.elementsFromPoint(clientX, clientY) || []);
  } catch {
    return [];
  }
}

function sourceVisibleRecordFromPointStack(elements, clientX, clientY) {
  for (const element of elements) {
    if (hasClass(element, 'source-member-hit-target')) continue;
    const record = sourceMemberRecordForElement(element);
    if (!record) continue;
    const containsPoint = sourcePointInsideRecord(record, clientX, clientY);
    if (containsPoint !== false) return record;
  }
  return null;
}

function sourceCandidateRecordsFromPointStack(elements, fallbackRecord) {
  const records = [];
  const seen = new Set();
  const addRecord = (record) => {
    if (!record || seen.has(record.id)) return;
    seen.add(record.id);
    records.push(record);
  };
  for (const element of elements) addRecord(sourceMemberRecordForElement(element));
  addRecord(fallbackRecord);
  return records;
}

function sourceRecordDistanceFromPoint(record, clientX, clientY) {
  const rect = sourceClientRectForRecord(record);
  if (!rect) return { vertical: Number.POSITIVE_INFINITY, horizontal: Number.POSITIVE_INFINITY };
  const centerY = rect.top + rect.height / 2;
  const vertical = Math.abs(clientY - centerY);
  const horizontal = clientX < rect.left ? rect.left - clientX : (clientX > rect.right ? clientX - rect.right : 0);
  return { vertical, horizontal };
}

function nearestSourceRecordForPoint(records, clientX, clientY) {
  return records
    .map((record) => ({
      record,
      distance: sourceRecordDistanceFromPoint(record, clientX, clientY),
    }))
    .sort((a, b) => a.distance.vertical - b.distance.vertical
      || a.distance.horizontal - b.distance.horizontal
      || a.record.order - b.record.order
      || String(a.record.declaration?.name || '').localeCompare(String(b.record.declaration?.name || '')))[0]?.record || null;
}

function sourceActivationRecordForEvent(event, fallbackRecord) {
  const targetRecord = sourceMemberRecordForElement(event?.currentTarget)
    || sourceMemberRecordForElement(event?.target)
    || fallbackRecord;
  const clientX = Number(event?.clientX);
  const clientY = Number(event?.clientY);
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return targetRecord;

  const pointElements = sourceElementsFromPoint(clientX, clientY);
  const visibleRecord = sourceVisibleRecordFromPointStack(pointElements, clientX, clientY);
  if (visibleRecord) return visibleRecord;

  const candidates = sourceCandidateRecordsFromPointStack(pointElements, targetRecord);
  return nearestSourceRecordForPoint(candidates, clientX, clientY) || targetRecord;
}

function addSourceHitTarget(record, activate) {
  const reference = sourceHitTargetReference(record.element);
  const parent = reference?.element?.parentNode;
  if (!parent) return;
  const { x, y, width, height } = reference.box;
  const hitTarget = createSvgElement('path', {
    class: 'source-member-hit-target',
    'data-source-member-target-id': record.id,
    d: 'M' + svgNumber(x) + ' ' + svgNumber(y + height / 2) + 'H' + svgNumber(x + width),
    'aria-hidden': 'true',
    focusable: 'false',
    'vector-effect': 'non-scaling-stroke',
  });
  hitTarget.addEventListener('click', activate);
  record.hitTarget = hitTarget;
  parent.appendChild(hitTarget);
}

function renderSourceDialogDeclaration(declaration) {
  const node = functionNodeForDeclaration(declaration);
  sourceDialogTitleEl.textContent = declaration.name || declaration.declarationName || 'Source';
  sourceDialogPathEl.textContent = sourceDialogPathForDeclaration(declaration);
  sourceDialogCodeEl.textContent = declaration.code || unavailableSourceComment('Declaration');

  if (node) {
    renderDialogInsight(node);
    renderNeighborhood(node);
    renderSourceConnectionDisclosure(node);
  } else {
    sourceDialogInsightEl.textContent = '';
    sourceDialogInsightEl.appendChild(createElement('p', 'takeaway', 'Saved source for this diagram member is available, but it is not present in the function graph snapshot.'));
    sourceDialogNeighborhoodEl.textContent = '';
    sourceDialogNeighborhoodEl.hidden = true;
    sourceDialogConnectionsEl.hidden = true;
  }

  updateDialogNavigationControls();
}

function showSourceDialogForDeclaration(declaration, restoreFocusEl = null) {
  if (!declaration) return false;
  const node = functionNodeForDeclaration(declaration);
  if (node && networkSourceMatchesPath(node.modulePath)) {
    selectFunction(node.id, { reason: 'open-source', restoreFocusEl });
  }
  const group = sourceDialogGroupForDeclaration(declaration);
  sourceDialogState = {
    functionId: node?.id || '',
    declaration,
    modulePath: '',
    group,
    index: group.indexOf(declaration),
  };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  renderSourceDialogDeclaration(declaration);
  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
  sourceDialogCloseBtn.focus();
  sendViewerBridgeState('open-source');
  return true;
}

function openSourceDeclarationFromDiagram(declaration, restoreFocusEl) {
  return showSourceDialogForDeclaration(declaration, restoreFocusEl);
}

function addSourceActivation(element, declaration) {
  const record = {
    id: String(++sourceMemberTargetCounter),
    order: sourceMemberTargetCounter,
    element,
    declaration,
    hitTarget: null,
  };
  sourceMemberTargets.set(record.id, record);

  element.classList.add('source-member-trigger');
  element.setAttribute('data-source-member-target-id', record.id);
  if (declaration.functionId) element.setAttribute('data-ironglancer-function-id', declaration.functionId);
  if (declaration.functionStableId) element.setAttribute('data-ironglancer-function-stable-id', declaration.functionStableId);
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('focusable', 'true');
  element.setAttribute('aria-label', 'Show source for ' + (declaration.name || declaration.declarationName) + ' in ' + declaration.modulePath);
  appendSourceMemberMetrics(element, declaration);

  const title = element.querySelector?.('title') || createSvgElement('title');
  title.textContent = 'Show source for ' + callableLabel(declaration.name || declaration.declarationName);
  if (!title.parentNode) element.insertBefore(title, element.firstChild);

  const activate = (event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const activationRecord = sourceActivationRecordForEvent(event, record) || record;
    highlightSourceRecord(activationRecord);
    openSourceDeclarationFromDiagram(activationRecord.declaration, activationRecord.element || element);
  };
  addKeyboardActivation(element, activate);
  addSourceHitTarget(record, activate);
}

function sourceRecordForDeclaration(declaration) {
  if (!declaration) return null;
  const functionId = String(declaration.functionId || '').trim();
  const functionStableId = String(declaration.functionStableId || '').trim();
  return Array.from(sourceMemberTargets.values())
    .find((record) => (
      record.declaration === declaration
      || (functionStableId && record.declaration?.functionStableId === functionStableId)
      || (functionId && record.declaration?.functionId === functionId)
    )) || null;
}

function sourceRecordForFunctionId(functionId) {
  const declaration = declarationsByFunctionId.get(functionId)
    || declarationsByFunctionStableId.get(functionById.get(functionId)?.stableId);
  return sourceRecordForDeclaration(declaration);
}

function clearSourceHighlight() {
  if (!highlightedSourceRecord) return;
  highlightedSourceRecord.element?.classList?.remove('is-agent-highlighted');
  highlightedSourceRecord.hitTarget?.classList?.remove('is-agent-highlighted');
  highlightedSourceRecord = null;
}

function highlightSourceRecord(record) {
  clearSourceHighlight();
  if (!record) return false;
  highlightedSourceRecord = record;
  record.element?.classList?.add('is-agent-highlighted');
  record.hitTarget?.classList?.add('is-agent-highlighted');
  return true;
}

function scrollSourceRecordIntoView(record) {
  const element = record?.element;
  if (!element) return false;
  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    return true;
  }
  return true;
}

function wireSourceMembers() {
  if (!moduleDiagramSvgEl || typeof moduleDiagramSvgEl.querySelectorAll !== 'function') return;
  sourceMemberTargetCounter = 0;
  sourceMemberTargets = new Map();
  const labels = [
    ...Array.from(moduleDiagramSvgEl.querySelectorAll('text')),
    ...Array.from(moduleDiagramSvgEl.querySelectorAll('p')),
  ];
  for (const label of labels) {
    const declaration = sourceDeclarationForLabel(label);
    if (!declaration) continue;
    addSourceActivation(label, declaration);
  }
}

function wireImportEdges(importEdges) {
  if (!moduleDiagramSvgEl || typeof moduleDiagramSvgEl.querySelectorAll !== 'function') return;
  const paths = Array.from(moduleDiagramSvgEl.querySelectorAll('path[data-id]'))
    .filter((path) => hasClass(path, 'relation') || path.getAttribute('data-edge') === 'true');
  const labels = Array.from(moduleDiagramSvgEl.querySelectorAll('g.edgeLabel'));
  const claimedPaths = new Set();

  for (const edge of safeArray(importEdges)) {
    const prefix = edgeDataIdPrefix(edge.source, edge.target);
    const path = paths.find((candidate) => {
      const dataId = candidate.getAttribute('data-id') || '';
      return !claimedPaths.has(candidate) && dataId.startsWith(prefix);
    });
    if (!path) continue;
    const dataId = path.getAttribute('data-id');
    const { label, labelGroup } = findRenderedEdgeLabel(labels, dataId);
    if (!label || !labelGroup) continue;
    claimedPaths.add(path);

    const activate = () => expandEdgeLabel(edge, path, label, labelGroup);
    const targetLabel = edge.targetPath || edge.target;
    path.setAttribute('aria-label', 'Show imports for ' + targetLabel);
    label.setAttribute('aria-label', 'Show imports for ' + targetLabel);
    addEdgeActivation(path, activate);
    addEdgeActivation(label, activate);

    const hitPath = path.cloneNode(false);
    hitPath.classList.add('edge-hit-target');
    hitPath.removeAttribute('id');
    hitPath.removeAttribute('data-id');
    hitPath.removeAttribute('aria-label');
    hitPath.removeAttribute('role');
    hitPath.removeAttribute('tabindex');
    hitPath.removeAttribute('marker-start');
    hitPath.removeAttribute('marker-mid');
    hitPath.removeAttribute('marker-end');
    hitPath.setAttribute('aria-hidden', 'true');
    hitPath.setAttribute('focusable', 'false');
    hitPath.setAttribute('vector-effect', 'non-scaling-stroke');
    hitPath.addEventListener('click', activate);
    path.parentNode.insertBefore(hitPath, path);
  }
}

function prepareModuleDiagramForInteraction(svgMarkup, importEdges) {
  latestModuleSvg = svgMarkup;
  moduleDiagramEl.innerHTML = svgMarkup;
  moduleDiagramSvgEl = moduleDiagramEl.querySelector('svg');
  expandedImportEdge = null;
  renderEmptySelectedImport();
  if (!moduleDiagramSvgEl) return;

  const viewBox = moduleDiagramSvgEl.viewBox && moduleDiagramSvgEl.viewBox.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    moduleDiagramBaseWidth = viewBox.width;
    moduleDiagramBaseHeight = viewBox.height;
  } else {
    moduleDiagramBaseWidth = moduleDiagramSvgEl.getBoundingClientRect().width
      || Number.parseFloat(moduleDiagramSvgEl.getAttribute('width'))
      || 1200;
    moduleDiagramBaseHeight = moduleDiagramSvgEl.getBoundingClientRect().height
      || Number.parseFloat(moduleDiagramSvgEl.getAttribute('height'))
      || 800;
  }

  moduleDiagramSvgEl.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  moduleDiagramSvgEl.style.maxWidth = 'none';
  moduleDiagramZoom = 1;
  setModuleDiagramSvgSizeForZoom();
  wireImportEdges(importEdges);
  wireSourceMembers();
  wireModuleHeaders();
  moduleDiagramNeedsFit = true;
  fitModuleDiagramWhenVisible();
  updateVisualizationStatus();
}

function externalRelationshipsForNode(node = {}) {
  const callees = node.placement?.groups?.callees || {};
  return [
    ...safeArray(callees.package).map((item) => ({ ...item, relationshipKind: 'browser-library' })),
    ...safeArray(callees.platform).map((item) => ({ ...item, relationshipKind: 'browser-library' })),
    ...safeArray(callees.unresolved).map((item) => ({ ...item, relationshipKind: 'couldnt-trace' })),
  ];
}

function relationshipItemsForNode(node = {}) {
  const items = [];
  for (const edge of safeArray(edgesByTargetId.get(node.id))) {
    const source = functionById.get(edge.sourceId);
    if (!source) continue;
    const sameFile = source.modulePath === node.modulePath;
    items.push({
      id: edge.id,
      kind: 'function',
      direction: 'incoming',
      functionId: source.id,
      edgeId: edge.id,
      title: callableLabel(displayName(source)),
      meta: source.modulePath + ':' + (source.startLine || '?') + ' uses this at ' + (usageLineText(edge.usageLines) || 'saved lines'),
      tags: ['used-by', sameFile ? 'same-file' : 'other-files'],
      lineHint: usageLineText(edge.usageLines),
      syntax: syntaxLabel(edge.syntaxKinds),
    });
  }
  for (const edge of safeArray(edgesBySourceId.get(node.id))) {
    const target = functionById.get(edge.targetId);
    if (!target) continue;
    const sameFile = target.modulePath === node.modulePath;
    items.push({
      id: edge.id,
      kind: 'function',
      direction: 'outgoing',
      functionId: target.id,
      edgeId: edge.id,
      title: callableLabel(displayName(target)),
      meta: target.modulePath + ':' + (target.startLine || '?') + ' at ' + (usageLineText(edge.usageLines) || 'saved lines'),
      tags: ['uses', sameFile ? 'same-file' : 'other-files'],
      lineHint: usageLineText(edge.usageLines),
      syntax: syntaxLabel(edge.syntaxKinds),
    });
  }
  for (const item of externalRelationshipsForNode(node)) {
    const unresolved = item.relationshipKind === 'couldnt-trace';
    const lineHint = usageLineText(item.usageLines);
    items.push({
      id: [
        item.relationshipKind,
        item.specifier,
        item.localName,
        item.importedName,
        lineHint,
      ].join('\u0000'),
      kind: 'external',
      direction: 'outgoing',
      title: callableLabel(item.localName || item.importedName || item.specifier),
      meta: unresolved
        ? ((item.specifier || 'unknown source') + (item.unresolvedReason ? ' - ' + item.unresolvedReason : ''))
        : (item.specifier || 'browser or library'),
      tags: ['uses', item.relationshipKind],
      lineHint,
      syntax: syntaxLabel(item.syntaxKinds),
    });
  }
  return items;
}

function relationshipCounts(items) {
  const counts = Object.fromEntries(relationFilters.map((filter) => [filter.id, 0]));
  counts.all = items.length;
  for (const item of items) {
    for (const tag of item.tags) counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

function filteredRelationshipItems(items, filterId = activeRelationFilter) {
  if (!filterId || filterId === 'all') return items;
  return items.filter((item) => item.tags.includes(filterId));
}

function localFunctionUseCount(node) {
  return safeArray(edgesBySourceId.get(node.id)).length;
}

function outsideUseCount(node) {
  return externalRelationshipsForNode(node).length;
}

function takeawayForNode(node = {}) {
  const items = relationshipItemsForNode(node);
  const counts = relationshipCounts(items);
  const usedBy = counts['used-by'] || 0;
  const uses = counts.uses || 0;
  const sameFile = counts['same-file'] || 0;
  const otherFiles = counts['other-files'] || 0;
  const browserLibrary = counts['browser-library'] || 0;
  const unresolved = counts['couldnt-trace'] || 0;
  const role = functionKindLabel(node).toLowerCase();
  if (items.length === 0) {
    return callableLabel(displayName(node)) + ' is a ' + lineCountFor(node) + '-line ' + role
      + ' in ' + fileName(node.modulePath) + '; no saved callers or uses were traced.';
  }
  const parts = [
    usedBy + ' ' + plural(usedBy, 'function') + ' use it',
    'it uses ' + uses + ' ' + plural(uses, 'thing'),
  ];
  if (sameFile > 0) parts.push(sameFile + ' in the same file');
  if (otherFiles > 0) parts.push(otherFiles + ' in other files');
  if (browserLibrary > 0) parts.push(browserLibrary + ' browser/library touchpoint' + (browserLibrary === 1 ? '' : 's'));
  if (unresolved > 0) parts.push(unresolved + ' item' + (unresolved === 1 ? '' : 's') + ' could not be traced');
  return callableLabel(displayName(node)) + ' is a ' + lineCountFor(node) + '-line ' + role + ': ' + parts.join(', ') + '.';
}

function renderStat(label, value) {
  const element = createElement('div', 'stat');
  element.append(createElement('strong', '', String(value)), createElement('span', '', label));
  return element;
}

function renderStats() {
  statsEl.textContent = '';
  const browserLibraryCount = functions.reduce((total, node) => (
    total + externalRelationshipsForNode(node).filter((item) => item.relationshipKind === 'browser-library').length
  ), 0);
  statsEl.append(
    renderStat('modules', outputPayload?.summary?.moduleCount || outputPayload?.modules?.length || 0),
    renderStat('components', safeArray(outputPayload?.components).length),
    renderStat('routes', safeArray(outputPayload?.routes).length),
    renderStat('lazy boundaries', safeArray(outputPayload?.lazyBoundaries).length),
    renderStat('assets', safeArray(outputPayload?.assets).length),
    renderStat('findings', safeArray(outputPayload?.findings).length),
    renderStat('functions', functions.length),
    renderStat('browser APIs', safeArray(outputPayload?.browserApis).length || browserLibraryCount),
  );
}

function renderChip(label, count, filterId, onClick) {
  const button = createElement('button', 'chip' + (activeRelationFilter === filterId ? ' is-active' : ''));
  button.type = 'button';
  button.setAttribute('aria-pressed', activeRelationFilter === filterId ? 'true' : 'false');
  button.append(createElement('span', '', label), createElement('span', 'chip-count', String(count)));
  button.addEventListener('click', () => onClick(filterId));
  return button;
}

function renderFilterControls(parent, items) {
  const counts = relationshipCounts(items);
  const row = createElement('div', 'chip-row');
  for (const filter of relationFilters) {
    const count = counts[filter.id] || 0;
    if (count === 0) continue;
    row.appendChild(renderChip(filter.label, count, filter.id, setRelationFilter));
  }
  if (row.children.length > 0) parent.appendChild(row);
}

function relationshipMetricItems(items) {
  const counts = relationshipCounts(items);
  return [
    { label: 'Used by', value: counts['used-by'] || 0, className: 'is-incoming' },
    { label: 'Uses', value: counts.uses || 0, className: 'is-outgoing' },
    { label: 'Across files', value: counts['other-files'] || 0, className: 'is-cross-file' },
    { label: 'Browser/library', value: counts['browser-library'] || 0, className: 'is-external' },
    { label: "Couldn't trace", value: counts['couldnt-trace'] || 0, className: 'is-unresolved' },
  ].filter((item) => item.value > 0 || item.className === 'is-incoming' || item.className === 'is-outgoing');
}

function renderRelationshipMetrics(parent, items) {
  const row = createElement('div', 'connection-metrics');
  for (const item of relationshipMetricItems(items)) {
    const metric = createElement('span', 'connection-metric ' + item.className);
    metric.append(createElement('strong', '', String(item.value)), createElement('span', '', item.label));
    row.appendChild(metric);
  }
  parent.appendChild(row);
}

function relationshipPreviewItems(items, maxItems = 8) {
  const visibleItems = filteredRelationshipItems(items);
  const ordered = [
    ...visibleItems.filter((item) => item.direction === 'incoming' && item.functionId),
    ...visibleItems.filter((item) => item.direction === 'outgoing' && item.functionId),
    ...visibleItems.filter((item) => item.kind === 'external'),
  ];
  const seen = new Set();
  const preview = [];
  for (const item of ordered) {
    const key = item.functionId || item.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    preview.push(item);
    if (preview.length >= maxItems) break;
  }
  return { preview, hiddenCount: Math.max(0, ordered.length - preview.length) };
}

function relationshipDirectionLabel(item) {
  if (item.kind === 'external' && item.tags.includes('couldnt-trace')) return "Couldn't trace";
  if (item.kind === 'external') return 'Browser/library';
  return item.direction === 'incoming' ? 'Used by' : 'Uses';
}

function renderRelatedNodePill(item, mode) {
  const targetNode = item.functionId ? functionById.get(item.functionId) : null;
  const element = createElement(targetNode ? 'button' : 'span', 'related-node');
  if (targetNode) {
    element.type = 'button';
    element.setAttribute('aria-label', (mode === 'dialog' ? 'Open ' : 'Select ') + displayName(targetNode));
    element.addEventListener('click', () => {
      if (mode === 'dialog') {
        showSourceDialogForFunctionId(targetNode.id, element);
      } else {
        selectFunction(targetNode.id, { reason: 'select-related-function', restoreFocusEl: element });
        scrollFunctionIntoView(targetNode.id);
      }
    });
  }
  const swatch = createElement('span', 'related-node-swatch');
  swatch.style.background = targetNode
    ? (fileColorByPath.get(targetNode.modulePath) || '#64748b')
    : (item.tags.includes('couldnt-trace') ? '#f97316' : '#0f766e');
  element.append(
    swatch,
    createElement('span', 'related-node-label', shortLabel(item.title.replace(/\(\)$/, ''), 18)),
    createElement('span', 'related-node-meta', relationshipDirectionLabel(item)),
  );
  return element;
}

function renderCompactRelationshipSummary(parent, node, { mode = 'panel' } = {}) {
  const items = relationshipItemsForNode(node);
  const summary = createElement('section', 'connection-summary');
  summary.setAttribute('aria-label', 'Connection summary');
  renderRelationshipMetrics(summary, items);
  const { preview, hiddenCount } = relationshipPreviewItems(items, mode === 'dialog' ? 10 : 8);
  if (items.length === 0) {
    summary.appendChild(createElement('p', 'empty-note', 'No saved callers or uses were traced for this function.'));
  } else if (preview.length === 0) {
    summary.appendChild(createElement('p', 'empty-note', 'No relationships match that focus.'));
  } else {
    const strip = createElement('div', 'related-node-strip');
    for (const item of preview) strip.appendChild(renderRelatedNodePill(item, mode));
    if (hiddenCount > 0) {
      strip.appendChild(createElement('span', 'related-node', '+' + hiddenCount + ' more'));
    }
    summary.appendChild(strip);
  }
  parent.appendChild(summary);
}

function renderConnectionDisclosure(parent, node, { mode = 'panel' } = {}) {
  const items = relationshipItemsForNode(node);
  if (items.length === 0) return;
  const details = createElement('details', 'connections-disclosure');
  const summary = createElement('summary', '', 'All connections (' + items.length + ')');
  const list = createElement('div', 'relationship-list');
  details.append(summary, list);
  renderRelationshipList(list, node, { mode, filterId: 'all' });
  parent.appendChild(details);
}

function renderSourceConnectionDisclosure(node) {
  const items = relationshipItemsForNode(node);
  sourceDialogConnectionsEl.hidden = items.length === 0;
  sourceDialogConnectionsEl.open = false;
  sourceDialogConnectionsSummaryEl.textContent = 'All connections (' + items.length + ')';
  renderRelationshipList(sourceDialogRelationshipsEl, node, { mode: 'dialog', filterId: 'all' });
}

function renderStaticChips(parent, node) {
  const row = createElement('div', 'chip-row');
  row.append(
    createElement('span', 'chip', lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line')),
    createElement('span', 'chip', functionKindLabel(node)),
    createElement('span', 'chip', fileName(node.modulePath)),
  );
  const counts = relationshipCounts(relationshipItemsForNode(node));
  if ((counts['other-files'] || 0) > 0) {
    row.appendChild(createElement('span', 'chip', 'Used across files'));
  } else if (node.exported) {
    row.appendChild(createElement('span', 'chip', 'Exported'));
  }
  parent.appendChild(row);
}

function functionConnectionScore(node = {}) {
  return safeArray(edgesByTargetId.get(node.id)).length
    + safeArray(edgesBySourceId.get(node.id)).length
    + externalRelationshipsForNode(node).length;
}

function mostConnectedFunctionForFile(modulePath) {
  return functionsForFile(modulePath)
    .sort((a, b) => functionConnectionScore(b) - functionConnectionScore(a) || sortFunctions(a, b))[0] || null;
}

function fileTakeaway(node = {}) {
  const incoming = safeArray(fileEdgesByTargetPath.get(node.modulePath)).length;
  const outgoing = safeArray(fileEdgesBySourcePath.get(node.modulePath)).length;
  return node.modulePath + ' contains ' + compactCount(node.functionCount) + ' saved '
    + plural(compactCount(node.functionCount), 'function') + ' totaling '
    + compactCount(node.totalFunctionLines) + ' function '
    + plural(compactCount(node.totalFunctionLines), 'line') + '; '
    + incoming + ' ' + plural(incoming, 'file') + ' use it, and it uses '
    + outgoing + ' ' + plural(outgoing, 'file') + '.';
}

function renderFileMetrics(parent, node = {}) {
  const incoming = safeArray(fileEdgesByTargetPath.get(node.modulePath)).length;
  const outgoing = safeArray(fileEdgesBySourcePath.get(node.modulePath)).length;
  const row = createElement('div', 'connection-metrics');
  for (const item of [
    { label: 'Functions', value: compactCount(node.functionCount), className: '' },
    { label: 'Function lines', value: compactCount(node.totalFunctionLines), className: '' },
    { label: 'Used by files', value: incoming, className: 'is-incoming' },
    { label: 'Uses files', value: outgoing, className: 'is-outgoing' },
  ]) {
    const metric = createElement('span', 'connection-metric ' + item.className);
    metric.append(createElement('strong', '', String(item.value)), createElement('span', '', item.label));
    row.appendChild(metric);
  }
  parent.appendChild(row);
}

function renderRelatedFilePill(edge, direction) {
  const modulePath = direction === 'incoming' ? edge.sourceFilePath : edge.targetFilePath;
  const fileNode = fileByPath.get(modulePath);
  const button = createElement('button', 'related-node');
  button.type = 'button';
  button.setAttribute('aria-label', 'Select ' + modulePath);
  button.addEventListener('click', () => {
    selectFile(modulePath, { reason: 'select-related-file', restoreFocusEl: button, scroll: true });
  });
  const swatch = createElement('span', 'related-node-swatch');
  swatch.style.background = fileColorByPath.get(modulePath) || '#64748b';
  button.append(
    swatch,
    createElement('span', 'related-node-label', shortLabel(modulePath, 24)),
    createElement('span', 'related-node-meta', fileNode ? fileEdgeCallLabel(edge) : 'file link'),
  );
  return button;
}

function renderFileConnectionGroup(parent, title, edgesForGroup, direction) {
  const section = createElement('section', 'relationship-group');
  section.appendChild(createElement('h4', '', title));
  if (edgesForGroup.length === 0) {
    section.appendChild(createElement('p', 'empty-note', 'No saved file links in this direction.'));
  } else {
    const strip = createElement('div', 'related-node-strip');
    for (const edge of edgesForGroup) strip.appendChild(renderRelatedFilePill(edge, direction));
    section.appendChild(strip);
  }
  parent.appendChild(section);
}

function renderSelectedFilePanel(node) {
  selectedTitleEl.textContent = 'File Details';
  const titleRow = createElement('div', 'function-title');
  const titleGroup = createElement('div');
  titleGroup.append(
    createElement('h3', '', node.modulePath),
    createElement('p', 'function-path', compactCount(node.functionCount) + ' '
      + plural(compactCount(node.functionCount), 'function') + ' in this source file'),
  );
  const actions = createElement('div', 'toolbar-group');
  const showFunctionsButton = createElement('button', '', 'Show its functions');
  showFunctionsButton.type = 'button';
  showFunctionsButton.addEventListener('click', () => {
    setNetworkNodeVisibility(
      { files: true, functions: true },
      { reason: 'show-file-functions', focusFilePath: node.modulePath },
    );
  });
  actions.appendChild(showFunctionsButton);
  titleRow.append(titleGroup, actions);

  selectedFunctionEl.appendChild(titleRow);
  selectedFunctionEl.appendChild(createElement('p', 'takeaway', fileTakeaway(node)));
  renderFileMetrics(selectedFunctionEl, node);
  renderFileConnectionGroup(
    selectedFunctionEl,
    'Files that use it',
    safeArray(fileEdgesByTargetPath.get(node.modulePath)),
    'incoming',
  );
  renderFileConnectionGroup(
    selectedFunctionEl,
    'Files it uses',
    safeArray(fileEdgesBySourcePath.get(node.modulePath)),
    'outgoing',
  );
}

function relationshipGroupTitle(groupId) {
  return ({
    incoming: 'Used by',
    outgoing: 'Uses',
    external: 'Browser/library',
    unresolved: "Couldn't trace",
  })[groupId] || 'Relationships';
}

function relationshipGroupForItem(item) {
  if (item.kind === 'external' && item.tags.includes('couldnt-trace')) return 'unresolved';
  if (item.kind === 'external') return 'external';
  return item.direction === 'incoming' ? 'incoming' : 'outgoing';
}

function renderRelationshipItem(item, mode = 'panel') {
  const targetNode = item.functionId ? functionById.get(item.functionId) : null;
  const element = createElement(targetNode ? 'button' : 'div', 'relationship-item');
  if (targetNode) {
    element.type = 'button';
    element.setAttribute('aria-label', (mode === 'dialog' ? 'Open ' : 'Select ') + displayName(targetNode));
    element.addEventListener('click', () => {
      if (mode === 'dialog') {
        showSourceDialogForFunctionId(targetNode.id, element);
      } else {
        selectFunction(targetNode.id, { reason: 'select-related-function', restoreFocusEl: element });
        scrollFunctionIntoView(targetNode.id);
      }
    });
  }
  const title = createElement('div', 'relationship-name', item.title);
  const meta = createElement('div', 'relationship-meta', item.meta);
  const chipRow = createElement('div', 'chip-row');
  for (const chip of [item.lineHint, item.syntax].filter(Boolean)) {
    chipRow.appendChild(createElement('span', 'chip', chip));
  }
  element.append(title, meta);
  if (chipRow.children.length > 0) element.appendChild(chipRow);
  return element;
}

function renderRelationshipList(parent, node, { mode = 'panel', filterId = activeRelationFilter } = {}) {
  parent.textContent = '';
  const items = relationshipItemsForNode(node);
  const visibleItems = filteredRelationshipItems(items, filterId);
  if (items.length === 0) {
    parent.appendChild(createElement('p', 'empty-note', 'No saved callers or uses were traced for this function.'));
    return;
  }
  if (visibleItems.length === 0) {
    parent.appendChild(createElement('p', 'empty-note', 'No relationships match that focus.'));
    return;
  }

  const groups = new Map();
  for (const item of visibleItems) {
    const group = relationshipGroupForItem(item);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  for (const groupId of ['incoming', 'outgoing', 'external', 'unresolved']) {
    const groupItems = groups.get(groupId) || [];
    if (groupItems.length === 0) continue;
    const section = createElement('section', 'relationship-group');
    section.appendChild(createElement('h4', '', relationshipGroupTitle(groupId)));
    for (const item of groupItems) section.appendChild(renderRelationshipItem(item, mode));
    parent.appendChild(section);
  }
}

function renderSelectedFunctionPanel() {
  selectedFunctionEl.textContent = '';
  const selectedFile = selectedFilePath ? fileByPath.get(selectedFilePath) : null;
  if (selectedFile) {
    renderSelectedFilePanel(selectedFile);
    return;
  }

  selectedTitleEl.textContent = 'Function Details';
  const node = selectedFunctionId ? functionById.get(selectedFunctionId) : null;
  if (!node) {
    selectedTitleEl.textContent = 'Graph Details';
    const emptyText = networkShowsFilesAndFunctions()
      ? 'Select a file to see its role, or select a function to see who uses it, what it uses, and its source.'
      : (networkShowsFiles()
        ? 'Select a file in the graph to see which files use it and which files it uses.'
        : 'Select a function in the graph to see who uses it, what it uses, and its source.');
    selectedFunctionEl.appendChild(createElement(
      'p',
      'empty-note',
      emptyText,
    ));
    return;
  }

  const titleRow = createElement('div', 'function-title');
  const titleGroup = createElement('div');
  titleGroup.append(
    createElement('h3', '', callableLabel(displayName(node))),
    createElement('p', 'function-path', node.modulePath + ':' + lineRange(node)),
  );
  const actions = createElement('div', 'toolbar-group');
  const openButton = createElement('button', '', 'Open source');
  openButton.type = 'button';
  openButton.addEventListener('click', () => showSourceDialogForFunctionId(node.id, openButton));
  actions.appendChild(openButton);
  titleRow.append(titleGroup, actions);
  selectedFunctionEl.appendChild(titleRow);
  selectedFunctionEl.appendChild(createElement('p', 'takeaway', takeawayForNode(node)));
  renderStaticChips(selectedFunctionEl, node);
  renderFilterControls(selectedFunctionEl, relationshipItemsForNode(node));
  renderCompactRelationshipSummary(selectedFunctionEl, node, { mode: 'panel' });
  renderConnectionDisclosure(selectedFunctionEl, node, { mode: 'panel' });
}

function filterMatchedNodeIds(node, items) {
  const matchedItems = filteredRelationshipItems(items);
  const ids = new Set([node.id]);
  for (const item of matchedItems) {
    if (item.functionId) ids.add(item.functionId);
  }
  return ids;
}

function filterMatchedEdgeIds(items) {
  return new Set(filteredRelationshipItems(items)
    .map((item) => item.edgeId)
    .filter(Boolean));
}

function filePathForRenderedNode(nodeEl) {
  return nodeEl.getAttribute('data-file-path') || '';
}

function renderedNodeKind(nodeEl) {
  return nodeEl.getAttribute('data-node-kind') || 'function';
}

function functionEdgeIsIncomingToFile(edge, modulePath) {
  return edge.targetModulePath === modulePath && edge.sourceModulePath !== modulePath;
}

function functionEdgeIsOutgoingFromFile(edge, modulePath) {
  return edge.sourceModulePath === modulePath && edge.targetModulePath !== modulePath;
}

function updateNetworkHighlights() {
  const selectedNode = selectedFunctionId ? functionById.get(selectedFunctionId) : null;
  const selectedFile = selectedFilePath ? fileByPath.get(selectedFilePath) : null;
  const incomingEdges = selectedNode ? safeArray(edgesByTargetId.get(selectedNode.id)) : [];
  const outgoingEdges = selectedNode ? safeArray(edgesBySourceId.get(selectedNode.id)) : [];
  const incomingSources = new Set(incomingEdges.map((edge) => edge.sourceId));
  const outgoingTargets = new Set(outgoingEdges.map((edge) => edge.targetId));
  const items = selectedNode ? relationshipItemsForNode(selectedNode) : [];
  const matchedNodeIds = selectedNode ? filterMatchedNodeIds(selectedNode, items) : new Set();
  const matchedEdgeIds = selectedNode ? filterMatchedEdgeIds(items) : new Set();
  const incomingFilePaths = new Set(safeArray(fileEdgesByTargetPath.get(selectedFile?.modulePath))
    .map((edge) => edge.sourceFilePath));
  const outgoingFilePaths = new Set(safeArray(fileEdgesBySourcePath.get(selectedFile?.modulePath))
    .map((edge) => edge.targetFilePath));
  const childFunctionIds = new Set(safeArray(functionIdsByFile.get(selectedFile?.modulePath)));

  networkSvgEl.classList.toggle('has-selection', Boolean(selectedNode || selectedFile));
  networkSvgEl.classList.toggle('has-filter', Boolean(selectedNode && activeRelationFilter !== 'all'));
  networkResetSelectionBtn.disabled = !(selectedNode || selectedFile);

  for (const nodeEl of Array.from(networkSvgEl.querySelectorAll('.network-node'))) {
    const nodeKind = renderedNodeKind(nodeEl);
    const filePath = filePathForRenderedNode(nodeEl);
    const functionId = nodeEl.getAttribute('data-function-id');
    if (nodeKind === 'file') {
      nodeEl.classList.toggle('is-selected', filePath === selectedFile?.modulePath);
      nodeEl.classList.toggle('is-caller', incomingFilePaths.has(filePath));
      nodeEl.classList.toggle('is-callee', outgoingFilePaths.has(filePath));
      nodeEl.classList.toggle('is-child', false);
      nodeEl.classList.toggle('is-parent', Boolean(selectedNode && filePath === selectedNode.modulePath));
      nodeEl.classList.toggle('is-filter-match', Boolean(selectedNode && filePath === selectedNode.modulePath));
    } else {
      nodeEl.classList.toggle('is-selected', functionId === selectedNode?.id);
      nodeEl.classList.toggle('is-caller', incomingSources.has(functionId));
      nodeEl.classList.toggle('is-callee', outgoingTargets.has(functionId));
      nodeEl.classList.toggle('is-child', childFunctionIds.has(functionId));
      nodeEl.classList.toggle('is-parent', false);
      nodeEl.classList.toggle('is-filter-match', matchedNodeIds.has(functionId));
    }
  }
  for (const edgeEl of Array.from(networkSvgEl.querySelectorAll('.network-edge'))) {
    const edgeId = edgeEl.getAttribute('data-edge-id');
    const sourceId = edgeEl.getAttribute('data-source-id');
    const targetId = edgeEl.getAttribute('data-target-id');
    const sourceFile = edgeEl.getAttribute('data-source-file') || '';
    const targetFile = edgeEl.getAttribute('data-target-file') || '';
    const membership = edgeEl.classList.contains('is-membership');
    const fileCall = edgeEl.classList.contains('is-file-call');
    const incomingToSelectedFile = Boolean(selectedFile && (
      fileCall
        ? targetFile === selectedFile.modulePath
        : functionEdgeIsIncomingToFile({ sourceModulePath: sourceFile, targetModulePath: targetFile }, selectedFile.modulePath)
    ));
    const outgoingFromSelectedFile = Boolean(selectedFile && (
      fileCall
        ? sourceFile === selectedFile.modulePath
        : functionEdgeIsOutgoingFromFile({ sourceModulePath: sourceFile, targetModulePath: targetFile }, selectedFile.modulePath)
    ));
    const insideSelectedFile = Boolean(selectedFile && sourceFile === selectedFile.modulePath && targetFile === selectedFile.modulePath);
    edgeEl.classList.toggle('is-incoming', Boolean(
      (selectedNode && targetId === selectedNode.id)
        || (!membership && incomingToSelectedFile && sourceFile !== selectedFile?.modulePath),
    ));
    edgeEl.classList.toggle('is-outgoing', Boolean(
      (selectedNode && sourceId === selectedNode.id)
        || (!membership && outgoingFromSelectedFile && targetFile !== selectedFile?.modulePath),
    ));
    edgeEl.classList.toggle('is-child', Boolean(
      (membership && selectedFile && sourceFile === selectedFile.modulePath)
        || (!membership && insideSelectedFile)
        || (membership && selectedNode && targetId === selectedNode.id),
    ));
    edgeEl.classList.toggle('is-filter-match', matchedEdgeIds.has(edgeId));
  }

  const modeLabel = graphStatusLabel(networkLayout?.mode);
  const graph = networkGraph();
  const visibleSummary = networkVisibleSummary(graph);
  if (selectedNode) {
    const usedBy = incomingEdges.length;
    const uses = outgoingEdges.length + externalRelationshipsForNode(selectedNode).length;
    latestFunctionGraphStatus = modeLabel + ': selected ' + displayName(selectedNode) + '; '
      + visibleSummary + '; '
      + usedBy + ' ' + plural(usedBy, 'function') + ' use it; it uses ' + uses + '.';
  } else if (selectedFile) {
    const usedBy = safeArray(fileEdgesByTargetPath.get(selectedFile.modulePath)).length;
    const uses = safeArray(fileEdgesBySourcePath.get(selectedFile.modulePath)).length;
    latestFunctionGraphStatus = modeLabel + ': selected ' + selectedFile.modulePath + '; '
      + visibleSummary + '; '
      + compactCount(selectedFile.functionCount) + ' '
      + plural(compactCount(selectedFile.functionCount), 'function') + '; '
      + usedBy + ' ' + plural(usedBy, 'file') + ' use it; it uses '
      + uses + ' ' + plural(uses, 'file') + '.';
  } else {
    latestFunctionGraphStatus = modeLabel + ': ' + visibleSummary + '.';
  }
  updateVisualizationStatus();
}

function setRelationFilter(filterId) {
  activeRelationFilter = relationFilters.some((filter) => filter.id === filterId) ? filterId : 'all';
  renderSelectedFunctionPanel();
  if (sourceDialogEl.open && sourceDialogState.functionId) renderSourceDialogFunction(sourceDialogState.functionId);
  updateNetworkHighlights();
  sendViewerBridgeState('focus-relationships');
}

function refreshNetworkForSelection({ forceScroll = false } = {}) {
  layoutFunctionNetwork();
  renderFunctionNetwork();
  requestAnimationFrame(() => scrollSelectionIntoViewIfNeeded({ force: Boolean(forceScroll) }));
}

function selectFunction(functionId, {
  reason = 'select-function',
  restoreFocusEl = null,
  scroll = false,
  allowHiddenSource = false,
} = {}) {
  const node = functionById.get(functionId);
  if (!node) return false;
  if (!allowHiddenSource && !networkSourceMatchesPath(node.modulePath)) return false;
  selectedFunctionId = functionId;
  selectedFilePath = '';
  if (!relationshipItemsForNode(node).some((item) => item.tags.includes(activeRelationFilter))) {
    activeRelationFilter = 'all';
  }
  renderSelectedFunctionPanel();
  refreshNetworkForSelection({ forceScroll: Boolean(scroll) });
  if (restoreFocusEl) sourceDialogRestoreFocusEl = restoreFocusEl;
  sendViewerBridgeState(reason);
  return true;
}

function selectFile(modulePath, {
  reason = 'select-file',
  restoreFocusEl = null,
  scroll = false,
  allowHiddenSource = false,
} = {}) {
  if (!fileByPath.has(modulePath)) return false;
  if (!allowHiddenSource && !networkSourceMatchesPath(modulePath)) return false;
  selectedFilePath = modulePath;
  selectedFunctionId = '';
  activeRelationFilter = 'all';
  renderSelectedFunctionPanel();
  refreshNetworkForSelection({ forceScroll: Boolean(scroll) });
  if (restoreFocusEl) sourceDialogRestoreFocusEl = restoreFocusEl;
  sendViewerBridgeState(reason);
  return true;
}

function clearSelection() {
  selectedFunctionId = '';
  selectedFilePath = '';
  activeRelationFilter = 'all';
  renderSelectedFunctionPanel();
  refreshNetworkForSelection();
  sendViewerBridgeState('clear-selection');
}

function reconcileSelectionForNodeVisibility() {
  if (selectedFunctionId) {
    const selectedNode = functionById.get(selectedFunctionId);
    if (selectedNode && networkShowsFunctions() && networkSourceMatchesPath(selectedNode.modulePath)) {
      selectedFilePath = '';
      return;
    }
    selectedFunctionId = '';
    activeRelationFilter = 'all';
    if (selectedNode
      && networkShowsFiles()
      && fileByPath.has(selectedNode.modulePath)
      && networkSourceMatchesPath(selectedNode.modulePath)) {
      selectedFilePath = selectedNode.modulePath;
      return;
    }
  }

  if (selectedFilePath) {
    if (networkShowsFiles() && fileByPath.has(selectedFilePath) && networkSourceMatchesPath(selectedFilePath)) return;
    const previousFilePath = selectedFilePath;
    selectedFilePath = '';
    if (networkShowsFunctions() && networkSourceMatchesPath(previousFilePath)) {
      const child = mostConnectedFunctionForFile(previousFilePath);
      if (child) selectedFunctionId = child.id;
    }
  }
}

function dialogGroupForNode(node) {
  return functions.filter((candidate) => candidate.modulePath === node.modulePath).sort(sortFunctions);
}

function updateDialogNavigationControls() {
  const canGoPrevious = sourceDialogState.group.length > 1 && sourceDialogState.index > 0;
  const canGoNext = sourceDialogState.group.length > 1 && sourceDialogState.index < sourceDialogState.group.length - 1;
  sourceDialogPreviousBtn.disabled = !canGoPrevious;
  sourceDialogNextBtn.disabled = !canGoNext;
}

function renderDialogInsight(node) {
  sourceDialogInsightEl.textContent = '';
  sourceDialogInsightEl.appendChild(createElement('p', 'takeaway', takeawayForNode(node)));
  renderStaticChips(sourceDialogInsightEl, node);
  renderFilterControls(sourceDialogInsightEl, relationshipItemsForNode(node));
  renderRelationshipMetrics(sourceDialogInsightEl, relationshipItemsForNode(node));
}

function miniNodeLabel(node, center = false) {
  return shortLabel(displayName(node), center ? 14 : 10);
}

function renderNeighborhoodNode(parent, { x, y, node, color, center = false }) {
  const group = createSvgElement('g', {
    class: 'neighborhood-node' + (center ? ' is-center' : ''),
    role: 'button',
    tabindex: 0,
    'aria-label': 'Open ' + displayName(node),
  });
  const title = createSvgElement('title');
  title.textContent = nodeAriaLabel(node);
  group.appendChild(title);
  group.appendChild(createSvgElement('circle', {
    cx: x,
    cy: y,
    r: center ? 22 : 15,
    fill: color,
  }));
  const label = createSvgElement('text', {
    x,
    y: center ? y + 38 : y + 28,
    'text-anchor': 'middle',
  });
  label.textContent = miniNodeLabel(node, center);
  group.appendChild(label);
  addKeyboardActivation(group, () => showSourceDialogForFunctionId(node.id, group));
  parent.appendChild(group);
}

function renderExternalNeighborhoodNode(parent, { x, y, item }) {
  const group = createSvgElement('g', { class: 'neighborhood-node is-external' });
  const title = createSvgElement('title');
  title.textContent = item.title + ' from ' + item.meta;
  group.appendChild(title);
  group.appendChild(createSvgElement('rect', {
    x: x - 15,
    y: y - 15,
    width: 30,
    height: 30,
    rx: 8,
    fill: item.tags.includes('couldnt-trace') ? '#f97316' : '#0f766e',
  }));
  const label = createSvgElement('text', {
    x,
    y: y + 28,
    'text-anchor': 'middle',
  });
  label.textContent = shortLabel(item.title.replace(/\(\)$/, ''), 10);
  group.appendChild(label);
  parent.appendChild(group);
}

function miniEdge(parent, x1, y1, x2, y2, className) {
  const middleX = (x1 + x2) / 2;
  parent.appendChild(createSvgElement('path', {
    class: 'neighborhood-edge ' + className,
    d: ['M', x1, y1, 'C', middleX, y1, middleX, y2, x2, y2].join(' '),
    'marker-end': 'url(#neighborhood-arrow)',
  }));
}

function spreadCoordinate(index, count, start, end) {
  if (count <= 1) return (start + end) / 2;
  return start + index * ((end - start) / (count - 1));
}

function gridPosition(index, count, { x1, x2, y1, y2 }) {
  const rows = count > 4 ? 2 : 1;
  const columns = Math.ceil(count / rows);
  const row = Math.floor(index / columns);
  const column = index - row * columns;
  const rowCount = row === rows - 1 ? count - row * columns : columns;
  return {
    x: spreadCoordinate(column, rowCount, x1, x2),
    y: spreadCoordinate(row, rows, y1, y2),
  };
}

function renderNeighborhood(node) {
  sourceDialogNeighborhoodEl.hidden = false;
  sourceDialogNeighborhoodEl.textContent = '';
  const svg = createSvgElement('svg', { viewBox: '0 0 700 154', role: 'img', 'aria-label': 'Local imports and uses for ' + displayName(node) });
  const defs = createSvgElement('defs');
  const marker = createSvgElement('marker', {
    id: 'neighborhood-arrow',
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto',
  });
  marker.appendChild(createSvgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#718096' }));
  defs.appendChild(marker);
  svg.appendChild(defs);
  const incomingLabel = createSvgElement('text', {
    class: 'neighborhood-label is-incoming',
    x: 160,
    y: 23,
    'text-anchor': 'middle',
  });
  incomingLabel.textContent = 'Imported/used by';
  const outgoingLabel = createSvgElement('text', {
    class: 'neighborhood-label is-outgoing',
    x: 540,
    y: 23,
    'text-anchor': 'middle',
  });
  outgoingLabel.textContent = 'Imports/uses';
  svg.append(incomingLabel, outgoingLabel);

  const allItems = relationshipItemsForNode(node);
  const items = filteredRelationshipItems(allItems);
  const allIncoming = items.filter((item) => item.direction === 'incoming' && item.functionId);
  const allOutgoing = [
    ...items.filter((item) => item.direction === 'outgoing' && item.functionId),
    ...items.filter((item) => item.kind === 'external'),
  ];
  const incoming = allIncoming.slice(0, 8);
  const outgoing = allOutgoing.slice(0, 6);
  const hiddenCount = Math.max(0, allIncoming.length - incoming.length)
    + Math.max(0, allOutgoing.length - outgoing.length);
  const center = { x: 350, y: 78 };

  incoming.forEach((item, index) => {
    const caller = functionById.get(item.functionId);
    if (!caller) return;
    const position = gridPosition(index, incoming.length, { x1: 58, x2: 262, y1: 56, y2: 108 });
    miniEdge(svg, position.x + 18, position.y, center.x - 24, center.y, 'is-incoming');
    renderNeighborhoodNode(svg, {
      x: position.x,
      y: position.y,
      node: caller,
      color: fileColorByPath.get(caller.modulePath) || '#64748b',
    });
  });

  outgoing.forEach((item, index) => {
    const position = gridPosition(index, outgoing.length, { x1: 438, x2: 642, y1: 56, y2: 108 });
    miniEdge(svg, center.x + 24, center.y, position.x - 18, position.y, 'is-outgoing');
    if (item.functionId) {
      const target = functionById.get(item.functionId);
      if (!target) return;
      renderNeighborhoodNode(svg, {
        x: position.x,
        y: position.y,
        node: target,
        color: fileColorByPath.get(target.modulePath) || '#64748b',
      });
    } else {
      renderExternalNeighborhoodNode(svg, { x: position.x, y: position.y, item });
    }
  });

  renderNeighborhoodNode(svg, {
    x: center.x,
    y: center.y,
    node,
    color: fileColorByPath.get(node.modulePath) || '#64748b',
    center: true,
  });

  if (items.length === 0) {
    const message = createSvgElement('text', {
      x: 350,
      y: 143,
      'text-anchor': 'middle',
      fill: '#667085',
      'font-size': 13,
      'font-weight': 700,
    });
    message.textContent = 'No nearby functions were traced.';
    svg.appendChild(message);
  } else if (hiddenCount > 0 || allItems.length > items.length) {
    const message = createSvgElement('text', {
      x: 350,
      y: 146,
      'text-anchor': 'middle',
      fill: '#667085',
      'font-size': 12,
      'font-weight': 700,
    });
    const filterLabel = activeRelationFilter === 'all'
      ? 'Showing main nearby functions'
      : 'Focused on ' + relationFilters.find((filter) => filter.id === activeRelationFilter)?.label;
    message.textContent = filterLabel + (hiddenCount > 0 ? '; +' + hiddenCount + ' more in details.' : '.');
    svg.appendChild(message);
  }

  sourceDialogNeighborhoodEl.appendChild(svg);
}

function moduleIncomingPaths(modulePath) {
  return Array.from(outputModuleByPath.values())
    .filter((module) => safeArray(module.localDependencies).includes(modulePath))
    .map((module) => module.path)
    .sort(compareFilePaths);
}

function moduleOutgoingPaths(modulePath) {
  return safeArray(outputModuleRecord(modulePath)?.localDependencies)
    .filter((dependency) => outputModuleByPath.has(dependency))
    .sort(compareFilePaths);
}

function moduleDialogGroup() {
  return Array.from(outputModuleByPath.keys()).sort(compareFilePaths);
}

function moduleNeighborLabel(modulePath, center = false) {
  return shortLabel(fileName(modulePath), center ? 18 : 14);
}

function moduleRelationshipCount(modulePath) {
  return moduleIncomingPaths(modulePath).length + moduleOutgoingPaths(modulePath).length;
}

function renderModuleNeighborhoodNode(parent, { x, y, modulePath, center = false }) {
  const group = createSvgElement('g', {
    class: 'neighborhood-node source-module-neighborhood-node' + (center ? ' is-center' : ''),
    role: 'button',
    tabindex: 0,
    'aria-label': 'Open full source for ' + modulePath,
  });
  const title = createSvgElement('title');
  title.textContent = modulePath;
  group.appendChild(title);
  group.appendChild(createSvgElement('rect', {
    x: x - (center ? 58 : 42),
    y: y - (center ? 20 : 16),
    width: center ? 116 : 84,
    height: center ? 40 : 32,
    rx: 8,
    fill: fileColorByPath.get(modulePath) || '#64748b',
  }));
  const label = createSvgElement('text', {
    x,
    y: center ? y + 4 : y + 4,
    'text-anchor': 'middle',
  });
  label.textContent = moduleNeighborLabel(modulePath, center);
  group.appendChild(label);
  addKeyboardActivation(group, () => showSourceDialogForModulePath(modulePath, group));
  parent.appendChild(group);
}

function renderModuleNeighborhoodOverflow(parent, x, y, count) {
  if (count <= 0) return;
  const label = createSvgElement('text', {
    x,
    y,
    'text-anchor': 'middle',
    fill: '#667085',
    'font-size': 12,
    'font-weight': 800,
  });
  label.textContent = '+' + count + ' more in details';
  parent.appendChild(label);
}

function renderModuleNeighborhood(modulePath) {
  sourceDialogNeighborhoodEl.hidden = false;
  sourceDialogNeighborhoodEl.textContent = '';
  const svg = createSvgElement('svg', { viewBox: '0 0 700 154', role: 'img', 'aria-label': 'Module imports for ' + modulePath });
  const defs = createSvgElement('defs');
  const marker = createSvgElement('marker', {
    id: 'neighborhood-arrow',
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto',
  });
  marker.appendChild(createSvgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#718096' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const incomingLabel = createSvgElement('text', {
    class: 'neighborhood-label is-incoming',
    x: 160,
    y: 23,
    'text-anchor': 'middle',
  });
  incomingLabel.textContent = 'Imported by';
  const outgoingLabel = createSvgElement('text', {
    class: 'neighborhood-label is-outgoing',
    x: 540,
    y: 23,
    'text-anchor': 'middle',
  });
  outgoingLabel.textContent = 'Imports';
  svg.append(incomingLabel, outgoingLabel);

  const incoming = moduleIncomingPaths(modulePath);
  const outgoing = moduleOutgoingPaths(modulePath);
  const shownIncoming = incoming.slice(0, 6);
  const shownOutgoing = outgoing.slice(0, 6);
  const center = { x: 350, y: 78 };

  shownIncoming.forEach((incomingPath, index) => {
    const position = gridPosition(index, shownIncoming.length, { x1: 58, x2: 262, y1: 56, y2: 108 });
    miniEdge(svg, position.x + 46, position.y, center.x - 62, center.y, 'is-incoming');
    renderModuleNeighborhoodNode(svg, { x: position.x, y: position.y, modulePath: incomingPath });
  });

  shownOutgoing.forEach((outgoingPath, index) => {
    const position = gridPosition(index, shownOutgoing.length, { x1: 438, x2: 642, y1: 56, y2: 108 });
    miniEdge(svg, center.x + 62, center.y, position.x - 46, position.y, 'is-outgoing');
    renderModuleNeighborhoodNode(svg, { x: position.x, y: position.y, modulePath: outgoingPath });
  });

  renderModuleNeighborhoodNode(svg, { x: center.x, y: center.y, modulePath, center: true });
  renderModuleNeighborhoodOverflow(svg, 160, 145, Math.max(0, incoming.length - shownIncoming.length));
  renderModuleNeighborhoodOverflow(svg, 540, 145, Math.max(0, outgoing.length - shownOutgoing.length));

  if (incoming.length === 0 && outgoing.length === 0) {
    const message = createSvgElement('text', {
      x: 350,
      y: 145,
      'text-anchor': 'middle',
      fill: '#667085',
      'font-size': 13,
      'font-weight': 700,
    });
    message.textContent = 'No local module imports were traced.';
    svg.appendChild(message);
  }

  sourceDialogNeighborhoodEl.appendChild(svg);
}

function renderModuleInsight(modulePath, sourceRecord) {
  const incoming = moduleIncomingPaths(modulePath);
  const outgoing = moduleOutgoingPaths(modulePath);
  const functionsInModule = functionsForFile(modulePath);
  sourceDialogInsightEl.textContent = '';
  const available = Boolean(sourceRecord?.code);
  sourceDialogInsightEl.appendChild(createElement(
    'p',
    'takeaway',
    available
      ? 'Full saved module source is available for ' + modulePath + '.'
      : 'Full module source is unavailable for ' + modulePath + '.',
  ));

  const row = createElement('div', 'connection-metrics');
  for (const item of [
    { label: 'Lines', value: moduleLineCount(modulePath), className: '' },
    { label: 'Imported by', value: incoming.length, className: 'is-incoming' },
    { label: 'Imports', value: outgoing.length, className: 'is-outgoing' },
    { label: 'Functions', value: functionsInModule.length, className: '' },
  ]) {
    const metric = createElement('span', 'connection-metric ' + item.className);
    metric.append(createElement('strong', '', String(item.value)), createElement('span', '', item.label));
    row.appendChild(metric);
  }
  sourceDialogInsightEl.appendChild(row);

  if (!available) {
    sourceDialogInsightEl.appendChild(createElement(
      'p',
      'empty-note',
      'Regenerate this viewer with --source-mode full or --include-source to enable full-file source popups.',
    ));
  }
}

function moduleRelationshipButton(modulePath) {
  const button = createElement('button', 'relationship-item');
  button.type = 'button';
  button.setAttribute('aria-label', 'Open full source for ' + modulePath);
  button.append(
    createElement('div', 'relationship-name', modulePath),
    createElement('div', 'relationship-meta', moduleLineCount(modulePath) + ' ' + plural(moduleLineCount(modulePath), 'line')),
  );
  button.addEventListener('click', () => showSourceDialogForModulePath(modulePath, button));
  return button;
}

function renderModuleRelationshipGroup(parent, title, modulePaths) {
  const section = createElement('section', 'relationship-group');
  section.appendChild(createElement('h4', '', title));
  if (modulePaths.length === 0) {
    section.appendChild(createElement('p', 'empty-note', 'No saved module links in this direction.'));
  } else {
    for (const modulePath of modulePaths) section.appendChild(moduleRelationshipButton(modulePath));
  }
  parent.appendChild(section);
}

function renderModuleConnectionDisclosure(modulePath) {
  const incoming = moduleIncomingPaths(modulePath);
  const outgoing = moduleOutgoingPaths(modulePath);
  const count = incoming.length + outgoing.length;
  sourceDialogConnectionsEl.hidden = count === 0;
  sourceDialogConnectionsEl.open = false;
  sourceDialogConnectionsSummaryEl.textContent = 'Module connections (' + count + ')';
  sourceDialogRelationshipsEl.textContent = '';
  renderModuleRelationshipGroup(sourceDialogRelationshipsEl, 'Imported by', incoming);
  renderModuleRelationshipGroup(sourceDialogRelationshipsEl, 'Imports', outgoing);
}

function renderSourceDialogModule(modulePath) {
  const safeModulePath = safeOutputModulePath(modulePath);
  if (!safeModulePath || !outputModuleByPath.has(safeModulePath)) return;
  const sourceRecord = moduleSourceByPath.get(safeModulePath);
  sourceDialogTitleEl.textContent = fileName(safeModulePath);
  sourceDialogPathEl.textContent = safeModulePath + (moduleLineCount(safeModulePath)
    ? ' (' + moduleLineCount(safeModulePath) + ' ' + plural(moduleLineCount(safeModulePath), 'line') + ')'
    : '');
  renderModuleNeighborhood(safeModulePath);
  sourceDialogCodeEl.textContent = sourceRecord?.code || [
    unavailableSourceComment('Module'),
    '// Re-run IronGlancer with --source-mode full or --include-source to save full module code.',
  ].join('\n');
  renderModuleInsight(safeModulePath, sourceRecord);
  renderModuleConnectionDisclosure(safeModulePath);
  updateDialogNavigationControls();
}

function showSourceDialogForModulePath(modulePath, restoreFocusEl = null) {
  const safeModulePath = safeOutputModulePath(modulePath);
  if (!safeModulePath || !outputModuleByPath.has(safeModulePath)) return false;
  const group = moduleDialogGroup();
  sourceDialogState = {
    functionId: '',
    declaration: null,
    modulePath: safeModulePath,
    group,
    index: group.indexOf(safeModulePath),
  };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  renderSourceDialogModule(safeModulePath);
  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
  sourceDialogCloseBtn.focus();
  sendViewerBridgeState(moduleSourceByPath.has(safeModulePath) ? 'open-module-source' : 'open-module-source-unavailable');
  return true;
}

function renderSourceDialogFunction(functionId) {
  const node = functionById.get(functionId);
  if (!node) return;
  const declaration = declarationForFunctionNode(node);
  sourceDialogTitleEl.textContent = callableLabel(displayName(node));
  sourceDialogPathEl.textContent = node.modulePath + ':' + lineRange(node);
  renderDialogInsight(node);
  renderNeighborhood(node);
  sourceDialogCodeEl.textContent = declaration.code || unavailableSourceComment('Function');
  renderSourceConnectionDisclosure(node);
  updateDialogNavigationControls();
}

function showSourceDialogForFunctionId(functionId, restoreFocusEl = null) {
  const node = functionById.get(functionId);
  if (!node) return false;
  if (networkSourceMatchesPath(node.modulePath)) {
    selectFunction(functionId, { reason: 'open-source', restoreFocusEl });
  }
  const group = dialogGroupForNode(node);
  sourceDialogState = {
    functionId,
    declaration: null,
    modulePath: '',
    group,
    index: group.findIndex((candidate) => candidate.id === functionId),
  };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  renderSourceDialogFunction(functionId);
  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
  sourceDialogCloseBtn.focus();
  sendViewerBridgeState('open-source');
  return true;
}

function navigateSourceDialog(direction) {
  const nextIndex = sourceDialogState.index + direction;
  if (nextIndex < 0 || nextIndex >= sourceDialogState.group.length) return;
  if (sourceDialogState.modulePath) {
    const modulePath = sourceDialogState.group[nextIndex];
    sourceDialogState = {
      functionId: '',
      declaration: null,
      modulePath,
      group: sourceDialogState.group,
      index: nextIndex,
    };
    renderSourceDialogModule(modulePath);
    if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
    sendViewerBridgeState('navigate-module-source');
    return;
  }
  if (sourceDialogState.declaration) {
    const declaration = sourceDialogState.group[nextIndex];
    const node = functionNodeForDeclaration(declaration);
    if (node && networkSourceMatchesPath(node.modulePath)) {
      selectFunction(node.id, { reason: 'navigate-source', scroll: true });
    }
    sourceDialogState = {
      functionId: node?.id || '',
      declaration,
      modulePath: '',
      group: sourceDialogState.group,
      index: nextIndex,
    };
    renderSourceDialogDeclaration(declaration);
    if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
    sendViewerBridgeState('navigate-source');
    return;
  }

  const node = sourceDialogState.group[nextIndex];
  sourceDialogState = {
    functionId: node.id,
    declaration: null,
    modulePath: '',
    group: sourceDialogState.group,
    index: nextIndex,
  };
  if (networkSourceMatchesPath(node.modulePath)) {
    selectFunction(node.id, { reason: 'navigate-source', scroll: true });
  }
  renderSourceDialogFunction(node.id);
  if (sourceDialogBodyEl) sourceDialogBodyEl.scrollTop = 0;
  sendViewerBridgeState('navigate-source');
}

function closeSourceDialog() {
  const restoreFocusEl = sourceDialogRestoreFocusEl;
  sourceDialogRestoreFocusEl = null;
  sourceDialogState = { functionId: '', declaration: null, modulePath: '', group: [], index: -1 };
  updateDialogNavigationControls();
  if (sourceDialogEl.open && typeof sourceDialogEl.close === 'function') {
    sourceDialogEl.close();
  } else {
    sourceDialogEl.removeAttribute('open');
  }
  if (restoreFocusEl && typeof restoreFocusEl.focus === 'function') restoreFocusEl.focus();
  sendViewerBridgeState('close-source');
}

function declarationSnapshotForFunctionId(functionId) {
  const node = functionById.get(functionId);
  if (!node) return null;
  return {
    functionId: node.id,
    functionStableId: node.stableId || null,
    modulePath: node.modulePath || null,
    name: node.name || node.declarationName || null,
    startLine: node.startLine || null,
    endLine: node.endLine || null,
  };
}

function declarationSnapshotForSourceDeclaration(declaration) {
  if (!declaration) return null;
  return {
    functionId: declaration.functionId || null,
    functionStableId: declaration.functionStableId || null,
    moduleId: declaration.moduleId || null,
    modulePath: declaration.modulePath || null,
    name: declaration.name || declaration.declarationName || null,
    declarationName: declaration.declarationName || declaration.name || null,
    sourceOrigin: declaration.sourceOrigin || null,
    startLine: declaration.startLine || null,
    endLine: declaration.endLine || null,
  };
}

function fileSnapshotForModulePath(modulePath) {
  const node = fileByPath.get(modulePath);
  if (!node) return null;
  return {
    fileId: node.id,
    fileStableId: node.stableId || node.id,
    modulePath: node.modulePath,
    path: node.path || node.modulePath,
    name: node.name || fileName(node.modulePath),
    functionCount: compactCount(node.functionCount),
    totalFunctionLines: compactCount(node.totalFunctionLines),
  };
}

function moduleSourceSnapshotForModulePath(modulePath) {
  const safeModulePath = safeOutputModulePath(modulePath);
  if (!safeModulePath || !outputModuleByPath.has(safeModulePath)) return null;
  return {
    kind: 'module',
    modulePath: safeModulePath,
    path: safeModulePath,
    name: fileName(safeModulePath),
    lineCount: moduleLineCount(safeModulePath),
    sourceAvailable: moduleSourceByPath.has(safeModulePath),
  };
}

function openSourceSnapshot() {
  if (sourceDialogState.modulePath) return moduleSourceSnapshotForModulePath(sourceDialogState.modulePath);
  if (sourceDialogState.declaration) {
    return {
      kind: 'declaration',
      ...declarationSnapshotForSourceDeclaration(sourceDialogState.declaration),
    };
  }
  const snapshot = declarationSnapshotForFunctionId(sourceDialogState.functionId);
  return snapshot ? { kind: 'function', ...snapshot } : null;
}

function currentGraphPresentationState() {
  const graph = networkGraph();
  return {
    primaryView: activePrimaryView,
    layout: activeNetworkLayoutMode,
    nodeVisibility: { ...activeNetworkNodeVisibility },
    sourceFileTypes: { ...activeNetworkSourceFileTypes },
    scope: activeNetworkScope,
    depth: activeNetworkDepth,
    selectedFunction: declarationSnapshotForFunctionId(selectedFunctionId),
    selectedFile: fileSnapshotForModulePath(selectedFilePath),
    visible: {
      filtered: Boolean(graph.filtered),
      files: graph.fileNodes.length,
      functions: graph.functions.length,
      functionEdges: graph.edges.length,
      fileEdges: graph.fileEdges.length,
    },
  };
}

function bridgeSnapshotMatches(localSnapshot = {}, bridgeSnapshot = {}) {
  return ['buildId', 'sourceCodeHash'].every((key) => (
    !localSnapshot[key] || !bridgeSnapshot[key] || localSnapshot[key] === bridgeSnapshot[key]
  ));
}

function agentFocusLabel() {
  const selectedFunction = declarationSnapshotForFunctionId(selectedFunctionId);
  if (selectedFunction) return callableLabel(selectedFunction.name) + ' in ' + selectedFunction.modulePath;
  if (sourceDialogState.modulePath) return sourceDialogState.modulePath;
  if (selectedFilePath) return selectedFilePath;
  return 'None';
}

function agentViewLabel() {
  if (activePrimaryView === 'function-graphs') {
    return 'Functions ' + activeNetworkLayoutMode + ' ' + activeNetworkScope + ' depth ' + activeNetworkDepth;
  }
  return 'Components';
}

function updateAgentPanel() {
  if (!agentPanelEl) return;
  if (!viewerBridge.enabled) {
    agentPanelEl.hidden = true;
    agentPanelEl.classList.remove('is-connected');
    return;
  }
  agentPanelEl.hidden = false;
  agentPanelEl.classList.add('is-connected');
  if (agentConnectionEl) {
    const build = viewerBridge.snapshot?.buildId ? shortLabel(viewerBridge.snapshot.buildId, 10) : 'unknown build';
    agentConnectionEl.textContent = 'Connected ' + build;
  }
  if (agentContextEl) {
    agentContextEl.textContent = 'Focus ' + agentFocusLabel() + ' | ' + agentViewLabel();
  }
  if (agentLastResultEl) {
    const command = viewerBridge.lastCommand?.command?.type || viewerBridge.lastCommand?.type || 'Agent';
    const result = viewerBridge.lastResult?.message || 'Ready';
    agentLastResultEl.textContent = command + ': ' + result + ' | Presentation only';
  }
}

function currentViewerState(reason) {
  return {
    clientId: viewerBridge.clientId,
    revision: ++viewerBridge.stateRevision,
    reason,
    snapshot: viewerBridge.snapshot,
    primaryView: activePrimaryView,
    graph: currentGraphPresentationState(),
    selectedFunction: declarationSnapshotForFunctionId(selectedFunctionId),
    selectedFile: fileSnapshotForModulePath(selectedFilePath),
    openSource: openSourceSnapshot(),
    highlighted: declarationSnapshotForFunctionId(selectedFunctionId),
    viewport: {
      layout: activeNetworkLayoutMode,
      primaryView: activePrimaryView,
      nodeVisibility: { ...activeNetworkNodeVisibility },
      sourceFileTypes: { ...activeNetworkSourceFileTypes },
      scope: activeNetworkScope,
      depth: activeNetworkDepth,
      zoom: networkZoom,
      scrollLeft: networkViewportEl.scrollLeft,
      scrollTop: networkViewportEl.scrollTop,
    },
  };
}

async function postViewerBridgeJson(pathname, payload) {
  if (!viewerBridge.enabled) return null;
  const response = await fetch(new URL(pathname, viewerBridge.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.ok ? response.json() : null;
}

function sendViewerBridgeState(reason) {
  if (!viewerBridge.enabled) return;
  updateAgentPanel();
  postViewerBridgeJson('state', currentViewerState(reason)).catch(() => {});
}

function functionIdForViewerCommand(command = {}) {
  const targetStableId = String(command.targetStableId || command.functionStableId || '').trim();
  const targetId = String(command.targetId || command.functionId || '').trim();
  if (targetStableId && functionByStableId.has(targetStableId)) return functionByStableId.get(targetStableId).id;
  if (targetId && functionById.has(targetId)) return targetId;
  const modulePath = String(command.modulePath || '').trim();
  const name = String(command.name || command.functionName || '').trim();
  const line = Number(command.startLine || command.line || 0);
  if (!modulePath || !name) return '';
  return functions.find((node) => (
    node.modulePath === modulePath
    && (node.name === name || node.declarationName === name)
    && (!line || node.startLine === line)
  ))?.id || '';
}

function hasCommandField(command, fieldName) {
  return Object.prototype.hasOwnProperty.call(command, fieldName);
}

function commandBooleanValue(command, fieldName) {
  if (!hasCommandField(command, fieldName)) return null;
  return typeof command[fieldName] === 'boolean' ? command[fieldName] : null;
}

function commandSourceFileTypesValue(command = {}) {
  if (hasCommandField(command, 'sourceFileTypes')) {
    const value = command.sourceFileTypes;
    if (typeof value === 'string') return parseNetworkSourceFileTypes(value);
    if (Array.isArray(value)) {
      return normalizeNetworkSourceFileTypes({
        jsx: value.map((item) => String(item).trim().toLowerCase()).includes('jsx'),
        js: value.map((item) => String(item).trim().toLowerCase()).includes('js'),
      });
    }
    if (value && typeof value === 'object') return normalizeNetworkSourceFileTypes(value);
  }

  const showJsx = commandBooleanValue(command, 'showJsx');
  const showJs = commandBooleanValue(command, 'showJs');
  if (showJsx !== null || showJs !== null) {
    return normalizeNetworkSourceFileTypes({
      jsx: showJsx === null ? activeNetworkSourceFileTypes.jsx : showJsx,
      js: showJs === null ? activeNetworkSourceFileTypes.js : showJs,
    });
  }
  return null;
}

function commandScopeValue(command = {}) {
  if (hasCommandField(command, 'scope')) return command.scope;
  if (hasCommandField(command, 'direction')) return command.direction;
  return null;
}

function commandDepthValue(command = {}) {
  if (hasCommandField(command, 'depth')) return command.depth;
  if (hasCommandField(command, 'hops')) return command.hops;
  return null;
}

function applyGraphViewCommand(command = {}) {
  let primaryChanged = false;
  let graphChanged = false;
  let controlsChanged = false;

  if (hasCommandField(command, 'primaryView')) {
    const nextPrimaryView = primaryViewRecord(command.primaryView).id;
    if (nextPrimaryView !== activePrimaryView) {
      activePrimaryView = nextPrimaryView;
      persistPrimaryViewMode(nextPrimaryView);
      primaryChanged = true;
    }
  }

  if (hasCommandField(command, 'layout')) {
    const nextLayout = networkLayoutModeRecord(command.layout).id;
    if (nextLayout !== activeNetworkLayoutMode) {
      activeNetworkLayoutMode = nextLayout;
      persistNetworkLayoutMode(nextLayout);
      graphChanged = true;
      controlsChanged = true;
    }
  }

  const nextScopeValue = commandScopeValue(command);
  if (nextScopeValue !== null) {
    const nextScope = networkScopeRecord(nextScopeValue).id;
    if (nextScope !== activeNetworkScope) {
      activeNetworkScope = nextScope;
      persistNetworkScope(nextScope);
      graphChanged = true;
      controlsChanged = true;
    }
  }

  const nextDepthValue = commandDepthValue(command);
  if (nextDepthValue !== null) {
    const nextDepth = networkDepthRecord(nextDepthValue).id;
    if (nextDepth !== activeNetworkDepth) {
      activeNetworkDepth = nextDepth;
      persistNetworkDepth(nextDepth);
      graphChanged = true;
      controlsChanged = true;
    }
  }

  const showFiles = commandBooleanValue(command, 'showFiles');
  const showFunctions = commandBooleanValue(command, 'showFunctions');
  if (showFiles !== null || showFunctions !== null) {
    const nextVisibility = normalizeNetworkNodeVisibility({
      files: showFiles === null ? activeNetworkNodeVisibility.files : showFiles,
      functions: showFunctions === null ? activeNetworkNodeVisibility.functions : showFunctions,
    });
    if (nextVisibility.files !== activeNetworkNodeVisibility.files
      || nextVisibility.functions !== activeNetworkNodeVisibility.functions) {
      activeNetworkNodeVisibility = nextVisibility;
      persistNetworkNodeVisibility(nextVisibility);
      graphChanged = true;
      controlsChanged = true;
    }
  }

  const nextSourceFileTypes = commandSourceFileTypesValue(command);
  if (nextSourceFileTypes) {
    if (nextSourceFileTypes.jsx !== activeNetworkSourceFileTypes.jsx
      || nextSourceFileTypes.js !== activeNetworkSourceFileTypes.js) {
      activeNetworkSourceFileTypes = nextSourceFileTypes;
      persistNetworkSourceFileTypes(nextSourceFileTypes);
      graphChanged = true;
      controlsChanged = true;
    }
  }

  if (controlsChanged) {
    reconcileSelectionForNodeVisibility();
    renderNetworkLayoutSwitch();
    renderNetworkNodeSwitch();
    renderNetworkSourceSwitch();
    renderNetworkScopeSwitch();
    renderNetworkDepthSwitch();
    renderSelectedFunctionPanel();
    layoutFunctionNetwork();
    renderFunctionNetwork();
  }

  if (primaryChanged) applyPrimaryViewMode();
  if (graphChanged) fitCurrentNetworkLayout();
  if (!primaryChanged && !graphChanged) updateVisualizationStatus();
  sendViewerBridgeState('set-graph-view');
  return { applied: true, message: graphChanged || primaryChanged ? 'graph view updated' : 'graph view unchanged' };
}

function applyViewerBridgeCommand(command = {}) {
  const type = String(command.type || command.command || '').trim();
  if (type === 'setGraphView') return applyGraphViewCommand(command);
  if (type === 'clearHighlight') {
    clearSourceHighlight();
    clearSelection();
    return { applied: true, message: 'highlight cleared' };
  }

  const functionId = functionIdForViewerCommand(command);
  if (!functionId) return { applied: false, message: 'target function is not visible in this viewer snapshot' };
  const commandNode = functionById.get(functionId);
  if (commandNode && !networkSourceMatchesPath(commandNode.modulePath)) {
    return { applied: false, message: 'target function is hidden by the source file filter' };
  }
  const sourceRecord = sourceRecordForFunctionId(functionId);

  if (type === 'openFunction' || type === 'openSource') {
    highlightSourceRecord(sourceRecord);
    scrollSourceRecordIntoView(sourceRecord);
    scrollFunctionIntoView(functionId);
    showSourceDialogForFunctionId(functionId, networkNodeElement(functionId));
    return { applied: true, message: 'source opened' };
  }
  if (type === 'focusFunction' || type === 'highlightFunction') {
    highlightSourceRecord(sourceRecord);
    scrollSourceRecordIntoView(sourceRecord);
    selectFunction(functionId, { reason: 'focus-function', scroll: true });
    return { applied: true, message: 'function focused' };
  }
  if (type === 'scrollToFunction') {
    scrollSourceRecordIntoView(sourceRecord);
    selectFunction(functionId, { reason: 'scroll-function', scroll: true });
    return { applied: true, message: 'function scrolled into view' };
  }
  return { applied: false, message: 'unknown presentation command' };
}

async function acknowledgeViewerBridgeCommand(commandRecord, result) {
  await postViewerBridgeJson('ack', {
    clientId: viewerBridge.clientId,
    commandId: commandRecord.commandId,
    commandRevision: commandRecord.revision,
    status: result.applied ? 'applied' : 'error',
    message: result.message,
    stateRevision: viewerBridge.stateRevision,
  });
}

async function pollViewerBridgeCommands() {
  if (!viewerBridge.enabled) return;
  try {
    const url = new URL('commands', viewerBridge.url);
    url.searchParams.set('clientId', viewerBridge.clientId);
    url.searchParams.set('afterRevision', String(viewerBridge.commandRevision));
    const response = await fetch(url);
    if (response.ok) {
      const payload = await response.json();
      const records = safeArray(payload?.data?.commands);
      for (const record of records) {
        viewerBridge.commandRevision = Math.max(viewerBridge.commandRevision, record.revision || 0);
        viewerBridge.lastCommand = record;
        const result = applyViewerBridgeCommand(record.command || {});
        viewerBridge.lastResult = result;
        updateAgentPanel();
        await acknowledgeViewerBridgeCommand(record, result).catch(() => {});
      }
    }
  } catch {
    // The bridge is best-effort and presentation-only.
  } finally {
    if (viewerBridge.enabled) setTimeout(pollViewerBridgeCommands, 750);
  }
}

function randomClientId() {
  const cryptoApi = typeof crypto === 'object' ? crypto : null;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  return 'viewer-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function isLoopbackHost(hostname = '') {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '[::1]'
    || hostname === '::1'
    || hostname.endsWith('.localhost');
}

function viewerBridgeRequested() {
  const params = new URLSearchParams(window.location.search);
  const bridgeParam = String(params.get('bridge') || '').toLowerCase();
  if (bridgeParam === '0' || bridgeParam === 'false' || bridgeParam === 'off') return false;
  if (bridgeParam === '1' || bridgeParam === 'true' || bridgeParam === 'on') return true;
  const rootPath = window.location.pathname.replace(/\/index\.html$/, '/') || '/';
  return isLoopbackHost(window.location.hostname) && rootPath === '/';
}

function canUseViewerBridge() {
  return typeof window === 'object'
    && window.location
    && /^https?:$/.test(window.location.protocol)
    && typeof fetch === 'function'
    && viewerBridgeRequested();
}

async function initViewerBridge(payload = {}) {
  updateAgentPanel();
  if (!canUseViewerBridge()) return;
  const bridgeUrl = new URL('/bridge/v1/', window.location.href);
  const snapshot = {
    buildId: payload.meta?.buildId || null,
    sourceCodeHash: payload.meta?.sourceCodeHash || null,
    generatedAt: payload.meta?.generatedAt || null,
    entry: payload.entry || null,
  };
  try {
    const response = await fetch(bridgeUrl);
    if (!response.ok) return;
    const discovery = await response.json();
    const bridgeSnapshot = discovery?.data?.snapshot || null;
    if (!bridgeSnapshot || !bridgeSnapshotMatches(snapshot, bridgeSnapshot)) return;
    viewerBridge = {
      enabled: true,
      url: bridgeUrl.href,
      clientId: randomClientId(),
      stateRevision: 0,
      commandRevision: 0,
      snapshot: bridgeSnapshot,
      lastCommand: null,
      lastResult: { applied: true, message: 'Ready' },
    };
    updateAgentPanel();
    sendViewerBridgeState('ready');
    pollViewerBridgeCommands();
  } catch {
    viewerBridge = emptyViewerBridge();
    updateAgentPanel();
  }
}

function isNetworkNodeTarget(target) {
  return Boolean(target?.closest?.('.network-node,.network-edge,.network-edge-hit'));
}

function distanceBetween(pointerA, pointerB) {
  return Math.hypot(pointerA.clientX - pointerB.clientX, pointerA.clientY - pointerB.clientY);
}

function midpointBetween(pointerA, pointerB) {
  return {
    clientX: (pointerA.clientX + pointerB.clientX) / 2,
    clientY: (pointerA.clientY + pointerB.clientY) / 2,
  };
}

function startPinchIfNeeded() {
  if (activePointers.size !== 2) {
    networkPinchState = null;
    return;
  }
  const [pointerA, pointerB] = Array.from(activePointers.values());
  networkPinchState = {
    startZoom: networkZoom,
    startDistance: distanceBetween(pointerA, pointerB),
    midpoint: midpointBetween(pointerA, pointerB),
  };
}

function isModuleDiagramEdgeTarget(target) {
  let element = target;
  while (element && element !== moduleDiagramViewportEl) {
    const tagName = typeof element.tagName === 'string' ? element.tagName.toLowerCase() : '';
    if (hasClass(element, 'edge-hit-target') || hasClass(element, 'edgeLabel')) return true;
    if (tagName === 'path' && (hasClass(element, 'relation') || element.getAttribute('data-edge') === 'true')) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

function isModuleDiagramSourceTarget(target) {
  let element = target;
  while (element && element !== moduleDiagramViewportEl) {
    if (hasClass(element, 'source-member-trigger')
      || hasClass(element, 'source-member-hit-target')
      || hasClass(element, 'source-module-trigger')) return true;
    element = element.parentNode;
  }
  return false;
}

function startModuleDiagramPinchIfNeeded() {
  if (moduleDiagramPointers.size !== 2) {
    moduleDiagramPinchState = null;
    return;
  }
  const [pointerA, pointerB] = Array.from(moduleDiagramPointers.values());
  moduleDiagramPinchState = {
    startZoom: moduleDiagramZoom,
    startDistance: distanceBetween(pointerA, pointerB),
    midpoint: midpointBetween(pointerA, pointerB),
  };
}

function bindModuleDiagramInteraction() {
  moduleDiagramViewportEl.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    setModuleDiagramZoom(moduleDiagramZoom * Math.exp(-event.deltaY * 0.0025), event.clientX, event.clientY);
  }, { passive: false });

  moduleDiagramViewportEl.addEventListener('pointerdown', (event) => {
    if (isModuleDiagramEdgeTarget(event.target) || isModuleDiagramSourceTarget(event.target)) return;
    moduleDiagramPointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (moduleDiagramPointers.size === 1) {
      moduleDiagramDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: moduleDiagramViewportEl.scrollLeft,
        startScrollTop: moduleDiagramViewportEl.scrollTop,
      };
      moduleDiagramViewportEl.classList.add('is-dragging');
      moduleDiagramViewportEl.setPointerCapture(event.pointerId);
    } else {
      moduleDiagramDragState = null;
      moduleDiagramViewportEl.classList.remove('is-dragging');
      startModuleDiagramPinchIfNeeded();
    }
  });

  moduleDiagramViewportEl.addEventListener('pointermove', (event) => {
    if (!moduleDiagramPointers.has(event.pointerId)) return;
    moduleDiagramPointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (moduleDiagramPinchState && moduleDiagramPointers.size === 2) {
      const [pointerA, pointerB] = Array.from(moduleDiagramPointers.values());
      const currentDistance = distanceBetween(pointerA, pointerB);
      const midpoint = midpointBetween(pointerA, pointerB);
      if (moduleDiagramPinchState.startDistance > 0) {
        setModuleDiagramZoom(
          (currentDistance / moduleDiagramPinchState.startDistance) * moduleDiagramPinchState.startZoom,
          midpoint.clientX,
          midpoint.clientY,
        );
      }
      return;
    }
    if (!moduleDiagramDragState || moduleDiagramDragState.pointerId !== event.pointerId) return;
    moduleDiagramViewportEl.scrollLeft = moduleDiagramDragState.startScrollLeft - (event.clientX - moduleDiagramDragState.startX);
    moduleDiagramViewportEl.scrollTop = moduleDiagramDragState.startScrollTop - (event.clientY - moduleDiagramDragState.startY);
  });

  function clearPointer(event) {
    moduleDiagramPointers.delete(event.pointerId);
    if (moduleDiagramDragState && moduleDiagramDragState.pointerId === event.pointerId) {
      moduleDiagramDragState = null;
      moduleDiagramViewportEl.classList.remove('is-dragging');
    }
    if (moduleDiagramPointers.size < 2) moduleDiagramPinchState = null;
    if (moduleDiagramPointers.size === 1) {
      const [remainingId, remainingPointer] = Array.from(moduleDiagramPointers.entries())[0];
      moduleDiagramDragState = {
        pointerId: remainingId,
        startX: remainingPointer.clientX,
        startY: remainingPointer.clientY,
        startScrollLeft: moduleDiagramViewportEl.scrollLeft,
        startScrollTop: moduleDiagramViewportEl.scrollTop,
      };
      moduleDiagramViewportEl.classList.add('is-dragging');
    }
  }

  moduleDiagramViewportEl.addEventListener('pointerup', clearPointer);
  moduleDiagramViewportEl.addEventListener('pointercancel', clearPointer);
  moduleDiagramViewportEl.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse'
      && moduleDiagramDragState
      && moduleDiagramDragState.pointerId === event.pointerId
      && event.buttons === 0) {
      clearPointer(event);
    }
  });
}

function bindNetworkInteraction() {
  networkViewportEl.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    setNetworkZoom(networkZoom * Math.exp(-event.deltaY * 0.0025), event.clientX, event.clientY);
  }, { passive: false });

  networkViewportEl.addEventListener('pointerdown', (event) => {
    if (isNetworkNodeTarget(event.target)) return;
    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (activePointers.size === 1) {
      networkDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: networkViewportEl.scrollLeft,
        startScrollTop: networkViewportEl.scrollTop,
      };
      networkViewportEl.classList.add('is-dragging');
      networkViewportEl.setPointerCapture(event.pointerId);
    } else {
      networkDragState = null;
      networkViewportEl.classList.remove('is-dragging');
      startPinchIfNeeded();
    }
  });

  networkViewportEl.addEventListener('pointermove', (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (networkPinchState && activePointers.size === 2) {
      const [pointerA, pointerB] = Array.from(activePointers.values());
      const currentDistance = distanceBetween(pointerA, pointerB);
      const midpoint = midpointBetween(pointerA, pointerB);
      if (networkPinchState.startDistance > 0) {
        setNetworkZoom((currentDistance / networkPinchState.startDistance) * networkPinchState.startZoom, midpoint.clientX, midpoint.clientY);
      }
      return;
    }
    if (!networkDragState || networkDragState.pointerId !== event.pointerId) return;
    networkViewportEl.scrollLeft = networkDragState.startScrollLeft - (event.clientX - networkDragState.startX);
    networkViewportEl.scrollTop = networkDragState.startScrollTop - (event.clientY - networkDragState.startY);
  });

  function clearPointer(event) {
    activePointers.delete(event.pointerId);
    if (networkDragState && networkDragState.pointerId === event.pointerId) {
      networkDragState = null;
      networkViewportEl.classList.remove('is-dragging');
    }
    if (activePointers.size < 2) networkPinchState = null;
    if (activePointers.size === 1) {
      const [remainingId, remainingPointer] = Array.from(activePointers.entries())[0];
      networkDragState = {
        pointerId: remainingId,
        startX: remainingPointer.clientX,
        startY: remainingPointer.clientY,
        startScrollLeft: networkViewportEl.scrollLeft,
        startScrollTop: networkViewportEl.scrollTop,
      };
      networkViewportEl.classList.add('is-dragging');
    }
  }

  networkViewportEl.addEventListener('pointerup', clearPointer);
  networkViewportEl.addEventListener('pointercancel', clearPointer);
  networkViewportEl.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && networkDragState && networkDragState.pointerId === event.pointerId && event.buttons === 0) {
      clearPointer(event);
    }
  });
}

function bindControls() {
  networkZoomInBtn.addEventListener('click', () => setNetworkZoom(networkZoom * 1.2));
  networkZoomOutBtn.addEventListener('click', () => setNetworkZoom(networkZoom / 1.2));
  networkFitBtn.addEventListener('click', fitNetworkToViewport);
  networkResetViewBtn.addEventListener('click', resetNetworkView);
  networkResetSelectionBtn.addEventListener('click', clearSelection);
  moduleDiagramZoomInBtn.addEventListener('click', () => setModuleDiagramZoom(moduleDiagramZoom * 1.2));
  moduleDiagramZoomOutBtn.addEventListener('click', () => setModuleDiagramZoom(moduleDiagramZoom / 1.2));
  moduleDiagramFitBtn.addEventListener('click', fitModuleDiagramToViewport);
  moduleDiagramResetViewBtn.addEventListener('click', resetModuleDiagramView);
  copyJsxTreeBtn.addEventListener('click', () => {
    copyRawText(outputPayload?.jsxTreeText || '', 'module tree', copyJsxTreeStatusEl);
  });
  copyTreeBtn.addEventListener('click', () => {
    copyRawText(outputPayload?.treeText || '', 'dependency tree', copyTreeStatusEl);
  });
  copyMermaidSourceBtn.addEventListener('click', () => {
    copyRawText(outputPayload?.mermaid || '', 'Mermaid source', copyMermaidSourceStatusEl);
  });
  sourceDialogPreviousBtn.addEventListener('click', () => navigateSourceDialog(-1));
  sourceDialogNextBtn.addEventListener('click', () => navigateSourceDialog(1));
  sourceDialogCloseBtn.addEventListener('click', closeSourceDialog);
  sourceDialogEl.addEventListener('click', (event) => {
    if (event.target === sourceDialogEl) closeSourceDialog();
  });
  sourceDialogEl.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateSourceDialog(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateSourceDialog(1);
    } else if (event.key === 'Escape') {
      closeSourceDialog();
    }
  });
}

async function renderModuleDiagram() {
  mermaidEl.textContent = outputPayload.mermaid || '';
  renderEmptySelectedImport();
  if (!outputPayload.mermaid) {
    moduleDiagramEl.textContent = 'No file import diagram was saved.';
    updateVisualizationStatus();
    return;
  }
  const { svg } = await mermaid.render('ironglancer-file-diagram-' + Date.now(), outputPayload.mermaid);
  prepareModuleDiagramForInteraction(svg, outputPayload.importEdges);
  downloadBtn.disabled = false;
}

downloadBtn.addEventListener('click', () => {
  if (!latestModuleSvg) return;
  const blob = new Blob([latestModuleSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ironglancer-file-diagram.svg';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

async function main() {
  outputPayload = await loadJson('./output.json');
  if (!outputPayload) throw new Error('Failed to load output.json');
  buildOutputModuleIndex(outputPayload);
  sourcePayload = await loadJson('./source-code.json', { declarations: [] });
  if (!sourcePayloadMatchesOutput(outputPayload, sourcePayload)) sourcePayload = { declarations: [] };
  moduleSourcePayload = await loadJson('./source-modules.json', { modules: [] });
  if (!sourcePayloadMatchesOutput(outputPayload, moduleSourcePayload)) moduleSourcePayload = { modules: [] };
  buildModuleSourceIndex(moduleSourcePayload);
  functionMapPayload = outputPayload.functionMap || { limitations: [], functions: [], edges: [] };
  buildDeclarationIndexes(sourcePayload);
  indexFunctions();
  indexFileGraph();

  activePrimaryView = loadPrimaryViewMode();
  activeNetworkLayoutMode = loadNetworkLayoutMode();
  activeNetworkNodeVisibility = loadNetworkNodeVisibility();
  activeNetworkSourceFileTypes = loadNetworkSourceFileTypes();
  activeNetworkScope = loadNetworkScope();
  activeNetworkDepth = loadNetworkDepth();
  rawRenderText();
  subtitleEl.textContent = (outputPayload.entry || 'unknown entry') + ' | browser modules: '
    + safeArray(outputPayload.entryModules).join(', ');
  buildMetaEl.textContent = formatBuildMeta(outputPayload.meta);
  renderStats();
  applyPrimaryViewMode();
  renderNetworkLayoutSwitch();
  renderNetworkNodeSwitch();
  renderNetworkSourceSwitch();
  renderNetworkScopeSwitch();
  renderNetworkDepthSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  await renderModuleDiagram();
  await initViewerBridge(outputPayload);
}

function rawRenderText() {
  jsxTreeEl.textContent = outputPayload?.jsxTreeText || 'No component modules found.';
  treeEl.textContent = outputPayload?.treeText || '';
  mermaidEl.textContent = outputPayload?.mermaid || '';
  if (componentsListEl) componentsListEl.textContent = frontEndListText(outputPayload?.components, 'No components found.');
  if (routesListEl) routesListEl.textContent = frontEndListText(outputPayload?.routes, 'No routes found.');
  if (lazyBoundariesListEl) {
    lazyBoundariesListEl.textContent = frontEndListText(outputPayload?.lazyBoundaries, 'No lazy boundaries found.');
  }
  if (assetsListEl) assetsListEl.textContent = frontEndListText(outputPayload?.assets, 'No assets found.');
  if (findingsListEl) findingsListEl.textContent = frontEndListText(outputPayload?.findings, 'No findings.');
  copyJsxTreeBtn.disabled = false;
  copyTreeBtn.disabled = false;
  copyMermaidSourceBtn.disabled = false;
}

function frontEndListText(items, emptyText) {
  const values = safeArray(items);
  return values.length > 0 ? JSON.stringify(values, null, 2) : emptyText;
}

bindNetworkInteraction();
bindModuleDiagramInteraction();
bindControls();
main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.classList.add('error-text');
  buildMetaEl.textContent = '';
});
