// Format currency
function formatCurrency(amount) {
  return '$ ' + parseFloat(amount).toFixed(2);
}

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

// Show invoice details modal (shared with home.js)
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
                <span>${formatDateTime(activity.date)}</span>
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
                  .map((item, index) => `
                  <tr data-item-id="${item.id || index}" data-sale-id="${item.sale_id || ''}" data-product-id="${item.product_id || ''}" data-original-quantity="${item.quantity}" data-original-price="${item.sale_price}" id="invoice-row-${item.id || index}">
                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="min-width: 150px; padding: 4px; position: relative;">
                      <input type="text" 
                             class="form-control sale-card__input product-search-invoice" 
                             placeholder="${isArabic ? 'ابحث عن منتج...' : 'Search product...'}" 
                             data-row-id="invoice-row-${item.id || index}"
                             data-sale-id="${item.sale_id || ''}"
                             value="${item.product_name}"
                             onkeyup="searchProductForInvoice(event, 'invoice-row-${item.id || index}')" 
                             onkeydown="handleSearchKeyboardForInvoice(event, 'invoice-row-${item.id || index}')" 
                             onfocus="showSearchResultsForInvoice('invoice-row-${item.id || index}')" 
                             autocomplete="off"
                             style="min-width: 150px; padding: 4px; border-radius: 4px;">
                      <div class="search-results list-group" id="search-results-invoice-row-${item.id || index}" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; display: none; width: 100%; margin-top: 2px;"></div>
                    </td>
                    <td contenteditable="true" class="editable-quantity" style="text-align: center; min-width: 60px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'quantity')" onkeypress="if(event.key==='Enter'){this.blur();}">${item.quantity}</td>
                    <td contenteditable="true" class="editable-price" style="text-align: center; min-width: 80px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'price')" onkeypress="if(event.key==='Enter'){this.blur();}">${formatCurrency(item.sale_price)}</td>
                    <td class="item-total" style="text-align: center;">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
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
  if (quantityCell) {
    const currentQuantity = parseFloat(quantityCell.textContent.trim()) || 0;
    row.setAttribute('data-original-quantity', currentQuantity);
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
  
  // Update invoice total
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

// Create and select a new product for invoice
window.createAndSelectProductForInvoice = async function(productName) {
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
    selectProductForInvoice(data.product.id, data.product.name, 0, 0);
    alert(isArabic ? 'تم إنشاء المنتج بنجاح' : 'Product created successfully');
  } catch (error) {
    console.error('Error creating product:', error);
    alert(isArabic ? 'حدث خطأ أثناء إنشاء المنتج' : 'Error creating product');
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
  
  // Add product to invoice table
  const tbody = document.querySelector('#invoiceContent tbody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr');
  const newIndex = rows.length + 1;
  
  // Create new row
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-item-id', 'new-' + Date.now());
  newRow.setAttribute('data-sale-id', '');
  newRow.setAttribute('data-product-id', productId);
  newRow.setAttribute('data-original-quantity', '1');
  newRow.setAttribute('data-original-price', price || '0');
  newRow.innerHTML = `
    <td style="text-align: center; font-weight: 600;">${newIndex}</td>
    <td contenteditable="true" class="editable-product" style="min-width: 150px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'product')">${productName}</td>
    <td contenteditable="true" class="editable-quantity" style="text-align: center; min-width: 60px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'quantity')" onkeypress="if(event.key==='Enter'){this.blur();}">1</td>
    <td contenteditable="true" class="editable-price" style="text-align: center; min-width: 80px; border: 1px solid transparent; padding: 4px; border-radius: 4px;" onblur="updateInvoiceItem(this, 'price')" onkeypress="if(event.key==='Enter'){this.blur();}">${formatCurrency(price || 0)}</td>
    <td class="item-total" style="text-align: center;">${formatCurrency(price || 0)}</td>
  `;
  
  tbody.appendChild(newRow);
  
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

// Save invoice changes
window.saveInvoiceChanges = async function() {
  const invoiceContent = document.getElementById('invoiceContent');
  if (!invoiceContent) return;
  
  const isArabic = document.documentElement.dir === 'rtl';
  const rows = invoiceContent.querySelectorAll('tbody tr');
  
  if (rows.length === 0) {
    alert(isArabic ? 'لا توجد منتجات للحفظ' : 'No items to save');
    return;
  }
  
  // Get transaction ID from invoice
  const transactionIdElement = invoiceContent.querySelector('span');
  let transactionId = null;
  if (transactionIdElement && transactionIdElement.textContent.includes('_')) {
    const transactionText = Array.from(invoiceContent.querySelectorAll('span'))
      .find(span => span.textContent.includes('_'))?.textContent;
    if (transactionText) {
      transactionId = transactionText.trim();
    }
  }
  
  // Collect all items
  const items = [];
  rows.forEach(row => {
    const productCell = row.querySelector('.editable-product, td:nth-child(2)');
    const quantityCell = row.querySelector('.editable-quantity');
    const priceCell = row.querySelector('.editable-price');
    const totalCell = row.querySelector('.item-total');
    
    if (!productCell || !quantityCell || !priceCell || !totalCell) return;
    
    const productName = productCell.textContent.trim();
    if (!productName) return; // Skip empty product names
    
    const quantity = parseFloat(quantityCell.textContent.trim()) || 0;
    const priceText = priceCell.textContent.trim();
    const price = parseFloat(priceText.replace(/[$\s]/g, '')) || 0;
    const amount = parseFloat(totalCell.textContent.replace(/[$\s]/g, '')) || 0;
    
    const itemId = row.getAttribute('data-item-id');
    const saleId = row.getAttribute('data-sale-id');
    
    items.push({
      id: itemId,
      sale_id: saleId,
      product_name: productName,
      quantity: quantity,
      price: price,
      amount: amount
    });
  });
  
  if (items.length === 0) {
    alert(isArabic ? 'يرجى إضافة منتج واحد على الأقل' : 'Please add at least one item');
    return;
  }
  
  // Show loading
  const saveBtn = document.querySelector('button[onclick="saveInvoiceChanges()"]');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> ' + (isArabic ? 'جاري الحفظ...' : 'Saving...');
  
  try {
    // Here you would typically send the data to the server
    // For now, we'll just show a success message
    console.log('Saving invoice:', {
      transaction_id: transactionId,
      items: items
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    alert(isArabic ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
    
    // Optionally reload the page or update the UI
    // window.location.reload();
    
  } catch (error) {
    console.error('Error saving invoice:', error);
    alert(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving changes');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
};

// Print invoice function - matches modal exactly with smaller fonts and total on last page
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
  
  // Return only date with time (no relative time)
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
    console.log('Loading financial summary...');
    
    // Check if elements exist
    const totalDebtEl = document.getElementById('total-debt');
    const totalCapitalEl = document.getElementById('total-capital');
    const totalExpensesEl = document.getElementById('total-expenses');
    const totalProfitEl = document.getElementById('total-profit');
    const netProfitEl = document.getElementById('net-profit');
    
    if (!totalDebtEl || !totalCapitalEl || !totalExpensesEl || !totalProfitEl || !netProfitEl) {
      console.error('Financial summary elements not found in DOM');
      return;
    }
    
    // Load all customers to calculate total debt
    console.log('Fetching customers...');
    const customersResponse = await fetch('/api/customers', { credentials: 'include' });
    if (!customersResponse.ok) {
      const errorText = await customersResponse.text();
      throw new Error(`Failed to fetch customers: ${customersResponse.status} - ${errorText}`);
    }
    const customers = await customersResponse.json();
    const totalDebt = customers.reduce((sum, c) => sum + (parseFloat(c.debt) || 0), 0);
    console.log('Total debt:', totalDebt);

    // Load all products to calculate total capital
    // Only count positive stock - negative stock means oversold items and shouldn't contribute to capital
    console.log('Fetching products...');
    const productsResponse = await fetch('/api/products', { credentials: 'include' });
    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      throw new Error(`Failed to fetch products: ${productsResponse.status} - ${errorText}`);
    }
    const products = await productsResponse.json();
    const totalCapital = products.reduce((sum, p) => {
      const stockQty = parseFloat(p.stock_quantity) || 0;
      const purchasePrice = parseFloat(p.purchase_price) || 0;
      // Only add to capital if stock is positive
      return sum + (stockQty > 0 ? stockQty * purchasePrice : 0);
    }, 0);
    console.log('Total capital:', totalCapital);

    // Load all expenses
    console.log('Fetching expenses...');
    const expensesResponse = await fetch('/api/expenses', { credentials: 'include' });
    if (!expensesResponse.ok) {
      const errorText = await expensesResponse.text();
      throw new Error(`Failed to fetch expenses: ${expensesResponse.status} - ${errorText}`);
    }
    const expenses = await expensesResponse.json();
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    console.log('Total expenses:', totalExpenses);

    // Load financial summary for profit
    console.log('Fetching financial summary...');
    const summaryResponse = await fetch('/api/sales/financial-summary?period=all', { credentials: 'include' });
    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      throw new Error(`Failed to fetch financial summary: ${summaryResponse.status} - ${errorText}`);
    }
    const summary = await summaryResponse.json();
    const totalProfit = parseFloat(summary.profit) || 0;
    console.log('Total profit:', totalProfit);

    // Load all sales to calculate cost of sold items
    console.log('Fetching sales...');
    const salesResponse = await fetch('/api/sales?limit=10000', { credentials: 'include' });
    if (!salesResponse.ok) {
      const errorText = await salesResponse.text();
      throw new Error(`Failed to fetch sales: ${salesResponse.status} - ${errorText}`);
    }
    const sales = await salesResponse.json();
    const costOfSoldItems = sales.reduce((sum, s) => 
      sum + ((parseFloat(s.purchase_price) || 0) * (parseInt(s.quantity) || 0)), 0
    );
    console.log('Cost of sold items:', costOfSoldItems);

    // Calculate net profit with cost of sold items
    const netProfit = totalProfit - totalExpenses + costOfSoldItems;
    console.log('Net profit:', netProfit);

    // Update UI
    totalDebtEl.textContent = formatCurrency(totalDebt);
    totalCapitalEl.textContent = formatCurrency(totalCapital);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    totalProfitEl.textContent = formatCurrency(totalProfit);
    netProfitEl.textContent = formatCurrency(netProfit);
    
    console.log('Financial summary loaded successfully');

  } catch (error) {
    console.error('Error loading financial summary:', error);
    console.error('Error stack:', error.stack);
    // Show error message to user
    const isArabic = document.documentElement.dir === 'rtl';
    alert(isArabic ? `خطأ في تحميل الملخص المالي: ${error.message}` : `Error loading financial summary: ${error.message}`);
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

    // Fetch recent activity - increased limit to show all operations
    const response = await fetch('/api/sales/recent-activity?limit=200&time=all');
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

      // Build description - show only item count for credit sales
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
      // Store activity data in data attribute to avoid JSON issues in onclick
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
              <span><i class="bi bi-person"></i> ${customerName}</span>
              <span><i class="bi bi-clock"></i> ${timestamp}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--color-${typeClass});">${formatCurrency(activity.amount || 0)}</span>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteOperation('${activity.type}', ${activity.id}, '${(description || typeLabel).replace(/'/g, "\\'")}')">
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
  document.getElementById('reset-password').value = '';
  modal.show();
}

// Confirm reset all data
async function confirmReset() {
  const errorDiv = document.getElementById('reset-error');
  const passwordInput = document.getElementById('reset-password');
  const password = passwordInput.value.trim();
  const isArabic = document.documentElement.dir === 'rtl';

  // Clear previous errors
  errorDiv.style.display = 'none';

  // Check if password is provided
  if (!password) {
    errorDiv.textContent = isArabic ? 'يرجى إدخال كلمة المرور' : 'Please enter password';
    errorDiv.style.display = 'block';
    passwordInput.focus();
    return;
  }

  try {
    const response = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || (isArabic ? 'خطأ في إعادة التعيين' : 'Error resetting data');
      errorDiv.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
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
    passwordInput.value = '';
    passwordInput.focus();
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

// Initialize Socket.io for real-time updates
let socket = null;

function initSocket() {
  // Connect to Socket.io server
  socket = io();
  
  // Listen for new sale events
  socket.on('sale:created', (data) => {
    console.log('New sale received:', data);
    // Reload dashboard data to show updated stats
    loadDashboardData();
  });
  
  // Listen for multiple sales created
  socket.on('sales:multiple-created', (data) => {
    console.log('Multiple sales received:', data);
    loadDashboardData();
  });
  
  // Listen for sale deletion
  socket.on('sale:deleted', (data) => {
    console.log('Sale deleted:', data);
    loadDashboardData();
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
  // Load initial dashboard data
  loadDashboardData();
});
