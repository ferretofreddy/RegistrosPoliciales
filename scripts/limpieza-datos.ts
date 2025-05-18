import { db } from "../server/db";
import { personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones } from "../shared/schema";
import { personas, vehiculos, inmuebles, ubicaciones } from "../shared/schema";
import { personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones } from "../shared/schema";
import { vehiculosUbicaciones, inmueblesUbicaciones } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Este script limpia los datos de las tablas principales y sus relaciones
 * pero NO limpia las tablas de tipos (tipo_inmuebles y tipo_ubicaciones)
 */
async function limpiarDatos() {
  console.log("Iniciando limpieza de datos...");
  
  try {
    // PASO 1: Eliminar datos de tablas de relaciones
    console.log("Eliminando datos de tablas de relaciones...");
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
    
    // PASO 2: Eliminar datos de tablas de observaciones
    console.log("Eliminando datos de tablas de observaciones...");
    await db.delete(personasObservaciones);
    console.log("- personasObservaciones limpiada");
    
    await db.delete(vehiculosObservaciones);
    console.log("- vehiculosObservaciones limpiada");
    
    await db.delete(inmueblesObservaciones);
    console.log("- inmueblesObservaciones limpiada");
    
    await db.delete(ubicacionesObservaciones);
    console.log("- ubicacionesObservaciones limpiada");
    
    // PASO 3: Eliminar datos de tablas principales
    console.log("Eliminando datos de tablas principales...");
    await db.delete(personas);
    console.log("- personas limpiada");
    
    await db.delete(vehiculos);
    console.log("- vehiculos limpiada");
    
    await db.delete(inmuebles);
    console.log("- inmuebles limpiada");
    
    await db.delete(ubicaciones);
    console.log("- ubicaciones limpiada");
    
    // PASO 4: Restablecer secuencias de IDs
    console.log("Restableciendo secuencias de IDs...");
    
    // Restablecer secuencia de ID para personas
    await db.execute(sql`ALTER SEQUENCE personas_id_seq RESTART WITH 1`);
    console.log("- secuencia personas_id_seq restablecida");
    
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
    
    console.log("¡Limpieza de datos completada con éxito!");
    console.log("NOTA: Las tablas tipo_inmuebles y tipo_ubicaciones NO han sido modificadas, según lo solicitado.");
    
  } catch (error) {
    console.error("Error durante la limpieza de datos:", error);
  }
}

limpiarDatos()
  .then(() => {
    console.log("Script finalizado. La base de datos ha sido limpiada.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error ejecutando el script:", error);
    process.exit(1);
  });