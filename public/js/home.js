// No password required for home page - it's the default entry point

// Navigate to a page
function navigateTo(url, openModal = false) {
  if (openModal) {
    // For customers page, we'll add a parameter to open modal
    window.location.href = url + (openModal ? '?action=add' : '');
  } else {
    window.location.href = url;
  }
}

// Navigate to payment page (select customer first)
function navigateToPayment() {
  // Navigate to customers page with payment action
  window.location.href = 'customers.html?action=payment';
}

// Navigate to dashboard (make sure it's available globally)
window.navigateToDashboard = function () {
  console.log('navigateToDashboard called');
  window.location.href = 'index.html';
};

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Convert date to Syria timezone (Asia/Damascus) using Intl API
function toSyriaTime(date) {
  // Use Intl.DateTimeFormat to get real Syria timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Damascus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // JS months are 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  const second = parseInt(parts.find(p => p.type === 'second').value);
  
  // Create a new date object with Syria timezone values
  return new Date(year, month, day, hour, minute, second);
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

// Format date and time with AM/PM in Syria timezone
function formatDateTimeSyria(date) {
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

// Format date/time - Show precise date and time for all activities
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Format with Syria timezone and AM/PM
  const dateTimeStr = formatDateTimeSyria(date);

  // Show relative time for very recent items, but always include full timestamp
  if (diffMins < 1) {
    return `الآن (${dateTimeStr})`;
  } else if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة (${dateTimeStr})`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة (${dateTimeStr})`;
  } else {
    return dateTimeStr;
  }
}

// Format date/time for English - Show precise date and time for all activities
function formatDateTimeEn(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Format with Syria timezone and AM/PM
  const dateTimeStr = formatDateTimeSyria(date);

  // Show relative time for very recent items, but always include full timestamp
  if (diffMins < 1) {
    return `Just now (${dateTimeStr})`;
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago (${dateTimeStr})`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago (${dateTimeStr})`;
  } else {
    return dateTimeStr;
  }
}

// Get activity type label
function getActivityTypeLabel(type, isArabic = true) {
  const labels = {
    sale: isArabic ? 'بيع نقدي' : 'Sale',
    credit_sale: isArabic ? 'بيع بالدين' : 'Credit Sale',
    payment: isArabic ? 'دفعة' : 'Payment',
    return: isArabic ? 'إرجاع' : 'Return',
    expense: isArabic ? 'مصروف' : 'Expense'
  };
  return labels[type] || type;
}

// Get activity icon
function getActivityIcon(type) {
  const icons = {
    sale: 'bi-cart-check',
    credit_sale: 'bi-credit-card',
    payment: 'bi-wallet2',
    return: 'bi-arrow-return-left',
    expense: 'bi-wallet'
  };
  return icons[type] || 'bi-circle';
}

// Get activity color class for transaction card
function getActivityColorClass(type) {
  const colors = {
    sale: 'cash-sale',
    credit_sale: 'credit-sale',
    payment: 'payment',
    return: 'return',
    expense: 'return'
  };
  return colors[type] || 'cash-sale';
}

// Display recent activity
function displayRecentActivity(activities) {
  const container = document.getElementById('activity-list');
  const isArabic = document.documentElement.dir === 'rtl';

  if (!activities || activities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <p data-en="No recent activity" data-ar="لا يوجد نشاط حديث">لا يوجد نشاط حديث</p>
        <small class="text-muted" data-en="Recent operations will appear here" data-ar="ستظهر العمليات الأخيرة هنا">ستظهر العمليات الأخيرة هنا</small>
      </div>
    `;
    return;
  }

  container.innerHTML = activities.map(activity => {
    const typeClass = getActivityColorClass(activity.type);
    const customerName = activity.customer_name || (isArabic ? 'نقدي' : 'Cash');
    // Format timestamp as "HH:mm AM/PM DD/MM/YYYY" in Syria timezone
    const date = new Date(activity.date);
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Damascus',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = formatTimeAMPM(date);
    const dateParts = dateFormatter.formatToParts(date);
    const day = dateParts.find(p => p.type === 'day').value;
    const month = dateParts.find(p => p.type === 'month').value;
    const year = dateParts.find(p => p.type === 'year').value;
    const timestamp = `${timeStr} ${day}/${month}/${year}`;
    const typeLabel = getActivityTypeLabel(activity.type, isArabic);
    const icon = getActivityIcon(activity.type);

    let description = activity.description || '';
    if (!description && activity.product_name && activity.quantity) {
      description = `${activity.product_name} (${activity.quantity})`;
    }

    return `
      <div class="transaction-card transaction-card--${typeClass}">
        <div class="transaction-card__header">
          <div class="transaction-card__icon">
            <i class="bi ${icon}"></i>
          </div>
          <span class="transaction-card__badge">${typeLabel}</span>
        </div>
        <div class="transaction-card__description">${description || ''}</div>
        <div class="transaction-card__customer">
          <i class="bi bi-person"></i>
          <span>${customerName}</span>
        </div>
        <div class="transaction-card__timestamp">
          <i class="bi bi-clock"></i>
          <span>${timestamp}</span>
        </div>
        <div class="transaction-card__amount">${formatCurrency(activity.amount || 0)}</div>
      </div>
    `;
  }).join('');
}

// Filter state
let currentTimeFilter = 'week'; // Default to this week
let selectedCustomerId = null;
let selectedCustomerName = null;
let customerSearchTimeout = null;

// Filter state for recent operations
let selectedCustomerIdForOperations = null;
let selectedCustomerNameForOperations = null;
let customerSearchTimeoutForOperations = null;
let currentTimeFilterForOperations = 'all'; // Default to all

// Set time filter
function setTimeFilter(timeFilter) {
  currentTimeFilter = timeFilter;

  // Update active button
  document.querySelectorAll('.time-filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.time === timeFilter) {
      btn.classList.add('active');
    }
  });

  // Reload activity
  loadRecentActivity();
}

// Set time filter for operations
window.setTimeFilterForOperations = function(timeFilter) {
  currentTimeFilterForOperations = timeFilter;

  // Update active button (only for operations section)
  document.querySelectorAll('.time-filter-btn').forEach(btn => {
    // Only update buttons in the operations section
    const operationsSection = btn.closest('[style*="margin-top"]');
    if (operationsSection) {
      btn.classList.remove('active');
      if (btn.dataset.time === timeFilter) {
        btn.classList.add('active');
        // Update button style to show active state
        btn.style.background = 'var(--color-primary)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--color-primary)';
      } else {
        btn.style.background = 'var(--color-surface)';
        btn.style.color = 'var(--color-text-primary)';
        btn.style.borderColor = 'var(--color-border)';
      }
    }
  });

  // Reload operations
  if (typeof loadRecentOperations === 'function') {
    loadRecentOperations();
  }
};

// Clear customer filter
function clearCustomerFilter() {
  selectedCustomerId = null;
  selectedCustomerName = null;
  const input = document.getElementById('customer-filter-input');
  const clearBtn = document.getElementById('customer-filter-clear');
  const resultsDiv = document.getElementById('customer-filter-results');

  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.remove('visible');
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }

  loadRecentActivity();
}

// Search customers for filter
async function searchCustomersForFilter(query) {
  clearTimeout(customerSearchTimeout);
  const resultsDiv = document.getElementById('customer-filter-results');
  const clearBtn = document.getElementById('customer-filter-clear');

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
                onclick="selectCustomerForFilter(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')">
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

// Select customer for filter
function selectCustomerForFilter(customerId, customerName) {
  selectedCustomerId = customerId;
  selectedCustomerName = customerName;

  const input = document.getElementById('customer-filter-input');
  const clearBtn = document.getElementById('customer-filter-clear');
  const resultsDiv = document.getElementById('customer-filter-results');

  if (input) input.value = customerName;
  if (clearBtn) clearBtn.classList.add('visible');
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }

  loadRecentActivity();
}

// Load summary cards data
async function loadSummaryCards() {
  try {
    // Fetch today's activity to calculate summary
    const response = await fetch('/api/sales/recent-activity?time=today&limit=1000');
    if (!response.ok) {
      throw new Error('Failed to fetch summary data');
    }
    const activities = await response.json();

    // Calculate invoices count (unique sales today)
    const salesCount = activities.filter(a => a.type === 'sale' || a.type === 'credit_sale').length;
    document.getElementById('invoices-count').textContent = salesCount;

    // Calculate daily debt (credit sales - payments today)
    const creditSales = activities.filter(a => a.type === 'credit_sale');
    const payments = activities.filter(a => a.type === 'payment');
    const totalCreditSales = creditSales.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalPayments = payments.reduce((sum, a) => sum + (a.amount || 0), 0);
    const dailyDebt = totalCreditSales - totalPayments;

    document.getElementById('daily-debt-amount').textContent = formatCurrency(dailyDebt);
    const pendingInvoices = creditSales.length;
    const isArabic = document.documentElement.dir === 'rtl';
    document.getElementById('daily-debt-subtitle').textContent = isArabic
      ? `${pendingInvoices} فواتير معلقة`
      : `${pendingInvoices} pending invoices`;

    // Calculate daily sales (all sales today)
    const allSales = activities.filter(a => a.type === 'sale' || a.type === 'credit_sale');
    const totalSales = allSales.reduce((sum, a) => sum + (a.amount || 0), 0);
    document.getElementById('daily-sales-amount').textContent = formatCurrency(totalSales);

  } catch (error) {
    console.error('Error loading summary cards:', error);
    // Set default values on error
    document.getElementById('invoices-count').textContent = '0';
    document.getElementById('daily-debt-amount').textContent = '$0.00';
    document.getElementById('daily-sales-amount').textContent = '$0.00';
  }
}

// Load today's operations
async function loadTodayOperations() {
  const container = document.getElementById('today-operations-list');

  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <i class="bi bi-hourglass-split"></i>
      <p data-en="Loading..." data-ar="جاري التحميل...">جاري التحميل...</p>
    </div>
  `;

  try {
    const response = await fetch('/api/sales/recent-activity?time=today&limit=10');
    if (!response.ok) {
      throw new Error('Failed to fetch today\'s operations');
    }
    const activities = await response.json();

    if (!activities || activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p data-en="No operations today" data-ar="لا توجد عمليات اليوم">لا توجد عمليات اليوم</p>
        </div>
      `;
      return;
    }

    const isArabic = document.documentElement.dir === 'rtl';

    container.innerHTML = activities.map(activity => {
      const typeClass = getActivityColorClass(activity.type);
      const customerName = activity.customer_name || (isArabic ? 'نقدي' : 'Cash');
      const typeLabel = getActivityTypeLabel(activity.type, isArabic);
      const icon = getActivityIcon(activity.type);

      // Format time only (since it's today) with AM/PM in Syria timezone
      const date = new Date(activity.date);
      const timeStr = formatTimeAMPM(date);

      let description = activity.description || '';
      if (!description && activity.product_name && activity.quantity) {
        description = `${activity.product_name} (${activity.quantity})`;
      }

      return `
        <div class="operation-item">
          <div class="operation-item__type" style="background: var(--color-${typeClass}); color: white; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
            <i class="bi ${icon}"></i>
            <span style="margin-right: var(--space-1);">${typeLabel}</span>
          </div>
          <div class="operation-item__content">
            <div style="font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-1);">${description || typeLabel}</div>
            <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
              <i class="bi bi-person"></i> ${customerName}
              <span style="margin: 0 var(--space-2);">•</span>
              <i class="bi bi-clock"></i> ${timeStr}
            </div>
          </div>
          <div class="operation-item__amount" style="color: var(--color-${typeClass}); font-weight: 700; font-size: 1.125rem;">
            ${formatCurrency(activity.amount || 0)}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading today\'s operations:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p data-en="Error loading operations" data-ar="خطأ في تحميل العمليات">خطأ في تحميل العمليات</p>
        <button class="btn btn-primary btn-sm" onclick="loadTodayOperations()" data-en="Retry" data-ar="إعادة المحاولة">إعادة المحاولة</button>
      </div>
    `;
  }
}

// Load recent activity
async function loadRecentActivity() {
  const container = document.getElementById('activity-list');
  const refreshBtn = document.getElementById('refresh-activity');

  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <i class="bi bi-hourglass-split"></i>
      <p data-en="Loading recent activity..." data-ar="جاري تحميل النشاط الأخير...">جاري تحميل النشاط الأخير...</p>
    </div>
  `;

  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
  }

  try {
    // Build query string
    let queryString = `limit=50&time=${currentTimeFilter}`;
    if (selectedCustomerId) {
      queryString += `&customer_id=${selectedCustomerId}`;
    }

    const response = await fetch(`/api/sales/recent-activity?${queryString}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }
    const activities = await response.json();
    displayRecentActivity(activities);
  } catch (error) {
    console.error('Error loading recent activity:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p data-en="Error loading activity" data-ar="خطأ في تحميل النشاط">خطأ في تحميل النشاط</p>
        <p class="text-muted" style="font-size: 0.9rem;" data-en="Please try refreshing the page" data-ar="يرجى محاولة تحديث الصفحة">يرجى محاولة تحديث الصفحة</p>
        <button class="btn btn-primary btn-sm" onclick="loadRecentActivity()" data-en="Retry" data-ar="إعادة المحاولة">إعادة المحاولة</button>
      </div>
    `;
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
    }
  }
}

// Load recent operations for home page
window.loadRecentOperations = async function() {
  try {
    const container = document.getElementById('recent-operations');
    if (!container) return;
    
    const isArabic = document.documentElement.dir === 'rtl';

    // Show loading
    container.innerHTML = `
      <div class="loading-state">
        <i class="bi bi-hourglass-split"></i>
        <p data-en="Loading operations..." data-ar="جاري تحميل العمليات...">جاري تحميل العمليات...</p>
      </div>
    `;

    // Build query string with time and customer filter
    let queryString = `limit=20&time=${currentTimeFilterForOperations}`;
    if (selectedCustomerIdForOperations) {
      queryString += `&customer_id=${selectedCustomerIdForOperations}`;
    }

    // Fetch recent activity
    const response = await fetch(`/api/sales/recent-activity?${queryString}`);
    const activities = await response.json();

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p data-en="No operations yet" data-ar="لا توجد عمليات بعد">لا توجد عمليات بعد</p>
        </div>
      `;
      return;
    }

    // Display operations (without delete buttons)
    container.innerHTML = activities.map(activity => {
      const typeClass = getActivityColorClass(activity.type);
      const typeLabel = getActivityTypeLabel(activity.type, isArabic);
      const icon = getActivityIcon(activity.type);
      
      // For expenses, don't show customer name
      const isExpense = activity.type === 'expense';
      const customerName = isExpense ? null : (activity.customer_name || (isArabic ? 'نقدي' : 'Cash'));

      // Format timestamp with AM/PM in Syria timezone
      const date = new Date(activity.date);
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Damascus',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const timeStr = formatTimeAMPM(date);
      const dateParts = dateFormatter.formatToParts(date);
      const day = dateParts.find(p => p.type === 'day').value;
      const month = dateParts.find(p => p.type === 'month').value;
      const year = dateParts.find(p => p.type === 'year').value;
      const timestamp = `${timeStr} ${day}/${month}/${year}`;

      // Build description
      let description = activity.description || '';
      if (!description && activity.product_name && activity.quantity) {
        description = `${activity.product_name} (${activity.quantity})`;
      }

      return `
        <div class="operation-item" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-3); background: var(--color-surface);">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <span style="background: var(--color-${typeClass}); color: white; padding: var(--space-1) var(--space-2); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600;">
                <i class="bi ${icon}"></i> ${typeLabel}
              </span>
              <span style="font-weight: 600; color: var(--color-text-primary);">${description || typeLabel}</span>
            </div>
            <div style="display: flex; gap: var(--space-4); font-size: 0.875rem; color: var(--color-text-secondary);">
              ${customerName ? `<span><i class="bi bi-person"></i> ${customerName}</span>` : ''}
              <span><i class="bi bi-clock"></i> ${timestamp}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--color-${typeClass});">${formatCurrency(activity.amount || 0)}</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading recent operations:', error);
    const container = document.getElementById('recent-operations');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <i class="bi bi-exclamation-triangle"></i>
          <p data-en="Error loading operations" data-ar="خطأ في تحميل العمليات">خطأ في تحميل العمليات</p>
          <button class="btn btn-primary btn-sm" onclick="loadRecentOperations()">
            <i class="bi bi-arrow-clockwise"></i>
            <span data-en="Retry" data-ar="إعادة المحاولة">إعادة المحاولة</span>
          </button>
        </div>
      `;
    }
  }
}

// Clear customer filter for operations
window.clearCustomerFilterForOperations = function() {
  selectedCustomerIdForOperations = null;
  selectedCustomerNameForOperations = null;
  const input = document.getElementById('customer-filter-input');
  const clearBtn = document.getElementById('customer-filter-clear');
  const resultsDiv = document.getElementById('customer-filter-results');

  if (input) input.value = '';
  if (clearBtn) {
    clearBtn.style.display = 'none';
    clearBtn.classList.remove('visible');
  }
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }

  loadRecentOperations();
}

// Search customers for operations filter
async function searchCustomersForOperationsFilter(query) {
  clearTimeout(customerSearchTimeoutForOperations);
  const resultsDiv = document.getElementById('customer-filter-results');
  const clearBtn = document.getElementById('customer-filter-clear');

  if (!query || query.trim().length === 0) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    return;
  }

  customerSearchTimeoutForOperations = setTimeout(async () => {
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
                onclick="selectCustomerForOperationsFilter(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')">
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

// Select customer for operations filter
window.selectCustomerForOperationsFilter = function(customerId, customerName) {
  selectedCustomerIdForOperations = customerId;
  selectedCustomerNameForOperations = customerName;

  const input = document.getElementById('customer-filter-input');
  const clearBtn = document.getElementById('customer-filter-clear');
  const resultsDiv = document.getElementById('customer-filter-results');

  if (input) input.value = customerName;
  if (clearBtn) {
    clearBtn.style.display = 'block';
    clearBtn.classList.add('visible');
  }
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }

  loadRecentOperations();
}

// Payment modal state
let selectedPaymentCustomerId = null;
let selectedPaymentCustomerName = null;
let paymentCustomerSearchTimeout = null;

// Search customers for payment
async function searchCustomersForPayment(query) {
  clearTimeout(paymentCustomerSearchTimeout);
  const resultsDiv = document.getElementById('payment-customer-results');
  const customerInput = document.getElementById('payment-customer-search');

  if (!query || query.trim().length === 0) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
    selectedPaymentCustomerId = null;
    document.getElementById('payment-customer-id').value = '';
    return;
  }

  paymentCustomerSearchTimeout = setTimeout(async () => {
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
                onclick="selectCustomerForPayment(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')">
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

// Select customer for payment
window.selectCustomerForPayment = function(customerId, customerName) {
  selectedPaymentCustomerId = customerId;
  selectedPaymentCustomerName = customerName;

  const customerInput = document.getElementById('payment-customer-search');
  const customerIdInput = document.getElementById('payment-customer-id');
  const resultsDiv = document.getElementById('payment-customer-results');

  if (customerInput) customerInput.value = customerName;
  if (customerIdInput) customerIdInput.value = customerId;
  if (resultsDiv) {
    resultsDiv.classList.remove('show');
    resultsDiv.style.display = 'none';
  }
}

// Format date only (for payment date input)
function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Save payment from home page
window.savePaymentFromHome = async function() {
  const customerId = selectedPaymentCustomerId || document.getElementById('payment-customer-id').value;
  const amount = parseFloat(document.getElementById('payment-amount').value);
  const paymentDate = document.getElementById('payment-date').value;
  const notes = document.getElementById('payment-notes').value.trim();
  const errorDiv = document.getElementById('payment-error');
  const isArabic = document.documentElement.dir === 'rtl';

  // Clear previous errors
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }

  // Validation
  if (!customerId) {
    if (errorDiv) {
      errorDiv.textContent = isArabic ? 'الرجاء اختيار عميل' : 'Please select a customer';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (!amount || amount <= 0) {
    if (errorDiv) {
      errorDiv.textContent = isArabic ? 'المبلغ يجب أن يكون أكبر من 0' : 'Payment amount must be greater than 0';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (!paymentDate) {
    if (errorDiv) {
      errorDiv.textContent = isArabic ? 'تاريخ الدفعة مطلوب' : 'Payment date is required';
      errorDiv.style.display = 'block';
    }
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
      if (errorDiv) {
        errorDiv.textContent = data.error || (isArabic ? 'خطأ في إضافة الدفعة' : 'Error creating payment');
        errorDiv.style.display = 'block';
      }
      return;
    }

    // Success - show alert
    alert(isArabic ? 'تم إضافة الدفعة بنجاح' : 'Payment added successfully');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPaymentModal'));
    if (modal) modal.hide();
    
    // Reset form
    document.getElementById('add-payment-form').reset();
    document.getElementById('payment-date').value = formatDateOnly(new Date());
    selectedPaymentCustomerId = null;
    selectedPaymentCustomerName = null;
    if (errorDiv) errorDiv.style.display = 'none';
    
    // Reload recent operations to show the new payment
    loadRecentOperations();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
    localStorage.setItem('refresh-dashboard', Date.now().toString());
  } catch (error) {
    console.error('Error creating payment:', error);
    if (errorDiv) {
      errorDiv.textContent = isArabic ? 'خطأ في إضافة الدفعة: ' + error.message : 'Error creating payment: ' + error.message;
      errorDiv.style.display = 'block';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Home page is freely accessible
  console.log('Home page loaded');

  // Add click event listener to dashboard button (if it exists on this page)
  const dashboardButton = document.getElementById('dashboard-button');
  if (dashboardButton) {
    dashboardButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Dashboard button clicked via event listener');
      navigateToDashboard();
    });
    console.log('Dashboard button event listener attached');
  }

  // Set default active time filter button for activity
  const defaultBtn = document.querySelector('.time-filter-btn[data-time="week"]');
  if (defaultBtn && !defaultBtn.closest('[style*="margin-top"]')) {
    defaultBtn.classList.add('active');
  }

  // Set default active time filter button for operations (all)
  const operationsSection = document.querySelector('[style*="margin-top"]');
  if (operationsSection) {
    const defaultOpsBtn = operationsSection.querySelector('.time-filter-btn[data-time="all"]');
    if (defaultOpsBtn) {
      defaultOpsBtn.classList.add('active');
      defaultOpsBtn.style.background = 'var(--color-primary)';
      defaultOpsBtn.style.color = 'white';
      defaultOpsBtn.style.borderColor = 'var(--color-primary)';
    }
  }

  // Load summary cards
  loadSummaryCards();

  // Load today's operations
  loadTodayOperations();

  // Load recent activity
  loadRecentActivity();

  // Load recent operations for home page
  loadRecentOperations();

  // Auto-refresh activity every 30 seconds
  setInterval(loadRecentActivity, 30000);
  
  // Auto-refresh recent operations every 30 seconds
  setInterval(loadRecentOperations, 30000);

  // Customer filter input handler for operations
  const customerFilterInput = document.getElementById('customer-filter-input');
  if (customerFilterInput) {
    customerFilterInput.addEventListener('input', (e) => {
      searchCustomersForOperationsFilter(e.target.value);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      const resultsDiv = document.getElementById('customer-filter-results');
      if (!e.target.closest('#customer-filter-input') && !e.target.closest('#customer-filter-results') && !e.target.closest('#customer-filter-clear')) {
        if (resultsDiv) {
          resultsDiv.classList.remove('show');
          resultsDiv.style.display = 'none';
        }
      }
    });
  }

  // Customer filter input handler for activity (if exists)
  const activityCustomerFilterInput = document.getElementById('activity-customer-filter-input');
  if (activityCustomerFilterInput) {
    activityCustomerFilterInput.addEventListener('input', (e) => {
      searchCustomersForFilter(e.target.value);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      const resultsDiv = document.getElementById('activity-customer-filter-results');
      if (!e.target.closest('#activity-customer-filter-input') && !e.target.closest('#activity-customer-filter-results')) {
        if (resultsDiv) {
          resultsDiv.classList.remove('show');
          resultsDiv.style.display = 'none';
        }
      }
    });
  }

  // LAN access info removed - URLs are available in server console logs
  // loadLANAccessInfo();

  // Payment modal customer search handler
  const paymentCustomerSearch = document.getElementById('payment-customer-search');
  if (paymentCustomerSearch) {
    paymentCustomerSearch.addEventListener('input', (e) => {
      searchCustomersForPayment(e.target.value);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      const resultsDiv = document.getElementById('payment-customer-results');
      if (!e.target.closest('#payment-customer-search') && !e.target.closest('#payment-customer-results')) {
        if (resultsDiv) {
          resultsDiv.classList.remove('show');
          resultsDiv.style.display = 'none';
        }
      }
    });

    // Reset payment form when modal is opened
    const paymentModal = document.getElementById('addPaymentModal');
    if (paymentModal) {
      paymentModal.addEventListener('show.bs.modal', () => {
        document.getElementById('add-payment-form').reset();
        document.getElementById('payment-date').value = formatDateOnly(new Date());
        selectedPaymentCustomerId = null;
        selectedPaymentCustomerName = null;
        const errorDiv = document.getElementById('payment-error');
        if (errorDiv) errorDiv.style.display = 'none';
      });
    }
  }
});

// LAN access info function removed - URLs are available in server console logs
// If needed, check the server console output when starting the server
/*
async function loadLANAccessInfo() {
  try {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isLocalhost) {
      return;
    }
    
    const response = await fetch('/api/server-info');
    if (!response.ok) return;
    
    const data = await response.json();
    const infoBox = document.getElementById('lan-access-info');
    const urlsDiv = document.getElementById('lan-urls');
    
    if (!infoBox || !urlsDiv) return;
    
    if (data.urls && data.urls.length > 0) {
      const isArabic = currentLanguage === 'ar';
      urlsDiv.innerHTML = data.urls.map(url => 
        `<div style="margin-bottom: 0.25rem;"><strong>${url}</strong></div>`
      ).join('');
      infoBox.classList.remove('d-none');
    }
  } catch (error) {
    console.log('Could not load LAN access info:', error);
  }
}
*/
