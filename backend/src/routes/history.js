const express = require('express');
const router = express.Router();
const AnalysisHistory = require('../models/AnalysisHistory');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Save analysis to history
router.post('/save', verifyToken, async (req, res) => {
  try {
    const { reviewText, trustScore, trustLevel, classification, flags, details } = req.body;

    const existingHistory = await AnalysisHistory.findOne({
      userId: req.userId,
      reviewText,
      trustScore,
      classification,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    }).sort({ createdAt: -1 });

    if (existingHistory) {
      return res.json({
        success: true,
        message: 'Analysis already saved to history',
        data: existingHistory
      });
    }

    const history = new AnalysisHistory({
      userId: req.userId,
      reviewText,
      trustScore,
      trustLevel,
      classification,
      flags,
      details
    });

    await history.save();

    res.json({
      success: true,
      message: 'Analysis saved to history',
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's history
router.get('/my-history', verifyToken, async (req, res) => {
  try {
    const history = await AnalysisHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a history item
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const history = await AnalysisHistory.findById(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History not found'
      });
    }

    if (history.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this'
      });
    }

    await AnalysisHistory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'History item deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Recalculate all history items with ML service
router.post('/recalculate', verifyToken, async (req, res) => {
  try {
    const history = await AnalysisHistory.find({ userId: req.userId });

    if (history.length === 0) {
      return res.json({
        success: true,
        message: 'No history items to recalculate',
        updated: 0
      });
    }

    let updated = 0;

    // Recalculate each history item
    for (const item of history) {
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze/review`, {
          text: item.reviewText
        });

        if (mlResponse.data.success && mlResponse.data.data) {
          const analysisData = mlResponse.data.data;
          
          // Update with new scores
          item.trustScore = analysisData.trustScore;
          item.trustLevel = analysisData.trustLevel;
          item.classification = analysisData.classification;
          item.flags = analysisData.flags || [];
          item.details = {
            wordCount: analysisData.details?.wordCount,
            sentimentScore: analysisData.details?.sentimentScore,
            languageQuality: analysisData.details?.languageQuality,
            patternScore: analysisData.details?.patternScore
          };
          
          await item.save();
          updated++;
        }
      } catch (itemError) {
        console.error(`Error recalculating item ${item._id}:`, itemError.message);
        // Continue with next item on error
      }
    }

    res.json({
      success: true,
      message: `Recalculated ${updated} analysis items with current ML model`,
      updated,
      total: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
