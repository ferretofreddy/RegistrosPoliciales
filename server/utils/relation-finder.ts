import { db } from "../db";
import { personas, vehiculos, inmuebles, ubicaciones } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Utilidad para encontrar todas las relaciones y ubicaciones de una entidad
 * Incluye tanto relaciones directas como de segundo nivel con sus coordenadas
 */
export async function findAllRelationsWithCoordinates(tipo: string, id: number) {
  // Normalizar el tipo para que coincida con las tablas
  const tipoNormalizado = normalizarTipo(tipo);
  
  // Estructura para almacenar los resultados
  const resultado: any = {
    entidad: null,
    ubicacionesDirectas: [],
    ubicacionesRelacionadas: [],
    relacionesNivel1: {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    },
    relacionesNivel2: {}
  };
  
  // Set para evitar procesar entidades duplicadas
  const entidadesProcesadas = new Set<string>();
  const ubicacionesProcesadas = new Set<number>();
  
  // Marcar la entidad principal como procesada
  entidadesProcesadas.add(`${tipoNormalizado}-${id}`);
  
  // 1. Obtener la entidad principal
  resultado.entidad = await obtenerEntidad(tipoNormalizado, id);
  if (!resultado.entidad) {
    return resultado;
  }
  
  // 2. Obtener ubicaciones directas de la entidad principal
  const ubicacionesDirectas = await obtenerUbicacionesDirectas(tipoNormalizado, id);
  
  // Marcar ubicaciones como procesadas y agregar al resultado
  for (const ubicacion of ubicacionesDirectas) {
    if (ubicacion.latitud && ubicacion.longitud) {
      resultado.ubicacionesDirectas.push(ubicacion);
      ubicacionesProcesadas.add(ubicacion.id);
    }
  }
  
  // 3. Obtener relaciones de primer nivel
  const relacionesNivel1 = await obtenerRelacionesDirectas(tipoNormalizado, id);
  
  // 4. Para cada relación de primer nivel, obtener sus ubicaciones
  for (const tipoRel in relacionesNivel1) {
    if (relacionesNivel1[tipoRel].length > 0) {
      // Guardar las entidades relacionadas en el resultado
      resultado.relacionesNivel1[tipoRel] = relacionesNivel1[tipoRel];
      
      // Marcar estas entidades como procesadas
      for (const entidad of relacionesNivel1[tipoRel]) {
        entidadesProcesadas.add(`${tipoRel}-${entidad.id}`);
        
        // Obtener ubicaciones de esta entidad relacionada
        const ubicacionesRelacion = await obtenerUbicacionesDirectas(tipoRel, entidad.id);
        
        for (const ubicacion of ubicacionesRelacion) {
          if (ubicacion.latitud && ubicacion.longitud && !ubicacionesProcesadas.has(ubicacion.id)) {
            resultado.ubicacionesRelacionadas.push({
              ubicacion: ubicacion,
              entidadRelacionada: {
                tipo: tipoRel,
                entidad: entidad,
                relacionadoCon: {
                  tipo: tipoNormalizado,
                  entidad: resultado.entidad
                }
              }
            });
            ubicacionesProcesadas.add(ubicacion.id);
          }
        }
        
        // 5. Obtener relaciones de segundo nivel (sólo si no están ya procesadas)
        const relacionesNivel2 = await obtenerRelacionesDirectas(tipoRel, entidad.id);
        
        // Inicializar objeto para este tipo si no existe
        if (!resultado.relacionesNivel2[tipoRel]) {
          resultado.relacionesNivel2[tipoRel] = {};
        }
        
        // Para cada entidad relacionada de nivel 2
        for (const tipoRel2 in relacionesNivel2) {
          if (relacionesNivel2[tipoRel2].length > 0) {
            // Inicializar array para este tipo si no existe
            if (!resultado.relacionesNivel2[tipoRel][tipoRel2]) {
              resultado.relacionesNivel2[tipoRel][tipoRel2] = [];
            }
            
            for (const entidadNivel2 of relacionesNivel2[tipoRel2]) {
              // Verificar si ya fue procesada
              if (!entidadesProcesadas.has(`${tipoRel2}-${entidadNivel2.id}`)) {
                entidadesProcesadas.add(`${tipoRel2}-${entidadNivel2.id}`);
                
                // Agregar al resultado con información de la ruta de relación
                resultado.relacionesNivel2[tipoRel][tipoRel2].push({
                  ...entidadNivel2,
                  rutaRelacion: {
                    nivel1: {
                      tipo: tipoRel,
                      id: entidad.id
                    }
                  }
                });
                
                // Obtener ubicaciones de esta entidad de nivel 2
                const ubicacionesNivel2 = await obtenerUbicacionesDirectas(tipoRel2, entidadNivel2.id);
                
                for (const ubicacion of ubicacionesNivel2) {
                  if (ubicacion.latitud && ubicacion.longitud && !ubicacionesProcesadas.has(ubicacion.id)) {
                    resultado.ubicacionesRelacionadas.push({
                      ubicacion: ubicacion,
                      entidadRelacionada: {
                        tipo: tipoRel2,
                        entidad: entidadNivel2,
                        relacionadoCon: {
                          tipo: tipoRel,
                          entidad: entidad,
                          relacionadoCon: {
                            tipo: tipoNormalizado,
                            entidad: resultado.entidad
                          }
                        }
                      }
                    });
                    ubicacionesProcesadas.add(ubicacion.id);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return resultado;
}

/**
 * Normaliza el tipo de entidad para que coincida con las tablas
 */
function normalizarTipo(tipo: string): string {
  tipo = tipo.toLowerCase();
  
  if (tipo === 'persona') return 'personas';
  if (tipo === 'vehiculo') return 'vehiculos';
  if (tipo === 'inmueble') return 'inmuebles';
  if (tipo === 'ubicacion') return 'ubicaciones';
  
  return tipo;
}

/**
 * Obtiene la entidad según su tipo e ID
 */
async function obtenerEntidad(tipo: string, id: number) {
  try {
    if (tipo === 'personas') {
      const [persona] = await db.select().from(personas).where(eq(personas.id, id));
      return persona;
    } else if (tipo === 'vehiculos') {
      const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, id));
      return vehiculo;
    } else if (tipo === 'inmuebles') {
      const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, id));
      return inmueble;
    } else if (tipo === 'ubicaciones') {
      const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, id));
      return ubicacion;
    }
  } catch (error) {
    console.error(`Error al obtener entidad ${tipo} con ID ${id}:`, error);
  }
  
  return null;
}

/**
 * Obtiene las ubicaciones directamente relacionadas con una entidad
 */
async function obtenerUbicacionesDirectas(tipo: string, id: number) {
  const result: any[] = [];
  
  try {
    if (tipo === 'personas') {
      // 1. Buscar ubicaciones relacionadas directamente a través de la tabla de relaciones
      const relacionesUbi = await db.select().from(sql`personas_ubicaciones`)
        .where(sql`persona_id = ${id}`);
      
      for (const rel of relacionesUbi) {
        const [ubicacion] = await db.select().from(ubicaciones)
          .where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.push(ubicacion);
        }
      }
      
      // 2. Buscar ubicaciones que mencionen los domicilios de la persona
      const [persona] = await db.select().from(personas).where(eq(personas.id, id));
      
      if (persona && persona.domicilios) {
        for (const domicilio of persona.domicilios) {
          if (domicilio) {
            const ubicacionesDomicilio = await db.select().from(ubicaciones)
              .where(sql`tipo = 'Domicilio' AND observaciones LIKE ${'%' + domicilio + '%'}`);
            
            result.push(...ubicacionesDomicilio);
          }
        }
      }
    } else if (tipo === 'vehiculos') {
      // Buscar ubicaciones relacionadas con el vehículo
      const relacionesUbi = await db.select().from(sql`vehiculos_ubicaciones`)
        .where(sql`vehiculo_id = ${id}`);
      
      for (const rel of relacionesUbi) {
        const [ubicacion] = await db.select().from(ubicaciones)
          .where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.push(ubicacion);
        }
      }
    } else if (tipo === 'inmuebles') {
      // 1. Buscar ubicaciones relacionadas con el inmueble
      const relacionesUbi = await db.select().from(sql`inmuebles_ubicaciones`)
        .where(sql`inmueble_id = ${id}`);
      
      for (const rel of relacionesUbi) {
        const [ubicacion] = await db.select().from(ubicaciones)
          .where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.push(ubicacion);
        }
      }
      
      // 2. Buscar ubicaciones que mencionen la dirección del inmueble
      const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, id));
      
      if (inmueble && inmueble.direccion) {
        const ubicacionesDireccion = await db.select().from(ubicaciones)
          .where(sql`observaciones LIKE ${'%' + inmueble.direccion + '%'}`);
        
        result.push(...ubicacionesDireccion);
      }
    }
  } catch (error) {
    console.error(`Error al obtener ubicaciones directas para ${tipo} con ID ${id}:`, error);
  }
  
  // Eliminar duplicados
  return result.filter((ubicacion, index, self) => 
    index === self.findIndex(u => u.id === ubicacion.id)
  );
}

/**
 * Obtiene todas las entidades directamente relacionadas con una entidad
 */
async function obtenerRelacionesDirectas(tipo: string, id: number) {
  const result: any = {
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
  };
  
  try {
    // Relaciones para personas
    if (tipo === 'personas') {
      // Personas relacionadas con esta persona
      const personasRelacionadas = await db.select().from(sql`personas_personas`)
        .where(sql`persona1_id = ${id} OR persona2_id = ${id}`);
      
      for (const rel of personasRelacionadas) {
        const otraPersonaId = rel.persona1_id === id ? rel.persona2_id : rel.persona1_id;
        const [persona] = await db.select().from(personas).where(eq(personas.id, otraPersonaId));
        
        if (persona) {
          result.personas.push(persona);
        }
      }
      
      // Vehículos relacionados con esta persona
      const vehiculosRelacionados = await db.select().from(sql`personas_vehiculos`)
        .where(sql`persona_id = ${id}`);
      
      for (const rel of vehiculosRelacionados) {
        const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, rel.vehiculo_id));
        
        if (vehiculo) {
          result.vehiculos.push(vehiculo);
        }
      }
      
      // Inmuebles relacionados con esta persona
      const inmueblesRelacionados = await db.select().from(sql`personas_inmuebles`)
        .where(sql`persona_id = ${id}`);
      
      for (const rel of inmueblesRelacionados) {
        const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, rel.inmueble_id));
        
        if (inmueble) {
          result.inmuebles.push(inmueble);
        }
      }
      
      // Ubicaciones relacionadas con esta persona
      const ubicacionesRelacionadas = await db.select().from(sql`personas_ubicaciones`)
        .where(sql`persona_id = ${id}`);
      
      for (const rel of ubicacionesRelacionadas) {
        const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.ubicaciones.push(ubicacion);
        }
      }
    }
    
    // Relaciones para vehículos
    else if (tipo === 'vehiculos') {
      // Personas relacionadas con este vehículo
      const personasRelacionadas = await db.select().from(sql`personas_vehiculos`)
        .where(sql`vehiculo_id = ${id}`);
      
      for (const rel of personasRelacionadas) {
        const [persona] = await db.select().from(personas).where(eq(personas.id, rel.persona_id));
        
        if (persona) {
          result.personas.push(persona);
        }
      }
      
      // Vehículos relacionados con este vehículo
      const vehiculosRelacionados = await db.select().from(sql`vehiculos_vehiculos`)
        .where(sql`vehiculo1_id = ${id} OR vehiculo2_id = ${id}`);
      
      for (const rel of vehiculosRelacionados) {
        const otroVehiculoId = rel.vehiculo1_id === id ? rel.vehiculo2_id : rel.vehiculo1_id;
        const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, otroVehiculoId));
        
        if (vehiculo) {
          result.vehiculos.push(vehiculo);
        }
      }
      
      // Inmuebles relacionados con este vehículo
      const inmueblesRelacionados = await db.select().from(sql`vehiculos_inmuebles`)
        .where(sql`vehiculo_id = ${id}`);
      
      for (const rel of inmueblesRelacionados) {
        const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, rel.inmueble_id));
        
        if (inmueble) {
          result.inmuebles.push(inmueble);
        }
      }
      
      // Ubicaciones relacionadas con este vehículo
      const ubicacionesRelacionadas = await db.select().from(sql`vehiculos_ubicaciones`)
        .where(sql`vehiculo_id = ${id}`);
      
      for (const rel of ubicacionesRelacionadas) {
        const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.ubicaciones.push(ubicacion);
        }
      }
    }
    
    // Relaciones para inmuebles
    else if (tipo === 'inmuebles') {
      // Personas relacionadas con este inmueble
      const personasRelacionadas = await db.select().from(sql`personas_inmuebles`)
        .where(sql`inmueble_id = ${id}`);
      
      for (const rel of personasRelacionadas) {
        const [persona] = await db.select().from(personas).where(eq(personas.id, rel.persona_id));
        
        if (persona) {
          result.personas.push(persona);
        }
      }
      
      // Vehículos relacionados con este inmueble
      const vehiculosRelacionados = await db.select().from(sql`vehiculos_inmuebles`)
        .where(sql`inmueble_id = ${id}`);
      
      for (const rel of vehiculosRelacionados) {
        const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, rel.vehiculo_id));
        
        if (vehiculo) {
          result.vehiculos.push(vehiculo);
        }
      }
      
      // Inmuebles relacionados con este inmueble
      const inmueblesRelacionados = await db.select().from(sql`inmuebles_inmuebles`)
        .where(sql`inmueble1_id = ${id} OR inmueble2_id = ${id}`);
      
      for (const rel of inmueblesRelacionados) {
        const otroInmuebleId = rel.inmueble1_id === id ? rel.inmueble2_id : rel.inmueble1_id;
        const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, otroInmuebleId));
        
        if (inmueble) {
          result.inmuebles.push(inmueble);
        }
      }
      
      // Ubicaciones relacionadas con este inmueble
      const ubicacionesRelacionadas = await db.select().from(sql`inmuebles_ubicaciones`)
        .where(sql`inmueble_id = ${id}`);
      
      for (const rel of ubicacionesRelacionadas) {
        const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, rel.ubicacion_id));
        
        if (ubicacion) {
          result.ubicaciones.push(ubicacion);
        }
      }
    }
    
    // Eliminar duplicados
    for (const tipo in result) {
      result[tipo] = result[tipo].filter((entidad: any, index: number, self: any[]) => 
        index === self.findIndex((e: any) => e.id === entidad.id)
      );
    }
  } catch (error) {
    console.error(`Error al obtener relaciones para ${tipo} con ID ${id}:`, error);
  }
  
  return result;
}