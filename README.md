# ERP Stock & Sales Management System

A simple, local-only web application for managing stock and sales.
Runs on your Windows laptop and accessible from any device on the same Wi-Fi network.

## Quick Start (Windows)

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Version 18 or higher recommended
   - Install with default settings

2. **Copy the project folder** to your Windows laptop

3. **Run the startup script**
   - Double-click `start.bat`
   - The script will automatically:
     - Install dependencies (first time only)
     - Start the server
   - Wait for the message: "Server ready!"

4. **Access the app**
   - On the laptop: http://localhost:3000
   - On other devices: http://YOUR_LAPTOP_IP:3000 (see below)

## Getting Your Local IP Address (Windows)

### Method 1: Using Command Prompt
1. Press `Win + R`, type `cmd`, press Enter
2. Type: `ipconfig`
3. Look for **"IPv4 Address"** under your Wi-Fi adapter
4. Example: `192.168.1.10`

### Method 2: Using PowerShell
1. Press `Win + X`, select "Windows PowerShell"
2. Type: `ipconfig | findstr IPv4`
3. Look for your IP address (usually starts with 192.168.x.x)

### Method 3: Check Server Console
- When you start the server, it will display your IP address automatically
- Look for: `🌐 NETWORK ACCESS (Wi-Fi Clients):`
- Example: `http://192.168.1.10:3000 ⭐ PRIMARY`

## Accessing from Other Devices

1. **Make sure devices are on the same Wi-Fi network**
   - Phone, tablet, or another computer must be on the same Wi-Fi as your laptop

2. **Open a web browser** on the device (Chrome, Safari, Edge, etc.)

3. **Enter the IP address** shown in the server console:
   ```
   http://192.168.1.10:3000
   ```
   (Replace with your actual IP address)

4. **The app will work exactly the same** on all devices!

## Windows Firewall

When you first run the server, Windows Firewall may ask for permission:

1. **Click "Allow access"** when prompted
2. Make sure **"Private networks"** is checked
3. You can leave "Public networks" unchecked for security

If you accidentally denied access:
1. Go to: Windows Settings → Privacy & Security → Windows Security → Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" and check "Private" network access

## Keeping the Server Running (PM2)

To keep the server running even after closing the command window:

### Install PM2
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

### Start Server with PM2
```cmd
pm2 start server.js --name erp-server
pm2 save
pm2 startup
```

### Useful PM2 Commands
```cmd
pm2 list              # View running processes
pm2 logs erp-server   # View server logs
pm2 stop erp-server   # Stop the server
pm2 restart erp-server # Restart the server
pm2 delete erp-server # Remove from PM2
```

### Auto-start on Windows Boot
After running `pm2 startup`, PM2 will automatically start your server when Windows boots.

## Data Storage

All your data is stored locally in:
```
data/database.sqlite
```

**Important:** This file contains all your:
- Products (names, prices, stock quantities)
- Sales records (dates, quantities, profits)
- Customers
- Expenses

**Backup regularly!** Copy the `data` folder to a safe location.

## Troubleshooting

### "Node.js is not installed"
- Install Node.js from https://nodejs.org/
- Restart your computer after installation
- Run `start.bat` again

### "Port 3000 already in use"
- Another application is using port 3000
- Close other applications or change the port in `server.js`:
  ```javascript
  const PORT = process.env.PORT || 3001; // Change to 3001
  ```

### "Cannot connect from other devices"
- Make sure both devices are on the same Wi-Fi network
- Check Windows Firewall settings (see above)
- Verify the IP address is correct
- Try disabling Windows Firewall temporarily to test

### "Database errors"
- Make sure the `data` folder exists
- Check file permissions (should be writable)
- Delete `database.sqlite` if corrupted (you'll lose data)

## Project Structure

```
erp-stock-sales/
├── data/
│   └── database.sqlite    # Your data (backup this!)
├── public/                # Frontend files (HTML, CSS, JS)
├── routes/                # API routes
├── server.js              # Main server file
├── database.js            # Database operations
├── start.bat              # Windows startup script
└── package.json           # Dependencies
```

## Features

- ✅ **Stock Management** - Add, edit, search products
- ✅ **Sales Tracking** - Record sales, track profits
- ✅ **Customer Management** - Track customers and credit sales
- ✅ **Expense Tracking** - Record business expenses
- ✅ **Real-time Updates** - Changes appear instantly on all devices
- ✅ **Excel Import/Export** - Import products, export reports
- ✅ **Multi-device Access** - Use on phone, tablet, laptop simultaneously

## Support

This is a local-only application. All data stays on your computer.
No data is sent to the internet.

For issues, check the server console for error messages.

