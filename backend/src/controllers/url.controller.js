import { createShortUrl,
         getOriginalUrl,
         updateUrl,
         deactivateUrl,
         getUserUrls,
         generateQrCode,
         generateQrCodeBuffer } from '../services/url.service.js';

import { getAnalytics, 
         getTimeSeriesAnalytics } from '../services/analytics.service.js';

import { isValidUrl, isValidAlias } from '../utils/validators.js';
import Sentry from '../config/sentry.js';
import Url from '../models/Url.js';
import User from '../models/User.js';
import ClickEvent from '../models/ClickEvent.js';
import { analyticsQueue } from '../queues/analytics.queue.js';

export const shortenUrl = async (req, res) => {
  try {
    const { longUrl, customAlias, expiresAt } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl is required' });
    }

    if (!isValidUrl(longUrl)) {
      req.log.warn({ longUrl }, 'Rejected invalid URL');
      return res.status(400).json({ error: 'longUrl must be a valid http/https URL' });
    }

    if (customAlias && !isValidAlias(customAlias)) {
      return res.status(400).json({
        error: 'customAlias must be 3-20 characters, letters/numbers/hyphens/underscores only',
      });
    }

    let parsedExpiry = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return res.status(400).json({ error: 'expiresAt must be a valid future date' });
      }
    }
     const userId = req.user?.id || null; // populated by optionalAuth if token present

    const url = await createShortUrl(longUrl, customAlias, userId, parsedExpiry);

    req.log.info({ shortCode: url.short_code, userId }, 'Short URL created');

    res.status(201).json({ 
      shortCode: url.short_code, 
      longUrl: url.long_url,
      expiresAt: url.expires_at,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Short code already exists' });
    }
    req.log.error({ err: error }, 'Failed to create short URL');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyUrls = async (req, res) => {
  try {
    const urls = await getUserUrls(req.user.id);
    res.status(200).json({ urls });
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch user URLs');
    Sentry.captureException(error, { extra: { userId: req.user.id } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await getOriginalUrl(shortCode);

    const isBrowser = Boolean(req.headers['accept']?.includes('text/html') && !req.xhr);
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!url) {
      if (isBrowser) {
        return res.redirect(`${frontendBase}/not-found?type=404&code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(404).json({ error: 'URL not found' });
    }

    if (url.expired) {
      if (isBrowser) {
        const query = new URLSearchParams({
          type: 'expired',
          code: shortCode,
          ...(url.expiresAt ? { expiresAt: new Date(url.expiresAt).toISOString() } : {})
        });
        return res.redirect(`${frontendBase}/not-found?${query.toString()}`);
      }
      return res.status(410).json({ error: 'URL has expired', expiresAt: url.expiresAt });
    }

    req.log.debug({ shortCode, fromCache: url.fromCache }, 'Redirect served');

     // fire-and-forget: NOT awaited, redirect happens immediately.
    // This runs in the background after the response has already been sent.
    // recordClick({
    //   shortCode,
    //   referrer: req.get('referer'),
    //   userAgent: req.get('user-agent'),
    //   ip: req.ip,
    // });

    // enqueue instead of calling recordClick directly —
    // this write to Redis is fast and durable, unlike an in-process async function call
    analyticsQueue.add('record-click', {
      shortCode,
      referrer: req.get('referer'),
      userAgent: req.get('user-agent'),
      ip: req.ip,
    }).catch((err) => {
      // even enqueueing itself could theoretically fail (e.g., Redis briefly down) —
      // this must never break the redirect, so we only log it
      req.log.error({ err, shortCode }, 'Failed to enqueue analytics job');
      Sentry.captureException(err, { extra: { shortCode } });
    });

    res.redirect(url.long_url);
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Redirect failed');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUrlAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const analytics = await getAnalytics(shortCode);
    
    if (!analytics) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    res.status(200).json(analytics); 
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to fetch URL analytics');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUrlTimeSeries = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const days = Math.min(parseInt(req.query.days) || 7, 90); // cap at 90 to prevent abuse

    const urlExists = await Url.exists({ short_code: shortCode });
    if (!urlExists) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const timeSeries = await getTimeSeriesAnalytics(shortCode, days);
    res.status(200).json({ shortCode, days, timeSeries });
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to fetch time-series analytics');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUrlClickLogs = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search ? String(req.query.search).trim() : '';

    const urlExists = await Url.exists({ short_code: shortCode });
    if (!urlExists) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const filter = { short_code: shortCode };
    if (search) {
      filter.$or = [
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { referrer: { $regex: search, $options: 'i' } },
      ];
    }

    const [clicks, total] = await Promise.all([
      ClickEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('referrer country city user_agent timestamp -_id'),
      ClickEvent.countDocuments(filter),
    ]);

    res.status(200).json({
      shortCode,
      clicks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to fetch click logs');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const url = await deactivateUrl(shortCode);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.status(200).json({ message: 'URL deactivated' });
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to deactivate URL');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const editUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { longUrl } = req.body;

    if (!longUrl || !isValidUrl(longUrl)) {
      return res.status(400).json({ error: 'A valid longUrl is required' });
    }

    const url = await updateUrl(shortCode, longUrl);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.status(200).json({ shortCode: url.short_code, longUrl: url.long_url });
  } catch (error) { 
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to edit URL');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQrCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // confirm the short URL actually exists before generating a QR for it
    const urlExists = await getOriginalUrl(shortCode);
    if (!urlExists || urlExists.expired) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const qrCode = await generateQrCode(shortCode);
    res.status(200).json({ shortCode, qrCode });
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to generate QR code');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadQrCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlExists = await getOriginalUrl(shortCode);
    if (!urlExists || urlExists.expired) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const buffer = await generateQrCodeBuffer(shortCode);

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="${shortCode}-qr.png"`);
    res.send(buffer);
  } catch (error) {
    req.log.error({ err: error, shortCode: req.params.shortCode }, 'Failed to download QR code');
    Sentry.captureException(error, { extra: { shortCode: req.params.shortCode } });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const totalLinks = await Url.countDocuments();
    const clicksAggr = await Url.aggregate([{ $group: { _id: null, total: { $sum: '$click_count' } } }]);
    const totalClicks = clicksAggr[0]?.total || 0;
    const activeUsers = await User.countDocuments();
    
    // Fetch top 3 most clicked URLs
    const topLinks = await Url.find({ click_count: { $gt: 0 } })
                              .sort({ click_count: -1 })
                              .limit(3)
                              .select('short_code long_url click_count -_id');

    res.status(200).json({ totalLinks, totalClicks, activeUsers, topLinks });
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch global stats');
    Sentry.captureException(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};