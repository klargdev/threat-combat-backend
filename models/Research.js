const mongoose = require("mongoose");

const ResearchSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },
    abstract: { 
      type: String, 
      required: true,
      trim: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    authors: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }],
    collaborators: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    researchArea: {
      type: String,
      required: true,
      enum: [
        "Memory Forensics",
        "Network Forensics", 
        "Incident Response",
        "Malware Analysis",
        "AI in DFIR",
        "Digital Forensics",
        "Threat Intelligence",
        "Mobile Forensics",
        "Cloud Forensics",
        "IoT Forensics"
      ]
    },
    status: { 
      type: String, 
      enum: ["draft", "in_progress", "under_review", "published", "funded"], 
      default: "draft" 
    },
    funding: {
      amount: {
        type: Number,
        default: 0
      },
      source: {
        type: String,
        trim: true
      },
      grantId: {
        type: String,
        trim: true
      },
      applicationDate: {
        type: Date
      },
      approvalDate: {
        type: Date
      }
    },
    publishedDate: { 
      type: Date, 
      default: Date.now 
    },
    journal: {
      type: String,
      default: "Threat Combat Annual DFIR Journal",
      trim: true
    },
    conference: {
      type: String,
      trim: true
    },
    references: [{ 
      type: String,
      trim: true 
    }],
    tags: [{
      type: String,
      trim: true
    }],
    attachments: [{
      filename: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
    citations: {
      type: Number,
      default: 0
    },
    impact: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium"
    },
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club"
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "revision_requested"],
      default: "pending"
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewComments: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
ResearchSchema.index({ researchArea: 1, status: 1 });
ResearchSchema.index({ authors: 1 });
ResearchSchema.index({ club: 1 });
ResearchSchema.index({ "funding.amount": -1 });
ResearchSchema.index({ publishedDate: -1 });

// Virtual for citation count
ResearchSchema.virtual("citationCount").get(function() {
  return this.citations || 0;
});

// Method to increment views
ResearchSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
ResearchSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Method to add collaborator
ResearchSchema.methods.addCollaborator = function(userId) {
  if (!this.collaborators.includes(userId)) {
    this.collaborators.push(userId);
  }
  return this.save();
};

// Method to remove collaborator
ResearchSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to apply for funding
ResearchSchema.methods.applyForFunding = function(fundingData) {
  this.funding = {
    ...this.funding,
    ...fundingData,
    applicationDate: new Date()
  };
  this.status = "funded";
  return this.save();
};

// Static method to find funded research
ResearchSchema.statics.findFunded = function() {
  return this.find({ "funding.amount": { $gt: 0 } });
};

// Static method to find research by area
ResearchSchema.statics.findByArea = function(area) {
  return this.find({ researchArea: area });
};

// Static method to find collaborative research
ResearchSchema.statics.findCollaborative = function() {
  return this.find({ collaborators: { $exists: true, $ne: [] } });
};

// Static method to find research by club
ResearchSchema.statics.findByClub = function(clubId) {
  return this.find({ club: clubId });
};

module.exports = mongoose.model("Research", ResearchSchema);
