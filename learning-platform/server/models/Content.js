
const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Was 'name'
    type: { type: String, required: true },
    category: { type: String, default: 'Other' },
    link: { type: String, required: true }, // Was 'storageUrl'
    contentType: { type: String }, // 'lecture_slide', etc.

    metadata: {
        topic: String,
        week: Number,
        tags: [String],
        description: String,
    },

    // Fields for backward compatibility or our new app features (optional)
    status: { type: String, default: 'processed' },
    size: { type: String },
    chunks: { type: Number, default: 0 },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now } // Was 'createdAt'
}, { collection: 'coursematerials' });

module.exports = mongoose.model('Content', ContentSchema);
