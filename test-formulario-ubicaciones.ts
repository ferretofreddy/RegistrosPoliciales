/**
 * Script para probar completamente el formulario de ubicaciones
 * Simula exactamente lo que hace el frontend
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Función para hacer login y obtener cookie de sesión
async function login() {
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'ferretofreddy@gmail.com',
      password: '123456'
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Error de login: ${loginResponse.status}`);
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✓ Login exitoso');
  return cookies;
}

// Función para hacer peticiones autenticadas
async function makeAuthenticatedRequest(url: string, options: any = {}, cookies: string) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': cookies
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { response, data };
}

async function testFormularioCompleto() {
  console.log('=== PRUEBA COMPLETA DEL FORMULARIO DE UBICACIONES ===\n');

  try {
    // 1. Login
    const cookies = await login();

    // 2. Crear ubicación con datos exactos del formulario
    const ubicacionData = {
      latitud: 9.9281,
      longitud: -84.0907,
      tipo: "Avistamiento",
      fecha: new Date().toISOString(),
      observaciones: "Prueba desde formulario automatizado"
    };

    console.log('Creando ubicación con datos:', ubicacionData);
    
    const { response: ubicacionResponse, data: ubicacionResult } = await makeAuthenticatedRequest(
      `${BASE_URL}/api/ubicaciones`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ubicacionData)
      },
      cookies
    );

    if (!ubicacionResponse.ok) {
      console.error('❌ Error creando ubicación:', ubicacionResult);
      return;
    }

    const ubicacionId = ubicacionResult.id;
    console.log(`✓ Ubicación creada con ID: ${ubicacionId}`);

    // 3. Crear observaciones adicionales (simulando el formulario)
    const observaciones = [
      {
        detalle: "Primera observación de prueba - comportamiento sospechoso detectado",
        fecha: new Date().toISOString()
      },
      {
        detalle: "Segunda observación de prueba - actividad confirmada en el área",
        fecha: new Date().toISOString()
      }
    ];

    console.log('\nCreando observaciones adicionales...');
    
    for (let i = 0; i < observaciones.length; i++) {
      const observacion = observaciones[i];
      console.log(`Creando observación ${i + 1}:`, observacion);

      const { response: obsResponse, data: obsResult } = await makeAuthenticatedRequest(
        `${BASE_URL}/api/ubicaciones/${ubicacionId}/observaciones`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(observacion)
        },
        cookies
      );

      if (obsResponse.ok) {
        console.log(`✓ Observación ${i + 1} creada exitosamente:`, obsResult);
      } else {
        console.error(`❌ Error creando observación ${i + 1}:`, obsResult);
      }
    }

    // 4. Verificar que las observaciones se guardaron
    console.log('\nVerificando observaciones guardadas...');
    
    const { response: checkResponse, data: observacionesGuardadas } = await makeAuthenticatedRequest(
      `${BASE_URL}/api/ubicaciones/${ubicacionId}/observaciones`,
      { method: 'GET' },
      cookies
    );

    if (checkResponse.ok) {
      console.log(`✓ Total observaciones encontradas: ${observacionesGuardadas.length}`);
      observacionesGuardadas.forEach((obs: any, index: number) => {
        console.log(`  Observación ${index + 1}:`, {
          id: obs.id,
          detalle: obs.detalle.substring(0, 50) + '...',
          usuario: obs.usuario,
          fecha: obs.fecha
        });
      });
    } else {
      console.error('❌ Error obteniendo observaciones:', observacionesGuardadas);
    }

    // 5. Crear relaciones con entidades existentes
    console.log('\nCreando relaciones...');
    
    const relacionesData = {
      personas: [6], // Manuel Pérez Mora
      vehiculos: [3], // Nissan Frontier
      inmuebles: []
    };

    const { response: relResponse, data: relResult } = await makeAuthenticatedRequest(
      `${BASE_URL}/api/ubicaciones/${ubicacionId}/relaciones`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relacionesData)
      },
      cookies
    );

    if (relResponse.ok) {
      console.log('✓ Relaciones creadas exitosamente');
    } else {
      console.error('❌ Error creando relaciones:', relResult);
    }

    // 6. Verificar la ubicación completa desde el endpoint de consulta
    console.log('\nVerificando ubicación completa...');
    
    const { response: finalResponse, data: ubicacionCompleta } = await makeAuthenticatedRequest(
      `${BASE_URL}/api/ubicaciones/${ubicacionId}`,
      { method: 'GET' },
      cookies
    );

    if (finalResponse.ok) {
      console.log('✓ Ubicación completa:', ubicacionCompleta);
    } else {
      console.error('❌ Error obteniendo ubicación:', ubicacionCompleta);
    }

    // 7. Verificar relaciones
    const { response: relCheckResponse, data: relacionesCompletas } = await makeAuthenticatedRequest(
      `${BASE_URL}/api/relaciones/ubicacion/${ubicacionId}`,
      { method: 'GET' },
      cookies
    );

    if (relCheckResponse.ok) {
      console.log('✓ Relaciones verificadas:', {
        personas: relacionesCompletas.personas?.length || 0,
        vehiculos: relacionesCompletas.vehiculos?.length || 0,
        inmuebles: relacionesCompletas.inmuebles?.length || 0
      });
    }

    console.log(`\n✅ PRUEBA COMPLETADA EXITOSAMENTE`);
    console.log(`📍 Ubicación ID: ${ubicacionId}`);
    console.log(`📝 Observaciones creadas: ${observacionesGuardadas?.length || 0}`);
    console.log(`🔗 Relaciones creadas: ${(relacionesCompletas?.personas?.length || 0) + (relacionesCompletas?.vehiculos?.length || 0)}`);
    
    return ubicacionId;

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    throw error;
  }
}

// Ejecutar la prueba
testFormularioCompleto()
  .then((ubicacionId) => {
    console.log(`\n🎯 Puedes consultar la ubicación ${ubicacionId} en /consultas para verificar las observaciones`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Prueba fallida:', error);
    process.exit(1);
  });