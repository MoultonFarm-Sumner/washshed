// Script to set up farm inventory app with a local PostgreSQL database
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create local database .env file
const createLocalEnvFile = () => {
  const envContent = `# Local PostgreSQL database configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/farminventory
PGUSER=postgres
PGPASSWORD=postgres
PGHOST=localhost
PGPORT=5432
PGDATABASE=farminventory
`;

  writeFileSync(join(__dirname, 'local.env'), envContent);
  console.log('✅ Created local.env file with local database configuration');
};

// Create a setup SQL file for the local database
const createDatabaseSetupFile = () => {
  const sqlContent = `-- PostgreSQL setup script for Farm Inventory App
-- Run this script with: psql -f setup-database.sql

-- Create database if it doesn't exist
CREATE DATABASE farminventory;

-- Connect to the database
\\c farminventory

-- Create tables
CREATE TABLE IF NOT EXISTS site_auth (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  field_location TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT,
  crop_needs TEXT,
  stand_inventory TEXT,
  wash_inventory TEXT,
  harvest_bins TEXT,
  units_harvested TEXT,
  field_notes TEXT,
  retail_notes TEXT,
  date_added TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  field_location TEXT NOT NULL,
  previous_stock INTEGER NOT NULL,
  change INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit TEXT,
  updated_by TEXT NOT NULL DEFAULT 'system',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add sample data
INSERT INTO field_locations (name) VALUES 
  ('Field A'),
  ('Field B'),
  ('Greenhouse'),
  ('Hoop House');

-- Set default password (farm123)
INSERT INTO site_auth (password_hash) VALUES
  ('f311e3573d8dd45de2bda0086f065c8c71b7cdf7ef240d640016563fab13c580');

-- Add sample products
INSERT INTO products (name, field_location, current_stock, min_stock, unit) VALUES
  ('Tomatoes', 'Field A', 50, 10, 'lb'),
  ('Lettuce', 'Greenhouse', 30, 5, 'head'),
  ('Carrots', 'Field B', 100, 20, 'bunch'),
  ('Spinach', 'Hoop House', 25, 5, 'lb');

-- Add sample inventory history
INSERT INTO inventory_history (product_id, product_name, field_location, previous_stock, change, new_stock, unit, updated_by) VALUES
  (1, 'Tomatoes', 'Field A', 0, 50, 50, 'lb', 'system'),
  (2, 'Lettuce', 'Greenhouse', 0, 30, 30, 'head', 'system'),
  (3, 'Carrots', 'Field B', 0, 100, 100, 'bunch', 'system'),
  (4, 'Spinach', 'Hoop House', 0, 25, 25, 'lb', 'system');

-- Create row ordering setting
INSERT INTO settings (key, value) VALUES
  ('row_order', '[1, 2, 3, 4]');
`;

  writeFileSync(join(__dirname, 'setup-database.sql'), sqlContent);
  console.log('✅ Created setup-database.sql for local PostgreSQL setup');
};

// Create instructions file for setting up local database
const createInstructions = () => {
  const instructionsContent = `# Setting Up Local PostgreSQL for Farm Inventory App

This guide will help you set up a local PostgreSQL database for the Farm Inventory app.

## Prerequisites

- [PostgreSQL](https://www.postgresql.org/download/) installed on your machine
- Basic knowledge of PostgreSQL commands

## Step 1: Install PostgreSQL (if not already installed)

### Windows:
1. Download the installer from [PostgreSQL website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the installation wizard
3. Remember the password you set for the postgres user
4. Add PostgreSQL bin directory to your PATH (the installer typically offers to do this)

### Mac:
Using Homebrew:
\`\`\`
brew install postgresql
brew services start postgresql
\`\`\`

### Linux:
Ubuntu/Debian:
\`\`\`
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

## Step 2: Create the Database

1. Open a terminal or command prompt
2. Navigate to this directory where the setup-database.sql file is located
3. Run the following command to create the database and tables:

\`\`\`bash
psql -U postgres -f setup-database.sql
\`\`\`

If prompted, enter the password you set during PostgreSQL installation.

## Step 3: Configure the Application

1. Copy the 'local.env' file to the root directory of the application and rename it to '.env'
2. If you've set a different password for your PostgreSQL user, update the DATABASE_URL and PGPASSWORD values in the .env file

## Step 4: Start the Application

Run the application with:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Troubleshooting

- If you get connection errors, ensure PostgreSQL is running
- Check that your PostgreSQL username and password match what's in the .env file
- The default credentials are username 'postgres' and password 'postgres'
- Default login for the app is username: admin, password: farm123
`;

  writeFileSync(join(__dirname, 'LOCAL_DB_SETUP.md'), instructionsContent);
  console.log('✅ Created LOCAL_DB_SETUP.md with detailed instructions');
};

// Create a shell script to help set up the local database
const createSetupScript = () => {
  const bashScript = `#!/bin/bash
echo "=== Farm Inventory App Local Database Setup ==="
echo "This script will help you set up a local PostgreSQL database."
echo "Make sure PostgreSQL is installed and running on your machine."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL command line tool (psql) not found."
    echo "Please install PostgreSQL first and make sure it's in your PATH."
    echo "See LOCAL_DB_SETUP.md for instructions."
    exit 1
fi

echo "Setting up local database..."
echo "You may be prompted for your PostgreSQL password."

# Run the SQL script
psql -U postgres -f setup-database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo "1. Copy 'local.env' to the root directory as '.env'"
    echo "2. Run 'npm install' if you haven't already"
    echo "3. Start the app with 'npm run dev'"
    echo ""
    echo "Default login: admin / farm123"
else
    echo ""
    echo "❌ Database setup failed. See error messages above."
    echo "Check LOCAL_DB_SETUP.md for manual setup instructions."
fi
`;

  writeFileSync(join(__dirname, 'setup-local-db.sh'), bashScript);
  console.log('✅ Created setup-local-db.sh script');

  // Windows batch script
  const batchScript = `@echo off
echo === Farm Inventory App Local Database Setup ===
echo This script will help you set up a local PostgreSQL database.
echo Make sure PostgreSQL is installed and running on your machine.
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL command line tool (psql) not found.
    echo Please install PostgreSQL first and make sure it's in your PATH.
    echo See LOCAL_DB_SETUP.md for instructions.
    exit /b 1
)

echo Setting up local database...
echo You may be prompted for your PostgreSQL password.

REM Run the SQL script
psql -U postgres -f setup-database.sql

if %ERRORLEVEL% equ 0 (
    echo.
    echo Database setup complete!
    echo 1. Copy 'local.env' to the root directory as '.env'
    echo 2. Run 'npm install' if you haven't already
    echo 3. Start the app with 'npm run dev'
    echo.
    echo Default login: admin / farm123
) else (
    echo.
    echo Database setup failed. See error messages above.
    echo Check LOCAL_DB_SETUP.md for manual setup instructions.
)

pause
`;

  writeFileSync(join(__dirname, 'setup-local-db.bat'), batchScript);
  console.log('✅ Created setup-local-db.bat script for Windows');
};

// Run the script
(function main() {
  console.log('Creating local database setup files...');
  
  createLocalEnvFile();
  createDatabaseSetupFile();
  createInstructions();
  createSetupScript();
  
  console.log('\n===== LOCAL DATABASE SETUP COMPLETE =====');
  console.log('Follow the instructions in LOCAL_DB_SETUP.md to set up your local PostgreSQL database');
})();