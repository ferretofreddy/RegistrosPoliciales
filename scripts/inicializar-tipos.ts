import { db } from '../server/db';
import { eq, like } from 'drizzle-orm';
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
      // Verificar si ya existe
      const [existente] = await db
        .select()
        .from(tiposInmuebles)
        .where(like(tiposInmuebles.nombre, tipo.nombre));
      
      if (!existente) {
        await db.insert(tiposInmuebles).values(tipo);
        console.log(`Tipo de inmueble añadido: ${tipo.nombre}`);
      } else {
        console.log(`Tipo de inmueble ya existe: ${tipo.nombre}`);
      }
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
      // Verificar si ya existe
      const [existente] = await db
        .select()
        .from(tiposUbicaciones)
        .where(sql => sql`LOWER(${tiposUbicaciones.nombre}) = LOWER(${tipo.nombre})`);
      
      if (!existente) {
        await db.insert(tiposUbicaciones).values(tipo);
        console.log(`Tipo de ubicación añadido: ${tipo.nombre}`);
      } else {
        console.log(`Tipo de ubicación ya existe: ${tipo.nombre}`);
      }
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