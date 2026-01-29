const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// --- 1. CONFIGURATION ---
app.use(cors());
app.use(express.json());

// MongoDB Connection String - with DNS workaround
const MONGO_URI = "mongodb+srv://DrLaraDey:idk12345@cluster0.spmmxwe.mongodb.net/?appName=Cluster0";

// Supabase Configuration
const SUPABASE_URL = 'https://bbkezevyxwlcvnzrvzzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2V6ZXZ5eHdsY3ZuenJ2enpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTkwODcsImV4cCI6MjA4NTIzNTA4N30.GuQ7T3Lixy0rcupixRvtcCzUFKaagCP7GbtxeW2qURo';
const SUPABASE_BUCKET = 'course_materials';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configure Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/x-python',
      'application/javascript',
      'text/javascript',
      'application/json'
    ];
    // Allow common file extensions
    const allowedExtensions = ['.pdf', '.pptx', '.docx', '.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.java', '.c', '.cpp', '.h'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  }
});

// --- 2. DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.error("❌ Connection Error:", err));

// --- 3. IMPORT MODELS ---
const User = require('./models/User');
const CourseMaterial = require('./models/CourseMaterial');
const ChatSession = require('./models/ChatSession');
const GeneratedContent = require('./models/GeneratedContent');
const ValidationResult = require('./models/ValidationResult');
const HandwrittenNote = require('./models/HandwrittenNote');
const VideoSummary = require('./models/VideoSummary');
const CommunityPost = require('./models/CommunityPost');

// --- 4. HELPER FUNCTIONS ---

// Get or create a default user for uploads (temporary until auth is implemented)
async function getDefaultUser() {
  let user = await User.findOne({ username: 'admin' });
  if (!user) {
    user = await User.create({
      username: 'admin',
      email: 'admin@coursepilot.com',
      passwordHash: 'temporary_hash',
      role: 'admin'
    });
  }
  return user;
}

// Determine file type from extension
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    'pdf': 'pdf',
    'pptx': 'slide',
    'ppt': 'slide',
    'docx': 'note',
    'doc': 'note',
    'txt': 'note',
    'md': 'note',
    'py': 'code',
    'js': 'code',
    'jsx': 'code',
    'ts': 'code',
    'tsx': 'code',
    'java': 'code',
    'c': 'code',
    'cpp': 'code',
    'h': 'code',
    'json': 'code'
  };
  return typeMap[ext] || 'note';
}

// --- 5. API ROUTES ---

// Test Route
app.get('/', (req, res) => {
  res.send('CoursePilot API is Running! 🚀');
});

// ========== CMS CONTENT ROUTES ==========

// GET all content (for CMS library)
app.get('/api/content', async (req, res) => {
  try {
    const { category, type, search } = req.query;
    
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const materials = await CourseMaterial.find(query)
      .sort({ uploadedAt: -1 })
      .populate('uploadedBy', 'username');
    
    // Transform to frontend format
    const content = materials.map(m => ({
      id: m._id,
      name: m.title,
      filename: m.title,
      type: m.type,
      category: m.category,
      size: m.metadata?.fileSize || 0,
      uploadDate: m.uploadedAt,
      status: m.metadata?.status || 'processed',
      url: m.link,
      tags: m.metadata?.tags || [],
      description: m.metadata?.description || '',
      week: m.metadata?.week,
      topic: m.metadata?.topic
    }));
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single content by ID
app.get('/api/content/:id', async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id)
      .populate('uploadedBy', 'username');
    
    if (!material) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json({
      id: material._id,
      name: material.title,
      filename: material.title,
      type: material.type,
      category: material.category,
      size: material.metadata?.fileSize || 0,
      uploadDate: material.uploadedAt,
      status: material.metadata?.status || 'processed',
      url: material.link,
      tags: material.metadata?.tags || [],
      description: material.metadata?.description || '',
      week: material.metadata?.week,
      topic: material.metadata?.topic
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload new content
app.post('/api/content/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const { category = 'Theory', tags = '', description = '', topic = '', week = '' } = req.body;
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${timestamp}_${sanitizedName}`;
    
    console.log(`📤 Uploading to Supabase: ${storagePath}`);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(storagePath);
    
    const fileUrl = urlData.publicUrl;
    console.log(`✅ File uploaded: ${fileUrl}`);
    
    // Get default user
    const defaultUser = await getDefaultUser();
    
    // Save metadata to MongoDB
    const newMaterial = new CourseMaterial({
      title: file.originalname,
      type: getFileType(file.originalname),
      category: category,
      link: fileUrl,
      filePath: storagePath,
      metadata: {
        topic: topic || null,
        week: week ? parseInt(week) : null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        description: description || null,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'processed'
      },
      uploadedBy: defaultUser._id
    });
    
    await newMaterial.save();
    console.log(`✅ Metadata saved to MongoDB: ${newMaterial._id}`);
    
    res.status(201).json({
      message: 'File uploaded successfully!',
      data: {
        id: newMaterial._id,
        name: newMaterial.title,
        filename: newMaterial.title,
        type: newMaterial.type,
        category: newMaterial.category,
        size: file.size,
        uploadDate: newMaterial.uploadedAt,
        status: 'processed',
        url: fileUrl,
        tags: newMaterial.metadata.tags,
        description: newMaterial.metadata.description
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE content
app.delete('/api/content/:id', async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Delete from Supabase Storage if filePath exists
    if (material.filePath) {
      const { error: deleteError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([material.filePath]);
      
      if (deleteError) {
        console.warn('Supabase delete warning:', deleteError);
      } else {
        console.log(`🗑️ Deleted from Supabase: ${material.filePath}`);
      }
    }
    
    // Delete from MongoDB
    await CourseMaterial.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Deleted from MongoDB: ${req.params.id}`);
    
    res.json({ message: 'Content deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST reprocess content (placeholder for future AI processing)
app.post('/api/content/reprocess/:id', async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Update status to processing
    material.metadata.status = 'processing';
    await material.save();
    
    // Simulate processing (in real app, this would trigger AI processing)
    setTimeout(async () => {
      material.metadata.status = 'processed';
      await material.save();
    }, 2000);
    
    res.json({ message: 'Reprocessing started', id: req.params.id });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DASHBOARD ROUTES ==========

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalMaterials = await CourseMaterial.countDocuments();
    const theoryCount = await CourseMaterial.countDocuments({ category: 'Theory' });
    const labCount = await CourseMaterial.countDocuments({ category: 'Lab' });
    
    res.json({
      totalMaterials,
      theoryCount,
      labCount,
      processedCount: totalMaterials,
      pendingCount: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/activity', async (req, res) => {
  try {
    const recentUploads = await CourseMaterial.find()
      .sort({ uploadedAt: -1 })
      .limit(5)
      .select('title type uploadedAt');
    
    const activity = recentUploads.map(m => ({
      type: 'upload',
      message: `Uploaded ${m.title}`,
      timestamp: m.uploadedAt
    }));
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== LEGACY ROUTES (keep for compatibility) ==========

app.post('/api/upload', async (req, res) => {
  try {
    const newFile = new CourseMaterial(req.body);
    await newFile.save();
    res.status(201).json({ message: "File saved to DB!", data: newFile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const materials = await CourseMaterial.find().populate('uploadedBy', 'username');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed Route
app.post('/api/seed', async (req, res) => {
  try {
    const seedScript = require('./scripts/seedData');
    const result = await seedScript();
    res.status(200).json({ message: "Database seeded successfully!", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 6. START SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 CoursePilot API running on http://localhost:${PORT}`);
  console.log(`📦 Supabase bucket: ${SUPABASE_BUCKET}`);
});