/**
 * Prueba completa con creación de usuario temporal para testing
 */
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./server/auth";
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function crearUsuarioTemporal() {
  // Crear usuario temporal para testing
  const hashedPassword = await hashPassword('test123');
  
  const [usuario] = await db.insert(schema.users).values({
    email: 'test@test.com',
    password: hashedPassword,
    nombre: 'Usuario Test',
    cedula: '123456789',
    telefono: '88888888',
    unidad: 'Testing',
    rol: 'admin',
    activo: true
  }).returning();

  return usuario;
}

async function loginUsuario() {
  const loginResponse = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@test.com',
      password: 'test123'
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Error de login: ${loginResponse.status}`);
  }

  const cookies = loginResponse.headers.get('set-cookie');
  return cookies;
}

async function probarFormularioCompleto() {
  console.log('=== PRUEBA COMPLETA DEL FORMULARIO DE UBICACIONES ===\n');

  try {
    // 1. Crear usuario temporal
    console.log('Creando usuario temporal...');
    const usuario = await crearUsuarioTemporal();
    console.log('✓ Usuario temporal creado:', usuario.email);

    // 2. Login
    console.log('Realizando login...');
    const cookies = await loginUsuario();
    console.log('✓ Login exitoso');

    // 3. Crear ubicación
    const ubicacionData = {
      latitud: 9.9289,
      longitud: -84.0912,
      tipo: "Avistamiento",
      fecha: new Date().toISOString(),
      observaciones: "Prueba completa de observaciones desde formulario"
    };

    console.log('Creando ubicación...');
    const ubicacionResponse = await fetch(`${BASE_URL}/api/ubicaciones`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
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

    // 4. Crear observaciones adicionales
    const observaciones = [
      { detalle: "Primera observación - funcionamiento correcto del sistema" },
      { detalle: "Segunda observación - validación completa exitosa" }
    ];

    console.log('\nCreando observaciones adicionales...');
    let observacionesCreadas = 0;

    for (let i = 0; i < observaciones.length; i++) {
      const observacionData = {
        detalle: observaciones[i].detalle,
        fecha: new Date().toISOString()
      };

      console.log(`Enviando observación ${i + 1}...`);
      
      const obsResponse = await fetch(`${BASE_URL}/api/ubicaciones/${ubicacion.id}/observaciones`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify(observacionData)
      });

      if (obsResponse.ok) {
        const obsResult = await obsResponse.json();
        console.log(`✅ Observación ${i + 1} creada:`, {
          id: obsResult.id,
          detalle: obsResult.detalle.substring(0, 50) + '...',
          usuario: obsResult.usuario
        });
        observacionesCreadas++;
      } else {
        const error = await obsResponse.text();
        console.error(`❌ Error observación ${i + 1}:`, error);
      }
    }

    // 5. Verificar observaciones guardadas
    console.log('\n🔍 Verificando observaciones...');
    const checkResponse = await fetch(`${BASE_URL}/api/ubicaciones/${ubicacion.id}/observaciones`, {
      method: 'GET',
      headers: { 'Cookie': cookies }
    });

    if (checkResponse.ok) {
      const observacionesGuardadas = await checkResponse.json();
      console.log(`✅ Observaciones encontradas: ${observacionesGuardadas.length}`);
      
      observacionesGuardadas.forEach((obs: any, index: number) => {
        console.log(`  ${index + 1}. ${obs.detalle} (Usuario: ${obs.usuario})`);
      });

      // 6. Resultado final
      console.log('\n📊 RESULTADO FINAL:');
      console.log(`📍 Ubicación ID: ${ubicacion.id}`);
      console.log(`📝 Observaciones creadas: ${observacionesCreadas}/2`);
      console.log(`📝 Observaciones verificadas: ${observacionesGuardadas.length}`);
      
      if (observacionesCreadas === 2 && observacionesGuardadas.length === 2) {
        console.log('🎉 ¡ÉXITO COMPLETO! Todas las observaciones funcionan correctamente');
      } else {
        console.log('⚠️ Problema detectado en el guardado de observaciones');
      }

    } else {
      console.error('❌ Error verificando observaciones');
    }

    // 7. Limpiar usuario temporal
    await db.delete(schema.users).where(eq(schema.users.id, usuario.id));
    console.log('\n🧹 Usuario temporal eliminado');

  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Ejecutar prueba
probarFormularioCompleto()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });