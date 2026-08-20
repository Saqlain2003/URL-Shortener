import { createClient } from 'redis';

const redisClient = createClient({
  RESP: 2, // Use RESP2 protocol for compatibility with older Redis versions
  url: process.env.REDIS_URL, // e.g. redis://localhost:6379
});

redisClient.on('error', (err) => console.error('Redis connection error:', err));
redisClient.on('connect', () => console.log('Redis connected'));

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;