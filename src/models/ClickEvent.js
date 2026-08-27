import mongoose from 'mongoose';

const clickEventSchema = new mongoose.Schema({
  short_code: {
    type: String,
    required: true,
    index: true, // every analytics query filters by this
  },
  referrer: {
    type: String,
    default: 'direct',
  },
  user_agent: {
    type: String,
    default: 'unknown',
  },
  ip_address: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: 'unknown',
  },
  city: {
    type: String,
    default: 'unknown',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// compound index — supports queries that filter by short_code AND range over timestamp together,
// which is exactly what every time-series query below does
clickEventSchema.index({ short_code: 1, timestamp: 1 });

const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);

export default ClickEvent;