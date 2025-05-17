import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Este script limpia todas las tablas y restablece las secuencias de IDs
 */
async function resetDatabase() {
  console.log("🗑️ Iniciando limpieza de base de datos...");

  try {
    // Usar un enfoque alternativo sin cambiar session_replication_role
    
    // 1. Eliminar todas las tablas de relaciones primero
    console.log("Limpiando tablas de relaciones...");
    await db.execute(sql`DELETE FROM personas_vehiculos`);
    await db.execute(sql`DELETE FROM personas_inmuebles`);
    await db.execute(sql`DELETE FROM personas_ubicaciones`);
    await db.execute(sql`DELETE FROM personas_personas`);
    await db.execute(sql`DELETE FROM vehiculos_inmuebles`);
    await db.execute(sql`DELETE FROM vehiculos_ubicaciones`);
    await db.execute(sql`DELETE FROM vehiculos_vehiculos`);
    await db.execute(sql`DELETE FROM inmuebles_ubicaciones`);
    await db.execute(sql`DELETE FROM inmuebles_inmuebles`);
    
    // 2. Limpiar tablas de observaciones
    console.log("Limpiando tablas de observaciones...");
    await db.execute(sql`DELETE FROM personas_observaciones`);
    await db.execute(sql`DELETE FROM vehiculos_observaciones`);
    await db.execute(sql`DELETE FROM inmuebles_observaciones`);
    
    // 3. Limpiar tablas principales
    console.log("Limpiando tablas principales...");
    await db.execute(sql`DELETE FROM ubicaciones`);
    await db.execute(sql`DELETE FROM inmuebles`);
    await db.execute(sql`DELETE FROM vehiculos`);
    await db.execute(sql`DELETE FROM personas`);
    await db.execute(sql`DELETE FROM tipos_inmuebles`);
    await db.execute(sql`DELETE FROM tipos_ubicaciones`);
    
    // 4. Limpiar usuarios excepto el admin con ID 1
    await db.execute(sql`DELETE FROM users WHERE id > 1`);

    // 5. Restablecer secuencias a 1
    console.log("Restableciendo secuencias de IDs...");
    try {
      await db.execute(sql`SELECT setval('personas_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('personas_observaciones_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('vehiculos_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('vehiculos_observaciones_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('inmuebles_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('inmuebles_observaciones_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('ubicaciones_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('tipos_inmuebles_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('tipos_ubicaciones_id_seq', 1, false)`);
      await db.execute(sql`SELECT setval('users_id_seq', 1, false)`);
      console.log("Secuencias restablecidas correctamente.");
    } catch (error) {
      console.error("Error al restablecer secuencias:", error);
    }
    
    console.log("✅ Base de datos limpiada exitosamente y secuencias restablecidas!");
  } catch (error) {
    console.error("❌ Error durante la limpieza de la base de datos:", error);
  } finally {
    // Pequeña pausa para asegurar que todos los logs se impriman
    setTimeout(() => process.exit(0), 500);
  }
}

resetDatabase();