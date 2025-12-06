let expenseRows = [];
let rowCounter = 0;
let allExpenses = [];
let currentFilters = {};
let categories = [];

// Format currency
function formatCurrency(amount) {
  return '$' + parseFloat(amount).toFixed(2);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Show alert message
function showAlert(message, type = 'success') {
  const container = document.getElementById('alert-container');
  if (!container) return;
  
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

// Initialize - add first row
function initTable() {
  addNewRow();
  updateSummary();
}

// Add new row
function addNewRow() {
  const rowId = `row-${rowCounter++}`;
  const container = document.getElementById('expenses-cards-container');
  if (!container) return;
  
  const today = new Date().toISOString().slice(0, 10);
  
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
        <label class="sale-card__label" data-en="Description" data-ar="الوصف">الوصف</label>
        <input type="text" 
               class="form-control sale-card__input expense-description" 
               placeholder="Enter description..."
               data-row-id="${rowId}"
               oninput="updateSummary()">
      </div>
      <div class="sale-card__row">
        <div class="sale-card__field">
          <label class="sale-card__label" data-en="Amount" data-ar="المبلغ">المبلغ</label>
          <input type="number" 
                 class="form-control sale-card__input expense-amount" 
                 min="0.01" 
                 step="0.01"
                 data-row-id="${rowId}"
                 onchange="updateSummary()"
                 oninput="updateSummary()">
        </div>
        <div class="sale-card__field">
          <label class="sale-card__label" data-en="Date" data-ar="التاريخ">التاريخ</label>
          <input type="date" 
                 class="form-control sale-card__input expense-date" 
                 value="${today}"
                 data-row-id="${rowId}"
                 onchange="updateSummary()">
        </div>
      </div>
      <div class="sale-card__field">
        <label class="sale-card__label" data-en="Category" data-ar="الفئة">الفئة</label>
        <input type="text" 
               class="form-control sale-card__input expense-category" 
               placeholder="Category (optional)"
               list="category-datalist-${rowId}"
               data-row-id="${rowId}"
               oninput="updateSummary()">
        <datalist id="category-datalist-${rowId}"></datalist>
      </div>
    </div>
  `;
  
  container.appendChild(card);
  
  // Populate category datalist
  populateCategoryDatalist(rowId);
  
  updateSummary();
}

// Populate category datalist
function populateCategoryDatalist(rowId) {
  const datalist = document.getElementById(`category-datalist-${rowId}`);
  if (!datalist) return;
  
  datalist.innerHTML = categories.map(cat => 
    `<option value="${cat}">`
  ).join('');
}

// Remove row
function removeRow(rowId) {
  const card = document.getElementById(rowId);
  if (card) {
    card.remove();
    updateSummary();
  }
}

// Update summary
function updateSummary() {
  const container = document.getElementById('expenses-cards-container');
  if (!container) return;
  
  const cards = container.querySelectorAll('.sale-card');
  let validRows = 0;
  let totalAmount = 0;
  
  cards.forEach(card => {
    const amount = parseFloat(card.querySelector('.expense-amount').value) || 0;
    const date = card.querySelector('.expense-date').value;
    
    if (amount > 0 && date) {
      validRows++;
      totalAmount += amount;
      card.classList.remove('invalid');
    } else if (amount > 0 || date) {
      // Partial data - mark as invalid
      card.classList.add('invalid');
    } else {
      card.classList.remove('invalid');
    }
  });
  
  const totalRowsEl = document.getElementById('total-rows');
  const validRowsEl = document.getElementById('valid-rows');
  const totalAmountEl = document.getElementById('total-amount-preview');
  
  if (totalRowsEl) totalRowsEl.textContent = cards.length;
  if (validRowsEl) validRowsEl.textContent = validRows;
  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
}

// Submit all expenses
async function submitAllExpenses() {
  const container = document.getElementById('expenses-cards-container');
  if (!container) return;
  
  const cards = container.querySelectorAll('.sale-card');
  const expenses = [];
  const errors = [];
  
  cards.forEach((card, index) => {
    const description = card.querySelector('.expense-description').value.trim();
    const amount = parseFloat(card.querySelector('.expense-amount').value);
    const date = card.querySelector('.expense-date').value;
    const category = card.querySelector('.expense-category').value.trim();
    
    if (!amount || amount <= 0) {
      errors.push(`Row ${index + 1}: Amount must be greater than 0`);
      return;
    }
    
    if (!date) {
      errors.push(`Row ${index + 1}: Date is required`);
      return;
    }
    
    expenses.push({
      amount: amount,
      description: description || null,
      category: category || null,
      expense_date: date
    });
  });
  
  if (errors.length > 0) {
    showAlert('Please fix the following errors:<br>' + errors.join('<br>'), 'danger');
    return;
  }
  
  if (expenses.length === 0) {
    showAlert('Please add at least one expense', 'warning');
    return;
  }
  
  const confirmMessage = currentLanguage === 'ar' 
    ? `تأكيد ${expenses.length} مصروف(ات)؟`
    : `Confirm ${expenses.length} expense(s)?`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const response = await fetch('/api/expenses/multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expenses })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showAlert(data.error || 'Error creating expenses', 'danger');
      return;
    }
    
    const successMessage = currentLanguage === 'ar'
      ? `تم إنشاء ${data.expenses_created} مصروف(ات) بنجاح! إجمالي المبلغ: ${formatCurrency(data.total_amount)}`
      : `Successfully created ${data.expenses_created} expense(s)! Total amount: ${formatCurrency(data.total_amount)}`;
    
    showAlert(successMessage, 'success');
    
    // Clear cards and reinitialize
    container.innerHTML = '';
    rowCounter = 0;
    initTable();
    
    // Reload categories
    loadCategories();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
  } catch (error) {
    console.error('Error creating expenses:', error);
    showAlert('Error creating expenses', 'danger');
  }
}

// Load expenses (for history view)
async function loadExpenses() {
  try {
    let url = '/api/expenses?limit=1000';
    if (currentFilters.start_date && currentFilters.end_date) {
      url = `/api/expenses/range?start_date=${currentFilters.start_date}&end_date=${currentFilters.end_date}`;
    }
    
    const response = await fetch(url);
    allExpenses = await response.json();
    applyFilters();
  } catch (error) {
    console.error('Error loading expenses:', error);
    const tbody = document.getElementById('expenses-history-table');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading expenses</td></tr>';
    }
  }
}

// Load categories
async function loadCategories() {
  try {
    const response = await fetch('/api/expenses/categories/list');
    categories = await response.json();
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      // Clear existing options except "All Categories"
      while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
      }
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        categoryFilter.appendChild(option);
      });
    }
    
    // Update all datalists
    document.querySelectorAll('[id^="category-datalist-"]').forEach(datalist => {
      datalist.innerHTML = categories.map(cat => 
        `<option value="${cat}">`
      ).join('');
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Display expenses (for history view)
function displayExpenses(expenses) {
  const tbody = document.getElementById('expenses-history-table');
  const totalElement = document.getElementById('expenses-total');
  
  if (!tbody) return;
  
  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No expenses found</td></tr>';
    if (totalElement) totalElement.textContent = '$0.00';
    return;
  }
  
  let total = 0;
  tbody.innerHTML = expenses.map(expense => {
    total += expense.amount;
    return `
      <tr>
        <td>${formatDate(expense.expense_date)}</td>
        <td><strong>${formatCurrency(expense.amount)}</strong></td>
        <td>${expense.description || '<span class="text-muted">No description</span>'}</td>
        <td>${expense.category ? `<span class="badge bg-secondary">${expense.category}</span>` : '<span class="text-muted">-</span>'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editExpense(${expense.id})">Edit</button>
          <button class="btn btn-sm btn-danger ms-1" onclick="deleteExpense(${expense.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
  
  if (totalElement) totalElement.textContent = formatCurrency(total);
}

// Apply filters
function applyFilters() {
  const categoryFilter = document.getElementById('category-filter');
  const startDateFilter = document.getElementById('start-date-filter');
  const endDateFilter = document.getElementById('end-date-filter');
  
  if (!categoryFilter || !startDateFilter || !endDateFilter) return;
  
  const category = categoryFilter.value;
  const startDate = startDateFilter.value;
  const endDate = endDateFilter.value;
  
  currentFilters = {
    category,
    start_date: startDate,
    end_date: endDate
  };
  
  let filtered = allExpenses;
  
  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }
  
  if (startDate) {
    filtered = filtered.filter(e => e.expense_date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(e => e.expense_date <= endDate);
  }
  
  displayExpenses(filtered);
}

// Clear filters
function clearFilters() {
  const categoryFilter = document.getElementById('category-filter');
  const startDateFilter = document.getElementById('start-date-filter');
  const endDateFilter = document.getElementById('end-date-filter');
  
  if (categoryFilter) categoryFilter.value = '';
  if (startDateFilter) startDateFilter.value = '';
  if (endDateFilter) endDateFilter.value = '';
  
  currentFilters = {};
  displayExpenses(allExpenses);
}

// Edit expense (for history view)
async function editExpense(expenseId) {
  try {
    const response = await fetch(`/api/expenses/${expenseId}`);
    const expense = await response.json();
    
    if (!expense) {
      alert('Expense not found');
      return;
    }
    
    // For now, just reload expenses after edit
    // In a full implementation, you might want a modal
    loadExpenses();
  } catch (error) {
    console.error('Error loading expense:', error);
    alert('Error loading expense');
  }
}

// Delete expense (for history view)
async function deleteExpense(expenseId) {
  const confirmMessage = currentLanguage === 'ar'
    ? 'هل أنت متأكد من حذف هذا المصروف؟'
    : 'Are you sure you want to delete this expense?';
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      alert(data.error || 'Error deleting expense');
      return;
    }
    
    alert(currentLanguage === 'ar' ? 'تم حذف المصروف بنجاح' : 'Expense deleted successfully');
    loadExpenses();
    loadCategories();
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Error deleting expense');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize expenses table if on add tab
  const addTab = document.getElementById('add-tab');
  if (addTab && addTab.classList.contains('active')) {
    initTable();
  }
  
  // Load categories
  loadCategories();
  
  // Load expenses for history view
  loadExpenses();
  
  // Handle tab switching
  const historyTab = document.getElementById('history-tab');
  if (historyTab) {
    historyTab.addEventListener('shown.bs.tab', () => {
      loadExpenses();
    });
  }
  
  const addTabButton = document.getElementById('add-tab');
  if (addTabButton) {
    addTabButton.addEventListener('shown.bs.tab', () => {
      const container = document.getElementById('expenses-cards-container');
      if (container && container.children.length === 0) {
        initTable();
      }
    });
  }
});
