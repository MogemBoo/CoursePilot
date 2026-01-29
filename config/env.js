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

  supabaseUrl: optional('SUPABASE_URL', null),
  supabaseServiceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY', null),
  supabaseBucket: optional('SUPABASE_BUCKET', 'course-materials'),
  supabasePublicBucket: optional('SUPABASE_PUBLIC_BUCKET', 'true') === 'true',
};

function assertRagEnv() {
  required('OPENAI_API_KEY');
  required('PINECONE_API_KEY');
  required('SUPABASE_URL');
  required('SUPABASE_SERVICE_ROLE_KEY');
  required('PINECONE_INDEX');
}

module.exports = { env, assertRagEnv, required, optional };
