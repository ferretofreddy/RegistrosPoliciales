import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

// Conexión a la base de datos
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Función simple para obtener relaciones entre entidades
export async function getRelaciones(tipo: string, id: number): Promise<any> {
  try {
    // Resultado por defecto vacío
    const resultado = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
    
    console.log(`Consultando relaciones para ${tipo} con ID ${id}`);
    
    // Relaciones para personas
    if (tipo === 'persona') {
      // Inmuebles relacionados con la persona
      const inmuebleResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
            WHERE pi.persona_id = ${id}`
      );
      
      resultado.inmuebles = inmuebleResult.rows || [];
      console.log(`Encontrados ${resultado.inmuebles.length} inmuebles relacionados con persona ${id}`);
      
      // Ubicaciones relacionadas con esos inmuebles
      for (const inmueble of resultado.inmuebles) {
        const ubicacionResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${inmueble.id}`
        );
        
        const ubicacionesInmueble = ubicacionResult.rows || [];
        resultado.ubicaciones.push(...ubicacionesInmueble);
      }
      
      console.log(`Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas con los inmuebles de la persona ${id}`);
    }
    
    // Relaciones para inmuebles
    else if (tipo === 'inmueble') {
      // Personas relacionadas con el inmueble
      const personasResult = await db.execute(
        sql`SELECT p.* FROM personas p
            JOIN personas_inmuebles pi ON p.id = pi.persona_id
            WHERE pi.inmueble_id = ${id}`
      );
      
      resultado.personas = personasResult.rows || [];
      console.log(`Encontradas ${resultado.personas.length} personas relacionadas con inmueble ${id}`);
      
      // Ubicaciones relacionadas con el inmueble
      const ubicacionesResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
            WHERE iu.inmueble_id = ${id}`
      );
      
      resultado.ubicaciones = ubicacionesResult.rows || [];
      console.log(`Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas con inmueble ${id}`);
    }
    
    // Relaciones para ubicaciones
    else if (tipo === 'ubicacion') {
      // Inmuebles relacionados con la ubicación
      const inmueblesResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN inmuebles_ubicaciones iu ON i.id = iu.inmueble_id
            WHERE iu.ubicacion_id = ${id}`
      );
      
      resultado.inmuebles = inmueblesResult.rows || [];
      console.log(`Encontrados ${resultado.inmuebles.length} inmuebles relacionados con ubicación ${id}`);
    }
    
    return resultado;
  } catch (error) {
    console.error(`Error al obtener relaciones: ${error}`);
    return {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
  }
}

// Función para crear relación entre dos entidades
export async function crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
  try {
    console.log(`Creando relación entre ${tipo1} ${id1} y ${tipo2} ${id2}`);
    
    // Relación persona-inmueble
    if ((tipo1 === 'persona' && tipo2 === 'inmueble') || (tipo1 === 'inmueble' && tipo2 === 'persona')) {
      const personaId = tipo1 === 'persona' ? id1 : id2;
      const inmuebleId = tipo1 === 'inmueble' ? id1 : id2;
      
      // Verificar si la relación ya existe
      const existeRelacion = await db.execute(
        sql`SELECT * FROM personas_inmuebles
            WHERE persona_id = ${personaId} AND inmueble_id = ${inmuebleId}`
      );
      
      if (existeRelacion.rows && existeRelacion.rows.length > 0) {
        console.log(`La relación entre persona ${personaId} e inmueble ${inmuebleId} ya existe`);
        return { success: true, message: 'La relación ya existe' };
      }
      
      // Crear la relación
      await db.execute(
        sql`INSERT INTO personas_inmuebles (persona_id, inmueble_id)
            VALUES (${personaId}, ${inmuebleId})`
      );
      
      console.log(`Relación creada entre persona ${personaId} e inmueble ${inmuebleId}`);
      return { success: true, message: 'Relación creada exitosamente' };
    }
    
    // Relación inmueble-ubicación
    else if ((tipo1 === 'inmueble' && tipo2 === 'ubicacion') || (tipo1 === 'ubicacion' && tipo2 === 'inmueble')) {
      const inmuebleId = tipo1 === 'inmueble' ? id1 : id2;
      const ubicacionId = tipo1 === 'ubicacion' ? id1 : id2;
      
      // Verificar si la relación ya existe
      const existeRelacion = await db.execute(
        sql`SELECT * FROM inmuebles_ubicaciones
            WHERE inmueble_id = ${inmuebleId} AND ubicacion_id = ${ubicacionId}`
      );
      
      if (existeRelacion.rows && existeRelacion.rows.length > 0) {
        console.log(`La relación entre inmueble ${inmuebleId} y ubicación ${ubicacionId} ya existe`);
        return { success: true, message: 'La relación ya existe' };
      }
      
      // Crear la relación
      await db.execute(
        sql`INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id)
            VALUES (${inmuebleId}, ${ubicacionId})`
      );
      
      console.log(`Relación creada entre inmueble ${inmuebleId} y ubicación ${ubicacionId}`);
      return { success: true, message: 'Relación creada exitosamente' };
    }
    
    // Tipo de relación no soportada
    else {
      return { success: false, message: 'Tipo de relación no soportada' };
    }
  } catch (error) {
    console.error(`Error al crear relación: ${error}`);
    return { success: false, message: 'Error al crear relación', error };
  }
}