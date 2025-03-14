const express = require("express");
const { authLogin, registerUser } = require("../controllers/authController");

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name.
 *               email:
 *                 type: string
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Bad request or user already exists.
 *       500:
 *         description: Server error.
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticate a user and return a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: Login successful, returns a JWT token.
 *       400:
 *         description: Invalid credentials or validation errors.
 *       500:
 *         description: Server error.
 */
router.post("/login", authLogin);

module.exports = router;
