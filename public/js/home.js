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
  return '$ ' + parseFloat(amount).toFixed(2);
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

// Format date/time - Show only date (no relative time)
function formatDateTime(dateString) {
  const date = new Date(dateString);
  // Format with Syria timezone and AM/PM
  const dateTimeStr = formatDateTimeSyria(date);
  return dateTimeStr;
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
      
      // For grouped credit sales, show items count only
      if (activity.type === 'credit_sale' && activity.items && activity.items.length > 0) {
        const itemsCount = activity.items.length;
        description = `بيع بالدين: ${itemsCount} منتج${itemsCount > 1 ? 'ات' : ''}`;
      }

      // Make operation item clickable if it has items (for invoice view)
      const isClickable = activity.type === 'credit_sale' && activity.items && activity.items.length > 0;
      const activityData = isClickable ? encodeURIComponent(JSON.stringify(activity)) : '';
      const clickHandler = isClickable ? `onclick="showInvoiceDetailsFromData('${activity.transaction_id || activity.id}', '${activityData}')"` : '';
      const cursorStyle = isClickable ? 'cursor: pointer;' : '';

      return `
        <div class="operation-item" style="${cursorStyle}" ${clickHandler}>
          <div class="operation-item__type" style="background: var(--color-${typeClass}); color: white; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
            <i class="bi ${icon}"></i>
            <span style="margin-right: var(--space-1);">${typeLabel}</span>
          </div>
          <div class="operation-item__content">
            <div style="font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-1); display: flex; align-items: center; gap: var(--space-1);">
              ${description || typeLabel}
              ${isClickable ? '<i class="bi bi-eye" style="color: var(--color-text-secondary); font-size: 0.875rem;" title="Click to view details"></i>' : ''}
            </div>
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

    // Build query string with time and customer filter - increased limit to show more operations
    let queryString = `limit=100&time=${currentTimeFilterForOperations}`;
    if (selectedCustomerIdForOperations) {
      queryString += `&customer_id=${selectedCustomerIdForOperations}`;
    }

    // Fetch recent activity
    const response = await fetch(`/api/sales/recent-activity?${queryString}`);
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return;
      }
      // Try to get error message from response
      let errorMessage = `Failed to fetch recent activity: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `${errorMessage} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const activities = await response.json();

    if (!activities || activities.length === 0) {
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
      
      // For grouped credit sales, show items count only
      if (activity.type === 'credit_sale' && activity.items && activity.items.length > 0) {
        const itemsCount = activity.items.length;
        description = `بيع بالدين: ${itemsCount} منتج${itemsCount > 1 ? 'ات' : ''}`;
      }

      // Make operation item clickable if it has items (for invoice view)
      const isClickable = activity.type === 'credit_sale' && activity.items && activity.items.length > 0;
      const activityData = isClickable ? encodeURIComponent(JSON.stringify(activity)) : '';
      const clickHandler = isClickable ? `onclick="showInvoiceDetailsFromData('${activity.transaction_id || activity.id}', '${activityData}')"` : '';
      const cursorStyle = isClickable ? 'cursor: pointer;' : '';

      return `
        <div class="operation-item" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-3); background: var(--color-surface); ${cursorStyle}" ${clickHandler}>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <span style="background: var(--color-${typeClass}); color: white; padding: var(--space-1) var(--space-2); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600;">
                <i class="bi ${icon}"></i> ${typeLabel}
              </span>
              <span style="font-weight: 600; color: var(--color-text-primary);">${description || typeLabel}</span>
              ${isClickable ? '<i class="bi bi-eye" style="margin-right: var(--space-1); color: var(--color-text-secondary); font-size: 0.875rem;" title="Click to view details"></i>' : ''}
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
      const isArabic = document.documentElement.dir === 'rtl';
      const errorMessage = error.message || (isArabic ? 'خطأ غير معروف' : 'Unknown error');
      container.innerHTML = `
        <div class="error-state">
          <i class="bi bi-exclamation-triangle"></i>
          <p data-en="Error loading operations" data-ar="خطأ في تحميل العمليات">خطأ في تحميل العمليات</p>
          <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: var(--space-2);">${errorMessage}</p>
          <button class="btn btn-primary btn-sm" onclick="loadRecentOperations()" style="margin-top: var(--space-2);">
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

// Show invoice details from data attribute
window.showInvoiceDetailsFromData = function(transactionId, activityData) {
  try {
    const activity = JSON.parse(decodeURIComponent(activityData));
    showInvoiceDetails(transactionId, activity);
  } catch (e) {
    console.error('Error parsing activity data:', e);
    alert('Error loading invoice details');
  }
};

// Show invoice details modal
window.showInvoiceDetails = function(transactionId, activity) {
  const isArabic = document.documentElement.dir === 'rtl';
  
  if (!activity.items || activity.items.length === 0) {
    alert(isArabic ? 'لا توجد تفاصيل للعرض' : 'No details available');
    return;
  }

  // Create modal HTML with logo and print button
  const modalHTML = `
    <div class="modal fade" id="invoiceModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" data-en="Invoice Details" data-ar="تفاصيل الفاتورة">تفاصيل الفاتورة</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="invoiceContent">
            <!-- Invoice Header with Logo -->
            <div class="invoice-header" style="text-align: center; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 2px solid var(--color-border);">
              <div style="margin-bottom: var(--space-2);">
                <img src="/logo2.png" alt="Logo" id="invoiceLogo" style="max-height: 100px; max-width: 250px; object-fit: contain; display: block; margin: 0 auto;">
              </div>
              <h3 style="font-weight: 700; margin: var(--space-2) 0; color: var(--color-text-primary);" data-en="Invoice" data-ar="فاتورة">فاتورة</h3>
            </div>
            
            <!-- Invoice Info -->
            <div style="margin-bottom: var(--space-4);">
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                <span style="font-weight: 600;" data-en="Customer:" data-ar="السيد">السيد:</span>
                <span>${activity.customer_name || (isArabic ? 'نقدي' : 'Cash')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                <span style="font-weight: 600;" data-en="Date:" data-ar="التاريخ:">التاريخ:</span>
                <span>${formatDateTime(new Date(activity.date))}</span>
              </div>
              ${activity.transaction_id ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                <span style="font-weight: 600;" data-en="Invoice #:" data-ar="رقم الفاتورة:">رقم الفاتورة:</span>
                <span>${activity.transaction_id}</span>
              </div>
              ` : ''}
            </div>
            
            <!-- Items Table -->
            <table class="table table-striped invoice-table">
              <thead>
                <tr>
                  <th style="width: 40px;" data-en="#" data-ar="#">#</th>
                  <th data-en="Product" data-ar="المنتج">المنتج</th>
                  <th data-en="Quantity" data-ar="الكمية">الكمية</th>
                  <th data-en="Price" data-ar="السعر">السعر</th>
                  <th data-en="Total" data-ar="الإجمالي">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${activity.items
                  .sort((a, b) => a.product_name.localeCompare(b.product_name))
                  .map((item, index) => {
                    const rowId = `invoice-row-${item.id || index}`;
                    return `
                  <tr data-item-id="${item.id || index}" data-sale-id="${item.sale_id || ''}" data-product-id="${item.product_id || ''}" data-original-quantity="${item.quantity}" data-original-price="${item.sale_price}" id="${rowId}">
                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="min-width: 150px; padding: 4px; position: relative;">
                      <input type="text" 
                             class="form-control sale-card__input product-search-invoice" 
                             placeholder="${isArabic ? 'ابحث عن منتج...' : 'Search product...'}" 
                             data-row-id="${rowId}"
                             data-sale-id="${item.sale_id || ''}"
                             value="${item.product_name}"
                             onkeyup="searchProductForInvoice(event, '${rowId}')" 
                             onkeydown="handleSearchKeyboardForInvoice(event, '${rowId}')" 
                             onfocus="showSearchResultsForInvoice('${rowId}')" 
                             autocomplete="off"
                             style="min-width: 150px; padding: 4px; border-radius: 4px;">
                      <div class="search-results list-group" id="search-results-${rowId}" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; display: none; width: 100%; margin-top: 2px;"></div>
                    </td>
                    <td contenteditable="true" class="editable-quantity" style="text-align: center; min-width: 60px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'quantity')" onkeypress="if(event.key==='Enter'){this.blur();}">${item.quantity}</td>
                    <td contenteditable="true" class="editable-price" style="text-align: center; min-width: 80px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'price')" onkeypress="if(event.key==='Enter'){this.blur();}">${formatCurrency(item.sale_price)}</td>
                    <td class="item-total" style="text-align: center;">${formatCurrency(item.amount)}</td>
                  </tr>
                `;
                  }).join('')}
              </tbody>
              <tfoot>
                <tr style="background: var(--color-bg); font-weight: 700;">
                  <td colspan="4" style="text-align: left;" data-en="Total:" data-ar="الإجمالي:">الإجمالي:</td>
                  <td id="invoice-total" style="font-size: 1.125rem; color: var(--color-credit-sale);">${formatCurrency(activity.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" onclick="saveInvoiceChanges()" data-en="Save" data-ar="حفظ">
              <i class="bi bi-save"></i> <span data-en="Save" data-ar="حفظ">حفظ</span>
            </button>
            <button type="button" class="btn btn-info" onclick="addNewInvoiceItem()" data-en="New Item" data-ar="إضافة منتج">
              <i class="bi bi-plus-circle"></i> <span data-en="New Item" data-ar="إضافة منتج">إضافة منتج</span>
            </button>
            <button type="button" class="btn btn-primary" onclick="printInvoice()" data-en="Print Invoice" data-ar="طباعة الفاتورة">
              <i class="bi bi-printer"></i> <span data-en="Print" data-ar="طباعة">طباعة</span>
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-en="Close" data-ar="إغلاق">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('invoiceModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Store invoice data in modal for save function
  const modalElement = document.getElementById('invoiceModal');
  if (modalElement) {
    modalElement.dataset.invoiceData = JSON.stringify({
      transaction_id: transactionId,
      customer_id: activity.customer_id || null,
      customer_name: activity.customer_name || null,
      type: activity.type || 'sale',
      is_credit: activity.type === 'credit_sale'
    });
  }

  // Show modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  
  // Add event listeners for editable fields
  setupInvoiceEditableFields();

  // Remove modal from DOM when hidden
  document.getElementById('invoiceModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
};

// Invoice search timeouts
const invoiceSearchTimeouts = {};

// Highlight search query in text
function highlightTextForInvoice(text, query) {
  if (!query || query.trim() === '') return text;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Search product for invoice row
window.searchProductForInvoice = async function(event, rowId) {
  const input = event.target;
  const query = input.value.trim();
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  
  if (!resultsDiv) return;
  
  clearTimeout(invoiceSearchTimeouts[rowId]);
  
  if (query.length < 2) {
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
    return;
  }

  // Show loading state
  const isArabic = document.documentElement.dir === 'rtl';
  resultsDiv.innerHTML = `
    <div class="list-group-item text-center text-muted">
      <small>${isArabic ? 'جاري البحث...' : 'Searching...'}</small>
    </div>
  `;
  resultsDiv.style.display = 'block';
  
  invoiceSearchTimeouts[rowId] = setTimeout(async () => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const products = await response.json();
      
      if (products.length === 0) {
        resultsDiv.innerHTML = `
          <div class="list-group-item text-muted text-center">${isArabic ? 'لم يتم العثور على منتجات' : 'No products found'}</div>
          <button type="button" 
                  class="list-group-item list-group-item-action list-group-item-primary" 
                  onclick="createAndSelectProductForInvoiceRow('${rowId}', '${query.replace(/'/g, "\\'")}')"
                  data-row-id="${rowId}">
            <strong>${isArabic ? 'إضافة منتج جديد بهذا الاسم' : 'Add new product with this name'}</strong>
            <br>
            <small>${isArabic ? 'الاسم:' : 'Name:'} ${highlightTextForInvoice(query, query)}</small>
          </button>
        `;
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
      
      resultsDiv.innerHTML = sortedProducts.map((product) => {
        const highlightedName = highlightTextForInvoice(product.name, query);
        const stockClass = product.stock_quantity <= 0 ? 'text-danger' : (product.stock_quantity <= 5 ? 'text-warning' : 'text-success');
        const currentPrice = product.sale_price ? formatCurrency(product.sale_price) : (isArabic ? 'غير محدد' : 'Not set');
        return `
        <button type="button" 
                  class="list-group-item list-group-item-action search-result-item" 
                  onclick="selectProductForInvoiceRow('${rowId}', ${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.purchase_price}, ${product.sale_price || 'null'}, ${product.stock_quantity})"
                  data-row-id="${rowId}"
                  data-product-id="${product.id}"
                  tabindex="0">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <strong class="search-result-item__name">${highlightedName}</strong>
                <div class="search-result-item__details">
                  <span class="${stockClass}">
                    ${isArabic ? 'المخزون:' : 'Stock:'} ${product.stock_quantity}
                  </span>
                  <span class="text-muted">|</span>
                  <span class="text-muted">
                    ${isArabic ? 'السعر:' : 'Price:'} ${currentPrice}
                  </span>
                </div>
              </div>
            </div>
        </button>
        `;
      }).join('');
      resultsDiv.style.display = 'block';
    } catch (error) {
      console.error('Error searching products:', error);
      const isArabic = document.documentElement.dir === 'rtl';
      resultsDiv.innerHTML = `
        <div class="list-group-item text-danger text-center">
          <small>${isArabic ? 'خطأ في البحث. يرجى المحاولة مرة أخرى.' : 'Error searching products. Please try again.'}</small>
        </div>
      `;
      resultsDiv.style.display = 'block';
    }
  }, 200);
};

// Show search results for invoice row
window.showSearchResultsForInvoice = function(rowId) {
  const input = document.querySelector(`input.product-search-invoice[data-row-id="${rowId}"]`);
  if (input && input.value.trim().length >= 2) {
    searchProductForInvoice({ target: input }, rowId);
  }
};

// Handle keyboard navigation in search results for invoice
window.handleSearchKeyboardForInvoice = function(event, rowId) {
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  if (!resultsDiv || resultsDiv.style.display === 'none') return;
  
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
      resultsDiv.style.display = 'none';
      const input = document.querySelector(`input.product-search-invoice[data-row-id="${rowId}"]`);
      if (input) input.blur();
      break;
  }
};

// Create and select a new product for invoice row
window.createAndSelectProductForInvoiceRow = async function(rowId, productName) {
  const isArabic = document.documentElement.dir === 'rtl';
  
  try {
    const response = await fetch('/api/products/quick-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: productName })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      alert(isArabic ? `خطأ في إنشاء المنتج: ${data.error}` : `Error creating product: ${data.error}`);
      return;
    }
    
    // Select the newly created product
    selectProductForInvoiceRow(rowId, data.product.id, data.product.name, 0, null, 0);
    alert(isArabic ? 'تم إنشاء المنتج بنجاح' : 'Product created successfully');
  } catch (error) {
    console.error('Error creating product:', error);
    alert(isArabic ? 'حدث خطأ أثناء إنشاء المنتج' : 'Error creating product');
  }
};

// Select product for invoice row
window.selectProductForInvoiceRow = function(rowId, productId, productName, purchasePrice, salePrice, stockQuantity) {
  const row = document.getElementById(rowId);
  if (!row) return;
  
  // Update product search input
  const searchInput = row.querySelector(`input.product-search-invoice[data-row-id="${rowId}"]`);
  if (searchInput) {
    searchInput.value = productName;
  }
  
  // Hide search results
  const resultsDiv = document.getElementById(`search-results-${rowId}`);
  if (resultsDiv) {
    resultsDiv.style.display = 'none';
  }
  
  // Update product ID and price
  row.setAttribute('data-product-id', productId);
  
  // Ensure quantity is at least 1
  const quantityCell = row.querySelector('.editable-quantity');
  if (quantityCell) {
    const currentQuantity = parseFloat(quantityCell.textContent.trim()) || 0;
    if (currentQuantity <= 0) {
      quantityCell.textContent = '1';
      row.setAttribute('data-original-quantity', '1');
    } else {
      row.setAttribute('data-original-quantity', currentQuantity);
    }
  }
  
  // Update price if sale price exists
  const priceCell = row.querySelector('.editable-price');
  if (priceCell) {
    if (salePrice !== null && salePrice !== undefined) {
      priceCell.textContent = formatCurrency(salePrice);
      row.setAttribute('data-original-price', salePrice);
    } else {
      // If no sale price, keep current or set to 0
      const currentPrice = parseFloat(priceCell.textContent.replace(/[$\s]/g, '')) || 0;
      row.setAttribute('data-original-price', currentPrice);
    }
  }
  
  // Recalculate total - always update even if price is 0
  if (priceCell) {
    updateInvoiceItem(priceCell, 'price');
  }
};

// Setup editable fields for invoice
function setupInvoiceEditableFields() {
  // Add hover effect to editable cells
  const editableCells = document.querySelectorAll('.editable-quantity, .editable-price');
  editableCells.forEach(cell => {
    cell.addEventListener('mouseenter', function() {
      this.style.border = '1px solid #0d6efd';
      this.style.backgroundColor = '#f0f8ff';
    });
    cell.addEventListener('mouseleave', function() {
      if (document.activeElement !== this) {
        this.style.border = '1px solid transparent';
        this.style.backgroundColor = '';
      }
    });
    cell.addEventListener('focus', function() {
      this.style.border = '1px solid #0d6efd';
      this.style.backgroundColor = '#f0f8ff';
    });
    cell.addEventListener('blur', function() {
      this.style.border = '1px solid transparent';
      this.style.backgroundColor = '';
    });
  });
  
  // Hide search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.product-search-invoice') && !e.target.closest('.search-results')) {
      document.querySelectorAll('.search-results[id^="search-results-"]').forEach(div => {
        div.style.display = 'none';
      });
    }
  });
}

// Update invoice item when quantity or price is edited
window.updateInvoiceItem = function(element, type) {
  const row = element.closest('tr');
  if (!row) return;
  
  const quantityCell = row.querySelector('.editable-quantity');
  const priceCell = row.querySelector('.editable-price');
  const totalCell = row.querySelector('.item-total');
  
  if (!quantityCell || !priceCell || !totalCell) return;
  
  // If it's a price cell, ensure it has the $ format
  if (type === 'price') {
    let priceText = priceCell.textContent.trim();
    // Remove any existing $ and spaces, then parse the number
    const numValue = parseFloat(priceText.replace(/[$\s,]/g, '')) || 0;
    // Format it properly with $ and space
    priceCell.textContent = formatCurrency(numValue);
  }
  
  // Get values - re-read after potential formatting
  let quantity = parseFloat(quantityCell.textContent.trim().replace(/[^\d.]/g, '')) || 0;
  let priceText = priceCell.textContent.trim();
  // Remove $, spaces, and commas, then parse
  let price = parseFloat(priceText.replace(/[$\s,]/g, '')) || 0;
  
  // Calculate new total
  const newTotal = quantity * price;
  
  // Update total cell
  totalCell.textContent = formatCurrency(newTotal);
  
  // Update invoice total - ensure it's called
  updateInvoiceTotal();
  
  // Add visual feedback
  element.style.backgroundColor = '#e3f2fd';
  setTimeout(() => {
    element.style.backgroundColor = '';
  }, 300);
};

// Update invoice total
function updateInvoiceTotal() {
  const totalCell = document.getElementById('invoice-total');
  if (!totalCell) {
    console.warn('Invoice total cell not found');
    return;
  }
  
  const rows = document.querySelectorAll('#invoiceContent tbody tr');
  let total = 0;
  
  rows.forEach(row => {
    const totalCell = row.querySelector('.item-total');
    if (totalCell) {
      const totalText = totalCell.textContent.trim() || '';
      // Remove $, spaces, and commas, then parse
      const amount = parseFloat(totalText.replace(/[$\s,]/g, '')) || 0;
      total += amount;
    }
  });
  
  totalCell.textContent = formatCurrency(total);
}

// Save invoice changes - Delete and recreate approach
window.saveInvoiceChanges = async function() {
  const invoiceContent = document.getElementById('invoiceContent');
  if (!invoiceContent) return;
  
  const isArabic = document.documentElement.dir === 'rtl';
  const rows = invoiceContent.querySelectorAll('tbody tr');
  
  if (rows.length === 0) {
    alert(isArabic ? 'لا توجد منتجات للحفظ' : 'No items to save');
    return;
  }
  
  // Get transaction ID and invoice data from modal
  const modal = document.getElementById('invoiceModal');
  let transactionId = null;
  let customerId = null;
  let isCredit = false;
  
  // Get invoice data from modal dataset
  if (modal && modal.dataset.invoiceData) {
    try {
      const invoiceData = JSON.parse(modal.dataset.invoiceData);
      transactionId = invoiceData.transaction_id || null;
      customerId = invoiceData.customer_id || null;
      isCredit = invoiceData.is_credit || false;
    } catch (e) {
      console.error('Error parsing invoice data:', e);
    }
  }
  
  // Fallback: Get transaction ID from invoice content
  if (!transactionId) {
    const transactionIdSpans = Array.from(invoiceContent.querySelectorAll('span'));
    const transactionSpan = transactionIdSpans.find(span => span.textContent.includes('_'));
    if (transactionSpan) {
      transactionId = transactionSpan.textContent.trim();
    }
  }
  
  // Fallback: Get customer_id from existing sale rows if missing
  if (!customerId && transactionId && rows.length > 0) {
    const firstRow = rows[0];
    if (firstRow) {
      const saleId = firstRow.getAttribute('data-sale-id');
      if (saleId && saleId !== '' && saleId !== 'null') {
        // Try to get customer_id from the first existing sale via API
        try {
          const saleResponse = await fetch(`/api/sales/${saleId}`);
          if (saleResponse.ok) {
            const saleData = await saleResponse.json();
            customerId = saleData.customer_id || null;
          }
        } catch (e) {
          console.error('Error fetching sale data:', e);
        }
      }
    }
  }
  
  // Validate: If it's a credit sale, customer_id is required
  if (isCredit && !customerId) {
    alert(isArabic ? 'خطأ: مطلوب معرف العميل لحفظ فاتورة البيع بالدين' : 'Error: Customer ID is required for credit sales');
    return;
  }
  
  // Collect all current invoice items
  const itemsToCreate = [];
  
  rows.forEach(row => {
    // Get product name from search input
    const productSearchInput = row.querySelector('input.product-search-invoice');
    const quantityCell = row.querySelector('.editable-quantity');
    const priceCell = row.querySelector('.editable-price');
    
    if (!productSearchInput || !quantityCell || !priceCell) return;
    
    const productName = productSearchInput.value.trim();
    if (!productName) return; // Skip empty product names
    
    const quantity = parseFloat(quantityCell.textContent.trim().replace(/[^\d.]/g, '')) || 0;
    if (quantity <= 0) return; // Skip invalid quantities
    
    const priceText = priceCell.textContent.trim();
    const price = parseFloat(priceText.replace(/[$\s,]/g, '')) || 0;
    if (price < 0) return; // Skip invalid prices
    
    const productId = row.getAttribute('data-product-id');
    
    itemsToCreate.push({
      product_id: productId && productId !== '' && productId !== 'null' ? parseInt(productId) : null,
      product_name: productName,
      quantity: quantity,
      sale_price: price
    });
  });
  
  if (itemsToCreate.length === 0) {
    alert(isArabic ? 'لا توجد منتجات للحفظ' : 'No items to save');
    return;
  }
  
  // Show loading
  const saveBtn = document.querySelector('button[onclick="saveInvoiceChanges()"]');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> ' + (isArabic ? 'جاري الحفظ...' : 'Saving...');
  
  try {
    // Step 1: Collect all existing sale IDs from rows and delete them
    // This restores stock automatically
    const existingSaleIds = [];
    rows.forEach(row => {
      const saleId = row.getAttribute('data-sale-id');
      if (saleId && saleId !== '' && saleId !== 'null') {
        existingSaleIds.push(parseInt(saleId));
      }
    });
    
    // Delete all existing sales for this transaction
    for (const saleId of existingSaleIds) {
      try {
        const deleteResponse = await fetch(`/api/sales/${saleId}`, {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          const error = await deleteResponse.json();
          console.warn(`Failed to delete sale ${saleId}:`, error.error || 'Unknown error');
          // Continue with other deletions even if one fails
        }
      } catch (error) {
        console.warn(`Error deleting sale ${saleId}:`, error);
        // Continue with other deletions
      }
    }
    
    // Step 2: Create products for items that don't have product_id
    for (const item of itemsToCreate) {
      if (!item.product_id && item.product_name) {
        try {
          const createProductResponse = await fetch('/api/products/quick-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: item.product_name })
          });
          
          if (!createProductResponse.ok) {
            const error = await createProductResponse.json();
            throw new Error(error.error || 'Failed to create product');
          }
          
          const productData = await createProductResponse.json();
          item.product_id = productData.product.id;
        } catch (error) {
          throw new Error(`Failed to create product "${item.product_name}": ${error.message}`);
        }
      }
      
      if (!item.product_id) {
        throw new Error(`Product ID is required for "${item.product_name}"`);
      }
    }
    
    // Step 3: Create all new sales using the multiple sales endpoint
    // This ensures they all have the same transaction_id
    const salesToCreate = itemsToCreate.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      sale_price: item.sale_price
    }));
    
    const createResponse = await fetch('/api/sales/multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sales: salesToCreate,
        customer_id: customerId,
        is_credit: isCredit,
        transaction_id: transactionId // Preserve original transaction_id
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error || 'Failed to create sales');
    }
    
    // Success!
    alert(isArabic ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
    // Reload the page to show updated data
    window.location.reload();
    
  } catch (error) {
    console.error('Error saving invoice:', error);
    alert(isArabic ? `حدث خطأ أثناء الحفظ: ${error.message}` : `Error saving changes: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
};

// Add new item to invoice - directly add a row with search input
window.addNewInvoiceItem = function() {
  const isArabic = document.documentElement.dir === 'rtl';
  
  // Add product to invoice table - before the total row (tfoot)
  const tbody = document.querySelector('#invoiceContent tbody');
  const tfoot = document.querySelector('#invoiceContent tfoot');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr');
  const newIndex = rows.length + 1;
  const rowId = 'invoice-row-new-' + Date.now();
  
  // Create new row
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-item-id', 'new-' + Date.now());
  newRow.setAttribute('data-sale-id', '');
  newRow.setAttribute('data-product-id', '');
  newRow.setAttribute('data-original-quantity', '1');
  newRow.setAttribute('data-original-price', '0');
  newRow.id = rowId;
  newRow.innerHTML = `
    <td style="text-align: center; font-weight: 600;">${newIndex}</td>
    <td style="min-width: 150px; padding: 4px; position: relative;">
      <input type="text" 
             class="form-control sale-card__input product-search-invoice" 
             placeholder="${isArabic ? 'ابحث عن منتج...' : 'Search product...'}" 
             data-row-id="${rowId}"
             data-sale-id=""
             value=""
             onkeyup="searchProductForInvoice(event, '${rowId}')" 
             onkeydown="handleSearchKeyboardForInvoice(event, '${rowId}')" 
             onfocus="showSearchResultsForInvoice('${rowId}')" 
             autocomplete="off"
             style="min-width: 150px; padding: 4px; border-radius: 4px;">
      <div class="search-results list-group" id="search-results-${rowId}" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; display: none; width: 100%; margin-top: 2px;"></div>
    </td>
    <td contenteditable="true" class="editable-quantity" style="text-align: center; min-width: 60px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'quantity')" onkeypress="if(event.key==='Enter'){this.blur();}">1</td>
    <td contenteditable="true" class="editable-price" style="text-align: center; min-width: 80px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'price')" onkeypress="if(event.key==='Enter'){this.blur();}">${formatCurrency(0)}</td>
    <td class="item-total" style="text-align: center;">${formatCurrency(0)}</td>
  `;
  
  // Insert before tfoot if it exists, otherwise append to tbody
  if (tfoot && tfoot.parentNode) {
    tfoot.parentNode.insertBefore(newRow, tfoot);
  } else {
    tbody.appendChild(newRow);
  }
  
  // Update row numbers
  updateRowNumbers();
  
  // Setup editable fields for the new row
  setupInvoiceEditableFields();
  
  // Update total
  updateInvoiceTotal();
  
  // Focus on product search input
  const searchInput = newRow.querySelector('input.product-search-invoice');
  if (searchInput) {
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  }
};

// Select product for invoice
window.selectProductForInvoice = function(productId, productName, price, stock) {
  const isArabic = document.documentElement.dir === 'rtl';
  
  // Close search modal
  const searchModal = bootstrap.Modal.getInstance(document.getElementById('productSearchModal'));
  if (searchModal) {
    searchModal.hide();
  }
  
  // Add product to invoice table - before the total row (tfoot)
  const tbody = document.querySelector('#invoiceContent tbody');
  const tfoot = document.querySelector('#invoiceContent tfoot');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr');
  const newIndex = rows.length + 1;
  const rowId = 'invoice-row-new-' + Date.now();
  
  // Create new row
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-item-id', 'new-' + Date.now());
  newRow.setAttribute('data-sale-id', '');
  newRow.setAttribute('data-product-id', productId);
  newRow.setAttribute('data-original-quantity', '1');
  newRow.setAttribute('data-original-price', price || '0');
  newRow.id = rowId;
  newRow.innerHTML = `
    <td style="text-align: center; font-weight: 600;">${newIndex}</td>
    <td style="min-width: 150px; padding: 4px; position: relative;">
      <input type="text" 
             class="form-control sale-card__input product-search-invoice" 
             placeholder="${isArabic ? 'ابحث عن منتج...' : 'Search product...'}" 
             data-row-id="${rowId}"
             data-sale-id=""
             value="${productName}"
             onkeyup="searchProductForInvoice(event, '${rowId}')" 
             onkeydown="handleSearchKeyboardForInvoice(event, '${rowId}')" 
             onfocus="showSearchResultsForInvoice('${rowId}')" 
             autocomplete="off"
             style="min-width: 150px; padding: 4px; border-radius: 4px;">
      <div class="search-results list-group" id="search-results-${rowId}" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; display: none; width: 100%; margin-top: 2px;"></div>
    </td>
    <td contenteditable="true" class="editable-quantity" style="text-align: center; min-width: 60px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'quantity')" onkeypress="if(event.key==='Enter'){this.blur();}">1</td>
    <td contenteditable="true" class="editable-price" style="text-align: center; min-width: 80px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'price')" onkeypress="if(event.key==='Enter'){this.blur();}">${formatCurrency(price || 0)}</td>
    <td class="item-total" style="text-align: center;">${formatCurrency(price || 0)}</td>
  `;
  
  // Insert before tfoot if it exists, otherwise append to tbody
  if (tfoot && tfoot.parentNode) {
    tfoot.parentNode.insertBefore(newRow, tfoot);
  } else {
    tbody.appendChild(newRow);
  }
  
  // Update row numbers
  updateRowNumbers();
  
  // Setup editable fields for the new row
  setupInvoiceEditableFields();
  
  // Update total
  updateInvoiceTotal();
  
  // Focus on quantity cell
  const quantityCell = newRow.querySelector('.editable-quantity');
  if (quantityCell) {
    setTimeout(() => {
      quantityCell.focus();
      quantityCell.select();
    }, 100);
  }
};

// Update row numbers in invoice table
function updateRowNumbers() {
  const rows = document.querySelectorAll('#invoiceContent tbody tr');
  rows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child');
    if (firstCell) {
      firstCell.textContent = index + 1;
    }
  });
}

// Print invoice function - matches modal exactly
window.printInvoice = function() {
  const invoiceContent = document.getElementById('invoiceContent');
  if (!invoiceContent) return;

  // Get logo source - always use absolute URL for print
  const logoImg = document.getElementById('invoiceLogo');
  let logoSrc = window.location.origin + '/logo2.png'; // Default to absolute path
  if (logoImg) {
    if (logoImg.src && logoImg.complete && logoImg.naturalHeight !== 0) {
      // Logo is loaded, use its src
      logoSrc = logoImg.src;
      // If it's a relative path, make it absolute
      if (logoSrc.startsWith('/')) {
        logoSrc = window.location.origin + logoSrc;
      } else if (!logoSrc.startsWith('http')) {
        logoSrc = window.location.origin + '/' + logoSrc;
      }
    } else {
      // Logo not loaded yet, use default absolute path
      logoSrc = window.location.origin + '/logo2.png';
    }
  }
  
  // Create print window
  const printWindow = window.open('', '_blank');
  const isArabic = document.documentElement.dir === 'rtl';
  
  // Clone the invoice content to preserve all styling
  const contentClone = invoiceContent.cloneNode(true);
  
  // Extract all parts
  const headerDiv = contentClone.querySelector('.invoice-header');
  // Find invoice info - it's the div after header that contains customer/date info
  const allDivs = contentClone.querySelectorAll('div[style*="margin-bottom"]');
  let infoDiv = null;
  for (let div of allDivs) {
    if (!div.classList.contains('invoice-header') && div.querySelector('span[style*="font-weight: 600"]')) {
      infoDiv = div;
      // Ensure the info div has proper styling for print
      if (infoDiv) {
        infoDiv.style.marginBottom = '20px';
        infoDiv.style.fontSize = '14px';
        // Ensure all child divs have proper flex styling
        const childDivs = infoDiv.querySelectorAll('div');
        childDivs.forEach(child => {
          if (!child.style.display) {
            child.style.display = 'flex';
          }
          if (!child.style.justifyContent) {
            child.style.justifyContent = 'space-between';
          }
          if (!child.style.marginBottom) {
            child.style.marginBottom = '8px';
          }
        });
      }
      break;
    }
  }
  
  const table = contentClone.querySelector('table');
  const tbody = table ? table.querySelector('tbody') : null;
  const tfoot = table ? table.querySelector('tfoot') : null;
  const thead = table ? table.querySelector('thead') : null;
  
  // Get total amount from tfoot if it exists
  let totalAmount = '';
  let totalRowHTML = '';
  if (tfoot) {
    const totalCell = tfoot.querySelector('td:last-child');
    totalAmount = totalCell ? totalCell.textContent.trim() : '';
    // Create a total row to add as last row in tbody (not tfoot to avoid repeating)
    const totalRow = tfoot.querySelector('tr');
    if (totalRow) {
      totalRowHTML = totalRow.outerHTML;
    }
  }
  
  // Get all rows from tbody and sort by product name
  const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
  // Sort rows by product name (second column, since first is row number)
  rows.sort((a, b) => {
    const nameA = a.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
    const nameB = b.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
    return nameA.localeCompare(nameB);
  });
  
  // Update row numbers after sorting and clean up for print
  rows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child');
    if (firstCell) {
      firstCell.textContent = index + 1;
    }
    // Remove contenteditable and event handlers for print
    const editableCells = row.querySelectorAll('.editable-quantity, .editable-price');
    editableCells.forEach(cell => {
      cell.removeAttribute('contenteditable');
      cell.removeAttribute('onblur');
      cell.removeAttribute('onkeypress');
      cell.classList.remove('editable-quantity', 'editable-price');
      // Clean up price cell - ensure it has space after $
      if (cell.classList.contains('editable-price') || cell.textContent.includes('$')) {
        let priceText = cell.textContent.trim();
        if (priceText && !priceText.includes('$ ')) {
          priceText = priceText.replace('$', '$ ');
          cell.textContent = priceText;
        }
      }
    });
  });
  
  // Update total row colspan to account for row number column
  if (totalRowHTML) {
    totalRowHTML = totalRowHTML.replace('colspan="4"', 'colspan="5"');
    totalRowHTML = totalRowHTML.replace('colspan="3"', 'colspan="5"');
  }
  
  // Fix logo src in header - ensure absolute URL for print
  let headerHTML = headerDiv ? headerDiv.outerHTML : '';
  if (headerHTML) {
    // Always use absolute URL for logo
    headerHTML = headerHTML.replace(/src="[^"]*"/g, `src="${logoSrc}"`);
    // Remove any onerror handlers
    headerHTML = headerHTML.replace(/onerror="[^"]*"/g, '');
    // Ensure logo is always visible in print
    headerHTML = headerHTML.replace(/style="([^"]*)"/g, (match, styleContent) => {
      // Remove any display:none and ensure display:block
      let newStyle = styleContent.replace(/display\s*:\s*[^;]+;?/gi, '');
      if (!newStyle.includes('display:')) {
        newStyle += '; display: block;';
      } else {
        newStyle = newStyle.replace(/display\s*:\s*[^;]+/gi, 'display: block');
      }
      return `style="${newStyle}"`;
    });
  }
  
  // Update infoDiv to change "العميل:" to "م.ر سيد:" and remove contenteditable attributes
  if (infoDiv) {
    let infoHTML = infoDiv.outerHTML;
    // Change العميل: to السيد:
    infoHTML = infoHTML.replace(/العميل:/g, 'السيد:');
    // Remove contenteditable and related attributes from any elements
    infoHTML = infoHTML.replace(/\s*contenteditable="[^"]*"/g, '');
    infoHTML = infoHTML.replace(/\s*onblur="[^"]*"/g, '');
    infoHTML = infoHTML.replace(/\s*onkeypress="[^"]*"/g, '');
    infoHTML = infoHTML.replace(/\s*class="[^"]*editable[^"]*"/g, '');
    // Create a temporary element to parse and update
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = infoHTML;
    infoDiv = tempDiv.firstElementChild;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="${isArabic ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isArabic ? 'فاتورة' : 'Invoice'}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        @media print {
          @page {
            margin: 15mm;
            size: A5;
          }
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .invoice-table {
            page-break-inside: auto;
          }
          .invoice-table tbody {
            page-break-inside: auto;
          }
          .invoice-table tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .invoice-table tbody tr.total-row {
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
            background-color: #f9fafb !important;
            font-weight: 700;
          }
          .invoice-table tbody tr:last-of-type:not(.total-row) {
            page-break-after: avoid;
          }
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          direction: ${isArabic ? 'rtl' : 'ltr'};
          padding: 20px;
          color: #111827;
          margin: 0;
          background: #fff;
          font-size: 12px;
          line-height: 1.4;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }
        .invoice-header img {
          max-height: 100px;
          max-width: 250px;
          object-fit: contain;
          display: block !important;
          margin: 0 auto 10px auto;
        }
        .invoice-header h3 {
          font-weight: 700;
          margin: 10px 0;
          color: #111827;
          font-size: 18px;
        }
        .invoice-info {
          margin-bottom: 20px;
          font-size: 12px;
        }
        .invoice-info > div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 4px 0;
        }
        .invoice-info span:first-child {
          font-weight: 600;
        }
        .invoice-table {
          width: 100%;
          margin: 0 auto;
          margin-bottom: 0;
          border-collapse: collapse;
          font-size: 11px;
        }
        .invoice-table thead th {
          background-color: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
          padding: 8px 6px;
          font-weight: 600;
          text-align: ${isArabic ? 'right' : 'left'};
          color: #111827;
          font-size: 11px;
        }
        .invoice-table tbody td {
          padding: 8px 6px;
          border-bottom: 1px solid #e5e7eb;
          text-align: ${isArabic ? 'right' : 'left'};
          font-size: 11px;
        }
        .invoice-table tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .invoice-table tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        .invoice-table tbody tr.total-row {
          background-color: #f9fafb;
          font-weight: 700;
        }
        .invoice-table tbody tr.total-row td {
          padding: 8px 6px;
          border-top: 2px solid #e5e7eb;
          text-align: ${isArabic ? 'right' : 'left'};
        }
        .invoice-table tbody tr.total-row td:first-child {
          text-align: ${isArabic ? 'right' : 'left'};
        }
        .invoice-table tbody tr.total-row td:last-child {
          font-size: 16px;
          color: #f59e0b;
        }
      </style>
    </head>
    <body>
      ${headerHTML}
      ${infoDiv ? infoDiv.outerHTML : ''}
      ${table ? `
        <table class="invoice-table">
          ${thead ? thead.outerHTML : ''}
          <tbody>
            ${rows.map(row => row.outerHTML).join('')}
            ${totalRowHTML ? totalRowHTML.replace('<tr', '<tr class="total-row"') : ''}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Wait for images (especially logo) to load, then print
  printWindow.document.addEventListener('DOMContentLoaded', () => {
    // Wait for all images to load
    const images = printWindow.document.querySelectorAll('img');
    let imagesLoaded = 0;
    const totalImages = images.length;
    
    if (totalImages === 0) {
      // No images, print immediately
      setTimeout(() => printWindow.print(), 100);
      return;
    }
    
    const checkAndPrint = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        // All images loaded, wait a bit more then print
        setTimeout(() => {
          printWindow.print();
          // Don't close immediately - let user see the print dialog
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 300);
      }
    };
    
    images.forEach(img => {
      if (img.complete) {
        checkAndPrint();
      } else {
        img.onload = checkAndPrint;
        img.onerror = checkAndPrint; // Continue even if image fails
      }
    });
  });
  
  // Fallback if DOMContentLoaded already fired
  setTimeout(() => {
    if (printWindow.document.readyState === 'complete') {
      const images = printWindow.document.querySelectorAll('img');
      let imagesLoaded = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
        return;
      }
      
      const checkAndPrint = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 300);
        }
      };
      
      images.forEach(img => {
        if (img.complete) {
          checkAndPrint();
        } else {
          img.onload = checkAndPrint;
          img.onerror = checkAndPrint;
        }
      });
    }
  }, 100);
};

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
