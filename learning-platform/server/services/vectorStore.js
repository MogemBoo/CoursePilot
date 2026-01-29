
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

/**
 * Generates an embedding for the given text using OpenAI.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
            input: text.replace(/\n/g, ' '), // Normalize text
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error.message);
        throw error;
    }
}

/**
 * Upserts a content item to Pinecone.
 * @param {object} contentDoc - The full content document from MongoDB
 */
async function upsertContent(contentDoc) {
    try {
        // Construct the text to embed: Title + Description + Tags + Category
        const textToEmbed = `
            Title: ${contentDoc.title}
            Description: ${contentDoc.metadata?.description || ''}
            Topic: ${contentDoc.metadata?.topic || ''}
            Category: ${contentDoc.category || ''}
            Tags: ${(contentDoc.metadata?.tags || []).join(', ')}
        `.trim();

        const embedding = await generateEmbedding(textToEmbed);

        const record = {
            id: contentDoc._id.toString(),
            values: embedding,
            metadata: {
                title: contentDoc.title,
                category: contentDoc.category || 'Other',
                type: contentDoc.type,
                link: contentDoc.link,
                uploadedAt: new Date().toISOString()
            }
        };

        await index.namespace(process.env.PINECONE_NAMESPACE || 'default').upsert([record]);
        console.log(`Upserted content: ${contentDoc.title} to Pinecone.`);
    } catch (error) {
        console.error(`Error upserting content ${contentDoc._id}:`, error.message);
        // Don't crash the app if indexing fails
    }
}

/**
 * Searches for content in Pinecone.
 * @param {string} queryText 
 * @param {number} topK 
 * @returns {Promise<string[]>} Array of Content IDs
 */
async function searchContent(queryText, topK = 5) {
    try {
        const embedding = await generateEmbedding(queryText);

        const results = await index.namespace(process.env.PINECONE_NAMESPACE || 'default').query({
            vector: embedding,
            topK: topK,
            includeMetadata: true
        });

        // Return list of matches containing ID and Score
        return results.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));

    } catch (error) {
        console.error("Error searching content:", error.message);
        return [];
    }
}

module.exports = {
    upsertContent,
    searchContent
};
