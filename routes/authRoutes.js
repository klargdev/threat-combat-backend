const express = require("express");
const { 
    authLogin, 
    registerUser, 
    registerIndustryPartner,
    getUserProfile,
    logoutUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    assignAdminRole,
    assignExecutiveRole,
    getAvailableChapters,
    verifyEmailByToken
} = require("../controllers/authController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with role-based assignment to a chapter.
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
 *               - chapterId
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
 *               role:
 *                 type: string
 *                 enum: [member, executive, chapter_admin]
 *                 default: member
 *                 description: The user's role.
 *               chapterId:
 *                 type: string
 *                 description: The chapter ID the user belongs to.
 *               academicInfo:
 *                 type: object
 *                 description: Academic information for students.
 *               professionalInfo:
 *                 type: object
 *                 description: Professional information.
 *               contactInfo:
 *                 type: object
 *                 description: Contact information.
 *               profile:
 *                 type: object
 *                 description: Profile information.
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Bad request, validation errors, or invalid chapter ID.
 *       403:
 *         description: Super admin accounts cannot be created through registration.
 *       500:
 *         description: Server error.
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /api/auth/register/industry:
 *   post:
 *     summary: Register an industry partner
 *     description: Register a new industry partner with company information.
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
 *               - professionalInfo
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
 *               professionalInfo:
 *                 type: object
 *                 required:
 *                   - company
 *                 properties:
 *                   company:
 *                     type: string
 *                     description: Company name.
 *                   position:
 *                     type: string
 *                     description: Job position.
 *                   industry:
 *                     type: string
 *                     description: Industry sector.
 *                   experience:
 *                     type: number
 *                     description: Years of experience.
 *                   expertise:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Areas of expertise.
 *               contactInfo:
 *                 type: object
 *                 description: Contact information.
 *               profile:
 *                 type: object
 *                 description: Profile information.
 *     responses:
 *       201:
 *         description: Industry partner registration submitted successfully. Pending approval.
 *       400:
 *         description: Bad request, validation errors, or missing company information.
 *       500:
 *         description: Server error.
 */
router.post("/register/industry", registerIndustryPartner);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticate a user and return a JWT token with role and permissions.
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
 *         description: Login successful, returns user data and JWT token.
 *       400:
 *         description: Invalid credentials or validation errors.
 *       403:
 *         description: Account is not active.
 *       500:
 *         description: Server error.
 */
router.post("/login", authLogin);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user
 *     description: Clear the authentication token and log out the user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       500:
 *         description: Server error.
 */
router.post("/logout", authMiddleware, logoutUser);

/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/profile", authMiddleware, getUserProfile);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the password of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password.
 *               newPassword:
 *                 type: string
 *                 description: New password.
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Current password is incorrect or missing fields.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/change-password", authMiddleware, changePassword);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *     responses:
 *       200:
 *         description: Password reset link sent to email.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset password using a valid reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token.
 *               newPassword:
 *                 type: string
 *                 description: New password.
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid or expired reset token.
 *       500:
 *         description: Server error.
 */
router.post("/reset-password", resetPassword);

/**
 * @openapi
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     description: Verify user's email address using verification token.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid verification token.
 *       500:
 *         description: Server error.
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @openapi
 * /api/auth/assign-admin:
 *   post:
 *     summary: Assign admin role to user (Super Admin only)
 *     description: Assign chapter_admin or super_admin role to existing users.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newRole
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of the user to promote.
 *               newRole:
 *                 type: string
 *                 enum: [chapter_admin, super_admin]
 *                 description: New role to assign.
 *               chapterId:
 *                 type: string
 *                 description: Chapter ID (required for chapter_admin role).
 *     responses:
 *       200:
 *         description: Role assigned successfully.
 *       400:
 *         description: Invalid request or user not found.
 *       403:
 *         description: Insufficient permissions.
 *       500:
 *         description: Server error.
 */
router.post("/assign-admin", authMiddleware, requireRole(['super_admin', 'chapter_admin']), assignAdminRole);

/**
 * @openapi
 * /api/auth/assign-executive:
 *   post:
 *     summary: Assign executive role to user (Chapter Admin only)
 *     description: Assign executive role to users within the same chapter.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email of the user to promote to executive.
 *     responses:
 *       200:
 *         description: Executive role assigned successfully.
 *       400:
 *         description: Invalid request or user not found.
 *       403:
 *         description: Insufficient permissions or user not in same chapter.
 *       500:
 *         description: Server error.
 */
router.post("/assign-executive", authMiddleware, requireRole(['chapter_admin']), assignExecutiveRole);

/**
 * @openapi
 * /api/auth/chapters:
 *   get:
 *     summary: Get available chapters for registration
 *     description: Retrieve list of active Threat Combat chapters for user registration.
 *     responses:
 *       200:
 *         description: List of available chapters.
 *       500:
 *         description: Server error.
 */
router.get("/chapters", getAvailableChapters);

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address by token
 *     description: Verify user's email address using token verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The user's token.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post('/verify-email', verifyEmailByToken);

module.exports = router;
