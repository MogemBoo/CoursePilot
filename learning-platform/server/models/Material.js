
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['slide', 'pdf', 'code', 'note'],
        required: true,
    },
    category: {
        type: String,
        enum: ['theory', 'lab'],
        required: true,
    },
    link: {
        type: String, // URL or file path
        required: true,
    },
    week: {
        type: String,
    },
    topic: {
        type: String,
    },
    tags: {
        type: [String],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Material', MaterialSchema);
