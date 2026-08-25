import { describe, it, expect } from 'vitest';
import { isValidUrl, isValidAlias } from './validators.js';

describe('isValidUrl', () => {
  it('accepts valid http/https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('rejects non-URL strings', () => {
    expect(isValidUrl('banana')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects dangerous protocols', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
  });
});

describe('isValidAlias', () => {
  it('accepts valid aliases', () => {
    expect(isValidAlias('my-link')).toBe(true);
    expect(isValidAlias('abc123')).toBe(true);
  });

  it('rejects aliases that are too short', () => {
    expect(isValidAlias('ab')).toBe(false);
  });

  it('rejects aliases with invalid characters', () => {
    expect(isValidAlias('my link!')).toBe(false);
    expect(isValidAlias('link/with/slash')).toBe(false);
  });
});