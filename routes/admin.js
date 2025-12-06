const express = require('express');
const router = express.Router();
const db = require('../database');

// Reset all data
router.post('/reset', (req, res) => {
  try {
    // Reset all data
    db.resetAllData();

    res.json({
      success: true,
      message: 'All data has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

