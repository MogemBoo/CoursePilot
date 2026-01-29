const mongoose = require('mongoose');

const vectorChunkSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMaterial', required: true, index: true },
  pineconeId: { type: String, required: true, unique: true, index: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  // location hints for “open in context”
  pageStart: { type: Number },
  pageEnd: { type: Number },
  lineStart: { type: Number },
  lineEnd: { type: Number },
  metadata: {
    title: String,
    category: String,
    type: String,
    topic: String,
    week: Number,
    tags: [String],
    fileName: String,
    fileExt: String,
  },
  createdAt: { type: Date, default: Date.now },
});

vectorChunkSchema.index({ materialId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('VectorChunk', vectorChunkSchema);

