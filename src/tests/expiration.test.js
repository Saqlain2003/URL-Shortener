import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import Url from '../models/Url.js';

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

const { runExpirationCheck } = await import('../jobs/expireLinks.job.js');

describe('runExpirationCheck', () => {
  it('deactivates URLs whose expiry has passed', async () => {
    await Url.create({
      short_code: 'expired1',
      long_url: 'https://example.com',
      expires_at: new Date(Date.now() - 60000), // 1 minute in the past
      is_active: true,
    });

    const count = await runExpirationCheck();
    expect(count).toBe(1);

    const updated = await Url.findOne({ short_code: 'expired1' });
    expect(updated.is_active).toBe(false);
  });

  it('does NOT touch URLs with no expiry set', async () => {
    await Url.create({
      short_code: 'never-expires',
      long_url: 'https://example.com',
      expires_at: null,
      is_active: true,
    });

    await runExpirationCheck();

    const stillActive = await Url.findOne({ short_code: 'never-expires' });
    expect(stillActive.is_active).toBe(true);
  });

  it('does NOT touch URLs whose expiry is still in the future', async () => {
    await Url.create({
      short_code: 'future-expiry',
      long_url: 'https://example.com',
      expires_at: new Date(Date.now() + 3600000), // 1 hour from now
      is_active: true,
    });

    await runExpirationCheck();

    const stillActive = await Url.findOne({ short_code: 'future-expiry' });
    expect(stillActive.is_active).toBe(true);
  });
});