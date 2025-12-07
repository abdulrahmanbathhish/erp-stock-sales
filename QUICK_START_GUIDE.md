# ERP App - Quick Start Guide

## ✅ Setup Complete!

Your ERP app has been configured to:
1. ✅ Restart automatically (kills old instances and starts fresh)
2. ✅ Run on Windows startup (starts when you restart your laptop)
3. ✅ Be accessible to all WiFi users on your network

## 🚀 How to Use

### Start/Restart the App Now
- **Double-click:** `RESTART_APP.bat`
- This will stop any running instances and start the server fresh

### Access the App

Once the server is running, you can access it from:

**On This Computer:**
- http://localhost:3000

**From Other Devices (WiFi Users):**
- http://[YOUR-IP]:3000
- The IP address will be shown when the server starts
- Common IPs: `192.168.1.xxx` or `192.168.0.xxx`

### Automatic Startup

The app is now configured to start automatically when you restart your laptop. It will:
- Wait 10 seconds for the system to boot
- Check for Node.js and dependencies
- Start the server in the background
- Log activity to `startup.log`

## 📝 Files Created

- `RESTART_APP.bat` - Restart the server (stops old, starts new)
- `RESTART_APP.ps1` - PowerShell version of restart script
- `START_ON_BOOT.bat` - Script that runs on Windows startup
- `ADD_TO_STARTUP_COMPLETE.bat` - Adds app to Windows startup
- `REMOVE_FROM_STARTUP.bat` - Removes app from Windows startup

## 🔧 Troubleshooting

### Server Not Starting?
1. Check if Node.js is installed: Open PowerShell and type `node --version`
2. Check the `startup.log` file for errors
3. Make sure port 3000 is not being used by another app

### Can't Access from Other Devices?
1. Make sure all devices are on the same WiFi network
2. Check Windows Firewall - it may ask to allow Node.js through
3. Verify the server is running by checking `startup.log`

### Remove from Startup
- Run `REMOVE_FROM_STARTUP.bat`
- Or manually: Press `Win+R`, type `shell:startup`, delete `ERP_Stock_Sales.lnk`

## 📱 Network Access

The server is configured to listen on all network interfaces (`0.0.0.0`), which means:
- ✅ Accessible from localhost (this computer)
- ✅ Accessible from other devices on the same WiFi network
- ✅ Accessible from other devices on the same Ethernet network

## 🔒 Security Note

The app is configured for local network access only. Make sure:
- Your WiFi network is secure (password protected)
- Only trusted devices are on your network
- Windows Firewall is enabled

---

**Need Help?** Check the `startup.log` file for detailed information about server activity.

