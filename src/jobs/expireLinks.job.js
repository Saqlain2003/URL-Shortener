import cron from 'node-cron';
import Url from '../models/Url.js';
import redisClient from '../config/redis.js';

const CACHE_PREFIX = 'shorturl:';

export const startExpirationJob = () => {
  // runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expiredUrls = await Url.find({
        expires_at: { $lte: new Date() },
        is_active: true,
      });

      if (expiredUrls.length === 0) return;

      for (const url of expiredUrls) {
        url.is_active = false;
        await url.save();
        await redisClient.del(CACHE_PREFIX + url.short_code);
      }

      console.log(`Expired ${expiredUrls.length} link(s)`);
    } catch (error) {
      console.error('Expiration job failed:', error.message);
    }
  });

  console.log('Link expiration cron job scheduled (every 5 min)');
};