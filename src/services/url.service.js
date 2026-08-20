import Url from '../models/Url.js';
import redisClient from '../config/redis.js';
import { encodeBase62 } from '../utils/base62.js';
// import { customAlphabet } from 'nanoid';        No need for nanoid anymore since we are using Redis counter + Base62 for unique short codes

// temporary generator — Day 2 replaces this with Redis counter + Base62
// const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

const COUNTER_KEY = 'url:counter';
const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_PREFIX = 'shorturl:';

const generateShortCode = async () => {
  const nextId = await redisClient.incr(COUNTER_KEY); // atomic increment
  return encodeBase62(nextId);
};

export const createShortUrl = async (longUrl, customAlias = null) => {
  const shortCode = customAlias || await generateShortCode();

  const url = await Url.create({
    short_code: shortCode,
    long_url: longUrl,
    custom_alias: !!customAlias,
  });

  return url;
};

export const getOriginalUrl = async (shortCode) => {
  const cacheKey = CACHE_PREFIX + shortCode;

  // 1. Check Redis first
  const cachedUrl = await redisClient.get(cacheKey);
  if (cachedUrl) {
    return { long_url: cachedUrl, fromCache: true };
  }

  // 2. Cache miss - query MongoDB
  const url = await Url.findOne({ short_code: shortCode, is_active: true });
  if(!url) {
    return null;
  }

    // 3. Populate cache for next time
  await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, url.long_url);

  return { long_url: url.long_url, fromCache: false };
};

export const deactivateUrl = async (shortCode) => {
  const url = await Url.findOneAndUpdate(
    { short_code: shortCode },
    { is_active: false },
    { new: true }
  );

  if (url) {
    // invalidate cache — otherwise a deactivated link keeps redirecting from cache
    await redisClient.del(CACHE_PREFIX + shortCode);
  }

  return url;
};

export const updateUrl = async (shortCode, newLongUrl) => {
  const url = await Url.findOneAndUpdate(
    { short_code: shortCode, is_active: true },
    { long_url: newLongUrl },
    { new: true }
  );

  if (url) {
    // invalidate stale cache entry so next read fetches the updated value
    await redisClient.del(CACHE_PREFIX + shortCode);
  }

  return url;
};