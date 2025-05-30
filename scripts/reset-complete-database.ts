import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Este script limpia completamente la base de datos, restablece las secuencias de IDs,
 * pero conserva las tablas de configuración: tipos_inmuebles, tipos_ubicaciones, posicion_estructura y users
 */
async function resetCompleteDatabase() {
  try {
    console.log("🧹 Limpiando base de datos completa...");

    // 1. Eliminar todas las relaciones primero
    console.log("Eliminando relaciones...");
    await db.execute(sql`DELETE FROM personas_personas`);
    await db.execute(sql`DELETE FROM personas_vehiculos`);
    await db.execute(sql`DELETE FROM personas_inmuebles`);
    await db.execute(sql`DELETE FROM personas_ubicaciones`);
    await db.execute(sql`DELETE FROM vehiculos_ubicaciones`);
    await db.execute(sql`DELETE FROM vehiculos_inmuebles`);
    await db.execute(sql`DELETE FROM vehiculos_vehiculos`);
    await db.execute(sql`DELETE FROM inmuebles_ubicaciones`);
    await db.execute(sql`DELETE FROM inmuebles_inmuebles`);
    await db.execute(sql`DELETE FROM ubicaciones_ubicaciones`);

    // 2. Eliminar observaciones
    console.log("Eliminando observaciones...");
    await db.execute(sql`DELETE FROM personas_observaciones`);
    await db.execute(sql`DELETE FROM vehiculos_observaciones`);
    await db.execute(sql`DELETE FROM inmuebles_observaciones`);
    await db.execute(sql`DELETE FROM ubicaciones_observaciones`);

    // 3. Eliminar mensajería completa
    console.log("Eliminando mensajería...");
    await db.execute(sql`DELETE FROM archivos_adjuntos`);
    await db.execute(sql`DELETE FROM mensajes`);
    await db.execute(sql`DELETE FROM conversaciones`);

    // 4. Eliminar entidades principales
    console.log("Eliminando entidades principales...");
    await db.execute(sql`DELETE FROM personas`);
    await db.execute(sql`DELETE FROM vehiculos`);
    await db.execute(sql`DELETE FROM inmuebles`);
    await db.execute(sql`DELETE FROM ubicaciones`);

    // 5. Restablecer secuencias de IDs a 1
    console.log("Restableciendo secuencias de IDs...");
    
    // Secuencias de entidades principales
    await db.execute(sql`ALTER SEQUENCE personas_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE vehiculos_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE inmuebles_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE ubicaciones_id_seq RESTART WITH 1`);
    
    // Secuencias de observaciones
    await db.execute(sql`ALTER SEQUENCE personas_observaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE vehiculos_observaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE inmuebles_observaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE ubicaciones_observaciones_id_seq RESTART WITH 1`);
    
    // Secuencias de relaciones
    await db.execute(sql`ALTER SEQUENCE personas_personas_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE personas_vehiculos_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE personas_inmuebles_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE personas_ubicaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE vehiculos_ubicaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE vehiculos_inmuebles_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE vehiculos_vehiculos_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE inmuebles_ubicaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE inmuebles_inmuebles_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE ubicaciones_ubicaciones_id_seq RESTART WITH 1`);
    
    // Secuencias de mensajería
    await db.execute(sql`ALTER SEQUENCE conversaciones_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE mensajes_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE archivos_adjuntos_id_seq RESTART WITH 1`);

    console.log("✅ Base de datos limpiada exitosamente!");
    console.log("📊 Estado después de la limpieza:");
    console.log("   ✅ Tablas conservadas:");
    console.log("      - users (usuarios del sistema)");
    console.log("      - posicion_estructura");
    console.log("      - tipos_inmuebles");
    console.log("      - tipos_ubicaciones");
    console.log("");
    console.log("   🧹 Tablas limpiadas y secuencias restablecidas:");
    console.log("      - personas, vehiculos, inmuebles, ubicaciones");
    console.log("      - Todas las observaciones");
    console.log("      - Todas las relaciones");
    console.log("      - Sistema de mensajería completo");
    console.log("");
    console.log("🔢 Todos los IDs comenzarán desde 1 para nuevos registros");

    // Verificar conteos finales
    const personasResult = await db.execute(sql`SELECT COUNT(*) as count FROM personas`);
    const vehiculosResult = await db.execute(sql`SELECT COUNT(*) as count FROM vehiculos`);
    const inmueblesResult = await db.execute(sql`SELECT COUNT(*) as count FROM inmuebles`);
    const ubicacionesResult = await db.execute(sql`SELECT COUNT(*) as count FROM ubicaciones`);
    const mensajesResult = await db.execute(sql`SELECT COUNT(*) as count FROM mensajes`);
    
    console.log("");
    console.log("🔍 Verificación final:");
    console.log(`   - Personas: ${personasResult.rows[0].count}`);
    console.log(`   - Vehículos: ${vehiculosResult.rows[0].count}`);
    console.log(`   - Inmuebles: ${inmueblesResult.rows[0].count}`);
    console.log(`   - Ubicaciones: ${ubicacionesResult.rows[0].count}`);
    console.log(`   - Mensajes: ${mensajesResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error limpiando la base de datos:", error);
    process.exit(1);
  }
}

// Ejecutar el script
resetCompleteDatabase();