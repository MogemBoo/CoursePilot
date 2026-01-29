
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const Content = require('./models/Content');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8000; // Changed to 8000 to match frontend

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/generate', require('./routes/generate'));

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.log("Running in offline mode (DB not connected). API calls requiring DB will fail.");
    }
};

// Multer Setup for Local File Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve Uploaded Files Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET /api/content - Fetch all content
app.get('/api/content', async (req, res) => {
    try {
        const rawContents = await Content.find().sort({ uploadedAt: -1 });

        // Map DB Schema to Frontend Schema
        const contents = rawContents.map(doc => ({
            id: doc._id,
            name: doc.title, // Map title -> name
            type: doc.type,
            category: doc.category,
            tags: doc.metadata?.tags || [],
            description: doc.metadata?.description || '',
            storageUrl: doc.link, // Map link -> storageUrl
            size: doc.size || 'N/A', // Default if missing
            status: doc.status || 'processed',
            chunks: doc.chunks || 0,
            uploadDate: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        res.json(contents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

const { upsertContent, searchContent } = require('./services/vectorStore');

// ... (Existing code) ...

// GET /api/search - Semantic Search
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Query parameter "q" is required' });

        console.log(`Searching for: ${q}`);

        // 1. Get Vector Matches from Pinecone
        const matches = await searchContent(q);

        if (matches.length === 0) {
            return res.json([]);
        }

        // 2. Fetch Full Content from MongoDB
        // Filter out any IDs that are not valid MongoDB ObjectIds to prevent CastError
        const contentIds = matches
            .map(m => m.id)
            .filter(id => mongoose.Types.ObjectId.isValid(id));

        if (contentIds.length === 0) {
            return res.json([]);
        }

        const rawContents = await Content.find({ _id: { $in: contentIds } });

        // 3. Map to Frontend Schema & Preserve Ranking Order
        const contents = matches.map(match => {
            const doc = rawContents.find(c => c._id.toString() === match.id);
            if (!doc) return null;

            return {
                id: doc._id,
                name: doc.title,
                type: doc.type,
                category: doc.category,
                tags: doc.metadata?.tags || [],
                description: doc.metadata?.description || '',
                storageUrl: doc.link,
                size: doc.size || 'N/A',
                status: doc.status,
                relevance: match.score // Add score for debug/display
            };
        }).filter(item => item !== null);

        res.json(contents);

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: 'Search Failed', error: error.message });
    }
});

// POST /api/content/upload - Upload file locally and save metadata
app.post('/api/content/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.file;
        const { category, tags, description, topic, week, contentType } = req.body;
        const parsedTags = tags ? JSON.parse(tags) : [];

        // Generate Local URL
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

        // Save Metadata to MongoDB
        const content = new Content({
            title: file.originalname,
            type: file.originalname.split('.').pop(),
            category: category || 'Other',
            link: publicUrl,
            contentType: contentType || 'file',
            metadata: {
                topic: topic || '',
                week: week ? parseInt(week) : null,
                tags: parsedTags,
                description: description
            },
            size: (file.size / 1024).toFixed(2) + ' KB',
            status: 'processed'
        });

        const savedContent = await content.save();

        // --- VECTOR STORE INTEGRATION ---
        // Asynchronously upsert to Pinecone (don't block response)
        upsertContent(savedContent).catch(err => console.error("Background Upsert Failed:", err));
        // --------------------------------

        res.status(201).json(savedContent);

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload Failed', error: error.message });
    }
});

// DELETE /api/content/:id
app.delete('/api/content/:id', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) return res.status(404).json({ message: 'Content not found' });

        // Delete from Supabase (if URL is valid supabase URL)
        // For now, simpler implementation: just delete from Mongo

        await Content.findByIdAndDelete(req.params.id);
        res.json({ message: 'Content deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Delete Failed', error: error.message });
    }
});


// Start Server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
