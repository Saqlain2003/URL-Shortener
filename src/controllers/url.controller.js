import { createShortUrl,
         getOriginalUrl,
         updateUrl,
         deactivateUrl } from '../services/url.service.js';
import { recordClick, getAnalytics } from '../services/analytics.service.js';
import { isValidUrl, isValidAlias } from '../utils/validators.js';

export const shortenUrl = async (req, res) => {
  try {
    const { longUrl, customAlias } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl is required' });
    }

    if (!isValidUrl(longUrl)) {
      return res.status(400).json({ error: 'longUrl must be a valid http/https URL' });
    }

    if (customAlias && !isValidAlias(customAlias)) {
      return res.status(400).json({
        error: 'customAlias must be 3-20 characters, letters/numbers/hyphens/underscores only',
      });
    }

    const url = await createShortUrl(longUrl, customAlias);
    res.status(201).json({ shortCode: url.short_code, longUrl: url.long_url });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Short code already exists' });
    }
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};