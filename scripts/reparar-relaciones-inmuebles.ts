import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

// Conexión directa a la base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function repararRelacionesInmuebles() {
  console.log("Iniciando reparación de relaciones de inmuebles...");
  
  try {
    // 1. Verificar el inmueble ID 3 (Tipo terreno)
    console.log("1. Verificando el inmueble ID 3...");
    const inmuebleResult = await db.execute(
      sql`SELECT * FROM inmuebles WHERE id = 3`
    );
    
    let inmuebleId = 3;
    
    if (!inmuebleResult.rows || inmuebleResult.rows.length === 0) {
      console.log("   El inmueble ID 3 no existe, creándolo...");
      
      // Crear el inmueble
      const nuevoInmueble = await db.execute(
        sql`INSERT INTO inmuebles (tipo, propietario, direccion) 
            VALUES ('Terreno', 'Propietario de prueba', 'Dirección de prueba')
            RETURNING *`
      );
      
      if (nuevoInmueble.rows && nuevoInmueble.rows.length > 0) {
        inmuebleId = nuevoInmueble.rows[0].id;
        console.log(`   ✅ Inmueble creado con ID: ${inmuebleId}`);
      } else {
        console.log("   ❌ Error al crear el inmueble");
        return;
      }
    } else {
      console.log(`   ✅ Inmueble ID 3 encontrado: ${JSON.stringify(inmuebleResult.rows[0])}`);
    }
    
    // 2. Verificar la ubicación ID 13
    console.log("2. Verificando la ubicación ID 13...");
    const ubicacionResult = await db.execute(
      sql`SELECT * FROM ubicaciones WHERE id = 13`
    );
    
    let ubicacionId = 13;
    
    if (!ubicacionResult.rows || ubicacionResult.rows.length === 0) {
      console.log("   La ubicación ID 13 no existe, creándola...");
      
      // Crear la ubicación
      const nuevaUbicacion = await db.execute(
        sql`INSERT INTO ubicaciones (tipo, latitud, longitud, observaciones) 
            VALUES ('Ubicación Terreno', 9.9833, -84.0833, 'Ubicación de prueba para terreno')
            RETURNING *`
      );
      
      if (nuevaUbicacion.rows && nuevaUbicacion.rows.length > 0) {
        ubicacionId = nuevaUbicacion.rows[0].id;
        console.log(`   ✅ Ubicación creada con ID: ${ubicacionId}`);
      } else {
        console.log("   ❌ Error al crear la ubicación");
        return;
      }
    } else {
      console.log(`   ✅ Ubicación ID 13 encontrada: ${JSON.stringify(ubicacionResult.rows[0])}`);
    }
    
    // 3. Verificar si existe la relación entre el inmueble y la ubicación
    console.log(`3. Verificando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}...`);
    const relacionResult = await db.execute(
      sql`SELECT * FROM inmuebles_ubicaciones 
          WHERE inmueble_id = ${inmuebleId} AND ubicacion_id = ${ubicacionId}`
    );
    
    if (!relacionResult.rows || relacionResult.rows.length === 0) {
      console.log("   La relación no existe, creándola...");
      
      // Crear la relación
      const nuevaRelacion = await db.execute(
        sql`INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id) 
            VALUES (${inmuebleId}, ${ubicacionId})
            RETURNING *`
      );
      
      if (nuevaRelacion.rows && nuevaRelacion.rows.length > 0) {
        console.log(`   ✅ Relación creada: ${JSON.stringify(nuevaRelacion.rows[0])}`);
      } else {
        console.log("   ❌ Error al crear la relación");
      }
    } else {
      console.log(`   ✅ Ya existe una relación: ${JSON.stringify(relacionResult.rows[0])}`);
    }
    
    // 4. Verificar si existe relación con la persona ID 1 (Pedro)
    console.log("4. Verificando relación con la persona ID 1 (Pedro)...");
    const personaResult = await db.execute(
      sql`SELECT * FROM personas WHERE id = 1`
    );
    
    if (!personaResult.rows || personaResult.rows.length === 0) {
      console.log("   ⚠️ La persona ID 1 no existe");
    } else {
      console.log(`   ✅ Persona ID 1 encontrada: ${personaResult.rows[0].nombre}`);
      
      // Verificar si existe la relación entre la persona y el inmueble
      const relacionPersonaResult = await db.execute(
        sql`SELECT * FROM personas_inmuebles 
            WHERE persona_id = 1 AND inmueble_id = ${inmuebleId}`
      );
      
      if (!relacionPersonaResult.rows || relacionPersonaResult.rows.length === 0) {
        console.log("   La relación persona-inmueble no existe, creándola...");
        
        // Crear la relación
        const nuevaRelacionPersona = await db.execute(
          sql`INSERT INTO personas_inmuebles (persona_id, inmueble_id) 
              VALUES (1, ${inmuebleId})
              RETURNING *`
        );
        
        if (nuevaRelacionPersona.rows && nuevaRelacionPersona.rows.length > 0) {
          console.log(`   ✅ Relación persona-inmueble creada: ${JSON.stringify(nuevaRelacionPersona.rows[0])}`);
        } else {
          console.log("   ❌ Error al crear la relación persona-inmueble");
        }
      } else {
        console.log(`   ✅ Ya existe una relación persona-inmueble: ${JSON.stringify(relacionPersonaResult.rows[0])}`);
      }
    }
    
    console.log("\n✅ Reparación completada exitosamente");
    
    // Mostrar todas las relaciones actuales
    console.log("\nResumen de relaciones:");
    
    const inmuebles = await db.execute(sql`SELECT * FROM inmuebles`);
    console.log(`Inmuebles: ${inmuebles.rows?.length || 0}`);
    
    const ubicaciones = await db.execute(sql`SELECT * FROM ubicaciones`);
    console.log(`Ubicaciones: ${ubicaciones.rows?.length || 0}`);
    
    const personasInmuebles = await db.execute(sql`SELECT * FROM personas_inmuebles`);
    console.log(`Relaciones persona-inmueble: ${personasInmuebles.rows?.length || 0}`);
    
    const inmueblesUbicaciones = await db.execute(sql`SELECT * FROM inmuebles_ubicaciones`);
    console.log(`Relaciones inmueble-ubicación: ${inmueblesUbicaciones.rows?.length || 0}`);
    
  } catch (error) {
    console.error("Error al reparar relaciones:", error);
  } finally {
    await pool.end();
  }
}

// Ejecutar la función
repararRelacionesInmuebles();