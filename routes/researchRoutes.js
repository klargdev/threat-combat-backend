const express = require("express");
const { createResearch, getResearches, getResearchById, updateResearch, deleteResearch } = require("../controllers/researchController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createResearch);
router.get("/", getResearches);
router.get("/:id", getResearchById);
router.put("/:id", authMiddleware, updateResearch);
router.delete("/:id", authMiddleware, deleteResearch);

module.exports = router;
