const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  productUrl: String,
  platform: {
    type: String,
    enum: ['amazon', 'ebay', 'google', 'trustpilot', 'manual'],
    default: 'manual'
  },
  platformProductId: String,
  sku: String,
  category: String,
  averageRating: Number,
  totalReviews: {
    type: Number,
    default: 0
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100
  },
  analysisTimestamp: Date,
  reviewDistribution: {
    genuine: Number,
    suspicious: Number,
    fake: Number
  },
  suspiciousPatterns: [String],
  lastAnalyzed: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
