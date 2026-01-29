const express = require('express');
const router = express.Router();

const { 
  generateTheoryContent, 
  generateLabContent, 
  getGeneratedContent,
  SUPPORTED_LANGUAGES 
} = require('../services/contentGenerationService');
const { validateContent, getValidationResults } = require('../services/validationService');
const GeneratedContent = require('../models/GeneratedContent');

// Get supported languages
router.get('/api/generate/languages', (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

// Generate theory content (notes, slides, pdf)
router.post('/api/generate/theory', async (req, res) => {
  try {
    const { topic, prompt, format = 'notes' } = req.body;

    if (!prompt && !topic) {
      return res.status(400).json({ error: 'Either topic or prompt is required' });
    }

    const validFormats = ['notes', 'slides', 'pdf'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ 
        error: `Invalid format. Supported: ${validFormats.join(', ')}` 
      });
    }

    const result = await generateTheoryContent({ 
      topic, 
      prompt: prompt || topic, 
      format 
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Theory generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate lab/code content
router.post('/api/generate/lab', async (req, res) => {
  try {
    const { topic, prompt, language = 'python' } = req.body;

    if (!prompt && !topic) {
      return res.status(400).json({ error: 'Either topic or prompt is required' });
    }

    const result = await generateLabContent({ 
      topic, 
      prompt: prompt || topic, 
      language 
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Lab generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get generated content by ID
router.get('/api/generated/:id', async (req, res) => {
  try {
    const content = await getGeneratedContent(req.params.id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all generated content
router.get('/api/generated', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    
    const query = {};
    if (type && ['theory', 'lab'].includes(type)) {
      query.type = type;
    }

    const contents = await GeneratedContent.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select('type format topic programmingLanguage validationStatus createdAt');

    res.json(contents.map(c => ({
      id: c._id.toString(),
      type: c.type,
      format: c.format,
      topic: c.topic,
      programmingLanguage: c.programmingLanguage,
      validationStatus: c.validationStatus,
      createdAt: c.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate content
router.post('/api/validate/:id', async (req, res) => {
  try {
    const result = await validateContent(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get validation results
router.get('/api/validation/:id', async (req, res) => {
  try {
    const results = await getValidationResults(req.params.id);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete generated content
router.delete('/api/generated/:id', async (req, res) => {
  try {
    const doc = await GeneratedContent.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
