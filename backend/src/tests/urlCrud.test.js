import { describe, it, expect, vi } from 'vitest';
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

const redisModule = await import('../config/redis.js');
const { default: app } = await import('../app.js');

describe('PUT /urls/:shortCode', () => {
  it('updates the long URL and the redirect reflects the change', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://old-destination.com', customAlias: 'update-test' });

    const shortCode = createRes.body.shortCode;

    // warm the cache by hitting the redirect once
    await request(app).get(`/${shortCode}`);
    expect(redisModule.__store.get(`shorturl:${shortCode}`)).toBe('https://old-destination.com');

    // now update it
    const putRes = await request(app)
      .put(`/urls/${shortCode}`)
      .send({ longUrl: 'https://new-destination.com' });

    expect(putRes.status).toBe(200);

    // cache should have been invalidated — no longer holding the old value
    expect(redisModule.__store.has(`shorturl:${shortCode}`)).toBe(false);

    // and the redirect should now point at the new URL, not a stale cached one
    const redirectRes = await request(app).get(`/${shortCode}`);
    expect(redirectRes.headers.location).toBe('https://new-destination.com');
  });

  it('returns 404 when updating a non-existent short code', async () => {
    const res = await request(app)
      .put('/urls/does-not-exist')
      .send({ longUrl: 'https://example.com' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /urls/:shortCode', () => {
  it('deactivates a URL, invalidates cache, and the redirect starts 404ing', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'delete-test' });

    const shortCode = createRes.body.shortCode;

    await request(app).get(`/${shortCode}`); // warm the cache
    expect(redisModule.__store.has(`shorturl:${shortCode}`)).toBe(true);

    const deleteRes = await request(app).delete(`/urls/${shortCode}`);
    expect(deleteRes.status).toBe(200);

    expect(redisModule.__store.has(`shorturl:${shortCode}`)).toBe(false);

    const redirectRes = await request(app).get(`/${shortCode}`);
    expect(redirectRes.status).toBe(404);
  });
});