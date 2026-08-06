import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyReviewPolicy,
  DiffReviewError,
  validateBaselineReport,
  validateSuppressionsConfig,
} from '../src/lib/diff-review.js';

function finding(id, severity = 'warning') {
  return {
    id,
    ruleId: 'IRONG_TEST',
    severity,
    confidence: 'high',
    message: `Finding ${id}`,
    evidence: { id },
    location: { path: 'src/app.js' },
  };
}

test('applyReviewPolicy marks findings from an identical previous diff baseline as existing', () => {
  const current = {
    findings: [
      finding('finding_alpha', 'error'),
      finding('finding_beta', 'warning'),
    ],
  };
  const baseline = {
    findings: [
      finding('finding_beta', 'warning'),
      finding('finding_alpha', 'error'),
    ],
  };

  const reviewed = applyReviewPolicy(current, { baseline });

  assert.deepEqual(reviewed.findings.map((item) => [item.id, item.review]), [
    ['finding_alpha', { baselineState: 'existing', suppressed: false }],
    ['finding_beta', { baselineState: 'existing', suppressed: false }],
  ]);
  assert.deepEqual(reviewed.reviewPolicy, {
    baselineProvided: true,
    baselineFindingCount: 2,
    suppressionCount: 0,
    unusedSuppressionCount: 0,
    findings: {
      new: 0,
      existing: 2,
      suppressed: 0,
      actionable: 0,
    },
    failOn: null,
    gateTriggered: false,
    gateFindingIds: [],
  });
});

test('validateBaselineReport rejects malformed baseline reports', () => {
  const cases = [
    {
      name: 'missing findings',
      value: {},
      pattern: /findings array/,
    },
    {
      name: 'non-object finding',
      value: { findings: ['finding_alpha'] },
      pattern: /findings must be JSON objects/,
    },
    {
      name: 'empty id',
      value: { findings: [{ id: '' }] },
      pattern: /nonempty string id/,
    },
    {
      name: 'control-sequence id',
      value: { findings: [{ id: 'finding_aaaaaaaaaaaaaaaa\u001b]8;;https:\/\/evil.example\u0007' }] },
      pattern: /valid IronGlancer finding id/,
    },
    {
      name: 'duplicate id',
      value: { findings: [{ id: 'finding_alpha' }, { id: 'finding_alpha' }] },
      pattern: /duplicate finding id/,
    },
  ];

  for (const { name, value, pattern } of cases) {
    assert.throws(
      () => validateBaselineReport(value),
      (error) => error instanceof DiffReviewError
        && error.code === 'invalid_baseline'
        && pattern.test(error.message),
      name,
    );
  }
});

test('applyReviewPolicy applies exact finding suppressions and counts unused entries', () => {
  const reviewed = applyReviewPolicy({
    findings: [
      finding('finding_alpha', 'error'),
      finding('finding_beta', 'warning'),
      finding('finding_gamma', 'note'),
    ],
  }, {
    suppressions: {
      version: 1,
      suppressions: [
        { findingId: 'finding_beta', reason: 'Accepted dependency shape for this release.' },
        { findingId: 'finding_missing', reason: 'Kept for a finding that is not present anymore.' },
      ],
    },
  });

  assert.deepEqual(reviewed.findings.map((item) => [item.id, item.review]), [
    ['finding_alpha', { baselineState: 'new', suppressed: false }],
    ['finding_beta', {
      baselineState: 'new',
      suppressed: true,
      suppressionReason: 'Accepted dependency shape for this release.',
    }],
    ['finding_gamma', { baselineState: 'new', suppressed: false }],
  ]);
  assert.equal(reviewed.reviewPolicy.suppressionCount, 2);
  assert.equal(reviewed.reviewPolicy.unusedSuppressionCount, 1);
  assert.deepEqual(reviewed.reviewPolicy.findings, {
    new: 3,
    existing: 0,
    suppressed: 1,
    actionable: 2,
  });
});

test('validateSuppressionsConfig rejects malformed suppression files', () => {
  const cases = [
    {
      name: 'wrong version',
      value: { version: 2, suppressions: [] },
      pattern: /version 1/,
    },
    {
      name: 'missing suppressions array',
      value: { version: 1 },
      pattern: /suppressions array/,
    },
    {
      name: 'duplicate findingId',
      value: {
        version: 1,
        suppressions: [
          { findingId: 'finding_alpha', reason: 'First reason.' },
          { findingId: 'finding_alpha', reason: 'Second reason.' },
        ],
      },
      pattern: /duplicate findingId/,
    },
    {
      name: 'empty findingId',
      value: {
        version: 1,
        suppressions: [{ findingId: '', reason: 'A real reason.' }],
      },
      pattern: /nonempty string findingId/,
    },
    {
      name: 'control-sequence findingId',
      value: {
        version: 1,
        suppressions: [{
          findingId: 'finding_aaaaaaaaaaaaaaaa\u001b]8;;https:\/\/evil.example\u0007',
          reason: 'A real reason.',
        }],
      },
      pattern: /valid IronGlancer finding id/,
    },
    {
      name: 'empty reason',
      value: {
        version: 1,
        suppressions: [{ findingId: 'finding_alpha', reason: '   ' }],
      },
      pattern: /nonempty string reason/,
    },
    {
      name: 'entry extra key',
      value: {
        version: 1,
        suppressions: [{ findingId: 'finding_alpha', reason: 'A real reason.', path: 'src/app.js' }],
      },
      pattern: /only findingId and reason/,
    },
    {
      name: 'top-level extra key',
      value: {
        version: 1,
        suppressions: [],
        expires: 'never',
      },
      pattern: /only version and suppressions/,
    },
  ];

  for (const { name, value, pattern } of cases) {
    assert.throws(
      () => validateSuppressionsConfig(value),
      (error) => error instanceof DiffReviewError
        && error.code === 'invalid_suppressions'
        && pattern.test(error.message),
      name,
    );
  }
});

test('applyReviewPolicy metadata is deterministic for shuffled baseline and suppression entries', () => {
  const current = {
    findings: [
      finding('finding_zulu', 'error'),
      finding('finding_alpha', 'note'),
      finding('finding_mike', 'warning'),
      finding('finding_bravo', 'note'),
    ],
  };
  const first = applyReviewPolicy(current, {
    baseline: { findings: [{ id: 'finding_mike' }, { id: 'finding_zulu' }] },
    suppressions: {
      version: 1,
      suppressions: [
        { findingId: 'finding_alpha', reason: 'Accepted note.' },
        { findingId: 'finding_unused', reason: 'Retained stale suppression.' },
      ],
    },
    failOn: 'note',
  });
  const second = applyReviewPolicy(current, {
    baseline: { findings: [{ id: 'finding_zulu' }, { id: 'finding_mike' }] },
    suppressions: {
      version: 1,
      suppressions: [
        { findingId: 'finding_unused', reason: 'Retained stale suppression.' },
        { findingId: 'finding_alpha', reason: 'Accepted note.' },
      ],
    },
    failOn: 'note',
  });

  assert.deepEqual(second.reviewPolicy, first.reviewPolicy);
  assert.deepEqual(
    second.findings.map((item) => [item.id, item.review]),
    first.findings.map((item) => [item.id, item.review]),
  );
  assert.deepEqual(first.reviewPolicy.gateFindingIds, ['finding_bravo']);
});
