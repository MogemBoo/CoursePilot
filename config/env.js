function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name, fallback) {
  const v = process.env[name];
  return v ?? fallback;
}

const env = {
  port: Number(optional('PORT', '5000')),
  mongoUri: optional('MONGO_URI', null),

  openaiApiKey: optional('OPENAI_API_KEY', null),
  openaiEmbeddingModel: optional('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),

  pineconeApiKey: optional('PINECONE_API_KEY', null),
  pineconeIndex: optional('PINECONE_INDEX', 'coursepilot'),
  pineconeNamespace: optional('PINECONE_NAMESPACE', 'default'),
};

function assertRagEnv() {
  required('OPENAI_API_KEY');
  required('PINECONE_API_KEY');
  required('PINECONE_INDEX');
}

module.exports = { env, assertRagEnv, required, optional };
