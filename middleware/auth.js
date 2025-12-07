// Simple authentication middleware using cookies
const APP_PASSWORD = '7831158';

// Parse cookies from request
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  return cookies;
}

// Check if user is authenticated
function requireAuth(req, res, next) {
  // Allow login page and login API, static assets
  const allowedPaths = [
    '/login.html',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/server-info'
  ];
  
  const isAllowed = allowedPaths.includes(req.path) || 
                    req.path.startsWith('/css/') || 
                    req.path.startsWith('/js/') || 
                    req.path.startsWith('/images/') || 
                    req.path.startsWith('/fonts/') ||
                    req.path.endsWith('.css') ||
                    req.path.endsWith('.js') ||
                    req.path.endsWith('.png') ||
                    req.path.endsWith('.jpg') ||
                    req.path.endsWith('.jpeg') ||
                    req.path.endsWith('.gif') ||
                    req.path.endsWith('.svg') ||
                    req.path.endsWith('.ico') ||
                    req.path.endsWith('.woff') ||
                    req.path.endsWith('.woff2') ||
                    req.path.endsWith('.ttf');

  if (isAllowed) {
    return next();
  }

  // Parse cookies manually
  const cookies = parseCookies(req.headers.cookie);
  const authCookie = cookies.authenticated;
  
  if (authCookie === 'true') {
    return next();
  }

  // If requesting API, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }

  // Otherwise redirect to login
  res.redirect('/login.html');
}

// Login handler
function handleLogin(req, res) {
  const { password } = req.body;

  if (password === APP_PASSWORD) {
    // Set authentication cookie manually (expires in 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const expires = new Date(Date.now() + maxAge).toUTCString();
    res.setHeader('Set-Cookie', `authenticated=true; Expires=${expires}; Path=/; HttpOnly; SameSite=Lax`);
    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ error: 'Incorrect password' });
}

// Logout handler
function handleLogout(req, res) {
  // Clear authentication cookie manually
  res.setHeader('Set-Cookie', 'authenticated=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax');
  return res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = {
  requireAuth,
  handleLogin,
  handleLogout,
  APP_PASSWORD
};

