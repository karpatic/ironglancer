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

const subtitleEl = document.getElementById('subtitle');
const buildMetaEl = document.getElementById('build-meta');
const statsEl = document.getElementById('stats');
const jsxTreeEl = document.getElementById('jsx-tree');
const treeEl = document.getElementById('tree');
const mermaidEl = document.getElementById('mermaid');
const moduleDiagramEl = document.getElementById('module-diagram');
const downloadBtn = document.getElementById('download-svg-btn');
const networkStatusEl = document.getElementById('network-status');
const networkViewportEl = document.getElementById('function-network-viewport');
const networkSvgEl = document.getElementById('function-network-svg');
const networkZoomStatusEl = document.getElementById('network-zoom-status');
const networkZoomInBtn = document.getElementById('network-zoom-in-btn');
const networkZoomOutBtn = document.getElementById('network-zoom-out-btn');
const networkFitBtn = document.getElementById('network-fit-btn');
const networkResetViewBtn = document.getElementById('network-reset-view-btn');
const networkResetSelectionBtn = document.getElementById('network-reset-selection-btn');
const fileLegendEl = document.getElementById('file-legend');
const selectedFunctionEl = document.getElementById('selected-function');
const sourceDialogEl = document.getElementById('source-dialog');
const sourceDialogTitleEl = document.getElementById('source-dialog-title');
const sourceDialogPathEl = document.getElementById('source-dialog-path');
const sourceDialogInsightEl = document.getElementById('source-dialog-insight');
const sourceDialogNeighborhoodEl = document.getElementById('source-dialog-neighborhood');
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
let fileColorByPath = new Map();
let networkLayout = null;
let networkZoom = 1;
let networkBaseWidth = 0;
let networkBaseHeight = 0;
let networkDragState = null;
let networkPinchState = null;
const activePointers = new Map();
let selectedFunctionId = '';
let activeRelationFilter = 'all';
let sourceDialogState = { functionId: '', group: [], index: -1 };
let sourceDialogRestoreFocusEl = null;
let viewerBridge = emptyViewerBridge();

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

function buildDeclarationIndexes(payload = {}) {
  declarationsByFunctionId = new Map();
  declarationsByFunctionStableId = new Map();
  declarationsByModule = new Map();
  for (const declaration of safeArray(payload.declarations)) {
    const functionId = String(declaration.functionId || '').trim();
    const stableId = String(declaration.functionStableId || '').trim();
    const modulePath = String(declaration.modulePath || '').trim();
    if (functionId && !declarationsByFunctionId.has(functionId)) declarationsByFunctionId.set(functionId, declaration);
    if (stableId && !declarationsByFunctionStableId.has(stableId)) {
      declarationsByFunctionStableId.set(stableId, declaration);
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
  return null;
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

function layoutFunctionNetwork() {
  const fileOrder = buildModuleOrder();
  assignFileColors(fileOrder);
  renderFileLegend(fileOrder);

  const nodesByFile = new Map(fileOrder.map((modulePath) => [modulePath, []]));
  for (const node of functions) {
    if (!nodesByFile.has(node.modulePath)) nodesByFile.set(node.modulePath, []);
    nodesByFile.get(node.modulePath).push(node);
  }
  for (const list of nodesByFile.values()) list.sort(sortFunctions);

  const lineCounts = functions.map(lineCountFor).filter((count) => count > 0);
  const minLines = lineCounts.length ? Math.min(...lineCounts) : 1;
  const maxLines = lineCounts.length ? Math.max(...lineCounts) : 1;
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
      nodes.set(node.id, {
        node,
        x,
        y: marginY + index * rowGap,
        radius: scaledNodeRadius(node, minLines, maxLines),
        color: fileColorByPath.get(node.modulePath) || '#64748b',
      });
    });
  });

  networkBaseWidth = width;
  networkBaseHeight = height;
  networkLayout = { width, height, lanes, nodes };
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

function edgePath(edge) {
  const source = networkLayout.nodes.get(edge.sourceId);
  const target = networkLayout.nodes.get(edge.targetId);
  if (!source || !target) return '';
  if (edge.sourceId === edge.targetId) {
    const r = source.radius + 20;
    return [
      'M', source.x + source.radius, source.y,
      'C', source.x + r, source.y - r,
      source.x + r, source.y + r,
      source.x + source.radius, source.y + 2,
    ].join(' ');
  }
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
    return;
  }

  networkSvgEl.setAttribute('viewBox', '0 0 ' + networkLayout.width + ' ' + networkLayout.height);
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
    label.appendChild(createSvgElement('title'));
    label.querySelector('title').textContent = lane.modulePath;
    laneGroup.appendChild(label);
  }
  networkSvgEl.appendChild(laneGroup);

  const edgeGroup = createSvgElement('g', { class: 'network-edges' });
  for (const edge of edges) {
    const path = edgePath(edge);
    if (!path) continue;
    const visiblePath = createSvgElement('path', {
      class: 'network-edge',
      d: path,
      'data-edge-id': edge.id,
      'data-source-id': edge.sourceId,
      'data-target-id': edge.targetId,
      'marker-end': 'url(#network-arrow)',
    });
    const hitPath = createSvgElement('path', {
      class: 'network-edge-hit',
      d: path,
      'aria-hidden': 'true',
      'data-edge-id': edge.id,
    });
    const title = createSvgElement('title');
    title.textContent = displayName(functionById.get(edge.sourceId)) + ' uses '
      + displayName(functionById.get(edge.targetId));
    visiblePath.appendChild(title);
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

function renderStaticChips(parent, node) {
  const row = createElement('div', 'chip-row');
  row.append(
    createElement('span', 'chip', lineCountFor(node) + ' ' + plural(lineCountFor(node), 'line')),
    createElement('span', 'chip', functionKindLabel(node)),
    createElement('span', 'chip', fileName(node.modulePath)),
  );
  if (node.exported) row.appendChild(createElement('span', 'chip', 'Shared from file'));
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

function renderRelationshipList(parent, node, { mode = 'panel' } = {}) {
  parent.textContent = '';
  const items = relationshipItemsForNode(node);
  const visibleItems = filteredRelationshipItems(items);
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
    for (const item of groupItems.slice(0, 10)) section.appendChild(renderRelationshipItem(item, mode));
    if (groupItems.length > 10) {
      section.appendChild(createElement('p', 'empty-note', '+' + (groupItems.length - 10) + ' more'));
    }
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
      'Select a function in the network to see who uses it, what it uses, and its source.',
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
  const list = createElement('div', 'relationship-list');
  selectedFunctionEl.appendChild(list);
  renderRelationshipList(list, node, { mode: 'panel' });
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

  if (selectedNode) {
    const usedBy = incomingEdges.length;
    const uses = outgoingEdges.length + externalRelationshipsForNode(selectedNode).length;
    networkStatusEl.textContent = 'Selected ' + displayName(selectedNode) + ': '
      + usedBy + ' ' + plural(usedBy, 'function') + ' use it; it uses ' + uses + '.';
  } else {
    networkStatusEl.textContent = functions.length + ' functions, ' + edges.length + ' saved function links.';
  }
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
}

function miniNodeLabel(node) {
  return shortLabel(displayName(node), 13);
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
    r: center ? 24 : 18,
    fill: color,
  }));
  const label = createSvgElement('text', {
    x: center ? x : x + 25,
    y: center ? y + 40 : y + 4,
    'text-anchor': center ? 'middle' : 'start',
  });
  label.textContent = miniNodeLabel(node);
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
    x: x - 18,
    y: y - 18,
    width: 36,
    height: 36,
    rx: 8,
    fill: item.tags.includes('couldnt-trace') ? '#f97316' : '#0f766e',
  }));
  const label = createSvgElement('text', {
    x: x + 25,
    y: y + 4,
    'text-anchor': 'start',
  });
  label.textContent = shortLabel(item.title.replace(/\(\)$/, ''), 13);
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

function distributedY(index, count, height, top = 58, bottom = 190) {
  if (count <= 1) return height / 2;
  const gap = (bottom - top) / Math.max(1, count - 1);
  return top + index * gap;
}

function renderNeighborhood(node) {
  sourceDialogNeighborhoodEl.textContent = '';
  const svg = createSvgElement('svg', { viewBox: '0 0 620 260', role: 'img', 'aria-label': 'Nearby functions for ' + displayName(node) });
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

  const items = filteredRelationshipItems(relationshipItemsForNode(node));
  const incoming = items.filter((item) => item.direction === 'incoming' && item.functionId).slice(0, 5);
  const outgoingFunctions = items.filter((item) => item.direction === 'outgoing' && item.functionId).slice(0, 5);
  const outgoingExternal = items.filter((item) => item.kind === 'external').slice(0, Math.max(0, 5 - outgoingFunctions.length));
  const center = { x: 310, y: 126 };

  incoming.forEach((item, index) => {
    const caller = functionById.get(item.functionId);
    if (!caller) return;
    const y = distributedY(index, incoming.length, 260);
    miniEdge(svg, 128, y, center.x - 26, center.y, 'is-incoming');
    renderNeighborhoodNode(svg, {
      x: 108,
      y,
      node: caller,
      color: fileColorByPath.get(caller.modulePath) || '#64748b',
    });
  });

  [...outgoingFunctions, ...outgoingExternal].forEach((item, index, all) => {
    const y = distributedY(index, all.length, 260);
    miniEdge(svg, center.x + 26, center.y, 492, y, 'is-outgoing');
    if (item.functionId) {
      const target = functionById.get(item.functionId);
      if (!target) return;
      renderNeighborhoodNode(svg, {
        x: 512,
        y,
        node: target,
        color: fileColorByPath.get(target.modulePath) || '#64748b',
      });
    } else {
      renderExternalNeighborhoodNode(svg, { x: 512, y, item });
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
      x: 310,
      y: 218,
      'text-anchor': 'middle',
      fill: '#667085',
      'font-size': 13,
      'font-weight': 700,
    });
    message.textContent = 'No nearby functions were traced.';
    svg.appendChild(message);
  } else if (relationshipItemsForNode(node).length > items.length) {
    const message = createSvgElement('text', {
      x: 310,
      y: 236,
      'text-anchor': 'middle',
      fill: '#667085',
      'font-size': 12,
      'font-weight': 700,
    });
    message.textContent = 'Focused on ' + relationFilters.find((filter) => filter.id === activeRelationFilter)?.label + '.';
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
  renderRelationshipList(sourceDialogRelationshipsEl, node, { mode: 'dialog' });
  sourceDialogCodeEl.textContent = declaration.code || '// Source snippet was not saved for this function.';
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
    clearSelection();
    return { applied: true, message: 'highlight cleared' };
  }

  const functionId = functionIdForViewerCommand(command);
  if (!functionId) return { applied: false, message: 'target function is not visible in this viewer snapshot' };

  if (type === 'openFunction' || type === 'openSource') {
    scrollFunctionIntoView(functionId);
    showSourceDialogForFunctionId(functionId, networkNodeElement(functionId));
    return { applied: true, message: 'source opened' };
  }
  if (type === 'focusFunction' || type === 'highlightFunction') {
    selectFunction(functionId, { reason: 'focus-function', scroll: true });
    return { applied: true, message: 'function focused' };
  }
  if (type === 'scrollToFunction') {
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

function canUseViewerBridge() {
  return typeof window === 'object'
    && window.location
    && /^https?:$/.test(window.location.protocol)
    && typeof fetch === 'function';
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
  return Boolean(target?.closest?.('.network-node'));
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
  if (!outputPayload.mermaid) {
    moduleDiagramEl.textContent = 'No file import diagram was saved.';
    return;
  }
  const { svg } = await mermaid.render('ironglancer-file-diagram-' + Date.now(), outputPayload.mermaid);
  latestModuleSvg = svg;
  moduleDiagramEl.innerHTML = svg;
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

  rawRenderText();
  subtitleEl.textContent = (outputPayload.entry || 'unknown entry') + '  |  ' + (outputPayload.rootDir || 'unknown root');
  buildMetaEl.textContent = formatBuildMeta(outputPayload.meta);
  renderStats();
  renderSelectedFunctionPanel();
  layoutFunctionNetwork();
  renderFunctionNetwork();
  requestAnimationFrame(() => fitNetworkToViewport());
  await renderModuleDiagram();
  await initViewerBridge(outputPayload);
}

function rawRenderText() {
  jsxTreeEl.textContent = outputPayload?.jsxTreeText || 'No JSX files found.';
  treeEl.textContent = outputPayload?.treeText || '';
  mermaidEl.textContent = outputPayload?.mermaid || '';
}

bindNetworkInteraction();
bindControls();
main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.classList.add('error-text');
  buildMetaEl.textContent = '';
});
