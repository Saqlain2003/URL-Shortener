import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import './setup.js';

vi.mock('../config/redis.js', () => {
  const store = new Map();
  const ttls = new Map(); // track TTLs so tests can verify rate-limit windows if needed
  
  return {
    default: {
      get: vi.fn(async (key) => store.get(key) ?? null),
      setEx: vi.fn(async (key, ttl, value) => store.set(key, value)),
      del: vi.fn(async (key) => store.delete(key)),
      incr: vi.fn(async (key) => {
        const current = parseInt(store.get(key) || '0', 10);
        const next = current + 1;
        store.set(key, String(next));
        return next;
      }),
      expire: vi.fn(async (key, seconds) => {
        ttls.set(key, seconds);
        return 1;
      }),
      ttl: vi.fn(async (key) => ttls.get(key) ?? -1),
      isReady: true,
    },
    __store: store,
  };
});

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key';
});

const { default: app } = await import('../app.js');

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@example.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'password456' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects a wrong password with a generic error message', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login2@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects login for a non-existent email with the SAME generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doesnotexist@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});