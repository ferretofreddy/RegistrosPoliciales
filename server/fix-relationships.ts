import { sql } from 'drizzle-orm';
import { Pool } from '@neondatabase/serverless';

// Usar conexión directa a base de datos para evitar problemas con el ORM
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Función para reparar la relación entre inmueble y ubicación
 */
async function fixInmuebleUbicacionRelation() {
  try {
    const inmuebleId = 3;
    const ubicacionId = 3;
    
    console.log(`Verificando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
    
    // Verificar si la relación ya existe
    const checkRelation = await pool.query(
      'SELECT * FROM inmuebles_ubicaciones WHERE inmueble_id = $1 AND ubicacion_id = $2',
      [inmuebleId, ubicacionId]
    );
    
    if (checkRelation.rowCount === 0) {
      console.log(`Creando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
      await pool.query(
        'INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id) VALUES ($1, $2)',
        [inmuebleId, ubicacionId]
      );
      console.log(`Relación creada exitosamente`);
    } else {
      console.log(`La relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId} ya existe`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al reparar la relación inmueble-ubicación:', error);
    return { success: false, error };
  }
}

/**
 * Función para reparar la relación entre persona e inmueble
 */
async function fixPersonaInmuebleRelation() {
  try {
    const personaId = 1;
    const inmuebleId = 3;
    
    console.log(`Verificando relación entre persona ID ${personaId} e inmueble ID ${inmuebleId}`);
    
    // Verificar si la relación ya existe
    const checkRelation = await pool.query(
      'SELECT * FROM personas_inmuebles WHERE persona_id = $1 AND inmueble_id = $2',
      [personaId, inmuebleId]
    );
    
    if (checkRelation.rowCount === 0) {
      console.log(`Creando relación entre persona ID ${personaId} e inmueble ID ${inmuebleId}`);
      await pool.query(
        'INSERT INTO personas_inmuebles (persona_id, inmueble_id) VALUES ($1, $2)',
        [personaId, inmuebleId]
      );
      console.log(`Relación creada exitosamente`);
    } else {
      console.log(`La relación entre persona ID ${personaId} e inmueble ID ${inmuebleId} ya existe`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al reparar la relación persona-inmueble:', error);
    return { success: false, error };
  }
}

/**
 * Verifica que la ubicación tenga coordenadas geográficas
 */
async function fixUbicacionCoordinates() {
  try {
    const ubicacionId = 3;
    
    console.log(`Verificando coordenadas de ubicación ID ${ubicacionId}`);
    
    // Verificar si la ubicación existe y tiene coordenadas
    const checkUbicacion = await pool.query(
      'SELECT id, latitud, longitud FROM ubicaciones WHERE id = $1',
      [ubicacionId]
    );
    
    if (checkUbicacion.rowCount === 0) {
      console.log(`La ubicación ID ${ubicacionId} no existe`);
      return { success: false, message: 'La ubicación no existe' };
    }
    
    const ubicacion = checkUbicacion.rows[0];
    
    if (ubicacion.latitud && ubicacion.longitud) {
      console.log(`La ubicación ID ${ubicacionId} ya tiene coordenadas: (${ubicacion.latitud}, ${ubicacion.longitud})`);
      return { success: true };
    }
    
    // La ubicación existe pero no tiene coordenadas, actualizar
    console.log(`Actualizando coordenadas de ubicación ID ${ubicacionId}`);
    await pool.query(
      'UPDATE ubicaciones SET latitud = $1, longitud = $2 WHERE id = $3',
      [9.9833, -84.0833, ubicacionId]
    );
    console.log(`Coordenadas actualizadas correctamente`);
    
    return { success: true };
  } catch (error) {
    console.error('Error al verificar/actualizar coordenadas de ubicación:', error);
    return { success: false, error };
  }
}

/**
 * Función principal para reparar todas las relaciones
 */
export async function fixAllRelationships() {
  try {
    console.log('=== INICIANDO REPARACIÓN DE RELACIONES ===');
    
    // Reparar relación inmueble-ubicación
    const inmuebleUbicacion = await fixInmuebleUbicacionRelation();
    if (!inmuebleUbicacion.success) {
      console.error('Error al reparar relación inmueble-ubicación');
    }
    
    // Reparar relación persona-inmueble
    const personaInmueble = await fixPersonaInmuebleRelation();
    if (!personaInmueble.success) {
      console.error('Error al reparar relación persona-inmueble');
    }
    
    // Verificar/actualizar coordenadas de ubicación
    const ubicacionCoordinates = await fixUbicacionCoordinates();
    if (!ubicacionCoordinates.success) {
      console.error('Error al verificar/actualizar coordenadas de ubicación');
    }
    
    console.log('=== REPARACIÓN DE RELACIONES COMPLETADA ===');
    
    return {
      inmuebleUbicacion,
      personaInmueble,
      ubicacionCoordinates
    };
  } finally {
    await pool.end();
  }
}