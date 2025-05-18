import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';

// Conexión a la base de datos
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Función para obtener todas las relaciones de una entidad
 * @param tipo Tipo de entidad (persona, vehiculo, inmueble, ubicacion)
 * @param id ID de la entidad
 * @returns Objeto con las relaciones encontradas
 */
export async function getRelaciones(tipo: string, id: number) {
  try {
    const resultado: any = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };

    console.log(`Buscando relaciones para ${tipo} con ID ${id}`);

    // RELACIONES PERSONA
    if (tipo === 'persona') {
      // Buscar inmuebles relacionados con la persona
      const inmuebleResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
            WHERE pi.persona_id = ${id}`
      );
      
      resultado.inmuebles = inmuebleResult.rows || [];
      console.log(`Encontrados ${resultado.inmuebles.length} inmuebles relacionados con persona ${id}`);

      // Buscar ubicaciones para cada inmueble
      for (const inmueble of resultado.inmuebles) {
        const ubicacionResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${inmueble.id}`
        );
        
        const ubicacionesInmueble = ubicacionResult.rows || [];
        resultado.ubicaciones.push(...ubicacionesInmueble);
      }
      
      console.log(`Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas con inmuebles de persona ${id}`);
    } 
    
    // RELACIONES INMUEBLE
    else if (tipo === 'inmueble') {
      // Buscar personas relacionadas con el inmueble
      const personasResult = await db.execute(
        sql`SELECT p.* FROM personas p
            JOIN personas_inmuebles pi ON p.id = pi.persona_id
            WHERE pi.inmueble_id = ${id}`
      );
      
      resultado.personas = personasResult.rows || [];
      console.log(`Encontradas ${resultado.personas.length} personas relacionadas con inmueble ${id}`);

      // Buscar ubicaciones relacionadas con el inmueble
      const ubicacionesResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
            WHERE iu.inmueble_id = ${id}`
      );
      
      resultado.ubicaciones = ubicacionesResult.rows || [];
      console.log(`Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas con inmueble ${id}`);
    } 
    
    // RELACIONES UBICACION
    else if (tipo === 'ubicacion') {
      // Buscar inmuebles relacionados con la ubicación
      const inmueblesResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN inmuebles_ubicaciones iu ON i.id = iu.inmueble_id
            WHERE iu.ubicacion_id = ${id}`
      );
      
      resultado.inmuebles = inmueblesResult.rows || [];
      console.log(`Encontrados ${resultado.inmuebles.length} inmuebles relacionados con ubicación ${id}`);

      // Para cada inmueble, buscar las personas relacionadas
      for (const inmueble of resultado.inmuebles) {
        const personasResult = await db.execute(
          sql`SELECT p.* FROM personas p
              JOIN personas_inmuebles pi ON p.id = pi.persona_id
              WHERE pi.inmueble_id = ${inmueble.id}`
        );
        
        const personasInmueble = personasResult.rows || [];
        resultado.personas.push(...personasInmueble);
      }
      
      console.log(`Encontradas ${resultado.personas.length} personas relacionadas con inmuebles de ubicación ${id}`);
    } 

    // Retornar todos los resultados encontrados
    return resultado;
    
  } catch (error) {
    console.error(`Error al obtener relaciones para ${tipo} ID ${id}:`, error);
    return {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
  }
}

// Función para crear una nueva relación entre dos entidades
export async function crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number) {
  try {
    console.log(`Creando relación entre ${tipo1} ID ${id1} y ${tipo2} ID ${id2}`);
    
    // Relación persona-inmueble
    if ((tipo1 === 'persona' && tipo2 === 'inmueble') || (tipo1 === 'inmueble' && tipo2 === 'persona')) {
      const personaId = tipo1 === 'persona' ? id1 : id2;
      const inmuebleId = tipo1 === 'inmueble' ? id1 : id2;
      
      // Verificar que la relación no exista
      const relacionExistente = await db.execute(
        sql`SELECT * FROM personas_inmuebles 
            WHERE persona_id = ${personaId} AND inmueble_id = ${inmuebleId}`
      );
      
      if (relacionExistente.rows.length === 0) {
        await db.execute(
          sql`INSERT INTO personas_inmuebles (persona_id, inmueble_id)
              VALUES (${personaId}, ${inmuebleId})`
        );
        console.log(`Relación creada entre persona ${personaId} e inmueble ${inmuebleId}`);
        return { success: true, message: 'Relación creada correctamente' };
      } else {
        console.log(`La relación entre persona ${personaId} e inmueble ${inmuebleId} ya existe`);
        return { success: false, message: 'La relación ya existe' };
      }
    }
    
    // Relación inmueble-ubicacion
    else if ((tipo1 === 'inmueble' && tipo2 === 'ubicacion') || (tipo1 === 'ubicacion' && tipo2 === 'inmueble')) {
      const inmuebleId = tipo1 === 'inmueble' ? id1 : id2;
      const ubicacionId = tipo1 === 'ubicacion' ? id1 : id2;
      
      // Verificar que la relación no exista
      const relacionExistente = await db.execute(
        sql`SELECT * FROM inmuebles_ubicaciones 
            WHERE inmueble_id = ${inmuebleId} AND ubicacion_id = ${ubicacionId}`
      );
      
      if (relacionExistente.rows.length === 0) {
        await db.execute(
          sql`INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id)
              VALUES (${inmuebleId}, ${ubicacionId})`
        );
        console.log(`Relación creada entre inmueble ${inmuebleId} y ubicación ${ubicacionId}`);
        return { success: true, message: 'Relación creada correctamente' };
      } else {
        console.log(`La relación entre inmueble ${inmuebleId} y ubicación ${ubicacionId} ya existe`);
        return { success: false, message: 'La relación ya existe' };
      }
    }
    
    // Otros tipos de relaciones no soportados
    else {
      console.log(`Tipo de relación entre ${tipo1} y ${tipo2} no soportada`);
      return { success: false, message: 'Tipo de relación no soportada' };
    }
    
  } catch (error) {
    console.error(`Error al crear relación entre ${tipo1} ID ${id1} y ${tipo2} ID ${id2}:`, error);
    return { success: false, message: 'Error al crear la relación', error };
  }
}