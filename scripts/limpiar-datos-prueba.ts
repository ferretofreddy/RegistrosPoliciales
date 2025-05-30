import { db } from "../server/db";
import { 
  personas, 
  vehiculos, 
  inmuebles, 
  ubicaciones,
  personasObservaciones,
  vehiculosObservaciones,
  inmueblesObservaciones,
  ubicacionesObservaciones,
  personasVehiculos,
  personasInmuebles,
  personasPersonas,
  personasUbicaciones,
  vehiculosUbicaciones,
  vehiculosInmuebles,
  vehiculosVehiculos,
  inmueblesUbicaciones,
  conversaciones,
  mensajes,
  archivosAdjuntos
} from "../shared/schema";

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

    // Eliminar relaciones primero (para evitar errores de foreign key)
    console.log("Eliminando relaciones...");
    await db.delete(personasPersonas);
    await db.delete(personasInmuebles);
    await db.delete(personasVehiculos);
    await db.delete(personasUbicaciones);
    await db.delete(vehiculosUbicaciones);
    await db.delete(vehiculosInmuebles);
    await db.delete(vehiculosVehiculos);
    await db.delete(inmueblesUbicaciones);

    // Eliminar observaciones
    console.log("Eliminando observaciones...");
    await db.delete(personasObservaciones);
    await db.delete(vehiculosObservaciones);
    await db.delete(inmueblesObservaciones);
    await db.delete(ubicacionesObservaciones);

    // Eliminar mensajería
    console.log("Eliminando mensajería...");
    await db.delete(archivosAdjuntos);
    await db.delete(mensajes);
    await db.delete(conversaciones);

    // Eliminar entidades principales
    console.log("Eliminando entidades principales...");
    await db.delete(personas);
    await db.delete(vehiculos);
    await db.delete(inmuebles);
    await db.delete(ubicaciones);

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