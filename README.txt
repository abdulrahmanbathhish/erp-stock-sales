==========================================
Stock & Sales Management Web App
==========================================

A simple, local-only web application for managing stock and sales.
Everything runs offline on your laptop - no internet required!


INSTALLATION
==========================================

1. Make sure you have Node.js installed on your computer.
   - Download from: https://nodejs.org/
   - Version 14 or higher recommended

2. Open a terminal/command prompt in this project folder.

3. Install dependencies by running:
   npm install

   This will install all required packages (Express, SQLite, etc.)


STARTING THE APPLICATION
==========================================

1. In the terminal, run:
   npm start

2. Open your web browser (Chrome recommended) and go to:
   http://localhost:3000

3. You should see the Dashboard page.

4. To stop the server, press Ctrl+C in the terminal.


ACCESSING FROM MOBILE DEVICES (LAN ACCESS)
==========================================

The server is configured to accept connections from other devices on your
local Wi-Fi network.

1. Make sure your phone/tablet is connected to the same Wi-Fi network
   as your computer.

2. When you start the server, it will display your local IP address
   in the console, for example:
     → http://192.168.1.10:3000

3. On your phone's browser, type the IP address shown in the console
   (e.g., http://192.168.1.10:3000)

4. The app will work exactly the same on your phone as on your computer!


FIREWALL SETTINGS (Windows)
==========================================

When you first run the server, Windows Firewall may ask for permission
to allow Node.js to accept network connections.

IMPORTANT: You must allow Node.js access to "Private networks" for
LAN access to work. This allows devices on your Wi-Fi to connect.

- Click "Allow access" when prompted
- Make sure "Private networks" is checked
- You can leave "Public networks" unchecked for security

If you accidentally denied access:
1. Go to Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" and check "Private" network access


DATA STORAGE
==========================================

All your data is stored locally in a SQLite database file:
  ./data/database.sqlite

This file contains:
  - All your products (names, prices, stock quantities)
  - All your sales records (dates, quantities, profits)

IMPORTANT: This database file is your data! Make sure to back it up regularly.


MOVING TO ANOTHER LAPTOP
==========================================

To copy this app to another laptop:

1. Copy the ENTIRE project folder to the other laptop.
   Make sure to include:
   - All files and folders
   - The ./data/database.sqlite file (if it exists)
   - The ./uploads folder (if it exists)

2. On the new laptop:
   - Install Node.js (if not already installed)
   - Open terminal in the project folder
   - Run: npm install
   - Run: npm start
   - Open http://localhost:3000 in your browser

That's it! Your data will be exactly the same because the database
file is included in the folder.


USAGE
==========================================

DASHBOARD (Home Page)
  - View profit statistics (today, this week, this month)
  - See total sales count
  - View latest sales
  - Check low stock alerts
  - See top selling products

SALES PAGE
  - Search for a product by name
  - Select a product to see its details
  - Enter quantity and sale price
  - Confirm sale (stock is automatically updated)
  - View latest sales at the bottom

IMPORT PAGE
  - Upload an Excel file (.xlsx or .xls) with your products
  - Map columns: which column is the product name, purchase price, etc.
  - Preview the data
  - Confirm import to create/update products and set initial stock


EXCEL IMPORT FORMAT
==========================================

Your Excel file should have columns for:
  - Product Name (required)
  - Purchase Price (required)
  - Sale Price (optional)
  - Stock Quantity (required)

The column names don't matter - you'll map them during import.
The system will:
  - Create new products if they don't exist
  - Update existing products if they have the same name
  - Set the stock quantity from your Excel file


TROUBLESHOOTING
==========================================

Problem: "npm: command not found"
Solution: Install Node.js from https://nodejs.org/

Problem: "Port 3000 already in use"
Solution: Another application is using port 3000. Close it or
          change the port in server.js (line with PORT = 3000)

Problem: Database errors
Solution: Make sure the ./data folder exists and is writable.
          Delete database.sqlite if corrupted (you'll lose data).

Problem: Excel import not working
Solution: Make sure your Excel file is .xlsx or .xls format.
          Check that all required columns are mapped correctly.


TECHNICAL DETAILS
==========================================

- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- Frontend: HTML + Bootstrap 5 + JavaScript
- Port: 3000 (default)
- Database location: ./data/database.sqlite
- Uploads location: ./uploads/ (temporary, cleaned after import)


SUPPORT
==========================================

This is a local-only application. All data stays on your computer.
No data is sent to the internet.

For issues or questions, check the code comments or modify
the application as needed for your use case.

