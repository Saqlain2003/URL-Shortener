import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Url from '../models/Url.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // explicitly wait for indexes (like the unique index on short_code) to finish building
  // before any test runs — otherwise uniqueness isn't enforced yet and tests race ahead of it
  await Url.init();
  await User.init();
});

afterEach(async () => {
  // clear all collections between tests so one test's data never leaks into another
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});