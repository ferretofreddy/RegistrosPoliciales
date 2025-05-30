import { db } from "../server/db";
import * as schema from "../shared/schema";

/**
 * Este script limpia todos los datos de prueba, conservando únicamente:
 * - users (usuarios)
 * - posicion_estructura
 * - tipos_inmuebles
 * - tipos_ubicaciones
 */
async function limpiarDatosPrueba() {
  try {
    console.log("🧹 Iniciando limpieza de datos de prueba...");

    // Usar SQL directo para eliminar con CASCADE o deshabilitar constraints temporalmente
    console.log("Eliminando todos los datos relacionados...");
    
    // Eliminar archivos adjuntos primero
    await db.delete(schema.archivosAdjuntos);
    
    // Eliminar mensajes
    await db.delete(schema.mensajes);
    
    // Eliminar conversaciones
    await db.delete(schema.conversaciones);
    
    // Eliminar todas las observaciones
    await db.delete(schema.personasObservaciones);
    await db.delete(schema.vehiculosObservaciones);
    await db.delete(schema.inmueblesObservaciones);
    await db.delete(schema.ubicacionesObservaciones);
    
    // Eliminar todas las relaciones (orden importante para foreign keys)
    const relationTables = [
      'personas_personas',
      'personas_inmuebles', 
      'personas_vehiculos',
      'personas_ubicaciones',
      'vehiculos_ubicaciones',
      'vehiculos_inmuebles', 
      'vehiculos_vehiculos',
      'inmuebles_ubicaciones',
      'inmuebles_inmuebles',
      'ubicaciones_ubicaciones'
    ];
    
    for (const table of relationTables) {
      try {
        await db.execute(`DELETE FROM "${table}"`);
        console.log(`  ✓ Limpiada tabla: ${table}`);
      } catch (error: any) {
        console.log(`  - Tabla ${table} no existe o ya está vacía`);
      }
    }
    
    // Eliminar entidades principales
    console.log("Eliminando entidades principales...");
    await db.delete(schema.personas);
    await db.delete(schema.vehiculos);
    await db.delete(schema.inmuebles);
    await db.delete(schema.ubicaciones);

    console.log("✅ Limpieza completada exitosamente!");
    console.log("📋 Datos conservados:");
    console.log("   - Usuarios (users)");
    console.log("   - Posiciones de estructura (posicion_estructura)");
    console.log("   - Tipos de inmuebles (tipos_inmuebles)");
    console.log("   - Tipos de ubicaciones (tipos_ubicaciones)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  }
}

// Ejecutar el script
limpiarDatosPrueba();