// Este script limpia todas las tablas de la base de datos
import { db } from '../server/db';
import { 
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones,
  personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones,
  personas, vehiculos, inmuebles, ubicaciones,
  personasPersonas, vehiculosVehiculos, inmueblesInmuebles
} from '../shared/schema';

async function cleanDatabase() {
  console.log('Comenzando limpieza de base de datos...');
  
  try {
    // Primero borrar las relaciones y observaciones
    console.log('Limpiando observaciones...');
    await db.delete(personasObservaciones);
    await db.delete(vehiculosObservaciones);
    await db.delete(inmueblesObservaciones);
    
    console.log('Limpiando relaciones...');
    await db.delete(personasVehiculos);
    await db.delete(personasInmuebles);
    await db.delete(personasUbicaciones);
    await db.delete(vehiculosInmuebles);
    await db.delete(vehiculosUbicaciones);
    await db.delete(inmueblesUbicaciones);
    await db.delete(personasPersonas);
    await db.delete(vehiculosVehiculos);
    await db.delete(inmueblesInmuebles);
    
    // Luego borrar las entidades principales
    console.log('Limpiando entidades principales...');
    await db.delete(personas);
    await db.delete(vehiculos);
    await db.delete(inmuebles);
    await db.delete(ubicaciones);
    
    console.log('Base de datos limpiada con éxito!');
  } catch (error) {
    console.error('Error al limpiar la base de datos:', error);
  }
}

// Ejecutar la función de limpieza
cleanDatabase()
  .then(() => {
    console.log('Proceso de limpieza finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el proceso de limpieza:', error);
    process.exit(1);
  });