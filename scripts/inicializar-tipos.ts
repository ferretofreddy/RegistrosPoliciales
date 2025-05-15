import { db } from '../server/db';
import { tiposInmuebles, tiposUbicaciones } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function inicializarTipos() {
  console.log('Iniciando la inicialización de tipos...');

  // Tipos de inmuebles predefinidos
  const tiposInmueblesDefault = [
    { nombre: 'Casa', descripcion: 'Vivienda unifamiliar', activo: true },
    { nombre: 'Apartamento', descripcion: 'Vivienda en edificio multifamiliar', activo: true },
    { nombre: 'Local Comercial', descripcion: 'Espacio para negocios', activo: true },
    { nombre: 'Bodega', descripcion: 'Espacio para almacenamiento', activo: true },
    { nombre: 'Terreno', descripcion: 'Espacio de tierra sin construcción', activo: true },
    { nombre: 'Oficina', descripcion: 'Espacio para trabajo administrativo', activo: true },
    { nombre: 'Otro', descripcion: 'Otro tipo de inmueble', activo: true }
  ];

  // Tipos de ubicaciones predefinidos
  const tiposUbicacionesDefault = [
    { nombre: 'Domicilio', descripcion: 'Lugar de residencia', activo: true },
    { nombre: 'Avistamiento', descripcion: 'Lugar donde se ha visto a la persona', activo: true },
    { nombre: 'Frecuente', descripcion: 'Lugar que frecuenta la persona', activo: true },
    { nombre: 'Trabajo', descripcion: 'Lugar de trabajo', activo: true },
    { nombre: 'Estacionamiento', descripcion: 'Lugar donde se estaciona un vehículo', activo: true },
    { nombre: 'Otro', descripcion: 'Otro tipo de ubicación', activo: true }
  ];

  try {
    // Crear tablas si no existen
    console.log('Verificando si existen las tablas necesarias...');
    
    // Crear tabla tipos_inmuebles si no existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tipos_inmuebles (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla tipos_inmuebles verificada');
    
    // Crear tabla tipos_ubicaciones si no existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tipos_ubicaciones (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla tipos_ubicaciones verificada');
    
    // Verificar si ya existen tipos de inmuebles usando SQL directo
    const resultInmuebles = await db.execute(sql`SELECT COUNT(*) FROM tipos_inmuebles`);
    const countInmuebles = parseInt(resultInmuebles.rows[0].count.toString());
    console.log(`Encontrados ${countInmuebles} tipos de inmuebles en la base de datos`);

    if (countInmuebles === 0) {
      console.log('Insertando tipos de inmuebles predefinidos...');
      for (const tipo of tiposInmueblesDefault) {
        await db.execute(sql`
          INSERT INTO tipos_inmuebles (nombre, descripcion, activo)
          VALUES (${tipo.nombre}, ${tipo.descripcion}, ${tipo.activo})
        `);
      }
      console.log('Tipos de inmuebles insertados correctamente');
    } else {
      console.log('Ya existen tipos de inmuebles. No se realizarán inserciones.');
    }

    // Verificar si ya existen tipos de ubicaciones usando SQL directo
    const resultUbicaciones = await db.execute(sql`SELECT COUNT(*) FROM tipos_ubicaciones`);
    const countUbicaciones = parseInt(resultUbicaciones.rows[0].count.toString());
    console.log(`Encontrados ${countUbicaciones} tipos de ubicaciones en la base de datos`);

    if (countUbicaciones === 0) {
      console.log('Insertando tipos de ubicaciones predefinidos...');
      for (const tipo of tiposUbicacionesDefault) {
        await db.execute(sql`
          INSERT INTO tipos_ubicaciones (nombre, descripcion, activo)
          VALUES (${tipo.nombre}, ${tipo.descripcion}, ${tipo.activo})
        `);
      }
      console.log('Tipos de ubicaciones insertados correctamente');
    } else {
      console.log('Ya existen tipos de ubicaciones. No se realizarán inserciones.');
    }

    console.log('Inicialización de tipos completada con éxito');
  } catch (error) {
    console.error('Error durante la inicialización de tipos:', error);
  } finally {
    // No es necesario cerrar la conexión aquí
    console.log('Finalizado');
  }
}

// Ejecutar la función
inicializarTipos();