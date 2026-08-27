import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import './setup.js';
import ClickEvent from '../models/ClickEvent.js';

vi.mock('../config/redis.js', () => {
  const store = new Map();
  const ttls = new Map();
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
      expire: vi.fn(async (key, seconds) => { ttls.set(key, seconds); return 1; }),
      ttl: vi.fn(async (key) => ttls.get(key) ?? -1),
      isReady: true,
    },
  };
});

const { default: app } = await import('../app.js');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

describe('GET /api/analytics/:shortCode/timeseries', () => {
  it('returns 404 for a short code that was never created', async () => {
    const res = await request(app).get('/api/analytics/never-existed/timeseries');
    expect(res.status).toBe(404);
  });

  it('returns 7 days by default, all zero, for a URL with no clicks', async () => {
    await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'ts-empty' });

    const res = await request(app).get('/api/analytics/ts-empty/timeseries');

    expect(res.status).toBe(200);
    expect(res.body.timeSeries).toHaveLength(7);
    expect(res.body.timeSeries.every((d) => d.count === 0)).toBe(true);
  });

  it('correctly buckets clicks by day and fills gaps with zero', async () => {
    await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'ts-buckets' });

    // manually insert click events with backdated timestamps —
    // simulates what recordClick would have produced on those days
    await ClickEvent.create([
      { short_code: 'ts-buckets', timestamp: daysAgo(2) },
      { short_code: 'ts-buckets', timestamp: daysAgo(2) },
      { short_code: 'ts-buckets', timestamp: daysAgo(1) },
      { short_code: 'ts-buckets', timestamp: daysAgo(0) },
    ]);

    const res = await request(app).get('/api/analytics/ts-buckets/timeseries?days=7');

    expect(res.status).toBe(200);
    expect(res.body.timeSeries).toHaveLength(7);

    const totalCount = res.body.timeSeries.reduce((sum, d) => sum + d.count, 0);
    expect(totalCount).toBe(4);

    // last entry (today) should have exactly 1 click
    const today = res.body.timeSeries[res.body.timeSeries.length - 1];
    expect(today.count).toBe(1);

    // third-from-last entry (2 days ago) should have exactly 2 clicks
    const twoDaysAgo = res.body.timeSeries[res.body.timeSeries.length - 3];
    expect(twoDaysAgo.count).toBe(2);
  });

  it('caps the days parameter at 90 even if a larger value is requested', async () => {
    await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'ts-cap' });

    const res = await request(app).get('/api/analytics/ts-cap/timeseries?days=99999');

    expect(res.status).toBe(200);
    expect(res.body.timeSeries).toHaveLength(90);
  });

  it('defaults to 7 days when an invalid days value is given', async () => {
    await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'ts-invalid' });

    const res = await request(app).get('/api/analytics/ts-invalid/timeseries?days=notanumber');

    expect(res.status).toBe(200);
    expect(res.body.timeSeries).toHaveLength(7);
  });
});