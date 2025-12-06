let salesRows = [];
let rowCounter = 0;
let searchTimeouts = {};
let selectedCustomerId = null;
let customerSearchTimeout = null;

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Initialize - add first row
function initTable() {
  addNewRow();
  updateSummary();
}

// Add new row (as card)
function addNewRow() {
  const rowId = `row-${rowCounter++}`;
  const container = document.getElementById('sales-cards-container');

  const card = document.createElement('div');
  card.id = rowId;
  card.className = 'sale-card';
  card.innerHTML = `
    <div class="sale-card__header">
      <span class="sale-card__number">#${rowCounter}</span>
      <button class="btn btn-sm btn-danger sale-card__delete" onclick="removeRow('${rowId}')" title="حذف">
        <i class="bi bi-trash"></i>
      </button>
    </div>
    <div class="sale-card__body">
      <div class="sale-card__field">
        <label class="sale-card__label" data-en="Product Name" data-ar="اسم المنتج">اسم المنتج</label>
        <div class="product-search-cell">
          <input type="text" 
                 class="form-control sale-card__input product-search" 
                 placeholder="ابحث عن منتج..."
                 data-row-id="${rowId}"
                 onkeyup="searchProduct(event, '${rowId}')"
                 onfocus="showSearchResults('${rowId}')">
          <div class="search-results list-group" id="search-results-${rowId}"></div>
          <input type="hidden" class="product-id" data-row-id="${rowId}">
          <input type="hidden" class="purchase-price" data-row-id="${rowId}">
        </div>
      </div>
      <div class="sale-card__row">
        <div class="sale-card__field">
          <label class="sale-card__label" data-en="Quantity" data-ar="الكمية">الكمية</label>
          <input type="number" 
                 class="form-control sale-card__input quantity" 
                 min="1" 
                 step="1"
                 data-row-id="${rowId}"
                 onchange="calculateRowTotal('${rowId}')"
                 oninput="calculateRowTotal('${rowId}')">
        </div>
        <div class="sale-card__field">
          <label class="sale-card__label" data-en="Sale Price" data-ar="سعر البيع">سعر البيع</label>
          <input type="number" 
                 class="form-control sale-card__input sale-price" 
                 min="0" 
                 step="0.01"
                 data-row-id="${rowId}"
                 onchange="calculateRowTotal('${rowId}')"
                 oninput="calculateRowTotal('${rowId}')">
        </div>
      </div>
      <div class="sale-card__total">
        <span class="sale-card__total-label" data-en="Total" data-ar="الإجمالي">الإجمالي:</span>
        <span class="sale-card__total-value total-cell" data-row-id="${rowId}">$0.00</span>
      </div>
    </div>
  `;

  container.appendChild(card);
  updateSummary();
}

// Remove row
function removeRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    delete searchTimeouts[rowId];
    updateSummary();
  }
}

// Search product
async function searchProduct(event, rowId) {
  const input = event.target;
  const query = input.value.trim();
  const resultsDiv = document.getElementById(`search-results-${rowId}`);

  if (!resultsDiv) return;

  clearTimeout(searchTimeouts[rowId]);

  if (query.length < 2) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    return;
  }

  searchTimeouts[rowId] = setTimeout(async () => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const products = await response.json();

      if (products.length === 0) {
        resultsDiv.innerHTML = `
          <div class="list-group-item text-muted" data-en="No products found" data-ar="لم يتم العثور على منتجات">لم يتم العثور على منتجات</div>
          <button type="button" 
                  class="list-group-item list-group-item-action list-group-item-primary" 
                  onclick="createAndSelectProduct('${rowId}', '${query.replace(/'/g, "\\'")}')">
            <strong data-en="Add new product with this name" data-ar="إضافة منتج جديد بهذا الاسم">إضافة منتج جديد بهذا الاسم</strong>
            <br>
            <small data-en="Name:" data-ar="الاسم:">الاسم:</small> ${query}
          </button>
        `;
        resultsDiv.classList.add('show');
        resultsDiv.style.display = 'block';
        return;
      }

      resultsDiv.innerHTML = products.map(product => `
        <button type="button" 
                class="list-group-item list-group-item-action" 
                onclick="handleSelectProduct('${rowId}', ${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.purchase_price}, ${product.sale_price || 'null'}, ${product.stock_quantity})">
          <strong>${product.name}</strong><br>
          <small class="text-muted">
            <span data-en="Stock:" data-ar="المخزون:">المخزون:</span> ${product.stock_quantity} | 
            <span data-en="Price:" data-ar="السعر:">السعر:</span> ${product.sale_price ? formatCurrency(product.sale_price) : '<span data-en="Not set" data-ar="غير محدد">غير محدد</span>'}
          </small>
        </button>
      `).join('');
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
    } catch (error) {
      console.error('Error searching products:', error);
      resultsDiv.classList.remove('show');
      resultsDiv.style.display = 'none';
    }
  }, 300);
}

// Show search results on focus
function showSearchResults(rowId) {
  const input = document.querySelector(`input.product-search[data-row-id="${rowId}"]`);
  if (input && input.value.trim().length >= 2) {
    searchProduct({ target: input }, rowId);
  }
}

// Create and select a new product
async function createAndSelectProduct(rowId, productName) {
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
    selectProduct(rowId, data.product.id, data.product.name, 0, null, 0);
    showAlert('Product created successfully', 'success');
  } catch (error) {
    console.error('Error creating product:', error);
    showAlert('Error creating product', 'danger');
  }
}

// Handle select product (wrapper for async)
async function handleSelectProduct(rowId, productId, productName, purchasePrice, salePrice, stockQuantity) {
  await selectProduct(rowId, productId, productName, purchasePrice, salePrice, stockQuantity);
}

// Select product
async function selectProduct(rowId, productId, productName, purchasePrice, salePrice, stockQuantity) {
  const card = document.getElementById(rowId);
  const nameInput = card.querySelector('.product-search');
  const productIdInput = card.querySelector('.product-id');
  const purchasePriceInput = card.querySelector('.purchase-price');
  const salePriceInput = card.querySelector('.sale-price');
  const resultsDiv = document.getElementById(`search-results-${rowId}`);

  nameInput.value = productName;
  productIdInput.value = productId;
  purchasePriceInput.value = purchasePrice;
  salePriceInput.value = salePrice || '';

  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }

  // Fetch full product data to get is_imported flag
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    if (product) {
      // Store stock, product ID, and is_imported flag for validation
      card.dataset.stock = product.stock_quantity;
      card.dataset.productId = productId;
      card.dataset.isImported = product.is_imported || 0;
    } else {
      // Fallback to provided values
      card.dataset.stock = stockQuantity;
      card.dataset.productId = productId;
      card.dataset.isImported = 0;
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    // Fallback to provided values
    card.dataset.stock = stockQuantity;
    card.dataset.productId = productId;
    card.dataset.isImported = 0;
  }

  calculateRowTotal(rowId);
  updateSummary();
}

// Calculate row total
function calculateRowTotal(rowId) {
  const card = document.getElementById(rowId);
  if (!card) return;

  const salePrice = parseFloat(card.querySelector('.sale-price').value) || 0;
  const quantity = parseInt(card.querySelector('.quantity').value) || 0;
  const totalCell = card.querySelector('.total-cell');

  if (salePrice > 0 && quantity > 0) {
    const total = salePrice * quantity;
    totalCell.textContent = formatCurrency(total);
    card.classList.remove('invalid-row');
  } else {
    totalCell.textContent = '$0.00';
    if (card.querySelector('.product-id').value && (quantity <= 0 || salePrice <= 0)) {
      card.classList.add('invalid-row');
    } else {
      card.classList.remove('invalid-row');
    }
  }

  updateSummary();
}

// Update summary
function updateSummary() {
  const cards = document.querySelectorAll('#sales-cards-container .sale-card');
  let validRows = 0;
  let totalAmount = 0;

  cards.forEach(card => {
    const productId = card.querySelector('.product-id').value;
    const quantity = parseInt(card.querySelector('.quantity').value) || 0;
    const salePrice = parseFloat(card.querySelector('.sale-price').value) || 0;

    if (productId && quantity > 0 && salePrice > 0) {
      validRows++;
      const total = salePrice * quantity;
      totalAmount += total;
    }
  });

  document.getElementById('total-rows').textContent = cards.length;
  document.getElementById('valid-rows').textContent = validRows;
  document.getElementById('total-amount-preview').textContent = formatCurrency(totalAmount);
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
  document.getElementById('selected-customer-id').value = '';
  const resultsDiv = document.getElementById('customer-search-results');
  document.getElementById('customer-search-input').value = '';
  document.getElementById('selected-customer-name').style.display = 'none';
  resultsDiv.classList.remove('show');
  resultsDiv.style.display = 'none';
}

// Submit all sales (normal sales only - is_credit = false)
async function submitAllSales() {
  const cards = document.querySelectorAll('#sales-cards-container .sale-card');
  const sales = [];
  const errors = [];

  cards.forEach((card, index) => {
    const productId = card.querySelector('.product-id').value;
    const quantity = parseInt(card.querySelector('.quantity').value) || 0;
    const salePrice = parseFloat(card.querySelector('.sale-price').value) || 0;
    const productName = card.querySelector('.product-search').value;
    const stock = parseInt(card.dataset.stock) || 0;

    if (!productId) {
      if (productName.trim() || quantity > 0 || salePrice > 0) {
        errors.push(`Row ${index + 1}: Product not selected`);
      }
      return; // Skip empty rows
    }

    if (quantity <= 0) {
      errors.push(`Row ${index + 1}: Invalid quantity`);
      return;
    }

    if (salePrice <= 0) {
      errors.push(`Row ${index + 1}: Invalid sale price`);
      return;
    }

    // Check if product allows negative stock (manually added products)
    const isImported = card.dataset.isImported === '1' || card.dataset.isImported === 1;
    const isManuallyAdded = !isImported;
    
    // Only validate stock for imported products
    if (isImported && stock < quantity) {
      errors.push(`Row ${index + 1}: Insufficient stock for ${productName}. Available: ${stock}`);
      return;
    }

    sales.push({
      product_id: parseInt(productId),
      quantity: quantity,
      sale_price: salePrice
    });
  });

  if (errors.length > 0) {
    showAlert('Please fix the following errors:\n' + errors.join('\n'), 'danger');
    return;
  }

  if (sales.length === 0) {
    showAlert('No valid sales to submit', 'warning');
    return;
  }

  if (!confirm(`Submit ${sales.length} sale(s)?`)) {
    return;
  }

  try {
    showAlert('Processing sales...', 'info');

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

    // Clear all cards and reset
    document.getElementById('sales-cards-container').innerHTML = '';
    rowCounter = 0;
    initTable();
    clearCustomer();

    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
  } catch (error) {
    console.error('Error creating sales:', error);
    showAlert('Error creating sales', 'danger');
  }
}

// Show alert
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message.replace(/\n/g, '<br>')}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.innerHTML = '';
  container.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 10000);
}

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.product-search-cell')) {
    document.querySelectorAll('.search-results').forEach(div => {
      div.classList.remove('show');
      div.style.display = 'none';
    });
  }
  const resultsDiv = document.getElementById('customer-search-results');
  if (!e.target.closest('#customer-search-input') && !e.target.closest('#customer-search-results')) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initTable();

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
});

