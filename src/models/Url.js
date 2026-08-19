import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  short_code: {
    type: String,
    required: true,
    unique: true,
    index: true, // explicit index for fast lookups on redirect path
  },
  long_url: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous link
    index: true, // needed for "my links" dashboard queries later
  },
  custom_alias: {
    type: Boolean,
    default: false,
  },
  expires_at: {
    type: Date,
    default: null,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  click_count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  // this auto-manages created_at/updated_at instead of you handling it manually
});

export default mongoose.model('Url', urlSchema);
