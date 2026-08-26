import express from 'express';
//import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import logger from './config/logger.js';
import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import helmet from 'helmet';

const app = express();

app.set('trust proxy', true); // needed for req.ip to reflect the real client IP behind proxies
app.use(helmet()); // add security headers to all responses

// enforce HTTPS in production — trust the X-Forwarded-Proto header set by Nginx/load balancers
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});

//app.use(cors()); // enable CORS for all routes
app.use(express.json()); // parse JSON request bodies

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // don't log every health check — they'd flood your logs with noise every few seconds
    autoLogging: {
      ignore: (req) => req.url === '/health/live',
    },
  })
);

app.use('/', healthRoutes); // health check endpoints

// app.get('/health', (req, res) => {              //sanity-check the server is actually running before you build anything else on top of it.                                      
//   res.status(200).json({ status: 'ok' });
// });

app.use('/api/auth', authRoutes);
app.use('/', urlRoutes); // GET /:shortCode needs root-level, not /api prefix

export default app; 