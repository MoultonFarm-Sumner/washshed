# Setting Up Local PostgreSQL for Farm Inventory App

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
```
brew install postgresql
brew services start postgresql
```

### Linux:
Ubuntu/Debian:
```
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create the Database

1. Open a terminal or command prompt
2. Navigate to this directory where the setup-database.sql file is located
3. Run the following command to create the database and tables:

```bash
psql -U postgres -f setup-database.sql
```

If prompted, enter the password you set during PostgreSQL installation.

## Step 3: Configure the Application

1. Copy the 'local.env' file to the root directory of the application and rename it to '.env'
2. If you've set a different password for your PostgreSQL user, update the DATABASE_URL and PGPASSWORD values in the .env file

## Step 4: Start the Application

Run the application with:

```bash
npm install
npm run dev
```

## Troubleshooting

- If you get connection errors, ensure PostgreSQL is running
- Check that your PostgreSQL username and password match what's in the .env file
- The default credentials are username 'postgres' and password 'postgres'
- Default login for the app is username: admin, password: farm123
