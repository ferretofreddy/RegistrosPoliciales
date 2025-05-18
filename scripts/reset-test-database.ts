import { db } from "../server/db";
import { 
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones,
  personas, vehiculos, inmuebles, ubicaciones,
  personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones,
  vehiculosUbicaciones, inmueblesUbicaciones
} from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Este script limpia todos los datos de prueba, preservando los datos de configuración
 * como tipos_inmuebles y tipos_ubicaciones.
 */
async function resetTestDatabase() {
  console.log("=== INICIANDO LIMPIEZA DE BASE DE DATOS ===");
  
  try {
    console.log("1. Eliminando datos de tablas de relaciones...");
    
    // Limpiar relaciones entre vehículos (tabla no definida en drizzle)
    await db.execute(sql`DELETE FROM vehiculos_vehiculos`);
    console.log("- vehiculos_vehiculos limpiada");
    
    // Limpiar relaciones entre vehículos e inmuebles (tabla no definida en drizzle)
    await db.execute(sql`DELETE FROM vehiculos_inmuebles`);
    console.log("- vehiculos_inmuebles limpiada");
    
    // Limpiar relaciones entre inmuebles (tabla no definida en drizzle)
    await db.execute(sql`DELETE FROM inmuebles_inmuebles`);
    console.log("- inmuebles_inmuebles limpiada");
    
    // Limpiar relaciones definidas en drizzle
    await db.delete(personasVehiculos);
    console.log("- personasVehiculos limpiada");
    
    await db.delete(personasInmuebles);
    console.log("- personasInmuebles limpiada");
    
    await db.delete(personasPersonas);
    console.log("- personasPersonas limpiada");
    
    await db.delete(personasUbicaciones);
    console.log("- personasUbicaciones limpiada");
    
    await db.delete(vehiculosUbicaciones);
    console.log("- vehiculosUbicaciones limpiada");
    
    await db.delete(inmueblesUbicaciones);
    console.log("- inmueblesUbicaciones limpiada");
    
    console.log("2. Eliminando datos de tablas de observaciones...");
    await db.delete(personasObservaciones);
    console.log("- personasObservaciones limpiada");
    
    await db.delete(vehiculosObservaciones);
    console.log("- vehiculosObservaciones limpiada");
    
    await db.delete(inmueblesObservaciones);
    console.log("- inmueblesObservaciones limpiada");
    
    await db.delete(ubicacionesObservaciones);
    console.log("- ubicacionesObservaciones limpiada");
    
    console.log("3. Eliminando datos de tablas principales...");
    await db.delete(personas).where(sql`id > 1`); // Preservar el usuario inicial
    console.log("- personas limpiada (preservando usuario inicial)");
    
    await db.delete(vehiculos);
    console.log("- vehiculos limpiada");
    
    await db.delete(inmuebles);
    console.log("- inmuebles limpiada");
    
    await db.delete(ubicaciones);
    console.log("- ubicaciones limpiada");
    
    console.log("4. Restableciendo secuencias de IDs...");
    
    // Restablecer secuencia de ID para personas
    await db.execute(sql`ALTER SEQUENCE personas_id_seq RESTART WITH 2`);
    console.log("- secuencia personas_id_seq restablecida (desde 2)");
    
    // Restablecer secuencia de ID para vehiculos
    await db.execute(sql`ALTER SEQUENCE vehiculos_id_seq RESTART WITH 1`);
    console.log("- secuencia vehiculos_id_seq restablecida");
    
    // Restablecer secuencia de ID para inmuebles
    await db.execute(sql`ALTER SEQUENCE inmuebles_id_seq RESTART WITH 1`);
    console.log("- secuencia inmuebles_id_seq restablecida");
    
    // Restablecer secuencia de ID para ubicaciones
    await db.execute(sql`ALTER SEQUENCE ubicaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia ubicaciones_id_seq restablecida");
    
    // Restablecer secuencia de ID para observaciones
    await db.execute(sql`ALTER SEQUENCE personas_observaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_observaciones_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE vehiculos_observaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia vehiculos_observaciones_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE inmuebles_observaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia inmuebles_observaciones_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE ubicaciones_observaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia ubicaciones_observaciones_id_seq restablecida");
    
    // Restablecer secuencia de ID para relaciones
    await db.execute(sql`ALTER SEQUENCE personas_vehiculos_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_vehiculos_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE personas_inmuebles_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_inmuebles_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE personas_personas_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_personas_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE personas_ubicaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_ubicaciones_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE vehiculos_ubicaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia vehiculos_ubicaciones_id_seq restablecida");
    
    await db.execute(sql`ALTER SEQUENCE inmuebles_ubicaciones_id_seq RESTART WITH 1`);
    console.log("- secuencia inmuebles_ubicaciones_id_seq restablecida");
    
    // Limpiar y restablecer las secuencias para tablas no definidas en drizzle
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_class WHERE relname = 'vehiculos_vehiculos_id_seq') THEN
          ALTER SEQUENCE vehiculos_vehiculos_id_seq RESTART WITH 1;
        END IF;
      END
      $$;
    `);
    console.log("- secuencia vehiculos_vehiculos_id_seq restablecida (si existe)");
    
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_class WHERE relname = 'vehiculos_inmuebles_id_seq') THEN
          ALTER SEQUENCE vehiculos_inmuebles_id_seq RESTART WITH 1;
        END IF;
      END
      $$;
    `);
    console.log("- secuencia vehiculos_inmuebles_id_seq restablecida (si existe)");
    
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM pg_class WHERE relname = 'inmuebles_inmuebles_id_seq') THEN
          ALTER SEQUENCE inmuebles_inmuebles_id_seq RESTART WITH 1;
        END IF;
      END
      $$;
    `);
    console.log("- secuencia inmuebles_inmuebles_id_seq restablecida (si existe)");
    
    console.log("\n=== LIMPIEZA DE BASE DE DATOS COMPLETADA ===");
    console.log("Nota: Los datos de configuración (tipos_inmuebles y tipos_ubicaciones) han sido preservados.");
    
  } catch (error) {
    console.error("Error durante la limpieza de la base de datos:", error);
  }
}

// Ejecutar el script
resetTestDatabase()
  .then(() => {
    console.log("Script finalizado. La base de datos ha sido limpiada y restablecida.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando el script:", error);
    process.exit(1);
  });