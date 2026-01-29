const mongoose = require('mongoose');

const generatedContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['theory', 'lab'], required: true },
  format: { type: String, enum: ['notes', 'slides', 'pdf', 'code'], required: true },
  topic: { type: String, required: true },
  prompt: { type: String, required: true }, // Original user prompt
  content: { type: String, required: true }, // Generated content
  sourceMaterials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' }], // References to source materials
  programmingLanguage: { type: String }, // For lab/code content
  validationStatus: { type: String, enum: ['pending', 'validated', 'failed'], default: 'pending' },
  
  // Additional metadata
  externalSources: [{
    title: String,
    type: { type: String, default: 'Wikipedia' },
    url: String
  }],
  
  // Generation metadata
  model: { type: String, default: 'gpt-4o' },
  tokensUsed: { type: Number },
  generationTimeMs: { type: Number },
  
  // Validation scores
  overallScore: { type: Number, min: 0, max: 100 },
  validationDetails: { type: mongoose.Schema.Types.Mixed }, // Store detailed validation results
  
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for querying
generatedContentSchema.index({ type: 1, createdAt: -1 });
generatedContentSchema.index({ topic: 'text' });

module.exports = mongoose.model('GeneratedContent', generatedContentSchema);
