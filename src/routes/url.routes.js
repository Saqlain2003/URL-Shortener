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

const router = Router();

router.post('/shorten', optionalAuth, shortenUrl);
router.get('/api/urls/my', protect, getMyUrls);
router.delete('/urls/:shortCode', deleteUrl);
router.put('/urls/:shortCode', editUrl);
router.get('/api/analytics/:shortCode', getUrlAnalytics); // must stay ABOVE the catch-all below
router.get('/:shortCode', redirectUrl); // catch-all param route — must stay LAST
 
export default router;