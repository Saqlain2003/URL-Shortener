import express from 'express';
import urlRoutes from './routes/url.routes.js';

const app = express();

app.use(express.json()); // parse JSON request bodies
app.use('/', urlRoutes); // GET /:shortCode needs root-level, not /api prefix

app.get('/health', (req, res) => {              //sanity-check the server is actually running before you build anything else on top of it.                                      
  res.status(200).json({ status: 'ok' });
});

export default app;