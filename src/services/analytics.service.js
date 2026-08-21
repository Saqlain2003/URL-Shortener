import geoip from 'geoip-lite';
import ClickEvent from '../models/ClickEvent.js';
import Url from '../models/Url.js';

export const recordClick = async ({ shortCode, referrer, userAgent, ip }) => {
  try {
    const geo = geoip.lookup(ip) || {};

    await ClickEvent.create({
      short_code: shortCode,
      referrer: referrer || 'direct',
      user_agent: userAgent || 'unknown',
      ip_address: ip || null,
      country: geo.country || 'unknown',
      city: geo.city || 'unknown',
    });
  } catch (error) {
    // deliberately swallow errors here — analytics failing should NEVER
    // affect the user-facing redirect, which has already completed by the time this runs
    console.error('Failed to record click event:', error.message);
  }
};

export const getAnalytics = async (shortCode) => {
  const urlExists = await Url.exists({ short_code: shortCode });

  if (!urlExists) {
    return null; // signal to controller: this short code was never created
  }

  const totalClicks = await ClickEvent.countDocuments({ short_code: shortCode });

  const clicksByCountry = await ClickEvent.aggregate([
    { $match: { short_code: shortCode } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const clicksByReferrer = await ClickEvent.aggregate([
    { $match: { short_code: shortCode } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const recentClicks = await ClickEvent.find({ short_code: shortCode })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('referrer country city timestamp -_id');

  return {
    shortCode,
    totalClicks,
    clicksByCountry,
    clicksByReferrer,
    recentClicks,
  };
};