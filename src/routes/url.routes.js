import { Router } from 'express';
import {
  shortenUrl,
  redirectUrl,
  deleteUrl,
  editUrl,
  getUrlAnalytics,
  getMyUrls
} from '../controllers/url.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/shorten', rateLimiter, optionalAuth, shortenUrl);
router.get('/api/urls/my', protect, getMyUrls);
router.delete('/urls/:shortCode', deleteUrl);
router.put('/urls/:shortCode', editUrl);
router.get('/api/analytics/:shortCode', getUrlAnalytics); // must stay ABOVE the catch-all below
router.get('/:shortCode', rateLimiter, redirectUrl); // catch-all param route — must stay LAST
 
export default router;