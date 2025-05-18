/**
 * Este script realiza pruebas CRUD básicas para verificar
 * que todos los registros se guardan correctamente junto con sus relaciones
 */

import { db, pool } from '../server/db';
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones,
  personasVehiculos, personasInmuebles, personasUbicaciones
} from '../shared/schema';
import { sql, eq } from 'drizzle-orm';

async function testCRUD() {
  console.log('=== INICIANDO PRUEBAS CRUD ===');
  try {
    // Limpiar datos existentes (excepto tipos y usuarios)
    await limpiarDatos();

    // 1. Crear Persona
    console.log('1. Creando persona...');
    const [persona] = await db.insert(personas).values({
      nombre: 'Juan Pérez González',
      identificacion: '109870654',
      alias: ['Juanito', 'JP'],
      telefonos: ['88776655', '22334455'],
      domicilios: ['San José Centro, Costa Rica']
    }).returning();

    console.log('✓ Persona creada:', persona);

    // 2. Crear Observación para la Persona
    console.log('2. Creando observación para persona...');
    const [personaObs] = await db.insert(personasObservaciones).values({
      personaId: persona.id,
      detalle: 'Observación de prueba para persona',
      usuario: 'Usuario Autenticado'
    }).returning();

    console.log('✓ Observación de persona creada:', personaObs);

    // 3. Crear Vehículo
    console.log('3. Creando vehículo...');
    const [vehiculo] = await db.insert(vehiculos).values({
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Corolla',
      color: 'Azul',
      tipo: 'Sedan'
    }).returning();

    console.log('✓ Vehículo creado:', vehiculo);

    // 4. Crear Observación para el Vehículo
    console.log('4. Creando observación para vehículo...');
    const [vehiculoObs] = await db.insert(vehiculosObservaciones).values({
      vehiculoId: vehiculo.id,
      detalle: 'Observación de prueba para vehículo',
      usuario: 'Usuario Autenticado'
    }).returning();

    console.log('✓ Observación de vehículo creada:', vehiculoObs);

    // 5. Crear Inmueble
    console.log('5. Creando inmueble...');
    const [inmueble] = await db.insert(inmuebles).values({
      tipo: 'Casa',
      direccion: 'Calle 123, San Pedro, Costa Rica',
      propietario: 'Juan Pérez González'
    }).returning();

    console.log('✓ Inmueble creado:', inmueble);

    // 6. Crear Observación para el Inmueble
    console.log('6. Creando observación para inmueble...');
    const [inmuebleObs] = await db.insert(inmueblesObservaciones).values({
      inmuebleId: inmueble.id,
      detalle: 'Observación de prueba para inmueble',
      usuario: 'Usuario Autenticado'
    }).returning();

    console.log('✓ Observación de inmueble creada:', inmuebleObs);

    // 7. Crear Ubicación
    console.log('7. Creando ubicación...');
    // Usar SQL directo para evitar problemas con latitud/longitud
    const ubicacionResult = await pool.query(
      `INSERT INTO ubicaciones (latitud, longitud, tipo, observaciones)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [9.9281, -84.0907, 'Domicilio', 'Ubicación de prueba']
    );
    const ubicacion = ubicacionResult.rows[0];

    console.log('✓ Ubicación creada:', ubicacion);

    // 8. Crear Observación para la Ubicación
    console.log('8. Creando observación para ubicación...');
    const [ubicacionObs] = await db.insert(ubicacionesObservaciones).values({
      ubicacionId: ubicacion.id,
      detalle: 'Observación de prueba para ubicación',
      usuario: 'Usuario Autenticado'
    }).returning();

    console.log('✓ Observación de ubicación creada:', ubicacionObs);

    // 9. Crear Relación Persona-Vehículo
    console.log('9. Creando relación persona-vehículo...');
    const [relacionPV] = await db.insert(personasVehiculos).values({
      personaId: persona.id,
      vehiculoId: vehiculo.id
    }).returning();

    console.log('✓ Relación persona-vehículo creada:', relacionPV);

    // 10. Crear Relación Persona-Inmueble
    console.log('10. Creando relación persona-inmueble...');
    const [relacionPI] = await db.insert(personasInmuebles).values({
      personaId: persona.id,
      inmuebleId: inmueble.id
    }).returning();

    console.log('✓ Relación persona-inmueble creada:', relacionPI);

    // 11. Crear Relación Persona-Ubicación
    console.log('11. Creando relación persona-ubicación...');
    const [relacionPU] = await db.insert(personasUbicaciones).values({
      personaId: persona.id,
      ubicacionId: ubicacion.id
    }).returning();

    console.log('✓ Relación persona-ubicación creada:', relacionPU);

    // 12. Verificar todos los registros creados
    console.log('\n=== VERIFICANDO REGISTROS CREADOS ===');
    await verificarRegistros();

    console.log('\n=== PRUEBAS COMPLETADAS EXITOSAMENTE ===');
  } catch (error) {
    console.error('❌ Error en las pruebas CRUD:', error);
    throw error;
  }
}

async function limpiarDatos() {
  console.log('Limpiando datos existentes...');
  
  // Limpiar tablas de relaciones
  await pool.query('TRUNCATE TABLE personas_vehiculos CASCADE');
  await pool.query('TRUNCATE TABLE personas_inmuebles CASCADE');
  await pool.query('TRUNCATE TABLE personas_personas CASCADE');
  await pool.query('TRUNCATE TABLE personas_ubicaciones CASCADE');
  await pool.query('TRUNCATE TABLE vehiculos_ubicaciones CASCADE');
  await pool.query('TRUNCATE TABLE inmuebles_ubicaciones CASCADE');
  
  // Limpiar tablas de observaciones
  await pool.query('TRUNCATE TABLE personas_observaciones CASCADE');
  await pool.query('TRUNCATE TABLE vehiculos_observaciones CASCADE');
  await pool.query('TRUNCATE TABLE inmuebles_observaciones CASCADE');
  await pool.query('TRUNCATE TABLE ubicaciones_observaciones CASCADE');
  
  // Limpiar tablas principales
  await pool.query('TRUNCATE TABLE personas CASCADE');
  await pool.query('TRUNCATE TABLE vehiculos CASCADE');
  await pool.query('TRUNCATE TABLE inmuebles CASCADE');
  await pool.query('TRUNCATE TABLE ubicaciones CASCADE');
  
  // Restablecer secuencias
  await pool.query('ALTER SEQUENCE personas_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE vehiculos_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE inmuebles_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE ubicaciones_id_seq RESTART WITH 1');
  
  console.log('✓ Datos limpios para realizar pruebas');
}

async function verificarRegistros() {
  // Verificar personas
  console.log('Verificando personas...');
  const allPersonas = await db.select().from(personas);
  console.log(`✓ Personas encontradas: ${allPersonas.length}`);
  
  // Verificar vehículos
  console.log('Verificando vehículos...');
  const allVehiculos = await db.select().from(vehiculos);
  console.log(`✓ Vehículos encontrados: ${allVehiculos.length}`);
  
  // Verificar inmuebles
  console.log('Verificando inmuebles...');
  const allInmuebles = await db.select().from(inmuebles);
  console.log(`✓ Inmuebles encontrados: ${allInmuebles.length}`);
  
  // Verificar ubicaciones
  console.log('Verificando ubicaciones...');
  const allUbicaciones = await db.select().from(ubicaciones);
  console.log(`✓ Ubicaciones encontradas: ${allUbicaciones.length}`);
  
  // Verificar observaciones
  console.log('Verificando observaciones...');
  const allPersonasObs = await db.select().from(personasObservaciones);
  const allVehiculosObs = await db.select().from(vehiculosObservaciones);
  const allInmueblesObs = await db.select().from(inmueblesObservaciones);
  const allUbicacionesObs = await db.select().from(ubicacionesObservaciones);
  console.log(`✓ Observaciones encontradas: Personas=${allPersonasObs.length}, Vehículos=${allVehiculosObs.length}, Inmuebles=${allInmueblesObs.length}, Ubicaciones=${allUbicacionesObs.length}`);
  
  // Verificar relaciones
  console.log('Verificando relaciones...');
  const allPersonasVehiculos = await db.select().from(personasVehiculos);
  const allPersonasInmuebles = await db.select().from(personasInmuebles);
  const allPersonasUbicaciones = await db.select().from(personasUbicaciones);
  console.log(`✓ Relaciones encontradas: Personas-Vehículos=${allPersonasVehiculos.length}, Personas-Inmuebles=${allPersonasInmuebles.length}, Personas-Ubicaciones=${allPersonasUbicaciones.length}`);
  
  // Detalle de registros
  if (allPersonas.length > 0) {
    console.log('\n=== DETALLES DE REGISTROS ===');
    console.log('Persona:', allPersonas[0]);
    console.log('Vehículo:', allVehiculos[0]);
    console.log('Inmueble:', allInmuebles[0]);
    console.log('Ubicación:', allUbicaciones[0]);
  }
}

// Ejecutar pruebas
testCRUD()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });