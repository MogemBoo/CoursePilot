const mongoose = require('mongoose');

const validationResultSchema = new mongoose.Schema({
  generatedContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'GeneratedContent', required: true },
  validationType: { 
    type: String, 
    enum: ['syntax', 'compilation', 'grounding', 'rubric', 'test_case', 'ai_evaluation'], 
    required: true 
  },
  status: { type: String, enum: ['pass', 'fail', 'warning'], required: true },
  score: { type: Number, min: 0, max: 100 }, // Optional score out of 100
  details: { type: String }, // Detailed explanation of validation result
  errorMessages: [String], // Array of error messages if validation failed
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ValidationResult', validationResultSchema);
