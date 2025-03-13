const express = require("express");
const { sendNotification, getNotifications, markAsRead } = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, sendNotification);
router.get("/", authMiddleware, getNotifications);
router.put("/:id/read", authMiddleware, markAsRead);

module.exports = router;
