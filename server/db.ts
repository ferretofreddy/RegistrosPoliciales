import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema'; // <--- CORREGIDO

const isProduction = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });