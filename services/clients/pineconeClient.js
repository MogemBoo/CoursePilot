const { Pinecone } = require('@pinecone-database/pinecone');
const { env } = require('../../config/env');

let _pc;

function getPinecone() {
  if (_pc) return _pc;
  _pc = new Pinecone({ apiKey: env.pineconeApiKey });
  return _pc;
}

function getPineconeIndex() {
  const pc = getPinecone();
  return pc.index(env.pineconeIndex).namespace(env.pineconeNamespace);
}

module.exports = { getPinecone, getPineconeIndex };

