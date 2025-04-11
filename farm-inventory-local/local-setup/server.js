// Smart local server script that tries to connect to the remote database
// and falls back to in-memory storage if that fails
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { PgStorage, MemStorage } from '../server/storage.js';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon database with WebSocket support
global.WebSocket = ws;

// Load environment variables from .env file
config();

// Handle ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Setup middleware
app.use(express.json());
app.use(cookieParser());

// Attempt to connect to the database
async function setupStorage() {
  if (process.env.DATABASE_URL) {
    try {
      console.log('Trying to connect to remote PostgreSQL database...');
      
      // Try to connect to the database
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ Successfully connected to PostgreSQL database');
      global.storage = new PgStorage();
      return true;
      
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL database:', err.message);
      console.log('Falling back to in-memory storage...');
    }
  } else {
    console.log('No DATABASE_URL found in environment variables');
    console.log('Using in-memory storage...');
  }
  
  // Use memory storage if database connection fails or no DATABASE_URL
  global.storage = new MemStorage();
  return false;
}

// Start the server
async function startServer() {
  // Setup storage
  const usingDatabase = await setupStorage();
  
  // Import and register routes
  import('../server/routes.js').then(({ registerRoutes }) => {
    registerRoutes(app).then(() => {
      console.log('Routes registered successfully');
      
      // Configure static file serving for the client build
      app.use(express.static(path.join(__dirname, '../dist')));
      
      // All other GET requests not handled before will return the React app
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
      });
      
      // Start the server
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Farm Inventory App running on port ${PORT}`);
        console.log(`👉 Open http://localhost:${PORT} in your browser`);
        
        if (!usingDatabase) {
          console.log(`⚠️ Using in-memory storage - all data will be lost when server restarts`);
        }
      });
    }).catch(err => {
      console.error('Failed to register routes:', err);
    });
  }).catch(err => {
    console.error('Failed to import routes:', err);
  });
}

startServer();