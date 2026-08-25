import { describe, it, expect } from 'vitest';
import { encodeBase62, decodeBase62 } from './base62.js';

describe('Base62 encoding', () => {
  it('encodes 0 correctly', () => {
    expect(encodeBase62(0)).toBe('a');
  });

  it('encodes small numbers correctly', () => {
    expect(encodeBase62(1)).toBe('b');
    expect(encodeBase62(61)).toBe('9'); // last char in the alphabet
  });

  it('encodes larger numbers without collision', () => {
    const a = encodeBase62(12345);
    const b = encodeBase62(12346);
    expect(a).not.toBe(b);
  });

  it('round-trips: decode(encode(x)) === x', () => {
    const testValues = [0, 1, 61, 62, 1000, 999999];
    testValues.forEach((num) => {
      expect(decodeBase62(encodeBase62(num))).toBe(num);
    });
  });

  it('throws on invalid Base62 characters', () => {
    expect(() => decodeBase62('!!!')).toThrow();
  });
});