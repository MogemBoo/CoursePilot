const { getOpenAI } = require('./clients/openaiClient');
const { semanticSearch } = require('./searchService');
const ChatSession = require('../models/ChatSession');
const CourseMaterial = require('../models/CourseMaterial');
const { generateTheoryContent, generateLabContent } = require('./contentGenerationService');

// Main chat handler
async function handleUserMessage({ sessionId, userId, text }) {
  const openai = getOpenAI();

  // 1. Retrieve or create session
  let session;
  if (sessionId) {
    session = await ChatSession.findById(sessionId);
  }
  
  if (!session) {
    session = await ChatSession.create({
      userId: userId || 'anonymous', // Handle auth later
      messages: []
    });
  }

  // 2. Identify intent (Q&A, Generation, Summary)
  const intent = await classifyIntent(text);
  
  let reply = '';
  let references = [];

  // 3. Handle intent
  if (intent === 'generate_theory' || intent === 'generate_lab') {
    // Hand off to content generation service
    const genResult = await handleGenerationRequest(intent, text);
    reply = `I've generated that for you! \n\n${genResult.content.substring(0, 200)}...\n\n(View full content in Content Factory)`;
    // In a real app, we'd link to the detailed view
  } else {
    // Default: Q&A / Search / Chat
    // 4. Retrieve context via semantic search
    const searchResults = await semanticSearch({ query: text, topK: 3 });
    references = searchResults.map(r => ({
       materialId: r.source.materialId,
       title: r.source.title,
       snippet: r.snippet
    }));

    // 5. Generate response with LLM
    const systemPrompt = `You are ScholarSync, an intelligent teaching assistant. 
    Answer the user's question based PRIMARILY on the provided course context.
    
    GUIDELINES:
    - If the answer is found in the context, cite the source title.
    - If the context is empty or irrelevant, use your general knowledge but mention that it's outside the course scope.
    - Be concise, encouraging, and academic.
    - If the user asks to generate notes/slides/code, suggest they use the "Content Factory" or try to help briefly.
    
    COURSE CONTEXT:
    ${references.map(r => `[Source: ${r.title}]\n${r.snippet}`).join('\n\n')}
    `;

    // Get recent chat history for conversation context
    const history = session.messages.slice(-5).map(m => 
      ({ role: m.sender, content: m.text })
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: text }
      ],
      temperature: 0.7
    });

    reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  }

  // 6. Save message to session history
  session.messages.push({
    sender: 'user',
    text: text
  });
  
  session.messages.push({
    sender: 'assistant',
    text: reply,
    contextReferences: references.map(r => ({ materialId: r.materialId, excerpt: r.title }))
  });
  
  await session.save();

  return {
    sessionId: session._id,
    reply,
    references: references.map(r => ({ title: r.title, materialId: r.materialId }))
  };
}

// Simple intent classifier
async function classifyIntent(text) {
  const t = text.toLowerCase();
  if (t.includes('generate') || t.includes('create')) {
    if (t.includes('code') || t.includes('lab') || t.includes('function') || t.includes('script')) return 'generate_lab';
    if (t.includes('notes') || t.includes('slide') || t.includes('summary')) return 'generate_theory';
  }
  return 'chat';
}

// Handler for generation requests within chat
async function handleGenerationRequest(intent, text) {
  if (intent === 'generate_theory') {
    return await generateTheoryContent({ topic: text, prompt: text, format: 'notes' });
  } else {
    return await generateLabContent({ topic: text, prompt: text, language: 'python' });
  }
}

module.exports = { handleUserMessage };
