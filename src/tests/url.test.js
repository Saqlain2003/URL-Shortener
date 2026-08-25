import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import './setup.js';

// Mock the Redis client entirely — we're testing app logic, not Redis itself
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

const { default: app } = await import('../app.js');

describe('POST /shorten', () => {
  it('creates a short URL for a valid long URL', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toBeDefined();
    expect(res.body.longUrl).toBe('https://example.com');
  });

  it('rejects an invalid URL', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ longUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  it('rejects a missing longUrl', async () => {
    const res = await request(app).post('/shorten').send({});
    expect(res.status).toBe(400);
  });

  it('accepts a valid custom alias', async () => {
    const res = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'my-alias' });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toBe('my-alias');
  });

  it('rejects a duplicate custom alias', async () => {
    await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'dupe-test' });

    const res = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://another.com', customAlias: 'dupe-test' });

    expect(res.status).toBe(409);
  });
});

describe('GET /:shortCode (redirect)', () => {
  it('redirects to the original URL', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'redirect-test' });

    const res = await request(app).get(`/${createRes.body.shortCode}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');
  });

  it('returns 404 for a non-existent short code', async () => {
    const res = await request(app).get('/thisdoesnotexist');
    expect(res.status).toBe(404);
  });
});