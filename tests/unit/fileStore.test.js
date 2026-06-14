import { describe, it, expect } from 'vitest';
import { resolveUpload, hashBuffer } from '../../server/fileStore.js';
import path from 'path';
import { createHash } from 'crypto';

const VALID_ID = 'a'.repeat(64);

describe('resolveUpload', () => {
  it('returns a path whose basename is the fileId for a valid id', () => {
    const result = resolveUpload(VALID_ID);
    expect(result).not.toBeNull();
    expect(path.basename(result)).toBe(VALID_ID);
  });

  it('returned path contains "uploads"', () => {
    expect(resolveUpload(VALID_ID)).toContain('uploads');
  });

  it('returns null for an id that is too short', () => {
    expect(resolveUpload('abc')).toBeNull();
  });

  it('returns null for an id that is 65 chars (one too many)', () => {
    expect(resolveUpload('a'.repeat(65))).toBeNull();
  });

  it('returns null for an id with uppercase hex chars', () => {
    expect(resolveUpload('A'.repeat(64))).toBeNull();
  });

  it('returns null for an id with non-hex chars', () => {
    expect(resolveUpload('g'.repeat(64))).toBeNull();
  });

  it('returns null for a path-traversal attempt', () => {
    expect(resolveUpload('../server.js')).toBeNull();
    expect(resolveUpload('..%2f..%2fserver.js')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveUpload('')).toBeNull();
  });
});

describe('hashBuffer', () => {
  it('returns a 64-character lowercase hex string', () => {
    expect(hashBuffer(Buffer.from('test'))).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns a consistent hash for the same input', () => {
    const buf = Buffer.from('hello world');
    expect(hashBuffer(buf)).toBe(hashBuffer(buf));
  });

  it('matches the expected SHA-256 hash for a known input', () => {
    const buf = Buffer.from('hello world');
    const expected = createHash('sha256').update(buf).digest('hex');
    expect(hashBuffer(buf)).toBe(expected);
  });

  it('produces different hashes for different inputs', () => {
    expect(hashBuffer(Buffer.from('a'))).not.toBe(hashBuffer(Buffer.from('b')));
  });
});
