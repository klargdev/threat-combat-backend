const express = require("express");
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the event.
 *               description:
 *                 type: string
 *                 description: A description of the event.
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time of the event.
 *               location:
 *                 type: string
 *                 description: The location of the event.
 *     responses:
 *       201:
 *         description: Event created successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/", authMiddleware, createEvent);

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Retrieve all events
 *     description: Get a list of all events.
 *     responses:
 *       200:
 *         description: A list of events.
 *       500:
 *         description: Server error.
 */
router.get("/", getEvents);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Retrieve an event by ID
 *     description: Get event details by event ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID.
 *     responses:
 *       200:
 *         description: Event details retrieved successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.get("/:id", getEventById);

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     description: Update event details by event ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id", authMiddleware, updateEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     description: Delete an event by event ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID.
 *     responses:
 *       200:
 *         description: Event deleted successfully.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;
