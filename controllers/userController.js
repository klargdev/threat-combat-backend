const User = require("../models/User");
const Club = require("../models/Club");

// @desc    Get all users (with role-based filtering)
// @route   GET /api/users
// @access  Private (Chapter Admin/Super Admin)
const getUsers = async (req, res) => {
  try {
    const { role, chapter, status, university, search } = req.query;
    let query = {};

    // Super admin can see all users
    if (req.user.role === "super_admin") {
      // Apply filters if provided
      if (role) query.role = role;
      if (chapter) query.chapter = chapter;
      if (status) query.membershipStatus = status;
      if (university) query["academicInfo.university"] = new RegExp(university, "i");
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { "academicInfo.university": new RegExp(search, "i") }
        ];
      }
    } else {
      // Chapter admin can only see users in their chapter
      query.chapter = req.user.chapter;
      
      // Apply additional filters
      if (role) query.role = role;
      if (status) query.membershipStatus = status;
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") }
        ];
      }
    }

    const users = await User.find(query)
      .populate("chapter", "name university location")
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Chapter Admin/Super Admin/Own User)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("chapter", "name university location")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has permission to view this user
    if (req.user.role !== "super_admin" && 
        req.user.role !== "chapter_admin" && 
        req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user",
      });
    }

    // Chapter admin can only view users in their chapter
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view users from other chapters",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Chapter Admin/Super Admin/Own User)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has permission to update this user
    if (req.user.role !== "super_admin" && 
        req.user.role !== "chapter_admin" && 
        req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }

    // Chapter admin can only update users in their chapter
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update users from other chapters",
      });
    }

    // Regular users can only update their own profile (not role or chapter)
    if (req.user.role === "member" && req.user.id === req.params.id) {
      const allowedFields = [
        "name", "contactInfo", "profile", "preferences", 
        "academicInfo", "professionalInfo"
      ];
      
      const filteredBody = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredBody[key] = req.body[key];
        }
      });
      
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true }
      ).select("-password");

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    }

    // Admins can update all fields
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Chapter Admin/Super Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only super admin and chapter admin can delete users
    if (req.user.role !== "super_admin" && req.user.role !== "chapter_admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete users",
      });
    }

    // Chapter admin can only delete users in their chapter
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete users from other chapters",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get chapter members
// @route   GET /api/users/chapter/:chapterId
// @access  Private (Chapter Admin/Super Admin)
const getChapterMembers = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    let query = { chapter: req.params.chapterId };

    // Apply filters
    if (status) query.membershipStatus = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }

    const members = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error("Get chapter members error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chapter members",
      error: error.message,
    });
  }
};

// @desc    Promote user to executive
// @route   POST /api/users/:id/promote
// @access  Private (Chapter Admin/Super Admin)
const promoteToExecutive = async (req, res) => {
  try {
    const { position, term } = req.body;

    if (!position || !term) {
      return res.status(400).json({
        success: false,
        message: "Position and term are required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is in the same chapter (for chapter admin)
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to promote users from other chapters",
      });
    }

    await user.promoteToExecutive(position, term);

    const updatedUser = await User.findById(req.params.id)
      .select("-password")
      .populate("chapter", "name university");

    res.status(200).json({
      success: true,
      message: "User promoted to executive successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Promote user error:", error);
    res.status(500).json({
      success: false,
      message: "Error promoting user",
      error: error.message,
    });
  }
};

// @desc    Demote user from executive
// @route   POST /api/users/:id/demote
// @access  Private (Chapter Admin/Super Admin)
const demoteFromExecutive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is in the same chapter (for chapter admin)
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to demote users from other chapters",
      });
    }

    await user.demoteFromExecutive();

    const updatedUser = await User.findById(req.params.id)
      .select("-password")
      .populate("chapter", "name university");

    res.status(200).json({
      success: true,
      message: "User demoted from executive successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Demote user error:", error);
    res.status(500).json({
      success: false,
      message: "Error demoting user",
      error: error.message,
    });
  }
};

// @desc    Activate user membership
// @route   POST /api/users/:id/activate
// @access  Private (Chapter Admin/Super Admin)
const activateMembership = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is in the same chapter (for chapter admin)
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to activate users from other chapters",
      });
    }

    await user.activateMembership();

    res.status(200).json({
      success: true,
      message: "User membership activated successfully",
    });
  } catch (error) {
    console.error("Activate membership error:", error);
    res.status(500).json({
      success: false,
      message: "Error activating membership",
      error: error.message,
    });
  }
};

// @desc    Suspend user membership
// @route   POST /api/users/:id/suspend
// @access  Private (Chapter Admin/Super Admin)
const suspendMembership = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is in the same chapter (for chapter admin)
    if (req.user.role === "chapter_admin" && 
        user.chapter.toString() !== req.user.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to suspend users from other chapters",
      });
    }

    await user.suspendMembership();

    res.status(200).json({
      success: true,
      message: "User membership suspended successfully",
    });
  } catch (error) {
    console.error("Suspend membership error:", error);
    res.status(500).json({
      success: false,
      message: "Error suspending membership",
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Chapter Admin/Super Admin)
const getUserStats = async (req, res) => {
  try {
    const { chapterId } = req.query;
    let matchQuery = {};

    // Filter by chapter if provided and user is chapter admin
    if (chapterId && req.user.role === "chapter_admin") {
      if (chapterId !== req.user.chapter.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view stats for other chapters",
        });
      }
      matchQuery.chapter = chapterId;
    } else if (req.user.role === "chapter_admin") {
      matchQuery.chapter = req.user.chapter;
    }

    const stats = await User.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$membershipStatus", "active"] }, 1, 0] }
          },
          pendingUsers: {
            $sum: { $cond: [{ $eq: ["$membershipStatus", "pending"] }, 1, 0] }
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ["$membershipStatus", "suspended"] }, 1, 0] }
          },
          executives: {
            $sum: { $cond: [{ $eq: ["$role", "executive"] }, 1, 0] }
          },
          chapterAdmins: {
            $sum: { $cond: [{ $eq: ["$role", "chapter_admin"] }, 1, 0] }
          },
          industryPartners: {
            $sum: { $cond: [{ $eq: ["$role", "industry_partner"] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        suspendedUsers: 0,
        executives: 0,
        chapterAdmins: 0,
        industryPartners: 0
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    console.log('👤 GetMyProfile - User ID:', req.user?.id);
    console.log('👤 GetMyProfile - User object:', req.user);
    
    if (!req.user || !req.user.id) {
      console.error('👤 GetMyProfile - No user or user ID found');
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const user = await User.findById(req.user.id)
      .populate("chapter", "name university location")
      .select("-password");

    if (!user) {
      console.error('👤 GetMyProfile - User not found in database');
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('👤 GetMyProfile - User found:', user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("👤 GetMyProfile - Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name", "contactInfo", "profile", "preferences", 
      "academicInfo", "professionalInfo"
    ];
    
    const filteredBody = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("chapter", "name university location");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

module.exports = {
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
  updateMyProfile,
};
