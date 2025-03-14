const express = require("express");
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Retrieve a list of all users. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users retrieved successfully.
 *       500:
 *         description: Server error.
 */
router.get("/", authMiddleware, getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve a single user
 *     description: Get user details by user ID. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *     responses:
 *       200:
 *         description: User details retrieved successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/:id", authMiddleware, getUserById);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update user information by user ID. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the user.
 *               email:
 *                 type: string
 *                 description: The updated email of the user.
 *             example:
 *               name: Jane Doe
 *               email: jane.doe@example.com
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id", authMiddleware, updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by user ID. Authentication is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete.
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
