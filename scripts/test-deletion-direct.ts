import { db } from "../server/db";
import { 
  vehiculosInmuebles, inmueblesUbicaciones,
  inmueblesInmuebles, ubicacionesUbicaciones
} from "../shared/schema";
import { and, eq, or } from "drizzle-orm";

async function testDeletionDirect() {
  console.log('🧪 Probando eliminación directa de relaciones...\n');

  try {
    // Test 1: inmueble → vehiculo
    console.log('Test 1: Eliminando inmueble → vehiculo');
    console.log('Parámetros: tipoOrigen="inmueble", idOrigen=1, tipoDestino="vehiculo", idDestino=1');
    
    const tipoOrigen = "inmueble";
    const tipoDestino = "vehiculo";
    const id1 = 1; // inmueble
    const id2 = 1; // vehiculo
    
    console.log(`Evaluando caso: ${tipoOrigen} → ${tipoDestino}`);
    
    let deleteResult;
    
    if (tipoOrigen === "inmueble" && tipoDestino === "vehiculo") {
      console.log('✅ Caso encontrado: inmueble → vehiculo');
      deleteResult = await db.delete(vehiculosInmuebles)
        .where(and(
          eq(vehiculosInmuebles.vehiculoId, id2),
          eq(vehiculosInmuebles.inmuebleId, id1)
        ))
        .returning();
    } else {
      console.log('❌ Caso NO encontrado');
    }
    
    console.log('Resultado de eliminación:', deleteResult);
    
    // Test 2: ubicacion → inmueble
    console.log('\nTest 2: Eliminando ubicacion → inmueble');
    
    // Primero crear la relación
    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: 1,
      ubicacionId: 1
    }).onConflictDoNothing();
    
    const tipoOrigen2 = "ubicacion";
    const tipoDestino2 = "inmueble";
    const id1_2 = 1; // ubicacion
    const id2_2 = 1; // inmueble
    
    console.log(`Evaluando caso: ${tipoOrigen2} → ${tipoDestino2}`);
    
    if (tipoOrigen2 === "ubicacion" && tipoDestino2 === "inmueble") {
      console.log('✅ Caso encontrado: ubicacion → inmueble');
      deleteResult = await db.delete(inmueblesUbicaciones)
        .where(and(
          eq(inmueblesUbicaciones.inmuebleId, id2_2),
          eq(inmueblesUbicaciones.ubicacionId, id1_2)
        ))
        .returning();
    } else {
      console.log('❌ Caso NO encontrado');
    }
    
    console.log('Resultado de eliminación:', deleteResult);
    
    console.log('\n✅ Pruebas completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

testDeletionDirect().catch(console.error);