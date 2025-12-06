const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload Excel file and return preview
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath, { cellDates: false, cellNF: false, cellText: false });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel file has no sheets' });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Could not read worksheet' });
    }

    // Check if worksheet has a range (data)
    if (!worksheet['!ref']) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel worksheet appears to be empty. Please ensure your file contains data.' });
    }

    // Read ALL raw data as arrays (preserve all rows, including empty cells)
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false
    });

    if (!rawData || rawData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel file appears to be empty. Please check your file and make sure it contains data.' });
    }

    // Get the maximum number of columns to ensure consistent row length
    const maxCols = Math.max(...rawData.map(row => Array.isArray(row) ? row.length : 0));

    // Normalize all rows to have the same length (pad with empty strings)
    const normalizedData = rawData.map(row => {
      if (!Array.isArray(row)) return Array(maxCols).fill('');
      const normalized = [...row];
      while (normalized.length < maxCols) {
        normalized.push('');
      }
      return normalized;
    });

    // Generate column headers (use first row if it has text, otherwise use Column A, B, C...)
    const firstRow = normalizedData[0] || [];
    const hasTextHeaders = firstRow.some(cell => cell && String(cell).trim());

    let headers = [];
    let dataRows = [];

    if (hasTextHeaders && normalizedData.length > 1) {
      // First row is headers, rest is data
      headers = firstRow.map((cell, i) => {
        const cellStr = cell ? String(cell).trim() : '';
        return cellStr || `Column ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`;
      });
      dataRows = normalizedData.slice(1);
    } else {
      // No clear headers, use column letters and all rows as data
      headers = Array(maxCols).fill(0).map((_, i) =>
        `Column ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`
      );
      dataRows = normalizedData;
    }

    // Filter out completely empty data rows (rows where all cells are empty)
    const nonEmptyDataRows = dataRows.filter(row =>
      row.some(cell => cell !== null && cell !== '' && cell !== undefined)
    );

    if (nonEmptyDataRows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Excel file contains no data rows. Please add at least one row with product information.' });
    }

    // Create preview (first 10 rows of data)
    const preview = nonEmptyDataRows.slice(0, 10).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] != null ? row[i] : '';
      });
      return obj;
    });

    // Also return raw data for processing
    const rawRows = nonEmptyDataRows;

    res.json({
      filename: req.file.filename,
      headers: headers,
      preview: preview,
      rawRows: rawRows, // Include raw data for processing
      totalRows: nonEmptyDataRows.length,
      hasHeaders: hasTextHeaders
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Clean up on error
    }
    res.status(400).json({ error: error.message || 'Error processing Excel file' });
  }
});

// Process Excel file with column mapping
router.post('/process', (req, res) => {
  try {
    const { filename, mappings } = req.body;

    if (!filename || !mappings) {
      return res.status(400).json({ error: 'Missing filename or mappings' });
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Read and parse Excel file (same logic as upload)
    const workbook = XLSX.readFile(filePath, { cellDates: false, cellNF: false, cellText: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read raw data
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false
    });

    // Get max columns
    const maxCols = Math.max(...rawData.map(row => Array.isArray(row) ? row.length : 0));

    // Normalize rows
    const normalizedData = rawData.map(row => {
      if (!Array.isArray(row)) return Array(maxCols).fill('');
      const normalized = [...row];
      while (normalized.length < maxCols) {
        normalized.push('');
      }
      return normalized;
    });

    // Get headers and data rows
    const firstRow = normalizedData[0] || [];
    const hasTextHeaders = firstRow.some(cell => cell && String(cell).trim());

    let headers = [];
    let dataRows = [];

    if (hasTextHeaders && normalizedData.length > 1) {
      headers = firstRow.map((cell, i) => {
        const cellStr = cell ? String(cell).trim() : '';
        return cellStr || `Column ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`;
      });
      dataRows = normalizedData.slice(1);
    } else {
      headers = Array(maxCols).fill(0).map((_, i) =>
        `Column ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`
      );
      dataRows = normalizedData;
    }

    // Filter empty rows
    const nonEmptyDataRows = dataRows.filter(row =>
      row.some(cell => cell !== null && cell !== '' && cell !== undefined)
    );

    // Convert to objects using headers
    const data = nonEmptyDataRows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] != null ? row[i] : '';
      });
      return obj;
    });

    // Validate mappings
    const requiredMappings = ['name', 'purchase_price', 'quantity'];
    for (const field of requiredMappings) {
      if (!mappings[field]) {
        fs.unlinkSync(filePath); // Clean up
        return res.status(400).json({ error: `Missing required mapping: ${field}` });
      }
    }

    // Process each row
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = String(row[mappings.name] || '').trim();
        const purchasePrice = parseFloat(row[mappings.purchase_price]);
        const salePrice = mappings.sale_price ? parseFloat(row[mappings.sale_price]) : null;
        const quantity = parseInt(row[mappings.quantity]) || 0;

        // Validation
        if (!name) {
          results.errors.push(`Row ${i + 2}: Missing product name`);
          continue;
        }

        if (isNaN(purchasePrice) || purchasePrice < 0) {
          results.errors.push(`Row ${i + 2}: Invalid purchase price`);
          continue;
        }

        if (quantity < 0) {
          results.errors.push(`Row ${i + 2}: Invalid quantity`);
          continue;
        }

        // Create or update product (mark as imported)
        const result = db.createOrUpdateProduct({
          name,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          stock_quantity: quantity,
          is_imported: true
        });

        if (result.created) {
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    // Log import history
    db.logImport({
      filename: filename,
      total_rows: data.length,
      created_count: results.created,
      updated_count: results.updated,
      error_count: results.errors.length
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      ...results,
      message: `Imported ${results.created + results.updated} products (${results.created} created, ${results.updated} updated)`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

