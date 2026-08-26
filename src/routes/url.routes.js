import { Router } from 'express';
import {
  shortenUrl,
  redirectUrl,
  deleteUrl,
  editUrl,
  getUrlAnalytics,
  getMyUrls,
  getQrCode,
  downloadQrCode
} from '../controllers/url.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/shorten', rateLimiter, optionalAuth, shortenUrl);
router.get('/api/urls/my', protect, getMyUrls);
router.get('/api/qr/:shortCode', getQrCode);
router.get('/api/qr/:shortCode/download', downloadQrCode);
router.delete('/urls/:shortCode', deleteUrl);
router.put('/urls/:shortCode', editUrl);
router.get('/api/analytics/:shortCode', getUrlAnalytics); // must stay ABOVE the catch-all below

// TEMPORARY — remove after confirming Sentry works
// router.get('/debug-sentry', () => {
//   throw new Error('Test error for Sentry verification');
// });

router.get('/:shortCode', rateLimiter, redirectUrl); // catch-all param route — must stay LAST
 
export default router;