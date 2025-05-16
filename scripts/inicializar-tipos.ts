import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { tiposInmuebles, tiposUbicaciones } from '../shared/schema';

// Script para inicializar tipos básicos necesarios para el funcionamiento de la aplicación
async function inicializarTipos() {
  console.log('Iniciando inicialización de tipos...');

  try {
    // Inicializar tipos de inmuebles
    console.log('Inicializando tipos de inmuebles...');
    
    const tiposInmueblesData = [
      { nombre: 'Casa', descripcion: 'Vivienda unifamiliar' },
      { nombre: 'Apartamento', descripcion: 'Vivienda en edificio' },
      { nombre: 'Bodega', descripcion: 'Espacio para almacenamiento' },
      { nombre: 'Local Comercial', descripcion: 'Espacio para negocio' },
      { nombre: 'Terreno', descripcion: 'Propiedad sin construcción' },
      { nombre: 'Finca', descripcion: 'Propiedad rural extensa' },
    ];
    
    for (const tipo of tiposInmueblesData) {
      // Insertar directamente (estamos en una base limpia)
      const [nuevoTipo] = await db.insert(tiposInmuebles).values(tipo).returning();
      console.log(`Tipo de inmueble añadido: ${nuevoTipo.nombre} (ID: ${nuevoTipo.id})`);
    }
    
    // Inicializar tipos de ubicaciones
    console.log('Inicializando tipos de ubicaciones...');
    
    const tiposUbicacionesData = [
      { nombre: 'Domicilio', descripcion: 'Lugar de residencia' },
      { nombre: 'Trabajo', descripcion: 'Lugar de empleo' },
      { nombre: 'Avistamiento', descripcion: 'Lugar donde se observó a la persona' },
      { nombre: 'Punto de Venta', descripcion: 'Lugar donde se efectúan transacciones' },
      { nombre: 'Punto de Encuentro', descripcion: 'Lugar donde se reúnen varias personas' },
      { nombre: 'Escondite', descripcion: 'Lugar usado para ocultarse' },
      { nombre: 'Otro', descripcion: 'Otro tipo de ubicación' },
    ];
    
    for (const tipo of tiposUbicacionesData) {
      // Insertar directamente (estamos en una base limpia)
      const [nuevoTipo] = await db.insert(tiposUbicaciones).values(tipo).returning();
      console.log(`Tipo de ubicación añadido: ${nuevoTipo.nombre} (ID: ${nuevoTipo.id})`);
    }
    
    console.log('¡Tipos inicializados exitosamente!');
  } catch (error) {
    console.error('Error al inicializar tipos:', error);
    throw error;
  }
}

// Ejecutar inicialización
inicializarTipos()
  .then(() => {
    console.log('Script completado con éxito.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });