
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// Initialize OpenAI client if key is present
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("OpenAI Client Initialized");
} else {
    console.log("OpenAI Key missing. Using Simulation Mode.");
}

// Mock Data Templates (Fallback)
const getTheoryTemplate = (topic) => `
# ${topic} (Simulated)

## Introduction
This is a standard introduction to **${topic}**. This concept is fundamental in your field of study.

## Key Concepts
1. **Definition**: The core definition of ${topic}.
2. **Importance**: Why we study ${topic}.
3. **Application**: Real-world examples.

*Note: Add OPENAI_API_KEY to server/.env to get real AI responses.*
`;

const getLabTemplate = (topic) => `
# Lab: Implementing ${topic} (Simulated)

## Objective
To implement a basic version of **${topic}**.

\`\`\`python
def ${topic.toLowerCase().replace(/\s+/g, '_')}_demo():
    print("Initializing ${topic}...")
    return "Result"
\`\`\`

*Note: Add OPENAI_API_KEY to server/.env to get real AI responses.*
`;

// POST /api/generate
router.post('/', async (req, res) => {
    try {
        const { topic, type } = req.body;

        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        let content = '';

        if (openai) {
            // Real AI Generation
            const prompt = type === 'theory'
                ? `Write a comprehensive study guide about "${topic}". Include Introduction, Key Concepts, Example, and Summary. Format in Markdown.`
                : `Create a programming lab exercise about "${topic}". Include Objective, Python Code Implementation, and 2-3 Tasks for students. Format in Markdown with code blocks.`;

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
            });

            content = completion.choices[0].message.content;
        } else {
            // Simulated Generation
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (type === 'lab') {
                content = getLabTemplate(topic);
            } else {
                content = getTheoryTemplate(topic);
            }
        }

        res.json({
            success: true,
            data: {
                topic,
                type,
                content,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ message: 'Generation Failed', error: error.message });
    }
});

module.exports = router;
