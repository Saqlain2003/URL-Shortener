import { verifyToken } from '../utils/auth.js';
import Sentry from '../config/sentry.js';

// REQUIRED auth — blocks the request if no valid token
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token; // for EventSource/SSE
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    Sentry.captureException(error, { extra: { token } });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// OPTIONAL auth — attaches req.user if a valid token exists, but doesn't block the request otherwise
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(); // no token — proceed as anonymous
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
  } catch (error) {
    // invalid token on an optional route — just proceed as anonymous rather than blocking
  }

  next();
};