const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('../database');

// Export today's sales, purchases, payments, and returns to Excel
router.get('/today', async (req, res) => {
  try {
    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString().slice(0, 19).replace('T', ' ');
    const todayDateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD format
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString().slice(0, 19).replace('T', ' ');
    const tomorrowDateStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD format
    
    // Get today's sales (both cash and credit)
    const salesQuery = db.db.prepare(`
      SELECT 
        s.id,
        s.created_at,
        p.name as product_name,
        s.quantity,
        s.sale_price,
        s.purchase_price,
        (s.sale_price * s.quantity) as total_amount,
        (s.sale_price - s.purchase_price) * s.quantity as profit,
        CASE WHEN s.is_credit = 1 THEN 'Credit' ELSE 'Cash' END as sale_type,
        COALESCE(c.name, 'Cash') as customer_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.created_at >= ? AND s.created_at < ?
      ORDER BY s.created_at ASC
    `);
    const sales = salesQuery.all(todayStart, todayEnd);
    console.log(`[Export] Found ${sales.length} sales for today`);
    
    // Get today's payments - check both payment_date and created_at to catch all payments
    const paymentsQuery = db.db.prepare(`
      SELECT 
        cp.id,
        cp.payment_date,
        cp.created_at,
        cp.amount,
        COALESCE(c.name, 'Unknown') as customer_name,
        c.phone as customer_phone,
        cp.notes
      FROM customer_payments cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      WHERE (cp.payment_date >= ? AND cp.payment_date < ?)
         OR (cp.created_at >= ? AND cp.created_at < ?)
      ORDER BY cp.payment_date ASC, cp.created_at ASC
    `);
    const payments = paymentsQuery.all(todayDateStr, tomorrowDateStr, todayStart, todayEnd);
    console.log(`[Export] Found ${payments.length} payments for today`);
    console.log(`[Export] Payment dates: ${payments.map(p => p.payment_date).join(', ')}`);
    
    // Get today's returns - check both return_date and created_at to catch all returns
    const returnsQuery = db.db.prepare(`
      SELECT 
        r.id,
        r.return_date,
        r.created_at,
        r.quantity,
        r.reason,
        p.name as product_name,
        s.sale_price,
        s.purchase_price,
        (s.sale_price * r.quantity) as refund_amount,
        (s.sale_price - s.purchase_price) * r.quantity as profit_loss,
        CASE WHEN s.is_credit = 1 THEN 'Credit' ELSE 'Cash' END as original_sale_type,
        COALESCE(c.name, 'Cash') as customer_name,
        s.id as original_sale_id
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      JOIN products p ON r.product_id = p.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE (r.return_date >= ? AND r.return_date < ?)
         OR (r.created_at >= ? AND r.created_at < ?)
      ORDER BY r.return_date ASC, r.created_at ASC
    `);
    const returns = returnsQuery.all(todayDateStr, tomorrowDateStr, todayStart, todayEnd);
    console.log(`[Export] Found ${returns.length} returns for today`);
    console.log(`[Export] Return dates: ${returns.map(r => r.return_date).join(', ')}`);
    
    // Get today's expenses
    const expensesQuery = db.db.prepare(`
      SELECT 
        e.id,
        e.expense_date,
        e.created_at,
        e.amount,
        e.description,
        e.category
      FROM expenses e
      WHERE e.expense_date >= ? AND e.expense_date < ?
      ORDER BY e.expense_date ASC
    `);
    const expenses = expensesQuery.all(todayDateStr, tomorrowDateStr);
    console.log(`[Export] Found ${expenses.length} expenses for today`);
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // ===== CREATE SUMMARY SHEET (All Operations Combined) =====
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Define styles
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    
    const saleCashStyle = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }, // Light green
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    const saleCreditStyle = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }, // Light yellow
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    const paymentStyle = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }, // Light blue
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    const returnStyle = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }, // Light red
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    const expenseStyle = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }, // Light orange
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    const totalStyle = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
      border: { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } }
    };
    
    // Set headers
    summarySheet.columns = [
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Date/Time', key: 'datetime', width: 20 },
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 12 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Profit/Loss', key: 'profitLoss', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    
    // Style header row
    summarySheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    let rowNumber = 2;
    let totalAmount = 0;
    let totalProfit = 0;
    
    // Add sales
    sales.forEach(sale => {
      const row = summarySheet.addRow({
        type: 'Sale (' + sale.sale_type + ')',
        datetime: sale.created_at,
        id: sale.id,
        description: sale.product_name,
        customer: sale.customer_name,
        quantity: sale.quantity,
        unitPrice: sale.sale_price,
        amount: sale.total_amount,
        profitLoss: sale.profit,
        notes: ''
      });
      
      // Apply color based on sale type
      const style = sale.sale_type === 'Cash' ? saleCashStyle : saleCreditStyle;
      row.eachCell((cell) => {
        Object.assign(cell.style, style);
      });
      
      // Format number columns
      row.getCell('unitPrice').numFmt = '$#,##0.00';
      row.getCell('amount').numFmt = '$#,##0.00';
      row.getCell('profitLoss').numFmt = '$#,##0.00';
      
      totalAmount += sale.total_amount;
      totalProfit += sale.profit;
      rowNumber++;
    });
    
    // Add payments
    payments.forEach(payment => {
      const paymentTime = payment.created_at ? payment.created_at.split(' ')[1] : '';
      const row = summarySheet.addRow({
        type: 'Payment',
        datetime: payment.payment_date + ' ' + paymentTime,
        id: payment.id,
        description: 'Payment from ' + payment.customer_name,
        customer: payment.customer_name,
        quantity: '',
        unitPrice: '',
        amount: payment.amount,
        profitLoss: payment.amount,
        notes: payment.notes || ''
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, paymentStyle);
      });
      
      row.getCell('amount').numFmt = '$#,##0.00';
      row.getCell('profitLoss').numFmt = '$#,##0.00';
      
      totalAmount += payment.amount;
      totalProfit += payment.amount;
      rowNumber++;
    });
    
    // Add returns (negative values)
    returns.forEach(returnItem => {
      const returnTime = returnItem.created_at ? returnItem.created_at.split(' ')[1] : '';
      const row = summarySheet.addRow({
        type: 'Return (' + returnItem.original_sale_type + ')',
        datetime: returnItem.return_date + ' ' + returnTime,
        id: returnItem.id,
        description: 'Return: ' + returnItem.product_name,
        customer: returnItem.customer_name,
        quantity: returnItem.quantity,
        unitPrice: returnItem.sale_price,
        amount: -returnItem.refund_amount,
        profitLoss: -returnItem.profit_loss,
        notes: returnItem.reason || ''
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, returnStyle);
      });
      
      row.getCell('unitPrice').numFmt = '$#,##0.00';
      row.getCell('amount').numFmt = '$#,##0.00';
      row.getCell('profitLoss').numFmt = '$#,##0.00';
      
      // Make negative values red
      row.getCell('amount').font = { color: { argb: 'FFFF0000' } };
      row.getCell('profitLoss').font = { color: { argb: 'FFFF0000' } };
      
      totalAmount -= returnItem.refund_amount;
      totalProfit -= returnItem.profit_loss;
      rowNumber++;
    });
    
    // Add expenses (negative values)
    expenses.forEach(expense => {
      const expenseTime = expense.created_at ? expense.created_at.split(' ')[1] : '';
      const row = summarySheet.addRow({
        type: 'Expense',
        datetime: expense.expense_date + ' ' + expenseTime,
        id: expense.id,
        description: expense.description || 'Expense',
        customer: '',
        quantity: '',
        unitPrice: '',
        amount: -expense.amount,
        profitLoss: -expense.amount,
        notes: expense.category || ''
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, expenseStyle);
      });
      
      row.getCell('amount').numFmt = '$#,##0.00';
      row.getCell('profitLoss').numFmt = '$#,##0.00';
      
      // Make negative values red
      row.getCell('amount').font = { color: { argb: 'FFFF0000' } };
      row.getCell('profitLoss').font = { color: { argb: 'FFFF0000' } };
      
      totalAmount -= expense.amount;
      totalProfit -= expense.amount;
      rowNumber++;
    });
    
    // Add totals row
    const totalRow = summarySheet.addRow({
      type: 'TOTAL',
      datetime: '',
      id: '',
      description: '',
      customer: '',
      quantity: '',
      unitPrice: '',
      amount: totalAmount,
      profitLoss: totalProfit,
      notes: ''
    });
    
    totalRow.eachCell((cell) => {
      Object.assign(cell.style, totalStyle);
    });
    
    totalRow.getCell('amount').numFmt = '$#,##0.00';
    totalRow.getCell('profitLoss').numFmt = '$#,##0.00';
    
    // ===== CREATE DETAILED SHEETS =====
    
    // Sales sheet
    const salesSheet = workbook.addWorksheet('Sales');
    salesSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Date/Time', key: 'datetime', width: 20 },
      { header: 'Product Name', key: 'product', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Sale Price', key: 'salePrice', width: 12 },
      { header: 'Purchase Price', key: 'purchasePrice', width: 12 },
      { header: 'Total Amount', key: 'total', width: 12 },
      { header: 'Profit', key: 'profit', width: 12 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Customer', key: 'customer', width: 20 }
    ];
    
    salesSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    sales.forEach(sale => {
      const row = salesSheet.addRow({
        id: sale.id,
        datetime: sale.created_at,
        product: sale.product_name,
        quantity: sale.quantity,
        salePrice: sale.sale_price,
        purchasePrice: sale.purchase_price,
        total: sale.total_amount,
        profit: sale.profit,
        type: sale.sale_type,
        customer: sale.customer_name
      });
      
      const style = sale.sale_type === 'Cash' ? saleCashStyle : saleCreditStyle;
      row.eachCell((cell) => {
        Object.assign(cell.style, style);
      });
      
      row.getCell('salePrice').numFmt = '$#,##0.00';
      row.getCell('purchasePrice').numFmt = '$#,##0.00';
      row.getCell('total').numFmt = '$#,##0.00';
      row.getCell('profit').numFmt = '$#,##0.00';
    });
    
    // Payments sheet
    const paymentsSheet = workbook.addWorksheet('Payments');
    paymentsSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Payment Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Customer Name', key: 'customer', width: 20 },
      { header: 'Customer Phone', key: 'phone', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    
    paymentsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    payments.forEach(payment => {
      const row = paymentsSheet.addRow({
        id: payment.id,
        date: payment.payment_date,
        time: payment.created_at ? payment.created_at.split(' ')[1] : '',
        customer: payment.customer_name,
        phone: payment.customer_phone || '',
        amount: payment.amount,
        notes: payment.notes || ''
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, paymentStyle);
      });
      
      row.getCell('amount').numFmt = '$#,##0.00';
    });
    
    // Returns sheet
    const returnsSheet = workbook.addWorksheet('Returns');
    returnsSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Return Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Product Name', key: 'product', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Original Sale Price', key: 'salePrice', width: 15 },
      { header: 'Refund Amount', key: 'refund', width: 12 },
      { header: 'Profit Loss', key: 'profitLoss', width: 12 },
      { header: 'Original Sale Type', key: 'type', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Reason', key: 'reason', width: 30 },
      { header: 'Original Sale ID', key: 'saleId', width: 12 }
    ];
    
    returnsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    returns.forEach(returnItem => {
      const row = returnsSheet.addRow({
        id: returnItem.id,
        date: returnItem.return_date,
        time: returnItem.created_at ? returnItem.created_at.split(' ')[1] : '',
        product: returnItem.product_name,
        quantity: returnItem.quantity,
        salePrice: returnItem.sale_price,
        refund: returnItem.refund_amount,
        profitLoss: returnItem.profit_loss,
        type: returnItem.original_sale_type,
        customer: returnItem.customer_name,
        reason: returnItem.reason || '',
        saleId: returnItem.original_sale_id
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, returnStyle);
      });
      
      row.getCell('salePrice').numFmt = '$#,##0.00';
      row.getCell('refund').numFmt = '$#,##0.00';
      row.getCell('profitLoss').numFmt = '$#,##0.00';
      
      // Make negative values red
      row.getCell('refund').font = { color: { argb: 'FFFF0000' } };
      row.getCell('profitLoss').font = { color: { argb: 'FFFF0000' } };
    });
    
    // Expenses sheet
    const expensesSheet = workbook.addWorksheet('Expenses');
    expensesSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Expense Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 }
    ];
    
    expensesSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    
    expenses.forEach(expense => {
      const row = expensesSheet.addRow({
        id: expense.id,
        date: expense.expense_date,
        time: expense.created_at ? expense.created_at.split(' ')[1] : '',
        amount: expense.amount,
        description: expense.description || '',
        category: expense.category || ''
      });
      
      row.eachCell((cell) => {
        Object.assign(cell.style, expenseStyle);
      });
      
      row.getCell('amount').numFmt = '$#,##0.00';
    });
    
    // Generate filename with today's date
    const filename = `Daily_Report_${today.toISOString().slice(0, 10)}.xlsx`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting today\'s data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Error exporting data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
