import { pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    // Definir los IDs para las entidades
    const inmuebleId = 3;
    const ubicacionId = 3;
    const personaId = 1;
    
    console.log(`Verificando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
    
    // Verificar si la relación entre inmueble y ubicación ya existe
    const relacionInmuebleUbicacion = await pool.query(
      'SELECT * FROM inmuebles_ubicaciones WHERE inmueble_id = $1 AND ubicacion_id = $2',
      [inmuebleId, ubicacionId]
    );
    
    // Si no existe la relación, crearla
    if (relacionInmuebleUbicacion.rowCount === 0) {
      console.log(`Creando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
      await pool.query(
        'INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id) VALUES ($1, $2)',
        [inmuebleId, ubicacionId]
      );
      console.log('Relación creada exitosamente');
    } else {
      console.log(`La relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId} ya existe`);
    }
    
    // Verificar si la relación entre persona e inmueble ya existe
    console.log(`Verificando relación entre persona ID ${personaId} e inmueble ID ${inmuebleId}`);
    const relacionPersonaInmueble = await pool.query(
      'SELECT * FROM personas_inmuebles WHERE persona_id = $1 AND inmueble_id = $2',
      [personaId, inmuebleId]
    );
    
    // Si no existe la relación, crearla
    if (relacionPersonaInmueble.rowCount === 0) {
      console.log(`Creando relación entre persona ID ${personaId} e inmueble ID ${inmuebleId}`);
      await pool.query(
        'INSERT INTO personas_inmuebles (persona_id, inmueble_id) VALUES ($1, $2)',
        [personaId, inmuebleId]
      );
      console.log('Relación creada exitosamente');
    } else {
      console.log(`La relación entre persona ID ${personaId} e inmueble ID ${inmuebleId} ya existe`);
    }
    
    // Verificar que las relaciones existan (para confirmar)
    const verificarInmuebleUbicacion = await pool.query(
      'SELECT * FROM inmuebles_ubicaciones WHERE inmueble_id = $1 AND ubicacion_id = $2',
      [inmuebleId, ubicacionId]
    );
    
    const verificarPersonaInmueble = await pool.query(
      'SELECT * FROM personas_inmuebles WHERE persona_id = $1 AND inmueble_id = $2',
      [personaId, inmuebleId]
    );
    
    console.log(`Verificación final:`);
    console.log(`- Relación inmueble-ubicación: ${verificarInmuebleUbicacion.rowCount > 0 ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`- Relación persona-inmueble: ${verificarPersonaInmueble.rowCount > 0 ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Verificar que la ubicación tiene coordenadas para aparecer en el mapa
    const verificarCoordenadas = await pool.query(
      'SELECT * FROM ubicaciones WHERE id = $1',
      [ubicacionId]
    );
    
    if (verificarCoordenadas.rows.length > 0) {
      const ubicacion = verificarCoordenadas.rows[0];
      console.log(`Ubicación ID ${ubicacionId}:`);
      console.log(`- Latitud: ${ubicacion.latitud || 'NO DEFINIDA'}`);
      console.log(`- Longitud: ${ubicacion.longitud || 'NO DEFINIDA'}`);
      
      // Si no tiene coordenadas, agregarlas
      if (!ubicacion.latitud || !ubicacion.longitud) {
        console.log('La ubicación no tiene coordenadas. Agregando coordenadas...');
        await pool.query(
          'UPDATE ubicaciones SET latitud = $1, longitud = $2 WHERE id = $3',
          [9.9833, -84.0833, ubicacionId]
        );
        console.log('Coordenadas agregadas exitosamente');
      }
    }
    
    console.log('Script completado con éxito');
  } catch (error) {
    console.error('Error al ejecutar el script:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);