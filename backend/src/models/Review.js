const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  reviewText: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  reviewer: String,
  reviewDate: {
    type: Date,
    default: Date.now
  },
  verified: Boolean,
  helpfulCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['manual', 'amazon', 'ebay', 'google', 'trustpilot'],
    default: 'manual'
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100
  },
  classification: {
    type: String,
    enum: ['genuine', 'suspicious', 'fake']
  },
  flags: [{
    type: String,
    description: 'Analysis flags (repetitive, spam burst, duplicate, etc.)'
  }],
  analysisDetails: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
