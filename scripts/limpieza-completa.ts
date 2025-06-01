import { db } from "../server/db";
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasObservaciones, vehiculosObservaciones, 
  inmueblesObservaciones, ubicacionesObservaciones,
  personasVehiculos, personasInmuebles, vehiculosInmuebles,
  inmueblesUbicaciones, vehiculosUbicaciones, vehiculosVehiculos,
  personasUbicaciones, personasPersonas,
  mensajes, archivosAdjuntos, conversaciones
} from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script de limpieza completa que preserva:
 * - users (usuarios y sesiones)
 * - tipos_identificacion
 * - tipos_inmuebles 
 * - tipos_ubicaciones
 * - posicion_estructura
 */
async function limpiezaCompleta() {
  try {
    console.log("🧹 Iniciando limpieza completa de la base de datos...");
    
    // Eliminar archivos adjuntos primero (referencia a mensajes)
    await db.delete(archivosAdjuntos);
    console.log("✅ Archivos adjuntos eliminados");
    
    // Eliminar mensajes
    await db.delete(mensajes);
    console.log("✅ Mensajes eliminados");
    
    // Eliminar conversaciones
    await db.delete(conversaciones);
    console.log("✅ Conversaciones eliminadas");
    
    // Eliminar todas las relaciones entre entidades
    await db.delete(personasUbicaciones);
    await db.delete(inmueblesInmuebles);
    await db.delete(vehiculosUbicaciones);
    await db.delete(inmueblesUbicaciones);
    await db.delete(vehiculosInmuebles);
    await db.delete(vehiculosVehiculos);
    await db.delete(personasInmuebles);
    await db.delete(personasVehiculos);
    console.log("✅ Todas las relaciones entre entidades eliminadas");
    
    // Eliminar observaciones
    await db.delete(ubicacionesObservaciones);
    await db.delete(inmueblesObservaciones);
    await db.delete(vehiculosObservaciones);
    await db.delete(personasObservaciones);
    console.log("✅ Todas las observaciones eliminadas");
    
    // Eliminar entidades principales
    await db.delete(ubicaciones);
    console.log("✅ Ubicaciones eliminadas");
    
    await db.delete(inmuebles);
    console.log("✅ Inmuebles eliminados");
    
    await db.delete(vehiculos);
    console.log("✅ Vehículos eliminados");
    
    await db.delete(personas);
    console.log("✅ Personas eliminadas");
    
    // Reiniciar secuencias de IDs para las tablas limpiadas
    const tablasParaReiniciar = [
      'personas', 'vehiculos', 'inmuebles', 'ubicaciones',
      'personas_observaciones', 'vehiculos_observaciones', 
      'inmuebles_observaciones', 'ubicaciones_observaciones',
      'mensajes', 'archivos_adjuntos', 'conversaciones'
    ];
    
    for (const tabla of tablasParaReiniciar) {
      try {
        await db.execute(sql.raw(`ALTER SEQUENCE ${tabla}_id_seq RESTART WITH 1;`));
        console.log(`🔄 Secuencia reiniciada para ${tabla}`);
      } catch (error) {
        console.log(`⚠️  No se pudo reiniciar secuencia para ${tabla} (puede no existir)`);
      }
    }
    
    // Verificar tablas preservadas
    console.log("\n📋 Verificando tablas preservadas:");
    
    const verificaciones = [
      { query: sql`SELECT COUNT(*) as count FROM users`, tabla: "users" },
      { query: sql`SELECT COUNT(*) as count FROM tipos_identificacion`, tabla: "tipos_identificacion" },
      { query: sql`SELECT COUNT(*) as count FROM tipos_inmuebles`, tabla: "tipos_inmuebles" },
      { query: sql`SELECT COUNT(*) as count FROM tipos_ubicaciones`, tabla: "tipos_ubicaciones" },
      { query: sql`SELECT COUNT(*) as count FROM posicion_estructura`, tabla: "posicion_estructura" }
    ];
    
    for (const { query, tabla } of verificaciones) {
      try {
        const result = await db.execute(query);
        const count = result.rows[0]?.count || 0;
        console.log(`✅ ${tabla}: ${count} registros preservados`);
      } catch (error) {
        console.log(`⚠️  Error al verificar ${tabla}:`, error);
      }
    }
    
    console.log("\n🎉 Limpieza completa finalizada exitosamente");
    console.log("📌 Tablas preservadas: users, tipos_identificacion, tipos_inmuebles, tipos_ubicaciones, posicion_estructura");
    
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
}

// Ejecutar script si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  limpiezaCompleta()
    .then(() => {
      console.log("✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error fatal:", error);
      process.exit(1);
    });
}

export { limpiezaCompleta };