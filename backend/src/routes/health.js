const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    service: 'Fake Review Analyzer - Backend'
  });
});

module.exports = router;
