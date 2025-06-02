/**
 * Prueba directa de las APIs de relaciones para verificar funcionalidad CRUD
 */

const BASE_URL = "http://localhost:5000";

async function testAPIsRelaciones() {
  console.log("🔍 Probando APIs de relaciones directamente...");
  
  try {
    // 1. Obtener personas existentes
    console.log("\n1. Obteniendo personas...");
    const personasResponse = await fetch(`${BASE_URL}/api/personas`);
    const personas = await personasResponse.json();
    console.log(`✅ Personas encontradas: ${personas.length}`);
    
    if (personas.length === 0) {
      console.log("❌ No hay personas para probar");
      return;
    }
    
    const personaPrueba = personas[0];
    console.log(`📋 Usando persona: ${personaPrueba.nombre} (ID: ${personaPrueba.id})`);
    
    // 2. Obtener ubicaciones existentes
    console.log("\n2. Obteniendo ubicaciones...");
    const ubicacionesResponse = await fetch(`${BASE_URL}/api/ubicaciones`);
    const ubicacionesData = await ubicacionesResponse.json();
    
    // Extraer ubicaciones directas
    const ubicaciones = ubicacionesData.ubicacionesDirectas || ubicacionesData || [];
    console.log(`✅ Ubicaciones encontradas: ${ubicaciones.length}`);
    
    if (ubicaciones.length === 0) {
      console.log("❌ No hay ubicaciones para probar");
      return;
    }
    
    const ubicacionPrueba = ubicaciones[0];
    console.log(`📍 Usando ubicación: ${ubicacionPrueba.tipo} (ID: ${ubicacionPrueba.id})`);
    
    // 3. Probar creación de observación
    console.log("\n3. Probando creación de observación...");
    const observacionData = {
      detalle: `Observación de prueba API - ${new Date().toISOString()}`
    };
    
    const observacionResponse = await fetch(`${BASE_URL}/api/personas/${personaPrueba.id}/observaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(observacionData)
    });
    
    if (observacionResponse.ok) {
      const observacion = await observacionResponse.json();
      console.log(`✅ Observación creada: ID ${observacion.id}`);
    } else {
      const errorText = await observacionResponse.text();
      console.log(`❌ Error creando observación: ${observacionResponse.status} - ${errorText}`);
    }
    
    // 4. Probar creación de relación persona-ubicación
    console.log("\n4. Probando creación de relación persona-ubicación...");
    const relacionResponse = await fetch(`${BASE_URL}/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionPrueba.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (relacionResponse.ok) {
      const relacion = await relacionResponse.json();
      console.log(`✅ Relación persona-ubicación creada exitosamente`);
      
      // 5. Verificar que la relación se puede consultar
      console.log("\n5. Verificando consulta de relaciones...");
      const relacionesResponse = await fetch(`${BASE_URL}/api/relaciones/persona/${personaPrueba.id}`);
      
      if (relacionesResponse.ok) {
        const relaciones = await relacionesResponse.json();
        console.log(`✅ Relaciones consultadas:`);
        console.log(`- Personas: ${relaciones.personas?.length || 0}`);
        console.log(`- Vehículos: ${relaciones.vehiculos?.length || 0}`);
        console.log(`- Inmuebles: ${relaciones.inmuebles?.length || 0}`);
        console.log(`- Ubicaciones: ${relaciones.ubicaciones?.length || 0}`);
        
        // 6. Probar eliminación de relación si existe
        if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
          console.log("\n6. Probando eliminación de relación...");
          const ubicacionAEliminar = relaciones.ubicaciones[0];
          
          const deleteResponse = await fetch(`${BASE_URL}/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionAEliminar.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Relación eliminada exitosamente`);
          } else {
            const deleteErrorText = await deleteResponse.text();
            console.log(`❌ Error eliminando relación: ${deleteResponse.status} - ${deleteErrorText}`);
          }
        }
        
      } else {
        const relacionesErrorText = await relacionesResponse.text();
        console.log(`❌ Error consultando relaciones: ${relacionesResponse.status} - ${relacionesErrorText}`);
      }
      
    } else {
      const relacionErrorText = await relacionResponse.text();
      console.log(`❌ Error creando relación: ${relacionResponse.status} - ${relacionErrorText}`);
    }
    
    console.log("\n✅ PRUEBAS DE API COMPLETADAS");
    
  } catch (error) {
    console.error("❌ Error en las pruebas de API:", error);
  }
}

// Ejecutar las pruebas
testAPIsRelaciones();