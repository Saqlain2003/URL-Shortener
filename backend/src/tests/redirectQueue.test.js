import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import './setup.js';

vi.mock('../config/redis.js', () => {
  const store = new Map();
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
      expire: vi.fn(async () => 1),
      ttl: vi.fn(async () => -1),
      isReady: true,
    },
  };
});

// mock the queue entirely — we're testing that the controller enqueues correctly,
// not testing BullMQ/Redis itself
const addMock = vi.fn().mockResolvedValue({ id: 'job1' });
vi.mock('../queues/analytics.queue.js', () => ({
  analyticsQueue: { add: addMock },
}));

const { default: app } = await import('../app.js');

describe('Redirect enqueues an analytics job', () => {
  it('calls analyticsQueue.add with the correct job data on a successful redirect', async () => {
    const createRes = await request(app)
      .post('/shorten')
      .send({ longUrl: 'https://example.com', customAlias: 'queue-test' });

    await request(app)
      .get(`/${createRes.body.shortCode}`)
      .set('Referer', 'https://twitter.com');

    expect(addMock).toHaveBeenCalledWith(
      'record-click',
      expect.objectContaining({
        shortCode: 'queue-test',
        referrer: 'https://twitter.com',
      })
    );
  });

  it('does NOT enqueue a job when the short code does not exist', async () => {
    addMock.mockClear();
    await request(app).get('/nonexistent-code-xyz');
    expect(addMock).not.toHaveBeenCalled();
  });
});