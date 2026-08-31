import { describe, it, expect } from 'vitest';
import './setup.js';
import { processClickJob } from '../services/clickProcessor.service.js';
import ClickEvent from '../models/ClickEvent.js';

describe('processClickJob', () => {
  it('creates a ClickEvent with the correct short_code and defaults', async () => {
    await processClickJob({
      shortCode: 'worker-test',
      referrer: null,
      userAgent: 'test-agent',
      ip: '127.0.0.1',
    });

    const event = await ClickEvent.findOne({ short_code: 'worker-test' });
    expect(event).not.toBeNull();
    expect(event.referrer).toBe('direct'); // null referrer defaults correctly
    expect(event.user_agent).toBe('test-agent');
  });
});