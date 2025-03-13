const mongoose = require("mongoose");

const ResearchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    abstract: { type: String, required: true },
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    publishedDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    references: [{ type: String }],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Research", ResearchSchema);
