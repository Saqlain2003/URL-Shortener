import { verifyToken } from '../utils/auth.js';
import Sentry from '../config/sentry.js';

// REQUIRED auth — blocks the request if no valid token
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // no token — proceed as anonymous
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
  } catch (error) {
    // invalid token on an optional route — just proceed as anonymous rather than blocking
  }

  next();
};