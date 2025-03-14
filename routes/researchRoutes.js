const express = require("express");
const { createResearch, getResearches, getResearchById, updateResearch, deleteResearch } = require("../controllers/researchController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/research:
 *   post:
 *     summary: Create a new research entry
 *     description: Create a new research entry. Authentication required.
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
 *               - abstract
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the research.
 *               abstract:
 *                 type: string
 *                 description: A summary of the research.
 *               authors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of author IDs.
 *               publishedDate:
 *                 type: string
 *                 format: date-time
 *                 description: The publication date of the research.
 *               content:
 *                 type: string
 *                 description: Detailed content of the research.
 *               references:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of references.
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 description: The current status of the research.
 *     responses:
 *       201:
 *         description: Research created successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/", authMiddleware, createResearch);

/**
 * @openapi
 * /api/research:
 *   get:
 *     summary: Retrieve all research entries
 *     description: Get a list of all research entries.
 *     responses:
 *       200:
 *         description: A list of research entries.
 *       500:
 *         description: Server error.
 */
router.get("/", getResearches);

/**
 * @openapi
 * /api/research/{id}:
 *   get:
 *     summary: Retrieve a specific research entry
 *     description: Get details of a research entry by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the research entry.
 *     responses:
 *       200:
 *         description: Research entry details retrieved successfully.
 *       404:
 *         description: Research entry not found.
 *       500:
 *         description: Server error.
 */
router.get("/:id", getResearchById);

/**
 * @openapi
 * /api/research/{id}:
 *   put:
 *     summary: Update a research entry
 *     description: Update details of a research entry by its ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the research entry.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               abstract:
 *                 type: string
 *               authors:
 *                 type: array
 *                 items:
 *                   type: string
 *               publishedDate:
 *                 type: string
 *                 format: date-time
 *               content:
 *                 type: string
 *               references:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Research entry updated successfully.
 *       404:
 *         description: Research entry not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id", authMiddleware, updateResearch);

/**
 * @openapi
 * /api/research/{id}:
 *   delete:
 *     summary: Delete a research entry
 *     description: Delete a research entry by its ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the research entry.
 *     responses:
 *       200:
 *         description: Research entry deleted successfully.
 *       404:
 *         description: Research entry not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:id", authMiddleware, deleteResearch);

module.exports = router;
