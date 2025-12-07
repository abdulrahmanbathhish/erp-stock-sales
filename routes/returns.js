const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper to get io instance
function getIO(req) {
  return req.app.get('io');
}

// Create a new return
router.post('/', (req, res) => {
  try {
    const { sale_id, customer_id, product_id, quantity, return_date, reason } = req.body;

    // Validation
    if (!sale_id || !product_id || !quantity || !return_date) {
      return res.status(400).json({ error: 'Missing required fields: sale_id, product_id, quantity, return_date' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const returnData = {
      sale_id: parseInt(sale_id),
      customer_id: customer_id ? parseInt(customer_id) : null,
      product_id: parseInt(product_id),
      quantity: parseInt(quantity),
      return_date: return_date,
      reason: reason ? reason.trim() : null
    };

    const result = db.createReturn(returnData);

    // Emit real-time event
    const io = getIO(req);
    if (io) {
      io.emit('return:created', { return: result });
    }

    res.json({
      success: true,
      return: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all returns
router.get('/', (req, res) => {
  try {
    const returns = db.getAllReturns();
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get returns by customer ID
router.get('/customer/:id', (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const returns = db.getReturnsByCustomerId(customerId);
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get returns by sale ID
router.get('/sale/:id', (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const returns = db.getReturnsBySaleId(saleId);
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get return by ID
router.get('/:id', (req, res) => {
  try {
    const returnId = parseInt(req.params.id);
    const returnRecord = db.getReturnById(returnId);
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }
    res.json(returnRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a return
router.delete('/:id', (req, res) => {
  try {
    const returnId = parseInt(req.params.id);
    const returnRecord = db.deleteReturn(returnId);

    // Emit real-time event
    const io = getIO(req);
    if (io) {
      io.emit('return:deleted', { return_id: returnId });
    }

    res.json({
      success: true,
      message: 'Return deleted successfully. Stock adjustment has been reversed.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

