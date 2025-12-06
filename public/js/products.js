let allProducts = [];
let searchTimeout = null;

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Load all products
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
    displayProducts(allProducts);
  } catch (error) {
    console.error('Error loading products:', error);
    const container = document.getElementById('products-list');
    if (container) {
      container.innerHTML = '<div class="text-center text-danger py-5" data-en="Error loading products" data-ar="خطأ في تحميل المنتجات">خطأ في تحميل المنتجات</div>';
    }
  }
}

// Display products as cards (matching screenshot design)
function displayProducts(products) {
  const container = document.getElementById('products-list');
  
  if (products.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-5" data-en="No products found" data-ar="لم يتم العثور على منتجات">لم يتم العثور على منتجات</div>';
    return;
  }

  container.innerHTML = products.map(product => {
    const stock = product.stock_quantity || 0;
    const price = product.sale_price || product.purchase_price || 0;
    
    // Determine stock status color
    let stockClass = 'high';
    if (stock < 20) {
      stockClass = 'low';
    } else if (stock < 50) {
      stockClass = 'medium';
    }
    
    // Category (if available, otherwise use a default)
    const category = product.category || 'عام';
    const location = 'Main'; // Default location, can be enhanced later
    
    return `
      <div class="product-card">
        <div class="product-card__left">
          <div class="product-card__price">${formatCurrency(price)}</div>
          <div class="product-card__stock ${stockClass}">
            ${stock} <span data-en="units" data-ar="وحدات">وحدات</span>
          </div>
        </div>
        <div class="product-card__content">
          <div class="product-card__name">${product.name}</div>
          <div class="product-card__meta">
            <span class="product-card__location">${location}</span>
            <span class="product-card__category">${category}</span>
          </div>
        </div>
        <div class="product-card__icon" onclick="event.stopPropagation(); editProduct(${product.id})" style="cursor: pointer;" title="تعديل">
          <i class="bi bi-box"></i>
        </div>
      </div>
    `;
  }).join('');
}

// Search products
function searchProducts(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!query || query.trim() === '') {
      displayProducts(allProducts);
      return;
    }
    
    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    displayProducts(filtered);
  }, 300);
}

// Reset product form for new product
function resetProductForm() {
  document.getElementById('edit-product-id').value = '';
  document.getElementById('edit-name').value = '';
  document.getElementById('edit-purchase-price').value = '';
  document.getElementById('edit-sale-price').value = '';
  document.getElementById('edit-stock').value = '';
  
  // Update modal title
  const modalTitle = document.querySelector('#editProductModal .modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i><span data-en="Add New Product" data-ar="إضافة منتج جديد">إضافة منتج جديد</span>';
  }
}

// Edit product
async function editProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    
    if (!product) {
      alert('Product not found');
      return;
    }

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-purchase-price').value = product.purchase_price;
    document.getElementById('edit-sale-price').value = product.sale_price || '';
    document.getElementById('edit-stock').value = product.stock_quantity;

    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading product:', error);
    alert('Error loading product');
  }
}

// Save product
async function saveProduct() {
  const id = parseInt(document.getElementById('edit-product-id').value);
  const name = document.getElementById('edit-name').value.trim();
  const purchasePrice = parseFloat(document.getElementById('edit-purchase-price').value);
  const salePrice = document.getElementById('edit-sale-price').value ? parseFloat(document.getElementById('edit-sale-price').value) : null;
  const stock = parseInt(document.getElementById('edit-stock').value);

  if (!name) {
    alert('Product name is required');
    return;
  }

  if (purchasePrice < 0) {
    alert('Purchase price cannot be negative');
    return;
  }

  if (stock < 0) {
    alert('Stock quantity cannot be negative');
    return;
  }

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        stock_quantity: stock
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Error updating product');
      return;
    }

    alert('Product updated successfully');
    const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
    modal.hide();
    loadProducts();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Error updating product');
  }
}

// Delete product
async function deleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Error deleting product');
      return;
    }

    alert('Product deleted successfully');
    loadProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Error deleting product');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  // Search input handler
  document.getElementById('product-search').addEventListener('input', (e) => {
    searchProducts(e.target.value);
  });
});

