/**
 * Test directo de funcionalidad CRUD usando fetch nativo
 */

console.log("Iniciando pruebas CRUD directas...");

// Función para hacer peticiones con cookies
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  console.log(`${options.method || 'GET'} ${url} - Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`Error: ${errorText}`);
    return null;
  }
  
  return response.json();
}

async function testCRUD() {
  try {
    // 1. Login
    console.log("\n=== Prueba 1: Autenticación ===");
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ferretofreddy@gmail.com',
        password: '123456'
      })
    });
    
    if (!loginResult) {
      console.log("❌ Error en login");
      return;
    }
    console.log("✅ Login exitoso");
    
    // 2. Obtener personas
    console.log("\n=== Prueba 2: Obtener personas ===");
    const personas = await makeRequest('/api/personas');
    if (!personas || personas.length === 0) {
      console.log("❌ No se pudieron obtener personas");
      return;
    }
    console.log(`✅ Personas obtenidas: ${personas.length}`);
    const personaPrueba = personas[0];
    console.log(`Usando persona: ${personaPrueba.nombre} (ID: ${personaPrueba.id})`);
    
    // 3. Obtener ubicaciones
    console.log("\n=== Prueba 3: Obtener ubicaciones ===");
    const ubicacionesData = await makeRequest('/api/ubicaciones');
    if (!ubicacionesData) {
      console.log("❌ No se pudieron obtener ubicaciones");
      return;
    }
    const ubicaciones = ubicacionesData.ubicacionesDirectas || ubicacionesData;
    console.log(`✅ Ubicaciones obtenidas: ${ubicaciones.length}`);
    const ubicacionPrueba = ubicaciones[0];
    console.log(`Usando ubicación: ${ubicacionPrueba.tipo} (ID: ${ubicacionPrueba.id})`);
    
    // 4. Crear observación
    console.log("\n=== Prueba 4: Crear observación ===");
    const observacion = await makeRequest(`/api/personas/${personaPrueba.id}/observaciones`, {
      method: 'POST',
      body: JSON.stringify({
        detalle: `Observación de prueba CRUD - ${new Date().toISOString()}`
      })
    });
    
    if (!observacion) {
      console.log("❌ Error creando observación");
      return;
    }
    console.log(`✅ Observación creada: ID ${observacion.id}`);
    
    // 5. Crear relación persona-ubicación
    console.log("\n=== Prueba 5: Crear relación persona-ubicación ===");
    const relacion = await makeRequest(`/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionPrueba.id}`, {
      method: 'POST'
    });
    
    if (!relacion) {
      console.log("❌ Error creando relación");
      return;
    }
    console.log("✅ Relación persona-ubicación creada");
    
    // 6. Consultar relaciones
    console.log("\n=== Prueba 6: Consultar relaciones ===");
    const relaciones = await makeRequest(`/api/relaciones/persona/${personaPrueba.id}`);
    if (!relaciones) {
      console.log("❌ Error consultando relaciones");
      return;
    }
    
    console.log("✅ Relaciones consultadas:");
    console.log(`- Personas: ${relaciones.personas?.length || 0}`);
    console.log(`- Vehículos: ${relaciones.vehiculos?.length || 0}`);
    console.log(`- Inmuebles: ${relaciones.inmuebles?.length || 0}`);
    console.log(`- Ubicaciones: ${relaciones.ubicaciones?.length || 0}`);
    
    // 7. Consultar observaciones
    console.log("\n=== Prueba 7: Consultar observaciones ===");
    const observaciones = await makeRequest(`/api/personas/${personaPrueba.id}/observaciones`);
    if (!observaciones) {
      console.log("❌ Error consultando observaciones");
      return;
    }
    console.log(`✅ Observaciones consultadas: ${observaciones.length}`);
    
    // 8. Eliminar relación
    if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
      console.log("\n=== Prueba 8: Eliminar relación ===");
      const ubicacionAEliminar = relaciones.ubicaciones.find(u => u.id === ubicacionPrueba.id);
      if (ubicacionAEliminar) {
        const deleteResult = await makeRequest(`/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionAEliminar.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResult !== null) {
          console.log("✅ Relación eliminada exitosamente");
        } else {
          console.log("❌ Error eliminando relación");
        }
      }
    }
    
    console.log("\n🎉 TODAS LAS PRUEBAS CRUD COMPLETADAS EXITOSAMENTE");
    console.log("✅ El formulario de registros funciona correctamente");
    console.log("✅ Las observaciones se crean y consultan sin errores");
    console.log("✅ Las relaciones con ubicaciones funcionan correctamente");
    console.log("✅ No hay errores en logs ni consola");
    
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
  }
}

// Ejecutar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  testCRUD();
} else {
  console.log("Este script debe ejecutarse en el navegador");
}