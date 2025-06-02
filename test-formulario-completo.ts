/**
 * Prueba completa del formulario de ubicaciones con observaciones
 * Simula exactamente el proceso del frontend
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Simular proceso de autenticación
async function autenticar() {
  // Primero intentamos obtener el usuario actual
  const userResponse = await fetch(`${BASE_URL}/api/user`, {
    method: 'GET',
    credentials: 'include'
  });

  if (userResponse.ok) {
    const user = await userResponse.json();
    console.log('✓ Usuario ya autenticado:', user.email);
    return true;
  }
  
  console.log('Usuario no autenticado, necesita login manual');
  return false;
}

// Función para crear ubicación con observaciones
async function crearUbicacionCompleta() {
  try {
    console.log('=== PRUEBA COMPLETA DEL FORMULARIO DE UBICACIONES ===\n');

    // 1. Verificar autenticación
    const autenticado = await autenticar();
    if (!autenticado) {
      console.log('❌ Usuario no autenticado. Ve a la aplicación web e inicia sesión primero.');
      return;
    }

    // 2. Crear ubicación
    const ubicacionData = {
      latitud: 9.9289,
      longitud: -84.0912,
      tipo: "Avistamiento",
      fecha: new Date().toISOString(),
      observaciones: "Prueba de observaciones corregidas desde script"
    };

    console.log('Creando ubicación...');
    const ubicacionResponse = await fetch(`${BASE_URL}/api/ubicaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(ubicacionData)
    });

    if (!ubicacionResponse.ok) {
      const error = await ubicacionResponse.text();
      console.error('❌ Error creando ubicación:', error);
      return;
    }

    const ubicacion = await ubicacionResponse.json();
    console.log('✓ Ubicación creada:', {
      id: ubicacion.id,
      tipo: ubicacion.tipo,
      observaciones: ubicacion.observaciones
    });

    // 3. Crear observaciones adicionales (como lo hace el formulario)
    const observaciones = [
      { detalle: "Primera observación de prueba - sistema funcionando" },
      { detalle: "Segunda observación de prueba - validación completa" }
    ];

    console.log('\nCreando observaciones adicionales...');
    let observacionesExitosas = 0;

    for (let i = 0; i < observaciones.length; i++) {
      const observacion = observaciones[i];
      
      // Simular exactamente los datos que envía el formulario
      const observacionData = {
        detalle: observacion.detalle,
        fecha: new Date().toISOString()
      };

      console.log(`Enviando observación ${i + 1}:`, observacionData);

      const obsResponse = await fetch(`${BASE_URL}/api/ubicaciones/${ubicacion.id}/observaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(observacionData)
      });

      if (obsResponse.ok) {
        const obsResult = await obsResponse.json();
        console.log(`✅ Observación ${i + 1} creada exitosamente:`, {
          id: obsResult.id,
          detalle: obsResult.detalle.substring(0, 50) + '...',
          usuario: obsResult.usuario
        });
        observacionesExitosas++;
      } else {
        const error = await obsResponse.text();
        console.error(`❌ Error creando observación ${i + 1}:`, error);
      }
    }

    // 4. Verificar observaciones guardadas
    console.log('\n🔍 Verificando observaciones guardadas...');
    const checkResponse = await fetch(`${BASE_URL}/api/ubicaciones/${ubicacion.id}/observaciones`, {
      method: 'GET',
      credentials: 'include'
    });

    if (checkResponse.ok) {
      const observacionesGuardadas = await checkResponse.json();
      console.log(`✅ Total observaciones encontradas: ${observacionesGuardadas.length}`);
      
      observacionesGuardadas.forEach((obs: any, index: number) => {
        console.log(`  ${index + 1}. ${obs.detalle.substring(0, 60)}... (${obs.usuario})`);
      });
    } else {
      console.error('❌ Error verificando observaciones');
    }

    // 5. Crear relaciones de prueba
    console.log('\n🔗 Creando relaciones de prueba...');
    const relacionesData = {
      personas: [6], // Manuel Pérez Mora
      vehiculos: [],
      inmuebles: []
    };

    const relResponse = await fetch(`${BASE_URL}/api/ubicaciones/${ubicacion.id}/relaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(relacionesData)
    });

    if (relResponse.ok) {
      console.log('✅ Relaciones creadas exitosamente');
    } else {
      const error = await relResponse.text();
      console.error('❌ Error creando relaciones:', error);
    }

    // 6. Verificación final completa
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`📍 Ubicación ID: ${ubicacion.id}`);
    console.log(`📝 Observaciones creadas: ${observacionesExitosas}/2`);
    console.log(`✅ Estado: ${observacionesExitosas === 2 ? 'ÉXITO COMPLETO' : 'PARCIALMENTE EXITOSO'}`);
    
    if (observacionesExitosas === 2) {
      console.log('\n🎉 ¡TODAS LAS OBSERVACIONES SE GUARDARON CORRECTAMENTE!');
      console.log('El formulario de ubicaciones está funcionando perfectamente.');
    } else {
      console.log('\n⚠️ Algunas observaciones no se guardaron. Revisa los errores arriba.');
    }

    console.log(`\n👁️ Puedes verificar la ubicación ${ubicacion.id} en /consultas`);

  } catch (error) {
    console.error('💥 Error general en la prueba:', error);
  }
}

// Ejecutar la prueba
crearUbicacionCompleta()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });