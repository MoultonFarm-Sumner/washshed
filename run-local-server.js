// CommonJS version of the local server
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 3000;

console.log('Starting local Farm Inventory server...');
console.log(`Current directory: ${process.cwd()}`);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/farminventory'
});

// Create Express app
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Middleware to check auth
const requireAuth = (req, res, next) => {
  // For local testing, we don't enforce authentication
  // But in a real deployment you'd want to check auth tokens
  next();
};

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful!',
      time: result.rows[0].now,
      status: 'ok'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      message: 'Database connection error',
      error: error.message,
      status: 'error'
    });
  }
});

// API Routes
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { name, description, fieldLocation, currentStock, unit, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, description, field_location, current_stock, unit, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, fieldLocation, currentStock, unit, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, fieldLocation, currentStock, unit, notes } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, field_location = $3, current_stock = $4, unit = $5, notes = $6 WHERE id = $7 RETURNING *',
      [name, description, fieldLocation, currentStock, unit, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory/adjust', requireAuth, async (req, res) => {
  try {
    const { productId, adjustmentAmount, adjustmentType, notes } = req.body;
    
    // First get the current product
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult.rows[0];
    let newStock = product.current_stock || 0;
    
    // Adjust stock based on type
    if (adjustmentType === 'add') {
      newStock += Number(adjustmentAmount);
    } else if (adjustmentType === 'remove') {
      newStock -= Number(adjustmentAmount);
    } else if (adjustmentType === 'set') {
      newStock = Number(adjustmentAmount);
    }
    
    // Update product stock
    await pool.query(
      'UPDATE products SET current_stock = $1 WHERE id = $2',
      [newStock, productId]
    );
    
    // Record in history
    const historyResult = await pool.query(
      'INSERT INTO inventory_history (product_id, adjustment_type, adjustment_amount, notes, timestamp) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [productId, adjustmentType, adjustmentAmount, notes]
    );
    
    res.json({
      success: true,
      product: { ...product, current_stock: newStock },
      history: historyResult.rows[0]
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventory/history', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, p.name as product_name 
      FROM inventory_history h
      JOIN products p ON h.product_id = p.id
      ORDER BY h.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/field-locations', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM field_locations ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching field locations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/field-locations', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO field_locations (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating field location:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/field-locations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM field_locations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field location not found' });
    }
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    console.error('Error deleting field location:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings/:key', requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.json({ key, value: null });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', requireAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    // Check if the setting already exists
    const existingResult = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    
    if (existingResult.rows.length > 0) {
      // Update existing setting
      const result = await pool.query(
        'UPDATE settings SET value = $1 WHERE key = $2 RETURNING *',
        [value, key]
      );
      res.json(result.rows[0]);
    } else {
      // Create new setting
      const result = await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *',
        [key, value]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // In a real app, you'd hash the password and check against the database
    // For local development, we'll just accept 'farm123' as the password
    if (password === 'farm123') {
      res.json({ 
        success: true, 
        message: 'Logged in successfully'
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/check', (req, res) => {
  // For local development, we'll just say authentication is always successful
  res.json({ 
    isProtected: true,
    isAuthenticated: true,
    message: 'Authenticated'
  });
});

// Serve the built React app (if it exists)
const CLIENT_BUILD_PATH = path.join(__dirname, './client/dist');
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  console.log(`Serving static files from ${CLIENT_BUILD_PATH}`);
  app.use(express.static(CLIENT_BUILD_PATH));
  
  // For any other request, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
  });
} else {
  console.log(`Static build not found at ${CLIENT_BUILD_PATH}`);
  console.log('Serving API endpoints only');
  
  // Serve a simple HTML page for testing
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Farm Inventory - API Only Mode</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
          .success { color: green; }
          .error { color: red; }
          button { padding: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; }
          #products { margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Farm Inventory - API Only Mode</h1>
        <p>The React frontend is not available. This server is running in API-only mode.</p>
        
        <div class="card">
          <h2>Database Connection Test</h2>
          <button id="testDb">Test Database Connection</button>
          <div id="result"></div>
        </div>
        
        <div class="card">
          <h2>Products</h2>
          <button id="loadProducts">Load Products</button>
          <div id="products"></div>
        </div>
        
        <script>
          document.getElementById('testDb').addEventListener('click', async () => {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Testing connection...';
            
            try {
              const response = await fetch('/api/test');
              const data = await response.json();
              
              if (data.status === 'ok') {
                resultDiv.innerHTML = '<p class="success">✅ ' + data.message + '</p>' +
                  '<p>Server time: ' + data.time + '</p>';
              } else {
                resultDiv.innerHTML = '<p class="error">❌ ' + data.message + '</p>' +
                  '<p>' + data.error + '</p>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<p class="error">❌ Error: ' + error.message + '</p>';
            }
          });
          
          document.getElementById('loadProducts').addEventListener('click', async () => {
            const productsDiv = document.getElementById('products');
            productsDiv.innerHTML = 'Loading products...';
            
            try {
              const response = await fetch('/api/products');
              const products = await response.json();
              
              if (products.length === 0) {
                productsDiv.innerHTML = '<p>No products found in database.</p>';
                return;
              }
              
              let tableHtml = '<table><tr><th>ID</th><th>Name</th><th>Field Location</th><th>Stock</th><th>Unit</th></tr>';
              products.forEach(product => {
                tableHtml += '<tr>' +
                  '<td>' + product.id + '</td>' +
                  '<td>' + product.name + '</td>' +
                  '<td>' + (product.field_location || product.fieldlocation || '') + '</td>' +
                  '<td>' + (product.current_stock || product.currentstock || 0) + '</td>' +
                  '<td>' + (product.unit || '') + '</td>' +
                '</tr>';
              });
              tableHtml += '</table>';
              
              productsDiv.innerHTML = tableHtml;
            } catch (error) {
              productsDiv.innerHTML = '<p class="error">❌ Error: ' + error.message + '</p>';
            }
          });
        </script>
      </body>
      </html>
    `);
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Farm Inventory server running at http://localhost:${PORT}`);
  console.log(`Test the database connection at http://localhost:${PORT}/api/test`);
});