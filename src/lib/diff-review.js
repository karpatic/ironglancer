import { compareLocale, normalizeString } from './utils.js';

const SEVERITY_ORDER = new Map([
  ['error', 0],
  ['warning', 1],
  ['note', 2],
]);

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

function assertSafeFindingId(id, label, code) {
  if (CONTROL_CHARACTER_PATTERN.test(id)) {
    reviewError(`${label} must be a valid IronGlancer finding id.`, code);
  }
}

export class DiffReviewError extends Error {
  constructor(message, code = 'diff_review_error') {
    super(message);
    this.name = 'DiffReviewError';
    this.code = code;
  }
}

function reviewError(message, code = 'invalid_review_input') {
  throw new DiffReviewError(message, code);
}

function assertPlainObject(value, label, code = 'invalid_review_input') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    reviewError(`${label} must be a JSON object.`, code);
  }
}

function assertExactKeys(value, expectedKeys, label, code) {
  const actualKeys = Object.keys(value).sort(compareLocale);
  const expected = [...expectedKeys].sort(compareLocale);
  if (
    actualKeys.length !== expected.length
    || actualKeys.some((key, index) => key !== expected[index])
  ) {
    reviewError(`${label} must contain only ${expectedKeys.join(' and ')}.`, code);
  }
}

export function validateBaselineReport(baseline) {
  assertPlainObject(baseline, 'Baseline report', 'invalid_baseline');
  if (!Array.isArray(baseline.findings)) {
    reviewError('Baseline report must include a top-level findings array.', 'invalid_baseline');
  }
  const seen = new Set();
  for (const finding of baseline.findings) {
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
      reviewError('Baseline report findings must be JSON objects.', 'invalid_baseline');
    }
    const id = finding.id;
    if (typeof id !== 'string' || id.trim() === '') {
      reviewError('Baseline report findings must each include a nonempty string id.', 'invalid_baseline');
    }
    assertSafeFindingId(id, 'Baseline report finding id', 'invalid_baseline');
    if (seen.has(id)) {
      reviewError(`Baseline report contains duplicate finding id "${id}".`, 'invalid_baseline');
    }
    seen.add(id);
  }
  return {
    findingIds: seen,
    findingCount: baseline.findings.length,
  };
}

export function validateSuppressionsConfig(config) {
  assertPlainObject(config, 'Suppressions file', 'invalid_suppressions');
  if (config.version !== 1) {
    reviewError('Suppressions file must use version 1.', 'invalid_suppressions');
  }
  if (!Array.isArray(config.suppressions)) {
    reviewError('Suppressions file must include a suppressions array.', 'invalid_suppressions');
  }
  assertExactKeys(config, ['version', 'suppressions'], 'Suppressions file', 'invalid_suppressions');

  const seen = new Set();
  const suppressions = config.suppressions.map((entry) => {
    assertPlainObject(entry, 'Suppression entry', 'invalid_suppressions');
    assertExactKeys(entry, ['findingId', 'reason'], 'Suppression entry', 'invalid_suppressions');
    if (typeof entry.findingId !== 'string' || entry.findingId.trim() === '') {
      reviewError('Suppression entry must include a nonempty string findingId.', 'invalid_suppressions');
    }
    assertSafeFindingId(entry.findingId, 'Suppression entry findingId', 'invalid_suppressions');
    if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      reviewError('Suppression entry must include a nonempty string reason.', 'invalid_suppressions');
    }
    if (seen.has(entry.findingId)) {
      reviewError(`Suppressions file contains duplicate findingId "${entry.findingId}".`, 'invalid_suppressions');
    }
    seen.add(entry.findingId);
    return {
      findingId: entry.findingId,
      reason: entry.reason.trim(),
    };
  });

  return {
    suppressions,
    suppressionCount: suppressions.length,
    byFindingId: new Map(suppressions.map((entry) => [entry.findingId, entry.reason])),
  };
}

function normalizeFailOn(value) {
  if (value == null || value === '') return null;
  const failOn = normalizeString(value).trim().toLowerCase();
  if (!SEVERITY_ORDER.has(failOn)) {
    reviewError('--fail-on must be one of error, warning, or note.', 'invalid_fail_on');
  }
  return failOn;
}

function shouldGateFinding(finding, failOn) {
  if (!failOn || finding.review?.baselineState !== 'new' || finding.review?.suppressed) return false;
  return (SEVERITY_ORDER.get(finding.severity) ?? 99) <= SEVERITY_ORDER.get(failOn);
}

function emptyBaselineInfo() {
  return {
    findingIds: new Set(),
    findingCount: 0,
  };
}

function emptySuppressionsInfo() {
  return {
    suppressions: [],
    suppressionCount: 0,
    byFindingId: new Map(),
  };
}

export function applyReviewPolicy(diff, {
  baseline = null,
  suppressions = null,
  failOn = null,
} = {}) {
  assertPlainObject(diff, 'Diff report');
  const findings = Array.isArray(diff.findings) ? diff.findings : [];
  const baselineProvided = baseline != null;
  const baselineInfo = baselineProvided ? validateBaselineReport(baseline) : emptyBaselineInfo();
  const suppressionsInfo = suppressions != null ? validateSuppressionsConfig(suppressions) : emptySuppressionsInfo();
  const usedSuppressionIds = new Set();
  const normalizedFailOn = normalizeFailOn(failOn);

  const reviewedFindings = findings.map((finding) => {
    const baselineState = baselineInfo.findingIds.has(finding.id) ? 'existing' : 'new';
    const suppressionReason = suppressionsInfo.byFindingId.get(finding.id);
    if (suppressionReason) usedSuppressionIds.add(finding.id);
    return {
      ...finding,
      review: {
        baselineState,
        suppressed: Boolean(suppressionReason),
        ...(suppressionReason ? { suppressionReason } : {}),
      },
    };
  });
  const gateFindingIds = reviewedFindings
    .filter((finding) => shouldGateFinding(finding, normalizedFailOn))
    .map((finding) => finding.id)
    .sort(compareLocale);

  return {
    ...diff,
    findings: reviewedFindings,
    reviewPolicy: {
      baselineProvided,
      baselineFindingCount: baselineInfo.findingCount,
      suppressionCount: suppressionsInfo.suppressionCount,
      unusedSuppressionCount: suppressionsInfo.suppressionCount - usedSuppressionIds.size,
      findings: {
        new: reviewedFindings.filter((finding) => finding.review.baselineState === 'new').length,
        existing: reviewedFindings.filter((finding) => finding.review.baselineState === 'existing').length,
        suppressed: reviewedFindings.filter((finding) => finding.review.suppressed).length,
        actionable: reviewedFindings.filter((finding) => (
          finding.review.baselineState === 'new' && !finding.review.suppressed
        )).length,
      },
      failOn: normalizedFailOn,
      gateTriggered: gateFindingIds.length > 0,
      gateFindingIds,
    },
  };
}
