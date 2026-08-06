export { analyzeProject, normalizeRouteAliases } from './lib/analyze-project.js';
export { createArchitectureDiff, loadSnapshotFromPath, loadSnapshotInput } from './lib/diff-command.js';
export { SnapshotDiffError, compareSnapshots, renderDiffHtml, renderDiffSarif } from './lib/diff-snapshots.js';
export { generateStaticSite } from './lib/generate-static-site.js';
export { createStaticAnalysisRequestHandler, loadStaticAnalysisRun, startStaticAnalysisServer } from './lib/serve-static-site.js';
