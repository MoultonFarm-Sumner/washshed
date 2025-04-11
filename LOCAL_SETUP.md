# Farm Inventory App - Local Setup with PostgreSQL

This guide will help you set up and run the Farm Inventory app with a **local PostgreSQL database**.

## Quick Start

### Prerequisites

- [PostgreSQL](https://www.postgresql.org/download/) installed on your local machine
- [Node.js](https://nodejs.org/) (version 16 or higher)

### Setup Process

1. **Clone or download this repository**

2. **Set up the local database:**
   - Navigate to the `local-setup` directory
   - For Windows:
     - Double-click `setup-local-db.bat`
   - For Mac/Linux:
     - Make the script executable: `chmod +x setup-local-db.sh`
     - Run: `./setup-local-db.sh`

3. **Configure the application:**
   - Copy `local-setup/local.env` to the root directory and rename it to `.env`
   - If you customized your PostgreSQL credentials, update the values in the `.env` file

4. **Install dependencies and start the app:**
   ```bash
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and go to: http://localhost:3000
   - Login with default credentials:
     - Username: admin
     - Password: farm123

## Manual Database Setup

If the setup script doesn't work for you, follow these steps to set up the database manually:

1. **Create a new PostgreSQL database:**
   ```sql
   CREATE DATABASE farminventory;
   ```

2. **Run the SQL setup script:**
   ```bash
   psql -U postgres -d farminventory -f local-setup/setup-database.sql
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/farminventory
   PGUSER=postgres
   PGPASSWORD=postgres
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=farminventory
   ```

## Detailed Instructions

For more detailed instructions, see:
- `local-setup/LOCAL_DB_SETUP.md` for PostgreSQL installation and setup details
- For troubleshooting database connection issues, check that your PostgreSQL service is running

## Application Features

The Farm Inventory app includes:
- Product inventory management
- Inventory history tracking
- Field location management
- Stock level monitoring
- Harvest recording
- Reporting and analytics

## Data Structure

The local database includes these tables:
- `products`: Farm product inventory items
- `inventory_history`: Record of all inventory changes
- `field_locations`: Farm field location definitions
- `site_auth`: Authentication credentials
- `settings`: Application settings and preferences

## Support

If you need assistance, please refer to the detailed documentation in the 
`local-setup` directory or reach out to the system administrator.