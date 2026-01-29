const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CourseMaterial = require('../models/CourseMaterial');
const ChatSession = require('../models/ChatSession');
const GeneratedContent = require('../models/GeneratedContent');
const User = require('../models/User');

// Get dashboard statistics
router.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Check if MongoDB is connected (readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        totalMaterials: 0,
        queriesToday: 0,
        activeUsers: 0,
        totalGeneratedContent: 0,
        totalChatSessions: 0
      });
    }

    // Total Materials
    const totalMaterials = await CourseMaterial.countDocuments();

    // Queries Today (count user messages from today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionsToday = await ChatSession.find({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    let queriesToday = 0;
    sessionsToday.forEach(session => {
      queriesToday += session.messages.filter(msg => msg.sender === 'user').length;
    });

    // Active Users (distinct users who have created sessions in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUserIds = await ChatSession.distinct('userId', {
      createdAt: { $gte: sevenDaysAgo },
      userId: { $ne: null }
    });
    
    const activeUsers = activeUserIds.length;

    // Additional stats
    const totalGeneratedContent = await GeneratedContent.countDocuments();
    const totalChatSessions = await ChatSession.countDocuments();

    res.json({
      totalMaterials,
      queriesToday,
      activeUsers,
      totalGeneratedContent,
      totalChatSessions
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    // Return default values instead of error to prevent UI breakage
    res.json({
      totalMaterials: 0,
      queriesToday: 0,
      activeUsers: 0,
      totalGeneratedContent: 0,
      totalChatSessions: 0,
      error: 'Unable to fetch stats'
    });
  }
});

module.exports = router;
