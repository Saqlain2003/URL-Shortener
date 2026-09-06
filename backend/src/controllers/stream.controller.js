import redisClient from '../config/redis.js';
import { EventEmitter } from 'events';
import logger from '../config/logger.js';

const eventEmitter = new EventEmitter();
// Allow many concurrent SSE connections without max listener warnings
eventEmitter.setMaxListeners(0);

let subscriberClient = null;

const initSubscriber = async () => {
  if (!subscriberClient) {
    try {
      subscriberClient = redisClient.duplicate();
      await subscriberClient.connect();
      
      // Subscribe to all analytics channels
      await subscriberClient.pSubscribe('analytics:*', (message, channel) => {
        const shortCode = channel.split(':')[1];
        eventEmitter.emit(`click:${shortCode}`, message);
      });
      // Subscribe to all dashboard channels
      await subscriberClient.pSubscribe('dashboard:*', (message, channel) => {
        const userId = channel.split(':')[1];
        eventEmitter.emit(`dashboard:${userId}`, message);
      });
      logger.info('Redis Pub/Sub subscriber connected for SSE streams');
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Redis subscriber for SSE');
    }
  }
};

export const streamClickEvents = async (req, res) => {
  const { shortCode } = req.params;

  await initSubscriber();

  // Configure SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Flush headers immediately if running behind compression/proxies
  res.flushHeaders();

  // Send an initial connected message so the client knows it's active
  res.write(`data: ${JSON.stringify({ type: 'connected', shortCode })}\n\n`);

  // Listener for incoming Redis pub/sub messages
  const onUpdate = (message) => {
    res.write(`data: ${message}\n\n`);
  };

  // Attach listener to our internal event emitter
  eventEmitter.on(`click:${shortCode}`, onUpdate);

  // Cleanup when client disconnects
  req.on('close', () => {
    eventEmitter.off(`click:${shortCode}`, onUpdate);
  });
};

export const streamDashboardEvents = async (req, res) => {
  const userId = req.user.id;

  await initSubscriber();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  const onUpdate = (message) => {
    res.write(`data: ${message}\n\n`);
  };

  eventEmitter.on(`dashboard:${userId}`, onUpdate);

  req.on('close', () => {
    eventEmitter.off(`dashboard:${userId}`, onUpdate);
  });
};
