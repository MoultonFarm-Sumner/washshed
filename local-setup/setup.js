// Local development setup script for farm inventory app
import { spawn } from 'child_process';
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_CONFIG = {
  DATABASE_URL: 'postgresql://neondb_owner:npg_ZFcQor34wdlt@ep-ancient-wave-a6bin94p.us-west-2.aws.neon.tech/neondb?sslmode=require',
  PGUSER: 'neondb_owner',
  PGPASSWORD: 'npg_ZFcQor34wdlt',
  PGHOST: 'ep-ancient-wave-a6bin94p.us-west-2.aws.neon.tech',
  PGPORT: '5432',
  PGDATABASE: 'neondb'
};

// Create .env file
function createEnvFile() {
  const envContent = Object.entries(DB_CONFIG)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  writeFileSync(join(__dirname, '.env'), envContent);
  console.log('✅ Created .env file with database configuration');
}

// Create a script to run the app with memory storage
function createOfflineMode() {
  const scriptContent = `
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import { MemStorage } from '../server/storage.js';

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
      console.log(\`🚀 Server running in local mode on port \${PORT}\`);
      console.log(\`👉 Open http://localhost:\${PORT} in your browser\`);
      console.log(\`⚠️ Using in-memory storage - all data will be lost when server restarts\`);
    });
  }).catch(err => {
    console.error('Failed to register routes:', err);
  });
}).catch(err => {
  console.error('Failed to import routes:', err);
});
`;
  
  writeFileSync(join(__dirname, 'offline-mode.js'), scriptContent);
  console.log('✅ Created offline-mode.js for local development without database');
}

// Create a README file
function createReadme() {
  const readmeContent = `# Farm Inventory App - Local Setup

This directory contains tools to run the Farm Inventory app locally in two modes:

## Mode 1: With Remote Database Connection

This mode connects to the same Neon PostgreSQL database as the Replit environment.

1. Copy the \`.env\` file from this directory to the root directory of the project
2. Install dependencies: \`npm install\`
3. Start the app: \`npm run dev\`

## Mode 2: Offline Mode (No Database)

This mode uses in-memory storage and requires no external database.

1. Install dependencies: \`npm install\`
2. Run the offline mode: \`node local-setup/offline-mode.js\`

## Troubleshooting Database Issues

If you encounter database connection errors:

1. Make sure your IP address is allowed to connect to the Neon database
2. Check if the database credentials are still valid
3. Try the offline mode for development without database access

## Important Notes

- The remote database connection uses real data. Changes made are permanent.
- In offline mode, data is stored in memory and will be lost when the server restarts.
`;
  
  writeFileSync(join(__dirname, 'README.md'), readmeContent);
  console.log('✅ Created README.md with setup instructions');
}

// Create a shell script to run the app in offline mode
function createShellScripts() {
  const bashScript = `#!/bin/bash
echo "Starting Farm Inventory App in offline mode..."
node local-setup/offline-mode.js
`;
  
  const batchScript = `@echo off
echo Starting Farm Inventory App in offline mode...
node local-setup\\offline-mode.js
`;
  
  writeFileSync(join(__dirname, 'run-offline.sh'), bashScript);
  writeFileSync(join(__dirname, 'run-offline.bat'), batchScript);
  console.log('✅ Created shell scripts for running in offline mode');
}

// Main function
function setup() {
  console.log('Setting up local development environment...');
  
  createEnvFile();
  createOfflineMode();
  createReadme();
  createShellScripts();
  
  console.log('\n===== SETUP COMPLETE =====');
  console.log('To run with database connection:');
  console.log('1. Copy .env to the project root');
  console.log('2. npm install');
  console.log('3. npm run dev');
  console.log('\nTo run in offline mode (no database):');
  console.log('1. npm install');
  console.log('2. node local-setup/offline-mode.js');
}

// Run setup
setup();