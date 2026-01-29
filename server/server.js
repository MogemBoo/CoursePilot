/**
 * CoursePilot Backend Server
 * AI-Powered Supplementary Learning Platform
 * 
 * Part 1: Content Management System (CMS)
 * Part 4: Content Validation & Evaluation
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ===========================================
// 1. CONFIGURATION
// ===========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// ===========================================
// 2. MULTER SETUP (File Uploads)
// ===========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-python',
    'text/javascript',
    'application/javascript',
    'text/html',
    'text/css',
    'application/json',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.ms-powerpoint', // ppt
  ];
  
  // Also allow by extension
  const allowedExtensions = ['.pdf', '.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.pptx', '.ppt', '.java', '.c', '.cpp', '.h'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype} (${ext})`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// ===========================================
// 3. DATABASE CONNECTION
// ===========================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/coursepilot';

console.log('🔄 Connecting to MongoDB...');
console.log('   URI:', MONGO_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('⚠️  Server will continue without database. Some features may not work.');
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// ===========================================
// 4. IMPORT MODELS
// ===========================================

const File = require('./models/File');

// ===========================================
// 5. API ROUTES
// ===========================================

// Health Check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CoursePilot API is Running!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /upload',
      files: 'GET /api/files',
      materials: 'GET /api/materials',
      validate: 'POST /api/validate'
    }
  });
});

// ===========================================
// FILE UPLOAD ROUTES (Part 1: CMS)
// ===========================================

// Upload single file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📤 File uploaded: ${req.file.filename}`);

    // Save file info to database
    const fileDoc = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.body.fileType || 'Theory',
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'General',
      description: req.body.description || '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    await fileDoc.save();

    res.status(201).json({
      message: 'File uploaded successfully!',
      file: {
        id: fileDoc._id,
        fileName: fileDoc.fileName,
        fileType: fileDoc.fileType,
        size: fileDoc.size,
        url: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple files
app.post('/upload/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const savedFiles = [];
    for (const file of req.files) {
      const fileDoc = new File({
        fileName: file.originalname,
        filePath: file.path,
        fileType: req.body.fileType || 'Theory',
        mimeType: file.mimetype,
        size: file.size
      });
      await fileDoc.save();
      savedFiles.push(fileDoc);
    }

    console.log(`📤 ${savedFiles.length} files uploaded`);

    res.status(201).json({
      message: `${savedFiles.length} files uploaded successfully!`,
      files: savedFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    const query = {};

    if (type) query.fileType = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const files = await File.find(query).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single file
app.get('/api/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for materials (compatibility with frontend)
app.get('/api/materials', async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reprocess file (re-extract text, regenerate embeddings)
app.post('/api/files/reprocess/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Update status to processing
    file.status = 'processing';
    await file.save();
    
    // TODO: Add actual reprocessing logic (text extraction, embeddings, etc.)
    
    res.json({ message: 'Reprocessing started', file });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// VALIDATION ROUTES (Part 4)
// ===========================================

const VALIDATION_SERVICE_URL = process.env.VALIDATION_SERVICE_URL || 'http://localhost:5002';

// Helper to call Python validation service
async function callValidationService(endpoint, data) {
  try {
    const response = await fetch(`${VALIDATION_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.log('⚠️ Validation service not available:', error.message);
    return null;
  }
}

// Validate content
app.post('/api/validate', async (req, res) => {
  try {
    const { content, type, language, sourceContext } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Try Python validation service
    const result = await callValidationService('/api/validate', {
      content,
      type: type || 'theory',
      language: language || 'python',
      source_context: sourceContext
    });

    if (result) {
      return res.json(result);
    }

    // Fallback: Basic validation
    const isValid = content.length > 50;
    res.json({
      is_valid: isValid,
      score: isValid ? 75 : 25,
      feedback: isValid ? 'Content meets minimum requirements' : 'Content too short',
      checks: [],
      note: 'Basic validation (Python service unavailable)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate code
app.post('/api/validate/code', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = await callValidationService('/api/validate/code', {
      code,
      language: language || 'python'
    });

    if (result) {
      return res.json(result);
    }

    // Fallback
    res.json({
      is_valid: code.trim().length > 0,
      error: null,
      note: 'Basic check only'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// ERROR HANDLING
// ===========================================

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// General error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 CoursePilot Server running on http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log(`  GET  /health          - Health check`);
  console.log(`  POST /upload          - Upload file`);
  console.log(`  GET  /api/files       - List all files`);
  console.log(`  GET  /api/materials   - List materials`);
  console.log(`  POST /api/validate    - Validate content`);
  console.log('='.repeat(50));
});
