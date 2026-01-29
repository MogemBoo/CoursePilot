const mongoose = require('mongoose');

const videoSummarySchema = new mongoose.Schema({
  courseMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial', required: true },
  videoUrl: { type: String }, // URL if hosted externally
  filePath: { type: String }, // Path if stored locally
  summaryText: { type: String },
  duration: { type: Number }, // Duration in seconds
  metadata: {
    title: String,
    description: String,
    thumbnailUrl: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VideoSummary', videoSummarySchema);
