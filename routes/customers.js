const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all customers (with optional search)
router.get('/', (req, res) => {
  try {
    const query = req.query.q || '';
    let customers;
    if (query.trim()) {
      customers = db.searchCustomers(query);
    } else {
      customers = db.getAllCustomers();
    }
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search customers by name or phone
router.get('/search', (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const customers = db.searchCustomers(query);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total customer debt (must be before /:id route)
router.get('/total-debt', (req, res) => {
  try {
    const totalDebt = db.getTotalCustomerDebt();
    res.json({ total_debt: totalDebt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID with sales history
router.get('/:id', (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const customer = db.getCustomerWithSales(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a minimal customer (name only, for quick add during sales)
router.post('/quick-create', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Create customer with minimal data: name only
    const customer = db.createCustomer({
      name: name.trim(),
      phone: null,
      notes: null
    });

    res.json({
      success: true,
      customer: customer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new customer
router.post('/', (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const customer = db.createCustomer({
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      notes: notes ? notes.trim() : null
    });

    res.json({
      success: true,
      customer: customer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add payment for a customer
router.post('/:id/payments', (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { amount, payment_date, notes } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Payment amount is required and must be greater than 0' });
    }

    if (!payment_date) {
      return res.status(400).json({ error: 'Payment date is required' });
    }

    // Verify customer exists
    const customer = db.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const payment = db.createPayment({
      customer_id: customerId,
      amount: parseFloat(amount),
      payment_date: payment_date,
      notes: notes ? notes.trim() : null
    });

    res.json({
      success: true,
      payment: payment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a payment
router.delete('/payments/:id', (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const payment = db.deletePayment(paymentId);
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

