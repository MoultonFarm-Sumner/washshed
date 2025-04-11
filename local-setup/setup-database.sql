-- PostgreSQL setup script for Farm Inventory App
-- Run this script with: psql -f setup-database.sql

-- Create database if it doesn't exist
CREATE DATABASE farminventory;

-- Connect to the database
\c farminventory

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
