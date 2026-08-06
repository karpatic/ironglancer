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
  { id: 'function-graphs', label: 'Function graphs', accessibilityLabel: 'Function graphs' },
  { id: 'jsx-map', label: 'JSX map', accessibilityLabel: 'JSX file composition map' },
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

const subtitleEl = document.getElementById('subtitle');
const buildMetaEl = document.getElementById('build-meta');
const statsEl = document.getElementById('stats');
const jsxTreeEl = document.getElementById('jsx-tree');
const treeEl = document.getElementById('tree');
const mermaidEl = document.getElementById('mermaid');
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
const fileLegendEl = document.getElementById('file-legend');
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
let functionMapPayload = { limitations: [], functions: [], edges: [] };
let latestModuleSvg = '';
let functions = [];
let edges = [];
let functionById = new Map();
let functionByStableId = new Map();
let edgesBySourceId = new Map();
let edgesByTargetId = new Map();
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
let activeRelationFilter = 'all';
let activePrimaryView = 'function-graphs';
let activeNetworkLayoutMode = 'network';
let latestFunctionGraphStatus = '';
let networkNeedsFit = true;
let moduleDiagramNeedsFit = true;
let sourceDialogState = { functionId: '', group: [], index: -1 };
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

function sourcePayloadMatchesOutput(payload = {}, source = {}) {
  const outputMeta = payload && typeof payload.meta === 'object' ? payload.meta : {};
  const sourceMeta = source && typeof source.meta === 'object' ? source.meta : {};
  return ['buildId', 'sourceCodeHash'].every((key) => outputMeta[key] && outputMeta[key] === sourceMeta[key]);
}

function sourceKey(moduleId, name) {
  return moduleId + '\u0000' + name;
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
  const visibleFiles = fileOrder.filter((modulePath) => functions.some((node) => node.modulePath === modulePath));
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
      ? 'JSX map: no file composition diagram was saved.'
      : moduleDiagramSvgEl
      ? 'JSX map: file composition, member rows, and import edges.'
      : 'JSX map: loading file composition.';
    return;
  }
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
    if (selectedFunctionId) scrollFunctionIntoView(selectedFunctionId);
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
  renderNetworkLayoutSwitch();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  sendViewerBridgeState('switch-network-layout');
}

function moduleClusterCenters(fileOrder, width, height) {
  const visibleFileOrder = fileOrder.filter((modulePath) => functions.some((node) => node.modulePath === modulePath));
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

function simulateForceLayout(layoutNodes, layoutEdges, clusterCenters, width, height) {
  const nodes = Array.from(layoutNodes.values());
  if (nodes.length === 0) return;
  const center = { x: width / 2, y: height / 2 };
  const iterations = clamp(Math.round(520 - nodes.length * 2.2), 220, 520);
  const edgeStrength = nodes.length > 90 ? 0.018 : 0.026;
  const repelStrength = nodes.length > 90 ? 5600 : 7200;
  const clusterStrength = nodes.length > 90 ? 0.006 : 0.009;
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
        const minDistance = a.radius + b.radius + 30;
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
      const desired = source.radius + target.radius + (sameFile ? 74 : 118);
      const force = (distance - desired) * edgeStrength;
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
      item.x = clamp(item.x + item.vx, item.radius + 28, width - item.radius - 28);
      item.y = clamp(item.y + item.vy, item.radius + 28, height - item.radius - 44);
    }
  }
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
  const minX = Math.min(...nodes.map((item) => item.x - item.radius - labelPadding));
  const maxX = Math.max(...nodes.map((item) => item.x + item.radius + labelPadding));
  const minY = Math.min(...nodes.map((item) => item.y - item.radius - 42));
  const maxY = Math.max(...nodes.map((item) => item.y + item.radius + 54));
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
  const lineCounts = functions.map(lineCountFor).filter((count) => count > 0);
  return {
    minLines: lineCounts.length ? Math.min(...lineCounts) : 1,
    maxLines: lineCounts.length ? Math.max(...lineCounts) : 1,
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

function functionNodesByFile(fileOrder) {
  const nodesByFile = new Map(fileOrder.map((modulePath) => [modulePath, []]));
  for (const node of functions) {
    if (!nodesByFile.has(node.modulePath)) nodesByFile.set(node.modulePath, []);
    nodesByFile.get(node.modulePath).push(node);
  }
  for (const list of nodesByFile.values()) list.sort(sortFunctions);
  return nodesByFile;
}

function layoutForceFunctionNetwork(fileOrder, lineExtents) {
  const count = Math.max(1, functions.length);
  const width = Math.max(1040, Math.ceil(Math.sqrt(count) * 195));
  const height = Math.max(680, Math.ceil(Math.sqrt(count) * 155));
  const nodes = new Map();
  const clusterCenters = moduleClusterCenters(fileOrder, width, height);

  functions.forEach((node, index) => {
    const cluster = clusterCenters.get(node.modulePath) || { x: width / 2, y: height / 2 };
    const position = networkInitialPosition(node, index, functions.length, cluster, width, height);
    nodes.set(node.id, {
      ...networkLayoutNode(node, position.x, position.y, lineExtents),
      vx: 0,
      vy: 0,
    });
  });

  simulateForceLayout(nodes, edges, clusterCenters, width, height);
  expandNetworkSpread(nodes);
  const bounds = normalizeNetworkBounds(nodes);
  networkLayout = { mode: 'network', width: bounds.width, height: bounds.height, nodes };
}

function layoutByFileFunctionNetwork(fileOrder, lineExtents) {
  const nodesByFile = functionNodesByFile(fileOrder);
  const visibleFileOrder = fileOrder.filter((modulePath) => (nodesByFile.get(modulePath) || []).length > 0);
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
  const outgoing = new Map(functions.map((node) => [node.id, new Set()]));
  const incoming = new Map(functions.map((node) => [node.id, new Set()]));
  const undirected = new Map(functions.map((node) => [node.id, new Set()]));
  for (const edge of edges) {
    if (!outgoing.has(edge.sourceId) || !outgoing.has(edge.targetId)) continue;
    outgoing.get(edge.sourceId).add(edge.targetId);
    incoming.get(edge.targetId).add(edge.sourceId);
    undirected.get(edge.sourceId).add(edge.targetId);
    undirected.get(edge.targetId).add(edge.sourceId);
  }
  return { outgoing, incoming, undirected };
}

function connectedRadialComponents(undirected) {
  const remaining = new Set(functions.map((node) => node.id));
  const components = [];
  for (const node of functions) {
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
  if (functions.length === 0) {
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

function layoutFunctionNetwork() {
  const fileOrder = buildModuleOrder();
  assignFileColors(fileOrder);
  renderFileLegend(fileOrder);
  const lineExtents = networkLineExtents();

  networkNeedsFit = true;

  if (activeNetworkLayoutMode === 'radial') {
    layoutRadialFunctionNetwork(lineExtents);
    return;
  }
  if (activeNetworkLayoutMode === 'by-file') {
    layoutByFileFunctionNetwork(fileOrder, lineExtents);
    return;
  }
  layoutForceFunctionNetwork(fileOrder, lineExtents);
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
  const endpoints = edgeEndpoint(source, target, source.radius, target.radius);
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
  const endpoints = edgeEndpoint(source, target, source.radius, target.radius);
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
  const endpoints = edgeEndpoint(source, target, source.radius, target.radius);
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

function nodeAriaLabel(node) {
  return displayName(node) + ', ' + fileName(node.modulePath) + ', '
    + lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line') + '. '
    + connectionSummary(node);
}

function edgeAriaLabel(edge) {
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
  if (!networkLayout || functions.length === 0) {
    networkSvgEl.setAttribute('viewBox', '0 0 900 420');
    const message = createSvgElement('text', {
      x: 36,
      y: 54,
      fill: '#667085',
      'font-size': 16,
      'font-weight': 700,
    });
    message.textContent = 'No saved function relationships were found.';
    networkSvgEl.appendChild(message);
    latestFunctionGraphStatus = networkLayoutModeRecord(activeNetworkLayoutMode).statusLabel
      + ': no saved function relationships were found.';
    updateVisualizationStatus();
    return;
  }

  networkSvgEl.setAttribute('viewBox', '0 0 ' + networkLayout.width + ' ' + networkLayout.height);
  networkSvgEl.setAttribute('aria-label', 'Function graph, ' + networkLayoutModeRecord(networkLayout.mode).statusLabel);
  networkSvgEl.style.width = (networkLayout.width * networkZoom) + 'px';
  networkSvgEl.style.height = (networkLayout.height * networkZoom) + 'px';

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

  const edgeGroup = createSvgElement('g', { class: 'network-edges' });
  for (const edge of edges) {
    const path = edgePath(edge);
    if (!path) continue;
    const label = edgeAriaLabel(edge);
    const visiblePath = createSvgElement('path', {
      class: 'network-edge',
      d: path,
      'data-edge-id': edge.id,
      'data-source-id': edge.sourceId,
      'data-target-id': edge.targetId,
      'marker-end': 'url(#network-arrow)',
      role: 'button',
      tabindex: 0,
      focusable: 'true',
      'aria-label': label,
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
      selectFunction(edge.targetId, { reason: 'select-function-edge', restoreFocusEl: visiblePath, scroll: true });
    };
    addKeyboardActivation(visiblePath, activate);
    hitPath.addEventListener('click', activate);
    edgeGroup.append(hitPath, visiblePath);
  }
  networkSvgEl.appendChild(edgeGroup);

  const nodeGroup = createSvgElement('g', { class: 'network-nodes' });
  for (const layoutNode of networkLayout.nodes.values()) {
    const node = layoutNode.node;
    const group = createSvgElement('g', {
      class: 'network-node',
      role: 'button',
      tabindex: 0,
      'data-function-id': node.id,
      'aria-label': nodeAriaLabel(node),
    });
    const title = createSvgElement('title');
    title.textContent = displayName(node) + ' in ' + node.modulePath + ', '
      + lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line') + '. '
      + connectionSummary(node);
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
    nodeGroup.appendChild(group);
  }
  networkSvgEl.appendChild(nodeGroup);
  updateNetworkHighlights();
}

function networkNodeElement(functionId) {
  return networkSvgEl.querySelector('.network-node[data-function-id="' + CSS.escape(functionId) + '"]');
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

function renderDeclarationFallbackDialog(declaration, restoreFocusEl = null) {
  sourceDialogState = { functionId: '', group: [], index: -1 };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  sourceDialogTitleEl.textContent = callableLabel(declaration.name || declaration.declarationName || 'Source');
  sourceDialogPathEl.textContent = (declaration.modulePath || 'unknown source') + ':' + lineRange(declaration);
  sourceDialogInsightEl.textContent = '';
  sourceDialogInsightEl.appendChild(createElement('p', 'takeaway', 'Saved source for this diagram member is available, but it is not present in the function graph snapshot.'));
  sourceDialogNeighborhoodEl.textContent = '';
  sourceDialogCodeEl.textContent = declaration.code || '// Source snippet was not saved for this member.';
  sourceDialogConnectionsEl.hidden = true;
  updateDialogNavigationControls();
  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  sourceDialogBodyEl.scrollTop = 0;
  sourceDialogCloseBtn.focus();
  sendViewerBridgeState('open-source');
}

function openSourceDeclarationFromDiagram(declaration, restoreFocusEl) {
  const node = functionNodeForDeclaration(declaration);
  if (node) {
    showSourceDialogForFunctionId(node.id, restoreFocusEl);
    return true;
  }
  renderDeclarationFallbackDialog(declaration, restoreFocusEl);
  return true;
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
    renderStat('files', outputPayload?.summary?.moduleCount || outputPayload?.modules?.length || 0),
    renderStat('functions', functions.length),
    renderStat('function links', edges.length),
    renderStat('browser/library', browserLibraryCount),
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
  const node = selectedFunctionId ? functionById.get(selectedFunctionId) : null;
  if (!node) {
    selectedFunctionEl.appendChild(createElement(
      'p',
      'empty-note',
      'Select a function in the graph to see who uses it, what it uses, and its source.',
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

function updateNetworkHighlights() {
  const selectedNode = selectedFunctionId ? functionById.get(selectedFunctionId) : null;
  const incomingEdges = selectedNode ? safeArray(edgesByTargetId.get(selectedNode.id)) : [];
  const outgoingEdges = selectedNode ? safeArray(edgesBySourceId.get(selectedNode.id)) : [];
  const incomingSources = new Set(incomingEdges.map((edge) => edge.sourceId));
  const outgoingTargets = new Set(outgoingEdges.map((edge) => edge.targetId));
  const items = selectedNode ? relationshipItemsForNode(selectedNode) : [];
  const matchedNodeIds = selectedNode ? filterMatchedNodeIds(selectedNode, items) : new Set();
  const matchedEdgeIds = selectedNode ? filterMatchedEdgeIds(items) : new Set();

  networkSvgEl.classList.toggle('has-selection', Boolean(selectedNode));
  networkSvgEl.classList.toggle('has-filter', Boolean(selectedNode && activeRelationFilter !== 'all'));
  networkResetSelectionBtn.disabled = !selectedNode;

  for (const nodeEl of Array.from(networkSvgEl.querySelectorAll('.network-node'))) {
    const functionId = nodeEl.getAttribute('data-function-id');
    nodeEl.classList.toggle('is-selected', functionId === selectedNode?.id);
    nodeEl.classList.toggle('is-caller', incomingSources.has(functionId));
    nodeEl.classList.toggle('is-callee', outgoingTargets.has(functionId));
    nodeEl.classList.toggle('is-filter-match', matchedNodeIds.has(functionId));
  }
  for (const edgeEl of Array.from(networkSvgEl.querySelectorAll('.network-edge'))) {
    const edgeId = edgeEl.getAttribute('data-edge-id');
    const sourceId = edgeEl.getAttribute('data-source-id');
    const targetId = edgeEl.getAttribute('data-target-id');
    edgeEl.classList.toggle('is-incoming', Boolean(selectedNode && targetId === selectedNode.id));
    edgeEl.classList.toggle('is-outgoing', Boolean(selectedNode && sourceId === selectedNode.id));
    edgeEl.classList.toggle('is-filter-match', matchedEdgeIds.has(edgeId));
  }

  const modeLabel = networkLayoutModeRecord(networkLayout?.mode).statusLabel;
  if (selectedNode) {
    const usedBy = incomingEdges.length;
    const uses = outgoingEdges.length + externalRelationshipsForNode(selectedNode).length;
    latestFunctionGraphStatus = modeLabel + ': selected ' + displayName(selectedNode) + ': '
      + usedBy + ' ' + plural(usedBy, 'function') + ' use it; it uses ' + uses + '.';
  } else {
    latestFunctionGraphStatus = modeLabel + ': ' + functions.length + ' functions, ' + edges.length + ' saved function links.';
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

function selectFunction(functionId, { reason = 'select-function', restoreFocusEl = null, scroll = false } = {}) {
  if (!functionById.has(functionId)) return false;
  selectedFunctionId = functionId;
  if (!relationshipItemsForNode(functionById.get(functionId)).some((item) => item.tags.includes(activeRelationFilter))) {
    activeRelationFilter = 'all';
  }
  renderSelectedFunctionPanel();
  updateNetworkHighlights();
  if (scroll) scrollFunctionIntoView(functionId);
  if (restoreFocusEl) sourceDialogRestoreFocusEl = restoreFocusEl;
  sendViewerBridgeState(reason);
  return true;
}

function clearSelection() {
  selectedFunctionId = '';
  activeRelationFilter = 'all';
  renderSelectedFunctionPanel();
  updateNetworkHighlights();
  sendViewerBridgeState('clear-selection');
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
  const group = createSvgElement('g', { class: 'neighborhood-node' });
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
  sourceDialogNeighborhoodEl.textContent = '';
  const svg = createSvgElement('svg', { viewBox: '0 0 700 190', role: 'img', 'aria-label': 'Nearby functions for ' + displayName(node) });
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
  const center = { x: 350, y: 92 };

  incoming.forEach((item, index) => {
    const caller = functionById.get(item.functionId);
    if (!caller) return;
    const position = gridPosition(index, incoming.length, { x1: 58, x2: 262, y1: 52, y2: 132 });
    miniEdge(svg, position.x + 18, position.y, center.x - 24, center.y, 'is-incoming');
    renderNeighborhoodNode(svg, {
      x: position.x,
      y: position.y,
      node: caller,
      color: fileColorByPath.get(caller.modulePath) || '#64748b',
    });
  });

  outgoing.forEach((item, index) => {
    const position = gridPosition(index, outgoing.length, { x1: 438, x2: 642, y1: 52, y2: 132 });
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
      y: 168,
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
      y: 178,
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

function renderSourceDialogFunction(functionId) {
  const node = functionById.get(functionId);
  if (!node) return;
  const declaration = declarationForFunctionNode(node);
  sourceDialogTitleEl.textContent = callableLabel(displayName(node));
  sourceDialogPathEl.textContent = node.modulePath + ':' + lineRange(node);
  renderDialogInsight(node);
  renderNeighborhood(node);
  sourceDialogCodeEl.textContent = declaration.code || '// Source snippet was not saved for this function.';
  renderSourceConnectionDisclosure(node);
  updateDialogNavigationControls();
}

function showSourceDialogForFunctionId(functionId, restoreFocusEl = null) {
  const node = functionById.get(functionId);
  if (!node) return false;
  selectFunction(functionId, { reason: 'open-source', restoreFocusEl });
  const group = dialogGroupForNode(node);
  sourceDialogState = {
    functionId,
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
  sourceDialogBodyEl.scrollTop = 0;
  sourceDialogCloseBtn.focus();
  sendViewerBridgeState('open-source');
  return true;
}

function navigateSourceDialog(direction) {
  const nextIndex = sourceDialogState.index + direction;
  if (nextIndex < 0 || nextIndex >= sourceDialogState.group.length) return;
  const node = sourceDialogState.group[nextIndex];
  sourceDialogState = {
    functionId: node.id,
    group: sourceDialogState.group,
    index: nextIndex,
  };
  selectFunction(node.id, { reason: 'navigate-source', scroll: true });
  renderSourceDialogFunction(node.id);
  sourceDialogBodyEl.scrollTop = 0;
  sendViewerBridgeState('navigate-source');
}

function closeSourceDialog() {
  const restoreFocusEl = sourceDialogRestoreFocusEl;
  sourceDialogRestoreFocusEl = null;
  sourceDialogState = { functionId: '', group: [], index: -1 };
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

function currentViewerState(reason) {
  return {
    clientId: viewerBridge.clientId,
    revision: ++viewerBridge.stateRevision,
    reason,
    snapshot: viewerBridge.snapshot,
    openSource: declarationSnapshotForFunctionId(sourceDialogState.functionId),
    highlighted: declarationSnapshotForFunctionId(selectedFunctionId),
    viewport: {
      layout: activeNetworkLayoutMode,
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

function applyViewerBridgeCommand(command = {}) {
  const type = String(command.type || command.command || '').trim();
  if (type === 'clearHighlight') {
    clearSourceHighlight();
    clearSelection();
    return { applied: true, message: 'highlight cleared' };
  }

  const functionId = functionIdForViewerCommand(command);
  if (!functionId) return { applied: false, message: 'target function is not visible in this viewer snapshot' };
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
        const result = applyViewerBridgeCommand(record.command || {});
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
    viewerBridge = {
      enabled: true,
      url: bridgeUrl.href,
      clientId: randomClientId(),
      stateRevision: 0,
      commandRevision: 0,
      snapshot,
    };
    sendViewerBridgeState('ready');
    pollViewerBridgeCommands();
  } catch {
    viewerBridge = emptyViewerBridge();
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
    if (hasClass(element, 'source-member-trigger') || hasClass(element, 'source-member-hit-target')) return true;
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
  sourcePayload = await loadJson('./source-code.json', { declarations: [] });
  if (!sourcePayloadMatchesOutput(outputPayload, sourcePayload)) sourcePayload = { declarations: [] };
  functionMapPayload = outputPayload.functionMap || { limitations: [], functions: [], edges: [] };
  buildDeclarationIndexes(sourcePayload);
  indexFunctions();

  activePrimaryView = loadPrimaryViewMode();
  activeNetworkLayoutMode = loadNetworkLayoutMode();
  rawRenderText();
  subtitleEl.textContent = (outputPayload.entry || 'unknown entry') + '  |  ' + (outputPayload.rootDir || 'unknown root');
  buildMetaEl.textContent = formatBuildMeta(outputPayload.meta);
  renderStats();
  applyPrimaryViewMode();
  renderNetworkLayoutSwitch();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  fitCurrentNetworkLayout();
  await renderModuleDiagram();
  await initViewerBridge(outputPayload);
}

function rawRenderText() {
  jsxTreeEl.textContent = outputPayload?.jsxTreeText || 'No JSX files found.';
  treeEl.textContent = outputPayload?.treeText || '';
  mermaidEl.textContent = outputPayload?.mermaid || '';
}

bindNetworkInteraction();
bindModuleDiagramInteraction();
bindControls();
main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.classList.add('error-text');
  buildMetaEl.textContent = '';
});
