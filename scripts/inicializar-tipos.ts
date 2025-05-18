// Este script inicializa los tipos básicos necesarios para el sistema
import { db } from '../server/db';
import { tiposInmuebles, tiposUbicaciones } from '../shared/schema';

async function inicializarTipos() {
  console.log('========================================');
  console.log('INICIANDO INICIALIZACIÓN DE TIPOS BÁSICOS');
  console.log('========================================');
  
  try {
    // 1. Inicializar tipos de inmuebles
    console.log('\n1. Inicializando tipos de inmuebles...');
    
    const tiposInmueblesData = [
      { nombre: 'Casa', descripcion: 'Vivienda unifamiliar' },
      { nombre: 'Apartamento', descripcion: 'Vivienda en edificio multifamiliar' },
      { nombre: 'Local Comercial', descripcion: 'Establecimiento para actividades comerciales' },
      { nombre: 'Bodega', descripcion: 'Espacio para almacenamiento' },
      { nombre: 'Finca', descripcion: 'Propiedad rural destinada a actividades agrícolas o ganaderas' },
      { nombre: 'Oficina', descripcion: 'Espacio para actividades administrativas o profesionales' }
    ];
    
    for (const tipo of tiposInmueblesData) {
      await db.insert(tiposInmuebles).values(tipo);
      console.log(`  ✓ Agregado tipo de inmueble: ${tipo.nombre}`);
    }
    
    // 2. Inicializar tipos de ubicaciones
    console.log('\n2. Inicializando tipos de ubicaciones...');
    
    const tiposUbicacionesData = [
      { nombre: 'Domicilio', descripcion: 'Lugar de residencia habitual' },
      { nombre: 'Lugar de trabajo', descripcion: 'Ubicación donde la persona trabaja' },
      { nombre: 'Avistamiento', descripcion: 'Lugar donde se ha visto a la persona o vehículo' },
      { nombre: 'Punto de interés', descripcion: 'Ubicación relevante para una investigación' },
      { nombre: 'Incidente', descripcion: 'Lugar donde ocurrió un incidente reportado' }
    ];
    
    for (const tipo of tiposUbicacionesData) {
      await db.insert(tiposUbicaciones).values(tipo);
      console.log(`  ✓ Agregado tipo de ubicación: ${tipo.nombre}`);
    }
    
    console.log('\n✅ Tipos básicos inicializados con éxito!');
  } catch (error) {
    console.error('\n❌ Error al inicializar tipos básicos:', error);
    throw error;
  }
}

// Ejecutar la función de inicialización
inicializarTipos()
  .then(() => {
    console.log('\nProceso de inicialización finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el proceso de inicialización:', error);
    process.exit(1);
  });