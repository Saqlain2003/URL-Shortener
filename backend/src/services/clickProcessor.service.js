import geoip from 'geoip-lite';
import ClickEvent from '../models/ClickEvent.js';
import Url from '../models/Url.js';

export const processClickJob = async ({ shortCode, referrer, userAgent, ip }) => {
  const geo = geoip.lookup(ip) || {};

  await Promise.all([
    ClickEvent.create({
      short_code: shortCode,
      referrer: referrer || 'direct',
      user_agent: userAgent || 'unknown',
      ip_address: ip || null,
      country: geo.country || 'unknown',
      city: geo.city || 'unknown',
    }),
    Url.updateOne(
      { short_code: shortCode },
      { $inc: { click_count: 1 } }
    ),
  ]);
};