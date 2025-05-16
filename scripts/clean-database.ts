import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  personas, vehiculos, inmuebles, ubicaciones,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones,
  personasPersonas, personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosVehiculos, vehiculosInmuebles, vehiculosUbicaciones,
  inmueblesInmuebles, inmueblesUbicaciones
} from '../shared/schema';
import { eq } from 'drizzle-orm';

// Script para limpiar completamente la base de datos
async function cleanDatabase() {
  console.log('Iniciando limpieza de la base de datos...');

  try {
    // Eliminar registros de todas las tablas en orden
    console.log('Eliminando relaciones...');
    
    // 1. Eliminar relaciones primero
    await db.delete(personasPersonas);
    await db.delete(personasVehiculos);
    await db.delete(personasInmuebles);
    await db.delete(personasUbicaciones);
    await db.delete(vehiculosVehiculos);
    await db.delete(vehiculosInmuebles);
    await db.delete(vehiculosUbicaciones);
    await db.delete(inmueblesInmuebles);
    await db.delete(inmueblesUbicaciones);
    
    // 2. Eliminar observaciones
    console.log('Eliminando observaciones...');
    await db.delete(personasObservaciones);
    await db.delete(vehiculosObservaciones);
    await db.delete(inmueblesObservaciones);
    
    // 3. Eliminar entidades principales
    console.log('Eliminando entidades principales...');
    await db.delete(ubicaciones);
    await db.delete(inmuebles);
    await db.delete(vehiculos);
    await db.delete(personas);
    
    console.log('¡Base de datos limpiada exitosamente!');
  } catch (error) {
    console.error('Error al limpiar la base de datos:', error);
    throw error;
  }
}

// Ejecutar limpieza
cleanDatabase()
  .then(() => {
    console.log('Script completado con éxito.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });