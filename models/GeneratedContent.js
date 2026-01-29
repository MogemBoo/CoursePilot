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
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GeneratedContent', generatedContentSchema);
