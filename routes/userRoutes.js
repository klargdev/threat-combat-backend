const express = require("express");
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getChapterMembers,
  promoteToExecutive,
  demoteFromExecutive,
  activateMembership,
  suspendMembership,
  getUserStats,
  getMyProfile,
  updateMyProfile
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { 
  requireChapterAdmin, 
  requireUserManagementAccess,
  requireAnalyticsAccess 
} = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Retrieve a list of all users with role-based filtering. Chapter admins can only see their chapter members.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, chapter_admin, executive, member, industry_partner]
 *         description: Filter by user role
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: string
 *         description: Filter by chapter ID (super admin only)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, pending]
 *         description: Filter by membership status
 *       - in: query
 *         name: university
 *         schema:
 *           type: string
 *         description: Filter by university (super admin only)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or university
 *     responses:
 *       200:
 *         description: A list of users retrieved successfully.
 *       403:
 *         description: Not authorized to view users.
 *       500:
 *         description: Server error.
 */
router.get("/", authMiddleware, requireChapterAdmin, getUsers);

/**
 * @openapi
 * /api/users/profile/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *       500:
 *         description: Server error.
 */
router.get("/profile/me", authMiddleware, getMyProfile);

/**
 * @openapi
 * /api/users/profile/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the profile of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactInfo:
 *                 type: object
 *               profile:
 *                 type: object
 *               preferences:
 *                 type: object
 *               academicInfo:
 *                 type: object
 *               professionalInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       500:
 *         description: Server error.
 */
router.put("/profile/me", authMiddleware, updateMyProfile);

/**
 * @openapi
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve user statistics with role-based filtering. Chapter admins can only see their chapter stats.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chapterId
 *         schema:
 *           type: string
 *         description: Chapter ID to filter stats (super admin only)
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully.
 *       403:
 *         description: Not authorized to view statistics.
 *       500:
 *         description: Server error.
 */
router.get("/stats", authMiddleware, requireAnalyticsAccess, getUserStats);

/**
 * @openapi
 * /api/users/chapter/{chapterId}:
 *   get:
 *     summary: Get chapter members
 *     description: Retrieve all members of a specific chapter with filtering options.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, pending]
 *         description: Filter by membership status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, chapter_admin, executive, member, industry_partner]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Chapter members retrieved successfully.
 *       500:
 *         description: Server error.
 */
router.get("/chapter/:chapterId", authMiddleware, getChapterMembers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Retrieve a single user
 *     description: Get user details by user ID. Users can view their own profile, chapter admins can view their chapter members.
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
 *       403:
 *         description: Not authorized to view this user.
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
 *     description: Update user information by user ID. Chapter admins can only update their chapter members.
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               membershipStatus:
 *                 type: string
 *               academicInfo:
 *                 type: object
 *               professionalInfo:
 *                 type: object
 *               contactInfo:
 *                 type: object
 *               profile:
 *                 type: object
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       403:
 *         description: Not authorized to update this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put("/:id", authMiddleware, updateUser);

/**
 * @openapi
 * /api/users/{id}/promote:
 *   post:
 *     summary: Promote user to executive
 *     description: Promote a user to executive position within their chapter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to promote.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *               - term
 *             properties:
 *               position:
 *                 type: string
 *                 enum: [President, Vice President, Secretary, Treasurer, Public Relations Officer, Technical Lead, Research Coordinator]
 *               term:
 *                 type: string
 *                 example: "2024-2025"
 *     responses:
 *       200:
 *         description: User promoted successfully.
 *       400:
 *         description: Position and term are required.
 *       403:
 *         description: Not authorized to promote this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/:id/promote", authMiddleware, requireChapterAdmin, promoteToExecutive);

/**
 * @openapi
 * /api/users/{id}/demote:
 *   post:
 *     summary: Demote user from executive
 *     description: Demote a user from executive position to regular member.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to demote.
 *     responses:
 *       200:
 *         description: User demoted successfully.
 *       403:
 *         description: Not authorized to demote this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/:id/demote", authMiddleware, requireChapterAdmin, demoteFromExecutive);

/**
 * @openapi
 * /api/users/{id}/activate:
 *   post:
 *     summary: Activate user membership
 *     description: Activate a user's membership status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to activate.
 *     responses:
 *       200:
 *         description: User membership activated successfully.
 *       403:
 *         description: Not authorized to activate this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/:id/activate", authMiddleware, requireChapterAdmin, activateMembership);

/**
 * @openapi
 * /api/users/{id}/suspend:
 *   post:
 *     summary: Suspend user membership
 *     description: Suspend a user's membership status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to suspend.
 *     responses:
 *       200:
 *         description: User membership suspended successfully.
 *       403:
 *         description: Not authorized to suspend this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post("/:id/suspend", authMiddleware, requireChapterAdmin, suspendMembership);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by user ID. Chapter admins can only delete their chapter members.
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
 *       403:
 *         description: Not authorized to delete this user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:id", authMiddleware, requireChapterAdmin, deleteUser);

module.exports = router;
