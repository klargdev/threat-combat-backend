const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    // User who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // User's role at the time of action
    userRole: {
      type: String,
      enum: ["super_admin", "chapter_admin", "executive", "member", "industry_partner"],
      required: true,
    },
    
    // User's chapter at the time of action
    userChapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
    },
    
    // Action details
    action: {
      type: String,
      required: true,
      enum: [
        // Authentication actions
        "LOGIN",
        "LOGOUT",
        "REGISTER",
        "PASSWORD_CHANGE",
        "PASSWORD_RESET_REQUEST",
        "PASSWORD_RESET_COMPLETE",
        "EMAIL_VERIFICATION",
        
        // User management actions
        "USER_CREATE",
        "USER_UPDATE",
        "USER_DELETE",
        "USER_ACTIVATE",
        "USER_SUSPEND",
        "USER_PROMOTE",
        "USER_DEMOTE",
        "ROLE_CHANGE",
        
        // Chapter management actions
        "CHAPTER_CREATE",
        "CHAPTER_UPDATE",
        "CHAPTER_DELETE",
        "CHAPTER_JOIN",
        "CHAPTER_LEAVE",
        
        // Research actions
        "RESEARCH_CREATE",
        "RESEARCH_UPDATE",
        "RESEARCH_DELETE",
        "RESEARCH_PUBLISH",
        
        // Event actions
        "EVENT_CREATE",
        "EVENT_UPDATE",
        "EVENT_DELETE",
        "EVENT_REGISTER",
        "EVENT_UNREGISTER",
        
        // Course actions
        "COURSE_CREATE",
        "COURSE_UPDATE",
        "COURSE_DELETE",
        "COURSE_ENROLL",
        "COURSE_UNENROLL",
        
        // Security actions
        "LOGIN_ATTEMPT_FAILED",
        "ACCOUNT_LOCKOUT",
        "SUSPICIOUS_ACTIVITY",
        "RATE_LIMIT_EXCEEDED",
        
        // System actions
        "SYSTEM_BACKUP",
        "SYSTEM_UPDATE",
        "CONFIGURATION_CHANGE"
      ],
    },
    
    // Resource that was affected
    resource: {
      type: String,
      enum: [
        "USER",
        "CHAPTER",
        "RESEARCH",
        "EVENT",
        "COURSE",
        "SYSTEM",
        "AUTHENTICATION"
      ],
      required: true,
    },
    
    // ID of the affected resource
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    
    // Details about the action
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // IP address of the user
    ipAddress: {
      type: String,
      required: true,
    },
    
    // User agent string
    userAgent: {
      type: String,
    },
    
    // Request method
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    
    // Request URL
    url: {
      type: String,
    },
    
    // HTTP status code
    statusCode: {
      type: Number,
    },
    
    // Success status
    success: {
      type: Boolean,
      default: true,
    },
    
    // Error message if action failed
    errorMessage: {
      type: String,
    },
    
    // Request duration in milliseconds
    duration: {
      type: Number,
    },
    
    // Geographic location (if available)
    location: {
      country: String,
      city: String,
      region: String,
    },
    
    // Risk level of the action
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    
    // Whether this action requires review
    requiresReview: {
      type: Boolean,
      default: false,
    },
    
    // Review status
    reviewStatus: {
      type: String,
      enum: ["PENDING", "REVIEWED", "ESCALATED", "RESOLVED"],
      default: "PENDING",
    },
    
    // Reviewer notes
    reviewNotes: {
      type: String,
    },
    
    // Reviewer ID
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Review date
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ ipAddress: 1, createdAt: -1 });
AuditLogSchema.index({ riskLevel: 1, requiresReview: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
AuditLogSchema.virtual("formattedTimestamp").get(function() {
  return this.createdAt.toISOString();
});

// Virtual for action description
AuditLogSchema.virtual("actionDescription").get(function() {
  const actionDescriptions = {
    LOGIN: "User logged in",
    LOGOUT: "User logged out",
    REGISTER: "User registered",
    PASSWORD_CHANGE: "Password changed",
    PASSWORD_RESET_REQUEST: "Password reset requested",
    PASSWORD_RESET_COMPLETE: "Password reset completed",
    EMAIL_VERIFICATION: "Email verified",
    USER_CREATE: "User created",
    USER_UPDATE: "User updated",
    USER_DELETE: "User deleted",
    USER_ACTIVATE: "User activated",
    USER_SUSPEND: "User suspended",
    USER_PROMOTE: "User promoted",
    USER_DEMOTE: "User demoted",
    ROLE_CHANGE: "User role changed",
    LOGIN_ATTEMPT_FAILED: "Login attempt failed",
    ACCOUNT_LOCKOUT: "Account locked out",
    SUSPICIOUS_ACTIVITY: "Suspicious activity detected",
    RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  };
  
  return actionDescriptions[this.action] || this.action;
});

// Static method to log an action
AuditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error logging audit action:", error);
    throw error;
  }
};

// Static method to get user activity
AuditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name email")
    .populate("userChapter", "name university");
};

// Static method to get suspicious activity
AuditLogSchema.statics.getSuspiciousActivity = async function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.find({
    $or: [
      { riskLevel: { $in: ["HIGH", "CRITICAL"] } },
      { action: { $in: ["LOGIN_ATTEMPT_FAILED", "ACCOUNT_LOCKOUT", "SUSPICIOUS_ACTIVITY"] } },
      { requiresReview: true }
    ],
    createdAt: { $gte: date }
  })
    .sort({ createdAt: -1 })
    .populate("userId", "name email role")
    .populate("userChapter", "name university");
};

// Static method to get failed login attempts
AuditLogSchema.statics.getFailedLoginAttempts = async function(ipAddress, hours = 1) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  
  return this.countDocuments({
    ipAddress,
    action: "LOGIN_ATTEMPT_FAILED",
    createdAt: { $gte: date }
  });
};

// Static method to get activity summary
AuditLogSchema.statics.getActivitySummary = async function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: date }
      }
    },
    {
      $group: {
        _id: {
          action: "$action",
          success: "$success"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.action",
        total: { $sum: "$count" },
        successful: {
          $sum: {
            $cond: [{ $eq: ["$_id.success", true] }, "$count", 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ["$_id.success", false] }, "$count", 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model("AuditLog", AuditLogSchema); 