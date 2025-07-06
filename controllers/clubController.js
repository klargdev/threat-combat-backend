const Club = require("../models/Club");
const User = require("../models/User");

// @desc    Create a new club/chapter
// @route   POST /api/clubs
// @access  Private (Admin/Instructor)
const createClub = async (req, res) => {
  try {
    const {
      name,
      university,
      location,
      description,
      facultyAdvisor,
      researchFocus,
      meetingSchedule,
      contactInfo,
      socialMedia,
    } = req.body;

    // Check if club already exists
    const existingClub = await Club.findOne({ name });
    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: "Club with this name already exists",
      });
    }

    const club = new Club({
      name,
      university,
      location,
      description,
      facultyAdvisor,
      researchFocus,
      meetingSchedule,
      contactInfo,
      socialMedia,
    });

    await club.save();

    res.status(201).json({
      success: true,
      message: "Club created successfully",
      data: club,
    });
  } catch (error) {
    console.error("Create club error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating club",
      error: error.message,
    });
  }
};

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
  try {
    const { status, location, university } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by location
    if (location) {
      query.location = new RegExp(location, "i");
    }

    // Filter by university
    if (university) {
      query.university = new RegExp(university, "i");
    }

    const clubs = await Club.find(query)
      .populate("executiveTeam.userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    console.error("Get clubs error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching clubs",
      error: error.message,
    });
  }
};

// @desc    Get club by ID
// @route   GET /api/clubs/:id
// @access  Public
const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("executiveTeam.userId", "name email avatar")
      .populate("achievements");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    console.error("Get club by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching club",
      error: error.message,
    });
  }
};

// @desc    Update club
// @route   PUT /api/clubs/:id
// @access  Private (Club Executive/Admin)
const updateClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Check if user is authorized to update club
    const isExecutive = club.executiveTeam.some(
      (exec) => exec.userId.toString() === req.user.id
    );

    if (!isExecutive && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this club",
      });
    }

    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("executiveTeam.userId", "name email");

    res.status(200).json({
      success: true,
      message: "Club updated successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Update club error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating club",
      error: error.message,
    });
  }
};

// @desc    Delete club
// @route   DELETE /api/clubs/:id
// @access  Private (Admin only)
const deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Only admin can delete clubs
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete club",
      });
    }

    await Club.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Club deleted successfully",
    });
  } catch (error) {
    console.error("Delete club error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting club",
      error: error.message,
    });
  }
};

// @desc    Add executive member
// @route   POST /api/clubs/:id/executives
// @access  Private (Club Executive/Admin)
const addExecutive = async (req, res) => {
  try {
    const { userId, position, term } = req.body;

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if position is already taken
    const existingPosition = club.executiveTeam.find(
      (exec) => exec.position === position && !exec.endDate
    );
    if (existingPosition) {
      return res.status(400).json({
        success: false,
        message: "Position already occupied",
      });
    }

    // End current term if user is already an executive
    const currentExecutive = club.executiveTeam.find(
      (exec) => exec.userId.toString() === userId && !exec.endDate
    );
    if (currentExecutive) {
      currentExecutive.endDate = new Date();
    }

    // Add new executive
    club.executiveTeam.push({
      userId,
      position,
      term,
      startDate: new Date(),
    });

    await club.save();

    const updatedClub = await Club.findById(req.params.id)
      .populate("executiveTeam.userId", "name email");

    res.status(200).json({
      success: true,
      message: "Executive member added successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Add executive error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding executive member",
      error: error.message,
    });
  }
};

// @desc    Remove executive member
// @route   DELETE /api/clubs/:id/executives/:executiveId
// @access  Private (Club Executive/Admin)
const removeExecutive = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const executive = club.executiveTeam.id(req.params.executiveId);
    if (!executive) {
      return res.status(404).json({
        success: false,
        message: "Executive member not found",
      });
    }

    // End the executive's term
    executive.endDate = new Date();
    await club.save();

    const updatedClub = await Club.findById(req.params.id)
      .populate("executiveTeam.userId", "name email");

    res.status(200).json({
      success: true,
      message: "Executive member removed successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Remove executive error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing executive member",
      error: error.message,
    });
  }
};

// @desc    Add achievement to club
// @route   POST /api/clubs/:id/achievements
// @access  Private (Club Executive/Admin)
const addAchievement = async (req, res) => {
  try {
    const { title, description, type } = req.body;

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const achievement = {
      title,
      description,
      type,
      date: new Date(),
    };

    club.achievements.push(achievement);
    await club.save();

    res.status(200).json({
      success: true,
      message: "Achievement added successfully",
      data: club.achievements[club.achievements.length - 1],
    });
  } catch (error) {
    console.error("Add achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding achievement",
      error: error.message,
    });
  }
};

// @desc    Get club statistics
// @route   GET /api/clubs/:id/stats
// @access  Public
const getClubStats = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Calculate additional stats
    const currentExecutives = club.executiveTeam.filter(
      (exec) => !exec.endDate || exec.endDate > new Date()
    );

    const stats = {
      ...club.stats,
      currentExecutives: currentExecutives.length,
      totalExecutives: club.executiveTeam.length,
      achievementsCount: club.achievements.length,
      researchFocusAreas: club.researchFocus.length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get club stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching club statistics",
      error: error.message,
    });
  }
};

// @desc    Get clubs by location
// @route   GET /api/clubs/location/:location
// @access  Public
const getClubsByLocation = async (req, res) => {
  try {
    const clubs = await Club.findByLocation(req.params.location)
      .populate("executiveTeam.userId", "name email")
      .sort({ memberCount: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    console.error("Get clubs by location error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching clubs by location",
      error: error.message,
    });
  }
};

// @desc    Get active clubs
// @route   GET /api/clubs/active
// @access  Public
const getActiveClubs = async (req, res) => {
  try {
    const clubs = await Club.findActive()
      .populate("executiveTeam.userId", "name email")
      .sort({ memberCount: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    console.error("Get active clubs error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active clubs",
      error: error.message,
    });
  }
};

module.exports = {
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
}; 