const mongoose = require('mongoose');

const validationResultSchema = new mongoose.Schema({
  generatedContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedContent', required: true, index: true },
  validationType: { 
    type: String, 
    enum: ['syntax', 'compilation', 'grounding', 'rubric', 'test_case', 'ai_evaluation'], 
    required: true 
  },
  status: { type: String, enum: ['pass', 'fail', 'warning'], required: true },
  score: { type: Number, min: 0, max: 100 }, // Optional score out of 100
  details: { type: String }, // Detailed explanation of validation result
  errorMessages: [String], // Array of error messages if validation failed
  
  // Additional context
  metadata: { type: mongoose.Schema.Types.Mixed }, // Extra validation-specific data
  evaluatorModel: { type: String }, // AI model used for evaluation
  
  timestamp: { type: Date, default: Date.now }
});

// Compound index for efficient queries
validationResultSchema.index({ generatedContentId: 1, validationType: 1 });

module.exports = mongoose.model('ValidationResult', validationResultSchema);
