import { describe, it, expect } from 'vitest';
import { resolveUpload, hashBuffer } from '../../server/fileStore.js';
import path from 'path';
import { createHash } from 'crypto';

const VALID_ID = 'a'.repeat(64);

describe('resolveUpload', () => {
  it('returns an absolute path with fileId as basename inside uploads/', () => {
    const result = resolveUpload(VALID_ID);
    expect(result).not.toBeNull();
    expect(path.basename(result)).toBe(VALID_ID);
    expect(result).toContain('uploads');
  });

  it.each([
    ['too short',         'abc'],
    ['65 chars',          'a'.repeat(65)],
    ['uppercase hex',     'A'.repeat(64)],
    ['non-hex chars',     'g'.repeat(64)],
    ['path traversal',    '../server.js'],
    ['encoded traversal', '..%2f..%2fserver.js'],
    ['empty string',      ''],
  ])('returns null for %s', (_label, id) => {
    expect(resolveUpload(id)).toBeNull();
  });
});

describe('hashBuffer', () => {
  it('returns the correct SHA-256 hex for a known input', () => {
    const buf = Buffer.from('hello world');
    expect(hashBuffer(buf)).toBe(createHash('sha256').update(buf).digest('hex'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashBuffer(Buffer.from('a'))).not.toBe(hashBuffer(Buffer.from('b')));
  });
});
