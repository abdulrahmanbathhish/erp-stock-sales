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

// Load import history
async function loadImportHistory() {
  try {
    const response = await fetch('/api/history/imports?limit=50');
    const history = await response.json();
    const tbody = document.getElementById('import-history');
    
    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No import history</td></tr>';
      return;
    }

    tbody.innerHTML = history.map(importItem => `
      <tr>
        <td>${formatDate(importItem.created_at)}</td>
        <td>${importItem.filename}</td>
        <td>${importItem.total_rows}</td>
        <td class="text-success">${importItem.created_count}</td>
        <td class="text-info">${importItem.updated_count}</td>
        <td class="text-danger">${importItem.error_count}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading import history:', error);
    document.getElementById('import-history').innerHTML = 
      '<tr><td colspan="6" class="text-center text-danger">Error loading import history</td></tr>';
  }
}

// Load deletion log
async function loadDeletionLog() {
  try {
    const response = await fetch('/api/history/deletions?limit=50');
    const log = await response.json();
    const tbody = document.getElementById('deletion-log');
    
    if (log.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No deletions recorded</td></tr>';
      return;
    }

    tbody.innerHTML = log.map(deletion => `
      <tr>
        <td>${formatDate(deletion.created_at)}</td>
        <td><span class="badge bg-danger">${deletion.entity_type}</span></td>
        <td>${deletion.entity_name || 'N/A'}</td>
        <td>${deletion.details || 'N/A'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading deletion log:', error);
    document.getElementById('deletion-log').innerHTML = 
      '<tr><td colspan="4" class="text-center text-danger">Error loading deletion log</td></tr>';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadImportHistory();
  loadDeletionLog();
});

