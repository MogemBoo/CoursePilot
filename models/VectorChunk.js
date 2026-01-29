const mongoose = require('mongoose');

const vectorChunkSchema = new mongoose.Schema({
  materialId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CourseMaterial', 
    required: true 
  },
  pineconeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  chunkIndex: { 
    type: Number, 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  // --- FIX IS HERE ---
  // Changed from String to Mixed so it can store { title, week, tags... }
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('VectorChunk', vectorChunkSchema);