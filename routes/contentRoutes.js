const express = require('express');
const multer = require('multer');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

const CourseMaterial = require('../models/CourseMaterial');
const { env, assertRagEnv } = require('../config/env');
const { getSupabase } = require('../services/clients/supabaseClient');
const { ingestMaterial } = require('../services/ingestionService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

function inferMaterialType(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'slide';
  if (['md', 'markdown', 'txt'].includes(ext)) return 'note';
  if (['py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'go', 'rs'].includes(ext)) return 'code';
  return 'note';
}

function toCmsListItem(doc) {
  return {
    id: doc._id.toString(),
    name: doc.originalFileName || doc.title,
    type: doc.type === 'slide' ? 'pptx' : doc.type, // CMS UI expects 'pptx' token
    category: doc.category || 'Other',
    tags: doc.metadata?.tags || [],
    uploadDate: new Date(doc.uploadedAt).toISOString().split('T')[0],
    size: doc.sizeBytes ? `${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB` : '',
    status: doc.processingStatus,
    chunks: doc.chunksCount || 0,
    description: doc.metadata?.description || '',
    topic: doc.metadata?.topic || '',
    week: doc.metadata?.week ?? '',
    contentType: doc.contentType || '',
    link: doc.link || null,
  };
}

// Categories endpoint (CMS dropdown)
router.get('/api/categories', async (req, res) => {
  // Required by hackathon: Theory/Lab. Also support additional custom categories.
  const base = ['Theory', 'Lab', 'Machine Learning', 'Deep Learning', 'Programming', 'Computer Science', 'Mathematics', 'Other'];
  res.json({ categories: ['All', ...base] });
});

// List content (CMS)
router.get('/api/content', async (req, res) => {
  const items = await CourseMaterial.find().sort({ uploadedAt: -1 }).limit(200);
  res.json(items.map(toCmsListItem));
});

// Upload content (CMS) -> stores file in Supabase and creates CourseMaterial row
router.post('/api/content/upload', upload.single('file'), async (req, res) => {
  try {
    assertRagEnv();

    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    const category = (req.body.category || 'Other').toString();
    const description = (req.body.description || '').toString();
    const topic = (req.body.topic || '').toString();
    const contentTypeField = (req.body.contentType || '').toString();
    const weekRaw = (req.body.week || '').toString();
    const week = weekRaw ? Number(weekRaw) : undefined;
    let tags = [];
    try {
      tags = JSON.parse(req.body.tags || '[]');
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }

    const sb = getSupabase();
    const originalName = req.file.originalname || `upload-${Date.now()}`;
    const ext = (originalName.split('.').pop() || '').toLowerCase();
    const objectPath = `${Date.now()}-${uuidv4()}-${originalName}`.replace(/[^\w.\-()/ ]/g, '_');

    const contentType = req.file.mimetype || mime.lookup(originalName) || 'application/octet-stream';

    const { error: upErr } = await sb.storage
      .from(env.supabaseBucket)
      .upload(objectPath, req.file.buffer, {
        contentType,
        upsert: false,
      });

    if (upErr) return res.status(500).json({ error: `Supabase upload failed: ${upErr.message}` });

    let publicUrl = null;
    if (env.supabasePublicBucket) {
      const { data } = sb.storage.from(env.supabaseBucket).getPublicUrl(objectPath);
      publicUrl = data?.publicUrl || null;
    }

    // NOTE: For hackathon we don’t implement auth yet; default uploadedBy to the first admin if present
    const uploadedBy = req.body.uploadedBy || undefined;

    const doc = await CourseMaterial.create({
      title: originalName,
      type: inferMaterialType(originalName),
      category,
      link: publicUrl,
      filePath: objectPath,
      originalFileName: originalName,
      mimeType: contentType,
      sizeBytes: req.file.size,
      processingStatus: 'pending',
      contentType: contentTypeField || undefined,
      metadata: {
        tags,
        description,
        topic: topic || undefined,
        week: Number.isFinite(week) ? week : undefined,
      },
      uploadedBy,
    });

    // Trigger ingestion in background so UI feels instant
    setImmediate(() => {
      ingestMaterial(doc._id.toString()).catch((err) => {
        console.error('❌ Ingestion failed for', doc._id.toString(), err?.message || err);
      });
    });

    res.status(201).json({ message: 'Uploaded', materialId: doc._id.toString(), item: toCmsListItem(doc) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete content (CMS)
router.delete('/api/content/:id', async (req, res) => {
  try {
    assertRagEnv();

    const doc = await CourseMaterial.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // delete file from supabase (best-effort)
    if (doc.filePath) {
      const sb = getSupabase();
      await sb.storage.from(env.supabaseBucket).remove([doc.filePath]);
    }

    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a short-lived signed URL for viewing/downloading (for private buckets)
router.get('/api/content/:id/open', async (req, res) => {
  try {
    assertRagEnv();

    const doc = await CourseMaterial.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (doc.link) return res.json({ url: doc.link });
    if (!doc.filePath) return res.status(400).json({ error: 'No filePath on material' });

    const sb = getSupabase();
    const { data, error } = await sb.storage.from(env.supabaseBucket).createSignedUrl(doc.filePath, 60 * 10);
    if (error) {
      console.error('❌ Supabase createSignedUrl error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ url: data.signedUrl });
  } catch (e) {
    console.error('❌ /api/content/:id/open error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

