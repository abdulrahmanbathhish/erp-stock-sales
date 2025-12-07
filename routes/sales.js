const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper to get io instance
function getIO(req) {
  return req.app.get('io');
}

// Create a new sale
router.post('/', (req, res) => {
  try {
    const { product_id, quantity, sale_price, customer_id, is_credit, transaction_id } = req.body;

    // Validation
    if (!product_id || !quantity || !sale_price) {
      return res.status(400).json({ error: 'Missing required fields: product_id, quantity, sale_price' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (sale_price < 0) {
      return res.status(400).json({ error: 'Sale price cannot be negative' });
    }

    // If is_credit is true, customer_id must be provided
    if (is_credit && !customer_id) {
      return res.status(400).json({ error: 'Customer is required for credit sales' });
    }

    const result = db.createSale({
      product_id: parseInt(product_id),
      quantity: parseInt(quantity),
      sale_price: parseFloat(sale_price),
      customer_id: customer_id ? parseInt(customer_id) : null,
      is_credit: is_credit === true || is_credit === 'true' || is_credit === 1,
      transaction_id: transaction_id || null
    });

    // Get the full sale details for real-time update
    const saleDetails = db.getSaleById(result.id);
    
    // Emit real-time event to all connected clients
    const io = getIO(req);
    if (io) {
      io.emit('sale:created', {
        sale: saleDetails,
        stats: db.getSalesStats('today')
      });
    }

    res.json({
      success: true,
      sale_id: result.id,
      profit: result.profit
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get latest sales
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sales = db.getLatestSales(limit);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales statistics
router.get('/stats', (req, res) => {
  try {
    const period = req.query.period || 'today'; // today, week, month
    if (period === 'all') {
      // For all time, use a very old date
      const stats = db.getSalesStats('all');
      res.json({
        period: 'all',
        total_profit: stats.total_profit || 0,
        total_sales: stats.total_sales || 0
      });
    } else {
      const stats = db.getSalesStats(period);
      res.json({
        period,
        total_profit: stats.total_profit || 0,
        total_sales: stats.total_sales || 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top selling products
router.get('/top-products', (req, res) => {
  try {
    const products = db.getTopProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial summary (profit, capital, expenses)
router.get('/financial-summary', (req, res) => {
  try {
    const period = req.query.period || 'all';

    // Get sales stats - profit is sum of (sale_price - purchase_price) * quantity for all sales in period
    const salesStats = db.getSalesStats(period);

    // Get capital (current stock value) - always current, not filtered by period
    // Capital = sum of (purchase_price * current_stock_quantity) for all products
    const capital = db.getCapital();

    // Get total sold value (sum of purchase_price × quantity for all sales)
    const totalSoldValue = db.getTotalSoldValue();

    // Get expense stats
    const expenseDateRange = db.getDateRangeForExpenses(period);
    const expenseStats = db.getExpenseStatsByDateRange(expenseDateRange.start, expenseDateRange.end);

    // Ensure all values are numbers
    const profit = parseFloat(salesStats.total_profit) || 0;
    const capitalValue = parseFloat(capital.total_capital) || 0;
    const expenses = parseFloat(expenseStats.total_expenses) || 0;
    const salesCount = parseInt(salesStats.total_sales) || 0;
    const expenseCount = parseInt(expenseStats.expense_count) || 0;

    // Calculate net profit (profit - expenses)
    const netProfit = profit - expenses;

    // Log for debugging (can be removed in production)
    console.log(`Financial Summary (${period}): Profit=${profit}, Capital=${capitalValue}, Expenses=${expenses}, Sales=${salesCount}`);
    console.log('Capital object from DB:', capital);
    console.log('Capital value extracted:', capitalValue);

    // Ensure capital is always a number, not null or undefined
    const finalCapital = (capitalValue && !isNaN(capitalValue)) ? capitalValue : 0;

    res.json({
      period,
      profit: profit,
      capital: finalCapital,
      expenses: expenses,
      net_profit: netProfit,
      sold_value: totalSoldValue.total_sold_value,
      sales_count: salesCount,
      expense_count: expenseCount
    });
  } catch (error) {
    console.error('Error in financial summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity (sales, payments, returns combined)
// IMPORTANT: This must be BEFORE /:id route to avoid route conflicts
router.get('/recent-activity', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // Increased default limit
    const timeFilter = req.query.time || 'week'; // today, week, month, all
    const customerId = req.query.customer_id ? parseInt(req.query.customer_id) : null;

    // Get date range for time filter
    let startDate = null;
    if (timeFilter !== 'all') {
      const dateRange = db.getDateRange(timeFilter);
      startDate = dateRange.start;
    }

    // Get latest sales with filters - use higher limit to ensure we get all items in transactions
    const fetchLimit = limit * 3; // Get 3x more to ensure we capture all transaction items
    let sales;
    if (customerId && startDate) {
      sales = db.getLatestSalesByDateRangeAndCustomer(customerId, startDate, fetchLimit);
    } else if (customerId) {
      sales = db.getLatestSalesByCustomer(customerId, fetchLimit);
    } else if (startDate) {
      sales = db.getLatestSalesByDateRange(startDate, fetchLimit);
    } else {
      sales = db.getLatestSales(fetchLimit);
    }

    // Group credit sales by transaction_id - collect ALL items for each transaction
    let creditSalesByTransaction = {};
    const normalSales = [];
    const transactionIds = new Set(); // Track transaction IDs we've seen
    
    sales.forEach(sale => {
      if (sale.is_credit && sale.transaction_id) {
        transactionIds.add(sale.transaction_id);
        // Group credit sales by transaction_id
        if (!creditSalesByTransaction[sale.transaction_id]) {
          creditSalesByTransaction[sale.transaction_id] = {
            transaction_id: sale.transaction_id,
            customer_name: sale.customer_name || null,
            customer_phone: sale.customer_phone || null,
            date: sale.created_at,
            items: [],
            total_amount: 0
          };
        }
          creditSalesByTransaction[sale.transaction_id].items.push({
            id: sale.id,
            product_name: sale.product_name,
            quantity: sale.quantity,
            sale_price: sale.sale_price,
            amount: sale.sale_price * sale.quantity,
            customer_id: sale.customer_id || null
          });
          creditSalesByTransaction[sale.transaction_id].total_amount += sale.sale_price * sale.quantity;
      } else {
        // Normal sales (not credit) or credit sales without transaction_id (legacy)
        normalSales.push(sale);
      }
    });

    // If we have transaction IDs, fetch ALL sales for those transactions to ensure complete grouping
    if (transactionIds.size > 0) {
      const transactionIdList = Array.from(transactionIds);
      const allTransactionSales = db.getSalesByTransactionIds(transactionIdList);

      // Re-group with ALL items to get complete transaction totals
      creditSalesByTransaction = {};
      allTransactionSales.forEach(sale => {
        if (sale.is_credit && sale.transaction_id) {
          if (!creditSalesByTransaction[sale.transaction_id]) {
            creditSalesByTransaction[sale.transaction_id] = {
              transaction_id: sale.transaction_id,
              customer_name: sale.customer_name || null,
              customer_phone: sale.customer_phone || null,
              date: sale.created_at,
              items: [],
              total_amount: 0
            };
          }
          creditSalesByTransaction[sale.transaction_id].items.push({
            id: sale.id,
            product_name: sale.product_name,
            quantity: sale.quantity,
            sale_price: sale.sale_price,
            amount: sale.sale_price * sale.quantity,
            customer_id: sale.customer_id || null
          });
          creditSalesByTransaction[sale.transaction_id].total_amount += sale.sale_price * sale.quantity;
        }
      });
    }
    
    // Convert grouped credit sales to activity items
    const groupedCreditSales = Object.values(creditSalesByTransaction).map(transaction => {
      const itemsCount = transaction.items.length;
      const totalQuantity = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
      // Get customer_id from first item (all items in transaction have same customer_id)
      const customerId = transaction.items.length > 0 ? transaction.items[0].customer_id : null;
      
      return {
        type: 'credit_sale',
        id: transaction.transaction_id, // Use transaction_id as the id for grouped sales
        transaction_id: transaction.transaction_id,
        customer_id: customerId, // Include customer_id for saving
        customer_name: transaction.customer_name,
        customer_phone: transaction.customer_phone,
        product_name: null, // Multiple products
        quantity: totalQuantity,
        amount: transaction.total_amount,
        date: transaction.date,
        description: `بيع بالدين: ${itemsCount} منتج${itemsCount > 1 ? 'ات' : ''}`, // Show only count
        items: transaction.items // Include items array for invoice display
      };
    });
    
    // Normal sales (non-credit or legacy credit sales)
    const salesWithType = normalSales.map(sale => ({
      type: sale.is_credit ? 'credit_sale' : 'sale',
      id: sale.id,
      customer_name: sale.customer_name || null,
      customer_phone: sale.customer_phone || null,
      product_name: sale.product_name,
      quantity: sale.quantity,
      amount: sale.sale_price * sale.quantity,
      date: sale.created_at,
      description: sale.is_credit
        ? `بيع بالدين: ${sale.product_name} (${sale.quantity})`
        : `بيع نقدي: ${sale.product_name} (${sale.quantity})`
    }));
    
    // Combine grouped credit sales with normal sales
    // Sort by date (newest first) and limit after grouping to ensure we show complete transactions
    const allSalesWithType = [...groupedCreditSales, ...salesWithType]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    // Get latest payments with filters
    let payments;
    if (customerId && startDate) {
      payments = db.getLatestPaymentsByDateRangeAndCustomer(customerId, startDate, limit);
    } else if (customerId) {
      payments = db.getLatestPaymentsByCustomer(customerId, limit);
    } else if (startDate) {
      payments = db.getLatestPaymentsByDateRange(startDate, limit);
    } else {
      payments = db.getLatestPayments(limit);
    }

    const paymentsWithType = payments.map(payment => ({
      type: 'payment',
      id: payment.id,
      customer_name: payment.customer_name || null,
      customer_phone: payment.customer_phone || null,
      amount: payment.amount,
      date: payment.created_at, // Use created_at - when payment was recorded, not payment_date
      description: payment.customer_name
        ? `دفعة من ${payment.customer_name}`
        : 'دفعة عميل'
    }));

    // Get latest returns with filters
    let returns;
    if (customerId && startDate) {
      returns = db.getLatestReturnsByDateRangeAndCustomer(customerId, startDate, limit);
    } else if (customerId) {
      returns = db.getLatestReturnsByCustomer(customerId, limit);
    } else if (startDate) {
      returns = db.getLatestReturnsByDateRange(startDate, limit);
    } else {
      returns = db.getLatestReturns(limit);
    }

    const returnsWithType = returns.map(returnRecord => ({
      type: 'return',
      id: returnRecord.id,
      customer_name: returnRecord.customer_name || null,
      customer_phone: null,
      product_name: returnRecord.product_name,
      quantity: returnRecord.quantity,
      amount: returnRecord.sale_price * returnRecord.quantity,
      date: returnRecord.created_at, // Use created_at - when return was recorded, not return_date
      description: `إرجاع: ${returnRecord.product_name} (${returnRecord.quantity})`
    }));

    // Get latest expenses with filters
    // Note: Expenses don't have customer_id, so we only filter by date
    let expenses;
    if (startDate) {
      // Convert startDate to date string for expense_date comparison
      const expenseStartDate = startDate.split(' ')[0]; // Get date part only
      const now = new Date();
      const expenseEndDate = now.toISOString().slice(0, 10); // Today's date
      expenses = db.getExpensesByDateRange(expenseStartDate, expenseEndDate);
      // Limit results
      expenses = expenses.slice(0, limit);
    } else {
      expenses = db.getAllExpenses(limit);
    }

    const expensesWithType = expenses.map(expense => ({
      type: 'expense',
      id: expense.id,
      customer_name: null, // Expenses don't have customers
      customer_phone: null,
      product_name: null,
      quantity: null,
      amount: expense.amount,
      date: expense.created_at || expense.expense_date, // Use created_at for sorting (has time), fallback to expense_date
      description: expense.description 
        ? `مصروف: ${expense.description}${expense.category ? ` (${expense.category})` : ''}`
        : `مصروف${expense.category ? `: ${expense.category}` : ''}`
    }));

    // Combine all activities and sort by date (newest first)
    const allActivities = [...allSalesWithType, ...paymentsWithType, ...returnsWithType, ...expensesWithType];
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return only the requested limit
    res.json(allActivities.slice(0, limit));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create multiple sales at once
router.post('/multiple', (req, res) => {
  try {
    const { sales, customer_id, is_credit } = req.body;

    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ error: 'Missing or empty sales array' });
    }

    // Validate all sales first
    for (const sale of sales) {
      if (!sale.product_id || !sale.quantity || !sale.sale_price) {
        return res.status(400).json({ error: 'Each sale must have product_id, quantity, and sale_price' });
      }
      if (sale.quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
      }
    }

    // Use customer_id from request body if provided, otherwise null
    const customerId = customer_id ? parseInt(customer_id) : null;
    const creditSale = is_credit === true || is_credit === 'true' || is_credit === 1;

    // If is_credit is true, customer_id must be provided
    if (creditSale && !customerId) {
      return res.status(400).json({ error: 'Customer is required for credit sales' });
    }

    // Get transaction_id from request body if provided
    const transactionId = req.body.transaction_id || null;
    
    const results = db.createMultipleSales(sales.map(s => ({
      product_id: parseInt(s.product_id),
      quantity: parseInt(s.quantity),
      sale_price: parseFloat(s.sale_price),
      customer_id: customerId,
      is_credit: creditSale,
      transaction_id: transactionId
    })));

    const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);

    // Emit real-time event for multiple sales
    const io = getIO(req);
    if (io) {
      // Get latest sales to send to clients
      const latestSales = db.getLatestSales(10);
      io.emit('sales:multiple-created', {
        sales: latestSales,
        stats: db.getSalesStats('today')
      });
    }

    res.json({
      success: true,
      sales_created: results.length,
      total_profit: totalProfit,
      sales: results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a sale
router.put('/:id', (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const { quantity, sale_price, customer_id, is_credit } = req.body;

    const updates = {};
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
      }
      updates.quantity = parseInt(quantity);
    }
    if (sale_price !== undefined) {
      if (sale_price < 0) {
        return res.status(400).json({ error: 'Sale price cannot be negative' });
      }
      updates.sale_price = parseFloat(sale_price);
    }
    if (customer_id !== undefined) {
      updates.customer_id = customer_id ? parseInt(customer_id) : null;
    }
    if (is_credit !== undefined) {
      updates.is_credit = is_credit === true || is_credit === 'true' || is_credit === 1;
    }

    const updatedSale = db.updateSale(saleId, updates);

    // Emit real-time event
    const io = getIO(req);
    if (io) {
      io.emit('sale:updated', {
        sale: updatedSale,
        stats: db.getSalesStats('today')
      });
    }

    res.json({
      success: true,
      sale: updatedSale
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a sale
router.delete('/:id', (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const sale = db.deleteSale(saleId);

    // Log deletion
    db.logDeletion({
      entity_type: 'sale',
      entity_id: saleId,
      entity_name: sale.product_name,
      details: `Sale deleted: ${sale.quantity} units at $${sale.sale_price} each`
    });

    // Emit real-time event for sale deletion
    const io = getIO(req);
    if (io) {
      io.emit('sale:deleted', {
        sale_id: saleId,
        stats: db.getSalesStats('today')
      });
    }

    res.json({
      success: true,
      message: 'Sale deleted successfully. Stock has been restored.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

