import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function verificarRelacionesInmueble(inmuebleId: number) {
  console.log(`Verificando relaciones para el inmueble ID: ${inmuebleId}`);

  try {
    // 1. Verificar si el inmueble existe
    const inmuebleResult = await db.execute(
      sql`SELECT * FROM inmuebles WHERE id = ${inmuebleId}`
    );
    
    if (!inmuebleResult.rows || inmuebleResult.rows.length === 0) {
      console.log(`⚠️ El inmueble con ID ${inmuebleId} no existe`);
      return;
    }
    
    const inmueble = inmuebleResult.rows[0];
    console.log(`✅ Inmueble encontrado: ID ${inmuebleId}, Tipo: ${inmueble.tipo}, Dirección: ${inmueble.direccion || 'No especificada'}`);
    
    // 2. Verificar si el inmueble tiene ubicaciones relacionadas
    const ubicacionesResult = await db.execute(
      sql`SELECT u.* FROM ubicaciones u
          JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
          WHERE iu.inmueble_id = ${inmuebleId}`
    );
    
    if (!ubicacionesResult.rows || ubicacionesResult.rows.length === 0) {
      console.log(`❌ No se encontraron ubicaciones relacionadas con el inmueble ID ${inmuebleId}`);
    } else {
      console.log(`✅ Se encontraron ${ubicacionesResult.rows.length} ubicaciones relacionadas con el inmueble ID ${inmuebleId}:`);
      ubicacionesResult.rows.forEach((ubicacion, index) => {
        console.log(`  ${index + 1}. ID: ${ubicacion.id}, Tipo: ${ubicacion.tipo}, Lat: ${ubicacion.latitud}, Lng: ${ubicacion.longitud}`);
      });
    }
    
    // 3. Verificar si existe una ubicación con ID 13
    const ubicacion13Result = await db.execute(
      sql`SELECT * FROM ubicaciones WHERE id = 13`
    );
    
    if (!ubicacion13Result.rows || ubicacion13Result.rows.length === 0) {
      console.log(`❌ No existe una ubicación con ID 13`);
    } else {
      console.log(`✅ Ubicación ID 13 encontrada: Tipo: ${ubicacion13Result.rows[0].tipo}, Lat: ${ubicacion13Result.rows[0].latitud}, Lng: ${ubicacion13Result.rows[0].longitud}`);
      
      // Verificar si esta ubicación está relacionada con el inmueble
      const relacionResult = await db.execute(
        sql`SELECT * FROM inmuebles_ubicaciones 
            WHERE inmueble_id = ${inmuebleId} AND ubicacion_id = 13`
      );
      
      if (!relacionResult.rows || relacionResult.rows.length === 0) {
        console.log(`❌ No existe relación entre el inmueble ID ${inmuebleId} y la ubicación ID 13`);
      } else {
        console.log(`✅ Existe una relación entre el inmueble ID ${inmuebleId} y la ubicación ID 13`);
      }
    }
    
    // 4. Verificar relaciones con personas
    const personasResult = await db.execute(
      sql`SELECT p.* FROM personas p
          JOIN personas_inmuebles pi ON p.id = pi.persona_id
          WHERE pi.inmueble_id = ${inmuebleId}`
    );
    
    if (!personasResult.rows || personasResult.rows.length === 0) {
      console.log(`❌ No se encontraron personas relacionadas con el inmueble ID ${inmuebleId}`);
    } else {
      console.log(`✅ Se encontraron ${personasResult.rows.length} personas relacionadas con el inmueble ID ${inmuebleId}:`);
      personasResult.rows.forEach((persona, index) => {
        console.log(`  ${index + 1}. ID: ${persona.id}, Nombre: ${persona.nombre}`);
      });
    }
    
  } catch (error) {
    console.error("Error al verificar relaciones:", error);
  } finally {
    // La conexión se cerrará automáticamente cuando termine el script
  }
}

// Ejecutar la función para el inmueble ID 3
verificarRelacionesInmueble(3);