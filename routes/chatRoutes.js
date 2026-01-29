const express = require('express');
const router = express.Router();
const { handleUserMessage } = require('../services/chatService');
const ChatSession = require('../models/ChatSession');

// Initialize a new session (guest-friendly, no auth required)
router.post('/api/chat/session', async (req, res) => {
  try {
    const session = await ChatSession.create({
      // For now we allow anonymous chat sessions; userId is optional in the schema
      messages: [],
    });
    res.json({ sessionId: session._id });
  } catch (err) {
    console.error('Session init error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, text, userId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const response = await handleUserMessage({ sessionId, userId, text });
    res.json(response);

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get session history
router.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
