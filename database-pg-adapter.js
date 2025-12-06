// PostgreSQL adapter that mimics SQLite interface for compatibility
// This allows the existing database.js code to work with PostgreSQL
const { Pool } = require('pg');
const deasync = require('deasync');

let pool = null;
let initialized = false;

// Initialize PostgreSQL connection
function initPostgreSQL() {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('amazonaws.com') || connectionString.includes('render.com') 
      ? { rejectUnauthorized: false } 
      : false
  });

  // Initialize tables
  initTables();
  initialized = true;
  console.log('✅ PostgreSQL database connected and initialized');
  return pool;
}

// Initialize database tables
function initTables() {
  const client = deasync((callback) => {
    pool.connect((err, client, release) => {
      if (err) return callback(err);
      callback(null, { client, release });
    });
  })();

  const { client, release } = client;
  
  try {
    const createTables = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        purchase_price REAL NOT NULL,
        sale_price REAL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        is_imported INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        customer_id INTEGER REFERENCES customers(id),
        quantity INTEGER NOT NULL,
        purchase_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        profit REAL NOT NULL,
        is_credit INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS import_history (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        total_rows INTEGER NOT NULL,
        created_count INTEGER NOT NULL DEFAULT 0,
        updated_count INTEGER NOT NULL DEFAULT 0,
        error_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deletion_log (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        entity_name TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT,
        category TEXT,
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        amount REAL NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id),
        customer_id INTEGER REFERENCES customers(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        return_date DATE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_is_credit ON sales(is_credit);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_deletion_log_created_at ON deletion_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_deletion_log_entity_type ON deletion_log(entity_type);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
      CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(payment_date);
      CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
      CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
      CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);
    `;

    // Execute table creation (split by semicolon for PostgreSQL)
    const statements = createTables.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        deasync((callback) => {
          client.query(statement, (err) => {
            if (err && !err.message.includes('already exists')) {
              console.error('Table creation error:', err.message);
            }
            callback();
          });
        })();
      }
    }
  } finally {
    release();
  }
}

// Helper to execute query synchronously
function querySync(sql, params = []) {
  if (!pool) initPostgreSQL();
  
  const client = deasync((callback) => {
    pool.connect((err, client, release) => {
      if (err) return callback(err);
      callback(null, { client, release });
    });
  })();

  const { client, release } = client;
  
  try {
    const result = deasync((callback) => {
      // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      
      client.query(pgSql, params, (err, res) => {
        callback(err, res);
      });
    })();
    
    return {
      rows: result.rows || [],
      rowCount: result.rowCount || 0
    };
  } finally {
    release();
  }
}

// Create prepared statement-like interface
function createPreparedStatement(sql) {
  return {
    get: (params) => {
      const result = querySync(sql, Array.isArray(params) ? params : [params]);
      return result.rows[0] || null;
    },
    all: (params) => {
      const result = querySync(sql, Array.isArray(params) ? params : [params]);
      return result.rows || [];
    },
    run: (params) => {
      const result = querySync(sql, Array.isArray(params) ? params : [params]);
      return {
        lastInsertRowid: result.rows[0]?.id || null,
        changes: result.rowCount || 0
      };
    }
  };
}

// Create transaction-like interface
function createTransaction(fn) {
  return function(...args) {
    if (!pool) initPostgreSQL();
    
    const client = deasync((callback) => {
      pool.connect((err, client, release) => {
        if (err) return callback(err);
        callback(null, { client, release });
      });
    })();

    const { client, release } = client;
    
    try {
      // Begin transaction
      deasync((callback) => {
        client.query('BEGIN', callback);
      })();
      
      // Create a query function for this transaction
      const queryInTransaction = (sql, params = []) => {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        return deasync((callback) => {
          client.query(pgSql, params, callback);
        })();
      };
      
      // Execute the transaction function
      const result = fn(queryInTransaction, ...args);
      
      // Commit transaction
      deasync((callback) => {
        client.query('COMMIT', callback);
      })();
      
      return result;
    } catch (error) {
      // Rollback on error
      deasync((callback) => {
        client.query('ROLLBACK', callback);
      })();
      throw error;
    } finally {
      release();
    }
  };
}

module.exports = {
  initPostgreSQL,
  querySync,
  createPreparedStatement,
  createTransaction,
  pool: () => pool || initPostgreSQL()
};

