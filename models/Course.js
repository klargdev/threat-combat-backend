const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "DFIR",
        "Malware Analysis",
        "Incident Response",
        "Memory Forensics",
        "Network Forensics",
        "Digital Forensics",
        "Threat Intelligence",
        "AI in DFIR",
        "Mobile Forensics",
        "Cloud Forensics",
      ],
    },
    level: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    modules: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
          min: 1,
        },
        resources: [
          {
            title: String,
            type: {
              type: String,
              enum: ["video", "document", "tool", "link"],
            },
            url: String,
            description: String,
          },
        ],
        assignments: [
          {
            title: String,
            description: String,
            dueDate: Date,
            points: Number,
            type: {
              type: String,
              enum: ["quiz", "lab", "project", "essay"],
            },
          },
        ],
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    certificate: {
      type: Boolean,
      default: true,
    },
    certificateTemplate: {
      type: String,
    },
    prerequisites: [
      {
        type: String,
        trim: true,
      },
    ],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    maxEnrollment: {
      type: Number,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    thumbnail: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    learningObjectives: [
      {
        type: String,
        trim: true,
      },
    ],
    tools: [
      {
        name: String,
        description: String,
        downloadUrl: String,
        isRequired: {
          type: Boolean,
          default: false,
        },
      },
    ],
    schedule: {
      startDate: Date,
      endDate: Date,
      sessions: [
        {
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
          duration: Number,
          type: {
            type: String,
            enum: ["lecture", "lab", "discussion", "assessment"],
          },
        },
      ],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    accessLevel: {
      type: String,
      enum: ["free", "member", "premium"],
      default: "free",
    },
    completionCriteria: {
      minScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
      },
      requiredModules: [Number],
      finalProject: {
        type: Boolean,
        default: false,
      },
    },
    stats: {
      totalEnrollments: {
        type: Number,
        default: 0,
      },
      completedEnrollments: {
        type: Number,
        default: 0,
      },
      averageCompletionTime: {
        type: Number,
        default: 0,
      },
      passRate: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ "rating.average": -1 });
courseSchema.index({ enrollmentCount: -1 });

// Virtual for completion rate
courseSchema.virtual("completionRate").get(function () {
  if (this.stats.totalEnrollments === 0) return 0;
  return (this.stats.completedEnrollments / this.stats.totalEnrollments) * 100;
});

// Virtual for isFull
courseSchema.virtual("isFull").get(function () {
  if (!this.maxEnrollment) return false;
  return this.enrollmentCount >= this.maxEnrollment;
});

// Method to increment enrollment
courseSchema.methods.incrementEnrollment = function () {
  this.enrollmentCount += 1;
  this.stats.totalEnrollments += 1;
  return this.save();
};

// Method to decrement enrollment
courseSchema.methods.decrementEnrollment = function () {
  if (this.enrollmentCount > 0) {
    this.enrollmentCount -= 1;
  }
  return this.save();
};

// Method to add rating
courseSchema.methods.addRating = function (rating) {
  const totalRating = this.rating.average * this.rating.count + rating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to update completion stats
courseSchema.methods.updateCompletionStats = function (completionTime) {
  this.stats.completedEnrollments += 1;
  
  // Update average completion time
  const totalTime = this.stats.averageCompletionTime * (this.stats.completedEnrollments - 1) + completionTime;
  this.stats.averageCompletionTime = totalTime / this.stats.completedEnrollments;
  
  // Update pass rate (assuming completion means passing)
  this.stats.passRate = (this.stats.completedEnrollments / this.stats.totalEnrollments) * 100;
  
  return this.save();
};

// Static method to find courses by category
courseSchema.statics.findByCategory = function (category) {
  return this.find({ category, status: "published" });
};

// Static method to find courses by level
courseSchema.statics.findByLevel = function (level) {
  return this.find({ level, status: "published" });
};

// Static method to find free courses
courseSchema.statics.findFree = function () {
  return this.find({ price: 0, status: "published" });
};

// Static method to find top-rated courses
courseSchema.statics.findTopRated = function (limit = 10) {
  return this.find({ status: "published" })
    .sort({ "rating.average": -1, "rating.count": -1 })
    .limit(limit);
};

// Static method to find popular courses
courseSchema.statics.findPopular = function (limit = 10) {
  return this.find({ status: "published" })
    .sort({ enrollmentCount: -1 })
    .limit(limit);
};

module.exports = mongoose.model("Course", courseSchema); 