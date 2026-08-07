import { compareLocale } from '../utils.js';
import { compactStableId } from '../analysis/stable-id.js';

export function frontEndFindings({ unresolvedImports, browserIncompatibleImports, remoteImports, commonJsSyntax }) {
  return [
    ...browserIncompatibleImports.map((item) => ({
      id: compactStableId('finding', ['browser-incompatible-import', item.sourceModulePath, item.specifier]),
      ruleId: 'IRONG_FRONTEND_NODE_IMPORT',
      severity: 'error',
      message: `Browser-reachable module imports Node builtin "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...unresolvedImports.map((item) => ({
      id: compactStableId('finding', ['unresolved-import', item.sourceModulePath, item.specifier, item.loadKind]),
      ruleId: 'IRONG_UNRESOLVED_IMPORT',
      severity: 'error',
      message: `Browser entry has unresolved import "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...remoteImports.map((item) => ({
      id: compactStableId('finding', ['remote-import', item.sourceModulePath, item.specifier, item.loadKind]),
      ruleId: 'IRONG_REMOTE_IMPORT',
      severity: 'warning',
      message: `Browser entry uses remote import "${item.specifier}".`,
      modulePath: item.sourceModulePath,
      evidence: item,
    })),
    ...commonJsSyntax.map((item) => ({
      id: compactStableId('finding', ['commonjs-syntax', item.modulePath, item.kind, item.line]),
      ruleId: 'IRONG_UNSUPPORTED_COMMONJS',
      severity: 'error',
      message: `Browser module contains unsupported CommonJS ${item.kind}.`,
      modulePath: item.modulePath,
      evidence: item,
    })),
  ].sort((a, b) => compareLocale(a.severity, b.severity)
    || compareLocale(a.ruleId, b.ruleId)
    || compareLocale(a.modulePath, b.modulePath)
    || compareLocale(a.id, b.id));
}
