import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Conexión a la base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

/**
 * Este script realiza diferentes pruebas para diagnosticar los problemas de relaciones
 * en la aplicación, centrándose en las relaciones de inmuebles.
 */
async function corregirRelacionesInmuebles() {
  console.log("==========================================");
  console.log("  DIAGNÓSTICO DE RELACIONES DE INMUEBLES  ");
  console.log("==========================================");

  try {
    // 1. Verificar que existe Pedro (ID 1)
    console.log("\n1. Verificando datos de Pedro (ID 1)...");
    const personaResult = await db.execute(
      sql`SELECT * FROM personas WHERE id = 1`
    );
    if (personaResult.rows?.length) {
      console.log(`✓ Persona encontrada: ${JSON.stringify(personaResult.rows[0])}`);
    } else {
      console.log("✗ No se encontró a Pedro con ID 1");
    }

    // 2. Verificar inmuebles de Pedro
    console.log("\n2. Verificando inmuebles relacionados con Pedro...");
    const inmueblesResult = await db.execute(
      sql`SELECT i.* 
          FROM inmuebles i
          JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
          WHERE pi.persona_id = 1`
    );
    
    if (inmueblesResult.rows?.length) {
      console.log(`✓ Se encontraron ${inmueblesResult.rows.length} inmuebles relacionados con Pedro:`);
      inmueblesResult.rows.forEach(inmueble => {
        console.log(`  - ID: ${inmueble.id}, Tipo: ${inmueble.tipo}, Dirección: ${inmueble.direccion}`);
      });
    } else {
      console.log("✗ No se encontraron inmuebles relacionados con Pedro");
    }
    
    // 3. Verificar ubicaciones relacionadas con inmuebles
    console.log("\n3. Verificando ubicaciones relacionadas con inmuebles...");
    
    // Extraer IDs de inmuebles
    const inmuebleIds = inmueblesResult.rows?.map(inmueble => inmueble.id) || [];
    if (inmuebleIds.length === 0) {
      console.log("  No hay inmuebles para verificar ubicaciones");
    } else {
      for (const inmuebleId of inmuebleIds) {
        console.log(`  Verificando ubicaciones para inmueble ID ${inmuebleId}...`);
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* 
              FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${inmuebleId}`
        );
        
        if (ubicacionesResult.rows?.length) {
          console.log(`  ✓ Se encontraron ${ubicacionesResult.rows.length} ubicaciones para inmueble ID ${inmuebleId}:`);
          ubicacionesResult.rows.forEach(ubicacion => {
            console.log(`    - ID: ${ubicacion.id}, Tipo: ${ubicacion.tipo}, Coords: [${ubicacion.latitud}, ${ubicacion.longitud}]`);
          });
        } else {
          console.log(`  ✗ No se encontraron ubicaciones para inmueble ID ${inmuebleId}`);
          
          // Si no hay ubicaciones, crear una
          console.log(`    Creando ubicación para inmueble ID ${inmuebleId}...`);
          const nuevaUbicacion = await db.execute(
            sql`INSERT INTO ubicaciones 
                (tipo, latitud, longitud, observaciones) 
                VALUES ('Ubicación de inmueble', 9.9333, -84.0833, 'Ubicación generada automáticamente') 
                RETURNING *`
          );
          
          if (nuevaUbicacion.rows?.length) {
            const ubicacionId = nuevaUbicacion.rows[0].id;
            console.log(`    ✓ Ubicación creada con ID ${ubicacionId}`);
            
            // Crear relación entre inmueble y ubicación
            const relacion = await db.execute(
              sql`INSERT INTO inmuebles_ubicaciones 
                  (inmueble_id, ubicacion_id) 
                  VALUES (${inmuebleId}, ${ubicacionId}) 
                  RETURNING *`
            );
            
            if (relacion.rows?.length) {
              console.log(`    ✓ Relación creada entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
            } else {
              console.log(`    ✗ Error al crear relación para inmueble ID ${inmuebleId}`);
            }
          } else {
            console.log(`    ✗ Error al crear ubicación para inmueble ID ${inmuebleId}`);
          }
        }
      }
    }
    
    // 4. Verificar el inmueble específico con ID 3
    console.log("\n4. Verificando inmueble específico con ID 3...");
    const inmueble3Result = await db.execute(
      sql`SELECT * FROM inmuebles WHERE id = 3`
    );
    
    if (inmueble3Result.rows?.length) {
      console.log(`✓ Inmueble encontrado: ${JSON.stringify(inmueble3Result.rows[0])}`);
      
      // Verificar relación con Pedro
      const relacionPedroResult = await db.execute(
        sql`SELECT * FROM personas_inmuebles 
            WHERE persona_id = 1 AND inmueble_id = 3`
      );
      
      if (relacionPedroResult.rows?.length) {
        console.log(`✓ El inmueble ID 3 está relacionado con Pedro`);
      } else {
        console.log(`✗ El inmueble ID 3 NO está relacionado con Pedro, creando relación...`);
        const nuevaRelacion = await db.execute(
          sql`INSERT INTO personas_inmuebles 
              (persona_id, inmueble_id) 
              VALUES (1, 3) 
              RETURNING *`
        );
        
        if (nuevaRelacion.rows?.length) {
          console.log(`  ✓ Relación creada entre Pedro (ID 1) e inmueble ID 3`);
        } else {
          console.log(`  ✗ Error al crear relación entre Pedro e inmueble ID 3`);
        }
      }
      
      // Verificar relación con ubicación
      const relacionUbicacionResult = await db.execute(
        sql`SELECT u.* 
            FROM ubicaciones u
            JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
            WHERE iu.inmueble_id = 3`
      );
      
      if (relacionUbicacionResult.rows?.length) {
        console.log(`✓ El inmueble ID 3 está relacionado con ${relacionUbicacionResult.rows.length} ubicaciones:`);
        relacionUbicacionResult.rows.forEach(ubicacion => {
          console.log(`  - ID: ${ubicacion.id}, Tipo: ${ubicacion.tipo}, Coords: [${ubicacion.latitud}, ${ubicacion.longitud}]`);
        });
      } else {
        console.log(`✗ El inmueble ID 3 NO está relacionado con ninguna ubicación, creando ubicación...`);
        
        // Crear ubicación para el inmueble ID 3
        const nuevaUbicacion = await db.execute(
          sql`INSERT INTO ubicaciones 
              (tipo, latitud, longitud, observaciones) 
              VALUES ('Ubicación de terreno', 9.9833, -84.0833, 'Ubicación para terreno') 
              RETURNING *`
        );
        
        if (nuevaUbicacion.rows?.length) {
          const ubicacionId = nuevaUbicacion.rows[0].id;
          console.log(`  ✓ Ubicación creada con ID ${ubicacionId}`);
          
          // Crear relación
          const relacion = await db.execute(
            sql`INSERT INTO inmuebles_ubicaciones 
                (inmueble_id, ubicacion_id) 
                VALUES (3, ${ubicacionId}) 
                RETURNING *`
          );
          
          if (relacion.rows?.length) {
            console.log(`  ✓ Relación creada entre inmueble ID 3 y ubicación ID ${ubicacionId}`);
          } else {
            console.log(`  ✗ Error al crear relación para inmueble ID 3`);
          }
        } else {
          console.log(`  ✗ Error al crear ubicación para inmueble ID 3`);
        }
      }
      
    } else {
      console.log(`✗ No se encontró el inmueble con ID 3, creándolo...`);
      
      // Crear inmueble con ID 3
      const nuevoInmueble = await db.execute(
        sql`INSERT INTO inmuebles 
            (tipo, propietario, direccion) 
            VALUES ('Terreno', 'Pedro Arias Moreno', 'Dirección de terreno') 
            RETURNING *`
      );
      
      if (nuevoInmueble.rows?.length) {
        const inmuebleId = nuevoInmueble.rows[0].id;
        console.log(`  ✓ Inmueble creado con ID ${inmuebleId}`);
        
        // Crear relación con Pedro
        const relacionPedro = await db.execute(
          sql`INSERT INTO personas_inmuebles 
              (persona_id, inmueble_id) 
              VALUES (1, ${inmuebleId}) 
              RETURNING *`
        );
        
        if (relacionPedro.rows?.length) {
          console.log(`  ✓ Relación creada entre Pedro (ID 1) e inmueble ID ${inmuebleId}`);
        } else {
          console.log(`  ✗ Error al crear relación entre Pedro y el nuevo inmueble`);
        }
        
        // Crear ubicación para el inmueble
        const nuevaUbicacion = await db.execute(
          sql`INSERT INTO ubicaciones 
              (tipo, latitud, longitud, observaciones) 
              VALUES ('Ubicación de terreno', 9.9833, -84.0833, 'Ubicación para terreno') 
              RETURNING *`
        );
        
        if (nuevaUbicacion.rows?.length) {
          const ubicacionId = nuevaUbicacion.rows[0].id;
          console.log(`  ✓ Ubicación creada con ID ${ubicacionId}`);
          
          // Crear relación
          const relacion = await db.execute(
            sql`INSERT INTO inmuebles_ubicaciones 
                (inmueble_id, ubicacion_id) 
                VALUES (${inmuebleId}, ${ubicacionId}) 
                RETURNING *`
          );
          
          if (relacion.rows?.length) {
            console.log(`  ✓ Relación creada entre inmueble ID ${inmuebleId} y ubicación ID ${ubicacionId}`);
          } else {
            console.log(`  ✗ Error al crear relación para inmueble ID ${inmuebleId}`);
          }
        } else {
          console.log(`  ✗ Error al crear ubicación para inmueble ID ${inmuebleId}`);
        }
      } else {
        console.log(`  ✗ Error al crear inmueble ID 3`);
      }
    }
    
    // 5. Resumen de relaciones
    console.log("\n5. Resumen de las relaciones actuales:");
    
    const personasCount = await db.execute(sql`SELECT COUNT(*) FROM personas`);
    console.log(`Personas: ${personasCount.rows?.[0].count || 0}`);
    
    const inmueblesCount = await db.execute(sql`SELECT COUNT(*) FROM inmuebles`);
    console.log(`Inmuebles: ${inmueblesCount.rows?.[0].count || 0}`);
    
    const ubicacionesCount = await db.execute(sql`SELECT COUNT(*) FROM ubicaciones`);
    console.log(`Ubicaciones: ${ubicacionesCount.rows?.[0].count || 0}`);
    
    const personasInmueblesCount = await db.execute(sql`SELECT COUNT(*) FROM personas_inmuebles`);
    console.log(`Relaciones persona-inmueble: ${personasInmueblesCount.rows?.[0].count || 0}`);
    
    const inmueblesUbicacionesCount = await db.execute(sql`SELECT COUNT(*) FROM inmuebles_ubicaciones`);
    console.log(`Relaciones inmueble-ubicación: ${inmueblesUbicacionesCount.rows?.[0].count || 0}`);
    
    console.log("\n==========================================");
    console.log("  DIAGNÓSTICO COMPLETADO  ");
    console.log("==========================================");
    
  } catch (error) {
    console.error("Error durante el diagnóstico:", error);
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
corregirRelacionesInmuebles();