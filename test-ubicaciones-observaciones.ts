/**
 * Script de prueba para ubicaciones con observaciones
 */
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";

async function testUbicacionObservaciones() {
  console.log("=== PRUEBA DE UBICACIONES CON OBSERVACIONES ===");
  
  try {
    // 1. Crear una ubicación de prueba
    const [nuevaUbicacion] = await db.insert(schema.ubicaciones).values({
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Avistamiento",
      observaciones: "Avistamiento de vehículo de prueba",
      fecha: new Date()
    }).returning();
    
    console.log("✓ Ubicación creada:", nuevaUbicacion);
    
    // 2. Crear observaciones adicionales
    const observacion1 = await db.insert(schema.ubicacionesObservaciones).values({
      ubicacionId: nuevaUbicacion.id,
      detalle: "Primera observación de prueba - comportamiento sospechoso",
      usuario: "Usuario Test",
      fecha: new Date()
    }).returning();
    
    console.log("✓ Observación 1 creada:", observacion1[0]);
    
    const observacion2 = await db.insert(schema.ubicacionesObservaciones).values({
      ubicacionId: nuevaUbicacion.id,
      detalle: "Segunda observación de prueba - vehículo estacionado por tiempo prolongado",
      usuario: "Usuario Test",
      fecha: new Date()
    }).returning();
    
    console.log("✓ Observación 2 creada:", observacion2[0]);
    
    // 3. Verificar que se guardaron correctamente
    const observacionesGuardadas = await db.select()
      .from(schema.ubicacionesObservaciones)
      .where(eq(schema.ubicacionesObservaciones.ubicacionId, nuevaUbicacion.id));
    
    console.log(`✓ Total observaciones guardadas: ${observacionesGuardadas.length}`);
    observacionesGuardadas.forEach((obs, index) => {
      console.log(`  Observación ${index + 1}:`, obs);
    });
    
    // 4. Crear relación con vehículo (ID 3 - Nissan Frontier)
    await db.insert(schema.vehiculosUbicaciones).values({
      vehiculoId: 3,
      ubicacionId: nuevaUbicacion.id
    });
    
    console.log("✓ Relación con vehículo creada");
    
    // 5. Probar la API de observaciones simulando el endpoint
    console.log("\n=== PRUEBA DE ENDPOINT OBSERVACIONES ===");
    
    // Simular datos que enviaría el frontend
    const datosObservacion = {
      detalle: "Tercera observación desde frontend simulado",
      fecha: new Date()
    };
    
    // Simular validación del esquema
    const resultadoValidacion = schema.insertUbicacionObservacionSchema.safeParse({
      ...datosObservacion,
      ubicacionId: nuevaUbicacion.id,
      usuario: "Freddy Ferreto Tenorio"
    });
    
    if (resultadoValidacion.success) {
      const [observacion3] = await db.insert(schema.ubicacionesObservaciones)
        .values(resultadoValidacion.data)
        .returning();
      
      console.log("✓ Observación desde endpoint simulado:", observacion3);
    } else {
      console.error("❌ Error de validación:", resultadoValidacion.error.format());
    }
    
    // 6. Verificar total final
    const observacionesFinales = await db.select()
      .from(schema.ubicacionesObservaciones)
      .where(eq(schema.ubicacionesObservaciones.ubicacionId, nuevaUbicacion.id));
    
    console.log(`\n✓ TOTAL FINAL: ${observacionesFinales.length} observaciones`);
    
    return nuevaUbicacion.id;
    
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
    throw error;
  }
}

async function main() {
  try {
    const ubicacionId = await testUbicacionObservaciones();
    console.log(`\n✓ Prueba completada exitosamente. ID de ubicación: ${ubicacionId}`);
    console.log("Puedes consultar esta ubicación en /consultas para verificar las observaciones");
  } catch (error) {
    console.error("❌ Error en main:", error);
  } finally {
    process.exit(0);
  }
}

main();