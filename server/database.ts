import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle ORM instance with the connection pool and schema
export const db = drizzle({ client: pool, schema });

// Function to initialize the database by creating tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create products table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        field_location TEXT NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        production_notes TEXT,
        retail_notes TEXT,
        image_url TEXT,
        date_added TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create inventory_history table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        change INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        updated_by TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create field_locations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS field_locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    
    // Insert default field locations if they don't exist
    const defaultLocations = [
      'North Field',
      'South Field',
      'East Greenhouse',
      'West Greenhouse',
      'Hoop House'
    ];
    
    for (const location of defaultLocations) {
      await pool.query(
        'INSERT INTO field_locations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [location]
      );
    }
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}