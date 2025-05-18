import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

// Necesario para conexiones WebSocket en Neon Serverless
neonConfig.webSocketConstructor = ws;

// Verificar que existe la URL de la base de datos
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL debe estar definida");
}

// Conexión a la base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

/**
 * Función para obtener todas las relaciones de una entidad
 * @param tipo Tipo de entidad (persona, vehiculo, inmueble, ubicacion)
 * @param id ID de la entidad
 * @returns Objeto con las relaciones encontradas
 */
export async function getRelaciones(tipo: string, id: number) {
  const resultado: any = {
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
  };

  try {
    console.log(`[DEBUG] Buscando relaciones para entidad tipo: ${tipo}, ID: ${id}`);
    
    // Normalizar tipo (aceptar tanto singular como plural)
    if (tipo === "personas") tipo = "persona";
    if (tipo === "vehiculos") tipo = "vehiculo";
    if (tipo === "inmuebles") tipo = "inmueble";
    if (tipo === "ubicaciones") tipo = "ubicacion";
    
    // Obtener relaciones según el tipo
    if (tipo === "persona") {
      console.log(`[DEBUG] Buscando relaciones para persona ID ${id}`);
      
      // Vehiculos relacionados
      console.log(`[DEBUG] Buscando vehículos relacionados a persona ID ${id}`);
      const vehiculosResult = await db.execute(
        sql`SELECT v.* FROM vehiculos v
            JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
            WHERE pv.persona_id = ${id}`
      );
      resultado.vehiculos = vehiculosResult.rows || [];
      console.log(`[DEBUG] Encontrados ${resultado.vehiculos.length} vehículos relacionados`);
      
      // Inmuebles relacionados
      console.log(`[DEBUG] Buscando inmuebles relacionados a persona ID ${id}`);
      const inmueblesResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
            WHERE pi.persona_id = ${id}`
      );
      resultado.inmuebles = inmueblesResult.rows || [];
      console.log(`[DEBUG] Encontrados ${resultado.inmuebles.length} inmuebles relacionados`);
      
      // Ubicaciones relacionadas
      console.log(`[DEBUG] Buscando ubicaciones relacionadas a persona ID ${id}`);
      const ubicacionesResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
            WHERE pu.persona_id = ${id}`
      );
      resultado.ubicaciones = ubicacionesResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas`);
      
      // También mostrar ubicaciones de los inmuebles relacionados
      if (resultado.inmuebles.length > 0) {
        console.log(`[DEBUG] Buscando ubicaciones de inmuebles relacionados`);
        for (const inmueble of resultado.inmuebles) {
          const ubicacionesInmuebleResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                WHERE iu.inmueble_id = ${inmueble.id}`
          );
          
          // Añadir ubicaciones que no estén ya en el resultado
          const ubicacionesInmueble = ubicacionesInmuebleResult.rows || [];
          console.log(`[DEBUG] Encontradas ${ubicacionesInmueble.length} ubicaciones para inmueble ID ${inmueble.id}`);
          
          for (const ubicacion of ubicacionesInmueble) {
            const yaExiste = resultado.ubicaciones.some((u: any) => u.id === ubicacion.id);
            if (!yaExiste) {
              resultado.ubicaciones.push(ubicacion);
            }
          }
        }
      }
    } 
    else if (tipo === "inmueble") {
      console.log(`[DEBUG] Buscando relaciones para inmueble ID ${id}`);
      
      // Personas relacionadas
      console.log(`[DEBUG] Buscando personas relacionadas a inmueble ID ${id}`);
      const personasResult = await db.execute(
        sql`SELECT p.* FROM personas p
            JOIN personas_inmuebles pi ON p.id = pi.persona_id
            WHERE pi.inmueble_id = ${id}`
      );
      resultado.personas = personasResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.personas.length} personas relacionadas`);
      
      // Ubicaciones relacionadas
      console.log(`[DEBUG] Buscando ubicaciones relacionadas a inmueble ID ${id}`);
      const ubicacionesResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
            WHERE iu.inmueble_id = ${id}`
      );
      resultado.ubicaciones = ubicacionesResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas`);
    }
    else if (tipo === "vehiculo") {
      console.log(`[DEBUG] Buscando relaciones para vehículo ID ${id}`);
      
      // Personas relacionadas
      console.log(`[DEBUG] Buscando personas relacionadas a vehículo ID ${id}`);
      const personasResult = await db.execute(
        sql`SELECT p.* FROM personas p
            JOIN personas_vehiculos pv ON p.id = pv.persona_id
            WHERE pv.vehiculo_id = ${id}`
      );
      resultado.personas = personasResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.personas.length} personas relacionadas`);
      
      // Ubicaciones relacionadas
      console.log(`[DEBUG] Buscando ubicaciones relacionadas a vehículo ID ${id}`);
      const ubicacionesResult = await db.execute(
        sql`SELECT u.* FROM ubicaciones u
            JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
            WHERE vu.vehiculo_id = ${id}`
      );
      resultado.ubicaciones = ubicacionesResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.ubicaciones.length} ubicaciones relacionadas`);
    }
    else if (tipo === "ubicacion") {
      console.log(`[DEBUG] Buscando relaciones para ubicación ID ${id}`);
      
      // Personas relacionadas
      console.log(`[DEBUG] Buscando personas relacionadas a ubicación ID ${id}`);
      const personasResult = await db.execute(
        sql`SELECT p.* FROM personas p
            JOIN personas_ubicaciones pu ON p.id = pu.persona_id
            WHERE pu.ubicacion_id = ${id}`
      );
      resultado.personas = personasResult.rows || [];
      console.log(`[DEBUG] Encontradas ${resultado.personas.length} personas relacionadas`);
      
      // Inmuebles relacionados
      console.log(`[DEBUG] Buscando inmuebles relacionados a ubicación ID ${id}`);
      const inmueblesResult = await db.execute(
        sql`SELECT i.* FROM inmuebles i
            JOIN inmuebles_ubicaciones iu ON i.id = iu.inmueble_id
            WHERE iu.ubicacion_id = ${id}`
      );
      resultado.inmuebles = inmueblesResult.rows || [];
      console.log(`[DEBUG] Encontrados ${resultado.inmuebles.length} inmuebles relacionados`);
      
      // Vehículos relacionados
      console.log(`[DEBUG] Buscando vehículos relacionados a ubicación ID ${id}`);
      const vehiculosResult = await db.execute(
        sql`SELECT v.* FROM vehiculos v
            JOIN vehiculos_ubicaciones vu ON v.id = vu.vehiculo_id
            WHERE vu.ubicacion_id = ${id}`
      );
      resultado.vehiculos = vehiculosResult.rows || [];
      console.log(`[DEBUG] Encontrados ${resultado.vehiculos.length} vehículos relacionados`);
    }
    else {
      throw new Error(`Tipo de entidad no válido: ${tipo}. Debe ser persona, vehiculo, inmueble o ubicacion.`);
    }
    
    console.log(`[DEBUG] Relaciones encontradas para ${tipo} ID ${id}:`, {
      personas: resultado.personas.length,
      vehiculos: resultado.vehiculos.length,
      inmuebles: resultado.inmuebles.length,
      ubicaciones: resultado.ubicaciones.length
    });
    
    return resultado;
  } catch (error) {
    console.error(`Error al obtener relaciones para ${tipo} ID ${id}:`, error);
    return resultado;
  }
}