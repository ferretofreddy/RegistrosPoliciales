/**
 * Prueba directa de ubicaciones con observaciones
 * Crea registros y verifica que las observaciones se muestren correctamente
 */
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";

async function crearUbicacionConObservaciones() {
  console.log("=== CREANDO UBICACIÓN DE PRUEBA CON OBSERVACIONES ===\n");

  try {
    // 1. Crear ubicación
    const [ubicacion] = await db.insert(schema.ubicaciones).values({
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Avistamiento",
      observaciones: "Ubicación de prueba automatizada",
      fecha: new Date()
    }).returning();

    console.log("✓ Ubicación creada:", {
      id: ubicacion.id,
      tipo: ubicacion.tipo,
      observaciones: ubicacion.observaciones
    });

    // 2. Crear dos observaciones adicionales
    const observacion1 = await db.insert(schema.ubicacionesObservaciones).values({
      ubicacionId: ubicacion.id,
      detalle: "Primera observación: Movimiento sospechoso detectado en el área",
      usuario: "Sistema Automatizado",
      fecha: new Date()
    }).returning();

    const observacion2 = await db.insert(schema.ubicacionesObservaciones).values({
      ubicacionId: ubicacion.id,
      detalle: "Segunda observación: Confirmación de actividad irregular",
      usuario: "Sistema Automatizado", 
      fecha: new Date()
    }).returning();

    console.log("✓ Observación 1 creada:", observacion1[0]);
    console.log("✓ Observación 2 creada:", observacion2[0]);

    // 3. Crear relación con persona existente
    await db.insert(schema.personasUbicaciones).values({
      personaId: 6, // Manuel Pérez Mora
      ubicacionId: ubicacion.id
    });

    await db.insert(schema.vehiculosUbicaciones).values({
      vehiculoId: 3, // Nissan Frontier
      ubicacionId: ubicacion.id
    });

    console.log("✓ Relaciones creadas con persona y vehículo");

    // 4. Verificar que las observaciones se consultan correctamente
    const observacionesGuardadas = await db.select()
      .from(schema.ubicacionesObservaciones)
      .where(eq(schema.ubicacionesObservaciones.ubicacionId, ubicacion.id));

    console.log(`\n✓ Total observaciones verificadas: ${observacionesGuardadas.length}`);
    observacionesGuardadas.forEach((obs, index) => {
      console.log(`  Observación ${index + 1}:`, {
        id: obs.id,
        detalle: obs.detalle.substring(0, 50) + "...",
        usuario: obs.usuario
      });
    });

    // 5. Verificar relaciones
    const personasRelacionadas = await db
      .select({
        id: schema.personas.id,
        nombre: schema.personas.nombre,
        identificacion: schema.personas.identificacion
      })
      .from(schema.personas)
      .innerJoin(schema.personasUbicaciones, eq(schema.personas.id, schema.personasUbicaciones.personaId))
      .where(eq(schema.personasUbicaciones.ubicacionId, ubicacion.id));

    const vehiculosRelacionados = await db
      .select({
        id: schema.vehiculos.id,
        placa: schema.vehiculos.placa,
        marca: schema.vehiculos.marca,
        modelo: schema.vehiculos.modelo
      })
      .from(schema.vehiculos)
      .innerJoin(schema.vehiculosUbicaciones, eq(schema.vehiculos.id, schema.vehiculosUbicaciones.vehiculoId))
      .where(eq(schema.vehiculosUbicaciones.ubicacionId, ubicacion.id));

    console.log("\n✓ Relaciones verificadas:");
    console.log(`  Personas: ${personasRelacionadas.length}`);
    personasRelacionadas.forEach(p => console.log(`    - ${p.nombre} (${p.identificacion})`));
    console.log(`  Vehículos: ${vehiculosRelacionados.length}`);
    vehiculosRelacionados.forEach(v => console.log(`    - ${v.marca} ${v.modelo} (${v.placa})`));

    console.log(`\n🎯 UBICACIÓN CREADA EXITOSAMENTE`);
    console.log(`📍 ID: ${ubicacion.id}`);
    console.log(`📝 Observaciones: ${observacionesGuardadas.length + 1} (1 principal + ${observacionesGuardadas.length} adicionales)`);
    console.log(`🔗 Relaciones: ${personasRelacionadas.length + vehiculosRelacionados.length}`);
    console.log(`\n👁️ Puedes verificar esta ubicación en /consultas buscando el ID ${ubicacion.id}`);

    return ubicacion.id;

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

async function main() {
  try {
    await crearUbicacionConObservaciones();
    console.log("\n✅ Prueba completada exitosamente");
  } catch (error) {
    console.error("💥 Error en la prueba:", error);
  } finally {
    process.exit(0);
  }
}

main();