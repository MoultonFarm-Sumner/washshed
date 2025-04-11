#!/bin/bash
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
