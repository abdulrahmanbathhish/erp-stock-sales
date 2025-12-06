let customerId = null;
let allSales = [];
let allPayments = [];

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

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

// Format date
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

// Format date only (for payment date input)
function formatDateOnly(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
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

// Get customer ID from URL
function getCustomerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Load customer details
async function loadCustomerDetails() {
  customerId = getCustomerIdFromUrl();
  if (!customerId) {
    document.getElementById('customer-info-card').innerHTML = 
      '<div class="alert alert-danger">Customer ID not found</div>';
    return;
  }

  try {
    const response = await fetch(`/api/customers/${customerId}`);
    const customer = await response.json();

    if (!customer) {
      document.getElementById('customer-info-card').innerHTML = 
        '<div class="alert alert-danger">Customer not found</div>';
      return;
    }

    // Display customer info
    document.getElementById('customer-name').textContent = customer.name;
    document.getElementById('customer-notes').textContent = customer.notes || 'No notes';
    
    // Display financial info
    const totalSalesAmount = customer.total_sales_amount || 0;
    const totalCreditSales = customer.total_credit_sales || 0;
    const totalPayments = customer.total_payments || 0;
    const debt = customer.debt || 0;
    
    document.getElementById('total-sales-amount').textContent = formatCurrency(totalSalesAmount);
    document.getElementById('total-credit-sales').textContent = formatCurrency(totalCreditSales);
    document.getElementById('total-payments').textContent = formatCurrency(totalPayments);
    
    const debtElement = document.getElementById('remaining-debt');
    if (debt > 0) {
      debtElement.textContent = formatCurrency(debt);
      debtElement.className = 'text-danger';
    } else if (debt < 0) {
      debtElement.textContent = formatCurrency(Math.abs(debt)) + ' (credit)';
      debtElement.className = 'text-success';
    } else {
      debtElement.textContent = formatCurrency(0);
      debtElement.className = 'text-muted';
    }

    // Store and display sales
    allSales = customer.sales || [];
    displaySales(allSales);
    
    // Store and display payments
    allPayments = customer.payments || [];
    displayPayments(allPayments);
  } catch (error) {
    console.error('Error loading customer details:', error);
    document.getElementById('customer-info-card').innerHTML = 
      '<div class="alert alert-danger">Error loading customer details</div>';
  }
}

// Display sales
function displaySales(sales) {
  const tbody = document.getElementById('sales-table');
  
  if (sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" data-en="No sales found" data-ar="لم يتم العثور على مبيعات">No sales found</td></tr>';
    updateSalesTotals([]);
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
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" data-en="No payments found" data-ar="لم يتم العثور على دفعات">No payments found</td></tr>';
    updatePaymentsTotal([]);
    return;
  }

  tbody.innerHTML = payments.map(payment => {
    return `
      <tr>
        <td>${formatDate(payment.payment_date)}</td>
        <td class="text-success">${formatCurrency(payment.amount)}</td>
        <td>${payment.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deletePayment(${payment.id})" data-en="Delete" data-ar="حذف">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  updatePaymentsTotal(payments);
}

// Update payments total
function updatePaymentsTotal(payments) {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  document.getElementById('payments-total').textContent = formatCurrency(total);
}

// Save payment
async function savePayment() {
  const amount = parseFloat(document.getElementById('payment-amount').value);
  const paymentDate = document.getElementById('payment-date').value;
  const notes = document.getElementById('payment-notes').value.trim();

  if (!amount || amount <= 0) {
    showAlert('Payment amount must be greater than 0', 'danger');
    return;
  }

  if (!paymentDate) {
    showAlert('Payment date is required', 'danger');
    return;
  }

  try {
    const response = await fetch(`/api/customers/${customerId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        payment_date: paymentDate,
        notes: notes || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error creating payment', 'danger');
      return;
    }

    showAlert('Payment added successfully', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPaymentModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('add-payment-form').reset();
    document.getElementById('payment-date').value = formatDateOnly(new Date());
    
    // Reload customer details
    loadCustomerDetails();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
    // Also try localStorage to notify other tabs
    localStorage.setItem('refresh-dashboard', Date.now().toString());
  } catch (error) {
    console.error('Error creating payment:', error);
    showAlert('Error creating payment: ' + error.message, 'danger');
  }
}

// Delete payment
async function deletePayment(paymentId) {
  if (!confirm('Are you sure you want to delete this payment?')) {
    return;
  }

  try {
    const response = await fetch(`/api/customers/payments/${paymentId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error deleting payment', 'danger');
      return;
    }

    showAlert('Payment deleted successfully', 'success');
    loadCustomerDetails();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
    // Also try localStorage to notify other tabs
    localStorage.setItem('refresh-dashboard', Date.now().toString());
  } catch (error) {
    console.error('Error deleting payment:', error);
    showAlert('Error deleting payment', 'danger');
  }
}

// Filter sales by date range
function filterSales() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  if (!startDate && !endDate) {
    displaySales(allSales);
    return;
  }

  let filtered = allSales;

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filtered = filtered.filter(sale => new Date(sale.created_at) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(sale => new Date(sale.created_at) <= end);
  }

  displaySales(filtered);
}

// Clear filter
function clearFilter() {
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
  displaySales(allSales);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCustomerDetails();
  
  // Set default payment date to today
  document.getElementById('payment-date').value = formatDateOnly(new Date());
});
