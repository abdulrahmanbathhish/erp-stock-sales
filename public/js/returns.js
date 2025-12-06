// Customer search
let customerSearchTimeout;
let customerSearchInput;
let customerSearchResults;
let selectedCustomerId;
let salesSection;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  customerSearchInput = document.getElementById('customer-search-input');
  customerSearchResults = document.getElementById('customer-search-results');
  selectedCustomerId = document.getElementById('selected-customer-id');
  salesSection = document.getElementById('sales-section');
  
  if (!customerSearchInput || !customerSearchResults) return;
  
  // Search customers
  customerSearchInput.addEventListener('input', function() {
    clearTimeout(customerSearchTimeout);
    const query = this.value.trim();
    
    if (query.length < 1) {
      customerSearchResults.classList.remove('show');
      customerSearchResults.style.display = 'none';
      customerSearchResults.innerHTML = '';
      return;
    }
    
    customerSearchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Failed to search customers');
        }
        
        const customers = await response.json();
        
        if (customers.length === 0) {
          const noCustomersMsg = currentLanguage === 'ar' ? 'لم يتم العثور على عملاء' : 'No customers found';
          customerSearchResults.innerHTML = `<div class="list-group-item text-muted">${noCustomersMsg}</div>`;
          customerSearchResults.classList.add('show');
          customerSearchResults.style.display = 'block';
          return;
        }
        
        customerSearchResults.innerHTML = customers.map(customer => `
          <button type="button" class="list-group-item list-group-item-action" onclick="selectCustomer(${customer.id}, '${customer.name.replace(/'/g, "\\'")}'); return false;">
            <strong>${customer.name}</strong>
            ${customer.phone ? `<br><small class="text-muted">${customer.phone}</small>` : ''}
          </button>
        `).join('');
        customerSearchResults.classList.add('show');
        customerSearchResults.style.display = 'block';
      } catch (error) {
        console.error('Error searching customers:', error);
        const errorMsg = currentLanguage === 'ar' ? 'خطأ في البحث عن العملاء' : 'Error searching customers';
        showAlert(errorMsg, 'danger');
        customerSearchResults.classList.remove('show');
        customerSearchResults.style.display = 'none';
        customerSearchResults.innerHTML = '';
      }
    }, 300);
  });
  
  // Clear search when input is cleared
  customerSearchInput.addEventListener('focus', function() {
    if (this.value.trim().length >= 1) {
      // Trigger search if there's already text
      this.dispatchEvent(new Event('input'));
    }
  });
  
  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#customer-search-input') && !e.target.closest('#customer-search-results')) {
      customerSearchResults.classList.remove('show');
      customerSearchResults.style.display = 'none';
    }
  });
  
  // Handle keyboard navigation
  customerSearchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      customerSearchResults.classList.remove('show');
      customerSearchResults.style.display = 'none';
    }
  });
});

// Select customer
function selectCustomer(customerId, customerName) {
  if (!selectedCustomerId || !customerSearchInput || !customerSearchResults) return;
  
  selectedCustomerId.value = customerId;
  customerSearchInput.value = customerName;
  customerSearchResults.classList.remove('show');
  customerSearchResults.style.display = 'none';
  customerSearchResults.innerHTML = '';
  loadCustomerSales(customerId);
}

// Make selectCustomer available globally
window.selectCustomer = selectCustomer;

// Load customer sales
async function loadCustomerSales(customerId) {
  try {
    const response = await fetch(`/api/customers/${customerId}`);
    const customer = await response.json();
    
    if (!customer || !customer.sales) {
      showAlert('No sales found for this customer', 'warning');
      return;
    }
    
    // Get returns for this customer
    const returnsResponse = await fetch(`/api/returns/customer/${customerId}`);
    const returns = await returnsResponse.json();
    
    // Create a map of sale_id -> total returned quantity
    const returnsMap = {};
    returns.forEach(ret => {
      if (!returnsMap[ret.sale_id]) {
        returnsMap[ret.sale_id] = 0;
      }
      returnsMap[ret.sale_id] += ret.quantity;
    });
    
    const salesContainer = document.getElementById('sales-cards-container');
    if (!salesContainer) return;
    
    salesContainer.innerHTML = customer.sales.map(sale => {
      const returnedQty = returnsMap[sale.id] || 0;
      const availableToReturn = sale.quantity - returnedQty;
      const canReturn = availableToReturn > 0;
      const total = parseFloat(sale.sale_price) * sale.quantity;
      
      return `
        <div class="sale-card ${!canReturn ? 'invalid' : ''}" id="sale-card-${sale.id}">
          <div class="sale-card__header">
            <span class="sale-card__number">${formatDate(sale.created_at)}</span>
            ${canReturn ? `<button class="btn btn-sm btn-primary" onclick="openReturnModal(${sale.id}, ${sale.product_id}, ${customerId}, '${sale.product_name.replace(/'/g, "\\'")}', ${sale.quantity}, ${returnedQty})" data-en="Return" data-ar="إرجاع">إرجاع</button>` : '<span class="text-muted" data-en="Fully Returned" data-ar="تم إرجاعه بالكامل">تم إرجاعه بالكامل</span>'}
          </div>
          <div class="sale-card__body">
            <div class="sale-card__field">
              <span class="sale-card__label" data-en="Product" data-ar="المنتج">المنتج:</span>
              <span class="sale-card__input" style="background: transparent; border: none; padding: 0;">${sale.product_name}</span>
            </div>
            <div class="sale-card__row">
              <div class="sale-card__field">
                <span class="sale-card__label" data-en="Quantity" data-ar="الكمية">الكمية:</span>
                <span class="sale-card__input" style="background: transparent; border: none; padding: 0;">${sale.quantity}</span>
              </div>
              <div class="sale-card__field">
                <span class="sale-card__label" data-en="Sale Price" data-ar="سعر البيع">سعر البيع:</span>
                <span class="sale-card__input" style="background: transparent; border: none; padding: 0;">$${parseFloat(sale.sale_price).toFixed(2)}</span>
              </div>
            </div>
            <div class="sale-card__field">
              <span class="sale-card__label" data-en="Already Returned" data-ar="تم إرجاعه">تم إرجاعه:</span>
              <span class="sale-card__input" style="background: transparent; border: none; padding: 0;">${returnedQty}</span>
            </div>
            <div class="sale-card__total">
              <span class="sale-card__total-label" data-en="Total" data-ar="الإجمالي">الإجمالي:</span>
              <span class="sale-card__total-value">$${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    salesSection.style.display = 'block';
  } catch (error) {
    console.error('Error loading customer sales:', error);
    showAlert('Error loading customer sales', 'danger');
  }
}

// Open return modal
function openReturnModal(saleId, productId, customerId, productName, originalQuantity, alreadyReturned) {
  document.getElementById('return-sale-id').value = saleId;
  document.getElementById('return-product-id').value = productId;
  document.getElementById('return-customer-id').value = customerId;
  document.getElementById('return-product-name').textContent = productName;
  document.getElementById('return-original-quantity').textContent = originalQuantity;
  document.getElementById('return-already-returned').textContent = alreadyReturned;
  
  const maxReturnable = originalQuantity - alreadyReturned;
  const returnQuantityInput = document.getElementById('return-quantity');
  returnQuantityInput.max = maxReturnable;
  returnQuantityInput.value = '';
  returnQuantityInput.setAttribute('data-max', maxReturnable);
  
  const helpText = document.getElementById('return-quantity-help');
  helpText.textContent = `Maximum returnable: ${maxReturnable}`;
  
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('return-date').value = today;
  
  // Clear reason
  document.getElementById('return-reason').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('returnModal'));
  modal.show();
}

// Submit return
async function submitReturn() {
  const saleId = document.getElementById('return-sale-id').value;
  const productId = document.getElementById('return-product-id').value;
  const customerId = document.getElementById('return-customer-id').value;
  const quantity = parseInt(document.getElementById('return-quantity').value);
  const returnDate = document.getElementById('return-date').value;
  const reason = document.getElementById('return-reason').value.trim();
  const maxReturnable = parseInt(document.getElementById('return-quantity').getAttribute('data-max'));
  
  // Validation
  if (!quantity || quantity <= 0) {
    showAlert('Please enter a valid return quantity', 'danger');
    return;
  }
  
  if (quantity > maxReturnable) {
    showAlert(`Cannot return more than ${maxReturnable} units`, 'danger');
    return;
  }
  
  if (!returnDate) {
    showAlert('Please select a return date', 'danger');
    return;
  }
  
  try {
    const response = await fetch('/api/returns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sale_id: parseInt(saleId),
        customer_id: parseInt(customerId),
        product_id: parseInt(productId),
        quantity: quantity,
        return_date: returnDate,
        reason: reason || null
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Error registering return', 'danger');
      return;
    }
    
    // Success
    showAlert('Return registered successfully. Stock has been restored.', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('returnModal'));
    modal.hide();
    
    // Reload customer sales
    loadCustomerSales(parseInt(customerId));
  } catch (error) {
    console.error('Error submitting return:', error);
    showAlert('Error registering return', 'danger');
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Show alert
function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alertId = 'alert-' + Date.now();
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default for return date
  const today = new Date().toISOString().split('T')[0];
  // This will be set when modal opens
});

