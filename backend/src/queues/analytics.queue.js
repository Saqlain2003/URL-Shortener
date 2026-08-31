import { Queue } from 'bullmq';
import connection from './connection.js';

export const analyticsQueue = new Queue('analytics', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});