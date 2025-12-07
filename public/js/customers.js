let allCustomers = [];
let searchTimeout = null;

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

// Load all customers
async function loadCustomers() {
  try {
    const response = await fetch('/api/customers');
    allCustomers = await response.json();
    displayCustomers(allCustomers);
  } catch (error) {
    console.error('Error loading customers:', error);
    const container = document.getElementById('customers-list');
    if (container) {
      container.innerHTML = '<div class="text-center text-danger py-5" data-en="Error loading customers" data-ar="خطأ في تحميل العملاء">خطأ في تحميل العملاء</div>';
    }
  }
}

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Display customers as cards (matching screenshot design)
function displayCustomers(customers) {
  const container = document.getElementById('customers-list');
  
  if (customers.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-5" data-en="No customers found" data-ar="لم يتم العثور على عملاء">لم يتم العثور على عملاء</div>';
    updateTotalDebts(0);
    return;
  }

  // Calculate total debts
  const totalDebts = customers.reduce((sum, customer) => sum + (parseFloat(customer.debt) || 0), 0);
  updateTotalDebts(totalDebts);

  container.innerHTML = customers.map(customer => {
    const debt = parseFloat(customer.debt) || 0;
    const debtClass = debt === 0 ? 'zero' : 'owed';
    const debtText = formatCurrency(Math.abs(debt));
    
    // Calculate total purchases (sum of all sales for this customer)
    const totalPurchases = customer.total_sales_amount || customer.total_revenue || 0;
    const purchasesText = formatCurrency(totalPurchases);
    
    // Format phone number
    const phone = customer.phone || '';
    const phoneDisplay = phone ? phone.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4') : '';
    
    return `
      <div class="customer-card" onclick="viewCustomerDetails(${customer.id})" style="cursor: pointer;">
        <div class="customer-card__content">
          <div class="customer-card__name">${customer.name}</div>
          ${phone ? `
            <div class="customer-card__phone">
              <i class="bi bi-telephone"></i>
              <span>${phoneDisplay}</span>
            </div>
          ` : ''}
          <div class="customer-card__purchases">
            <span class="customer-card__purchases-label" data-en="Total Purchases" data-ar="إجمالي المشتريات">إجمالي المشتريات:</span>
            <span class="customer-card__purchases-amount">${purchasesText}</span>
          </div>
        </div>
        <div class="customer-card__debt">
          <span class="customer-card__debt-label" data-en="Debt Balance" data-ar="رصيد الدين">رصيد الدين</span>
          <span class="customer-card__debt-amount ${debtClass}">${debtText}</span>
        </div>
        <div class="customer-card__icon">
          <i class="bi bi-person"></i>
        </div>
      </div>
    `;
  }).join('');
}

// Update total debts summary card
function updateTotalDebts(total) {
  const card = document.getElementById('total-debts-card');
  const amount = document.getElementById('total-debts-amount');
  if (card && amount) {
    amount.textContent = formatCurrency(total);
    card.style.display = total > 0 ? 'flex' : 'none';
  }
}

// Search customers
function searchCustomers(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (!query || query.trim() === '') {
      displayCustomers(allCustomers);
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      const customers = await response.json();
      displayCustomers(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
      showAlert('Error searching customers', 'danger');
    }
  }, 300);
}

// View customer details
function viewCustomerDetails(customerId) {
  window.location.href = `customer-details.html?id=${customerId}`;
}

// Save customer
async function saveCustomer() {
  console.log('saveCustomer called');
  
  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');
  const notesInput = document.getElementById('customer-notes');
  
  if (!nameInput || !phoneInput || !notesInput) {
    console.error('Form elements not found');
    showAlert('Error: Form elements not found', 'danger');
    return;
  }
  
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const notes = notesInput.value.trim();

  console.log('Form values:', { name, phone, notes });

  if (!name) {
    showAlert('Customer name is required', 'danger');
    nameInput.focus();
    return;
  }

  try {
    console.log('Sending request to /api/customers');
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        phone: phone || null,
        notes: notes || null
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      showAlert(data.error || 'Error creating customer', 'danger');
      return;
    }

    showAlert('Customer created successfully', 'success');
    
    // Reset form
    document.getElementById('add-customer-form').reset();
    
    // Close modal
    const modalElement = document.getElementById('addCustomerModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        // If modal instance doesn't exist, create one and hide it
        const newModal = new bootstrap.Modal(modalElement);
        newModal.hide();
      }
    }
    
    // Reload customers
    loadCustomers();
  } catch (error) {
    console.error('Error creating customer:', error);
    showAlert('Error creating customer: ' + error.message, 'danger');
  }
}

// Initialize Socket.io for real-time updates
let socket = null;

function initSocket() {
  // Connect to Socket.io server
  socket = io();
  
  // Listen for customer created
  socket.on('customer:created', (data) => {
    console.log('New customer created:', data);
    loadCustomers();
  });
  
  // Listen for payment created
  socket.on('payment:created', (data) => {
    console.log('Payment created:', data);
    loadCustomers();
  });
  
  // Listen for payment deleted
  socket.on('payment:deleted', (data) => {
    console.log('Payment deleted:', data);
    loadCustomers();
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
  loadCustomers();
  
  // Initialize socket connection
  initSocket();
  
  // Check for action parameters
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'add') {
    // Open add customer modal
    setTimeout(() => {
      const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
      modal.show();
    }, 500);
  } else if (action === 'payment') {
    // Show message to select a customer first
    setTimeout(() => {
      showAlert('Please select a customer from the list to add a payment', 'info');
    }, 500);
  }
  
  // Search input handler
  document.getElementById('customer-search').addEventListener('input', (e) => {
    searchCustomers(e.target.value);
  });
  
  // Prevent form submission
  const form = document.getElementById('add-customer-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCustomer();
    });
  }
});

