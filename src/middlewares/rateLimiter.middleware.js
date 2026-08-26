import redisClient from '../config/redis.js';
import Sentry from '../config/sentry.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 20; // 20 requests per minute per IP

export const rateLimiter = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.ip; // prefer user ID if logged in, else IP
    const key = `ratelimit:${identifier}`;

    const currentCount = await redisClient.incr(key);

    if (currentCount === 1) {
      // first request in this window — set the expiry
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (currentCount > MAX_REQUESTS) {
      const ttl = await redisClient.ttl(key);
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfterSeconds: ttl,
      });
    }

    next();
  } catch (error) {
    req.log.error({ err: error }, 'Rate limiter error');
    Sentry.captureException(error, { extra: { ip: req.ip } });
    next(); // fail open — don't block traffic if Redis itself has an issue
  }
};