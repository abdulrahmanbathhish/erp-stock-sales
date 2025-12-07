let allProducts = [];
let searchTimeout = null;
let searchTimeouts = {};

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

// Highlight text in search results
function highlightText(text, query) {
  if (!query || query.trim() === '') return text;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Search product with dropdown (for product-search input)
async function searchProduct(event, rowId) {
  const input = event.target;
  const query = input.value.trim();
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  
  if (!resultsDiv) return;
  
  clearTimeout(searchTimeouts[rowId]);
  
  if (query.length < 2) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
    // Also filter the product list
    searchProducts(query);
    return;
  }

  // Show loading state
  resultsDiv.innerHTML = `
    <div class="list-group-item text-center text-muted">
      <small data-en="Searching..." data-ar="جاري البحث...">جاري البحث...</small>
    </div>
  `;
  resultsDiv.classList.add('show');
  resultsDiv.style.display = 'block';
  
  searchTimeouts[rowId] = setTimeout(async () => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const products = await response.json();

      if (products.length === 0) {
        resultsDiv.innerHTML = `
          <div class="list-group-item text-muted text-center" data-en="No products found" data-ar="لم يتم العثور على منتجات">لم يتم العثور على منتجات</div>
        `;
        resultsDiv.classList.add('show');
        resultsDiv.style.display = 'block';
        return;
      }

      // Sort products: exact matches first, then starts with, then contains
      const queryLower = query.toLowerCase();
      const sortedProducts = products.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        const aExact = aName === queryLower ? 0 : (aName.startsWith(queryLower) ? 1 : 2);
        const bExact = bName === queryLower ? 0 : (bName.startsWith(queryLower) ? 1 : 2);
        
        if (aExact !== bExact) return aExact - bExact;
        return aName.localeCompare(bName);
      });

      resultsDiv.innerHTML = sortedProducts.map((product, index) => {
        const highlightedName = highlightText(product.name, query);
        const stockClass = product.stock_quantity <= 0 ? 'text-danger' : (product.stock_quantity <= 5 ? 'text-warning' : 'text-success');
        const currentPrice = product.sale_price ? formatCurrency(product.sale_price) : formatCurrency(product.purchase_price || 0);
        return `
          <button type="button" 
                  class="list-group-item list-group-item-action search-result-item" 
                  onclick="handleSelectProductFromSearch('product-search-main', ${product.id}, '${product.name.replace(/'/g, "\\'")}')"
                  data-row-id="${rowId}"
                  data-product-id="${product.id}"
                  tabindex="0">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <strong class="search-result-item__name">${highlightedName}</strong>
                <div class="search-result-item__details">
                  <span class="${stockClass}">
                    <span data-en="Stock:" data-ar="المخزون:">المخزون:</span> ${product.stock_quantity}
                  </span>
                  <span class="text-muted">|</span>
                  <span class="text-muted">
                    <span data-en="Price:" data-ar="السعر:">السعر:</span> ${currentPrice}
                  </span>
                </div>
              </div>
            </div>
          </button>
        `;
      }).join('');
      
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
      
      // Store current query for keyboard navigation
      resultsDiv.dataset.currentQuery = query;
    } catch (error) {
      console.error('Error searching products:', error);
      resultsDiv.innerHTML = `
        <div class="list-group-item text-danger text-center">
          <small data-en="Error searching products. Please try again." data-ar="خطأ في البحث. يرجى المحاولة مرة أخرى.">خطأ في البحث. يرجى المحاولة مرة أخرى.</small>
        </div>
      `;
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
    }
  }, 250);
}

// Show search results on focus
function showSearchResults(rowId) {
  const input = document.querySelector(`input.product-search[data-row-id="${rowId}"]`);
  if (input && input.value.trim().length >= 2) {
    searchProduct({ target: input }, rowId);
  }
}

// Handle keyboard navigation in search results
function handleSearchKeyboard(event, rowId) {
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  if (!resultsDiv || !resultsDiv.classList.contains('show')) return;
  
  const items = resultsDiv.querySelectorAll('.search-result-item, .list-group-item-action');
  if (items.length === 0) return;
  
  const currentIndex = Array.from(items).findIndex(item => item === document.activeElement || item.classList.contains('active'));
  let newIndex = currentIndex;
  
  switch(event.key) {
    case 'ArrowDown':
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[newIndex].focus();
      items[newIndex].classList.add('active');
      if (currentIndex >= 0) items[currentIndex].classList.remove('active');
      break;
    case 'ArrowUp':
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[newIndex].focus();
      items[newIndex].classList.add('active');
      if (currentIndex >= 0) items[currentIndex].classList.remove('active');
      break;
    case 'Enter':
      event.preventDefault();
      if (currentIndex >= 0 && items[currentIndex]) {
        items[currentIndex].click();
      }
      break;
    case 'Escape':
      event.preventDefault();
      resultsDiv.classList.remove('show');
      resultsDiv.style.display = 'none';
      const input = document.querySelector(`input.product-search[data-row-id="${rowId}"]`);
      if (input) input.blur();
      break;
  }
}

// Handle product selection from search dropdown
function handleSelectProductFromSearch(rowId, productId, productName) {
  // Close the dropdown
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }
  
  // Set the input value
  const input = document.querySelector(`input.product-search[data-row-id="${rowId}"]`);
  if (input) {
    input.value = productName;
  }
  
  // Filter the product list to show only this product
  searchProducts(productName);
  
  // Scroll to the product card if it exists
  setTimeout(() => {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const cardName = card.querySelector('.product-card__name')?.textContent;
      if (cardName === productName) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the card briefly
        card.style.transition = 'background-color 0.3s';
        card.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        setTimeout(() => {
          card.style.backgroundColor = '';
        }, 2000);
      }
    });
  }, 100);
}

// Search products (filter list)
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

// Initialize Socket.io for real-time updates
let socket = null;

function initSocket() {
  // Connect to Socket.io server
  socket = io();
  
  // Listen for product created
  socket.on('product:created', (data) => {
    console.log('New product created:', data);
    loadProducts();
  });
  
  // Listen for product updated
  socket.on('product:updated', (data) => {
    console.log('Product updated:', data);
    loadProducts();
  });
  
  // Listen for product deleted
  socket.on('product:deleted', (data) => {
    console.log('Product deleted:', data);
    loadProducts();
  });
  
  // Handle connection events
  socket.on('connect', () => {
    console.log('✅ Connected to real-time server');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from real-time server');
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  // Initialize socket connection
  initSocket();
  
  // Search input handler (for filtering the list)
  document.getElementById('product-search').addEventListener('input', (e) => {
    // Only filter if dropdown is not showing or if user is typing
    const resultsDiv = document.getElementById('search-results-product-search-main');
    if (!resultsDiv || !resultsDiv.classList.contains('show')) {
      searchProducts(e.target.value);
    }
  });
  
  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    const productResults = document.getElementById('search-results-product-search-main');
    const searchInput = document.getElementById('product-search');
    
    if (!e.target.closest('#product-search') && !e.target.closest('#search-results-product-search-main')) {
      if (productResults) {
        productResults.classList.remove('show');
        productResults.style.display = 'none';
      }
    }
  });
});

