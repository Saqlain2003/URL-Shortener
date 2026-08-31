import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from './auth.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key';
});

describe('password hashing', () => {
  it('hashes a password to something different from the original', async () => {
    const hash = await hashPassword('mypassword123');
    expect(hash).not.toBe('mypassword123');
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('mypassword123');
    const isMatch = await comparePassword('mypassword123', hash);
    expect(isMatch).toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('mypassword123');
    const isMatch = await comparePassword('wrongpassword', hash);
    expect(isMatch).toBe(false);
  });
});

describe('JWT tokens', () => {
  it('generates a token that can be verified back to the same userId', () => {
    const token = generateToken('user123');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user123');
  });

  it('throws when verifying an invalid token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});