const { getOpenAI } = require('./clients/openaiClient');
const { env } = require('../config/env');

async function embedTexts(texts) {
  const client = getOpenAI();
  const resp = await client.embeddings.create({
    model: env.openaiEmbeddingModel,
    input: texts,
  });
  return resp.data.map((d) => d.embedding);
}

module.exports = { embedTexts };

