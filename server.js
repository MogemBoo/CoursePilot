const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { env } = require('./config/env');

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in environment. Create a .env (see .env.example).');
  process.exit(1);
}

// --- 2. DATABASE CONNECTION ---
// Set mongoose to buffer commands if connection is not ready
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("⚠️  Server will continue running, but database features will be limited.");
    console.log("💡 Check your MONGO_URI in .env file and ensure MongoDB is accessible.");
  }
};

// Connect to database (non-blocking)
connectDB();

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully!');
});

// --- 3. IMPORT MODELS ---
const User = require('./models/User');
const CourseMaterial = require('./models/CourseMaterial');
const ChatSession = require('./models/ChatSession');
const GeneratedContent = require('./models/GeneratedContent');
const ValidationResult = require('./models/ValidationResult');
const HandwrittenNote = require('./models/HandwrittenNote');
const VideoSummary = require('./models/VideoSummary');
const CommunityPost = require('./models/CommunityPost');
const VectorChunk = require('./models/VectorChunk');

// --- 3b. ROUTES ---
const contentRoutes = require('./routes/contentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const generationRoutes = require('./routes/generationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// --- 4. API ROUTES ---
app.use(contentRoutes);
app.use(searchRoutes);
app.use(generationRoutes);
app.use(chatRoutes);
app.use(dashboardRoutes);

// Test Route (To check if server is running)
app.get('/', (req, res) => {
  res.send('ScholarSync API is Running!');
});

// Upload Route (For Part 1: CMS)
app.post('/api/upload', async (req, res) => {
  try {
    const newFile = new CourseMaterial(req.body);
    await newFile.save();
    res.status(201).json({ message: "File saved to DB!", data: newFile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Route (For Part 2 - Simple Fetch)
app.get('/api/materials', async (req, res) => {
  try {
    const materials = await CourseMaterial.find().populate('uploadedBy', 'username');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed Route (Development only - Populate database with sample data)
app.post('/api/seed', async (req, res) => {
  try {
    const seedScript = require('./scripts/seedData');
    const result = await seedScript();
    res.status(200).json({ message: "Database seeded successfully!", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. START SERVER ---
const PORT = env.port || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});