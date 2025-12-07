const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all products
router.get('/', (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products by name
router.get('/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const products = db.searchProducts(query);
    
    // Add max historical sale price to each product
    const productsWithMaxPrice = products.map(product => {
      const maxPrice = db.getProductMaxSalePrice(product.id);
      return {
        ...product,
        max_sale_price: maxPrice
      };
    });
    
    res.json(productsWithMaxPrice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a minimal product (name only, for quick add during sales)
router.post('/quick-create', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Create product with minimal data: name only, stock 0, purchase_price 0, is_imported = false
    const product = db.createProduct({
      name: name.trim(),
      purchase_price: 0,
      sale_price: null,
      stock_quantity: 0,
      is_imported: false
    });

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single product by ID
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add max historical sale price
    const maxPrice = db.getProductMaxSalePrice(product.id);
    res.json({
      ...product,
      max_sale_price: maxPrice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock products
router.get('/low-stock/list', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const products = db.getLowStockProducts(threshold);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a product
router.put('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, purchase_price, sale_price, stock_quantity } = req.body;

    if (!name || purchase_price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ error: 'name, purchase_price, and stock_quantity are required' });
    }

    if (purchase_price < 0) {
      return res.status(400).json({ error: 'purchase_price cannot be negative' });
    }

    if (stock_quantity < 0) {
      return res.status(400).json({ error: 'stock_quantity cannot be negative' });
    }

    const product = db.updateProduct(productId, {
      name,
      purchase_price: parseFloat(purchase_price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      stock_quantity: parseInt(stock_quantity)
    });

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a product
router.delete('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = db.deleteProduct(productId);
    
    // Log deletion
    db.logDeletion({
      entity_type: 'product',
      entity_id: productId,
      entity_name: product.name,
      details: `Product deleted: ${product.name} (Stock: ${product.stock_quantity})`
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

