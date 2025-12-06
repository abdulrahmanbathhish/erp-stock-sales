// Navigate to home page (no password required - it's the default entry point)
function navigateToHome() {
  window.location.href = 'home.html';
}

// Navigate to dashboard (make sure it's available globally)
// Only define if not already defined (to avoid conflicts)
if (typeof window.navigateToDashboard === 'undefined') {
  window.navigateToDashboard = function () {
    console.log('navigateToDashboard called from navigation.js');
    window.location.href = 'index.html';
  };
}

// Check if user has dashboard access (for showing/hiding admin navigation)
function hasDashboardAccess() {
  return sessionStorage.getItem('dashboard_authenticated') === 'true';
}

// Show/hide admin navigation based on authentication
function updateNavigationVisibility() {
  const isAuthenticated = hasDashboardAccess();
  const adminNavItems = document.querySelectorAll('.admin-nav-item');

  adminNavItems.forEach(item => {
    // Hide import link unless on dashboard page (index.html)
    const isImportLink = item.getAttribute('href') && item.getAttribute('href').includes('import.html');
    const isDashboard = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    if (isImportLink && !isDashboard) {
      item.style.display = 'none';
      return;
    }
    if (isAuthenticated) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

