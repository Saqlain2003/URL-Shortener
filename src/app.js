import express from 'express';
import urlRoutes from './routes/url.routes.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

app.set('trust proxy', true); // needed for req.ip to reflect the real client IP behind proxies
app.use(express.json()); // parse JSON request bodies
app.use('/', healthRoutes); // health check endpoints

// app.get('/health', (req, res) => {              //sanity-check the server is actually running before you build anything else on top of it.                                      
//   res.status(200).json({ status: 'ok' });
// });

app.use('/api/auth', authRoutes);
app.use('/', urlRoutes); // GET /:shortCode needs root-level, not /api prefix

export default app; 