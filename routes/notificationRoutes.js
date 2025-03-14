const express = require("express");
const { sendNotification, getNotifications, markAsRead } = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/notifications:
 *   post:
 *     summary: Send a notification
 *     description: Create and send a notification to a specific user. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - message
 *             properties:
 *               user:
 *                 type: string
 *                 description: The ID of the user to receive the notification.
 *               message:
 *                 type: string
 *                 description: The notification message.
 *     responses:
 *       201:
 *         description: Notification sent successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/", authMiddleware, sendNotification);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Retrieve notifications
 *     description: Get a list of notifications for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of notifications.
 *       500:
 *         description: Server error.
 */
router.get("/", authMiddleware, getNotifications);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID.
 *     responses:
 *       200:
 *         description: Notification marked as read successfully.
 *       404:
 *         description: Notification not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id/read", authMiddleware, markAsRead);

module.exports = router;
