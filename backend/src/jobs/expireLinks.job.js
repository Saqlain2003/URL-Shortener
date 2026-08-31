import cron from 'node-cron';
import Url from '../models/Url.js';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';
import Sentry from '../config/sentry.js';

const CACHE_PREFIX = 'shorturl:';

// the actual logic, now directly testable without waiting for a real schedule
export const runExpirationCheck = async () => {
  const expiredUrls = await Url.find({
    expires_at: { $lte: new Date() },
    is_active: true,
  });

  for (const url of expiredUrls) {
    url.is_active = false;
    await url.save();
    await redisClient.del(CACHE_PREFIX + url.short_code);
  }

  return expiredUrls.length;
};

export const startExpirationJob = () => {
  // runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const count = await runExpirationCheck();
      if (count > 0) logger.info({ count }, 'Expired links deactivated'); 
    } catch (error) {
      logger.error({ err: error }, 'Expiration job failed');
      Sentry.captureException(error, { extra: { job: 'expireLinks' } });
    }
  });

  logger.info('Link expiration cron job scheduled (every 5 min)');
};