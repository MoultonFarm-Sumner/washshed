// Simple standalone server for Farm Inventory
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 3000;

console.log('Starting standalone Farm Inventory server...');
console.log(`Current directory: ${process.cwd()}`);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/farminventory'
});

// Create Express app
const app = express();
app.use(express.json());

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
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Farm Inventory - Standalone Server</title>
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
      <h1>Farm Inventory - Standalone Server</h1>
      <p>This is a simple API server for the Farm Inventory system.</p>
      
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Farm Inventory standalone server running at http://localhost:${PORT}`);
  console.log(`Test the database connection at http://localhost:${PORT}/api/test`);
});