const mongoose = require('mongoose');

const analysisHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewText: {
    type: String,
    required: true
  },
  trustScore: {
    type: Number,
    required: true
  },
  trustLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low']
  },
  classification: {
    type: String,
    enum: ['genuine', 'suspicious', 'fake'],
    required: true
  },
  flags: [String],
  details: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AnalysisHistory', analysisHistorySchema);
