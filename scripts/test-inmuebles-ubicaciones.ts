import { db } from "../server/db";
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones,
  inmueblesInmuebles, ubicacionesUbicaciones
} from "../shared/schema";

/**
 * Script para probar eliminaciones de relaciones desde inmuebles y ubicaciones
 */
async function testInmueblesUbicaciones() {
  console.log('🧪 Iniciando pruebas de eliminación para inmuebles y ubicaciones...\n');

  try {
    // 1. Crear registros de prueba si no existen
    console.log('📝 Creando registros de prueba...');
    
    // Crear personas de prueba
    const [persona1] = await db.insert(personas).values({
      nombre: "TEST Persona 1",
      tipoIdentificacionId: 1,
      identificacion: "TEST001"
    }).onConflictDoNothing().returning();

    // Crear vehículos de prueba
    const [vehiculo1] = await db.insert(vehiculos).values({
      placa: "TEST001",
      marca: "TEST",
      modelo: "TEST",
      color: "TEST"
    }).onConflictDoNothing().returning();

    // Crear inmuebles de prueba
    const [inmueble1, inmueble2] = await db.insert(inmuebles).values([
      {
        tipo: "TEST Casa",
        direccion: "TEST Dirección 1"
      },
      {
        tipo: "TEST Apartamento", 
        direccion: "TEST Dirección 2"
      }
    ]).onConflictDoNothing().returning();

    // Crear ubicaciones de prueba
    const [ubicacion1, ubicacion2] = await db.insert(ubicaciones).values([
      {
        nombre: "TEST Ubicación 1",
        tipoUbicacionId: 1,
        latitud: 9.9281,
        longitud: -84.0907
      },
      {
        nombre: "TEST Ubicación 2",
        tipoUbicacionId: 1,
        latitud: 9.9285,
        longitud: -84.0910
      }
    ]).onConflictDoNothing().returning();

    console.log('✅ Registros de prueba creados');
    console.log(`   Persona: ${persona1?.id}`);
    console.log(`   Vehículo: ${vehiculo1?.id}`);
    console.log(`   Inmuebles: ${inmueble1?.id}, ${inmueble2?.id}`);
    console.log(`   Ubicaciones: ${ubicacion1?.id}, ${ubicacion2?.id}\n`);

    // 2. Crear relaciones de prueba
    console.log('🔗 Creando relaciones de prueba...');

    // Relaciones desde inmuebles
    await db.insert(vehiculosInmuebles).values({
      vehiculoId: vehiculo1.id,
      inmuebleId: inmueble1.id
    }).onConflictDoNothing();

    await db.insert(personasInmuebles).values({
      personaId: persona1.id,
      inmuebleId: inmueble1.id
    }).onConflictDoNothing();

    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmueble1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(inmueblesInmuebles).values({
      inmuebleId1: inmueble1.id,
      inmuebleId2: inmueble2.id
    }).onConflictDoNothing();

    // Relaciones desde ubicaciones
    await db.insert(vehiculosUbicaciones).values({
      vehiculoId: vehiculo1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(personasUbicaciones).values({
      personaId: persona1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(ubicacionesUbicaciones).values({
      ubicacionId1: ubicacion1.id,
      ubicacionId2: ubicacion2.id
    }).onConflictDoNothing();

    console.log('✅ Relaciones de prueba creadas\n');

    // 3. Probar eliminaciones desde inmuebles
    console.log('🧪 Probando eliminaciones desde INMUEBLES...');
    
    const testCasesInmuebles = [
      { origen: 'inmueble', destino: 'vehiculo', idOrigen: inmueble1.id, idDestino: vehiculo1.id },
      { origen: 'inmueble', destino: 'persona', idOrigen: inmueble1.id, idDestino: persona1.id },
      { origen: 'inmueble', destino: 'ubicacion', idOrigen: inmueble1.id, idDestino: ubicacion1.id },
      { origen: 'inmueble', destino: 'inmueble', idOrigen: inmueble1.id, idDestino: inmueble2.id }
    ];

    for (const testCase of testCasesInmuebles) {
      console.log(`  Probando: ${testCase.origen} → ${testCase.destino}`);
      
      try {
        const response = await fetch(`http://localhost:5000/api/relaciones/${testCase.origen}/${testCase.idOrigen}/${testCase.destino}/${testCase.idDestino}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log(`    ✅ ${testCase.origen} → ${testCase.destino}: OK`);
        } else {
          const error = await response.text();
          console.log(`    ❌ ${testCase.origen} → ${testCase.destino}: ERROR - ${error}`);
        }
      } catch (error) {
        console.log(`    ❌ ${testCase.origen} → ${testCase.destino}: EXCEPTION - ${error}`);
      }
    }

    console.log('\n🧪 Probando eliminaciones desde UBICACIONES...');
    
    // Recrear relaciones para ubicaciones
    await db.insert(vehiculosUbicaciones).values({
      vehiculoId: vehiculo1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(personasUbicaciones).values({
      personaId: persona1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmueble1.id,
      ubicacionId: ubicacion1.id
    }).onConflictDoNothing();

    await db.insert(ubicacionesUbicaciones).values({
      ubicacionId1: ubicacion1.id,
      ubicacionId2: ubicacion2.id
    }).onConflictDoNothing();

    const testCasesUbicaciones = [
      { origen: 'ubicacion', destino: 'vehiculo', idOrigen: ubicacion1.id, idDestino: vehiculo1.id },
      { origen: 'ubicacion', destino: 'persona', idOrigen: ubicacion1.id, idDestino: persona1.id },
      { origen: 'ubicacion', destino: 'inmueble', idOrigen: ubicacion1.id, idDestino: inmueble1.id },
      { origen: 'ubicacion', destino: 'ubicacion', idOrigen: ubicacion1.id, idDestino: ubicacion2.id }
    ];

    for (const testCase of testCasesUbicaciones) {
      console.log(`  Probando: ${testCase.origen} → ${testCase.destino}`);
      
      try {
        const response = await fetch(`http://localhost:5000/api/relaciones/${testCase.origen}/${testCase.idOrigen}/${testCase.destino}/${testCase.idDestino}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log(`    ✅ ${testCase.origen} → ${testCase.destino}: OK`);
        } else {
          const error = await response.text();
          console.log(`    ❌ ${testCase.origen} → ${testCase.destino}: ERROR - ${error}`);
        }
      } catch (error) {
        console.log(`    ❌ ${testCase.origen} → ${testCase.destino}: EXCEPTION - ${error}`);
      }
    }

    console.log('\n🧹 Limpiando datos de prueba...');
    await limpiarDatosPrueba();
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    await limpiarDatosPrueba();
  }
}

async function limpiarDatosPrueba() {
  try {
    // Eliminar relaciones
    await db.delete(vehiculosInmuebles);
    await db.delete(personasInmuebles);
    await db.delete(inmueblesUbicaciones);
    await db.delete(inmueblesInmuebles);
    await db.delete(vehiculosUbicaciones);
    await db.delete(personasUbicaciones);
    await db.delete(ubicacionesUbicaciones);
    
    // Eliminar registros de prueba
    await db.delete(ubicaciones).where(db.sql`nombre LIKE 'TEST%'`);
    await db.delete(inmuebles).where(db.sql`tipo LIKE 'TEST%'`);
    await db.delete(vehiculos).where(db.sql`placa LIKE 'TEST%'`);
    await db.delete(personas).where(db.sql`nombre LIKE 'TEST%'`);
  } catch (error) {
    console.error('Error limpiando datos:', error);
  }
}

if (require.main === module) {
  testInmueblesUbicaciones()
    .then(() => {
      console.log('\n🎉 Pruebas completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en las pruebas:', error);
      process.exit(1);
    });
}