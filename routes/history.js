const express = require('express');
const router = express.Router();
const db = require('../database');

// Get import history
router.get('/imports', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = db.getImportHistory(limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get deletion log
router.get('/deletions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const log = db.getDeletionLog(limit);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

