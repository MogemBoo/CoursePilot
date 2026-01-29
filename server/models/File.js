/**
 * File Model
 * Stores metadata for uploaded course materials
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  // Basic file info
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  
  // Classification
  fileType: {
    type: String,
    enum: ['Theory', 'Lab'],
    default: 'Theory'
  },
  category: {
    type: String,
    default: 'General'
  },
  
  // File metadata
  mimeType: {
    type: String
  },
  size: {
    type: Number // in bytes
  },
  
  // Content info
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  
  // Processing status
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'error'],
    default: 'pending'
  },
  
  // For RAG/Search
  embedding: {
    type: [Number], // Vector embedding for semantic search
    default: []
  },
  extractedText: {
    type: String, // Extracted text content for search
    default: ''
  },
  
  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
});

// Index for search
fileSchema.index({ fileName: 'text', description: 'text', extractedText: 'text' });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  const filename = this.filePath.split('/').pop();
  return `/uploads/${filename}`;
});

// Ensure virtuals are included in JSON
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);
