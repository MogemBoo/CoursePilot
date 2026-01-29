const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  contextReferences: [{ 
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' },
    excerpt: String 
  }]
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
  context: {
    lastSearchQuery: String,
    referencedMaterials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial' }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

chatSessionSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
