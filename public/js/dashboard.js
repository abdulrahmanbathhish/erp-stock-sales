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

// Format date/time with AM/PM in Syria timezone
function formatDateTime(dateString) {
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

// Get activity type label
function getActivityTypeLabel(type, isArabic = true) {
  const labels = {
    sale: isArabic ? 'بيع نقدي' : 'Cash Sale',
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

// Get activity color class
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

// Load all dashboard data
async function loadDashboardData() {
  await Promise.all([
    loadFinancialSummary(),
    loadRecentOperations()
  ]);
}

// Load financial summary cards
async function loadFinancialSummary() {
  try {
    // Load all customers to calculate total debt
    const customersResponse = await fetch('/api/customers');
    const customers = await customersResponse.json();
    const totalDebt = customers.reduce((sum, c) => sum + (parseFloat(c.debt) || 0), 0);

    // Load all products to calculate total capital
    // Only count positive stock - negative stock means oversold items and shouldn't contribute to capital
    const productsResponse = await fetch('/api/products');
    const products = await productsResponse.json();
    const totalCapital = products.reduce((sum, p) => {
      const stockQty = parseFloat(p.stock_quantity) || 0;
      const purchasePrice = parseFloat(p.purchase_price) || 0;
      // Only add to capital if stock is positive
      return sum + (stockQty > 0 ? stockQty * purchasePrice : 0);
    }, 0);

    // Load all expenses
    const expensesResponse = await fetch('/api/expenses');
    const expenses = await expensesResponse.json();
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Load financial summary for profit
    const summaryResponse = await fetch('/api/sales/financial-summary?period=all');
    const summary = await summaryResponse.json();
    const totalProfit = parseFloat(summary.profit) || 0;

    // Load all sales to calculate cost of sold items
    const salesResponse = await fetch('/api/sales?limit=10000');
    const sales = await salesResponse.json();
    const costOfSoldItems = sales.reduce((sum, s) => 
      sum + ((parseFloat(s.purchase_price) || 0) * (parseInt(s.quantity) || 0)), 0
    );

    // Calculate net profit with cost of sold items
    const netProfit = totalProfit - totalExpenses + costOfSoldItems;

    // Update UI
    document.getElementById('total-debt').textContent = formatCurrency(totalDebt);
    document.getElementById('total-capital').textContent = formatCurrency(totalCapital);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
    document.getElementById('net-profit').textContent = formatCurrency(netProfit);

  } catch (error) {
    console.error('Error loading financial summary:', error);
  }
}

// Load recent operations with delete buttons
async function loadRecentOperations() {
  try {
    const container = document.getElementById('recent-operations');
    const isArabic = document.documentElement.dir === 'rtl';

    // Show loading
    container.innerHTML = `
      <div class="loading-state">
        <i class="bi bi-hourglass-split"></i>
        <p data-en="Loading operations..." data-ar="جاري تحميل العمليات...">جاري تحميل العمليات...</p>
      </div>
    `;

    // Fetch recent activity
    const response = await fetch('/api/sales/recent-activity?limit=50&time=all');
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

    // Display operations with delete buttons
    container.innerHTML = activities.map(activity => {
      const typeClass = getActivityColorClass(activity.type);
      const typeLabel = getActivityTypeLabel(activity.type, isArabic);
      const icon = getActivityIcon(activity.type);
      const customerName = activity.customer_name || (isArabic ? 'نقدي' : 'Cash');

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
              <span><i class="bi bi-person"></i> ${customerName}</span>
              <span><i class="bi bi-clock"></i> ${timestamp}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--color-${typeClass});">${formatCurrency(activity.amount || 0)}</span>
            <button class="btn btn-sm btn-danger" onclick="deleteOperation('${activity.type}', ${activity.id}, '${(description || typeLabel).replace(/'/g, "\\'")}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading recent operations:', error);
    const container = document.getElementById('recent-operations');
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

// Delete operation (unified function)
async function deleteOperation(type, id, description) {
  const isArabic = document.documentElement.dir === 'rtl';

  const confirmMsg = isArabic
    ? `هل أنت متأكد من حذف هذه العملية؟\n\n${description}\n\nسيتم عكس جميع التغييرات المرتبطة.`
    : `Are you sure you want to delete this operation?\n\n${description}\n\nAll related changes will be reversed.`;

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    let endpoint;
    if (type === 'sale' || type === 'credit_sale') {
      endpoint = `/api/sales/${id}`;
    } else if (type === 'return') {
      endpoint = `/api/returns/${id}`;
    } else if (type === 'payment') {
      endpoint = `/api/customers/payments/${id}`;
    } else if (type === 'expense') {
      endpoint = `/api/expenses/${id}`;
    } else {
      alert(isArabic ? 'نوع عملية غير معروف' : 'Unknown operation type');
      return;
    }

    const response = await fetch(endpoint, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || (isArabic ? 'خطأ في حذف العملية' : 'Error deleting operation'));
      return;
    }

    alert(isArabic ? 'تم حذف العملية بنجاح' : 'Operation deleted successfully');
    loadDashboardData();
  } catch (error) {
    console.error('Error deleting operation:', error);
    alert(isArabic ? 'خطأ في حذف العملية' : 'Error deleting operation');
  }
}

// Show reset modal
function showResetModal() {
  const modal = new bootstrap.Modal(document.getElementById('resetModal'));
  document.getElementById('reset-error').style.display = 'none';
  modal.show();
}

// Confirm reset all data
async function confirmReset() {
  const errorDiv = document.getElementById('reset-error');
  const isArabic = document.documentElement.dir === 'rtl';

  try {
    const response = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || (isArabic ? 'خطأ في إعادة التعيين' : 'Error resetting data');
      errorDiv.style.display = 'block';
      return;
    }

    // Success
    const modal = bootstrap.Modal.getInstance(document.getElementById('resetModal'));
    modal.hide();
    alert(isArabic ? 'تم إعادة تعيين جميع البيانات بنجاح. سيتم إعادة تحميل الصفحة.' : 'All data has been reset successfully. The page will reload.');
    window.location.reload();
  } catch (error) {
    console.error('Error resetting data:', error);
    errorDiv.textContent = isArabic ? 'خطأ في إعادة التعيين' : 'Error resetting data';
    errorDiv.style.display = 'block';
  }
}

// Export today's data to Excel
async function exportTodayData(event) {
  console.log('exportTodayData called', event);
  
  // Get button - either from event or find it by searching for the onclick attribute
  let button = null;
  if (event && event.target) {
    button = event.target.closest('button');
  }
  if (!button) {
    // Find button by searching for the one with exportTodayData in onclick
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('exportTodayData')) {
        button = btn;
        break;
      }
    }
  }
  
  const isArabic = document.documentElement.dir === 'rtl';
  const loadingMsg = isArabic ? 'جاري تصدير البيانات...' : 'Exporting data...';
  let originalText = null;
  
  try {
    // Show loading message
    if (button) {
      const span = button.querySelector('span');
      if (span) {
        originalText = span.textContent;
        span.textContent = loadingMsg;
      }
      button.disabled = true;
    }
    
    console.log('Fetching /api/export/today...');
    // Fetch the Excel file
    const response = await fetch('/api/export/today');
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = 'Failed to export data';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Get the blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Daily_Report.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    const successMsg = isArabic ? 'تم تصدير البيانات بنجاح!' : 'Data exported successfully!';
    alert(successMsg);
    
    // Restore button text
    if (button && originalText) {
      const span = button.querySelector('span');
      if (span) {
        span.textContent = originalText;
      }
      button.disabled = false;
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    const errorMsg = isArabic 
      ? `خطأ في تصدير البيانات: ${error.message}` 
      : `Error exporting data: ${error.message}`;
    alert(errorMsg);
    
    // Restore button
    if (button) {
      const span = button.querySelector('span');
      if (span && originalText) {
        span.textContent = originalText;
      }
      button.disabled = false;
    }
  }
}

// Make functions globally available
window.loadDashboardData = loadDashboardData;
window.deleteOperation = deleteOperation;
window.showResetModal = showResetModal;
window.confirmReset = confirmReset;
window.exportTodayData = exportTodayData;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});
