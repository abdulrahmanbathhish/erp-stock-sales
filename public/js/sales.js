let selectedProduct = null;
let searchTimeout = null;
let cart = []; // Shopping cart array
let selectedCustomerId = null;
let customerSearchTimeout = null;

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Format date
// Format time to AM/PM in Syria timezone
function formatTimeAMPM(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Damascus',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return formatter.format(date);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Damascus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const timeStr = formatTimeAMPM(date);
  const dateParts = dateFormatter.formatToParts(date);
  const year = dateParts.find(p => p.type === 'year').value;
  const month = dateParts.find(p => p.type === 'month').value;
  const day = dateParts.find(p => p.type === 'day').value;
  
  return `${year}-${month}-${day} ${timeStr}`;
}

// Show alert message
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.innerHTML = '';
  container.appendChild(alert);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Search products with autocomplete
async function searchProducts(query) {
  const resultsDiv = document.getElementById('search-results');
  
  if (!query || query.trim().length === 0) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    const products = await response.json();
    
    if (products.length === 0) {
      resultsDiv.innerHTML = `
        <div class="list-group-item text-muted" data-en="No products found" data-ar="لم يتم العثور على منتجات">لم يتم العثور على منتجات</div>
        <button type="button" 
                class="list-group-item list-group-item-action list-group-item-primary" 
                onclick="createAndSelectProduct('${query.replace(/'/g, "\\'")}')">
          <strong data-en="Add new product with this name" data-ar="إضافة منتج جديد بهذا الاسم">إضافة منتج جديد بهذا الاسم</strong>
          <br>
          <small data-en="Name:" data-ar="الاسم:">الاسم:</small> ${query}
        </button>
      `;
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
      return;
    }

    // Highlight matching text
    const queryLower = query.toLowerCase();
    resultsDiv.innerHTML = products.map(product => {
      const name = product.name;
      const nameLower = name.toLowerCase();
      let highlightedName = name;
      
      // Simple highlighting - find first match
      const matchIndex = nameLower.indexOf(queryLower);
      if (matchIndex >= 0) {
        const before = name.substring(0, matchIndex);
        const match = name.substring(matchIndex, matchIndex + query.length);
        const after = name.substring(matchIndex + query.length);
        highlightedName = `${before}<strong>${match}</strong>${after}`;
      }
      
      return `
        <button type="button" 
                class="list-group-item list-group-item-action" 
                onclick="selectProduct(${product.id})">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              ${highlightedName}
              <br>
              <small class="text-muted">
                <span data-en="Stock:" data-ar="المخزون:">المخزون:</span> ${product.stock_quantity} | 
                <span data-en="Price:" data-ar="السعر:">السعر:</span> ${product.sale_price ? formatCurrency(product.sale_price) : '<span data-en="Not set" data-ar="غير محدد">غير محدد</span>'}
              </small>
            </div>
          </div>
        </button>
      `;
    }).join('');
    resultsDiv.classList.add('show');
    resultsDiv.style.display = 'block';
  } catch (error) {
    console.error('Error searching products:', error);
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }
}

// Create and select a new product
async function createAndSelectProduct(productName) {
  try {
    showAlert('Creating product...', 'info');
    
    const response = await fetch('/api/products/quick-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: productName })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Error creating product', 'danger');
      return;
    }
    
    // Select the newly created product
    await selectProduct(data.product.id);
    showAlert('Product created successfully', 'success');
  } catch (error) {
    console.error('Error creating product:', error);
    showAlert('Error creating product', 'danger');
  }
}

// Select product
async function selectProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    
    if (!product) {
      showAlert('Product not found', 'danger');
      return;
    }

    selectedProduct = product;
    
    // Hide search results
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    document.getElementById('product-search').value = product.name;
    
    // Show product info
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-stock').textContent = product.stock_quantity + ' units';
    document.getElementById('product-purchase-price').textContent = formatCurrency(product.purchase_price);
    document.getElementById('product-sale-price').textContent = 
      product.sale_price ? formatCurrency(product.sale_price) : 'Not set';
    
    document.getElementById('product-info').style.display = 'block';
    
    // Show sale form
    document.getElementById('product-id').value = product.id;
    document.getElementById('quantity').value = '';
    document.getElementById('sale-price').value = product.sale_price || '';
    document.getElementById('sale-form').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading product:', error);
    showAlert('Error loading product', 'danger');
  }
}


// Clear form
function clearForm() {
  selectedProduct = null;
  const resultsDiv = document.getElementById('search-results');
  document.getElementById('product-search').value = '';
  resultsDiv.classList.remove('show');
  resultsDiv.style.display = 'none';
  document.getElementById('product-info').style.display = 'none';
  document.getElementById('sale-form').style.display = 'none';
  document.getElementById('sale-form-element').reset();
}

// Add to cart
function addToCart() {
  if (!selectedProduct) {
    showAlert('Please select a product first', 'warning');
    return;
  }

  const productId = parseInt(document.getElementById('product-id').value);
  const quantity = parseInt(document.getElementById('quantity').value);
  const salePrice = parseFloat(document.getElementById('sale-price').value);

  // Validation
  if (quantity <= 0) {
    showAlert('Quantity must be greater than 0', 'danger');
    return;
  }

  // Allow negative stock for manually added products (is_imported = false)
  const isManuallyAdded = selectedProduct.is_imported === 0 || selectedProduct.is_imported === false;
  if (!isManuallyAdded && quantity > selectedProduct.stock_quantity) {
    showAlert(`Insufficient stock. Available: ${selectedProduct.stock_quantity}`, 'danger');
    return;
  }

  if (salePrice < 0) {
    showAlert('Sale price cannot be negative', 'danger');
    return;
  }

  // Check if product already in cart
  const existingIndex = cart.findIndex(item => item.product_id === productId);
  if (existingIndex >= 0) {
    // Update existing cart item
    cart[existingIndex].quantity += quantity;
    cart[existingIndex].sale_price = salePrice; // Update price
  } else {
    // Add new item to cart
    cart.push({
      product_id: productId,
      product_name: selectedProduct.name,
      purchase_price: selectedProduct.purchase_price,
      quantity: quantity,
      sale_price: salePrice,
      stock_quantity: selectedProduct.stock_quantity
    });
  }

  updateCartDisplay();
  showAlert('Product added to cart', 'success');
  
  // Clear form but keep product selected
  document.getElementById('quantity').value = '';
  document.getElementById('sale-price').value = selectedProduct.sale_price || '';
}

// Remove from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

// Clear cart
function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('Are you sure you want to clear the cart?')) {
    cart = [];
    updateCartDisplay();
    showAlert('Cart cleared', 'info');
  }
}

// Update cart display
function updateCartDisplay() {
  const cartSection = document.getElementById('cart-section');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total-amount');
  
  if (cart.length === 0) {
    cartSection.style.display = 'none';
    return;
  }
  
  cartSection.style.display = 'block';
  
  let totalAmount = 0;
  
  cartItems.innerHTML = cart.map((item, index) => {
    const total = item.sale_price * item.quantity;
    totalAmount += total;
    
    return `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.sale_price)}</td>
        <td>${formatCurrency(total)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Remove</button>
        </td>
      </tr>
    `;
  }).join('');
  
  cartTotal.textContent = formatCurrency(totalAmount);
}

// Search customers
async function searchCustomers(query) {
  clearTimeout(customerSearchTimeout);
  
  const resultsDiv = document.getElementById('customer-search-results');
  
  if (!query || query.trim().length === 0) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    return;
  }
  
  customerSearchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      const customers = await response.json();
      
      if (customers.length === 0) {
        resultsDiv.innerHTML = `
          <div class="list-group-item text-muted" data-en="No customers found" data-ar="لم يتم العثور على عملاء">لم يتم العثور على عملاء</div>
          <button type="button" 
                  class="list-group-item list-group-item-action list-group-item-primary" 
                  onclick="createAndSelectCustomer('${query.replace(/'/g, "\\'")}')">
            <strong data-en="Add new customer with this name" data-ar="إضافة عميل جديد بهذا الاسم">إضافة عميل جديد بهذا الاسم</strong>
            <br>
            <small data-en="Name:" data-ar="الاسم:">الاسم:</small> ${query}
          </button>
        `;
        resultsDiv.classList.add('show');
        resultsDiv.style.display = 'block';
        return;
      }
      
      resultsDiv.innerHTML = customers.map(customer => `
        <button type="button" 
                class="list-group-item list-group-item-action" 
                onclick="selectCustomer(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')">
          <strong>${customer.name}</strong>
          ${customer.phone ? `<br><small class="text-muted">${customer.phone}</small>` : ''}
        </button>
      `).join('');
      
      // Add "Walk-in" option
      resultsDiv.innerHTML += `
        <button type="button" 
                class="list-group-item list-group-item-action text-muted" 
                onclick="selectCustomer(null, 'Walk-in')">
          <em data-en="Walk-in / No Customer" data-ar="بدون عميل">بدون عميل</em>
        </button>
      `;
      
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
    } catch (error) {
      console.error('Error searching customers:', error);
      resultsDiv.classList.remove('show');
      resultsDiv.style.display = 'none';
    }
  }, 300);
}

// Create and select a new customer
async function createAndSelectCustomer(customerName) {
  try {
    showAlert('Creating customer...', 'info');
    
    const response = await fetch('/api/customers/quick-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: customerName })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Error creating customer', 'danger');
      return;
    }
    
    // Select the newly created customer
    selectCustomer(data.customer.id, data.customer.name);
    showAlert('Customer created successfully', 'success');
  } catch (error) {
    console.error('Error creating customer:', error);
    showAlert('Error creating customer', 'danger');
  }
}

// Select customer
function selectCustomer(customerId, customerName) {
  selectedCustomerId = customerId;
  const resultsDiv = document.getElementById('customer-search-results');
  document.getElementById('selected-customer-id').value = customerId || '';
  document.getElementById('customer-search-input').value = customerName;
  document.getElementById('selected-customer-name').textContent = customerName;
  document.getElementById('selected-customer-name').style.display = 'block';
  resultsDiv.classList.remove('show');
  resultsDiv.style.display = 'none';
}

// Clear customer selection
function clearCustomer() {
  selectedCustomerId = null;
  const resultsDiv = document.getElementById('customer-search-results');
  document.getElementById('selected-customer-id').value = '';
  document.getElementById('customer-search-input').value = '';
  document.getElementById('selected-customer-name').style.display = 'none';
  resultsDiv.classList.remove('show');
  resultsDiv.style.display = 'none';
}

// Confirm all sales (normal sales only - is_credit = false)
async function confirmAllSales() {
  if (cart.length === 0) {
    showAlert('Cart is empty', 'warning');
    return;
  }

  if (!confirm(`Confirm sale of ${cart.length} product(s)? This will update stock and create sales records.`)) {
    return;
  }

  try {
    // Prepare sales data
    const sales = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      sale_price: item.sale_price
    }));

    const response = await fetch('/api/sales/multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sales,
        customer_id: selectedCustomerId,
        is_credit: false  // Normal sales are never credit
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error creating sales', 'danger');
      return;
    }

    showAlert(`Successfully created ${data.sales_created} sale(s)!`, 'success');
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    
    // Clear form
    clearForm();
    clearCustomer();
    
    // Reload latest sales
    loadLatestSales();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
  } catch (error) {
    console.error('Error creating sales:', error);
    showAlert('Error creating sales', 'danger');
  }
}

// Submit single sale (legacy - now adds to cart)
async function submitSale(event) {
  event.preventDefault();
  addToCart();
}

// Delete sale
async function deleteSale(saleId, productName) {
  if (!confirm(`Are you sure you want to delete this sale?\n\nProduct: ${productName}\n\nThis will restore the stock quantity.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/sales/${saleId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error deleting sale', 'danger');
      return;
    }

    showAlert('Sale deleted successfully. Stock has been restored.', 'success');
    loadLatestSales();
  } catch (error) {
    console.error('Error deleting sale:', error);
    showAlert('Error deleting sale', 'danger');
  }
}

// Load latest sales
async function loadLatestSales() {
  try {
    const response = await fetch('/api/sales?limit=10');
    const sales = await response.json();
    const tbody = document.getElementById('latest-sales');
    
    if (sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No sales yet</td></tr>';
      return;
    }

    tbody.innerHTML = sales.map(sale => {
      const total = sale.sale_price * sale.quantity;
      return `
      <tr>
        <td>${formatDate(sale.created_at)}</td>
        <td>${sale.product_name}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.sale_price)}</td>
        <td>${formatCurrency(total)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteSale(${sale.id}, '${sale.product_name.replace(/'/g, "\\'")}')">Delete</button>
        </td>
      </tr>
    `;
    }).join('');
  } catch (error) {
    console.error('Error loading latest sales:', error);
    document.getElementById('latest-sales').innerHTML = 
      '<tr><td colspan="6" class="text-center text-danger">Error loading sales</td></tr>';
  }
}

// Initialize Socket.io for real-time updates
let socket = null;

function initSocket() {
  // Connect to Socket.io server
  socket = io();
  
  // Listen for new sale events
  socket.on('sale:created', (data) => {
    console.log('New sale received:', data);
    // Reload latest sales to show the new sale
    loadLatestSales();
    // Show a subtle notification
    showAlert('New sale recorded!', 'info');
  });
  
  // Listen for multiple sales created
  socket.on('sales:multiple-created', (data) => {
    console.log('Multiple sales received:', data);
    loadLatestSales();
    showAlert('Sales recorded!', 'info');
  });
  
  // Listen for sale deletion
  socket.on('sale:deleted', (data) => {
    console.log('Sale deleted:', data);
    loadLatestSales();
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
  // Initialize Socket.io
  initSocket();
  // Product search with debounce and autocomplete
  const searchInput = document.getElementById('product-search');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchProducts(e.target.value);
    }, 200); // Faster response for better UX
  });
  
  // Show suggestions on focus if there's text
  searchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim().length > 0) {
      searchProducts(e.target.value);
    }
  });

  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    const productResults = document.getElementById('search-results');
    const customerResults = document.getElementById('customer-search-results');
    
    if (!e.target.closest('#product-search') && !e.target.closest('#search-results')) {
      productResults.classList.remove('show');
      productResults.style.display = 'none';
    }
    if (!e.target.closest('#customer-search-input') && !e.target.closest('#customer-search-results')) {
      customerResults.classList.remove('show');
      customerResults.style.display = 'none';
    }
  });
  
  // Customer search handler
  document.getElementById('customer-search-input').addEventListener('input', (e) => {
    searchCustomers(e.target.value);
  });
  
  // Show customer search on focus
  document.getElementById('customer-search-input').addEventListener('focus', (e) => {
    if (e.target.value.trim().length > 0) {
      searchCustomers(e.target.value);
    }
  });
  
  // Credit checkbox handler
  document.getElementById('is-credit-checkbox').addEventListener('change', updateCreditHelpText);


  // Form submission - now adds to cart
  document.getElementById('sale-form-element').addEventListener('submit', submitSale);
  
  // Confirm all sales button
  document.getElementById('confirm-all-sales').addEventListener('click', confirmAllSales);

  // Load latest sales
  loadLatestSales();
});
