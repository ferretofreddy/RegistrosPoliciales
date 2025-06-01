import fetch from 'node-fetch';

async function testHttpAuth() {
  console.log('🧪 Probando eliminación vía HTTP con autenticación...\n');

  try {
    // Primero hacer login
    console.log('1. Haciendo login...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ferretofreddy@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Error en login:', await loginResponse.text());
      return;
    }

    console.log('✅ Login exitoso');

    // Obtener cookies de sesión
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies de sesión obtenidas');

    // Crear relación de prueba
    console.log('\n2. Creando relación de prueba...');
    const createResponse = await fetch('http://localhost:5000/api/relaciones/inmueble/1/vehiculo/1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });

    if (createResponse.ok) {
      console.log('✅ Relación creada');
    } else {
      console.log('⚠️ Relación ya existe o error:', await createResponse.text());
    }

    // Probar eliminación desde inmueble
    console.log('\n3. Probando eliminación inmueble → vehiculo...');
    const deleteResponse = await fetch('http://localhost:5000/api/relaciones/inmueble/1/vehiculo/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });

    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Eliminación exitosa:', result);
    } else {
      const error = await deleteResponse.text();
      console.log('❌ Error en eliminación:', error);
      console.log('Status:', deleteResponse.status);
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

testHttpAuth().catch(console.error);