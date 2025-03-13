const Research = require("../models/Research");

exports.createResearch = async (req, res) => {
    try {
        const research = new Research({ ...req.body, user: req.user.id });
        await research.save();
        res.status(201).json(research);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getResearches = async (req, res) => {
    try {
        const researches = await Research.find();
        res.json(researches);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getResearchById = async (req, res) => {
    try {
        const research = await Research.findById(req.params.id);
        if (!research) return res.status(404).json({ message: "Research not found" });
        res.json(research);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.updateResearch = async (req, res) => {
    try {
        const research = await Research.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(research);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.deleteResearch = async (req, res) => {
    try {
        await Research.findByIdAndDelete(req.params.id);
        res.json({ message: "Research deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
