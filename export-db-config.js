// Export database configuration for local use
import { writeFileSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Found DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Show URL with password hidden

// Create a simpler approach - write the complete connection string
let localEnvContent = `
# Database configuration for local development
DATABASE_URL=${dbUrl}
`;

// Try to extract parts of the connection string if possible
try {
  // Support both postgres:// and postgresql:// formats, including query parameters
  let connectionRegex = /(?:postgres|postgresql):\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)(?:\?.*)?/;
  let matches = dbUrl.match(connectionRegex);
  
  if (matches) {
    let [, user, password, host, port, database] = matches;
    // Default port to 5432 if not specified
    port = port || '5432';
    console.log(`Extracted database info: ${user}@${host}:${port}/${database}`);
    
    // Add individual parameters to env file
    localEnvContent += `
PGUSER=${user}
PGPASSWORD=${password}
PGHOST=${host}
PGPORT=${port}
PGDATABASE=${database}
`;

    // Create a format that can be used with the psql command line tool
    const pgpassContent = `${host}:${port}:${database}:${user}:${password}`;
    writeFileSync(path.join(__dirname, '.pgpass'), pgpassContent);
    console.log('Created .pgpass file for command line tools');
  } else {
    console.log('Could not parse individual connection parameters from DATABASE_URL');
    console.log('Only the full connection string will be available in local.env');
  }
} catch (error) {
  console.error('Error parsing connection string:', error.message);
}

// Write local env file
writeFileSync(path.join(__dirname, 'local.env'), localEnvContent);
console.log('Created local.env file with database configuration');

// Create a fallback script for offline development
const localDevScriptContent = `
# Run this script to start the app with in-memory storage
# This is useful for offline development
node dev-local.js
`;

writeFileSync(path.join(__dirname, 'run-offline.sh'), localDevScriptContent);
console.log('Created run-offline.sh script for offline development');

console.log('\n===== LOCAL SETUP INSTRUCTIONS =====');
console.log('To use this app locally with the database:');
console.log('1. Copy local.env to .env in your local project');
console.log('2. npm install');
console.log('3. npm run dev');
console.log('\nFor offline development without a database:');
console.log('1. npm install');
console.log('2. node dev-local.js');