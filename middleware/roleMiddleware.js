const User = require("../models/User");
const Club = require("../models/Club");

// Middleware to check if user is super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking super admin privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user is chapter admin
const requireChapterAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "chapter_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Chapter admin privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking chapter admin privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user is executive or higher
const requireExecutive = async (req, res, next) => {
  try {
    const allowedRoles = ["executive", "chapter_admin", "super_admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Executive privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking executive privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user can manage specific chapter
const requireChapterAccess = async (req, res, next) => {
  try {
    const chapterId = req.params.chapterId || req.params.id || req.body.chapterId;
    
    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Chapter ID is required",
      });
    }

    // Super admin can access all chapters
    if (req.user.role === "super_admin") {
      return next();
    }

    // Chapter admin can only access their own chapter
    if (req.user.role === "chapter_admin") {
      if (req.user.chapter.toString() !== chapterId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only manage your own chapter.",
        });
      }
      return next();
    }

    // Executive can only access their own chapter
    if (req.user.role === "executive") {
      if (req.user.chapter.toString() !== chapterId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only manage your own chapter.",
        });
      }
      return next();
    }

    // Regular members cannot manage chapters
    return res.status(403).json({
      success: false,
      message: "Access denied. Insufficient privileges.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking chapter access",
      error: error.message,
    });
  }
};

// Middleware to check if user can manage users within their chapter
const requireUserManagementAccess = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Super admin can manage all users
    if (req.user.role === "super_admin") {
      return next();
    }

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    // Chapter admin can manage users in their chapter
    if (req.user.role === "chapter_admin") {
      if (targetUser.chapter.toString() !== req.user.chapter.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only manage users in your chapter.",
        });
      }
      return next();
    }

    // Executives cannot manage users
    return res.status(403).json({
      success: false,
      message: "Access denied. Insufficient privileges for user management.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking user management access",
      error: error.message,
    });
  }
};

// Middleware to check if user can access global features
const requireGlobalAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["super_admin", "industry_partner"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Global access privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking global access privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user is active member
const requireActiveMembership = async (req, res, next) => {
  try {
    if (req.user.membershipStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Active membership required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking membership status",
      error: error.message,
    });
  }
};

// Middleware to check if user can manage research
const requireResearchAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["executive", "chapter_admin", "super_admin", "industry_partner"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Research management privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking research access privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user can manage events
const requireEventAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["executive", "chapter_admin", "super_admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Event management privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking event access privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user is industry partner
const requireIndustryPartner = async (req, res, next) => {
  try {
    if (req.user.role !== "industry_partner" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Industry partner privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking industry partner privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user can access cross-chapter features
const requireCrossChapterAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["super_admin", "industry_partner"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Cross-chapter access privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking cross-chapter access privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user can view analytics
const requireAnalyticsAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["chapter_admin", "super_admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Analytics access privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking analytics access privileges",
      error: error.message,
    });
  }
};

// Middleware to check if user can manage courses
const requireCourseAccess = async (req, res, next) => {
  try {
    const allowedRoles = ["chapter_admin", "super_admin", "industry_partner"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Course management privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking course access privileges",
      error: error.message,
    });
  }
};

module.exports = {
  requireSuperAdmin,
  requireChapterAdmin,
  requireExecutive,
  requireChapterAccess,
  requireUserManagementAccess,
  requireGlobalAccess,
  requireActiveMembership,
  requireResearchAccess,
  requireEventAccess,
  requireIndustryPartner,
  requireCrossChapterAccess,
  requireAnalyticsAccess,
  requireCourseAccess,
}; 