import { Worker } from 'bullmq';
import connection from '../queues/connection.js';
import logger from '../config/logger.js';
import Sentry from '../config/sentry.js';
import { processClickJob } from '../services/clickProcessor.service.js';

const worker = new Worker(
  'analytics',
  async (job) => processClickJob(job.data),
  { connection, concurrency: 5 }
);

worker.on('completed', (job) => {
  logger.debug({ jobId: job.id, shortCode: job.data.shortCode }, 'Click event recorded');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err, shortCode: job?.data?.shortCode }, 'Click event job failed');
  Sentry.captureException(err, { extra: { jobId: job?.id, shortCode: job?.data?.shortCode } });
});

export default worker;