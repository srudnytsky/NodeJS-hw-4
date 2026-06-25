import { Router } from 'express'
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller.js'
import {
  getAnnouncementsValidator,
  idParamValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
} from '../validators/announcements.validator.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Announcement board — public reads, authenticated writes
 */

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get paginated list of announcements
 *     tags: [Announcements]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive title substring search
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest] }
 *         description: Sort order (default newest)
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Page number (10 items per page)
 *     responses:
 *       200:
 *         description: Paginated list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', getAnnouncementsValidator, getAnnouncements)

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get a single announcement by ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Announcement object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Not found
 */
router.get('/:id', idParamValidator, getAnnouncementById)

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/', authenticate, createAnnouncementValidator, createAnnouncement)

/**
 * @swagger
 * /announcements/{id}:
 *   patch:
 *     summary: Partially update own announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementPatch'
 *     responses:
 *       200:
 *         description: Updated announcement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied — not your announcement
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, updateAnnouncementValidator, updateAnnouncement)

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete own announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deleted (no content)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied — not your announcement
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, idParamValidator, deleteAnnouncement)

export default router