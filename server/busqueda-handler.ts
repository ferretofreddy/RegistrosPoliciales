import { Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Función para buscar entidades que coincidan con un término específico
export async function buscarCoincidencias(req: Request, res: Response) {
  try {
    const { termino } = req.query;
    
    if (!termino || typeof termino !== 'string' || termino.trim() === '') {
      return res.status(400).json({ 
        error: 'Se requiere un término de búsqueda válido' 
      });
    }
    
    const searchTerm = termino.trim();
    const searchPattern = `%${searchTerm}%`;
    
    console.log(`Buscando coincidencias para: "${searchTerm}"`);
    
    // Resultados a devolver
    const coincidencias: any[] = [];
    
    // 1. Buscar personas
    try {
      const personasResult = await db.execute(
        sql`SELECT id, nombre, identificacion, alias 
            FROM personas 
            WHERE nombre LIKE ${searchPattern} 
            OR identificacion LIKE ${searchPattern}
            OR alias::text LIKE ${searchPattern}
            LIMIT 10`
      );
      
      if (personasResult.rows && personasResult.rows.length > 0) {
        personasResult.rows.forEach(persona => {
          coincidencias.push({
            id: persona.id,
            tipo: 'persona',
            texto: `${persona.nombre} ${persona.identificacion ? `(${persona.identificacion})` : ''}`,
            detalle: persona.alias && Array.isArray(persona.alias) && persona.alias.length > 0 ? `Alias: ${persona.alias.join(', ')}` : '',
            entidad: persona
          });
        });
      }
    } catch (error) {
      console.error("Error al buscar personas:", error);
    }
    
    // 2. Buscar vehículos
    try {
      const vehiculosResult = await db.execute(
        sql`SELECT id, placa, marca, modelo, tipo
            FROM vehiculos 
            WHERE placa LIKE ${searchPattern} 
            OR marca LIKE ${searchPattern}
            OR modelo LIKE ${searchPattern}
            OR tipo LIKE ${searchPattern}
            LIMIT 10`
      );
      
      if (vehiculosResult.rows && vehiculosResult.rows.length > 0) {
        vehiculosResult.rows.forEach(vehiculo => {
          coincidencias.push({
            id: vehiculo.id,
            tipo: 'vehiculo',
            texto: `${vehiculo.marca} ${vehiculo.modelo || ''} (${vehiculo.placa})`,
            detalle: vehiculo.tipo ? `Tipo: ${vehiculo.tipo}` : '',
            entidad: vehiculo
          });
        });
      }
    } catch (error) {
      console.error("Error al buscar vehículos:", error);
    }
    
    // 3. Buscar inmuebles
    try {
      const inmueblesResult = await db.execute(
        sql`SELECT id, tipo, direccion, propietario
            FROM inmuebles 
            WHERE tipo LIKE ${searchPattern} 
            OR direccion LIKE ${searchPattern}
            OR propietario LIKE ${searchPattern}
            LIMIT 10`
      );
      
      if (inmueblesResult.rows && inmueblesResult.rows.length > 0) {
        inmueblesResult.rows.forEach(inmueble => {
          coincidencias.push({
            id: inmueble.id,
            tipo: 'inmueble',
            texto: `${inmueble.tipo}: ${inmueble.direccion || 'Sin dirección'}`,
            detalle: inmueble.propietario ? `Propietario: ${inmueble.propietario}` : '',
            entidad: inmueble
          });
        });
      }
    } catch (error) {
      console.error("Error al buscar inmuebles:", error);
    }
    
    // 4. Buscar ubicaciones
    try {
      const ubicacionesResult = await db.execute(
        sql`SELECT id, tipo, latitud, longitud, observaciones
            FROM ubicaciones 
            WHERE tipo LIKE ${searchPattern} 
            OR observaciones LIKE ${searchPattern}
            LIMIT 10`
      );
      
      if (ubicacionesResult.rows && ubicacionesResult.rows.length > 0) {
        ubicacionesResult.rows.forEach(ubicacion => {
          coincidencias.push({
            id: ubicacion.id,
            tipo: 'ubicacion',
            texto: `${ubicacion.tipo}: [${Number(ubicacion.latitud).toFixed(6)}, ${Number(ubicacion.longitud).toFixed(6)}]`,
            detalle: ubicacion.observaciones || '',
            entidad: ubicacion
          });
        });
      }
    } catch (error) {
      console.error("Error al buscar ubicaciones:", error);
    }
    
    console.log(`Se encontraron ${coincidencias.length} coincidencias para "${searchTerm}"`);
    
    return res.json({ coincidencias });
    
  } catch (error) {
    console.error("Error en la búsqueda de coincidencias:", error);
    return res.status(500).json({ 
      error: 'Error en el servidor al procesar la búsqueda' 
    });
  }
}

// Función para obtener relaciones de una entidad específica
export async function obtenerRelaciones(req: Request, res: Response) {
  try {
    const { tipo, id } = req.params;
    
    if (!tipo || !id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Se requiere un tipo de entidad y un ID válido'
      });
    }
    
    const entidadId = parseInt(id);
    console.log(`Buscando relaciones para ${tipo} con ID: ${entidadId}`);
    
    // Dependiendo del tipo, se llamarían a diferentes funciones para buscar relaciones
    let relaciones: any = {
      ubicaciones: [],
      entidadesRelacionadas: []
    };
    
    switch (tipo) {
      case 'persona':
        // Obtener ubicaciones directas
        try {
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* 
                FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${entidadId}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          if (ubicacionesResult.rows && ubicacionesResult.rows.length > 0) {
            ubicacionesResult.rows.forEach(ubicacion => {
              relaciones.ubicaciones.push({
                ...ubicacion,
                tipo_relacion: 'directa'
              });
            });
          }
        } catch (error) {
          console.error("Error al obtener ubicaciones de persona:", error);
        }
        
        // Obtener inmuebles relacionados
        try {
          const inmueblesResult = await db.execute(
            sql`SELECT i.*, pi.persona_id
                FROM inmuebles i
                JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
                WHERE pi.persona_id = ${entidadId}`
          );
          
          if (inmueblesResult.rows && inmueblesResult.rows.length > 0) {
            for (const inmueble of inmueblesResult.rows) {
              // Buscar ubicaciones del inmueble
              const ubicacionesInmuebleResult = await db.execute(
                sql`SELECT u.* 
                    FROM ubicaciones u
                    JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                    WHERE iu.inmueble_id = ${inmueble.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              relaciones.entidadesRelacionadas.push({
                tipo: 'inmueble',
                entidad: inmueble,
                ubicaciones: ubicacionesInmuebleResult.rows || []
              });
              
              // Si el inmueble tiene ubicaciones, también las agregamos a la lista principal
              if (ubicacionesInmuebleResult.rows && ubicacionesInmuebleResult.rows.length > 0) {
                ubicacionesInmuebleResult.rows.forEach(ubicacion => {
                  relaciones.ubicaciones.push({
                    ...ubicacion,
                    tipo_relacion: 'inmueble',
                    entidad_relacionada: inmueble
                  });
                });
              }
            }
          }
        } catch (error) {
          console.error("Error al obtener inmuebles relacionados con persona:", error);
        }
        
        // Obtener vehículos relacionados
        try {
          const vehiculosResult = await db.execute(
            sql`SELECT v.*, pv.persona_id
                FROM vehiculos v
                JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
                WHERE pv.persona_id = ${entidadId}`
          );
          
          if (vehiculosResult.rows && vehiculosResult.rows.length > 0) {
            for (const vehiculo of vehiculosResult.rows) {
              // Buscar ubicaciones del vehículo
              const ubicacionesVehiculoResult = await db.execute(
                sql`SELECT u.* 
                    FROM ubicaciones u
                    JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                    WHERE vu.vehiculo_id = ${vehiculo.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              relaciones.entidadesRelacionadas.push({
                tipo: 'vehiculo',
                entidad: vehiculo,
                ubicaciones: ubicacionesVehiculoResult.rows || []
              });
              
              // Si el vehículo tiene ubicaciones, también las agregamos a la lista principal
              if (ubicacionesVehiculoResult.rows && ubicacionesVehiculoResult.rows.length > 0) {
                ubicacionesVehiculoResult.rows.forEach(ubicacion => {
                  relaciones.ubicaciones.push({
                    ...ubicacion,
                    tipo_relacion: 'vehiculo',
                    entidad_relacionada: vehiculo
                  });
                });
              }
            }
          }
        } catch (error) {
          console.error("Error al obtener vehículos relacionados con persona:", error);
        }
        break;
        
      case 'vehiculo':
        // Implementar búsqueda de relaciones para vehículos...
        break;
        
      case 'inmueble':
        // Implementar búsqueda de relaciones para inmuebles...
        break;
        
      case 'ubicacion':
        // Implementar búsqueda de relaciones para ubicaciones...
        break;
        
      default:
        return res.status(400).json({
          error: 'Tipo de entidad no válido'
        });
    }
    
    // Obtener datos de la entidad principal
    let entidadPrincipal = null;
    
    try {
      let entidadResult;
      
      switch (tipo) {
        case 'persona':
          entidadResult = await db.execute(
            sql`SELECT * FROM personas WHERE id = ${entidadId}`
          );
          break;
        case 'vehiculo':
          entidadResult = await db.execute(
            sql`SELECT * FROM vehiculos WHERE id = ${entidadId}`
          );
          break;
        case 'inmueble':
          entidadResult = await db.execute(
            sql`SELECT * FROM inmuebles WHERE id = ${entidadId}`
          );
          break;
        case 'ubicacion':
          entidadResult = await db.execute(
            sql`SELECT * FROM ubicaciones WHERE id = ${entidadId}`
          );
          break;
      }
      
      if (entidadResult && entidadResult.rows && entidadResult.rows.length > 0) {
        entidadPrincipal = entidadResult.rows[0];
      }
    } catch (error) {
      console.error(`Error al obtener datos de ${tipo} con ID ${entidadId}:`, error);
    }
    
    return res.json({
      entidad: {
        tipo,
        id: entidadId,
        datos: entidadPrincipal
      },
      relaciones
    });
    
  } catch (error) {
    console.error("Error al obtener relaciones:", error);
    return res.status(500).json({
      error: 'Error en el servidor al procesar la solicitud'
    });
  }
}