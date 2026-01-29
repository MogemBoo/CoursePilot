const CourseMaterial = require('../models/CourseMaterial');
const VectorChunk = require('../models/VectorChunk');

const { getPineconeIndex } = require('./clients/pineconeClient');
const { extractText } = require('./textExtractor');
const { chunkText } = require('./chunker');
const { embedTexts } = require('./embeddingService');

function pineconeIdFor(materialId, chunkIndex) {
  return `mat_${materialId}_chunk_${chunkIndex}`;
}

function extOf(fileName) {
  const parts = (fileName || '').split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
}

async function downloadMaterialBuffer(material) {
  if (material.fileData) {
    return material.fileData;
  }
  throw new Error('Material has no stored file data');
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
  if (!material.fileData) throw new Error('Material has no stored file data');

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
        week: material.metadata?.week ?? '',
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

    try {
      await VectorChunk.insertMany(chunkDocs);
    } catch (err) {
      if (err.code === 11000) {
        console.warn('⚠️ Duplicate key error ignoring (race condition):', err.message);
      } else {
        throw err;
      }
    }

    material.processingStatus = 'processed';
    material.chunksCount = chunks.length;
    material.lastProcessedAt = new Date();
    await material.save();

    return { materialId, chunks: chunks.length };
  } catch (e) {
    material.processingStatus = 'error';
    await material.save();
    console.error('❌ ingestMaterial error:', {
      materialId: materialId.toString(),
      message: e?.message,
    });
    throw e;
  }
}

module.exports = { ingestMaterial };

