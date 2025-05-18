// Este script limpia todas las tablas y restablece las secuencias de IDs
import { db } from '../server/db';
import { 
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones,
  personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones,
  personas, vehiculos, inmuebles, ubicaciones, tiposInmuebles, tiposUbicaciones,
  personasPersonas, vehiculosVehiculos, inmueblesInmuebles, ubicacionesUbicaciones,
  users
} from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Este script limpia todas las tablas y restablece las secuencias de IDs
 */
async function resetDatabase() {
  console.log('========================================');
  console.log('INICIANDO RESETEO COMPLETO DE BASE DE DATOS');
  console.log('========================================');
  
  try {
    // 1. Primero borrar las relaciones y observaciones (tablas con foreign keys)
    console.log('\n1. Eliminando observaciones y relaciones...');
    await db.delete(personasObservaciones);
    await db.delete(vehiculosObservaciones);
    await db.delete(inmueblesObservaciones);
    await db.delete(ubicacionesObservaciones);
    
    await db.delete(personasVehiculos);
    await db.delete(personasInmuebles);
    await db.delete(personasUbicaciones);
    await db.delete(vehiculosInmuebles);
    await db.delete(vehiculosUbicaciones);
    await db.delete(inmueblesUbicaciones);
    await db.delete(personasPersonas);
    await db.delete(vehiculosVehiculos);
    await db.delete(inmueblesInmuebles);
    await db.delete(ubicacionesUbicaciones);
    
    // 2. Luego borrar las entidades principales (preservando tablas de tipos)
    console.log('\n2. Eliminando entidades principales (preservando tablas de tipos)...');
    await db.delete(personas);
    await db.delete(vehiculos);
    await db.delete(inmuebles);
    await db.delete(ubicaciones);
    
    // Las tablas de tipos no se eliminan para preservar la configuración básica
    console.log('  ℹ️ Preservando tablas de tipos de inmuebles y ubicaciones');
    
    // No eliminamos users para mantener las cuentas de acceso
    // await db.delete(users);
    
    // 3. Restablecer las secuencias
    console.log('\n3. Restableciendo secuencias de IDs...');
    
    // Lista de tablas cuyas secuencias deben restablecerse
    const tablasConIds = [
      'personas', 'vehiculos', 'inmuebles', 'ubicaciones', 
      'tipos_inmuebles', 'tipos_ubicaciones',
      'personas_observaciones', 'vehiculos_observaciones', 
      'inmuebles_observaciones', 'ubicaciones_observaciones',
      'personas_vehiculos', 'personas_inmuebles', 'personas_ubicaciones',
      'vehiculos_inmuebles', 'vehiculos_ubicaciones', 'inmuebles_ubicaciones',
      'personas_personas', 'vehiculos_vehiculos', 'inmuebles_inmuebles', 'ubicaciones_ubicaciones'
    ];
    
    for (const tabla of tablasConIds) {
      try {
        // Restablecer la secuencia para esta tabla
        await db.execute(sql.raw(`ALTER SEQUENCE ${tabla}_id_seq RESTART WITH 1;`));
        console.log(`  ✓ Restablecida secuencia para: ${tabla}`);
      } catch (error) {
        console.error(`  ✗ Error al restablecer secuencia para ${tabla}:`, error);
      }
    }
    
    console.log('\n✅ Base de datos reseteada con éxito!');
  } catch (error) {
    console.error('\n❌ Error al resetear la base de datos:', error);
    throw error;
  }
}

// Ejecutar la función de reseteo
resetDatabase()
  .then(() => {
    console.log('\nProceso de reseteo finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el proceso de reseteo:', error);
    process.exit(1);
  });