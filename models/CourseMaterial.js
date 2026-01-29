const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'slide', 'code', 'link', 'note'], required: true },
  category: { type: String, enum: ['Theory', 'Lab'], required: true },
  link: { type: String }, // URL to the file or external resource
  filePath: { type: String }, // Path if storing files locally
  content: { type: String }, // Text content for search/indexing
  contentType: { type: String }, // More specific type (e.g., 'lecture_slide', 'lab_manual', 'textbook_chapter')
  metadata: {
    topic: { type: String },
    week: { type: Number },
    tags: [String],
    description: { type: String }
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
