import mermaid from './vendor/mermaid.esm.min.mjs';

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default', flowchart: { htmlLabels: false } });

const subtitleEl = document.getElementById('subtitle');
const buildMetaEl = document.getElementById('build-meta');
const jsxTreeEl = document.getElementById('jsx-tree');
const treeEl = document.getElementById('tree');
const mermaidEl = document.getElementById('mermaid');
const diagramEl = document.getElementById('diagram');
const viewportEl = document.getElementById('diagram-viewport');
const statsEl = document.getElementById('stats');
const selectedImportEl = document.getElementById('selected-import');
const downloadBtn = document.getElementById('download-svg-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fitBtn = document.getElementById('fit-btn');
const resetViewBtn = document.getElementById('reset-view-btn');
const zoomStatusEl = document.getElementById('zoom-status');
const copyJsxTreeBtn = document.getElementById('copy-jsx-tree-btn');
const copyMermaidSourceBtn = document.getElementById('copy-mermaid-source-btn');
const copyJsxTreeStatusEl = document.getElementById('copy-jsx-tree-status');
const copyMermaidSourceStatusEl = document.getElementById('copy-mermaid-source-status');
const sourceDialogEl = document.getElementById('source-dialog');
const sourceDialogTitleEl = document.getElementById('source-dialog-title');
const sourceDialogPathEl = document.getElementById('source-dialog-path');
const sourceDialogRelationshipsEl = document.getElementById('source-dialog-relationships');
const sourceDialogCodeEl = document.getElementById('source-dialog-code');
const sourceDialogPreviousBtn = document.getElementById('source-dialog-previous');
const sourceDialogNextBtn = document.getElementById('source-dialog-next');
const sourceDialogCloseBtn = document.getElementById('source-dialog-close');
let latestSvg = '';
let rawJsxTreeText = '';
let rawMermaidSourceText = '';
let activeSvg = null;
let baseWidth = 0;
let baseHeight = 0;
let zoom = 1;
let minZoom = 0.2;
let maxZoom = 4;
let dragState = null;
let pinchState = null;
const activePointers = new Map();
let sourceDeclarationLookup = emptySourceDeclarationLookup();
let sourceDialogState = { declaration: null, group: [], index: -1 };
let sourceDialogRestoreFocusEl = null;
const svgNamespace = 'http://www.w3.org/2000/svg';
const sourceMetricsSuffixPattern = /\s+\[lines:\s*\d+\s*\|\s*refs:\s*\d+\s*\|\s*importers:\s*\d+\]\s*$/i;
let sourceMemberTargetCounter = 0;
let sourceMemberTargets = new Map();
let highlightedSourceRecord = null;
let viewerBridge = emptyViewerBridge();

function emptySourceDeclarationLookup() {
  return { byName: new Map(), byFunctionId: new Map(), byFunctionStableId: new Map(), groups: new Map() };
}

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

function statCard(label, value) {
  const div = document.createElement('div');
  div.className = 'stat';
  const strong = document.createElement('b');
  strong.textContent = String(value);
  const span = document.createElement('span');
  span.className = 'muted';
  span.textContent = label;
  div.append(strong, span);
  return div;
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
    } catch (error) {
      // Fall back for browsers that expose Clipboard API but reject this call.
    }
  }

  copyTextWithTextarea(text);
}

async function copyRawText(text, label, statusEl) {
  try {
    await writeClipboardText(text);
    setCopyStatus(statusEl, 'Copied ' + label + '.', 'success');
  } catch (error) {
    setCopyStatus(statusEl, 'Could not copy ' + label + '.', 'error');
  }
}

function clampZoom(value) {
  return Math.min(maxZoom, Math.max(minZoom, value));
}

function updateZoomStatus() {
  zoomStatusEl.textContent = 'Zoom ' + Math.round(zoom * 100) + '%';
}

function centerViewport() {
  viewportEl.scrollLeft = Math.max(0, (viewportEl.scrollWidth - viewportEl.clientWidth) / 2);
  viewportEl.scrollTop = Math.max(0, (viewportEl.scrollHeight - viewportEl.clientHeight) / 2);
}

function setSvgSizeForZoom() {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  activeSvg.style.width = (baseWidth * zoom) + 'px';
  activeSvg.style.height = (baseHeight * zoom) + 'px';
  updateZoomStatus();
}

function applyZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  const clamped = clampZoom(nextZoom);
  if (clamped === zoom) return;

  const rect = viewportEl.getBoundingClientRect();
  const anchorX = anchorClientX == null ? rect.left + (viewportEl.clientWidth / 2) : anchorClientX;
  const anchorY = anchorClientY == null ? rect.top + (viewportEl.clientHeight / 2) : anchorClientY;
  const localX = anchorX - rect.left + viewportEl.scrollLeft;
  const localY = anchorY - rect.top + viewportEl.scrollTop;
  const currentZoom = Math.max(0.001, zoom);
  const ratioX = localX / currentZoom;
  const ratioY = localY / currentZoom;

  zoom = clamped;
  setSvgSizeForZoom();

  viewportEl.scrollLeft = Math.max(0, ratioX * zoom - (anchorX - rect.left));
  viewportEl.scrollTop = Math.max(0, ratioY * zoom - (anchorY - rect.top));
}

function fitToViewport() {
  if (!activeSvg || !baseWidth || !baseHeight) return;
  const availableWidth = Math.max(80, viewportEl.clientWidth - 32);
  const availableHeight = Math.max(80, viewportEl.clientHeight - 32);
  const fitZoom = Math.min(1, availableWidth / baseWidth, availableHeight / baseHeight);
  zoom = clampZoom(fitZoom);
  setSvgSizeForZoom();
  centerViewport();
}

function resetView() {
  zoom = 1;
  setSvgSizeForZoom();
  centerViewport();
}

function edgeTargetBasename(edge = {}) {
  const targetPath = typeof edge.targetPath === 'string' ? edge.targetPath : '';
  const target = targetPath || (typeof edge.target === 'string' ? edge.target : '');
  return target.split(/[\/]/).filter(Boolean).at(-1) || target;
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
  for (const binding of Array.isArray(edge.imports) ? edge.imports : []) {
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

function hasClass(element, className) {
  if (!element) return false;
  if (element.classList && typeof element.classList.contains === 'function') {
    return element.classList.contains(className);
  }
  return (' ' + (element.getAttribute('class') || '') + ' ').includes(' ' + className + ' ');
}

function sourceKey(moduleId, name) {
  return moduleId + '\u0000' + name;
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

function sourceNavigationGroup(declaration) {
  const moduleId = typeof declaration?.moduleId === 'string' ? declaration.moduleId : '';
  const sourceOrigin = typeof declaration?.sourceOrigin === 'string' ? declaration.sourceOrigin : '';
  return moduleId && sourceOrigin ? sourceKey(moduleId, sourceOrigin) : '';
}

function sourceDeclarationLookupFromPayload(sourcePayload = {}) {
  const byName = new Map();
  const byFunctionId = new Map();
  const byFunctionStableId = new Map();
  const groups = new Map();
  for (const declaration of Array.isArray(sourcePayload?.declarations) ? sourcePayload.declarations : []) {
    const moduleId = typeof declaration.moduleId === 'string' ? declaration.moduleId : '';
    const name = typeof declaration.name === 'string' ? declaration.name : '';
    if (moduleId && name && !byName.has(sourceKey(moduleId, name))) byName.set(sourceKey(moduleId, name), declaration);
    const functionId = typeof declaration.functionId === 'string' ? declaration.functionId : '';
    const functionStableId = typeof declaration.functionStableId === 'string' ? declaration.functionStableId : '';
    if (functionId && !byFunctionId.has(functionId)) byFunctionId.set(functionId, declaration);
    if (functionStableId && !byFunctionStableId.has(functionStableId)) {
      byFunctionStableId.set(functionStableId, declaration);
    }
    const group = sourceNavigationGroup(declaration);
    if (!group) continue;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(declaration);
  }
  return { byName, byFunctionId, byFunctionStableId, groups };
}

function sourcePayloadMatchesOutput(payload = {}, sourcePayload = {}) {
  const outputMeta = payload && typeof payload.meta === 'object' ? payload.meta : {};
  const sourceMeta = sourcePayload && typeof sourcePayload.meta === 'object' ? sourcePayload.meta : {};
  return ['buildId', 'sourceCodeHash'].every((key) => outputMeta[key] && outputMeta[key] === sourceMeta[key]);
}

async function loadSourceDeclarationMap(payload) {
  try {
    const sourceResponse = await fetch('./source-code.json');
    if (!sourceResponse.ok) return emptySourceDeclarationLookup();
    const sourcePayload = await sourceResponse.json();
    if (!sourcePayloadMatchesOutput(payload, sourcePayload)) {
      return emptySourceDeclarationLookup();
    }
    return sourceDeclarationLookupFromPayload(sourcePayload);
  } catch (error) {
    return emptySourceDeclarationLookup();
  }
}

function sourceMemberName(label) {
  let text = sourceLabelBase(label);
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
  const name = sourceMemberName(label.textContent);
  if (!name) return null;
  let current = label;
  let fallbackDeclaration = null;
  while (current && current !== activeSvg) {
    for (const moduleId of sourceModuleIdCandidatesFromElement(current)) {
      if (name && !fallbackDeclaration) {
        fallbackDeclaration = sourceDeclarationLookup.byName.get(sourceKey(moduleId, name)) || null;
      }
    }
    current = current.parentNode;
  }
  return fallbackDeclaration;
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
    || String(declaration?.name || '').trim();
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
  const baseText = sourceMemberBaseText(element.textContent, declaration);
  const metrics = [
    ['lines', 'Lines ' + sourceDeclarationLineCount(declaration)],
    ['refs', 'Refs ' + sourceMetricCount(declaration?.referenceCount)],
    ['importers', 'Files ' + sourceMetricCount(declaration?.importerFileCount)],
  ];
  const labelText = createInlineElement('source-member-label-text');
  labelText.textContent = baseText;
  const metricsGroup = createInlineElement('source-member-metrics');
  metricsGroup.setAttribute('aria-hidden', 'true');
  for (const [metric, text] of metrics) {
    const badge = createInlineElement('source-member-metric');
    badge.setAttribute('data-metric', metric);
    badge.textContent = text;
    metricsGroup.appendChild(badge);
  }

  element.textContent = '';
  element.append(labelText, metricsGroup);
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

function sourceMemberRecordForElement(element) {
  let current = element;
  while (current && current !== viewportEl) {
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
  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
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
  return clientX >= rect.left
    && clientX <= rect.right
    && clientY >= rect.top
    && clientY <= rect.bottom;
}

function sourceElementsFromPoint(clientX, clientY) {
  if (typeof document.elementsFromPoint !== 'function') return [];
  try {
    return Array.from(document.elementsFromPoint(clientX, clientY) || []);
  } catch (error) {
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
  const centerY = rect.top + (rect.height / 2);
  const vertical = Math.abs(clientY - centerY);
  const horizontal = clientX < rect.left
    ? rect.left - clientX
    : (clientX > rect.right ? clientX - rect.right : 0);
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

function sourceHitTargetReference(element) {
  let current = element;
  while (current && current !== activeSvg) {
    if (typeof current.getBBox === 'function') {
      try {
        const box = current.getBBox();
        if (validSourceHitBox(box)) return { element: current, box };
      } catch (error) {
        // Some rendered SVG/HTML hybrids expose getBBox but throw until layout settles.
      }
    }

    const attributeBox = sourceHitBoxFromAttributes(current);
    if (attributeBox) return { element: current, box: attributeBox };
    current = current.parentNode;
  }
  return null;
}

function addSourceHitTarget(record, activate) {
  const element = record.element;
  const reference = sourceHitTargetReference(element);
  const parent = reference?.element?.parentNode;
  if (!parent) return;

  const { x, y, width, height } = reference.box;
  const hitTarget = document.createElementNS(svgNamespace, 'path');
  hitTarget.classList.add('source-member-hit-target');
  hitTarget.setAttribute('data-source-member-target-id', record.id);
  hitTarget.setAttribute('d', 'M' + svgNumber(x) + ' ' + svgNumber(y + (height / 2)) + 'H' + svgNumber(x + width));
  hitTarget.setAttribute('aria-hidden', 'true');
  hitTarget.setAttribute('focusable', 'false');
  hitTarget.setAttribute('vector-effect', 'non-scaling-stroke');
  hitTarget.addEventListener('click', activate);
  record.hitTarget = hitTarget;
  parent.appendChild(hitTarget);
}

function sourceDialogNavigationForDeclaration(declaration) {
  const group = sourceDeclarationLookup.groups.get(sourceNavigationGroup(declaration)) || [];
  const index = group.indexOf(declaration);
  return { group, index };
}

function canNavigateSourceDialog(direction) {
  const nextIndex = sourceDialogState.index + direction;
  return sourceDialogState.group.length > 1
    && nextIndex >= 0
    && nextIndex < sourceDialogState.group.length;
}

function updateSourceDialogNavigationControls() {
  if (sourceDialogPreviousBtn) sourceDialogPreviousBtn.disabled = !canNavigateSourceDialog(-1);
  if (sourceDialogNextBtn) sourceDialogNextBtn.disabled = !canNavigateSourceDialog(1);
}

function callableLabel(value) {
  const name = String(value || '').trim();
  return name ? name + '()' : 'anonymous()';
}

function sourceRelationshipLocation(relationship = {}) {
  const modulePath = String(relationship.modulePath || 'unknown source').trim() || 'unknown source';
  const line = relationship.startLine || '?';
  return modulePath + ':' + line;
}

function sourceUseRelationshipText(relationship = {}) {
  const localName = String(relationship.localName || relationship.name || relationship.declarationName || '').trim();
  const declarationName = String(relationship.declarationName || '').trim();
  const importedName = String(relationship.importedName || '').trim();
  const parts = [callableLabel(localName || declarationName)];
  if (
    declarationName
    && declarationName !== localName
    && importedName
    && importedName !== 'default'
  ) {
    parts.push('imports ' + callableLabel(declarationName));
  }
  parts.push('from ' + sourceRelationshipLocation(relationship));
  return parts.join(' ');
}

function sourceImportedByRelationshipText(relationship = {}, selectedDeclaration = {}) {
  const callerName = String(relationship.name || relationship.declarationName || '').trim();
  const localName = String(relationship.localName || '').trim();
  const selectedName = String(selectedDeclaration.declarationName || selectedDeclaration.name || '').trim();
  const parts = [callableLabel(callerName), 'in ' + sourceRelationshipLocation(relationship)];
  if (localName && localName !== selectedName) parts.push('as ' + callableLabel(localName));
  return parts.join(' ');
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== '') element.textContent = text;
  return element;
}

function placementToken(value, fallback = 'unknown') {
  return (String(value || '').trim() || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback;
}

function titleCaseToken(value, fallback = 'Unknown') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function compactCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

function placementFunctionText(ref = {}) {
  const name = String(ref.name || '').trim();
  const modulePath = String(ref.modulePath || '').trim();
  const line = ref.startLine || '?';
  return callableLabel(name) + (modulePath ? ' in ' + modulePath + ':' + line : '');
}

function placementFunctionLocation(ref = {}) {
  const modulePath = String(ref.modulePath || '').trim();
  if (!modulePath) return '';
  return modulePath + ':' + (ref.startLine || '?');
}

function placementUsageLineText(lines) {
  const usageLines = (Array.isArray(lines) ? lines : [])
    .map((line) => Number(line))
    .filter((line) => Number.isInteger(line) && line > 0);
  if (usageLines.length === 0) return '';
  return 'L' + usageLines.slice(0, 3).join(', ');
}

function placementSyntaxLabels(syntaxKinds) {
  const kinds = Array.isArray(syntaxKinds) ? syntaxKinds : [];
  return kinds
    .map((kind) => String(kind || '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function placementEdgeText(edge = {}, direction = 'callee') {
  const ref = direction === 'caller' ? edge.source : edge.target;
  const syntax = Array.isArray(edge.syntaxKinds) && edge.syntaxKinds.length > 0
    ? edge.syntaxKinds.join(', ')
    : 'static reference';
  return placementFunctionText(ref) + ' at line ' + (Array.isArray(edge.usageLines) ? edge.usageLines.join(', ') : '?')
    + ' [' + syntax + ']';
}

function placementExternalText(item = {}) {
  const localName = String(item.localName || item.importedName || item.specifier || '').trim();
  const specifier = String(item.specifier || '').trim();
  const syntax = Array.isArray(item.syntaxKinds) && item.syntaxKinds.length > 0
    ? item.syntaxKinds.join(', ')
    : 'static reference';
  const reason = item.category === 'unresolved' && item.unresolvedReason ? ' (' + item.unresolvedReason + ')' : '';
  return callableLabel(localName) + ' from ' + (specifier || item.category || 'external')
    + reason
    + ' at line '
    + (Array.isArray(item.usageLines) ? item.usageLines.join(', ') : '?')
    + ' [' + syntax + ']';
}

function sourceDeclarationForPlacementRef(ref = {}) {
  const stableId = String(ref.stableId || '').trim();
  const id = String(ref.id || '').trim();
  if (stableId) {
    const declaration = sourceDeclarationLookup.byFunctionStableId.get(stableId);
    if (declaration) return declaration;
  }
  if (id) {
    const declaration = sourceDeclarationLookup.byFunctionId.get(id);
    if (declaration) return declaration;
  }
  const modulePath = String(ref.modulePath || '').trim();
  const name = String(ref.name || '').trim();
  const line = Number(ref.startLine || 0);
  if (!modulePath || !name) return null;
  return Array.from(sourceDeclarationLookup.byFunctionId.values())
    .find((declaration) => (
      declaration.modulePath === modulePath
      && (declaration.name === name || declaration.declarationName === name)
      && (!line || declaration.startLine === line)
    )) || null;
}

function placementSignalMetrics(declaration = {}) {
  const evidence = declaration.placement?.evidence || {};
  const externalCount = compactCount(evidence.packageCalleeCount) + compactCount(evidence.platformCalleeCount);
  return [
    {
      id: 'same-file-caller',
      label: 'Same-file callers',
      shortLabel: 'Callers',
      scope: 'same file',
      count: compactCount(evidence.sameFileCallerCount),
      tone: 'same-file',
    },
    {
      id: 'project-local-caller',
      label: 'Cross-file callers',
      shortLabel: 'Callers',
      scope: 'cross file',
      count: compactCount(evidence.projectLocalCallerCount),
      tone: 'project-local',
    },
    {
      id: 'same-file-callee',
      label: 'Same-file callees',
      shortLabel: 'Callees',
      scope: 'same file',
      count: compactCount(evidence.sameFileCalleeCount),
      tone: 'same-file',
    },
    {
      id: 'project-local-callee',
      label: 'Cross-file callees',
      shortLabel: 'Callees',
      scope: 'cross file',
      count: compactCount(evidence.projectLocalCalleeCount),
      tone: 'project-local',
    },
    {
      id: 'external-callee',
      label: 'Package/platform calls',
      shortLabel: 'External',
      scope: 'package/platform',
      count: externalCount,
      tone: 'external',
    },
    {
      id: 'internal-helper',
      label: 'Helper cluster',
      shortLabel: 'Helpers',
      scope: compactCount(evidence.transitiveInternalHelperLineCount) + ' lines',
      count: compactCount(evidence.transitiveInternalHelperCount || evidence.internalHelperCount),
      tone: 'helper',
    },
    {
      id: 'unresolved-callee',
      label: 'Unresolved calls',
      shortLabel: 'Unknown',
      scope: 'needs check',
      count: compactCount(evidence.unresolvedCalleeCount),
      tone: 'unresolved',
    },
  ];
}

function renderPlacementSignalStrip(declaration = {}) {
  const metrics = placementSignalMetrics(declaration);
  const maxCount = Math.max(1, ...metrics.map((metric) => metric.count));
  const strip = createElement('div', 'placement-signal-strip');
  for (const metric of metrics) {
    const signal = createElement('div', 'placement-signal is-' + metric.tone);
    signal.setAttribute('data-signal', metric.id);
    signal.setAttribute('aria-label', metric.label + ': ' + metric.count);

    const top = createElement('div', 'placement-signal-top');
    const count = createElement('strong', '', String(metric.count));
    const label = createElement('span', '', metric.shortLabel);
    top.append(count, label);

    const scope = createElement('span', 'placement-signal-scope', metric.scope);
    const meter = createElement('div', 'placement-signal-meter');
    const fill = createElement('span');
    fill.style.width = Math.round((metric.count / maxCount) * 100) + '%';
    meter.appendChild(fill);

    signal.append(top, scope, meter);
    strip.appendChild(signal);
  }
  return strip;
}

function placementEdgeTile(edge = {}, direction = 'callee', tone = 'same-file') {
  const ref = direction === 'caller' ? edge.source : edge.target;
  const location = placementFunctionLocation(ref);
  const usage = placementUsageLineText(edge.usageLines);
  const referenceCount = compactCount(edge.referenceCount);
  const chips = [
    tone === 'project-local' ? 'cross file' : 'same file',
    referenceCount > 0 ? referenceCount + ' refs' : '',
    usage,
    ...placementSyntaxLabels(edge.syntaxKinds),
  ].filter(Boolean);
  return {
    kind: 'function',
    tone,
    title: callableLabel(ref?.name || ''),
    meta: location || 'local function',
    detail: placementEdgeText(edge, direction),
    chips,
    ref,
  };
}

function placementExternalTile(item = {}, tone = 'external') {
  const localName = String(item.localName || item.importedName || item.specifier || '').trim();
  const specifier = String(item.specifier || '').trim();
  const usage = placementUsageLineText(item.usageLines);
  const chips = [
    tone === 'unresolved' ? 'unresolved' : titleCaseToken(item.category, 'external').toLowerCase(),
    usage,
    ...placementSyntaxLabels(item.syntaxKinds),
  ].filter(Boolean);
  return {
    kind: 'external',
    tone,
    title: callableLabel(localName || specifier || item.category),
    meta: specifier || String(item.unresolvedReason || '').trim() || 'external binding',
    detail: placementExternalText(item),
    chips,
    ref: null,
  };
}

function placementHelperTile(item = {}) {
  const ref = item.function || item;
  const location = placementFunctionLocation(ref);
  const depth = compactCount(item.depth);
  return {
    kind: 'function',
    tone: 'helper',
    title: callableLabel(ref?.name || ''),
    meta: location || 'same-file helper',
    detail: 'depth ' + depth + ': ' + placementFunctionText(ref),
    chips: ['depth ' + depth, compactCount(ref?.lineCount) + ' lines'].filter(Boolean),
    ref,
  };
}

function placementRelationshipGroups(declaration = {}) {
  const groups = declaration.placement?.groups || {};
  const callers = groups.callers || {};
  const callees = groups.callees || {};
  return {
    callers: [
      ...(Array.isArray(callers.sameFile) ? callers.sameFile : []).map((edge) => placementEdgeTile(edge, 'caller', 'same-file')),
      ...(Array.isArray(callers.projectLocal) ? callers.projectLocal : []).map((edge) => placementEdgeTile(edge, 'caller', 'project-local')),
    ],
    calls: [
      ...(Array.isArray(callees.sameFile) ? callees.sameFile : []).map((edge) => placementEdgeTile(edge, 'callee', 'same-file')),
      ...(Array.isArray(callees.projectLocal) ? callees.projectLocal : []).map((edge) => placementEdgeTile(edge, 'callee', 'project-local')),
    ],
    helpers: (Array.isArray(groups.transitiveInternalHelpers) ? groups.transitiveInternalHelpers : [])
      .map(placementHelperTile),
    external: [
      ...(Array.isArray(callees.package) ? callees.package : []).map((item) => placementExternalTile(item, 'external')),
      ...(Array.isArray(callees.platform) ? callees.platform : []).map((item) => placementExternalTile(item, 'platform')),
      ...(Array.isArray(callees.unresolved) ? callees.unresolved : []).map((item) => placementExternalTile(item, 'unresolved')),
    ],
  };
}

function renderPlacementChip(text, tone = '') {
  return createElement('span', 'placement-chip' + (tone ? ' is-' + tone : ''), text);
}

function renderPlacementTile(item = {}) {
  const declaration = item.ref ? sourceDeclarationForPlacementRef(item.ref) : null;
  const tile = createElement(declaration ? 'button' : 'div', 'placement-relationship-tile is-' + placementToken(item.tone));
  tile.setAttribute('data-kind', item.kind || 'relationship');
  if (item.detail) tile.setAttribute('title', item.detail);
  if (declaration) {
    tile.type = 'button';
    tile.setAttribute('aria-label', 'Open source for ' + (item.title || declaration.name));
    tile.addEventListener('click', () => showSourceDialog(declaration, sourceDialogRestoreFocusEl || tile));
  }

  const title = createElement('div', 'placement-relationship-title', item.title || 'Unknown');
  const meta = createElement('div', 'placement-relationship-meta', item.meta || '');
  const chips = createElement('div', 'placement-chip-row');
  for (const chipText of Array.isArray(item.chips) ? item.chips : []) {
    chips.appendChild(renderPlacementChip(chipText, item.tone));
  }
  tile.append(title, meta, chips);
  return tile;
}

function renderPlacementLane({ id, title, items, emptyLabel }) {
  const section = createElement('section', 'placement-lane');
  section.setAttribute('data-lane', id);
  section.setAttribute('data-count', String(items.length));

  const header = createElement('div', 'placement-lane-header');
  header.append(
    createElement('h3', '', title),
    createElement('span', 'placement-lane-count', String(items.length)),
  );
  section.appendChild(header);

  if (items.length === 0) {
    section.appendChild(createElement('p', 'placement-empty', emptyLabel));
    return section;
  }

  const visibleItems = items.slice(0, 4);
  const hiddenItems = items.slice(4);
  const grid = createElement('div', 'placement-relationship-grid');
  for (const item of visibleItems) grid.appendChild(renderPlacementTile(item));
  section.appendChild(grid);

  if (hiddenItems.length > 0) {
    const more = createElement('details', 'placement-more');
    const summary = createElement('summary', '', '+' + hiddenItems.length + ' more');
    const moreGrid = createElement('div', 'placement-relationship-grid');
    for (const item of hiddenItems) moreGrid.appendChild(renderPlacementTile(item));
    more.append(summary, moreGrid);
    section.appendChild(more);
  }

  return section;
}

function renderPlacementTracePill(text) {
  const pill = createElement('span', 'placement-trace-pill');
  pill.textContent = text;
  pill.setAttribute('title', text);
  return pill;
}

function renderPlacementTraceSection(declaration = {}) {
  const used = (Array.isArray(declaration.importedFunctionUses) ? declaration.importedFunctionUses : [])
    .map(sourceUseRelationshipText);
  const importedBy = (Array.isArray(declaration.importedBy) ? declaration.importedBy : [])
    .map((relationship) => sourceImportedByRelationshipText(relationship, declaration));
  if (used.length === 0 && importedBy.length === 0) return null;

  const section = createElement('section', 'placement-trace');
  const header = createElement('div', 'placement-trace-header');
  header.append(
    createElement('h3', '', 'Import Trace'),
    createElement('span', 'placement-lane-count', String(used.length + importedBy.length)),
  );
  const body = createElement('div', 'placement-trace-body');
  for (const item of [...used, ...importedBy].slice(0, 8)) {
    body.appendChild(renderPlacementTracePill(item));
  }
  if (used.length + importedBy.length > 8) {
    body.appendChild(renderPlacementTracePill('+' + ((used.length + importedBy.length) - 8) + ' more'));
  }
  section.append(header, body);
  return section;
}

function renderPlacementOverview(declaration = {}) {
  const placement = declaration.placement || {};
  const assessment = placement.assessment || {};
  const assessmentToken = placementToken(assessment.assessment, 'unreviewed');
  const confidenceToken = placementToken(assessment.confidence, 'low');
  const overview = createElement('section', 'placement-overview');

  const topline = createElement('div', 'placement-topline');
  const summaryGroup = createElement('div', 'placement-summary-group');
  const badge = createElement(
    'div',
    'placement-assessment-badge is-' + assessmentToken + ' is-confidence-' + confidenceToken,
  );
  badge.setAttribute('data-assessment', assessment.assessment || '');
  badge.setAttribute('data-confidence', assessment.confidence || 'low');
  badge.append(
    createElement('span', 'placement-assessment-label', titleCaseToken(assessment.assessment, 'Unreviewed')),
    createElement('span', 'placement-assessment-confidence', titleCaseToken(assessment.confidence, 'Low') + ' confidence'),
  );
  summaryGroup.appendChild(badge);
  if (assessment.summary) summaryGroup.appendChild(createElement('p', 'placement-summary', assessment.summary));

  const rationale = createElement('div', 'placement-rationale-strip');
  for (const item of (Array.isArray(assessment.rationale) ? assessment.rationale : []).slice(0, 4)) {
    rationale.appendChild(renderPlacementChip(item));
  }
  if (rationale.children.length === 0) rationale.appendChild(renderPlacementChip('no saved rationale'));

  topline.append(summaryGroup, rationale);
  overview.append(topline, renderPlacementSignalStrip(declaration));
  return overview;
}

function renderSourceDialogRelationships(declaration) {
  if (!sourceDialogRelationshipsEl) return;
  sourceDialogRelationshipsEl.textContent = '';

  const relationshipGroups = placementRelationshipGroups(declaration);
  const surface = createElement('div', 'placement-surface');
  const lanes = createElement('div', 'placement-lane-grid');
  lanes.append(
    renderPlacementLane({
      id: 'callers',
      title: 'Callers',
      items: relationshipGroups.callers,
      emptyLabel: 'No direct static callers saved.',
    }),
    renderPlacementLane({
      id: 'calls',
      title: 'Callees',
      items: relationshipGroups.calls,
      emptyLabel: 'No direct local callees saved.',
    }),
    renderPlacementLane({
      id: 'helpers',
      title: 'Helper Cluster',
      items: relationshipGroups.helpers,
      emptyLabel: 'No same-file helper chain found.',
    }),
    renderPlacementLane({
      id: 'external',
      title: 'Adapters',
      items: relationshipGroups.external,
      emptyLabel: 'No package, platform, or unresolved calls saved.',
    }),
  );

  const traceSection = renderPlacementTraceSection(declaration);
  surface.append(renderPlacementOverview(declaration), lanes);
  if (traceSection) surface.appendChild(traceSection);
  sourceDialogRelationshipsEl.appendChild(surface);
}

function renderSourceDialogDeclaration(declaration) {
  if (!sourceDialogEl || !declaration) return;
  sourceDialogTitleEl.textContent = declaration.name || declaration.declarationName || 'Source';
  sourceDialogPathEl.textContent = (declaration.modulePath || 'unknown source')
    + ':'
    + (declaration.startLine || '?')
    + '-'
    + (declaration.endLine || '?');
  renderSourceDialogRelationships(declaration);
  sourceDialogCodeEl.textContent = typeof declaration.code === 'string' ? declaration.code : '';
  updateSourceDialogNavigationControls();
}

function showSourceDialog(declaration, restoreFocusEl) {
  if (!sourceDialogEl || !declaration) return;
  sourceDialogState = {
    declaration,
    ...sourceDialogNavigationForDeclaration(declaration),
  };
  sourceDialogRestoreFocusEl = restoreFocusEl || null;
  renderSourceDialogDeclaration(declaration);

  if (typeof sourceDialogEl.showModal === 'function') {
    if (!sourceDialogEl.open) sourceDialogEl.showModal();
  } else {
    sourceDialogEl.setAttribute('open', '');
  }
  if (sourceDialogCloseBtn && typeof sourceDialogCloseBtn.focus === 'function') sourceDialogCloseBtn.focus();
  sendViewerBridgeState('open-source');
}

function navigateSourceDialog(direction) {
  if (!canNavigateSourceDialog(direction)) return;
  const nextIndex = sourceDialogState.index + direction;
  const declaration = sourceDialogState.group[nextIndex];
  sourceDialogState = {
    declaration,
    group: sourceDialogState.group,
    index: nextIndex,
  };
  renderSourceDialogDeclaration(declaration);
  sendViewerBridgeState('navigate-source');
}

function closeSourceDialog() {
  if (!sourceDialogEl) return;
  const restoreFocusEl = sourceDialogRestoreFocusEl;
  sourceDialogRestoreFocusEl = null;
  sourceDialogState = { declaration: null, group: [], index: -1 };
  updateSourceDialogNavigationControls();
  if (sourceDialogEl.open && typeof sourceDialogEl.close === 'function') {
    sourceDialogEl.close();
  } else {
    sourceDialogEl.removeAttribute('open');
  }
  if (restoreFocusEl && typeof restoreFocusEl.focus === 'function') restoreFocusEl.focus();
  sendViewerBridgeState('close-source');
}

function addKeyboardActivation(element, callback) {
  element.addEventListener('click', callback);
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    callback(event);
  });
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
  element.setAttribute('aria-label', 'Show source for ' + declaration.name + ' in ' + declaration.modulePath);
  appendSourceMemberMetrics(element, declaration);

  const activate = (event) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const activationRecord = sourceActivationRecordForEvent(event, record) || record;
    showSourceDialog(activationRecord.declaration, activationRecord.element || element);
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

function declarationSnapshot(declaration) {
  if (!declaration) return null;
  return {
    functionId: declaration.functionId || null,
    functionStableId: declaration.functionStableId || null,
    modulePath: declaration.modulePath || null,
    name: declaration.name || declaration.declarationName || null,
    startLine: declaration.startLine || null,
    endLine: declaration.endLine || null,
  };
}

function currentViewerState(reason) {
  return {
    clientId: viewerBridge.clientId,
    revision: ++viewerBridge.stateRevision,
    reason,
    snapshot: viewerBridge.snapshot,
    openSource: declarationSnapshot(sourceDialogState.declaration),
    highlighted: declarationSnapshot(highlightedSourceRecord?.declaration),
    viewport: {
      zoom,
      scrollLeft: viewportEl.scrollLeft,
      scrollTop: viewportEl.scrollTop,
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

function declarationForViewerCommand(command = {}) {
  const targetStableId = String(command.targetStableId || command.functionStableId || '').trim();
  const targetId = String(command.targetId || command.functionId || '').trim();
  if (targetStableId) {
    const declaration = sourceDeclarationLookup.byFunctionStableId.get(targetStableId);
    if (declaration) return declaration;
  }
  if (targetId) {
    const declaration = sourceDeclarationLookup.byFunctionId.get(targetId);
    if (declaration) return declaration;
  }
  const modulePath = String(command.modulePath || '').trim();
  const name = String(command.name || command.functionName || '').trim();
  const line = Number(command.startLine || command.line || 0);
  if (!modulePath || !name) return null;
  return Array.from(sourceDeclarationLookup.byFunctionId.values())
    .find((declaration) => (
      declaration.modulePath === modulePath
      && (declaration.name === name || declaration.declarationName === name)
      && (!line || declaration.startLine === line)
    )) || null;
}

function applyViewerBridgeCommand(command = {}) {
  const type = String(command.type || command.command || '').trim();
  if (type === 'clearHighlight') {
    clearSourceHighlight();
    sendViewerBridgeState('clear-highlight');
    return { applied: true, message: 'highlight cleared' };
  }

  const declaration = declarationForViewerCommand(command);
  const record = sourceRecordForDeclaration(declaration);
  if (!declaration || !record) return { applied: false, message: 'target function is not visible in this viewer snapshot' };

  if (type === 'openFunction' || type === 'openSource') {
    highlightSourceRecord(record);
    scrollSourceRecordIntoView(record);
    showSourceDialog(declaration, record.element);
    return { applied: true, message: 'source opened' };
  }
  if (type === 'focusFunction') {
    highlightSourceRecord(record);
    scrollSourceRecordIntoView(record);
    sendViewerBridgeState('focus-function');
    return { applied: true, message: 'function focused' };
  }
  if (type === 'highlightFunction') {
    highlightSourceRecord(record);
    sendViewerBridgeState('highlight-function');
    return { applied: true, message: 'function highlighted' };
  }
  if (type === 'scrollToFunction') {
    scrollSourceRecordIntoView(record);
    sendViewerBridgeState('scroll-function');
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
      const records = Array.isArray(payload?.data?.commands) ? payload.data.commands : [];
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

function wireSourceMembers() {
  if (
    !activeSvg
    || typeof activeSvg.querySelectorAll !== 'function'
    || sourceDeclarationLookup.byName.size === 0
  ) return;
  sourceMemberTargetCounter = 0;
  sourceMemberTargets = new Map();
  const labels = [
    ...Array.from(activeSvg.querySelectorAll('text')),
    ...Array.from(activeSvg.querySelectorAll('p')),
  ];
  for (const label of labels) {
    const declaration = sourceDeclarationForLabel(label);
    if (!declaration) continue;
    addSourceActivation(label, declaration);
  }
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
  const message = document.createElement('p');
  message.className = 'muted';
  message.textContent = 'No edge selected.';
  selectedImportEl.appendChild(message);
}

function appendSelectedImportRow(parent, label, value) {
  const row = document.createElement('div');
  row.className = 'selected-import-row';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  const valueEl = document.createElement('code');
  valueEl.textContent = value || 'none';
  row.append(labelEl, valueEl);
  parent.appendChild(row);
}

function renderSelectedImport(edge, labels) {
  selectedImportEl.textContent = '';
  const title = document.createElement('h3');
  title.textContent = (edge.source || 'unknown') + ' -> ' + (edge.target || 'unknown');
  const rows = document.createElement('div');
  rows.className = 'selected-import-rows';
  appendSelectedImportRow(rows, 'Source', edge.sourcePath || edge.source);
  appendSelectedImportRow(rows, 'Target', edge.targetPath || edge.target);
  appendSelectedImportRow(rows, 'Load', Array.isArray(edge.loadKinds) ? edge.loadKinds.join(', ') : 'unknown');
  const listTitle = document.createElement('h4');
  listTitle.textContent = 'Direct Imports';
  const list = document.createElement('ul');
  list.className = 'selected-import-list';
  for (const label of labels) {
    const item = document.createElement('li');
    item.textContent = label;
    list.appendChild(item);
  }
  selectedImportEl.append(title, rows, listTitle, list);
}

let expandedEdge = null;

function collapseExpandedEdge() {
  if (!expandedEdge) return;
  const { customLabel, label, originalContent, originalDisplay, path } = expandedEdge;
  if (customLabel && typeof customLabel.remove === 'function') customLabel.remove();
  if (originalContent) originalContent.style.display = originalDisplay;
  if (label) label.classList.remove('is-expanded');
  if (path) path.classList.remove('is-selected');
  expandedEdge = null;
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
  const customLabel = document.createElementNS(svgNamespace, 'g');
  const rect = document.createElementNS(svgNamespace, 'rect');
  const text = document.createElementNS(svgNamespace, 'text');

  customLabel.setAttribute('class', 'edge-import-label');
  rect.setAttribute('x', String(-width / 2));
  rect.setAttribute('y', String(-height / 2));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '7');
  text.setAttribute('x', '0');
  text.setAttribute('y', String((-height / 2) + 18));
  text.setAttribute('text-anchor', 'middle');
  lines.forEach((line, index) => {
    const tspan = document.createElementNS(svgNamespace, 'tspan');
    tspan.setAttribute('x', '0');
    if (index > 0) tspan.setAttribute('dy', '20');
    tspan.textContent = line;
    text.appendChild(tspan);
  });
  customLabel.append(rect, text);
  const originalDisplay = originalContent.style.display;
  originalContent.style.display = 'none';
  labelGroup.appendChild(customLabel);
  label.classList.add('is-expanded');
  path.classList.add('is-selected');
  expandedEdge = { customLabel, label, originalContent, originalDisplay, path };
  renderSelectedImport(edge, lines);
}

function addEdgeActivation(element, callback) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  addKeyboardActivation(element, callback);
}

function isEdgePointerTarget(target) {
  let element = target;
  while (element && element !== viewportEl) {
    const tagName = typeof element.tagName === 'string' ? element.tagName.toLowerCase() : '';
    if (hasClass(element, 'edge-hit-target') || hasClass(element, 'edgeLabel')) return true;
    if (tagName === 'path' && (hasClass(element, 'relation') || element.getAttribute('data-edge') === 'true')) {
      return true;
    }
    element = element.parentNode;
  }
  return false;
}

function isSourcePointerTarget(target) {
  let element = target;
  while (element && element !== viewportEl) {
    if (hasClass(element, 'source-member-trigger') || hasClass(element, 'source-member-hit-target')) return true;
    element = element.parentNode;
  }
  return false;
}

function wireImportEdges(importEdges) {
  if (!activeSvg || typeof activeSvg.querySelectorAll !== 'function') return;
  const paths = Array.from(activeSvg.querySelectorAll('path[data-id]'))
    .filter((path) => hasClass(path, 'relation') || path.getAttribute('data-edge') === 'true');
  const labels = Array.from(activeSvg.querySelectorAll('g.edgeLabel'));
  const claimedPaths = new Set();

  for (const edge of Array.isArray(importEdges) ? importEdges : []) {
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
    pinchState = null;
    return;
  }
  const [pointerA, pointerB] = Array.from(activePointers.values());
  pinchState = {
    startZoom: zoom,
    startDistance: distanceBetween(pointerA, pointerB),
    midpoint: midpointBetween(pointerA, pointerB),
  };
}

function bindInteraction() {
  viewportEl.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0025);
    applyZoom(zoom * factor, event.clientX, event.clientY);
  }, { passive: false });

  viewportEl.addEventListener('pointerdown', (event) => {
    if (isEdgePointerTarget(event.target) || isSourcePointerTarget(event.target)) return;

    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (activePointers.size === 1) {
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: viewportEl.scrollLeft,
        startScrollTop: viewportEl.scrollTop,
      };
      viewportEl.classList.add('is-dragging');
      viewportEl.setPointerCapture(event.pointerId);
    } else {
      dragState = null;
      viewportEl.classList.remove('is-dragging');
      startPinchIfNeeded();
    }
  });

  viewportEl.addEventListener('pointermove', (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pinchState && activePointers.size === 2) {
      const [pointerA, pointerB] = Array.from(activePointers.values());
      const currentDistance = distanceBetween(pointerA, pointerB);
      const midpoint = midpointBetween(pointerA, pointerB);
      if (pinchState.startDistance > 0) {
        applyZoom((currentDistance / pinchState.startDistance) * pinchState.startZoom, midpoint.clientX, midpoint.clientY);
      }
      return;
    }

    if (!dragState || dragState.pointerId !== event.pointerId) return;
    viewportEl.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
    viewportEl.scrollTop = dragState.startScrollTop - (event.clientY - dragState.startY);
  });

  function clearPointer(event) {
    activePointers.delete(event.pointerId);
    if (dragState && dragState.pointerId === event.pointerId) {
      dragState = null;
      viewportEl.classList.remove('is-dragging');
    }
    if (activePointers.size < 2) pinchState = null;
    if (activePointers.size === 1) {
      const [remainingId, remainingPointer] = Array.from(activePointers.entries())[0];
      dragState = {
        pointerId: remainingId,
        startX: remainingPointer.clientX,
        startY: remainingPointer.clientY,
        startScrollLeft: viewportEl.scrollLeft,
        startScrollTop: viewportEl.scrollTop,
      };
      viewportEl.classList.add('is-dragging');
    }
  }

  viewportEl.addEventListener('pointerup', clearPointer);
  viewportEl.addEventListener('pointercancel', clearPointer);
  viewportEl.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && dragState && dragState.pointerId === event.pointerId && event.buttons === 0) {
      clearPointer(event);
    }
  });

  zoomInBtn.addEventListener('click', () => applyZoom(zoom * 1.2));
  zoomOutBtn.addEventListener('click', () => applyZoom(zoom / 1.2));
  fitBtn.addEventListener('click', fitToViewport);
  resetViewBtn.addEventListener('click', resetView);
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

function prepareSvgForInteraction(svgMarkup, importEdges) {
  latestSvg = svgMarkup;
  diagramEl.innerHTML = svgMarkup;
  activeSvg = diagramEl.querySelector('svg');
  if (!activeSvg) return;

  const viewBox = activeSvg.viewBox && activeSvg.viewBox.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    baseWidth = viewBox.width;
    baseHeight = viewBox.height;
  } else {
    baseWidth = activeSvg.getBoundingClientRect().width || Number.parseFloat(activeSvg.getAttribute('width')) || 1200;
    baseHeight = activeSvg.getBoundingClientRect().height || Number.parseFloat(activeSvg.getAttribute('height')) || 800;
  }

  activeSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  activeSvg.style.maxWidth = 'none';
  activeSvg.style.width = baseWidth + 'px';
  activeSvg.style.height = baseHeight + 'px';
  zoom = 1;
  updateZoomStatus();
  wireImportEdges(importEdges);
  wireSourceMembers();
  requestAnimationFrame(() => fitToViewport());
}

function formatBuildMeta(metadata = {}) {
  const version = metadata.version || 'unknown';
  const generatedAtRaw = metadata.generatedAt || '';
  const generatedAt = generatedAtRaw ? new Date(generatedAtRaw) : null;
  const generatedLabel = generatedAt && !Number.isNaN(generatedAt.valueOf())
    ? generatedAt.toLocaleString()
    : (generatedAtRaw || 'unknown time');
  return 'Built ' + generatedLabel + '  •  v' + version;
}

async function main() {
  renderEmptySelectedImport();
  const response = await fetch('./output.json');
  if (!response.ok) throw new Error('Failed to load output.json');
  const payload = await response.json();
  sourceDeclarationLookup = await loadSourceDeclarationMap(payload);
  rawJsxTreeText = typeof payload.jsxTreeText === 'string' ? payload.jsxTreeText : '';
  rawMermaidSourceText = typeof payload.mermaid === 'string' ? payload.mermaid : '';
  subtitleEl.textContent = payload.entry + '  •  ' + payload.rootDir;
  buildMetaEl.textContent = formatBuildMeta(payload.meta);
  jsxTreeEl.textContent = rawJsxTreeText || 'No JSX files found.';
  treeEl.textContent = payload.treeText;
  mermaidEl.textContent = rawMermaidSourceText;
  copyJsxTreeBtn.disabled = false;
  copyMermaidSourceBtn.disabled = false;
  statsEl.append(
    statCard('modules', payload.summary.moduleCount),
    statCard('jsx files', payload.summary.jsxFileCount ?? payload.summary.jsxClassCount),
    statCard('scripts', payload.summary.jsScriptCount),
    statCard('externals', payload.summary.externalCount),
  );
  const { svg } = await mermaid.render('ironglancer-diagram-' + Date.now(), payload.mermaid);
  prepareSvgForInteraction(svg, payload.importEdges);
  initViewerBridge(payload);
}

downloadBtn.addEventListener('click', () => {
  if (!latestSvg) return;
  const blob = new Blob([latestSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ironglancer.svg';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

copyJsxTreeBtn.addEventListener('click', () => {
  copyRawText(rawJsxTreeText, 'JSX tree', copyJsxTreeStatusEl);
});

copyMermaidSourceBtn.addEventListener('click', () => {
  copyRawText(rawMermaidSourceText, 'Mermaid source', copyMermaidSourceStatusEl);
});

bindInteraction();
main().catch((error) => {
  subtitleEl.textContent = error?.message || String(error);
  subtitleEl.style.color = '#b42318';
  buildMetaEl.textContent = '';
});
