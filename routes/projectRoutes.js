const express = require("express");
const { createProject, getProjects, getProjectById, updateProject, deleteProject } = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the project.
 *               description:
 *                 type: string
 *                 description: The project description.
 *               status:
 *                 type: string
 *                 enum: [ongoing, completed]
 *                 description: The current status of the project.
 *     responses:
 *       201:
 *         description: Project created successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post("/", authMiddleware, createProject);

/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: Retrieve all projects
 *     description: Get a list of all projects.
 *     responses:
 *       200:
 *         description: A list of projects.
 *       500:
 *         description: Server error.
 */
router.get("/", getProjects);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     summary: Retrieve a single project
 *     description: Get project details by project ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID.
 *     responses:
 *       200:
 *         description: Project details retrieved successfully.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
router.get("/:id", getProjectById);

/**
 * @openapi
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Update project details by project ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ongoing, completed]
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id", authMiddleware, updateProject);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by project ID. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID.
 *     responses:
 *       200:
 *         description: Project deleted successfully.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
