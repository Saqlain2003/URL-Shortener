import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Account created, returns a JWT
 *       400:
 *         description: Invalid email/password
 *       409:
 *         description: Email already registered
 */
router.post('/signup', signup);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in to an existing account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns a JWT
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

export default router;