import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

// Detecta si estás en el entorno de producción (Heroku)
const isProduction = process.env.NODE_ENV === 'production';

// Crea el pool de conexiones usando el driver 'pg'
const pool = new pg.Pool({
  // Heroku proveerá esta variable de entorno automáticamente
  connectionString: process.env.DATABASE_URL,
  // SSL es requerido para conexiones en Heroku, pero puede causar errores en desarrollo local
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

// Crea la instancia de Drizzle usando el pool
export const db = drizzle(pool, { schema });
