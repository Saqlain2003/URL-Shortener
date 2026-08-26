import { createShortUrl,
         getOriginalUrl,
         updateUrl,
         deactivateUrl,
         getUserUrls,
         generateQrCode,
         generateQrCodeBuffer } from '../services/url.service.js';
import { recordClick, getAnalytics } from '../services/analytics.service.js';
import { isValidUrl, isValidAlias } from '../utils/validators.js';
import Sentry from '../config/sentry.js';

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

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    req.log.debug({ shortCode, fromCache: url.fromCache }, 'Redirect served');

     // fire-and-forget: NOT awaited, redirect happens immediately.
    // This runs in the background after the response has already been sent.
    recordClick({
      shortCode,
      referrer: req.get('referer'),
      userAgent: req.get('user-agent'),
      ip: req.ip,
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
    if (!urlExists) {
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
    if (!urlExists) {
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