import { Router } from 'express';
import {
  shortenUrl,
  redirectUrl,
  deleteUrl,
  editUrl,
  getUrlAnalytics,
} from '../controllers/url.controller.js';

const router = Router();

router.post('/shorten', shortenUrl);
router.delete('/urls/:shortCode', deleteUrl);
router.put('/urls/:shortCode', editUrl);
router.get('/api/analytics/:shortCode', getUrlAnalytics); // must stay ABOVE the catch-all below
router.get('/:shortCode', redirectUrl); // catch-all param route — must stay LAST
 
export default router;