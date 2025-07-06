const express = require("express");
const {
  createClub,
  getClubs,
  getClubById,
  updateClub,
  deleteClub,
  addExecutive,
  removeExecutive,
  addAchievement,
  getClubStats,
  getClubsByLocation,
  getActiveClubs,
} = require("../controllers/clubController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * /api/clubs:
 *   post:
 *     summary: Create a new club/chapter
 *     description: Create a new university chapter for Threat Combat. Authentication required.
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
 *               - university
 *               - location
 *               - facultyAdvisor
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the club/chapter
 *               university:
 *                 type: string
 *                 description: The university name
 *               location:
 *                 type: string
 *                 description: City, Country
 *               description:
 *                 type: string
 *                 description: Club description
 *               facultyAdvisor:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   department:
 *                     type: string
 *                   phone:
 *                     type: string
 *               researchFocus:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["Memory Forensics", "Network Forensics", "Incident Response", "Malware Analysis", "AI in DFIR", "Digital Forensics", "Threat Intelligence"]
 *     responses:
 *       201:
 *         description: Club created successfully
 *       400:
 *         description: Bad request or club already exists
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, createClub);

/**
 * @openapi
 * /api/clubs:
 *   get:
 *     summary: Get all clubs
 *     description: Retrieve a list of all university chapters with optional filtering
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filter by club status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: university
 *         schema:
 *           type: string
 *         description: Filter by university name
 *     responses:
 *       200:
 *         description: List of clubs retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", getClubs);

/**
 * @openapi
 * /api/clubs/active:
 *   get:
 *     summary: Get active clubs
 *     description: Retrieve only active university chapters
 *     responses:
 *       200:
 *         description: Active clubs retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/active", getActiveClubs);

/**
 * @openapi
 * /api/clubs/location/{location}:
 *   get:
 *     summary: Get clubs by location
 *     description: Retrieve clubs filtered by specific location
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Location to filter by
 *     responses:
 *       200:
 *         description: Clubs by location retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/location/:location", getClubsByLocation);

/**
 * @openapi
 * /api/clubs/{id}:
 *   get:
 *     summary: Get club by ID
 *     description: Retrieve detailed information about a specific club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     responses:
 *       200:
 *         description: Club details retrieved successfully
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getClubById);

/**
 * @openapi
 * /api/clubs/{id}:
 *   put:
 *     summary: Update club
 *     description: Update club information. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               university:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *               facultyAdvisor:
 *                 type: object
 *               researchFocus:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Club updated successfully
 *       403:
 *         description: Not authorized to update club
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authMiddleware, updateClub);

/**
 * @openapi
 * /api/clubs/{id}:
 *   delete:
 *     summary: Delete club
 *     description: Delete a club. Admin authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     responses:
 *       200:
 *         description: Club deleted successfully
 *       403:
 *         description: Not authorized to delete club
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authMiddleware, deleteClub);

/**
 * @openapi
 * /api/clubs/{id}/executives:
 *   post:
 *     summary: Add executive member
 *     description: Add a new executive member to the club. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - position
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to add as executive
 *               position:
 *                 type: string
 *                 enum: [President, Vice President, Secretary, Treasurer, Public Relations Officer, Technical Lead, Research Coordinator]
 *               term:
 *                 type: string
 *                 description: Academic term (e.g., "2024-2025")
 *     responses:
 *       200:
 *         description: Executive member added successfully
 *       400:
 *         description: Position already occupied or user not found
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.post("/:id/executives", authMiddleware, addExecutive);

/**
 * @openapi
 * /api/clubs/{id}/executives/{executiveId}:
 *   delete:
 *     summary: Remove executive member
 *     description: Remove an executive member from the club. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *       - in: path
 *         name: executiveId
 *         required: true
 *         schema:
 *           type: string
 *         description: The executive member ID
 *     responses:
 *       200:
 *         description: Executive member removed successfully
 *       404:
 *         description: Club or executive member not found
 *       500:
 *         description: Server error
 */
router.delete("/:id/executives/:executiveId", authMiddleware, removeExecutive);

/**
 * @openapi
 * /api/clubs/{id}/achievements:
 *   post:
 *     summary: Add achievement to club
 *     description: Add a new achievement to the club. Authentication required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Achievement title
 *               description:
 *                 type: string
 *                 description: Achievement description
 *               type:
 *                 type: string
 *                 enum: [award, competition, publication, certification]
 *     responses:
 *       200:
 *         description: Achievement added successfully
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.post("/:id/achievements", authMiddleware, addAchievement);

/**
 * @openapi
 * /api/clubs/{id}/stats:
 *   get:
 *     summary: Get club statistics
 *     description: Retrieve comprehensive statistics for a specific club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The club ID
 *     responses:
 *       200:
 *         description: Club statistics retrieved successfully
 *       404:
 *         description: Club not found
 *       500:
 *         description: Server error
 */
router.get("/:id/stats", getClubStats);

module.exports = router; 