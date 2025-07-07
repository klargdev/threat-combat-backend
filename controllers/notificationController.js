const Notification = require("../models/Notification");

exports.sendNotification = async (req, res) => {
    try {
        const notification = new Notification({ ...req.body, user: req.user.id });
        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
