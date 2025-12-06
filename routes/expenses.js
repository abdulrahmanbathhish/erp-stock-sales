const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all expenses
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const expenses = db.getAllExpenses(limit);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses by date range
router.get('/range', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    const expenses = db.getExpensesByDateRange(start_date, end_date);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by ID
router.get('/:id', (req, res) => {
  try {
    const expense = db.getExpenseById(parseInt(req.params.id));
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create multiple expenses
router.post('/multiple', (req, res) => {
  try {
    const { expenses } = req.body;

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: 'Missing or empty expenses array' });
    }

    // Validate all expenses first
    for (const expense of expenses) {
      if (!expense.amount || !expense.expense_date) {
        return res.status(400).json({ error: 'Each expense must have amount and expense_date' });
      }
      if (expense.amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
    }

    const results = db.createMultipleExpenses(expenses.map(e => ({
      amount: parseFloat(e.amount),
      description: e.description || null,
      category: e.category || null,
      expense_date: e.expense_date
    })));

    const totalAmount = results.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      expenses_created: results.length,
      total_amount: totalAmount,
      expenses: results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create expense
router.post('/', (req, res) => {
  try {
    const { amount, description, category, expense_date } = req.body;

    if (!amount || !expense_date) {
      return res.status(400).json({ error: 'amount and expense_date are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const expense = db.createExpense({
      amount: parseFloat(amount),
      description: description || null,
      category: category || null,
      expense_date: expense_date
    });

    res.json({
      success: true,
      expense: expense
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', (req, res) => {
  try {
    const { amount, description, category, expense_date } = req.body;
    const id = parseInt(req.params.id);

    if (!amount || !expense_date) {
      return res.status(400).json({ error: 'amount and expense_date are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const expense = db.updateExpense(id, {
      amount: parseFloat(amount),
      description: description || null,
      category: category || null,
      expense_date: expense_date
    });

    res.json({
      success: true,
      expense: expense
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = db.deleteExpense(id);

    // Log deletion
    db.logDeletion({
      entity_type: 'expense',
      entity_id: id,
      entity_name: expense.description || 'Expense',
      details: `Expense deleted: $${expense.amount} - ${expense.description || 'No description'}`
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get expense statistics
router.get('/stats/summary', (req, res) => {
  try {
    const { period } = req.query;
    const dateRange = db.getDateRangeForExpenses(period || 'all');
    const stats = db.getExpenseStatsByDateRange(dateRange.start, dateRange.end);
    res.json({
      period: period || 'all',
      ...stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense categories
router.get('/categories/list', (req, res) => {
  try {
    const categories = db.getExpenseCategories();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

