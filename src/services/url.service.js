import Url from '../models/Url.js';
import { customAlphabet } from 'nanoid';

// temporary generator — Day 2 replaces this with Redis counter + Base62
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

export const createShortUrl = async (longUrl, customAlias = null) => {
  const shortCode = customAlias || nanoid();

  const url = await Url.create({
    short_code: shortCode,
    long_url: longUrl,
    custom_alias: !!customAlias,
  });

  return url;
};

export const getOriginalUrl = async (shortCode) => {
  const url = await Url.findOne({ short_code: shortCode, is_active: true });
  return url;
};