import { createHash } from 'node:crypto';

import { normalizeString } from '../utils.js';

export function encodedStaticId(value) {
  return Buffer.from(normalizeString(value), 'utf8').toString('base64url');
}

export function compactStableId(prefix, parts) {
  const digest = createHash('sha256')
    .update(parts.map((part) => normalizeString(part)).join('\u0000'))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}_${digest}`;
}
