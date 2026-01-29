const mongoose = require('mongoose');

const handwrittenNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalImagePath: { type: String, required: true },
  digitizedText: { type: String, required: true },
  format: { type: String, enum: ['markdown', 'latex', 'plain'], default: 'markdown' },
  associatedMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' },
  metadata: {
    course: String,
    topic: String,
    week: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HandwrittenNote', handwrittenNoteSchema);
