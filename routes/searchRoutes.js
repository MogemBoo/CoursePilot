const express = require('express');
const CourseMaterial = require('../models/CourseMaterial');
const { semanticSearch } = require('../services/searchService');
const { ingestMaterial } = require('../services/ingestionService');
const { assertRagEnv } = require('../config/env');

const router = express.Router();

// Semantic search endpoint
router.post('/api/search/semantic', async (req, res) => {
  try {
    assertRagEnv();

    const { query, topK, filters } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Missing query' });
    }

    const results = await semanticSearch({
      query: query.trim(),
      topK: Math.min(Number(topK || 5), 10),
      filters: filters || {},
    });

    res.json({ query: query.trim(), results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Suggestions endpoint (autocomplete) based on Mongo metadata
router.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().toLowerCase().trim();
    const limit = Math.min(Number(req.query.limit || 8), 20);

    // Simple suggestion pool: titles + topics + tags + categories
    const docs = await CourseMaterial.find()
      .select('title category metadata.topic metadata.tags')
      .limit(300)
      .lean();

    const pool = [];
    for (const d of docs) {
      if (d.title) pool.push(d.title);
      if (d.category) pool.push(d.category);
      if (d.metadata?.topic) pool.push(d.metadata.topic);
      if (Array.isArray(d.metadata?.tags)) pool.push(...d.metadata.tags);
    }

    const uniq = Array.from(new Set(pool.map((s) => (s || '').toString().trim()).filter(Boolean)));
    const filtered = q ? uniq.filter((s) => s.toLowerCase().includes(q)) : uniq;
    res.json({ suggestions: filtered.slice(0, limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reprocess material: triggers ingestion pipeline again
router.post('/api/content/reprocess/:id', async (req, res) => {
  try {
    assertRagEnv();
    const result = await ingestMaterial(req.params.id);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

