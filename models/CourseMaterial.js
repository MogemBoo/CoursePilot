const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'slide', 'code', 'link', 'note'], required: true },
  category: { type: String, enum: ['Theory', 'Lab'], required: true },
  link: { type: String }, // Public URL from Supabase Storage
  filePath: { type: String }, // Storage path in Supabase bucket
  content: { type: String }, // Extracted text content for search/indexing
  contentType: { type: String }, // More specific type (e.g., 'lecture_slide', 'lab_manual')
  metadata: {
    topic: { type: String },
    week: { type: Number },
    tags: [String],
    description: { type: String },
    fileSize: { type: Number }, // File size in bytes
    mimeType: { type: String }, // Original MIME type
    status: { type: String, enum: ['uploading', 'processing', 'processed', 'error'], default: 'processed' }
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

// Index for search
courseMaterialSchema.index({ title: 'text', 'metadata.description': 'text', 'metadata.tags': 'text' });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
