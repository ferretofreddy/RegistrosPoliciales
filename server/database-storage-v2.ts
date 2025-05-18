import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Verificar que existe la URL de la base de datos
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL debe estar definida");
}

// Conexión a la base de datos
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Método simple para obtener relaciones entre personas, inmuebles y ubicaciones
export async function getRelacionesPersonaInmueble(personaId: number) {
  try {
    // Buscar inmuebles relacionados con la persona
    console.log(`Buscando inmuebles para persona ID ${personaId}`);
    const inmuebleResult = await db.execute(
      sql`SELECT i.* FROM inmuebles i
          JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
          WHERE pi.persona_id = ${personaId}`
    );
    
    const inmuebles = inmuebleResult.rows || [];
    console.log(`Encontrados ${inmuebles.length} inmuebles relacionados`);

    // Buscar ubicaciones para esos inmuebles
    const ubicaciones = [];
    for (const inmueble of inmuebles) {
      console.log(`Buscando ubicaciones para inmueble ID ${inmueble.id}`);
      const ubicacionResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
            WHERE iu.inmueble_id = ${inmueble.id}`
      );
      
      const ubicacionesInmueble = ubicacionResult.rows || [];
      console.log(`Encontradas ${ubicacionesInmueble.length} ubicaciones para inmueble ID ${inmueble.id}`);
      
      ubicaciones.push(...ubicacionesInmueble);
    }
    
    return {
      inmuebles,
      ubicaciones
    };
    
  } catch (error) {
    console.error(`Error al obtener relaciones para persona ID ${personaId}:`, error);
    return {
      inmuebles: [],
      ubicaciones: []
    };
  }
}