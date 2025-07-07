const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    establishedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    executiveTeam: [
      {
        position: {
          type: String,
          required: true,
          enum: [
            "President",
            "Vice President",
            "Secretary",
            "Treasurer",
            "Public Relations Officer",
            "Technical Lead",
            "Research Coordinator",
          ],
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        term: {
          type: String,
          required: true,
          default: "2024-2025",
        },
        startDate: {
          type: Date,
          default: Date.now,
        },
        endDate: {
          type: Date,
        },
      },
    ],
    facultyAdvisor: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
      },
      department: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    researchFocus: [
      {
        type: String,
        enum: [
          "Memory Forensics",
          "Network Forensics",
          "Incident Response",
          "Malware Analysis",
          "AI in DFIR",
          "Digital Forensics",
          "Threat Intelligence",
        ],
      },
    ],
    achievements: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["award", "competition", "publication", "certification"],
        },
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    socialMedia: {
      linkedin: String,
      twitter: String,
      instagram: String,
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    meetingSchedule: {
      frequency: {
        type: String,
        enum: ["weekly", "bi-weekly", "monthly"],
        default: "weekly",
      },
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      time: String,
      location: String,
    },
    stats: {
      totalMembers: {
        type: Number,
        default: 0,
      },
      activeMembers: {
        type: Number,
        default: 0,
      },
      researchProjects: {
        type: Number,
        default: 0,
      },
      eventsHosted: {
        type: Number,
        default: 0,
      },
      certificationsEarned: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
clubSchema.index({ university: 1, status: 1 });
clubSchema.index({ location: 1 });
clubSchema.index({ "executiveTeam.userId": 1 });

// Virtual for current executive team
clubSchema.virtual("currentExecutives").get(function () {
  const now = new Date();
  return this.executiveTeam.filter(
    (exec) => !exec.endDate || exec.endDate > now
  );
});

// Method to add member
clubSchema.methods.addMember = function () {
  this.memberCount += 1;
  this.stats.totalMembers += 1;
  this.stats.activeMembers += 1;
  return this.save();
};

// Method to remove member
clubSchema.methods.removeMember = function () {
  if (this.memberCount > 0) {
    this.memberCount -= 1;
    this.stats.activeMembers -= 1;
  }
  return this.save();
};

// Method to add achievement
clubSchema.methods.addAchievement = function (achievement) {
  this.achievements.push(achievement);
  return this.save();
};

// Static method to find active clubs
clubSchema.statics.findActive = function () {
  return this.find({ status: "active" });
};

// Static method to find clubs by location
clubSchema.statics.findByLocation = function (location) {
  return this.find({ location: new RegExp(location, "i") });
};

module.exports = mongoose.model("Club", clubSchema); 