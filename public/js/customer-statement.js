let customerId = null;
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
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
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
        resultsDiv.innerHTML = '<div class="list-group-item text-muted" data-en="No customers found" data-ar="لم يتم العثور على عملاء">لم يتم العثور على عملاء</div>';
        resultsDiv.classList.add('show');
        resultsDiv.style.display = 'block';
        return;
      }
      
      resultsDiv.innerHTML = customers.map(customer => `
        <button type="button" 
                class="list-group-item list-group-item-action" 
                onclick="selectCustomer(${customer.id})">
          <strong>${customer.name}</strong>
          ${customer.phone ? `<br><small class="text-muted">${customer.phone}</small>` : ''}
        </button>
      `).join('');
      
      resultsDiv.classList.add('show');
      resultsDiv.style.display = 'block';
    } catch (error) {
      console.error('Error searching customers:', error);
      resultsDiv.classList.remove('show');
      resultsDiv.style.display = 'none';
    }
  }, 300);
}

// Select customer
async function selectCustomer(id) {
  customerId = id;
  const resultsDiv = document.getElementById('customer-search-results');
  resultsDiv.classList.remove('show');
  resultsDiv.style.display = 'none';
  document.getElementById('customer-search-input').value = '';
  document.getElementById('no-customer-message').style.display = 'none';
  
  await loadCustomerDetails();
}

// Load customer details
async function loadCustomerDetails() {
  if (!customerId) return;
  
  try {
    const response = await fetch(`/api/customers/${customerId}`);
    const customer = await response.json();
    
    // Display customer info
    document.getElementById('customer-name').textContent = customer.name;
    document.getElementById('customer-phone').textContent = customer.phone || '-';
    document.getElementById('customer-notes').textContent = customer.notes || '-';
    document.getElementById('total-sales-amount').textContent = formatCurrency(customer.total_sales_amount || 0);
    document.getElementById('total-credit-sales').textContent = formatCurrency(customer.total_credit_sales || 0);
    document.getElementById('total-payments').textContent = formatCurrency(customer.total_payments || 0);
    document.getElementById('remaining-debt').textContent = formatCurrency(customer.debt || 0);
    
    // Show customer info card
    document.getElementById('customer-info-card').style.display = 'block';
    
    // Load and display sales
    displaySales(customer.sales || []);
    
    // Load and display payments
    displayPayments(customer.payments || []);
    
  } catch (error) {
    console.error('Error loading customer details:', error);
    showAlert('Error loading customer details', 'danger');
  }
}

// Display sales
function displaySales(sales) {
  const tbody = document.getElementById('sales-table');
  
  if (sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" data-en="No sales found" data-ar="لم يتم العثور على مبيعات">No sales found</td></tr>';
    updateSalesTotals([]);
    document.getElementById('sales-section').style.display = 'block';
    return;
  }

  tbody.innerHTML = sales.map(sale => {
    const total = sale.sale_price * sale.quantity;
    const isCredit = sale.is_credit === 1 || sale.is_credit === true;
    const creditBadge = isCredit ? '<span class="badge bg-warning ms-2" data-en="Credit" data-ar="دين">Credit</span>' : '';
    return `
      <tr>
        <td>${formatDate(sale.created_at)}</td>
        <td>${sale.product_name}${creditBadge}</td>
        <td>${sale.quantity}</td>
        <td>${formatCurrency(sale.sale_price)}</td>
        <td>${formatCurrency(total)}</td>
        <td>${isCredit ? formatCurrency(total) : '-'}</td>
      </tr>
    `;
  }).join('');

  updateSalesTotals(sales);
  document.getElementById('sales-section').style.display = 'block';
}

// Update sales totals
function updateSalesTotals(sales) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);
  document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('grand-total').textContent = formatCurrency(totalRevenue);
}

// Display payments
function displayPayments(payments) {
  const tbody = document.getElementById('payments-table');
  
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted" data-en="No payments found" data-ar="لم يتم العثور على دفعات">No payments found</td></tr>';
    updatePaymentsTotal([]);
    document.getElementById('payments-section').style.display = 'block';
    return;
  }

  tbody.innerHTML = payments.map(payment => {
    return `
      <tr>
        <td>${formatDate(payment.payment_date)}</td>
        <td class="text-success">${formatCurrency(payment.amount)}</td>
        <td>${payment.notes || '-'}</td>
      </tr>
    `;
  }).join('');

  updatePaymentsTotal(payments);
  document.getElementById('payments-section').style.display = 'block';
}

// Update payments total
function updatePaymentsTotal(payments) {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  document.getElementById('payments-total').textContent = formatCurrency(total);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
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
  
  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    const resultsDiv = document.getElementById('customer-search-results');
    if (!e.target.closest('#customer-search-input') && !e.target.closest('#customer-search-results')) {
      resultsDiv.classList.remove('show');
      resultsDiv.style.display = 'none';
    }
  });
});

