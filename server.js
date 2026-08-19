import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // wait for DB connection before accepting requests

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();      //startServer() explicitly awaits connectDB() before calling app.listen() — this is deliberate, not just style. If your server starts listening before Mongo connects and a request hits /api/shorten in that window, you'd get a confusing "buffering timed out" error from Mongoose instead of a clean failure. Waiting avoids that entirely.