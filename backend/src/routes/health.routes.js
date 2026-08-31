import { Router } from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis.js';

const router = Router();

// Liveness: is the process running at all? No dependency checks.
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', port: process.env.PORT});
});

// Readiness: are dependencies (DB, cache) actually reachable right now?
router.get('/health/ready', async (req, res) => {
  const checks = {
    mongo: mongoose.connection.readyState === 1,
    redis: redisClient.isReady,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not ready',
    checks,
  });
});

export default router;