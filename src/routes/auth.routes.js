import { Router } from 'express'
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js'
import { registerValidator, loginValidator, refreshValidator } from '../validators/auth.validator.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — register, login, token refresh, logout
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, name]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: ivan_petrenko
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Іван
 *     responses:
 *       201:
 *         description: Registered successfully — returns user + token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username already taken
 */
router.post('/register', registerValidator, register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: ivan_petrenko
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful — returns user + token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidator, login)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     description: |
 *       Accepts refresh token from **HttpOnly cookie** OR from request body.
 *       Implements token rotation — old refresh token is invalidated, new pair is issued.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional if sent via cookie
 *     responses:
 *       200:
 *         description: New token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post('/refresh', refreshValidator, refresh)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out — invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticate, logout)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data (without password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, me)

export default router