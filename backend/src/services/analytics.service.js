import ClickEvent from '../models/ClickEvent.js';
import Url from '../models/Url.js';

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

  const clicksByCityRaw = await ClickEvent.aggregate([
    { $match: { short_code: shortCode } },
    { $group: { _id: { country: '$country', city: '$city' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const clicksByCity = clicksByCityRaw.map((item) => ({
    country: item._id?.country || 'unknown',
    city: item._id?.city || 'unknown',
    count: item.count,
  }));

  const recentClicks = await ClickEvent.find({ short_code: shortCode })
    .sort({ timestamp: -1 })
    .limit(100)
    .select('referrer country city user_agent timestamp -_id');

  return {
    shortCode,
    totalClicks,
    clicksByCountry,
    clicksByCity,
    clicksByReferrer,
    recentClicks,
  };
};

export const getTimeSeriesAnalytics = async (shortCode, days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0); // start of that day, for clean bucket boundaries

  const results = await ClickEvent.aggregate([
    {
      $match: {
        short_code: shortCode,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: { date: '$timestamp', unit: 'day' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
        count: 1,
      },
    },
  ]);

  // fill in zero-click days — otherwise a chart would silently skip days with no activity,
  // which looks like missing data rather than genuinely zero clicks
  const filled = [];
  const resultMap = new Map(results.map((r) => [r.date, r.count]));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    filled.push({ date: dateStr, count: resultMap.get(dateStr) || 0 });
  }

  return filled;
};