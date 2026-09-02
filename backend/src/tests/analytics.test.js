import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import './setup.js';
import { processClickJob } from '../services/clickProcessor.service.js';

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

// simulate a worker processing the job immediately and synchronously,
// so tests don't depend on real Redis/BullMQ infrastructure
vi.mock('../queues/analytics.queue.js', () => ({
  analyticsQueue: {
    add: vi.fn(async (name, data) => {
      await processClickJob(data);
    }),
  },
}));

const { default: app } = await import('../app.js');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('GET /api/analytics/:shortCode', () => {
  it('returns zeroed analytics for a URL with no clicks yet', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'no-clicks-yet' });

    const res = await request(app).get(`/api/analytics/${createRes.body.shortCode}`);

    expect(res.status).toBe(200);
    expect(res.body.totalClicks).toBe(0);
    expect(res.body.clicksByReferrer).toEqual([]);
  });

  it('returns 404 for a short code that was never created', async () => {
    const res = await request(app).get('/api/analytics/never-existed');
    expect(res.status).toBe(404);
  });

  it('correctly counts and groups clicks by referrer', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'click-count-test' });

    const shortCode = createRes.body.shortCode;

    await request(app).get(`/${shortCode}`).set('Referer', 'https://twitter.com');
    await request(app).get(`/${shortCode}`).set('Referer', 'https://twitter.com');
    await request(app).get(`/${shortCode}`); // no referrer — counts as 'direct'

    // fire-and-forget writes need a moment to complete before we check them
    await wait(100);

    const res = await request(app).get(`/api/analytics/${shortCode}`);

    expect(res.body.totalClicks).toBe(3);

    const twitterEntry = res.body.clicksByReferrer.find((r) => r._id === 'https://twitter.com');
    expect(twitterEntry.count).toBe(2);

    const directEntry = res.body.clicksByReferrer.find((r) => r._id === 'direct');
    expect(directEntry.count).toBe(1);
  });
});

describe('GET /api/stats', () => {
  it('returns global system stats', async () => {
    // We already have 2 links created from previous tests in this file,
    // and 3 clicks on the second link.
    const res = await request(app).get('/api/stats');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalLinks');
    expect(res.body).toHaveProperty('totalClicks');
    expect(res.body).toHaveProperty('activeUsers');
    expect(res.body).toHaveProperty('topLinks');
    expect(typeof res.body.totalLinks).toBe('number');
    expect(typeof res.body.totalClicks).toBe('number');
    expect(typeof res.body.activeUsers).toBe('number');
    expect(Array.isArray(res.body.topLinks)).toBe(true);
  });
});