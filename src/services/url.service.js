import Url from '../models/Url.js';
import redisClient from '../config/redis.js';
import { encodeBase62 } from '../utils/base62.js';
import QRCode from 'qrcode';
import logger from '../config/logger.js';
// import { customAlphabet } from 'nanoid';        No need for nanoid anymore since we are using Redis counter + Base62 for unique short codes

// temporary generator — Day 2 replaces this with Redis counter + Base62
// const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

const COUNTER_KEY = 'url:counter';
const CACHE_TTL_SECONDS = 3600; // 1 hour
const NEGATIVE_CACHE_TTL_SECONDS = 60; // short — don't hide a newly-created code for long
const CACHE_PREFIX = 'shorturl:';
const NULL_SENTINEL = '__NULL__'; // marks "we already checked, this doesn't exist"

const generateShortCode = async () => {
  const nextId = await redisClient.incr(COUNTER_KEY); // atomic increment
  return encodeBase62(nextId);
};

export const createShortUrl = async (longUrl, customAlias = null, userId = null, expiresAt = null) => {
  const shortCode = customAlias || await generateShortCode();

  const url = await Url.create({
    short_code: shortCode,
    long_url: longUrl,
    custom_alias: !!customAlias,
    user_id: userId,
    expires_at: expiresAt,
  });

   // if this code was previously cached as "not found", clear that now that it exists
  await redisClient.del(CACHE_PREFIX + shortCode);

  return url;
};

export const getUserUrls = async (userId) => {
  return Url.find({ user_id: userId, is_active: true }).sort({ created_at: -1 });
};

export const getOriginalUrl = async (shortCode) => {
  const cacheKey = CACHE_PREFIX + shortCode;

  // 1. Check Redis first
  const cachedUrl = await redisClient.get(cacheKey);

  if (cachedUrl === NULL_SENTINEL) {
    return null; // we already confirmed this doesn't exist — skip Mongo entirely
  }

  if (cachedUrl) {
    return { long_url: cachedUrl, fromCache: true };
  }

  // 2. Cache miss - query MongoDB
  const url = await Url.findOne({ short_code: shortCode, is_active: true });

  if(!url) {
    logger.debug('SETTING NEGATIVE CACHE FOR:', shortCode);
    // negative cache — protects against repeated lookups for a code that doesn't exist
    await redisClient.setEx(cacheKey, NEGATIVE_CACHE_TTL_SECONDS, NULL_SENTINEL);
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

export const generateQrCode = async (shortCode) => {
  const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

  const qrDataUrl = await QRCode.toDataURL(shortUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });

  return qrDataUrl;
};

export const generateQrCodeBuffer = async (shortCode) => {
  const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
  const buffer = await QRCode.toBuffer(shortUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });
  return buffer;
};