import { Router } from 'express';
import {
  shortenUrl,
  redirectUrl,
  deleteUrl,
  editUrl,
  getUrlAnalytics,
  getMyUrls,
  getQrCode,
  downloadQrCode,
  getUrlTimeSeries
} from '../controllers/url.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { rateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

/**
 * @openapi
 * /shorten:
 *   post:
 *     summary: Create a short URL
 *     description: Anonymous or authenticated. If a Bearer token is provided, the link is tied to that user's account.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [longUrl]
 *             properties:
 *               longUrl:
 *                 type: string
 *                 example: https://www.wikipedia.org
 *               customAlias:
 *                 type: string
 *                 example: my-link
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-12-31T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Short URL created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortCode:
 *                   type: string
 *                 longUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Invalid longUrl, alias format, or expiresAt
 *       409:
 *         description: Custom alias already exists
 */
router.post('/shorten', rateLimiter, optionalAuth, shortenUrl);

/**
 * @openapi
 * /api/urls/my:
 *   get:
 *     summary: Get all links belonging to the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's URLs
 *       401:
 *         description: Missing or invalid token
 */
router.get('/api/urls/my', protect, getMyUrls);

/**
 * @openapi
 * /api/qr/{shortCode}:
 *   get:
 *     summary: Get a QR code for a short URL as a base64 data URL
 *     tags: [QR Codes]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code as a base64-encoded PNG data URL
 *       404:
 *         description: Short code not found
 */
router.get('/api/qr/:shortCode', getQrCode);
router.get('/api/qr/:shortCode/download', downloadQrCode);

/**
 * @openapi
 * /urls/{shortCode}:
 *   put:
 *     summary: Update the destination URL for an existing short code
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [longUrl]
 *             properties:
 *               longUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: URL updated, cache invalidated
 *       400:
 *         description: Invalid longUrl
 *       404:
 *         description: Short code not found
 *   delete:
 *     summary: Deactivate a short URL (soft delete)
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL deactivated, cache invalidated
 *       404:
 *         description: Short code not found
 */
router.delete('/urls/:shortCode', deleteUrl);
router.put('/urls/:shortCode', editUrl);

/**
 * @openapi
 * /api/analytics/{shortCode}:
 *   get:
 *     summary: Get click analytics for a short URL
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated click data
 *       404:
 *         description: Short code was never created
 */
router.get('/api/analytics/:shortCode', getUrlAnalytics); // must stay ABOVE the catch-all below

// TEMPORARY — remove after confirming Sentry works
// router.get('/debug-sentry', () => {
//   throw new Error('Test error for Sentry verification');
// });

/**
 * @openapi
 * /api/analytics/{shortCode}/timeseries:
 *   get:
 *     summary: Get daily click counts over a time range
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           default: 7
 *           maximum: 90
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Array of { date, count } objects, one per day, gaps filled with zero
 *       404:
 *         description: Short code was never created
 */
router.get('/api/analytics/:shortCode/timeseries', getUrlTimeSeries);

/**
 * @openapi
 * /{shortCode}:
 *   get:
 *     summary: Redirect to the original long URL
 *     description: >
 *       Checks Redis cache first, falls back to MongoDB on a cache miss.
 *       Note: "Try it out" in this UI may show a fetch/CORS error because
 *       browsers block reading cross-origin redirect targets — this is a
 *       browser limitation, not an API error. Test this endpoint by pasting
 *       the URL directly into a browser tab, or via curl/Postman.
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to the original URL
 *       404:
 *         description: Short URL not found, deactivated, or expired
 */
router.get('/:shortCode', rateLimiter, redirectUrl); // catch-all param route — must stay LAST
 
export default router;