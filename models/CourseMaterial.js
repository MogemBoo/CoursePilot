const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'slide', 'code', 'link', 'note'], required: true },
  // Allows both hackathon “Theory/Lab” and arbitrary course categories (e.g., “Machine Learning”)
  category: { type: String, required: true, default: 'Other' },
  link: { type: String }, // URL to the file or external resource
  filePath: { type: String }, // Storage path (Supabase object path)
  content: { type: String }, // Text content for search/indexing
  contentType: { type: String }, // More specific type (e.g., 'lecture_slide', 'lab_manual', 'textbook_chapter')
  originalFileName: { type: String },
  mimeType: { type: String },
  sizeBytes: { type: Number },
  processingStatus: { type: String, enum: ['pending', 'processing', 'processed', 'error'], default: 'pending' },
  chunksCount: { type: Number, default: 0 },
  lastProcessedAt: { type: Date },
  metadata: {
    topic: { type: String },
    week: { type: Number },
    tags: [String],
    description: { type: String }
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
