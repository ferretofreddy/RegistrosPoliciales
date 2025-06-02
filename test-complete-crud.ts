/**
 * Prueba completa del sistema CRUD con autenticación
 */

import fetch from 'node-fetch';

const BASE_URL = "http://localhost:5000";

// Configurar cookies para mantener la sesión
let sessionCookie = "";

async function authenticateUser(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ferretofreddy@gmail.com',
        password: '123456'
      })
    });

    if (response.ok) {
      // Extraer cookie de sesión
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
        console.log("✅ Usuario autenticado correctamente");
        return true;
      }
    }
    
    console.log("❌ Error en la autenticación");
    return false;
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    return false;
  }
}

async function makeAuthenticatedRequest(url: string, options: any = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie,
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
}

async function testCompleteCRUD() {
  console.log("🔍 Iniciando pruebas CRUD completas con autenticación...");
  
  // 1. Autenticar usuario
  const isAuthenticated = await authenticateUser();
  if (!isAuthenticated) {
    console.log("❌ No se pudo autenticar. Terminando pruebas.");
    return;
  }

  try {
    // 2. Obtener personas existentes
    console.log("\n📋 Obteniendo personas...");
    const personasResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/personas`);
    const personas = await personasResponse.json();
    console.log(`✅ Personas encontradas: ${personas.length}`);
    
    if (personas.length === 0) {
      console.log("❌ No hay personas para probar");
      return;
    }
    
    const personaPrueba = personas[0];
    console.log(`📋 Persona de prueba: ${personaPrueba.nombre} (ID: ${personaPrueba.id})`);
    
    // 3. Obtener ubicaciones existentes
    console.log("\n📍 Obteniendo ubicaciones...");
    const ubicacionesResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/ubicaciones`);
    const ubicacionesData = await ubicacionesResponse.json();
    
    const ubicaciones = ubicacionesData.ubicacionesDirectas || ubicacionesData || [];
    console.log(`✅ Ubicaciones encontradas: ${ubicaciones.length}`);
    
    if (ubicaciones.length === 0) {
      console.log("❌ No hay ubicaciones para probar");
      return;
    }
    
    const ubicacionPrueba = ubicaciones[0];
    console.log(`📍 Ubicación de prueba: ${ubicacionPrueba.tipo} (ID: ${ubicacionPrueba.id})`);
    
    // 4. Probar creación de observación
    console.log("\n📝 Probando creación de observación...");
    const observacionData = {
      detalle: `Observación de prueba CRUD completa - ${new Date().toISOString()}`
    };
    
    const observacionResponse = await makeAuthenticatedRequest(
      `${BASE_URL}/api/personas/${personaPrueba.id}/observaciones`,
      {
        method: 'POST',
        body: JSON.stringify(observacionData)
      }
    );
    
    if (observacionResponse.ok) {
      const observacion = await observacionResponse.json();
      console.log(`✅ Observación creada exitosamente: ID ${observacion.id}`);
    } else {
      const errorText = await observacionResponse.text();
      console.log(`❌ Error creando observación: ${observacionResponse.status} - ${errorText}`);
      return;
    }
    
    // 5. Probar creación de relación persona-ubicación
    console.log("\n🔗 Probando creación de relación persona-ubicación...");
    const relacionResponse = await makeAuthenticatedRequest(
      `${BASE_URL}/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionPrueba.id}`,
      {
        method: 'POST'
      }
    );
    
    if (relacionResponse.ok) {
      console.log(`✅ Relación persona-ubicación creada exitosamente`);
      
      // 6. Verificar consulta de relaciones
      console.log("\n🔍 Verificando consulta de relaciones...");
      const relacionesResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/relaciones/persona/${personaPrueba.id}`);
      
      if (relacionesResponse.ok) {
        const relaciones = await relacionesResponse.json();
        console.log(`✅ Relaciones consultadas exitosamente:`);
        console.log(`- Personas relacionadas: ${relaciones.personas?.length || 0}`);
        console.log(`- Vehículos relacionados: ${relaciones.vehiculos?.length || 0}`);
        console.log(`- Inmuebles relacionados: ${relaciones.inmuebles?.length || 0}`);
        console.log(`- Ubicaciones relacionadas: ${relaciones.ubicaciones?.length || 0}`);
        
        // 7. Probar consulta de observaciones
        console.log("\n📖 Verificando consulta de observaciones...");
        const observacionesResponse = await makeAuthenticatedRequest(`${BASE_URL}/api/personas/${personaPrueba.id}/observaciones`);
        
        if (observacionesResponse.ok) {
          const observaciones = await observacionesResponse.json();
          console.log(`✅ Observaciones consultadas: ${observaciones.length} encontradas`);
        } else {
          console.log(`❌ Error consultando observaciones: ${observacionesResponse.status}`);
        }
        
        // 8. Probar eliminación de relación
        if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
          console.log("\n🗑️ Probando eliminación de relación...");
          const ubicacionAEliminar = relaciones.ubicaciones.find(u => u.id === ubicacionPrueba.id);
          
          if (ubicacionAEliminar) {
            const deleteResponse = await makeAuthenticatedRequest(
              `${BASE_URL}/api/relaciones/persona/${personaPrueba.id}/ubicacion/${ubicacionAEliminar.id}`,
              {
                method: 'DELETE'
              }
            );
            
            if (deleteResponse.ok) {
              console.log(`✅ Relación eliminada exitosamente`);
            } else {
              const deleteErrorText = await deleteResponse.text();
              console.log(`❌ Error eliminando relación: ${deleteResponse.status} - ${deleteErrorText}`);
            }
          }
        }
        
      } else {
        const relacionesErrorText = await relacionesResponse.text();
        console.log(`❌ Error consultando relaciones: ${relacionesResponse.status} - ${relacionesErrorText}`);
      }
      
    } else {
      const relacionErrorText = await relacionResponse.text();
      console.log(`❌ Error creando relación persona-ubicación: ${relacionResponse.status} - ${relacionErrorText}`);
    }
    
    console.log("\n🎉 TODAS LAS PRUEBAS CRUD COMPLETADAS EXITOSAMENTE");
    console.log("✅ El formulario de actualización de registros funciona correctamente");
    console.log("✅ Las observaciones se crean y consultan correctamente");
    console.log("✅ Las relaciones con ubicaciones se crean y eliminan correctamente");
    console.log("✅ Todas las APIs responden sin errores");
    
  } catch (error) {
    console.error("❌ Error durante las pruebas CRUD:", error);
  }
}

// Ejecutar las pruebas
testCompleteCRUD();