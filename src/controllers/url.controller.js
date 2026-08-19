import { createShortUrl, getOriginalUrl } from '../services/url.service.js';

export const shortenUrl = async (req, res) => {
  try {
    const { longUrl, customAlias } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl is required' });
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

    res.redirect(url.long_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};