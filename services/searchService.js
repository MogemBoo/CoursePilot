const CourseMaterial = require('../models/CourseMaterial');
const VectorChunk = require('../models/VectorChunk');

const { embedTexts } = require('./embeddingService');
const { getPineconeIndex } = require('./clients/pineconeClient');

function looksLikeFilename(q) {
  const s = (q || '').trim();
  if (!s) return false;
  if (/\.(pdf|py|js|ts|md|txt|pptx|java|cpp|c)$/i.test(s)) return true;
  if (s.length <= 20 && !/\s/.test(s)) return true; // short, no spaces
  return false;
}

async function filenameSearch({ query, topK = 5, filters }) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const allMaterials = await CourseMaterial.find({
    $or: [
      { originalFileName: { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } },
    ],
  })
    .sort({ uploadedAt: -1 })
    .limit(50)
    .lean();

  if (!allMaterials.length) return [];

  // Deduplicate by filename: one result per unique file name (e.g. test.pdf once even if uploaded 3x)
  const seenNames = new Set();
  const materials = allMaterials.filter((m) => {
    const name = (m.originalFileName || m.title || '').toLowerCase().trim();
    if (!name || seenNames.has(name)) return false;
    seenNames.add(name);
    return true;
  }).slice(0, topK);

  const materialIds = materials.map((m) => m._id);
  const chunks = await VectorChunk.find({
    materialId: { $in: materialIds },
  })
    .sort({ materialId: 1, chunkIndex: 1 })
    .lean();

  const materialById = new Map(materials.map((m) => [m._id.toString(), m]));

  // Deduplicate by materialId: one result per file
  const seen = new Set();
  const unique = chunks.filter((c) => {
    const mid = (c.materialId || '').toString();
    if (seen.has(mid)) return false;
    seen.add(mid);
    return true;
  });

  return unique.slice(0, topK).map((c) => {
    const m = materialById.get(c.materialId?.toString());
    return {
      score: 1,
      chunkId: c.pineconeId,
      snippet: c.text || '',
      source: {
        materialId: c.materialId?.toString() || null,
        title: m?.title || '',
        category: m?.category || '',
        type: m?.type || '',
        topic: m?.metadata?.topic || '',
        week: m?.metadata?.week ?? null,
        tags: m?.metadata?.tags || [],
        fileName: m?.originalFileName || m?.title || '',
        openUrl: m?.link || null,
        openUrlEndpoint: c.materialId ? `/api/content/${c.materialId}/open` : null,
      },
    };
  });
}

function buildPineconeFilter(filters = {}) {
  const f = {};

  if (filters.category && filters.category !== 'all') {
    f.category = filters.category;
  }
  if (filters.type && filters.type !== 'all') {
    f.type = filters.type;
  }

  // Week range (stored as metadata.week)
  if (filters.weekFrom != null || filters.weekTo != null) {
    f.week = {};
    if (filters.weekFrom != null) f.week.$gte = Number(filters.weekFrom);
    if (filters.weekTo != null) f.week.$lte = Number(filters.weekTo);
  }

  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length) {
    // Pinecone filter: match if any tag is present
    f.tags = { $in: filters.tags };
  }

  return Object.keys(f).length ? f : undefined;
}

async function semanticSearch({ query, topK = 5, filters }) {
  const q = (query || '').trim();
  const k = Math.min(Number(topK) || 5, 10);

  // Hybrid: when query looks like a filename, try filename match first
  if (looksLikeFilename(q)) {
    const filenameResults = await filenameSearch({ query: q, topK: k, filters });
    if (filenameResults.length > 0) {
      return filenameResults;
    }
  }

  const [qVec] = await embedTexts([query]);
  const index = getPineconeIndex();

  const pineconeFilter = buildPineconeFilter(filters);

  const res = await index.query({
    vector: qVec,
    topK: k,
    includeMetadata: true,
    filter: pineconeFilter,
  });

  const matches = res.matches || [];
  const pineconeIds = matches.map((m) => m.id).filter(Boolean);
  const chunkDocs = await VectorChunk.find({ pineconeId: { $in: pineconeIds } }).lean();
  const chunkById = new Map(chunkDocs.map((d) => [d.pineconeId, d]));

  // Preload materials for links
  const materialIds = Array.from(
    new Set(
      matches
        .map((m) => m.metadata?.materialId)
        .filter(Boolean)
        .map((s) => s.toString())
    )
  );
  const materials = await CourseMaterial.find({ _id: { $in: materialIds } }).lean();
  const materialById = new Map(materials.map((m) => [m._id.toString(), m]));

  // Deduplicate by materialId: one result per file (keep highest-scoring chunk)
  const seen = new Set();
  const unique = matches.filter((m) => {
    const mid = (m.metadata?.materialId || '').toString();
    if (seen.has(mid)) return false;
    seen.add(mid);
    return true;
  });

  return unique.map((m) => {
    const md = m.metadata || {};
    const chunk = chunkById.get(m.id);
    const material = materialById.get((md.materialId || '').toString());

    return {
      score: m.score,
      chunkId: m.id,
      snippet: chunk?.text || '',
      source: {
        materialId: md.materialId || null,
        title: md.title || material?.title || '',
        category: md.category || material?.category || '',
        type: md.type || material?.type || '',
        topic: md.topic || material?.metadata?.topic || '',
        week: md.week ?? material?.metadata?.week ?? null,
        tags: md.tags || material?.metadata?.tags || [],
        fileName: md.fileName || material?.originalFileName || '',
        openUrl: material?.link || null,
        openUrlEndpoint: md.materialId ? `/api/content/${md.materialId}/open` : null,
      },
    };
  });
}

module.exports = { semanticSearch };

