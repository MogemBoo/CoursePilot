const CourseMaterial = require('../models/CourseMaterial');
const VectorChunk = require('../models/VectorChunk');

const { embedTexts } = require('./embeddingService');
const { getPineconeIndex } = require('./clients/pineconeClient');

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
  const [qVec] = await embedTexts([query]);
  const index = getPineconeIndex();

  const pineconeFilter = buildPineconeFilter(filters);

  const res = await index.query({
    vector: qVec,
    topK,
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

  return matches.map((m) => {
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

