const CourseMaterial = require('../models/CourseMaterial');
const VectorChunk = require('../models/VectorChunk');

const { getSupabase } = require('./clients/supabaseClient');
const { getPineconeIndex } = require('./clients/pineconeClient');
const { extractText } = require('./textExtractor');
const { chunkText } = require('./chunker');
const { embedTexts } = require('./embeddingService');
const { env } = require('../config/env');

function pineconeIdFor(materialId, chunkIndex) {
  return `mat_${materialId}_chunk_${chunkIndex}`;
}

function extOf(fileName) {
  const parts = (fileName || '').split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
}

async function downloadMaterialBuffer(material) {
  const sb = getSupabase();
  const { data, error } = await sb.storage.from(env.supabaseBucket).download(material.filePath);
  if (error) throw new Error(`Supabase download failed: ${error.message}`);
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

async function clearExistingVectors(materialId) {
  const index = getPineconeIndex();
  const docs = await VectorChunk.find({ materialId });
  if (docs.length) {
    await index.deleteMany(docs.map((d) => d.pineconeId));
    await VectorChunk.deleteMany({ materialId });
  }
}

async function ingestMaterial(materialId) {
  const material = await CourseMaterial.findById(materialId);
  if (!material) throw new Error('Material not found');
  if (!material.filePath) throw new Error('Material has no stored filePath');

  material.processingStatus = 'processing';
  await material.save();

  try {
    await clearExistingVectors(materialId);

    const buffer = await downloadMaterialBuffer(material);
    const extracted = await extractText({
      buffer,
      fileName: material.originalFileName || material.title,
      mimeType: material.mimeType,
    });

    if (extracted.warning) {
      material.processingStatus = 'error';
      material.metadata = material.metadata || {};
      material.metadata.description = material.metadata.description || extracted.warning;
      await material.save();
      return { materialId, chunks: 0, warning: extracted.warning };
    }

    const text = extracted.text || '';
    if (!text.trim()) {
      material.processingStatus = 'error';
      await material.save();
      return { materialId, chunks: 0, warning: 'No text extracted' };
    }

    const chunks = chunkText(text, { maxChars: 900, overlapChars: 120 });
    const embeddings = await embedTexts(chunks);
    const index = getPineconeIndex();

    const vectors = embeddings.map((values, i) => {
      const pineconeId = pineconeIdFor(materialId, i);
      const md = {
        materialId: materialId.toString(),
        chunkIndex: i,
        title: material.title,
        category: material.category,
        type: material.type,
        topic: material.metadata?.topic || '',
        week: material.metadata?.week || null,
        tags: material.metadata?.tags || [],
        fileName: material.originalFileName || material.title,
        fileExt: extOf(material.originalFileName || material.title),
      };
      return { id: pineconeId, values, metadata: md };
    });

    // Upsert to Pinecone in batches
    const batchSize = 50;
    for (let start = 0; start < vectors.length; start += batchSize) {
      const slice = vectors.slice(start, start + batchSize);
      await index.upsert(slice);
    }

    // Save chunk metadata locally (Mongo)
    const chunkDocs = chunks.map((t, i) => ({
      materialId,
      pineconeId: pineconeIdFor(materialId, i),
      chunkIndex: i,
      text: t,
      metadata: {
        title: material.title,
        category: material.category,
        type: material.type,
        topic: material.metadata?.topic,
        week: material.metadata?.week,
        tags: material.metadata?.tags || [],
        fileName: material.originalFileName || material.title,
        fileExt: extOf(material.originalFileName || material.title),
      },
    }));

    await VectorChunk.insertMany(chunkDocs);

    material.processingStatus = 'processed';
    material.chunksCount = chunks.length;
    material.lastProcessedAt = new Date();
    await material.save();

    return { materialId, chunks: chunks.length };
  } catch (e) {
    material.processingStatus = 'error';
    await material.save();
    throw e;
  }
}

module.exports = { ingestMaterial };

