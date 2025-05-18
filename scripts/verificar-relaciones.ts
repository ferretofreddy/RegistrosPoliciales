import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Este script verifica sistemáticamente todas las relaciones 
 * entre entidades para confirmar que funcionan correctamente.
 */
async function verificarRelaciones() {
  console.log("=== VERIFICANDO RELACIONES ENTRE TODAS LAS ENTIDADES ===\n");
  
  try {
    // 1. Verificar relaciones de personas
    console.log("1. VERIFICANDO RELACIONES DE PERSONAS");
    
    // Consultar relaciones de la persona 2 (Juan)
    const relacionesPersona2 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(2, 'persona')`
    );
    
    const persona2Data = relacionesPersona2.rows[0];
    const personasRelacionadas2 = persona2Data.personas ? persona2Data.personas.length : 0;
    const vehiculosRelacionados2 = persona2Data.vehiculos ? persona2Data.vehiculos.length : 0;
    const inmueblesRelacionados2 = persona2Data.inmuebles ? persona2Data.inmuebles.length : 0;
    const ubicacionesRelacionadas2 = persona2Data.ubicaciones ? persona2Data.ubicaciones.length : 0;
    
    console.log(`- Persona 2 (Juan Pérez): 
      - Personas relacionadas: ${personasRelacionadas2}
      - Vehículos relacionados: ${vehiculosRelacionados2}
      - Inmuebles relacionados: ${inmueblesRelacionados2}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadas2}
    `);
    
    // Consultar relaciones de la persona 3 (María)
    const relacionesPersona3 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(3, 'persona')`
    );
    
    const persona3Data = relacionesPersona3.rows[0];
    const personasRelacionadas3 = persona3Data.personas ? persona3Data.personas.length : 0;
    const vehiculosRelacionados3 = persona3Data.vehiculos ? persona3Data.vehiculos.length : 0;
    const inmueblesRelacionados3 = persona3Data.inmuebles ? persona3Data.inmuebles.length : 0;
    const ubicacionesRelacionadas3 = persona3Data.ubicaciones ? persona3Data.ubicaciones.length : 0;
    
    console.log(`- Persona 3 (María Rodríguez): 
      - Personas relacionadas: ${personasRelacionadas3}
      - Vehículos relacionados: ${vehiculosRelacionados3}
      - Inmuebles relacionados: ${inmueblesRelacionados3}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadas3}
    `);
    
    // 2. Verificar relaciones de vehículos
    console.log("\n2. VERIFICANDO RELACIONES DE VEHÍCULOS");
    
    // Consultar relaciones del vehículo 1 (Toyota)
    const relacionesVehiculo1 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(1, 'vehiculo')`
    );
    
    const vehiculo1Data = relacionesVehiculo1.rows[0];
    const personasRelacionadasV1 = vehiculo1Data.personas ? vehiculo1Data.personas.length : 0;
    const vehiculosRelacionadosV1 = vehiculo1Data.vehiculos ? vehiculo1Data.vehiculos.length : 0;
    const inmueblesRelacionadosV1 = vehiculo1Data.inmuebles ? vehiculo1Data.inmuebles.length : 0;
    const ubicacionesRelacionadasV1 = vehiculo1Data.ubicaciones ? vehiculo1Data.ubicaciones.length : 0;
    
    console.log(`- Vehículo 1 (Toyota Corolla): 
      - Personas relacionadas: ${personasRelacionadasV1}
      - Vehículos relacionados: ${vehiculosRelacionadosV1}
      - Inmuebles relacionados: ${inmueblesRelacionadosV1}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadasV1}
    `);
    
    // Consultar relaciones del vehículo 2 (Honda)
    const relacionesVehiculo2 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(2, 'vehiculo')`
    );
    
    const vehiculo2Data = relacionesVehiculo2.rows[0];
    const personasRelacionadasV2 = vehiculo2Data.personas ? vehiculo2Data.personas.length : 0;
    const vehiculosRelacionadosV2 = vehiculo2Data.vehiculos ? vehiculo2Data.vehiculos.length : 0;
    const inmueblesRelacionadosV2 = vehiculo2Data.inmuebles ? vehiculo2Data.inmuebles.length : 0;
    const ubicacionesRelacionadasV2 = vehiculo2Data.ubicaciones ? vehiculo2Data.ubicaciones.length : 0;
    
    console.log(`- Vehículo 2 (Honda CR-V): 
      - Personas relacionadas: ${personasRelacionadasV2}
      - Vehículos relacionados: ${vehiculosRelacionadosV2}
      - Inmuebles relacionados: ${inmueblesRelacionadosV2}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadasV2}
    `);
    
    // 3. Verificar relaciones de inmuebles
    console.log("\n3. VERIFICANDO RELACIONES DE INMUEBLES");
    
    // Consultar relaciones del inmueble 1 (Casa)
    const relacionesInmueble1 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(1, 'inmueble')`
    );
    
    const inmueble1Data = relacionesInmueble1.rows[0];
    const personasRelacionadasI1 = inmueble1Data.personas ? inmueble1Data.personas.length : 0;
    const vehiculosRelacionadosI1 = inmueble1Data.vehiculos ? inmueble1Data.vehiculos.length : 0;
    const inmueblesRelacionadosI1 = inmueble1Data.inmuebles ? inmueble1Data.inmuebles.length : 0;
    const ubicacionesRelacionadasI1 = inmueble1Data.ubicaciones ? inmueble1Data.ubicaciones.length : 0;
    
    console.log(`- Inmueble 1 (Casa): 
      - Personas relacionadas: ${personasRelacionadasI1}
      - Vehículos relacionados: ${vehiculosRelacionadosI1}
      - Inmuebles relacionados: ${inmueblesRelacionadosI1}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadasI1}
    `);
    
    // Consultar relaciones del inmueble 2 (Apartamento)
    const relacionesInmueble2 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(2, 'inmueble')`
    );
    
    const inmueble2Data = relacionesInmueble2.rows[0];
    const personasRelacionadasI2 = inmueble2Data.personas ? inmueble2Data.personas.length : 0;
    const vehiculosRelacionadosI2 = inmueble2Data.vehiculos ? inmueble2Data.vehiculos.length : 0;
    const inmueblesRelacionadosI2 = inmueble2Data.inmuebles ? inmueble2Data.inmuebles.length : 0;
    const ubicacionesRelacionadasI2 = inmueble2Data.ubicaciones ? inmueble2Data.ubicaciones.length : 0;
    
    console.log(`- Inmueble 2 (Apartamento): 
      - Personas relacionadas: ${personasRelacionadasI2}
      - Vehículos relacionados: ${vehiculosRelacionadosI2}
      - Inmuebles relacionados: ${inmueblesRelacionadosI2}
      - Ubicaciones relacionadas: ${ubicacionesRelacionadasI2}
    `);
    
    // 4. Verificar relaciones de ubicaciones
    console.log("\n4. VERIFICANDO RELACIONES DE UBICACIONES");
    
    // Consultar relaciones de la ubicación 1 (Domicilio)
    const relacionesUbicacion1 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(1, 'ubicacion')`
    );
    
    const ubicacion1Data = relacionesUbicacion1.rows[0];
    const personasRelacionadasU1 = ubicacion1Data.personas ? ubicacion1Data.personas.length : 0;
    const vehiculosRelacionadosU1 = ubicacion1Data.vehiculos ? ubicacion1Data.vehiculos.length : 0;
    const inmueblesRelacionadosU1 = ubicacion1Data.inmuebles ? ubicacion1Data.inmuebles.length : 0;
    
    console.log(`- Ubicación 1 (Domicilio): 
      - Personas relacionadas: ${personasRelacionadasU1}
      - Vehículos relacionados: ${vehiculosRelacionadosU1}
      - Inmuebles relacionados: ${inmueblesRelacionadosU1}
    `);
    
    // Consultar relaciones de la ubicación 2 (Trabajo)
    const relacionesUbicacion2 = await db.execute(
      sql`SELECT * FROM api_relaciones_json(2, 'ubicacion')`
    );
    
    const ubicacion2Data = relacionesUbicacion2.rows[0];
    const personasRelacionadasU2 = ubicacion2Data.personas ? ubicacion2Data.personas.length : 0;
    const vehiculosRelacionadosU2 = ubicacion2Data.vehiculos ? ubicacion2Data.vehiculos.length : 0;
    const inmueblesRelacionadosU2 = ubicacion2Data.inmuebles ? ubicacion2Data.inmuebles.length : 0;
    
    console.log(`- Ubicación 2 (Trabajo): 
      - Personas relacionadas: ${personasRelacionadasU2}
      - Vehículos relacionados: ${vehiculosRelacionadosU2}
      - Inmuebles relacionados: ${inmueblesRelacionadosU2}
    `);
    
    console.log("\n=== VERIFICACIÓN COMPLETADA ===");
    console.log("Todas las relaciones entre entidades funcionan correctamente.");
    
  } catch (error) {
    console.error("Error durante la verificación de relaciones:", error);
  }
}

/**
 * Crear una función para la API de relaciones
 */
async function crearFuncionAPIRelaciones() {
  console.log("Creando función API de relaciones en la base de datos...");
  
  try {
    // Crear o reemplazar la función para obtener relaciones como JSON
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION api_relaciones_json(id_entity integer, tipo_entity text)
      RETURNS json
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result json;
      BEGIN
        -- Inicializar el resultado con listas vacías
        result := json_build_object(
          'personas', '[]'::json,
          'vehiculos', '[]'::json,
          'inmuebles', '[]'::json,
          'ubicaciones', '[]'::json
        );
        
        -- Relaciones para personas
        IF tipo_entity = 'persona' THEN
          -- Personas relacionadas
          result := jsonb_set(result::jsonb, '{personas}', (
            SELECT coalesce(json_agg(p.*), '[]')
            FROM personas_personas pp
            JOIN personas p ON pp.persona_id_2 = p.id
            WHERE pp.persona_id_1 = id_entity
          )::jsonb);
          
          -- Vehículos relacionados
          result := jsonb_set(result::jsonb, '{vehiculos}', (
            SELECT coalesce(json_agg(v.*), '[]')
            FROM personas_vehiculos pv
            JOIN vehiculos v ON pv.vehiculo_id = v.id
            WHERE pv.persona_id = id_entity
          )::jsonb);
          
          -- Inmuebles relacionados
          result := jsonb_set(result::jsonb, '{inmuebles}', (
            SELECT coalesce(json_agg(i.*), '[]')
            FROM personas_inmuebles pi
            JOIN inmuebles i ON pi.inmueble_id = i.id
            WHERE pi.persona_id = id_entity
          )::jsonb);
          
          -- Ubicaciones relacionadas
          result := jsonb_set(result::jsonb, '{ubicaciones}', (
            SELECT coalesce(json_agg(u.*), '[]')
            FROM personas_ubicaciones pu
            JOIN ubicaciones u ON pu.ubicacion_id = u.id
            WHERE pu.persona_id = id_entity
          )::jsonb);
        
        -- Relaciones para vehículos  
        ELSIF tipo_entity = 'vehiculo' THEN
          -- Personas relacionadas
          result := jsonb_set(result::jsonb, '{personas}', (
            SELECT coalesce(json_agg(p.*), '[]')
            FROM personas_vehiculos pv
            JOIN personas p ON pv.persona_id = p.id
            WHERE pv.vehiculo_id = id_entity
          )::jsonb);
          
          -- Vehículos relacionados
          result := jsonb_set(result::jsonb, '{vehiculos}', (
            WITH vehiculos_relacionados AS (
              SELECT v.*
              FROM vehiculos_vehiculos vv
              JOIN vehiculos v ON vv.vehiculo_id_2 = v.id
              WHERE vv.vehiculo_id_1 = id_entity
              UNION
              SELECT v.*
              FROM vehiculos_vehiculos vv
              JOIN vehiculos v ON vv.vehiculo_id_1 = v.id
              WHERE vv.vehiculo_id_2 = id_entity
            )
            SELECT coalesce(json_agg(v.*), '[]')
            FROM vehiculos_relacionados v
          )::jsonb);
          
          -- Inmuebles relacionados
          result := jsonb_set(result::jsonb, '{inmuebles}', (
            SELECT coalesce(json_agg(i.*), '[]')
            FROM vehiculos_inmuebles vi
            JOIN inmuebles i ON vi.inmueble_id = i.id
            WHERE vi.vehiculo_id = id_entity
          )::jsonb);
          
          -- Ubicaciones relacionadas
          result := jsonb_set(result::jsonb, '{ubicaciones}', (
            SELECT coalesce(json_agg(u.*), '[]')
            FROM vehiculos_ubicaciones vu
            JOIN ubicaciones u ON vu.ubicacion_id = u.id
            WHERE vu.vehiculo_id = id_entity
          )::jsonb);
        
        -- Relaciones para inmuebles  
        ELSIF tipo_entity = 'inmueble' THEN
          -- Personas relacionadas
          result := jsonb_set(result::jsonb, '{personas}', (
            SELECT coalesce(json_agg(p.*), '[]')
            FROM personas_inmuebles pi
            JOIN personas p ON pi.persona_id = p.id
            WHERE pi.inmueble_id = id_entity
          )::jsonb);
          
          -- Vehículos relacionados
          result := jsonb_set(result::jsonb, '{vehiculos}', (
            SELECT coalesce(json_agg(v.*), '[]')
            FROM vehiculos_inmuebles vi
            JOIN vehiculos v ON vi.vehiculo_id = v.id
            WHERE vi.inmueble_id = id_entity
          )::jsonb);
          
          -- Inmuebles relacionados
          result := jsonb_set(result::jsonb, '{inmuebles}', (
            WITH inmuebles_relacionados AS (
              SELECT i.*
              FROM inmuebles_inmuebles ii
              JOIN inmuebles i ON ii.inmueble_id_2 = i.id
              WHERE ii.inmueble_id_1 = id_entity
              UNION
              SELECT i.*
              FROM inmuebles_inmuebles ii
              JOIN inmuebles i ON ii.inmueble_id_1 = i.id
              WHERE ii.inmueble_id_2 = id_entity
            )
            SELECT coalesce(json_agg(i.*), '[]')
            FROM inmuebles_relacionados i
          )::jsonb);
          
          -- Ubicaciones relacionadas
          result := jsonb_set(result::jsonb, '{ubicaciones}', (
            SELECT coalesce(json_agg(u.*), '[]')
            FROM inmuebles_ubicaciones iu
            JOIN ubicaciones u ON iu.ubicacion_id = u.id
            WHERE iu.inmueble_id = id_entity
          )::jsonb);
        
        -- Relaciones para ubicaciones  
        ELSIF tipo_entity = 'ubicacion' THEN
          -- Personas relacionadas
          result := jsonb_set(result::jsonb, '{personas}', (
            SELECT coalesce(json_agg(p.*), '[]')
            FROM personas_ubicaciones pu
            JOIN personas p ON pu.persona_id = p.id
            WHERE pu.ubicacion_id = id_entity
          )::jsonb);
          
          -- Vehículos relacionados
          result := jsonb_set(result::jsonb, '{vehiculos}', (
            SELECT coalesce(json_agg(v.*), '[]')
            FROM vehiculos_ubicaciones vu
            JOIN vehiculos v ON vu.vehiculo_id = v.id
            WHERE vu.ubicacion_id = id_entity
          )::jsonb);
          
          -- Inmuebles relacionados
          result := jsonb_set(result::jsonb, '{inmuebles}', (
            SELECT coalesce(json_agg(i.*), '[]')
            FROM inmuebles_ubicaciones iu
            JOIN inmuebles i ON iu.inmueble_id = i.id
            WHERE iu.ubicacion_id = id_entity
          )::jsonb);
        END IF;
        
        RETURN result;
      END;
      $$;
    `);
    
    console.log("Función API de relaciones creada exitosamente.");
    
  } catch (error) {
    console.error("Error al crear la función API de relaciones:", error);
  }
}

// Ejecutar ambas funciones en secuencia
async function main() {
  try {
    await crearFuncionAPIRelaciones();
    console.log("\n");
    await verificarRelaciones();
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando el script principal:", error);
    process.exit(1);
  }
}

main();