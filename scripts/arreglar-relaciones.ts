import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Configuración de la conexión a la base de datos
console.log("Configurando conexión a la base de datos...");
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL debe estar definida");
}

// Necesario para serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function agregarRelacionInmuebleUbicacion() {
  console.log("Iniciando reparación de relaciones inmueble-ubicación...");
  
  try {
    // 1. Verificamos si existe el inmueble con ID 3
    console.log("Verificando inmueble ID 3...");
    const inmuebleResult = await db.execute(
      sql`SELECT * FROM inmuebles WHERE id = 3`
    );
    
    let inmuebleId = 3;
    
    if (!inmuebleResult.rows?.length) {
      console.log("El inmueble ID 3 no existe, creando uno nuevo...");
      const nuevoInmuebleResult = await db.execute(
        sql`INSERT INTO inmuebles (tipo, propietario, direccion) 
            VALUES ('Terreno', 'Propietario test', 'Dirección test') 
            RETURNING *`
      );
      
      if (nuevoInmuebleResult.rows?.length) {
        inmuebleId = nuevoInmuebleResult.rows[0].id;
        console.log(`Inmueble creado con ID: ${inmuebleId}`);
      } else {
        throw new Error("Error al crear inmueble");
      }
    } else {
      console.log(`Inmueble encontrado: ${JSON.stringify(inmuebleResult.rows[0])}`);
    }
    
    // 2. Verificamos si existe la ubicación con ID 13
    console.log("Verificando ubicación ID 13...");
    const ubicacionResult = await db.execute(
      sql`SELECT * FROM ubicaciones WHERE id = 13`
    );
    
    let ubicacionId = 13;
    
    if (!ubicacionResult.rows?.length) {
      console.log("La ubicación ID 13 no existe, creando una nueva...");
      const nuevaUbicacionResult = await db.execute(
        sql`INSERT INTO ubicaciones (tipo, latitud, longitud, observaciones) 
            VALUES ('Ubicación de terreno', 9.9833, -84.0833, 'Ubicación de prueba') 
            RETURNING *`
      );
      
      if (nuevaUbicacionResult.rows?.length) {
        ubicacionId = nuevaUbicacionResult.rows[0].id;
        console.log(`Ubicación creada con ID: ${ubicacionId}`);
      } else {
        throw new Error("Error al crear ubicación");
      }
    } else {
      console.log(`Ubicación encontrada: ${JSON.stringify(ubicacionResult.rows[0])}`);
    }
    
    // 3. Verificamos si existe la relación entre inmueble y ubicación
    console.log(`Verificando relación entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}...`);
    const relacionResult = await db.execute(
      sql`SELECT * FROM inmuebles_ubicaciones 
          WHERE inmueble_id = ${inmuebleId} AND ubicacion_id = ${ubicacionId}`
    );
    
    if (!relacionResult.rows?.length) {
      console.log("La relación no existe, creando una nueva...");
      const nuevaRelacionResult = await db.execute(
        sql`INSERT INTO inmuebles_ubicaciones (inmueble_id, ubicacion_id) 
            VALUES (${inmuebleId}, ${ubicacionId}) 
            RETURNING *`
      );
      
      if (nuevaRelacionResult.rows?.length) {
        console.log(`Relación creada: ${JSON.stringify(nuevaRelacionResult.rows[0])}`);
      } else {
        throw new Error("Error al crear la relación");
      }
    } else {
      console.log(`La relación ya existe: ${JSON.stringify(relacionResult.rows[0])}`);
    }
    
    // 4. Verificamos si existe relación con la persona ID 1 (Pedro)
    console.log("Verificando persona ID 1 (Pedro)...");
    const personaResult = await db.execute(
      sql`SELECT * FROM personas WHERE id = 1`
    );
    
    if (!personaResult.rows?.length) {
      console.log("La persona ID 1 no existe");
    } else {
      console.log(`Persona encontrada: ${JSON.stringify(personaResult.rows[0])}`);
      
      // Verificamos si existe la relación entre persona e inmueble
      console.log(`Verificando relación entre persona ID 1 e inmueble ID ${inmuebleId}...`);
      const relacionPersonaResult = await db.execute(
        sql`SELECT * FROM personas_inmuebles 
            WHERE persona_id = 1 AND inmueble_id = ${inmuebleId}`
      );
      
      if (!relacionPersonaResult.rows?.length) {
        console.log("La relación no existe, creando una nueva...");
        const nuevaRelacionPersonaResult = await db.execute(
          sql`INSERT INTO personas_inmuebles (persona_id, inmueble_id) 
              VALUES (1, ${inmuebleId}) 
              RETURNING *`
        );
        
        if (nuevaRelacionPersonaResult.rows?.length) {
          console.log(`Relación creada: ${JSON.stringify(nuevaRelacionPersonaResult.rows[0])}`);
        } else {
          throw new Error("Error al crear la relación persona-inmueble");
        }
      } else {
        console.log(`La relación ya existe: ${JSON.stringify(relacionPersonaResult.rows[0])}`);
      }
    }
    
    // 5. Verificamos todas las relaciones actuales
    console.log("\nResumen de relaciones:");
    
    const todasRelacionesInmuebles = await db.execute(
      sql`SELECT * FROM inmuebles_ubicaciones`
    );
    console.log(`Total relaciones inmueble-ubicación: ${todasRelacionesInmuebles.rows?.length || 0}`);
    
    const todasRelacionesPersonas = await db.execute(
      sql`SELECT * FROM personas_inmuebles`
    );
    console.log(`Total relaciones persona-inmueble: ${todasRelacionesPersonas.rows?.length || 0}`);
    
    console.log("\n✅ Operación completada con éxito");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Cerramos la conexión
    await pool.end();
  }
}

// Ejecutamos la función
agregarRelacionInmuebleUbicacion();