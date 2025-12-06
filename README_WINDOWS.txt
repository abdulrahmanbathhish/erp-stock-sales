================================================================================
  ERP STOCK & SALES MANAGEMENT SYSTEM
  Windows Installation & Usage Guide
================================================================================

QUICK START (First Time Setup)
================================================================================

1. INSTALL NODE.JS (if not already installed)
   - Go to: https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer
   - Restart your computer after installation

2. RUN SETUP
   - Double-click: SETUP.bat
   - Wait for installation to complete (2-5 minutes)
   - The server will start automatically

3. START THE SERVER (Every Time You Want to Use the System)
   - Double-click: START_SERVER.bat
   - A window will open showing the server status
   - Keep this window open while using the system

4. ACCESS THE SYSTEM
   - On this computer: http://localhost:3000
   - On other devices (same Wi-Fi): Use the IP address shown in the server window
     Example: http://192.168.1.100:3000


CONNECTING FROM OTHER DEVICES (Phones, Tablets, Other Computers)
================================================================================

1. Make sure the Windows computer is running the server (START_SERVER.bat)

2. Make sure your device is connected to the SAME Wi-Fi network

3. Look at the server window on Windows - it will show an IP address like:
   http://192.168.1.100:3000

4. On your phone/tablet/other device:
   - Open any web browser (Chrome, Safari, Firefox, etc.)
   - Type the IP address shown in the server window
   - Press Enter

5. The ERP system will load on your device!


WINDOWS FIREWALL
================================================================================

When you first run the server, Windows may ask:
  "Do you want to allow this app through Windows Firewall?"

Click: "Allow access" or "Yes"

This allows other devices on your Wi-Fi to connect to the server.

If you accidentally clicked "Block":
  1. Open Windows Defender Firewall
  2. Click "Allow an app through firewall"
  3. Find "Node.js" in the list
  4. Check the box for "Private" networks
  5. Click OK


TROUBLESHOOTING
================================================================================

Problem: "Node.js is not installed"
Solution: Install Node.js from https://nodejs.org/ and restart your computer

Problem: "Cannot connect from other devices"
Solutions:
  - Make sure both devices are on the same Wi-Fi network
  - Check Windows Firewall settings (see above)
  - Make sure the server window is still open on Windows
  - Try restarting the server (close and reopen START_SERVER.bat)

Problem: "Port 3000 is already in use"
Solution: Close any other applications using port 3000, or restart your computer

Problem: "Dependencies not installed"
Solution: Run SETUP.bat again


DATA STORAGE
================================================================================

All your data is stored in:
  .\data\database.sqlite

This file contains:
  - All products (names, prices, stock)
  - All sales records
  - All customer information
  - All expenses

IMPORTANT: Back up this file regularly!

To back up:
  - Copy the entire "data" folder
  - Store it in a safe place (USB drive, cloud storage, etc.)


MOVING TO ANOTHER COMPUTER
================================================================================

1. Copy the ENTIRE project folder to the new computer
   (including the "data" folder with database.sqlite)

2. On the new computer:
   - Install Node.js (if not already installed)
   - Run SETUP.bat
   - Run START_SERVER.bat

Your data will be exactly the same!


STOPPING THE SERVER
================================================================================

To stop the server:
  - Click in the server window
  - Press Ctrl+C
  - Press Y and Enter to confirm

Or simply close the window.


SUPPORT
================================================================================

For issues or questions, check:
  - The server window for error messages
  - Windows Firewall settings
  - Network connectivity

The system is designed to work completely offline - no internet required
after initial setup (except for downloading Node.js).


================================================================================
  Enjoy using your ERP System!
================================================================================

