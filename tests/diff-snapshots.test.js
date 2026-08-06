import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  SnapshotDiffError,
  compareSnapshots,
  renderDiffHtml,
  renderDiffSarif,
} from '../src/lib/diff-snapshots.js';
import { applyReviewPolicy } from '../src/lib/diff-review.js';
import * as publicApi from '../src/index.js';

function snapshot({
  label = 'snapshot',
  schemaVersion = '1.2.0',
  entry = 'src/app.jsx',
  modules = [],
  functions = [],
  edges = [],
  importEdges = [],
  summary = {},
} = {}) {
  return {
    entry,
    modules,
    importEdges,
    functionMap: {
      limitations: ['Static function dependencies are review aids, not runtime call graphs.'],
      functions,
      edges,
    },
    summary: {
      moduleCount: modules.length,
      reachableModuleCount: modules.filter((module) => module.reachable !== false).length,
      ...summary,
    },
    meta: {
      schemaVersion,
      generatedAt: `${label}-generated`,
      buildId: `${label}-build`,
      gitCommit: `${label}-commit`,
      rootDir: `/tmp/private/${label}`,
      entry,
    },
  };
}

function module(path, options = {}) {
  return {
    path,
    lineCount: options.lineCount ?? 1,
    reachable: options.reachable ?? true,
    isJsx: options.isJsx ?? path.endsWith('.jsx'),
    localDependencies: options.localDependencies || [],
    externalDependencies: options.externalDependencies || [],
    importRefs: options.importRefs || [],
  };
}

function fn(stableId, modulePath, name, options = {}) {
  return {
    id: options.id || `${stableId}-legacy`,
    stableId,
    modulePath,
    name,
    declarationName: options.declarationName || name,
    kind: options.kind || 'function',
    ...(options.implementationFingerprint ? { implementationFingerprint: options.implementationFingerprint } : {}),
    component: options.component ?? /^[A-Z]/.test(name),
    reachable: options.reachable ?? true,
    exported: options.exported ?? false,
    exportedNames: options.exportedNames || [],
    exportKinds: options.exportKinds || [],
    scopePath: options.scopePath || '',
    startLine: options.startLine ?? 1,
    endLine: options.endLine ?? 1,
    lineCount: options.lineCount ?? 1,
    placement: {
      assessment: {
        assessment: options.placementAssessment || 'static-isolated',
        confidence: 'medium',
        summary: '',
        rationale: [],
      },
      evidence: {},
      groups: {},
    },
  };
}

function edge(source, target, options = {}) {
  return {
    id: options.id || `${source.id}->${target.id}`,
    scope: options.scope || (source.modulePath === target.modulePath ? 'same-module' : 'imported'),
    relationKind: options.relationKind || 'static-call',
    syntaxKinds: options.syntaxKinds || ['call'],
    usageLines: options.usageLines || [source.startLine ?? 1],
    usages: options.usages || [{ line: source.startLine ?? 1, syntax: 'call' }],
    referenceCount: options.referenceCount ?? 1,
    sourceId: source.id,
    sourceModulePath: source.modulePath,
    sourceFunction: source.name,
    sourceKind: source.kind,
    sourceStartLine: source.startLine,
    sourceEndLine: source.endLine,
    targetId: target.id,
    targetModulePath: target.modulePath,
    targetFunction: target.name,
    targetKind: target.kind,
    targetStartLine: target.startLine,
    targetEndLine: target.endLine,
    ...(options.import ? { import: options.import } : {}),
  };
}

test('compareSnapshots returns an empty deterministic diff for unchanged snapshots without private roots', () => {
  const base = snapshot({
    label: 'base',
    modules: [module('src/app.jsx')],
    functions: [fn('fn_app', 'src/app.jsx', 'App', { exported: true, exportedNames: ['App'] })],
  });
  const head = structuredClone(base);
  head.meta = { ...head.meta, generatedAt: 'head-generated', buildId: 'head-build', gitCommit: 'head-commit' };

  const diff = compareSnapshots(base, head, {
    baseLabel: 'base',
    headLabel: 'head',
    generatedAt: '2026-08-06T12:00:00.000Z',
  });

  assert.equal(diff.schemaVersion, '1.1.0');
  assert.equal(diff.generatedAt, '2026-08-06T12:00:00.000Z');
  assert.equal(diff.privacy.sourceMode, 'none');
  assert.equal(diff.base.label, 'base');
  assert.equal(diff.head.label, 'head');
  assert.deepEqual(diff.modules, { added: [], removed: [], changed: [] });
  assert.deepEqual(diff.functions.added, []);
  assert.deepEqual(diff.functions.removed, []);
  assert.deepEqual(diff.functions.changed, []);
  assert.deepEqual(diff.edges, { added: [], removed: [], changed: [] });
  assert.deepEqual(diff.findings, []);
  assert.equal(JSON.stringify(diff).includes('/tmp/private'), false);
});

test('compareSnapshots reports module add/remove/change with dependency and import-edge details', () => {
  const base = snapshot({
    label: 'base',
    modules: [
      module('src/app.jsx', {
        lineCount: 10,
        localDependencies: ['src/old.js'],
        externalDependencies: ['react'],
      }),
      module('src/old.js', { lineCount: 2 }),
    ],
    importEdges: [
      {
        sourcePath: 'src/app.jsx',
        targetPath: 'src/old.js',
        loadKinds: ['static'],
        imports: [{ imported: 'oldHelper', local: 'oldHelper', kind: 'named', inferred: false }],
      },
    ],
  });
  const head = snapshot({
    label: 'head',
    modules: [
      module('src/app.jsx', {
        lineCount: 14,
        localDependencies: ['src/new.js'],
        externalDependencies: ['@scope/pkg'],
      }),
      module('src/new.js', { lineCount: 3 }),
    ],
    importEdges: [
      {
        sourcePath: 'src/app.jsx',
        targetPath: 'src/new.js',
        loadKinds: ['dynamic'],
        imports: [{ imported: 'newHelper', local: 'newHelper', kind: 'named', inferred: false }],
      },
    ],
  });

  const diff = compareSnapshots(base, head, { generatedAt: 'now' });

  assert.deepEqual(diff.modules.added.map((item) => item.path), ['src/new.js']);
  assert.deepEqual(diff.modules.removed.map((item) => item.path), ['src/old.js']);
  const appChange = diff.modules.changed.find((item) => item.path === 'src/app.jsx');
  assert.ok(appChange);
  assert.deepEqual(appChange.changedFields, [
    'lineCount',
    'localDependencies',
    'externalDependencies',
    'importEdges',
  ]);
  assert.deepEqual(
    appChange.changes.find((change) => change.field === 'localDependencies'),
    { field: 'localDependencies', base: ['src/old.js'], head: ['src/new.js'] },
  );
  assert.deepEqual(
    appChange.changes.find((change) => change.field === 'importEdges').added.map((edge) => edge.targetPath),
    ['src/new.js'],
  );
  assert.deepEqual(
    appChange.changes.find((change) => change.field === 'importEdges').removed.map((edge) => edge.targetPath),
    ['src/old.js'],
  );
  assert.equal(diff.summary.modules.added, 1);
  assert.equal(diff.summary.modules.removed, 1);
  assert.equal(diff.summary.modules.changed, 1);
});

test('compareSnapshots reports function add/remove/change for exact stable IDs', () => {
  const base = snapshot({
    modules: [module('src/app.jsx'), module('src/old.js')],
    functions: [
      fn('fn_app', 'src/app.jsx', 'App', {
        exported: true,
        exportedNames: ['App'],
        lineCount: 5,
        placementAssessment: 'public-entry-surface',
      }),
      fn('fn_removed', 'src/old.js', 'removedHelper', { lineCount: 2 }),
    ],
  });
  const head = snapshot({
    modules: [module('src/app.jsx'), module('src/new.js')],
    functions: [
      fn('fn_app', 'src/app.jsx', 'App', {
        exported: true,
        exportedNames: ['App'],
        lineCount: 8,
        placementAssessment: 'mixed-affinity',
      }),
      fn('fn_added', 'src/new.js', 'addedHelper', { lineCount: 3 }),
    ],
  });

  const diff = compareSnapshots(base, head);

  assert.deepEqual(diff.functions.added.map((item) => item.stableId), ['fn_added']);
  assert.deepEqual(diff.functions.removed.map((item) => item.stableId), ['fn_removed']);
  const appChange = diff.functions.changed.find((item) => item.stableId === 'fn_app');
  assert.ok(appChange);
  assert.equal(appChange.matchKind, 'exact');
  assert.equal(appChange.confidence, 'high');
  assert.deepEqual(appChange.changedFields, ['lineCount', 'placementAssessment']);
  assert.deepEqual(
    appChange.changes.find((change) => change.field === 'placementAssessment'),
    { field: 'placementAssessment', base: 'public-entry-surface', head: 'mixed-affinity' },
  );
  assert.equal(diff.summary.functions.added, 1);
  assert.equal(diff.summary.functions.removed, 1);
  assert.equal(diff.summary.functions.changed, 1);
});

test('compareSnapshots pairs unique function moves and renames with confidence', () => {
  const base = snapshot({
    modules: [module('src/app.jsx'), module('src/helpers.js')],
    functions: [
      fn('fn_move_base', 'src/app.jsx', 'movedHelper', {
        implementationFingerprint: 'impl_1111111111111111',
        lineCount: 3,
        startLine: 10,
        endLine: 12,
      }),
      fn('fn_rename_base', 'src/helpers.js', 'oldName', {
        implementationFingerprint: 'impl_2222222222222222',
        lineCount: 2,
        startLine: 4,
        endLine: 5,
      }),
    ],
  });
  const head = snapshot({
    modules: [module('src/app.jsx'), module('src/helpers.js'), module('src/moved.js')],
    functions: [
      fn('fn_move_head', 'src/moved.js', 'movedHelper', {
        implementationFingerprint: 'impl_1111111111111111',
        lineCount: 3,
        startLine: 1,
        endLine: 3,
      }),
      fn('fn_rename_head', 'src/helpers.js', 'newName', {
        implementationFingerprint: 'impl_2222222222222222',
        lineCount: 2,
        startLine: 4,
        endLine: 5,
      }),
    ],
  });

  const diff = compareSnapshots(base, head);

  assert.deepEqual(diff.functions.added, []);
  assert.deepEqual(diff.functions.removed, []);
  assert.deepEqual(diff.functions.moves.map((item) => ({
    matchKind: item.matchKind,
    confidence: item.confidence,
    basePath: item.base.modulePath,
    headPath: item.head.modulePath,
  })), [{
    matchKind: 'move',
    confidence: 'high',
    basePath: 'src/app.jsx',
    headPath: 'src/moved.js',
  }]);
  assert.deepEqual(diff.functions.renames.map((item) => ({
    matchKind: item.matchKind,
    confidence: item.confidence,
    baseName: item.base.name,
    headName: item.head.name,
  })), [{
    matchKind: 'rename',
    confidence: 'medium',
    baseName: 'oldName',
    headName: 'newName',
  }]);
  assert.deepEqual(
    diff.functions.changed.map((item) => [item.matchKind, item.changedFields]),
    [
      ['move', ['modulePath']],
      ['rename', ['name']],
    ],
  );
  assert.equal(diff.summary.functions.moves, 1);
  assert.equal(diff.summary.functions.renames, 1);
});

test('compareSnapshots leaves ambiguous move and rename candidates unpaired', () => {
  const base = snapshot({
    modules: [module('src/a.js')],
    functions: [
      fn('fn_a1', 'src/a.js', 'candidate', { lineCount: 2, startLine: 1, endLine: 2 }),
      fn('fn_a2', 'src/a.js', 'candidate', { lineCount: 2, startLine: 4, endLine: 5 }),
    ],
  });
  const head = snapshot({
    modules: [module('src/b.js')],
    functions: [
      fn('fn_b1', 'src/b.js', 'candidate', { lineCount: 2, startLine: 1, endLine: 2 }),
    ],
  });

  const diff = compareSnapshots(base, head);

  assert.deepEqual(diff.functions.moves, []);
  assert.deepEqual(diff.functions.renames, []);
  assert.deepEqual(diff.functions.added.map((item) => item.stableId), ['fn_b1']);
  assert.deepEqual(diff.functions.removed.map((item) => item.stableId), ['fn_a1', 'fn_a2']);
});

test('compareSnapshots preserves function edge identity across unique moves and reports relation changes', () => {
  const baseCaller = fn('fn_caller', 'src/app.js', 'caller', { startLine: 1, endLine: 3, lineCount: 3 });
  const baseCallee = fn('fn_callee_base', 'src/helpers.js', 'callee', {
    implementationFingerprint: 'impl_3333333333333333',
    startLine: 1,
    endLine: 2,
    lineCount: 2,
  });
  const headCaller = fn('fn_caller', 'src/app.js', 'caller', { startLine: 1, endLine: 3, lineCount: 3 });
  const headCallee = fn('fn_callee_head', 'src/moved/helpers.js', 'callee', {
    implementationFingerprint: 'impl_3333333333333333',
    startLine: 1,
    endLine: 2,
    lineCount: 2,
  });
  const base = snapshot({
    modules: [module('src/app.js'), module('src/helpers.js')],
    functions: [baseCaller, baseCallee],
    edges: [edge(baseCaller, baseCallee, { referenceCount: 1, syntaxKinds: ['reference'], relationKind: 'static-reference' })],
  });
  const head = snapshot({
    modules: [module('src/app.js'), module('src/moved/helpers.js')],
    functions: [headCaller, headCallee],
    edges: [edge(headCaller, headCallee, { referenceCount: 4, syntaxKinds: ['call'], relationKind: 'static-call' })],
  });

  const diff = compareSnapshots(base, head);

  assert.deepEqual(diff.edges.added, []);
  assert.deepEqual(diff.edges.removed, []);
  assert.equal(diff.edges.changed.length, 1);
  assert.equal(diff.edges.changed[0].base.target.stableId, 'fn_callee_base');
  assert.equal(diff.edges.changed[0].head.target.stableId, 'fn_callee_head');
  assert.deepEqual(diff.edges.changed[0].changedFields, ['relationKind', 'syntaxKinds', 'referenceCount']);
  assert.equal(diff.summary.edges.changed, 1);
});

test('compareSnapshots requires matching implementation fingerprints for move or rename pairing', () => {
  for (const headFingerprint of [undefined, 'impl_5555555555555555']) {
    const baseApi = fn('fn_api_base', 'src/old.js', 'api', {
      implementationFingerprint: 'impl_4444444444444444',
      exported: true,
      exportedNames: ['api'],
      exportKinds: ['named-export'],
      lineCount: 3,
      startLine: 1,
      endLine: 3,
    });
    const headApi = fn('fn_api_head', 'src/new.js', 'api', {
      implementationFingerprint: headFingerprint,
      exported: true,
      exportedNames: ['api'],
      exportKinds: ['named-export'],
      lineCount: 3,
      startLine: 1,
      endLine: 3,
    });
    const diff = compareSnapshots(
      snapshot({
        label: `base-${headFingerprint || 'missing'}`,
        modules: [module('src/old.js')],
        functions: [baseApi],
      }),
      snapshot({
        label: `head-${headFingerprint || 'missing'}`,
        modules: [module('src/new.js')],
        functions: [headApi],
      }),
    );

    assert.deepEqual(diff.functions.moves, []);
    assert.deepEqual(diff.functions.renames, []);
    assert.deepEqual(diff.functions.removed.map((item) => `${item.modulePath}:${item.name}`), ['src/old.js:api']);
    assert.deepEqual(diff.functions.added.map((item) => `${item.modulePath}:${item.name}`), ['src/new.js:api']);
    assert.ok(diff.findings.some((finding) => (
      finding.ruleId === 'IRONG_DIFF_EXPORT_REMOVED'
      && finding.location.path === 'src/old.js'
    )));
  }
});

test('compareSnapshots flags exported function removal and export surface narrowing', () => {
  const baseKept = fn('fn_kept', 'src/app.js', 'kept', {
    exported: true,
    exportedNames: ['kept', 'publicAlias'],
    exportKinds: ['named'],
  });
  const headKept = fn('fn_kept', 'src/app.js', 'kept', {
    exported: true,
    exportedNames: ['kept'],
    exportKinds: ['named'],
  });
  const baseRemoved = fn('fn_removed_public', 'src/api.js', 'removedPublic', {
    exported: true,
    exportedNames: ['removedPublic'],
    exportKinds: ['named'],
  });
  const base = snapshot({
    modules: [module('src/app.js'), module('src/api.js')],
    functions: [baseKept, baseRemoved],
  });
  const head = snapshot({
    modules: [module('src/app.js')],
    functions: [headKept],
  });

  const diff = compareSnapshots(base, head);

  assert.deepEqual(diff.findings.map((finding) => finding.ruleId), [
    'IRONG_DIFF_EXPORT_REMOVED',
    'IRONG_DIFF_EXPORT_NARROWED',
  ]);
  assert.deepEqual(diff.findings.map((finding) => finding.severity), ['error', 'error']);
  assert.ok(diff.findings.every((finding) => finding.confidence === 'high'));
  assert.equal(diff.findings[0].location.path, 'src/api.js');
  assert.deepEqual(diff.findings[1].evidence.removedExportNames, ['publicAlias']);
  assert.equal(diff.summary.findingsBySeverity.error, 2);
});

test('compareSnapshots flags reachable modules and functions becoming unreachable', () => {
  const baseWorker = fn('fn_worker', 'src/worker.js', 'worker', { reachable: true });
  const headWorker = fn('fn_worker', 'src/worker.js', 'worker', { reachable: false });
  const base = snapshot({
    modules: [module('src/app.js'), module('src/worker.js', { reachable: true })],
    functions: [baseWorker],
  });
  const head = snapshot({
    modules: [module('src/app.js'), module('src/worker.js', { reachable: false })],
    functions: [headWorker],
  });

  const diff = compareSnapshots(base, head);
  const reachabilityFindings = diff.findings.filter((finding) => finding.ruleId === 'IRONG_DIFF_REACHABILITY_REGRESSION');

  assert.deepEqual(reachabilityFindings.map((finding) => finding.evidence.entityType), ['module', 'function']);
  assert.deepEqual(reachabilityFindings.map((finding) => finding.location.path), ['src/worker.js', 'src/worker.js']);
  assert.ok(reachabilityFindings.every((finding) => finding.severity === 'warning'));
  assert.equal(diff.summary.findingsBySeverity.warning, 2);
});

test('compareSnapshots flags newly introduced module and function dependency cycles', () => {
  const baseA = fn('fn_a', 'src/a.js', 'a');
  const baseB = fn('fn_b', 'src/b.js', 'b');
  const headA = fn('fn_a', 'src/a.js', 'a');
  const headB = fn('fn_b', 'src/b.js', 'b');
  const base = snapshot({
    modules: [
      module('src/a.js', { localDependencies: ['src/b.js'] }),
      module('src/b.js', { localDependencies: [] }),
    ],
    functions: [baseA, baseB],
    edges: [edge(baseA, baseB)],
  });
  const head = snapshot({
    modules: [
      module('src/a.js', { localDependencies: ['src/b.js'] }),
      module('src/b.js', { localDependencies: ['src/a.js'] }),
    ],
    functions: [headA, headB],
    edges: [edge(headA, headB), edge(headB, headA)],
  });

  const diff = compareSnapshots(base, head);
  const cycleFindings = diff.findings.filter((finding) => finding.ruleId.endsWith('_CYCLE_ADDED'));

  assert.deepEqual(cycleFindings.map((finding) => finding.ruleId), [
    'IRONG_DIFF_MODULE_CYCLE_ADDED',
    'IRONG_DIFF_FUNCTION_CYCLE_ADDED',
  ]);
  assert.deepEqual(cycleFindings.map((finding) => finding.evidence.members), [
    ['src/a.js', 'src/b.js'],
    ['src/a.js:a', 'src/b.js:b'],
  ]);
  assert.ok(cycleFindings.every((finding) => finding.severity === 'warning'));
});

test('compareSnapshots handles a 12000 module acyclic chain without recursive stack overflow', { timeout: 20000 }, () => {
  const modules = Array.from({ length: 12000 }, (_, index) => {
    const current = `src/m${String(index).padStart(5, '0')}.js`;
    const next = index + 1 < 12000 ? [`src/m${String(index + 1).padStart(5, '0')}.js`] : [];
    return module(current, { localDependencies: next });
  });

  const diff = compareSnapshots(
    snapshot({ label: 'base-chain', modules }),
    snapshot({ label: 'head-chain', modules: structuredClone(modules) }),
  );

  assert.deepEqual(diff.findings.filter((finding) => finding.ruleId === 'IRONG_DIFF_MODULE_CYCLE_ADDED'), []);
});

test('compareSnapshots flags newly added cross-file function edges as static evidence notes', () => {
  const app = fn('fn_app', 'src/app.js', 'app');
  const helper = fn('fn_helper', 'src/helper.js', 'helper');
  const base = snapshot({
    modules: [module('src/app.js'), module('src/helper.js')],
    functions: [app, helper],
  });
  const head = snapshot({
    modules: [module('src/app.js'), module('src/helper.js')],
    functions: [app, helper],
    edges: [edge(app, helper, { scope: 'imported' })],
  });

  const diff = compareSnapshots(base, head);
  const finding = diff.findings.find((candidate) => candidate.ruleId === 'IRONG_DIFF_CROSS_FILE_EDGE_ADDED');

  assert.ok(finding);
  assert.equal(finding.severity, 'note');
  assert.equal(finding.confidence, 'medium');
  assert.equal(finding.location.path, 'src/app.js');
  assert.deepEqual(finding.evidence.edge, {
    source: 'src/app.js:app',
    target: 'src/helper.js:helper',
    scope: 'imported',
    relationKind: 'static-call',
    referenceCount: 1,
  });
  assert.equal(diff.summary.findingsBySeverity.note, 1);
});

test('compareSnapshots flags material fan-out increases using the documented conservative threshold', () => {
  const source = fn('fn_source', 'src/app.js', 'source');
  const target1 = fn('fn_target1', 'src/app.js', 'target1');
  const target2 = fn('fn_target2', 'src/app.js', 'target2');
  const target3 = fn('fn_target3', 'src/app.js', 'target3');
  const target4 = fn('fn_target4', 'src/app.js', 'target4');
  const base = snapshot({
    modules: [module('src/app.js')],
    functions: [source, target1, target2, target3, target4],
    edges: [edge(source, target1)],
  });
  const head = snapshot({
    modules: [module('src/app.js')],
    functions: [source, target1, target2, target3, target4],
    edges: [
      edge(source, target1),
      edge(source, target2),
      edge(source, target3),
      edge(source, target4),
    ],
  });

  const diff = compareSnapshots(base, head);
  const finding = diff.findings.find((candidate) => candidate.ruleId === 'IRONG_DIFF_FAN_INCREASE');

  assert.ok(finding);
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.evidence.metric, 'fanOut');
  assert.deepEqual(finding.evidence.threshold, { minimumDelta: 3, minimumRatio: 2 });
  assert.deepEqual(finding.evidence.counts, { base: 1, head: 4, delta: 3 });
  assert.equal(diff.summary.findingsBySeverity.warning, 1);
});

test('compareSnapshots output is deterministic for shuffled snapshot collections', () => {
  const a = fn('fn_a', 'src/a.js', 'a');
  const b = fn('fn_b', 'src/b.js', 'b');
  const c = fn('fn_c', 'src/c.js', 'c');
  const first = compareSnapshots(
    snapshot({
      modules: [
        module('src/c.js'),
        module('src/a.js', { localDependencies: ['src/b.js'] }),
        module('src/b.js'),
      ],
      functions: [c, a, b],
      edges: [edge(a, b), edge(b, c)],
    }),
    snapshot({
      modules: [
        module('src/b.js'),
        module('src/c.js', { lineCount: 4 }),
        module('src/a.js', { localDependencies: ['src/b.js', 'src/c.js'] }),
      ],
      functions: [b, c, a],
      edges: [edge(b, c), edge(a, c), edge(a, b)],
    }),
    { generatedAt: 'fixed' },
  );
  const second = compareSnapshots(
    snapshot({
      modules: [
        module('src/b.js'),
        module('src/a.js', { localDependencies: ['src/b.js'] }),
        module('src/c.js'),
      ],
      functions: [b, a, c],
      edges: [edge(b, c), edge(a, b)],
    }),
    snapshot({
      modules: [
        module('src/a.js', { localDependencies: ['src/c.js', 'src/b.js'] }),
        module('src/c.js', { lineCount: 4 }),
        module('src/b.js'),
      ],
      functions: [a, b, c],
      edges: [edge(a, b), edge(a, c), edge(b, c)],
    }),
    { generatedAt: 'fixed' },
  );

  assert.deepEqual(second, first);
});

test('compareSnapshots rejects malformed or incompatible snapshots', () => {
  assert.throws(
    () => compareSnapshots({ meta: { schemaVersion: '1.2.0' } }, snapshot()),
    (error) => error instanceof SnapshotDiffError
      && error.code === 'malformed_snapshot'
      && /modules array/.test(error.message),
  );
  assert.throws(
    () => compareSnapshots(snapshot({ schemaVersion: '0.0.1' }), snapshot()),
    (error) => error instanceof SnapshotDiffError
      && error.code === 'incompatible_snapshot'
      && /schemaVersion/.test(error.message),
  );
});

test('compareSnapshots rejects invalid snapshot identities and SARIF-unsafe locations fail-closed', () => {
  const valid = () => {
    const source = fn('fn_source', 'src/app.js', 'source');
    const target = fn('fn_target', 'src/app.js', 'target');
    return snapshot({
      modules: [module('src/app.js'), module('src/dep.js')],
      functions: [source, target],
      edges: [edge(source, target, { id: 'edge_valid' })],
      importEdges: [{
        sourcePath: 'src/app.js',
        targetPath: 'src/dep.js',
        loadKinds: ['static'],
        imports: [],
      }],
    });
  };
  const invalidCases = [
    {
      name: 'duplicate module path',
      mutate: (candidate) => candidate.modules.push(module('src/app.js')),
      pattern: /duplicate module path "src\/app\.js"/,
    },
    {
      name: 'duplicate function id',
      mutate: (candidate) => candidate.functionMap.functions.push(fn('fn_other_stable', 'src/dep.js', 'other', {
        id: candidate.functionMap.functions[0].id,
      })),
      pattern: /duplicate function id/,
    },
    {
      name: 'duplicate function stableId',
      mutate: (candidate) => candidate.functionMap.functions.push(fn(candidate.functionMap.functions[0].stableId, 'src/dep.js', 'other', {
        id: 'other-id',
      })),
      pattern: /duplicate function stableId/,
    },
    {
      name: 'duplicate function-edge id',
      mutate: (candidate) => candidate.functionMap.edges.push({
        ...structuredClone(candidate.functionMap.edges[0]),
        id: 'edge_valid',
        scope: 'imported',
      }),
      pattern: /duplicate function edge id/,
    },
    {
      name: 'duplicate function-edge identity',
      mutate: (candidate) => candidate.functionMap.edges.push({
        ...structuredClone(candidate.functionMap.edges[0]),
        id: 'edge_duplicate_identity',
      }),
      pattern: /duplicate function edge identity/,
    },
    {
      name: 'dangling sourceId',
      mutate: (candidate) => {
        candidate.functionMap.edges[0].sourceId = 'missing-source';
      },
      pattern: /dangling function edge sourceId "missing-source"/,
    },
    {
      name: 'dangling targetId',
      mutate: (candidate) => {
        candidate.functionMap.edges[0].targetId = 'missing-target';
      },
      pattern: /dangling function edge targetId "missing-target"/,
    },
    {
      name: 'function edge source module does not match source function',
      mutate: (candidate) => {
        candidate.functionMap.edges[0].sourceModulePath = 'src/dep.js';
      },
      pattern: /function edge sourceModulePath .* does not match source function modulePath/,
    },
    {
      name: 'duplicate import-edge identity',
      mutate: (candidate) => {
        candidate.importEdges.push(structuredClone(candidate.importEdges[0]));
      },
      pattern: /duplicate import edge identity/,
    },
    {
      name: 'malformed implementation fingerprint',
      mutate: (candidate) => {
        candidate.functionMap.functions[0].implementationFingerprint = 'same-shape-is-not-evidence';
      },
      pattern: /invalid function implementationFingerprint/,
    },
    {
      name: 'module dependency path refers to missing module',
      mutate: (candidate) => {
        candidate.modules[0].localDependencies = ['src/missing.js'];
      },
      pattern: /module dependency "src\/missing\.js" is not declared/,
    },
    {
      name: 'function modulePath refers to missing module',
      mutate: (candidate) => {
        candidate.functionMap.functions[0].modulePath = 'src/missing.js';
      },
      pattern: /function modulePath "src\/missing\.js" is not declared/,
    },
    {
      name: 'malformed path',
      mutate: (candidate) => {
        candidate.modules[0].path = '../escape.js';
      },
      pattern: /malformed module path "\.\.\/escape\.js"/,
    },
    {
      name: 'control character in path',
      mutate: (candidate) => {
        candidate.modules[0].path = 'src/control\u0000.js';
      },
      pattern: /malformed module path/,
    },
    {
      name: 'line zero',
      mutate: (candidate) => {
        candidate.functionMap.functions[0].startLine = 0;
      },
      pattern: /invalid function startLine 0/,
    },
    {
      name: 'noninteger line',
      mutate: (candidate) => {
        candidate.functionMap.functions[0].endLine = 1.5;
      },
      pattern: /invalid function endLine 1\.5/,
    },
    {
      name: 'usage line zero',
      mutate: (candidate) => {
        candidate.functionMap.edges[0].usageLines = [0];
        candidate.functionMap.edges[0].usages = [{ line: 0, syntax: 'call' }];
      },
      pattern: /invalid function edge usage line 0/,
    },
  ];

  for (const { name, mutate, pattern } of invalidCases) {
    const candidate = valid();
    mutate(candidate);
    assert.throws(
      () => compareSnapshots(candidate, valid()),
      (error) => error instanceof SnapshotDiffError
        && error.code === 'invalid_snapshot'
        && pattern.test(error.message),
      name,
    );
  }
});

test('compareSnapshots accepts valid snapshots with omitted optional function locations', () => {
  const noLocation = fn('fn_no_location', 'src/app.js', 'noLocation');
  delete noLocation.startLine;
  delete noLocation.endLine;
  delete noLocation.lineCount;
  delete noLocation.declarationLine;
  delete noLocation.declarationColumn;

  const diff = compareSnapshots(
    snapshot({
      modules: [module('src/app.js')],
      functions: [noLocation],
    }),
    snapshot({
      modules: [module('src/app.js')],
      functions: [structuredClone(noLocation)],
    }),
  );

  assert.deepEqual(diff.findings, []);
});

test('renderDiffHtml escapes snapshot content and omits private roots and source text', () => {
  const base = snapshot({
    label: 'base',
    modules: [module('src/app.jsx')],
    functions: [fn('fn_app', 'src/app.jsx', 'App<script>', {
      exported: true,
      exportedNames: ['App<script>'],
    })],
  });
  const head = snapshot({
    label: 'head',
    modules: [module('src/app.jsx'), module('src/new<script>.js')],
    functions: [],
  });
  base.sourceCode = { modules: [{ path: 'src/app.jsx', code: 'const secretSourceText = true;' }] };
  head.sourceCode = { modules: [{ path: 'src/new<script>.js', code: 'const secretSourceText = false;' }] };

  const diff = compareSnapshots(base, head, { generatedAt: 'fixed' });
  const html = renderDiffHtml(diff);

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<style>/);
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('src/new<script>.js'), false);
  assert.ok(html.includes('src/new&lt;script&gt;.js'));
  assert.ok(html.includes('App&lt;script&gt;'));
  assert.equal(html.includes('/tmp/private'), false);
  assert.equal(html.includes('secretSourceText'), false);
  assert.ok(html.includes('sourceMode'));
  assert.ok(html.includes('Static-analysis limitations'));
  assert.match(html, /Actionable findings<\/span><strong>1<\/strong>/);
});

test('renderDiffHtml shows review state, suppression reason, and gate summary safely', () => {
  const base = snapshot({
    label: 'base',
    modules: [module('src/api.js')],
    functions: [fn('fn_public', 'src/api.js', 'publicApi', {
      exported: true,
      exportedNames: ['publicApi'],
    })],
  });
  const diff = compareSnapshots(base, snapshot({ label: 'head', modules: [], functions: [] }), { generatedAt: 'fixed' });
  const finding = diff.findings[0];
  const reviewed = applyReviewPolicy(diff, {
    baseline: { findings: [{ id: finding.id }] },
    suppressions: {
      version: 1,
      suppressions: [{
        findingId: finding.id,
        reason: 'Accepted by architecture council <script>alert("x")</script>.',
      }],
    },
    failOn: 'error',
  });

  const html = renderDiffHtml(reviewed);

  assert.match(html, /Review Gate/);
  assert.match(html, /Existing/);
  assert.match(html, /Suppressed/);
  assert.match(html, /Gate clear/);
  assert.match(html, /Actionable findings/);
  assert.ok(html.includes('Accepted by architecture council &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;.'));
  assert.equal(html.includes('<script>'), false);
});

test('renderDiffSarif maps review state and exact suppressions to SARIF result fields', () => {
  const base = snapshot({
    modules: [module('src/api.js')],
    functions: [fn('fn_public', 'src/api.js', 'publicApi', {
      exported: true,
      exportedNames: ['publicApi'],
      startLine: 7,
      endLine: 9,
    })],
  });
  const diff = compareSnapshots(base, snapshot({ modules: [], functions: [] }));
  const finding = diff.findings[0];
  const reason = 'Accepted external compatibility waiver.';
  const reviewed = applyReviewPolicy(diff, {
    baseline: { findings: [{ id: finding.id }] },
    suppressions: {
      version: 1,
      suppressions: [{ findingId: finding.id, reason }],
    },
  });
  const sarif = renderDiffSarif(reviewed);
  const result = sarif.runs[0].results[0];

  assert.equal(result.baselineState, 'unchanged');
  assert.deepEqual(result.suppressions, [{ kind: 'external', justification: reason }]);
  assert.equal(result.properties.confidence, 'high');
  assert.deepEqual(result.properties.evidence.exportedNames, ['publicApi']);
  assert.deepEqual(result.locations[0].physicalLocation.artifactLocation, { uri: 'src/api.js' });
});

test('renderDiffSarif emits valid SARIF 2.1.0 structure with relative locations and evidence properties', () => {
  const base = snapshot({
    modules: [module('src/api.js')],
    functions: [fn('fn_public', 'src/api.js', 'publicApi', {
      exported: true,
      exportedNames: ['publicApi'],
      startLine: 7,
      endLine: 9,
    })],
  });
  const head = snapshot({
    modules: [],
    functions: [],
  });
  const diff = compareSnapshots(base, head);
  const sarif = renderDiffSarif(diff);

  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs.length, 1);
  assert.equal(sarif.runs[0].tool.driver.name, 'IronGlancer');
  assert.ok(sarif.runs[0].tool.driver.rules.some((rule) => rule.id === 'IRONG_DIFF_EXPORT_REMOVED'));
  assert.equal(sarif.runs[0].results.length, 1);
  const result = sarif.runs[0].results[0];
  assert.equal(result.ruleId, 'IRONG_DIFF_EXPORT_REMOVED');
  assert.equal(result.level, 'error');
  assert.equal(result.baselineState, 'new');
  assert.equal(result.message.text.includes('publicApi'), true);
  assert.deepEqual(result.properties.confidence, 'high');
  assert.deepEqual(result.properties.evidence.exportedNames, ['publicApi']);
  assert.deepEqual(result.locations[0].physicalLocation.artifactLocation, { uri: 'src/api.js' });
  assert.deepEqual(result.locations[0].physicalLocation.region, { startLine: 7, endLine: 9 });
  assert.equal(JSON.stringify(sarif).includes('/tmp/private'), false);
  assert.equal(JSON.stringify(sarif).includes('snippet'), false);
});

test('renderDiffSarif percent-encodes reserved filename characters in artifact URIs', () => {
  const specialPath = 'src/a#fragment?query%value.js';
  const base = snapshot({
    modules: [module(specialPath)],
    functions: [fn('fn_special', specialPath, 'specialApi', {
      exported: true,
      exportedNames: ['specialApi'],
      startLine: 1,
      endLine: 1,
    })],
  });
  const diff = compareSnapshots(base, snapshot({ modules: [], functions: [] }));
  const sarif = renderDiffSarif(diff);
  const result = sarif.runs[0].results.find((candidate) => candidate.ruleId === 'IRONG_DIFF_EXPORT_REMOVED');

  assert.equal(
    result.locations[0].physicalLocation.artifactLocation.uri,
    'src/a%23fragment%3Fquery%25value.js',
  );
});

test('package public API exports architecture diff helpers', async () => {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

  assert.equal(publicApi.compareSnapshots, compareSnapshots);
  assert.equal(typeof publicApi.renderDiffHtml, 'function');
  assert.equal(typeof publicApi.renderDiffSarif, 'function');
  assert.equal(packageJson.exports['./diff'], './src/lib/diff-snapshots.js');
});
