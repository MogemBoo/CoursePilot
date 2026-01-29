const { getOpenAI } = require('./clients/openaiClient');
const { semanticSearch } = require('./searchService');
const GeneratedContent = require('../models/GeneratedContent');

// Supported programming languages for lab content
const SUPPORTED_LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c'];

// Generate theory content (notes, slides, pdf)
async function generateTheoryContent({ topic, prompt, format = 'notes', userId = null }) {
  const openai = getOpenAI();

  // 1. Retrieve relevant internal context via semantic search
  const internalContext = await getInternalContext(topic || prompt);
  
  // 2. Fetch external context from Wikipedia
  const externalContext = await getWikipediaContext(topic || prompt);

  // 3. Build the system prompt based on format
  const systemPrompt = buildTheorySystemPrompt(format);

  // 4. Build the user message with context
  const userMessage = buildTheoryUserMessage({ topic, prompt, internalContext, externalContext, format });

  // 5. Call OpenAI to generate content
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  const generatedText = completion.choices[0]?.message?.content || '';

  // 6. Save to database
  const sourceMaterialIds = internalContext.map(c => c.source?.materialId).filter(Boolean);
  
  const doc = await GeneratedContent.create({
    type: 'theory',
    format,
    topic: topic || prompt.substring(0, 100),
    prompt,
    content: generatedText,
    sourceMaterials: sourceMaterialIds,
    validationStatus: 'pending'
  });

  return {
    id: doc._id.toString(),
    content: generatedText,
    format,
    sources: internalContext.map(c => ({
      title: c.source?.title,
      category: c.source?.category,
      snippet: c.snippet?.substring(0, 200)
    })),
    externalSources: externalContext.sources || []
  };
}

// Generate lab/code content
async function generateLabContent({ topic, prompt, language = 'python', userId = null }) {
  if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
    throw new Error(`Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }

  const openai = getOpenAI();

  // 1. Retrieve relevant internal context
  const internalContext = await getInternalContext(topic || prompt);
  
  // 2. Fetch external context
  const externalContext = await getWikipediaContext(`${topic || prompt} programming`);

  // 3. Build prompts
  const systemPrompt = buildLabSystemPrompt(language);
  const userMessage = buildLabUserMessage({ topic, prompt, internalContext, externalContext, language });

  // 4. Generate
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.5,
    max_tokens: 4000
  });

  const generatedText = completion.choices[0]?.message?.content || '';

  // 5. Save
  const sourceMaterialIds = internalContext.map(c => c.source?.materialId).filter(Boolean);
  
  const doc = await GeneratedContent.create({
    type: 'lab',
    format: 'code',
    topic: topic || prompt.substring(0, 100),
    prompt,
    content: generatedText,
    sourceMaterials: sourceMaterialIds,
    programmingLanguage: language.toLowerCase(),
    validationStatus: 'pending'
  });

  return {
    id: doc._id.toString(),
    content: generatedText,
    language,
    sources: internalContext.map(c => ({
      title: c.source?.title,
      category: c.source?.category,
      snippet: c.snippet?.substring(0, 200)
    })),
    externalSources: externalContext.sources || []
  };
}

// Helper: Get internal context from course materials
async function getInternalContext(query) {
  try {
    const results = await semanticSearch({ query, topK: 5 });
    return results || [];
  } catch (err) {
    console.warn('⚠️ Internal context retrieval failed:', err.message);
    return [];
  }
}

// Helper: Get Wikipedia context
async function getWikipediaContext(query) {
  try {
    // Simple Wikipedia API call for context
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    const searchResults = data?.query?.search || [];
    
    if (searchResults.length === 0) {
      return { text: '', sources: [] };
    }

    // Get extracts for top results
    const titles = searchResults.map(r => r.title).join('|');
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=extracts&exintro=1&explaintext=1&format=json`;
    const extractResponse = await fetch(extractUrl);
    const extractData = await extractResponse.json();
    
    const pages = extractData?.query?.pages || {};
    const extracts = Object.values(pages)
      .filter(p => p.extract)
      .map(p => ({
        title: p.title,
        extract: p.extract?.substring(0, 500)
      }));

    return {
      text: extracts.map(e => `${e.title}: ${e.extract}`).join('\n\n'),
      sources: extracts.map(e => ({ title: e.title, type: 'Wikipedia' }))
    };
  } catch (err) {
    console.warn('⚠️ Wikipedia context retrieval failed:', err.message);
    return { text: '', sources: [] };
  }
}

// Build theory system prompt
function buildTheorySystemPrompt(format) {
  const formatInstructions = {
    notes: `Generate comprehensive reading notes in Markdown format. Include:
- Clear headings and subheadings
- Key concepts and definitions
- Examples and explanations
- Summary points
- Use bullet points and numbered lists appropriately`,
    
    slides: `Generate slide content in Markdown format. Each slide should be separated by "---". Include:
- A clear title for each slide
- 3-5 bullet points per slide
- Key takeaways highlighted
- Visual suggestions in [brackets] where appropriate
- Keep text concise and impactful`,
    
    pdf: `Generate a well-structured document suitable for PDF export in Markdown. Include:
- Title and introduction
- Organized sections with headers
- Detailed explanations
- Examples and case studies where relevant
- Conclusion and key takeaways`
  };

  return `You are an expert educational content creator. Your task is to create high-quality, academically rigorous learning materials.

${formatInstructions[format] || formatInstructions.notes}

IMPORTANT GUIDELINES:
1. Content MUST be grounded in the provided source materials when available
2. Clearly distinguish between information from course materials vs external sources
3. Be accurate, coherent, and pedagogically sound
4. Use clear, accessible language appropriate for university students
5. Include citations to source materials where applicable`;
}

// Build theory user message
function buildTheoryUserMessage({ topic, prompt, internalContext, externalContext, format }) {
  let message = `Generate ${format} content about: "${topic || prompt}"\n\n`;

  if (internalContext.length > 0) {
    message += `=== COURSE MATERIALS (Primary Source) ===\n`;
    internalContext.forEach((ctx, i) => {
      message += `[Source ${i + 1}: ${ctx.source?.title || 'Unknown'}]\n${ctx.snippet}\n\n`;
    });
  }

  if (externalContext.text) {
    message += `=== EXTERNAL REFERENCE (Wikipedia) ===\n${externalContext.text}\n\n`;
  }

  message += `=== USER REQUEST ===\n${prompt}`;

  return message;
}

// Build lab system prompt
function buildLabSystemPrompt(language) {
  return `You are an expert programming instructor and code generator. Generate educational code content in ${language}.

OUTPUT FORMAT:
- Start with a brief explanation of the concept
- Provide well-commented, syntactically correct code
- Include example usage and expected output
- Add practice exercises or challenges at the end

CODE REQUIREMENTS:
1. Code MUST be syntactically correct and runnable
2. Follow ${language} best practices and conventions
3. Include comprehensive comments explaining each section
4. Use meaningful variable and function names
5. Handle edge cases where appropriate

SUPPORTED LANGUAGE: ${language}
- Ensure all code is valid ${language} syntax
- Use standard library functions when possible`;
}

// Build lab user message
function buildLabUserMessage({ topic, prompt, internalContext, externalContext, language }) {
  let message = `Generate ${language} code tutorial about: "${topic || prompt}"\n\n`;

  if (internalContext.length > 0) {
    message += `=== RELEVANT COURSE MATERIALS ===\n`;
    internalContext.forEach((ctx, i) => {
      message += `[Source ${i + 1}: ${ctx.source?.title || 'Unknown'}]\n${ctx.snippet}\n\n`;
    });
  }

  if (externalContext.text) {
    message += `=== EXTERNAL REFERENCE ===\n${externalContext.text}\n\n`;
  }

  message += `=== USER REQUEST ===\n${prompt}\n\nGenerate comprehensive ${language} code with explanations.`;

  return message;
}

// Get generated content by ID
async function getGeneratedContent(id) {
  const doc = await GeneratedContent.findById(id).populate('sourceMaterials', 'title category type');
  if (!doc) return null;
  
  return {
    id: doc._id.toString(),
    type: doc.type,
    format: doc.format,
    topic: doc.topic,
    prompt: doc.prompt,
    content: doc.content,
    programmingLanguage: doc.programmingLanguage,
    validationStatus: doc.validationStatus,
    sourceMaterials: doc.sourceMaterials,
    createdAt: doc.createdAt
  };
}

module.exports = {
  generateTheoryContent,
  generateLabContent,
  getGeneratedContent,
  SUPPORTED_LANGUAGES
};
