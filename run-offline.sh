#!/bin/bash

echo "=== Farm Inventory App - Local Database Mode ==="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL is not installed or not in your PATH."
    echo "The app will fall back to in-memory storage."
    echo ""
    echo "To install PostgreSQL and use a local database:"
    echo "1. Follow instructions in LOCAL_SETUP.md"
    echo "2. Run setup-local-db.sh in the local-setup directory"
    echo ""
else
    echo "✅ PostgreSQL detected"
    
    # Check if farminventory database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw farminventory; then
        echo "✅ Found farminventory database"
    else
        echo "⚠️ Database 'farminventory' not found."
        echo "Would you like to set it up now? (y/n)"
        read -r answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            echo "Setting up database..."
            cd local-setup && ./setup-local-db.sh && cd ..
        else
            echo "Continuing without local database. Using in-memory storage."
        fi
    fi
fi

# Set up environment variables for local database
if [ -f .env ]; then
    echo "Using existing .env file"
else
    if [ -f local-setup/local.env ]; then
        echo "Copying local database configuration..."
        cp local-setup/local.env .env
        echo "✅ Created .env file with local database configuration"
    else
        echo "⚠️ No database configuration found."
        echo "The app will use in-memory storage."
    fi
fi

# Start the app
echo ""
echo "Starting Farm Inventory App..."
echo "Press Ctrl+C to stop"
echo ""

npm run dev