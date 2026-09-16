const express = require('express');
const router = express.Router();
const axios = require('axios');
const Review = require('../models/Review');
const Product = require('../models/Product');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Analyze single review
router.post('/review', async (req, res) => {
  try {
    const { text, reviewText } = req.body;
    const reviewContent = text || reviewText;

    if (!reviewContent || reviewContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required'
      });
    }

    // Call ML service for analysis
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze/review`, {
      text: reviewContent
    });

    // Return ML service response directly (it already has proper structure)
    res.json(mlResponse.data);
  } catch (error) {
    console.error('Error analyzing review:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing review',
      error: error.message
    });
  }
});

// Analyze product (all reviews)
router.post('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId });
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reviews found for this product'
      });
    }

    // Call ML service for batch analysis
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze/product`, {
      reviews: reviews.map(r => ({
        id: r._id,
        text: r.reviewText,
        rating: r.rating,
        date: r.reviewDate
      }))
    });

    // Update reviews with analysis results
    const analysisData = mlResponse.data;
    
    for (const review of reviews) {
      const analysis = analysisData.reviews.find(r => r.id === review._id.toString());
      if (analysis) {
        review.trustScore = analysis.trustScore;
        review.classification = analysis.classification;
        review.flags = analysis.flags;
        review.analysisDetails = analysis.details;
        await review.save();
      }
    }

    // Update product with trust score
    const product = await Product.findOne({ productId }) || new Product({ productId });
    product.trustScore = analysisData.trustScore;
    product.reviewDistribution = analysisData.distribution;
    product.suspiciousPatterns = analysisData.patterns;
    product.lastAnalyzed = new Date();
    await product.save();

    res.json({
      success: true,
      data: {
        trustScore: analysisData.trustScore,
        reviewDistribution: analysisData.distribution,
        patterns: analysisData.patterns,
        reviewsAnalyzed: reviews.length
      }
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing product',
      error: error.message
    });
  }
});

// Get trust score for product
router.get('/trust-score/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ productId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this product'
      });
    }

    res.json({
      success: true,
      data: {
        trustScore: product.trustScore,
        distribution: product.reviewDistribution,
        patterns: product.suspiciousPatterns,
        lastAnalyzed: product.lastAnalyzed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trust score',
      error: error.message
    });
  }
});

module.exports = router;
