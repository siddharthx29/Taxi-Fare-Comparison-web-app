import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/ridecompare';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false
});

export let isFallbackMode = false;

// Retry database connection on initial load
export async function connectWithRetry(retries = 3, delay = 2000): Promise<Pool | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database!');
      client.release();
      isFallbackMode = false;
      return pool;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.warn('⚠️ WARNING: Failed to connect to PostgreSQL database. Switching to InMemory Fallback Mode for Searches & Analytics.');
  isFallbackMode = true;
  return null;
}

