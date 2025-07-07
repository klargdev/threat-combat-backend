const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["super_admin", "chapter_admin", "executive", "member", "industry_partner"], 
      default: "member" 
    },
    
    // Chapter/University Information
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: function() {
        return this.role !== "super_admin";
      }
    },
    
    // Executive position within chapter (if applicable)
    executivePosition: {
      position: {
        type: String,
        enum: [
          "President",
          "Vice President", 
          "Secretary",
          "Treasurer",
          "Public Relations Officer",
          "Technical Lead",
          "Research Coordinator"
        ]
      },
      term: String, // e.g., "2024-2025"
      startDate: Date,
      endDate: Date
    },
    
    // Academic/Professional Information
    academicInfo: {
      university: String,
      department: String,
      studentId: String,
      yearOfStudy: Number,
      degree: String, // "Bachelor", "Master", "PhD"
      major: String,
      gpa: Number,
      graduationYear: Number
    },
    
    // Professional Information (for industry partners)
    professionalInfo: {
      company: String,
      position: String,
      industry: String,
      experience: Number, // years of experience
      expertise: [String], // ["Memory Forensics", "Network Forensics", etc.]
      linkedin: String,
      website: String
    },
    
    // Contact Information
    contactInfo: {
      phone: String,
      address: String,
      city: String,
      country: String,
      timezone: String
    },
    
    // Profile Information
    profile: {
      avatar: String,
      bio: String,
      skills: [String],
      interests: [String],
      github: String,
      portfolio: String
    },
    
    // Membership Status
    membershipStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending"
    },
    
    // Enrollment Information
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    
    // Permissions and Access Control
    permissions: {
      canManageChapter: {
        type: Boolean,
        default: function() {
          return this.role === "chapter_admin" || this.role === "super_admin";
        }
      },
      canManageUsers: {
        type: Boolean,
        default: function() {
          return this.role === "chapter_admin" || this.role === "super_admin";
        }
      },
      canManageResearch: {
        type: Boolean,
        default: function() {
          return this.role === "executive" || this.role === "chapter_admin" || this.role === "super_admin";
        }
      },
      canManageEvents: {
        type: Boolean,
        default: function() {
          return this.role === "executive" || this.role === "chapter_admin" || this.role === "super_admin";
        }
      },
      canAccessGlobalFeatures: {
        type: Boolean,
        default: function() {
          return this.role === "super_admin" || this.role === "industry_partner";
        }
      }
    },
    
    // Activity Tracking
    activity: {
      lastLogin: Date,
      loginCount: {
        type: Number,
        default: 0
      },
      totalTimeSpent: {
        type: Number,
        default: 0 // in minutes
      },
      researchContributions: {
        type: Number,
        default: 0
      },
      eventsAttended: {
        type: Number,
        default: 0
      },
      coursesCompleted: {
        type: Number,
        default: 0
      }
    },
    
    // Preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: true
      },
      language: {
        type: String,
        default: "en"
      }
    },
    
    // Verification and Security
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Social Authentication
    socialAuth: {
      google: {
        id: String,
        email: String
      },
      linkedin: {
        id: String,
        email: String
      }
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
UserSchema.index({ role: 1, chapter: 1 });
UserSchema.index({ "membershipStatus": 1 });
UserSchema.index({ "academicInfo.university": 1 });
UserSchema.index({ "professionalInfo.company": 1 });
UserSchema.index({ email: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function() {
  return this.name;
});

// Virtual for isActive
UserSchema.virtual("isActive").get(function() {
  return this.membershipStatus === "active";
});

// Virtual for isExecutive
UserSchema.virtual("isExecutive").get(function() {
  return this.role === "executive" || this.role === "chapter_admin" || this.role === "super_admin";
});

// Virtual for canManageChapter
UserSchema.virtual("canManageChapter").get(function() {
  return this.role === "chapter_admin" || this.role === "super_admin";
});

// Pre-save middleware to hash password
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update activity
UserSchema.methods.updateActivity = function() {
  this.activity.lastLogin = new Date();
  this.activity.loginCount += 1;
  return this.save();
};

// Method to promote to executive
UserSchema.methods.promoteToExecutive = function(position, term) {
  this.role = "executive";
  this.executivePosition = {
    position,
    term,
    startDate: new Date()
  };
  return this.save();
};

// Method to demote from executive
UserSchema.methods.demoteFromExecutive = function() {
  this.role = "member";
  if (this.executivePosition) {
    this.executivePosition.endDate = new Date();
  }
  return this.save();
};

// Method to activate membership
UserSchema.methods.activateMembership = function() {
  this.membershipStatus = "active";
  return this.save();
};

// Method to suspend membership
UserSchema.methods.suspendMembership = function() {
  this.membershipStatus = "suspended";
  return this.save();
};

// Static method to find chapter members
UserSchema.statics.findChapterMembers = function(chapterId) {
  return this.find({ chapter: chapterId, membershipStatus: "active" });
};

// Static method to find executives
UserSchema.statics.findExecutives = function(chapterId = null) {
  const query = { role: { $in: ["executive", "chapter_admin"] } };
  if (chapterId) query.chapter = chapterId;
  return this.find(query);
};

// Static method to find chapter admins
UserSchema.statics.findChapterAdmins = function() {
  return this.find({ role: "chapter_admin" });
};

// Static method to find industry partners
UserSchema.statics.findIndustryPartners = function() {
  return this.find({ role: "industry_partner" });
};

// Static method to find users by university
UserSchema.statics.findByUniversity = function(university) {
  return this.find({ "academicInfo.university": new RegExp(university, "i") });
};

// Static method to find users by expertise
UserSchema.statics.findByExpertise = function(expertise) {
  return this.find({ "professionalInfo.expertise": expertise });
};

module.exports = mongoose.model("User", UserSchema);
