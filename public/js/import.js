let uploadedFile = null;
let fileData = null;

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
  
  // Auto-dismiss after 10 seconds for success, keep error visible
  if (type === 'success') {
    setTimeout(() => {
      alert.remove();
    }, 10000);
  }
}

// Upload file
async function uploadFile(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('excel-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showAlert('Please select a file', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    showAlert('Uploading file...', 'info');
    
    const response = await fetch('/api/import/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error uploading file', 'danger');
      return;
    }

    uploadedFile = data.filename;
    fileData = data;
    
    // Populate column mapping dropdowns
    populateColumnMappings(data.headers);
    
    // Show preview
    showPreview(data.preview);
    
    // Show mapping section
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('mapping-section').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
    
    const previewInfo = data.preview.length < data.totalRows 
      ? `Showing first ${data.preview.length} of ${data.totalRows} rows`
      : `Showing all ${data.totalRows} rows`;
    
    showAlert(`File uploaded successfully. ${previewInfo}. Please map the columns below.`, 'success');
  } catch (error) {
    console.error('Error uploading file:', error);
    showAlert('Error uploading file', 'danger');
  }
}

// Populate column mapping dropdowns
function populateColumnMappings(headers) {
  const selects = ['map-name', 'map-purchase-price', 'map-sale-price', 'map-quantity'];
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Add header options
    headers.forEach(header => {
      const option = document.createElement('option');
      option.value = header;
      option.textContent = header;
      select.appendChild(option);
    });
  });
}

// Show preview table
function showPreview(preview) {
  if (!preview || preview.length === 0) return;
  
  const table = document.getElementById('preview-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  
  // Get headers from first row
  const headers = Object.keys(preview[0]);
  
  // Create header row with row number
  thead.innerHTML = '<tr><th style="width: 50px;">Row</th>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
  
  // Create data rows with row numbers (starting from 2, since row 1 is headers)
  tbody.innerHTML = preview.map((row, index) => 
    '<tr><td class="text-muted"><strong>' + (index + 2) + '</strong></td>' + 
    headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? row[h] : ''}</td>`).join('') + 
    '</tr>'
  ).join('');
  
  // Make table scrollable if many columns
  table.style.minWidth = '100%';
}

// Confirm import
async function confirmImport() {
  if (!uploadedFile) {
    showAlert('Please upload a file first', 'warning');
    return;
  }

  // Get mappings
  const mappings = {
    name: document.getElementById('map-name').value,
    purchase_price: document.getElementById('map-purchase-price').value,
    sale_price: document.getElementById('map-sale-price').value || null,
    quantity: document.getElementById('map-quantity').value
  };

  // Validate required mappings
  if (!mappings.name || !mappings.purchase_price || !mappings.quantity) {
    showAlert('Please map all required columns (Name, Purchase Price, Quantity)', 'warning');
    return;
  }

  try {
    showAlert('Processing import...', 'info');
    
    const response = await fetch('/api/import/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: uploadedFile,
        mappings: mappings
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.error || 'Error processing import', 'danger');
      return;
    }

    // Show results
    showResults(data);
    
    showAlert(data.message || 'Import completed successfully!', 'success');
    
    // Notify dashboard to refresh if it's open
    if (window.opener) {
      window.opener.postMessage('refresh-dashboard', '*');
    }
    
    // Reset after 3 seconds and redirect to dashboard
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  } catch (error) {
    console.error('Error processing import:', error);
    showAlert('Error processing import', 'danger');
  }
}

// Show import results
function showResults(results) {
  const resultsSection = document.getElementById('results-section');
  const resultsContent = document.getElementById('results-content');
  
  let html = `
    <p><strong>Created:</strong> ${results.created} products</p>
    <p><strong>Updated:</strong> ${results.updated} products</p>
  `;
  
  if (results.errors && results.errors.length > 0) {
    html += `
      <div class="alert alert-warning mt-3">
        <strong>Errors:</strong>
        <ul class="mb-0">
          ${results.errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  resultsContent.innerHTML = html;
  resultsSection.style.display = 'block';
}

// Reset import
function resetImport() {
  uploadedFile = null;
  fileData = null;
  document.getElementById('upload-form').reset();
  document.getElementById('upload-section').style.display = 'block';
  document.getElementById('mapping-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('alert-container').innerHTML = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('upload-form').addEventListener('submit', uploadFile);
  document.getElementById('confirm-import').addEventListener('click', confirmImport);
});

