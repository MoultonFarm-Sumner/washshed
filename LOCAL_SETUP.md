# Running the Farm Inventory App Locally

This guide will help you run the Farm Inventory Management System on your local machine while connecting to the same database used in the Replit environment.

## Prerequisites

- Node.js v18+ installed on your machine
- Git installed on your machine
- Basic knowledge of terminal/command line

## Setup Steps

### 1. Export Database Configuration

First, run the export script to extract database credentials for local use:

```bash
# In the Replit environment
node export-db-config.js
```

This will create two files:
- `local.env`: Contains the database environment variables
- `.pgpass`: Can be used with psql command-line tool

### 2. Clone the Repository Locally

```bash
git clone <your-repository-url> farm-inventory
cd farm-inventory
```

### 3. Set Up Local Environment

Copy the generated `local.env` file from Replit to your local project and rename it to `.env`:

```bash
# Copy the content from local.env in Replit to .env in your local project
```

### 4. Install Dependencies

```bash
npm install
# Make sure you have these specific packages for database connectivity
npm install @neondatabase/serverless ws
```

### 5. Initialize Database (if needed)

If the database schema needs to be updated (only needed once):

```bash
npm run db:push
```

### 6. Start the Application

```bash
npm run dev
```

The application should now be running locally at http://localhost:3000

## Troubleshooting Database Errors

If you encounter database connection errors:

1. **Check Environment Variables**: Make sure your `.env` file contains the correct `DATABASE_URL`.

2. **Network Access**: Ensure your IP address has been added to the allowed list in the Neon database dashboard.

3. **Direct Connection Test**: Test direct connection to the database:

   ```bash
   # Using the values from your .env file
   psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
   ```

4. **Alternative Configuration**: If direct connection doesn't work, you might need to create a local PostgreSQL database and export/import the data.

## Important Notes

- This setup connects to the same cloud database as the Replit environment. Changes made locally will affect the live data.
- For development purposes, consider creating a separate database instance.
- Remember that the database credentials are sensitive. Don't share the `.env` or `.pgpass` files.