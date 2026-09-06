import { Worker } from 'bullmq';
import connection from '../queues/connection.js';
import logger from '../config/logger.js';
import Sentry from '../config/sentry.js';
import redisClient from '../config/redis.js';
import { processClickJob } from '../services/clickProcessor.service.js';

const worker = new Worker(
  'analytics',
  async (job) => processClickJob(job.data),
  { connection, concurrency: 5 }
);

worker.on('completed', (job, result) => {
  logger.debug({ jobId: job.id, shortCode: job.data.shortCode }, 'Click event recorded');
  
  // Publish an event to the Redis channel for SSE updates
  if (job.data && job.data.shortCode) {
    redisClient.publish(`analytics:${job.data.shortCode}`, JSON.stringify({
      type: 'click_recorded',
      shortCode: job.data.shortCode
    })).catch(err => {
      logger.error({ err }, 'Failed to publish analytics event to Redis');
    });

    if (result && result.user_id) {
      redisClient.publish(`dashboard:${result.user_id}`, JSON.stringify({
        type: 'dashboard_update'
      })).catch(err => {
        logger.error({ err }, 'Failed to publish dashboard event to Redis');
      });
    }
  }
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err, shortCode: job?.data?.shortCode }, 'Click event job failed');
  Sentry.captureException(err, { extra: { jobId: job?.id, shortCode: job?.data?.shortCode } });
});

export default worker;