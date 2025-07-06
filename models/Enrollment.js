const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["enrolled", "in_progress", "completed", "dropped", "failed"],
      default: "enrolled",
    },
    certificate: {
      issued: {
        type: Boolean,
        default: false,
      },
      certificateId: {
        type: String,
        unique: true,
        sparse: true,
      },
      issuedDate: {
        type: Date,
      },
      downloadUrl: {
        type: String,
      },
    },
    assignments: [
      {
        moduleId: {
          type: Number,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        submittedDate: {
          type: Date,
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "submitted", "graded", "late"],
          default: "pending",
        },
        feedback: {
          type: String,
          trim: true,
        },
        attempts: {
          type: Number,
          default: 0,
        },
      },
    ],
    moduleProgress: [
      {
        moduleId: {
          type: Number,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completionDate: {
          type: Date,
        },
        timeSpent: {
          type: Number,
          default: 0, // in minutes
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    finalScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number,
      default: 0, // total time spent in minutes
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    notes: [
      {
        content: {
          type: String,
          trim: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    achievements: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        earnedDate: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["milestone", "excellence", "completion"],
        },
      },
    ],
    payment: {
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending",
      },
      paymentDate: {
        type: Date,
      },
      paymentMethod: {
        type: String,
      },
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    mentorSessions: [
      {
        date: {
          type: Date,
          required: true,
        },
        duration: {
          type: Number,
          required: true, // in minutes
        },
        notes: {
          type: String,
          trim: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ "certificate.issued": 1 });
enrollmentSchema.index({ completionDate: -1 });

// Virtual for isCompleted
enrollmentSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

// Virtual for isOverdue
enrollmentSchema.virtual("isOverdue").get(function () {
  if (this.status === "completed") return false;
  
  const course = this.courseId; // This would need to be populated
  if (!course || !course.schedule || !course.schedule.endDate) return false;
  
  return new Date() > course.schedule.endDate;
});

// Virtual for timeToComplete
enrollmentSchema.virtual("timeToComplete").get(function () {
  if (!this.completionDate || !this.startDate) return null;
  return this.completionDate - this.startDate;
});

// Method to update progress
enrollmentSchema.methods.updateProgress = function () {
  if (!this.moduleProgress || this.moduleProgress.length === 0) {
    this.progress = 0;
    return this.save();
  }

  const completedModules = this.moduleProgress.filter(
    (module) => module.completed
  ).length;
  const totalModules = this.moduleProgress.length;
  
  this.progress = Math.round((completedModules / totalModules) * 100);
  
  // Check if course is completed
  if (this.progress === 100 && this.status !== "completed") {
    this.status = "completed";
    this.completionDate = new Date();
  }
  
  return this.save();
};

// Method to complete module
enrollmentSchema.methods.completeModule = function (moduleId, score = null) {
  const moduleProgress = this.moduleProgress.find(
    (mp) => mp.moduleId === moduleId
  );
  
  if (moduleProgress) {
    moduleProgress.completed = true;
    moduleProgress.completionDate = new Date();
    if (score !== null) {
      moduleProgress.score = score;
    }
  }
  
  this.lastAccessed = new Date();
  return this.updateProgress();
};

// Method to submit assignment
enrollmentSchema.methods.submitAssignment = function (moduleId, assignmentData) {
  const assignment = this.assignments.find(
    (a) => a.moduleId === moduleId && a.title === assignmentData.title
  );
  
  if (assignment) {
    assignment.submittedDate = new Date();
    assignment.status = "submitted";
    assignment.attempts += 1;
    
    // Check if late
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      assignment.status = "late";
    }
  }
  
  this.lastAccessed = new Date();
  return this.save();
};

// Method to issue certificate
enrollmentSchema.methods.issueCertificate = function () {
  if (this.status === "completed" && !this.certificate.issued) {
    this.certificate.issued = true;
    this.certificate.issuedDate = new Date();
    this.certificate.certificateId = `CERT-${this.userId}-${this.courseId}-${Date.now()}`;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add achievement
enrollmentSchema.methods.addAchievement = function (achievement) {
  this.achievements.push(achievement);
  return this.save();
};

// Method to add note
enrollmentSchema.methods.addNote = function (content) {
  this.notes.push({ content });
  return this.save();
};

// Static method to find user enrollments
enrollmentSchema.statics.findByUser = function (userId) {
  return this.find({ userId }).populate("courseId");
};

// Static method to find course enrollments
enrollmentSchema.statics.findByCourse = function (courseId) {
  return this.find({ courseId }).populate("userId");
};

// Static method to find completed enrollments
enrollmentSchema.statics.findCompleted = function () {
  return this.find({ status: "completed" });
};

// Static method to find enrollments with certificates
enrollmentSchema.statics.findWithCertificates = function () {
  return this.find({ "certificate.issued": true });
};

// Static method to get course statistics
enrollmentSchema.statics.getCourseStats = function (courseId) {
  return this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completedEnrollments: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        averageProgress: { $avg: "$progress" },
        averageScore: { $avg: "$finalScore" },
        averageTimeSpent: { $avg: "$timeSpent" },
      },
    },
  ]);
};

module.exports = mongoose.model("Enrollment", enrollmentSchema); 