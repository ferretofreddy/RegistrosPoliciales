import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema';

const isProduction = process.env.NODE_ENV === 'production';

// Se añade 'export' para que otros archivos lo puedan usar.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

// Se exporta la instancia de Drizzle para usarla en todo el proyecto.
export const db = drizzle(pool, { schema });