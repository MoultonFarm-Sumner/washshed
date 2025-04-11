// Script to prepare a local export package with database credentials
import { writeFileSync, copyFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { execSync } from 'child_process';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Create export directory
const EXPORT_DIR = join(__dirname, '..', 'farm-inventory-local');
if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

// Create local-setup directory in export
const LOCAL_SETUP_DIR = join(EXPORT_DIR, 'local-setup');
if (!existsSync(LOCAL_SETUP_DIR)) {
  mkdirSync(LOCAL_SETUP_DIR, { recursive: true });
}

// Copy local-setup files to export directory
const filesToCopy = [
  'server.js',
  'start.bat',
  'start.sh',
  'README.md',
  'local-db-setup.js',
  'setup-database.sql',
  'LOCAL_DB_SETUP.md',
  'setup-local-db.sh',
  'setup-local-db.bat',
  'local.env'
];

filesToCopy.forEach(file => {
  try {
    copyFileSync(
      join(__dirname, file), 
      join(LOCAL_SETUP_DIR, file)
    );
    console.log(`✅ Copied ${file} to export package`);
  } catch (err) {
    console.error(`❌ Failed to copy ${file}: ${err.message}`);
  }
});

// Create .env file with database credentials
try {
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl) {
    const envContent = `# Database configuration for local development\nDATABASE_URL=${dbUrl}\n`;
    writeFileSync(join(EXPORT_DIR, '.env'), envContent);
    console.log('✅ Created .env file with database credentials');
  } else {
    console.error('❌ DATABASE_URL environment variable not found');
  }
} catch (err) {
  console.error(`❌ Failed to create .env file: ${err.message}`);
}

// Create package.json with minimal dependencies
const packageJson = {
  "name": "farm-inventory-local",
  "version": "1.0.0",
  "type": "module",
  "description": "Farm Inventory Management System - Local Version",
  "scripts": {
    "start": "node local-setup/server.js",
    "dev": "node local-setup/server.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "cookie-parser": "^1.4.7",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.39.1",
    "express": "^4.21.2",
    "ws": "^8.18.0",
    "zod": "^3.23.8"
  }
};

try {
  writeFileSync(
    join(EXPORT_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log('✅ Created package.json with minimal dependencies');
} catch (err) {
  console.error(`❌ Failed to create package.json: ${err.message}`);
}

// Create a README file for the export package
const readmeContent = `# Farm Inventory App - Local Version

This package contains everything you need to run the Farm Inventory Management System on your local machine.

## Quick Start

### Windows Users
1. Double-click the \`local-setup/start.bat\` file
2. The app will automatically install dependencies and start
3. Open your browser and go to http://localhost:3000

### Mac/Linux Users
1. Open terminal in this directory
2. Run \`chmod +x local-setup/start.sh\` to make the script executable
3. Run \`./local-setup/start.sh\`
4. Open your browser and go to http://localhost:3000

## What's Included

- Smart server with database connection handling
- Automatic fallback to in-memory storage if database connection fails
- Complete application with all features
- Minimal dependencies for quick setup

For more detailed information, see the README.md file in the local-setup directory.

## License

This project is licensed under the MIT License.
`;

try {
  writeFileSync(join(EXPORT_DIR, 'README.md'), readmeContent);
  console.log('✅ Created README.md for the export package');
} catch (err) {
  console.error(`❌ Failed to create README.md: ${err.message}`);
}

// Create a .gitignore file
const gitignoreContent = `node_modules/
.DS_Store
*.log
`;

try {
  writeFileSync(join(EXPORT_DIR, '.gitignore'), gitignoreContent);
  console.log('✅ Created .gitignore file');
} catch (err) {
  console.error(`❌ Failed to create .gitignore: ${err.message}`);
}

console.log('\n===== EXPORT PACKAGE CREATED =====');
console.log(`Location: ${EXPORT_DIR}`);
console.log('This package contains everything needed to run the app locally');
console.log('You can zip this directory and share it with others');

// Try to create a ZIP file if zip command is available
try {
  const zipName = 'farm-inventory-local.zip';
  console.log(`\nAttempting to create ${zipName}...`);
  
  execSync(`cd "${dirname(EXPORT_DIR)}" && zip -r ${zipName} "${EXPORT_DIR.split('/').pop()}"`);
  console.log(`✅ Created ${zipName} in the parent directory`);
  console.log(`You can download this file to run the app locally`);
} catch (err) {
  console.log(`Could not create ZIP file automatically: ${err.message}`);
  console.log('Please manually zip the export directory to share it');
}