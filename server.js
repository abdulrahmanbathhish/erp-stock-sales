const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const importRouter = require('./routes/import');
const historyRouter = require('./routes/history');
const expensesRouter = require('./routes/expenses');
const adminRouter = require('./routes/admin');
const customersRouter = require('./routes/customers');
const returnsRouter = require('./routes/returns');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces for LAN access

// Middleware
// Configure CORS to allow all origins (for LAN access)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to get local IP addresses (Windows-compatible)
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      // Handle both 'IPv4' and 4 (Windows uses numeric family)
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  // Prioritize Ethernet/Wi-Fi adapters on Windows
  // Filter out virtual adapters and prefer real network interfaces
  const preferredNames = ['Ethernet', 'Wi-Fi', 'Wireless', 'Local Area Connection'];
  const preferred = addresses.filter((addr, idx) => {
    const ifaceName = Object.keys(interfaces).find(name => 
      interfaces[name].some(i => 
        (i.family === 'IPv4' || i.family === 4) && 
        !i.internal && 
        i.address === addr
      )
    );
    return preferredNames.some(p => ifaceName && ifaceName.includes(p));
  });
  
  return preferred.length > 0 ? preferred : addresses;
}

// Root route - MUST be before static middleware to prevent index.html from being served
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// API endpoint to get server IP for LAN access info
app.get('/api/server-info', (req, res) => {
  const localIPs = getLocalIPs();
  res.json({
    localIPs: localIPs,
    port: PORT,
    urls: localIPs.map(ip => `http://${ip}:${PORT}`)
  });
});

// API routes
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/import', importRouter);
app.use('/api/history', historyRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/export', exportRouter);

// Serve static files from public directory (after routes to avoid index.html auto-serving)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Start server
app.listen(PORT, HOST, () => {
  const localIPs = getLocalIPs();
  const isWindows = os.platform() === 'win32';
  const primaryIP = localIPs.length > 0 ? localIPs[0] : null;
  
  console.log('\n' + '='.repeat(60));
  console.log('  ERP STOCK & SALES MANAGEMENT SYSTEM');
  console.log('  Server is Running Successfully!');
  console.log('='.repeat(60));
  console.log(`\n📱 LOCAL ACCESS:`);
  console.log(`   http://localhost:${PORT}`);
  
  if (primaryIP) {
    console.log(`\n🌐 NETWORK ACCESS (Wi-Fi Clients):`);
    localIPs.forEach((ip, idx) => {
      const marker = idx === 0 ? ' ⭐ PRIMARY' : '';
      console.log(`   http://${ip}:${PORT}${marker}`);
    });
    
    console.log(`\n📲 TO CONNECT FROM OTHER DEVICES:`);
    console.log(`   1. Make sure the device is on the same Wi-Fi network`);
    console.log(`   2. Open any web browser (Chrome, Safari, etc.)`);
    console.log(`   3. Enter this address: http://${primaryIP}:${PORT}`);
    console.log(`\n   ⚠️  Windows Firewall: If connection fails, allow Node.js`);
    console.log(`      through Windows Firewall when prompted.`);
  } else {
    console.log(`\n⚠️  WARNING: Could not detect network IP address.`);
    console.log(`   The server is running, but other devices may not connect.`);
    console.log(`   Check:`);
    console.log(`   - Your Wi-Fi/Ethernet connection is active`);
    console.log(`   - Windows Firewall allows Node.js`);
    if (isWindows) {
      console.log(`   - Run as Administrator if needed`);
    }
  }
  
  console.log(`\n💾 Database: ${path.join(__dirname, 'data', 'database.sqlite')}`);
  console.log(`🖥️  Platform: ${os.platform()} ${os.arch()}`);
  console.log('='.repeat(60));
  console.log(`\n✅ Server ready! Press Ctrl+C to stop.\n`);
});

