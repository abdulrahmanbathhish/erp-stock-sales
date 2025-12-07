const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Using SQLite for local storage
// Data is stored in data/database.sqlite file

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    sale_price REAL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_id INTEGER,
    quantity INTEGER NOT NULL,
    purchase_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    profit REAL NOT NULL,
    is_credit INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
  CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

  CREATE TABLE IF NOT EXISTS import_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deletion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    entity_name TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at);
  CREATE INDEX IF NOT EXISTS idx_deletion_log_created_at ON deletion_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_deletion_log_entity_type ON deletion_log(entity_type);

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT,
    expense_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    customer_id INTEGER,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    return_date DATE NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
  CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
  CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(payment_date);
  CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
  CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
  CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);
`);

// Create customer_id index after migration (if column exists)

// Migrate existing sales table to add customer_id, is_credit, and transaction_id columns if they don't exist
try {
  const tableInfo = db.pragma('table_info(sales)');
  const hasCustomerId = tableInfo.some(col => col.name === 'customer_id');
  const hasIsCredit = tableInfo.some(col => col.name === 'is_credit');
  const hasTransactionId = tableInfo.some(col => col.name === 'transaction_id');
  
  if (!hasCustomerId) {
    db.exec(`ALTER TABLE sales ADD COLUMN customer_id INTEGER;`);
  }
  if (!hasIsCredit) {
    db.exec(`ALTER TABLE sales ADD COLUMN is_credit INTEGER DEFAULT 0;`);
  }
  if (!hasTransactionId) {
    db.exec(`ALTER TABLE sales ADD COLUMN transaction_id TEXT;`);
    // Generate transaction_id for existing sales based on created_at and customer_id
    // Group sales that were created at the same time (within 1 second) with the same customer
    db.exec(`
      UPDATE sales 
      SET transaction_id = customer_id || '_' || strftime('%Y%m%d%H%M%S', created_at)
      WHERE transaction_id IS NULL;
    `);
  }
  // Create indexes after ensuring columns exist
  if (hasCustomerId || !hasCustomerId) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);`);
  }
  if (hasTransactionId || !hasTransactionId) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transaction_id);`);
  }
  if (hasIsCredit || !hasIsCredit) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_is_credit ON sales(is_credit);`);
  }
} catch (error) {
  // Column might already exist or table might not exist yet, ignore
  console.log('Migration note:', error.message);
}

// Migrate existing products table to add is_imported column if it doesn't exist
try {
  const productsTableInfo = db.pragma('table_info(products)');
  const hasIsImported = productsTableInfo.some(col => col.name === 'is_imported');
  
  if (!hasIsImported) {
    db.exec(`ALTER TABLE products ADD COLUMN is_imported INTEGER DEFAULT 0;`);
    // Set all existing products as imported (since they were likely imported before this feature)
    db.exec(`UPDATE products SET is_imported = 1 WHERE is_imported IS NULL OR is_imported = 0;`);
  }
} catch (error) {
  // Column might already exist or table might not exist yet, ignore
  console.log('Migration note (is_imported):', error.message);
}

// Product operations
const productQueries = {
  getAll: db.prepare('SELECT * FROM products ORDER BY name'),
  getById: db.prepare('SELECT * FROM products WHERE id = ?'),
  search: db.prepare('SELECT * FROM products WHERE name LIKE ? ORDER BY name LIMIT 20'),
  searchMultiWord: (words) => {
    // Build dynamic query for multi-word search
    const conditions = words.map(() => 'name LIKE ?').join(' AND ');
    const query = `SELECT * FROM products WHERE ${conditions} ORDER BY name LIMIT 20`;
    const stmt = db.prepare(query);
    const patterns = words.map(word => `%${word}%`);
    return stmt.all(...patterns);
  },
  getHighestSalePrice: db.prepare(`
    SELECT MAX(sale_price) as sale_price 
    FROM sales 
    WHERE product_id = ?
  `),
  getLowStock: db.prepare('SELECT * FROM products WHERE stock_quantity < ? ORDER BY stock_quantity, name'),
  create: db.prepare(`
    INSERT INTO products (name, purchase_price, sale_price, stock_quantity, is_imported)
    VALUES (?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE products 
    SET name = ?, purchase_price = ?, sale_price = ?, stock_quantity = ?, is_imported = ?
    WHERE id = ?
  `),
  updateStock: db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'),
  restoreStock: db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?'),
  delete: db.prepare('DELETE FROM products WHERE id = ?'),
  createOrUpdate: db.transaction((product) => {
    const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name);
    const isImported = product.is_imported !== undefined ? (product.is_imported ? 1 : 0) : 1; // Default to imported if not specified
    if (existing) {
      productQueries.update.run(
        product.name,
        product.purchase_price,
        product.sale_price,
        product.stock_quantity,
        isImported,
        existing.id
      );
      return { id: existing.id, created: false };
    } else {
      const result = productQueries.create.run(
        product.name,
        product.purchase_price,
        product.sale_price,
        product.stock_quantity,
        isImported
      );
      return { id: result.lastInsertRowid, created: true };
    }
  })
};

// Sales operations
const salesQueries = {
  create: db.transaction((sale) => {
    // Check stock - allow negative stock for manually added products (is_imported = 0)
    const product = productQueries.getById.get(sale.product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    const isManuallyAdded = product.is_imported === 0;
    if (!isManuallyAdded && product.stock_quantity < sale.quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock_quantity}, Requested: ${sale.quantity}`);
    }

    // Calculate profit - ensure all values are numbers
    const salePrice = parseFloat(sale.sale_price);
    const purchasePrice = parseFloat(product.purchase_price);
    const quantity = parseInt(sale.quantity);
    
    if (isNaN(salePrice) || isNaN(purchasePrice) || isNaN(quantity)) {
      throw new Error('Invalid numeric values for profit calculation');
    }
    
    // Calculate profit - for credit sales, profit is 0 (will be added when payment is received)
    // For normal sales, profit is calculated normally
    // Note: For manually added products with purchase_price = 0, all revenue is profit (correct behavior)
    let profit;
    if (sale.is_credit) {
      // Credit sales: profit = 0 (profit will be added when payment is received)
      profit = 0;
    } else {
      // Normal sales: calculate profit normally
      // If purchase_price = 0 (manually added product), profit = sale_price * quantity (all revenue is profit)
      profit = (salePrice - purchasePrice) * quantity;
    }
    
    // Ensure profit is a valid number (can be negative if sold at loss for normal sales)
    if (isNaN(profit) || !isFinite(profit)) {
      throw new Error('Calculated profit is not a valid number');
    }

    // Create sale record
    const insertSale = db.prepare(`
      INSERT INTO sales (product_id, customer_id, quantity, purchase_price, sale_price, profit, is_credit, transaction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertSale.run(
      sale.product_id,
      sale.customer_id || null,
      sale.quantity,
      product.purchase_price,
      sale.sale_price,
      profit,
      sale.is_credit ? 1 : 0,
      sale.transaction_id || null
    );

    // Update stock
    productQueries.updateStock.run(sale.quantity, sale.product_id);

    return {
      id: result.lastInsertRowid,
      profit: profit
    };
  }),
  getLatest: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
           c.name as customer_name, c.phone as customer_phone
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRange: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
           c.name as customer_name, c.phone as customer_phone
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.created_at >= ?
    ORDER BY s.created_at DESC
    LIMIT ?
  `),
  getLatestByCustomer: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
           c.name as customer_name, c.phone as customer_phone
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.customer_id = ?
    ORDER BY s.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRangeAndCustomer: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
           c.name as customer_name, c.phone as customer_phone
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.customer_id = ? AND s.created_at >= ?
    ORDER BY s.created_at DESC
    LIMIT ?
  `),
  getStats: db.prepare(`
    SELECT 
      COALESCE(SUM(profit), 0) as total_profit,
      COUNT(*) as total_sales
    FROM sales
    WHERE created_at >= ? AND is_credit = 0
  `),
  getAllTimeStats: db.prepare(`
    SELECT 
      COALESCE(SUM(profit), 0) as total_profit,
      COUNT(*) as total_sales
    FROM sales
    WHERE is_credit = 0
  `),
  // Get profit from payments - calculate profit as (sale_price - purchase_price) × quantity for credit sales
  // This is a complex calculation that needs to be done in JavaScript, not SQL
  // We'll create helper functions for this
  getCreditSalesForProfit: db.prepare(`
    SELECT s.id, s.customer_id, s.quantity, s.sale_price, s.purchase_price,
           (s.sale_price - s.purchase_price) * s.quantity as profit_margin,
           s.sale_price * s.quantity as sale_amount,
           s.created_at
    FROM sales s
    WHERE s.is_credit = 1
    ORDER BY s.created_at ASC
  `),
  getCreditSalesByCustomer: db.prepare(`
    SELECT s.id, s.customer_id, s.quantity, s.sale_price, s.purchase_price,
           (s.sale_price - s.purchase_price) * s.quantity as profit_margin,
           s.sale_price * s.quantity as sale_amount,
           s.created_at
    FROM sales s
    WHERE s.is_credit = 1 AND s.customer_id = ?
    ORDER BY s.created_at ASC
  `),
  getPaymentsByDateRange: db.prepare(`
    SELECT cp.id, cp.customer_id, cp.amount, cp.payment_date
    FROM customer_payments cp
    WHERE cp.payment_date >= ? AND cp.payment_date <= ?
    ORDER BY cp.payment_date ASC, cp.created_at ASC
  `),
  getAllPayments: db.prepare(`
    SELECT cp.id, cp.customer_id, cp.amount, cp.payment_date
    FROM customer_payments cp
    ORDER BY cp.payment_date ASC, cp.created_at ASC
  `),
  getPaymentsByDate: db.prepare(`
    SELECT cp.id, cp.customer_id, cp.amount, cp.payment_date
    FROM customer_payments cp
    WHERE cp.payment_date >= ?
    ORDER BY cp.payment_date ASC, cp.created_at ASC
  `),
  getTopProducts: db.prepare(`
    SELECT 
      p.id,
      p.name,
      SUM(s.quantity) as total_quantity
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE s.created_at >= datetime('now', '-30 days')
    GROUP BY p.id, p.name
    ORDER BY total_quantity DESC
    LIMIT 10
  `),
  getById: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
           c.name as customer_name, c.phone as customer_phone
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `),
  getByCustomerId: db.prepare(`
    SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE s.customer_id = ?
    ORDER BY s.created_at DESC
  `),
  getByTransactionIds: (transactionIds) => {
    if (!transactionIds || transactionIds.length === 0) return [];
    const placeholders = transactionIds.map(() => '?').join(',');
    return db.prepare(`
      SELECT s.*, p.name as product_name, (s.purchase_price * s.quantity) as sold_value,
             c.name as customer_name, c.phone as customer_phone
      FROM sales s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.transaction_id IN (${placeholders})
      ORDER BY s.created_at DESC
    `).all(...transactionIds);
  },
  getSalesByDateRange: db.prepare(`
    SELECT 
      COALESCE(SUM(profit), 0) as total_profit,
      COUNT(*) as total_sales
    FROM sales
    WHERE created_at >= ? AND created_at <= ? AND is_credit = 0
  `),
  update: db.transaction((saleId, updates) => {
    // Get existing sale
    const existingSale = salesQueries.getById.get(saleId);
    if (!existingSale) {
      throw new Error('Sale not found');
    }
    
    // Calculate stock difference if quantity changed
    const quantityDiff = updates.quantity !== undefined 
      ? updates.quantity - existingSale.quantity 
      : 0;
    
    // Update stock if quantity changed
    if (quantityDiff !== 0) {
      if (quantityDiff > 0) {
        // Quantity increased - check stock availability
        const product = productQueries.getById.get(existingSale.product_id);
        const isManuallyAdded = product.is_imported === 0;
        if (!isManuallyAdded && product.stock_quantity < quantityDiff) {
          throw new Error(`Insufficient stock. Available: ${product.stock_quantity}, Requested increase: ${quantityDiff}`);
        }
        productQueries.updateStock.run(quantityDiff, existingSale.product_id);
      } else {
        // Quantity decreased - restore stock
        productQueries.restoreStock.run(-quantityDiff, existingSale.product_id);
      }
    }
    
    // Calculate new profit if price or quantity changed
    let profit = existingSale.profit;
    if (updates.sale_price !== undefined || updates.quantity !== undefined) {
      const salePrice = updates.sale_price !== undefined ? parseFloat(updates.sale_price) : existingSale.sale_price;
      const quantity = updates.quantity !== undefined ? parseInt(updates.quantity) : existingSale.quantity;
      const purchasePrice = parseFloat(existingSale.purchase_price);
      
      if (existingSale.is_credit) {
        profit = 0; // Credit sales have 0 profit until payment
      } else {
        profit = (salePrice - purchasePrice) * quantity;
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (updates.quantity !== undefined) {
      updateFields.push('quantity = ?');
      updateValues.push(parseInt(updates.quantity));
    }
    if (updates.sale_price !== undefined) {
      updateFields.push('sale_price = ?');
      updateValues.push(parseFloat(updates.sale_price));
    }
    if (updates.customer_id !== undefined) {
      updateFields.push('customer_id = ?');
      updateValues.push(updates.customer_id ? parseInt(updates.customer_id) : null);
    }
    if (updates.is_credit !== undefined) {
      updateFields.push('is_credit = ?');
      updateValues.push(updates.is_credit ? 1 : 0);
    }
    
    // Always update profit
    updateFields.push('profit = ?');
    updateValues.push(profit);
    
    if (updateFields.length === 0) {
      return existingSale; // No changes
    }
    
    updateValues.push(saleId);
    const updateQuery = `UPDATE sales SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateValues);
    
    return salesQueries.getById.get(saleId);
  }),
  delete: db.transaction((saleId) => {
    // Get sale details before deleting
    const sale = salesQueries.getById.get(saleId);
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    // Restore stock (add back the quantity)
    productQueries.restoreStock.run(sale.quantity, sale.product_id);
    
    // Delete sale
    db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
    
    return sale;
  })
};

// Customer operations
const customerQueries = {
  getAll: db.prepare('SELECT * FROM customers ORDER BY name'),
  getById: db.prepare('SELECT * FROM customers WHERE id = ?'),
  search: db.prepare(`
    SELECT * FROM customers 
    WHERE name LIKE ? OR phone LIKE ?
    ORDER BY name
    LIMIT 50
  `),
  create: db.prepare(`
    INSERT INTO customers (name, phone, notes)
    VALUES (?, ?, ?)
  `),
  getWithSales: db.prepare(`
    SELECT c.*, 
           COUNT(s.id) as total_sales,
           COALESCE(SUM(s.profit), 0) as total_profit,
           COALESCE(SUM(s.sale_price * s.quantity), 0) as total_revenue
    FROM customers c
    LEFT JOIN sales s ON c.id = s.customer_id
    WHERE c.id = ?
    GROUP BY c.id
  `),
  // Calculate total sales amount for a customer (all sales)
  getTotalSalesAmount: db.prepare(`
    SELECT COALESCE(SUM(sale_price * quantity), 0) as total_amount
    FROM sales
    WHERE customer_id = ?
  `),
  // Calculate total credit sales amount for a customer (only credit sales)
  getTotalCreditSalesAmount: db.prepare(`
    SELECT COALESCE(SUM(sale_price * quantity), 0) as total_amount
    FROM sales
    WHERE customer_id = ? AND is_credit = 1
  `),
  // Calculate total payments for a customer
  getTotalPayments: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_amount
    FROM customer_payments
    WHERE customer_id = ?
  `)
};

// Payment operations
const paymentQueries = {
  create: db.prepare(`
    INSERT INTO customer_payments (customer_id, amount, payment_date, notes)
    VALUES (?, ?, ?, ?)
  `),
  getByCustomerId: db.prepare(`
    SELECT * FROM customer_payments
    WHERE customer_id = ?
    ORDER BY payment_date DESC, created_at DESC
  `),
  getById: db.prepare('SELECT * FROM customer_payments WHERE id = ?'),
  update: db.prepare(`
    UPDATE customer_payments 
    SET customer_id = ?, amount = ?, payment_date = ?, notes = ?
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM customer_payments WHERE id = ?'),
  getLatest: db.prepare(`
    SELECT cp.*, c.name as customer_name, c.phone as customer_phone
    FROM customer_payments cp
    LEFT JOIN customers c ON cp.customer_id = c.id
    ORDER BY cp.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRange: db.prepare(`
    SELECT cp.*, c.name as customer_name, c.phone as customer_phone
    FROM customer_payments cp
    LEFT JOIN customers c ON cp.customer_id = c.id
    WHERE cp.created_at >= ?
    ORDER BY cp.created_at DESC
    LIMIT ?
  `),
  getLatestByCustomer: db.prepare(`
    SELECT cp.*, c.name as customer_name, c.phone as customer_phone
    FROM customer_payments cp
    LEFT JOIN customers c ON cp.customer_id = c.id
    WHERE cp.customer_id = ?
    ORDER BY cp.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRangeAndCustomer: db.prepare(`
    SELECT cp.*, c.name as customer_name, c.phone as customer_phone
    FROM customer_payments cp
    LEFT JOIN customers c ON cp.customer_id = c.id
    WHERE cp.customer_id = ? AND cp.created_at >= ?
    ORDER BY cp.created_at DESC
    LIMIT ?
  `)
};

// Returns operations
const returnQueries = {
  create: db.transaction((returnData) => {
    // Get the original sale
    const sale = salesQueries.getById.get(returnData.sale_id);
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    // Validate return quantity doesn't exceed sale quantity
    const existingReturns = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_returned
      FROM returns
      WHERE sale_id = ?
    `).get(returnData.sale_id);
    
    const totalReturned = existingReturns ? existingReturns.total_returned : 0;
    if (totalReturned + returnData.quantity > sale.quantity) {
      throw new Error(`Cannot return more than sold. Already returned: ${totalReturned}, Sale quantity: ${sale.quantity}`);
    }
    
    // Create return record
    const insertReturn = db.prepare(`
      INSERT INTO returns (sale_id, customer_id, product_id, quantity, return_date, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertReturn.run(
      returnData.sale_id,
      returnData.customer_id || null,
      returnData.product_id,
      returnData.quantity,
      returnData.return_date,
      returnData.reason || null
    );
    
    // Restore stock
    productQueries.restoreStock.run(returnData.quantity, returnData.product_id);
    
    // If it was a credit sale, reduce customer debt
    if (sale.is_credit && sale.customer_id) {
      // The debt reduction is automatic since we're not modifying the sale record
      // The debt calculation already accounts for returns by checking actual sales amounts
      // But we need to track this for accurate debt calculation
      // Actually, debt is calculated as: credit_sales_amount - payments
      // So we don't need to modify debt here, but we should note that returns reduce the effective debt
      // For now, we'll leave debt calculation as is (it's based on sales, not returns)
      // If needed, we can adjust debt calculation later
    }
    
    // If it was a normal sale, we should reduce profit
    // But profit is already recorded, so we'd need to create a negative profit entry
    // For simplicity, we'll leave profit as is and note that returns reduce effective profit
    // This is a design decision - returns don't automatically adjust historical profit
    
    return {
      id: result.lastInsertRowid,
      ...returnData
    };
  }),
  getBySaleId: db.prepare(`
    SELECT * FROM returns
    WHERE sale_id = ?
    ORDER BY return_date DESC, created_at DESC
  `),
  getByCustomerId: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    WHERE r.customer_id = ?
    ORDER BY r.return_date DESC, r.created_at DESC
  `),
  getById: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    WHERE r.id = ?
  `),
  getAll: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    LEFT JOIN customers c ON r.customer_id = c.id
    ORDER BY r.return_date DESC, r.created_at DESC
  `),
  getLatest: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    LEFT JOIN customers c ON r.customer_id = c.id
    ORDER BY r.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRange: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.created_at >= ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `),
  getLatestByCustomer: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.customer_id = ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `),
  getLatestByDateRangeAndCustomer: db.prepare(`
    SELECT r.*, s.product_id, s.sale_price, s.purchase_price, s.is_credit,
           p.name as product_name, c.name as customer_name
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN products p ON r.product_id = p.id
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.customer_id = ? AND r.created_at >= ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `),
  delete: db.transaction((returnId) => {
    const returnRecord = returnQueries.getById.get(returnId);
    if (!returnRecord) {
      throw new Error('Return not found');
    }
    
    // Get the sale to restore stock reduction
    const sale = salesQueries.getById.get(returnRecord.sale_id);
    
    // Reduce stock (reverse the return)
    productQueries.updateStock.run(returnRecord.quantity, returnRecord.product_id);
    
    // Delete return
    db.prepare('DELETE FROM returns WHERE id = ?').run(returnId);
    
    return returnRecord;
  })
};

// Helper function to calculate profit from payments
// Profit is calculated as (sale_price - purchase_price) × quantity for credit sales when payment is received
function calculateProfitFromPayments(payments, creditSales) {
  let totalProfit = 0;
  
  // Create a map of customer_id -> unpaid credit sales (oldest first)
  const customerSalesMap = {};
  creditSales.forEach(sale => {
    if (!customerSalesMap[sale.customer_id]) {
      customerSalesMap[sale.customer_id] = [];
    }
    customerSalesMap[sale.customer_id].push({
      ...sale,
      paidAmount: 0 // Track how much has been paid for this sale
    });
  });
  
  // Process each payment
  payments.forEach(payment => {
    const customerId = payment.customer_id;
    let remainingPayment = parseFloat(payment.amount);
    
    // Get unpaid credit sales for this customer (oldest first)
    const sales = customerSalesMap[customerId] || [];
    
    // Allocate payment to sales (FIFO - oldest first)
    for (const sale of sales) {
      if (remainingPayment <= 0) break;
      
      const saleAmount = parseFloat(sale.sale_amount);
      const unpaidAmount = saleAmount - sale.paidAmount;
      
      if (unpaidAmount > 0) {
        // Calculate how much of this payment goes to this sale
        const paymentForThisSale = Math.min(remainingPayment, unpaidAmount);
        const paymentRatio = paymentForThisSale / saleAmount;
        
        // Calculate profit for this portion: (sale_price - purchase_price) × quantity × ratio
        const profitForThisPayment = parseFloat(sale.profit_margin) * paymentRatio;
        totalProfit += profitForThisPayment;
        
        // Update paid amount
        sale.paidAmount += paymentForThisSale;
        remainingPayment -= paymentForThisSale;
      }
    }
  });
  
  return totalProfit;
}

// Helper functions for date ranges
function getDateRange(period) {
  const now = new Date();
  let startDate;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // Include today, so 7 days total
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0); // All time
      endDate = new Date(9999, 11, 31);
  }

  return {
    start: startDate.toISOString().slice(0, 19).replace('T', ' '),
    end: endDate.toISOString().slice(0, 19).replace('T', ' ')
  };
}

function getDateRangeForExpenses(period) {
  const now = new Date();
  let startDate;
  // Set endDate to end of today (23:59:59)
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = new Date(0);
      endDate = new Date(9999, 11, 31);
      endDate.setHours(23, 59, 59, 999);
  }

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10)
  };
}

module.exports = {
  // Product operations
  getAllProducts: () => productQueries.getAll.all(),
  getProductById: (id) => productQueries.getById.get(id),
  searchProducts: (query) => {
    if (!query || query.trim() === '') return [];
    
    // Split query into words and trim each
    const words = query.trim().split(/\s+/).filter(word => word.length > 0);
    
    let products;
    // If single word, use simple LIKE search
    if (words.length === 1) {
      products = productQueries.search.all(`%${words[0]}%`);
    } else {
      // If multiple words, use multi-word search (all words must match)
      products = productQueries.searchMultiWord(words);
    }
    
    // Add highest sale price to each product
    return products.map(product => {
      const highestSale = productQueries.getHighestSalePrice.get(product.id);
      return {
        ...product,
        latest_sale_price: highestSale && highestSale.sale_price ? highestSale.sale_price : null
      };
    });
  },
  getLowStockProducts: (threshold = 5) => productQueries.getLowStock.all(threshold),
  createProduct: (product) => {
    const isImported = product.is_imported !== undefined ? (product.is_imported ? 1 : 0) : 0; // Default to manually added if not specified
    const result = productQueries.create.run(
      product.name,
      product.purchase_price || 0,
      product.sale_price || null,
      product.stock_quantity || 0,
      isImported
    );
    // Return the full product from database to ensure all fields are correct
    return productQueries.getById.get(result.lastInsertRowid);
  },
  createOrUpdateProduct: (product) => productQueries.createOrUpdate(product),

  // Sales operations
  createSale: (sale) => salesQueries.create(sale),
  getLatestSales: (limit = 10) => salesQueries.getLatest.all(limit),
  getLatestSalesByDateRange: (startDate, limit = 10) => salesQueries.getLatestByDateRange.all(startDate, limit),
  getLatestSalesByCustomer: (customerId, limit = 10) => salesQueries.getLatestByCustomer.all(customerId, limit),
  getLatestSalesByDateRangeAndCustomer: (customerId, startDate, limit = 10) => salesQueries.getLatestByDateRangeAndCustomer.all(customerId, startDate, limit),
  getSalesByTransactionIds: (transactionIds) => salesQueries.getByTransactionIds(transactionIds),
  getSalesStats: (period) => {
    let stats;
    let paymentProfit = 0;
    
    // Get all credit sales for profit calculation
    const allCreditSales = salesQueries.getCreditSalesForProfit.all();
    
    if (period === 'all') {
      stats = salesQueries.getAllTimeStats.get();
      // Get all payments and calculate profit
      const allPayments = salesQueries.getAllPayments.all();
      paymentProfit = calculateProfitFromPayments(allPayments, allCreditSales);
    } else {
      const dateRange = getDateRange(period);
      // Use the date range query for more accurate results
      stats = salesQueries.getSalesByDateRange.get(dateRange.start, dateRange.end);
      // Get payments in the date range and calculate profit
      // Note: We need to consider all credit sales (even if created before the period)
      // but only payments within the period
      const paymentsInPeriod = salesQueries.getPaymentsByDateRange.all(dateRange.start, dateRange.end);
      paymentProfit = calculateProfitFromPayments(paymentsInPeriod, allCreditSales);
    }
    
    // Total profit = profit from normal sales + profit from payments
    const totalProfit = (parseFloat(stats.total_profit) || 0) + (parseFloat(paymentProfit) || 0);
    
    // Ensure values are always numbers
    return {
      total_profit: totalProfit,
      total_sales: parseInt(stats.total_sales) || 0
    };
  },
  getSalesStatsByDateRange: (startDate, endDate) => {
    const stats = salesQueries.getSalesByDateRange.get(startDate, endDate);
    // Get all credit sales for profit calculation
    const allCreditSales = salesQueries.getCreditSalesForProfit.all();
    // Get payments in the date range and calculate profit
    const paymentsInPeriod = salesQueries.getPaymentsByDateRange.all(startDate, endDate);
    const paymentProfit = calculateProfitFromPayments(paymentsInPeriod, allCreditSales);
    const totalProfit = (parseFloat(stats.total_profit) || 0) + (parseFloat(paymentProfit) || 0);
    
    return {
      total_profit: totalProfit,
      total_sales: parseInt(stats.total_sales) || 0
    };
  },
  getTopProducts: () => salesQueries.getTopProducts.all(),
  getSaleById: (id) => salesQueries.getById.get(id),
  updateSale: (id, updates) => salesQueries.update(id, updates),
  deleteSale: (id) => salesQueries.delete(id),
  createMultipleSales: (sales) => {
    return db.transaction(() => {
      // Use provided transaction_id if available, otherwise generate a new one
      // Format: timestamp_customerId_random (or just timestamp if no customer)
      let transactionId = sales[0]?.transaction_id || null;
      
      if (!transactionId) {
        const timestamp = Date.now();
        const customerId = sales[0]?.customer_id || 'cash';
        const random = Math.random().toString(36).substring(2, 9);
        transactionId = `${timestamp}_${customerId}_${random}`;
      }
      
      const results = [];
      for (const sale of sales) {
        // Assign the same transaction_id to all sales in this batch
        const saleWithTransaction = { ...sale, transaction_id: transactionId };
        const result = salesQueries.create(saleWithTransaction);
        results.push(result);
      }
      return results;
    })();
  },

  // Product delete
  deleteProduct: (id) => {
    const product = productQueries.getById.get(id);
    if (!product) {
      throw new Error('Product not found');
    }
    productQueries.delete.run(id);
    return product;
  },
  // Product update
  updateProduct: (id, product) => {
    const existing = productQueries.getById.get(id);
    if (!existing) {
      throw new Error('Product not found');
    }
    const isImported = product.is_imported !== undefined ? (product.is_imported ? 1 : 0) : existing.is_imported || 0;
    productQueries.update.run(
      product.name,
      product.purchase_price,
      product.sale_price || null,
      product.stock_quantity,
      isImported,
      id
    );
    return productQueries.getById.get(id);
  },
  // Capital calculation (total stock value)
  // Only count positive stock - negative stock means oversold items and shouldn't contribute to capital
  getCapital: () => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(purchase_price * CASE WHEN stock_quantity > 0 THEN stock_quantity ELSE 0 END), 0) as total_capital
      FROM products
    `).get();
    return {
      total_capital: parseFloat(result.total_capital) || 0
    };
  },
  // Total sold value (sum of purchase_price × quantity for all sales)
  getTotalSoldValue: () => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(purchase_price * quantity), 0) as total_sold_value
      FROM sales
    `).get();
    return {
      total_sold_value: parseFloat(result.total_sold_value) || 0
    };
  },
  getCapitalByDateRange: (startDate, endDate) => {
    // Capital is always current stock value (snapshot)
    // Only count positive stock - negative stock means oversold items and shouldn't contribute to capital
    const result = db.prepare(`
      SELECT COALESCE(SUM(purchase_price * CASE WHEN stock_quantity > 0 THEN stock_quantity ELSE 0 END), 0) as total_capital
      FROM products
    `).get();
    return {
      total_capital: parseFloat(result.total_capital) || 0
    };
  },
  getExpenseStatsByDateRange: (startDate, endDate) => {
    return db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `).get(startDate, endDate);
  },
  getDateRange: (period) => getDateRange(period),
  getDateRangeForExpenses: (period) => getDateRangeForExpenses(period),

  // Reset all data
  resetAllData: () => {
    return db.transaction(() => {
      // Disable foreign key checks temporarily
      db.pragma('foreign_keys = OFF');
      
      // Delete in correct order to respect foreign key constraints
      // 1. Delete returns first (depends on sales, customers, products)
      db.prepare('DELETE FROM returns').run();
      // 2. Delete sales (depends on products)
      db.prepare('DELETE FROM sales').run();
      // 3. Delete customer payments (depends on customers)
      db.prepare('DELETE FROM customer_payments').run();
      // 4. Delete products (no dependencies)
      db.prepare('DELETE FROM products').run();
      // 5. Delete customers (no dependencies)
      db.prepare('DELETE FROM customers').run();
      // 6. Delete expenses (no dependencies)
      db.prepare('DELETE FROM expenses').run();
      // 7. Delete import history (no dependencies)
      db.prepare('DELETE FROM import_history').run();
      // 8. Delete deletion logs (no dependencies)
      db.prepare('DELETE FROM deletion_log').run();
      
      // Re-enable foreign key checks
      db.pragma('foreign_keys = ON');
      
      return { success: true };
    })();
  },

  // History operations
  logImport: (importData) => {
    const insert = db.prepare(`
      INSERT INTO import_history (filename, total_rows, created_count, updated_count, error_count)
      VALUES (?, ?, ?, ?, ?)
    `);
    return insert.run(
      importData.filename,
      importData.total_rows,
      importData.created_count || 0,
      importData.updated_count || 0,
      importData.error_count || 0
    );
  },
  getImportHistory: (limit = 50) => {
    return db.prepare(`
      SELECT * FROM import_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  },
  logDeletion: (deletionData) => {
    const insert = db.prepare(`
      INSERT INTO deletion_log (entity_type, entity_id, entity_name, details)
      VALUES (?, ?, ?, ?)
    `);
    return insert.run(
      deletionData.entity_type,
      deletionData.entity_id,
      deletionData.entity_name || null,
      deletionData.details || null
    );
  },
  getDeletionLog: (limit = 50) => {
    return db.prepare(`
      SELECT * FROM deletion_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  },

  // Expense operations
  createExpense: (expense) => {
    const insert = db.prepare(`
      INSERT INTO expenses (amount, description, category, expense_date)
      VALUES (?, ?, ?, ?)
    `);
    const result = insert.run(
      expense.amount,
      expense.description || null,
      expense.category || null,
      expense.expense_date
    );
    return { id: result.lastInsertRowid, ...expense };
  },
  createMultipleExpenses: (expenses) => {
    return db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO expenses (amount, description, category, expense_date)
        VALUES (?, ?, ?, ?)
      `);
      const results = [];
      for (const expense of expenses) {
        const result = insert.run(
          expense.amount,
          expense.description || null,
          expense.category || null,
          expense.expense_date
        );
        results.push({ id: result.lastInsertRowid, ...expense });
      }
      return results;
    })();
  },
  getAllExpenses: (limit = 100) => {
    return db.prepare(`
      SELECT * FROM expenses 
      ORDER BY expense_date DESC, created_at DESC 
      LIMIT ?
    `).all(limit);
  },
  getExpensesByDateRange: (startDate, endDate) => {
    return db.prepare(`
      SELECT * FROM expenses 
      WHERE expense_date >= ? AND expense_date <= ?
      ORDER BY expense_date DESC, created_at DESC
    `).all(startDate, endDate);
  },
  getExpenseById: (id) => {
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  },
  updateExpense: (id, expense) => {
    const update = db.prepare(`
      UPDATE expenses 
      SET amount = ?, description = ?, category = ?, expense_date = ?
      WHERE id = ?
    `);
    update.run(
      expense.amount,
      expense.description || null,
      expense.category || null,
      expense.expense_date,
      id
    );
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  },
  deleteExpense: (id) => {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return expense;
  },
  getExpenseStats: (startDate, endDate) => {
    return db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `).get(startDate, endDate);
  },
  getExpenseCategories: () => {
    return db.prepare(`
      SELECT DISTINCT category 
      FROM expenses 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `).all();
  },

  // Customer operations
  getAllCustomers: () => {
    const customers = customerQueries.getAll.all();
    // Add debt calculation for each customer (only credit sales count toward debt, accounting for returns)
    return customers.map(customer => {
      // Use getCustomerDebt to properly account for returns
      const debt = module.exports.getCustomerDebt(customer.id);
      return {
        ...customer,
        debt: debt
      };
    });
  },
  getCustomerById: (id) => customerQueries.getById.get(id),
  searchCustomers: (query) => {
    const searchTerm = `%${query}%`;
    const customers = customerQueries.search.all(searchTerm, searchTerm);
    // Add debt calculation for each customer (only credit sales count toward debt, accounting for returns)
    return customers.map(customer => {
      // Use getCustomerDebt to properly account for returns
      const debt = module.exports.getCustomerDebt(customer.id);
      return {
        ...customer,
        debt: debt
      };
    });
  },
  createCustomer: (customer) => {
    const result = customerQueries.create.run(
      customer.name,
      customer.phone || null,
      customer.notes || null
    );
    return { id: result.lastInsertRowid, ...customer };
  },
  getCustomerWithSales: (id) => {
    const customer = customerQueries.getWithSales.get(id);
    if (!customer) {
      return null;
    }
    const sales = salesQueries.getByCustomerId.all(id);
    const totalSales = customerQueries.getTotalSalesAmount.get(id).total_amount || 0;
    const totalCreditSales = customerQueries.getTotalCreditSalesAmount.get(id).total_amount || 0;
    const totalPayments = customerQueries.getTotalPayments.get(id).total_amount || 0;
    // Use getCustomerDebt to properly account for returns
    const debt = module.exports.getCustomerDebt(id);
    const payments = paymentQueries.getByCustomerId.all(id);
    
    return {
      ...customer,
      sales: sales,
      debt: debt,
      total_sales_amount: parseFloat(totalSales),
      total_credit_sales: parseFloat(totalCreditSales),
      total_payments: parseFloat(totalPayments),
      payments: payments
    };
  },
  // Calculate customer debt (only credit sales count, accounting for returns)
  getCustomerDebt: (id) => {
    const totalCreditSales = customerQueries.getTotalCreditSalesAmount.get(id).total_amount || 0;
    const totalPayments = customerQueries.getTotalPayments.get(id).total_amount || 0;
    
    // Calculate total returned amount for credit sales
    const returnsForCreditSales = db.prepare(`
      SELECT COALESCE(SUM(r.quantity * s.sale_price), 0) as total_returned_amount
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      WHERE r.customer_id = ? AND s.is_credit = 1
    `).get(id);
    
    const returnedAmount = returnsForCreditSales ? parseFloat(returnsForCreditSales.total_returned_amount) : 0;
    
    // Debt = credit sales - payments - returns
    return parseFloat(totalCreditSales) - parseFloat(totalPayments) - returnedAmount;
  },

  // Payment operations
  createPayment: (payment) => {
    const result = paymentQueries.create.run(
      payment.customer_id,
      payment.amount,
      payment.payment_date,
      payment.notes || null
    );
    return { id: result.lastInsertRowid, ...payment };
  },
  getCustomerPayments: (customerId) => paymentQueries.getByCustomerId.all(customerId),
  getPaymentById: (id) => paymentQueries.getById.get(id),
  updatePayment: (id, payment) => {
    const existing = paymentQueries.getById.get(id);
    if (!existing) {
      throw new Error('Payment not found');
    }
    paymentQueries.update.run(
      payment.customer_id ? parseInt(payment.customer_id) : null,
      parseFloat(payment.amount),
      payment.payment_date,
      payment.notes || null,
      id
    );
    return paymentQueries.getById.get(id);
  },
  deletePayment: (id) => {
    const payment = paymentQueries.getById.get(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    paymentQueries.delete.run(id);
    return payment;
  },
  getLatestPayments: (limit = 10) => paymentQueries.getLatest.all(limit),
  getLatestPaymentsByDateRange: (startDate, limit = 10) => paymentQueries.getLatestByDateRange.all(startDate, limit),
  getLatestPaymentsByCustomer: (customerId, limit = 10) => paymentQueries.getLatestByCustomer.all(customerId, limit),
  getLatestPaymentsByDateRangeAndCustomer: (customerId, startDate, limit = 10) => paymentQueries.getLatestByDateRangeAndCustomer.all(customerId, startDate, limit),

  // Get total customer debt (sum of all customer balances)
  getTotalCustomerDebt: () => {
    const customers = customerQueries.getAll.all();
    let totalDebt = 0;
    customers.forEach(customer => {
      const debt = module.exports.getCustomerDebt(customer.id);
      if (debt > 0) {
        totalDebt += debt;
      }
    });
    return totalDebt;
  },

  // Returns operations
  createReturn: (returnData) => returnQueries.create(returnData),
  getReturnById: (id) => returnQueries.getById.get(id),
  getReturnsBySaleId: (saleId) => returnQueries.getBySaleId.all(saleId),
  getReturnsByCustomerId: (customerId) => returnQueries.getByCustomerId.all(customerId),
  getAllReturns: () => returnQueries.getAll.all(),
  getLatestReturns: (limit = 10) => returnQueries.getLatest.all(limit),
  getLatestReturnsByDateRange: (startDate, limit = 10) => returnQueries.getLatestByDateRange.all(startDate, limit),
  getLatestReturnsByCustomer: (customerId, limit = 10) => returnQueries.getLatestByCustomer.all(customerId, limit),
  getLatestReturnsByDateRangeAndCustomer: (customerId, startDate, limit = 10) => returnQueries.getLatestByDateRangeAndCustomer.all(customerId, startDate, limit),
  deleteReturn: (id) => returnQueries.delete(id),

  // Database connection (for potential future use)
  db: db
};

