const express = require('express');
const router = express.Router();
const db = require('../database');

const RESET_PASSWORD = 'abd1255A';

// Reset all data
router.post('/reset', (req, res) => {
  try {
    const { password } = req.body;

    // Verify password
    if (!password || password !== RESET_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

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

