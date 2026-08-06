import test from 'node:test';
import assert from 'node:assert/strict';

import { compareLocale } from '../src/lib/utils.js';

test('compareLocale orders by deterministic code point values instead of host locale', () => {
  assert.deepEqual(['ä.js', 'z.js', 'a.js'].sort(compareLocale), ['a.js', 'z.js', 'ä.js']);
  assert.equal(compareLocale('a.js', 'a.js'), 0);
  assert.equal(compareLocale('a.js', 'z.js') < 0, true);
  assert.equal(compareLocale('z.js', 'ä.js') < 0, true);
  assert.equal(compareLocale('ä.js', 'z.js') > 0, true);
  assert.deepEqual(['2.js', '10.js', '1.js'].sort(compareLocale), ['1.js', '10.js', '2.js']);
});
