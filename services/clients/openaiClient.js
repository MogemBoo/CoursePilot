const OpenAI = require('openai');
const { env } = require('../../config/env');

let _client;

function getOpenAI() {
  if (_client) return _client;
  _client = new OpenAI({ apiKey: env.openaiApiKey });
  return _client;
}

module.exports = { getOpenAI };

