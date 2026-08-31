import mongoose from 'mongoose';
import logger from './logger.js';
import Sentry from './sentry.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    Sentry.captureException(error, { extra: { MONGO_URI: process.env.MONGO_URI } });
    process.exit(1); // fail fast — no point running the app without a DB
  }
};

export default connectDB;