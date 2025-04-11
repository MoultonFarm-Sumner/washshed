// Local development script with in-memory storage fallback
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import { MemStorage } from './server/storage.js';

// Handle ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Use memory storage instead of PostgreSQL
console.log('Using in-memory storage for local development');
global.storage = new MemStorage();

// Setup middleware
app.use(express.json());
app.use(cookieParser());

// Import and register routes with memory storage
import('./server/routes.js').then(({ registerRoutes }) => {
  registerRoutes(app).then(() => {
    console.log('Routes registered successfully');
    
    // Configure static file serving for the client build
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // All other GET requests not handled before will return the React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in local mode on port ${PORT}`);
      console.log(`👉 Open http://localhost:${PORT} in your browser`);
      console.log(`⚠️ Using in-memory storage - all data will be lost when server restarts`);
    });
  }).catch(err => {
    console.error('Failed to register routes:', err);
  });
}).catch(err => {
  console.error('Failed to import routes:', err);
});