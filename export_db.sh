#!/bin/bash

# Step 1: Install PostgreSQL client (only runs if not already installed)
if ! command -v pg_dump &> /dev/null
then
    echo "Installing PostgreSQL client..."
    apt update && apt install -y postgresql-client
else
    echo "PostgreSQL client already installed."
fi

# Step 2: Export the database
echo "Exporting database..."

PGPASSWORD='npg_ZFcQor34wdlt' pg_dump \
  -h ep-ancient-wave-a6bin94p.us-west-2.aws.neon.tech \
  -p 5432 \
  -U neondb_owner \
  -d neondb \
  -f export.sql

echo "✅ Done! Your database has been exported to export.sql"
