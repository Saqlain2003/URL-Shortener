import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import logger from './config/logger.js';
import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import helmet from 'helmet';
import Sentry from './config/sentry.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

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

app.use(cors()); // enable CORS for all routes
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
}); 

app.use('/', healthRoutes); // health check endpoints

// app.get('/health', (req, res) => {              //sanity-check the server is actually running before you build anything else on top of it.                                      
//   res.status(200).json({ status: 'ok' });
// });

app.use('/api/auth', authRoutes);
app.use('/', urlRoutes); // GET /:shortCode needs root-level, not /api prefix

// Sentry must be registered AFTER routes, so it can catch errors those routes throw
Sentry.setupExpressErrorHandler(app);
// your own fallback error handler, AFTER Sentry's
app.use((err, req, res, next) => {
  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

export default app; 