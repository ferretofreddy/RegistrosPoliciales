import { IStorage } from './storage';
import { 
  users, User, InsertUser, 
  personas, Persona, InsertPersona,
  personasObservaciones, PersonaObservacion, InsertPersonaObservacion,
  vehiculos, Vehiculo, InsertVehiculo,
  vehiculosObservaciones, VehiculoObservacion, InsertVehiculoObservacion,
  inmuebles, Inmueble, InsertInmueble,
  inmueblesObservaciones, InmuebleObservacion, InsertInmuebleObservacion,
  ubicaciones, Ubicacion, InsertUbicacion,
  personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones,
  personasPersonas, vehiculosVehiculos, inmueblesInmuebles
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, or, and, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllPersonas(): Promise<Persona[]> {
    return await db.select().from(personas);
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      // Asegurarnos de que los arrays son del tipo correcto
      const formattedData = {
        ...insertPersona,
        alias: Array.isArray(insertPersona.alias) ? insertPersona.alias : undefined,
        telefonos: Array.isArray(insertPersona.telefonos) ? insertPersona.telefonos : undefined,
        domicilios: Array.isArray(insertPersona.domicilios) ? insertPersona.domicilios : undefined
      };
      
      const [persona] = await db.insert(personas).values(formattedData).returning();
      return persona;
    } catch (error) {
      console.error("Error al crear persona:", error);
      throw error;
    }
  }

  async getAllVehiculos(): Promise<Vehiculo[]> {
    return await db.select().from(vehiculos);
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, id));
    return vehiculo;
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    const [vehiculo] = await db.insert(vehiculos).values(insertVehiculo).returning();
    return vehiculo;
  }

  async getAllInmuebles(): Promise<Inmueble[]> {
    return await db.select().from(inmuebles);
  }

  async getInmueble(id: number): Promise<Inmueble | undefined> {
    const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, id));
    return inmueble;
  }

  async createInmueble(insertInmueble: InsertInmueble): Promise<Inmueble> {
    const [inmueble] = await db.insert(inmuebles).values(insertInmueble).returning();
    return inmueble;
  }

  async getAllUbicaciones(): Promise<Ubicacion[]> {
    return await db.select().from(ubicaciones);
  }

  async getUbicacion(id: number): Promise<Ubicacion | undefined> {
    const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, id));
    return ubicacion;
  }

  async createUbicacion(insertUbicacion: InsertUbicacion): Promise<Ubicacion> {
    const [ubicacion] = await db.insert(ubicaciones).values(insertUbicacion).returning();
    return ubicacion;
  }

  // Observaciones de personas
  async getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]> {
    return await db
      .select()
      .from(personasObservaciones)
      .where(eq(personasObservaciones.personaId, personaId))
      .orderBy(desc(personasObservaciones.fecha));
  }

  async createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion> {
    const [newObservacion] = await db
      .insert(personasObservaciones)
      .values(observacion)
      .returning();
    return newObservacion;
  }

  // Observaciones de vehículos
  async getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]> {
    return await db
      .select()
      .from(vehiculosObservaciones)
      .where(eq(vehiculosObservaciones.vehiculoId, vehiculoId))
      .orderBy(desc(vehiculosObservaciones.fecha));
  }

  async createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion> {
    const [newObservacion] = await db
      .insert(vehiculosObservaciones)
      .values(observacion)
      .returning();
    return newObservacion;
  }

  // Observaciones de inmuebles
  async getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]> {
    return await db
      .select()
      .from(inmueblesObservaciones)
      .where(eq(inmueblesObservaciones.inmuebleId, inmuebleId))
      .orderBy(desc(inmueblesObservaciones.fecha));
  }

  async createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion> {
    const [newObservacion] = await db
      .insert(inmueblesObservaciones)
      .values(observacion)
      .returning();
    return newObservacion;
  }

  async buscar(query: string, tipos: string[]): Promise<any> {
    const searchPattern = `%${query}%`;
    const resultados: any = {};
    
    try {
      // Buscar personas
      if (tipos.includes('personas')) {
        // Búsqueda básica en la tabla principal
        const personasBasicas = await db.select().from(personas).where(
          or(
            like(personas.nombre, searchPattern),
            like(personas.identificacion, searchPattern)
          )
        );
        
        // Búsqueda en observaciones
        const personasIds = new Set();
        const personasDesdeObservaciones = await db
          .select({
            persona: personas
          })
          .from(personasObservaciones)
          .innerJoin(personas, eq(personasObservaciones.personaId, personas.id))
          .where(like(personasObservaciones.detalle, searchPattern));
        
        // Unir resultados
        resultados.personas = [...personasBasicas];
        for (const item of personasDesdeObservaciones) {
          if (!personasIds.has(item.persona.id)) {
            resultados.personas.push(item.persona);
            personasIds.add(item.persona.id);
          }
        }
      }
      
      // Buscar vehículos
      if (tipos.includes('vehiculos')) {
        // Búsqueda básica en la tabla principal
        const vehiculosBasicos = await db.select().from(vehiculos).where(
          or(
            like(vehiculos.marca, searchPattern),
            like(vehiculos.placa, searchPattern),
            like(vehiculos.tipo, searchPattern),
            like(vehiculos.color, searchPattern),
            sql`${vehiculos.modelo} IS NOT NULL AND ${vehiculos.modelo} LIKE ${searchPattern}`
          )
        );
        
        // Búsqueda en observaciones
        const vehiculosIds = new Set();
        const vehiculosDesdeObservaciones = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosObservaciones)
          .innerJoin(vehiculos, eq(vehiculosObservaciones.vehiculoId, vehiculos.id))
          .where(like(vehiculosObservaciones.detalle, searchPattern));
        
        // Unir resultados
        resultados.vehiculos = [...vehiculosBasicos];
        for (const item of vehiculosDesdeObservaciones) {
          if (!vehiculosIds.has(item.vehiculo.id)) {
            resultados.vehiculos.push(item.vehiculo);
            vehiculosIds.add(item.vehiculo.id);
          }
        }
      }
      
      // Buscar inmuebles
      if (tipos.includes('inmuebles')) {
        // Búsqueda básica en la tabla principal
        const inmueblesBasicos = await db.select().from(inmuebles).where(
          or(
            like(inmuebles.propietario, searchPattern),
            like(inmuebles.direccion, searchPattern),
            like(inmuebles.tipo, searchPattern)
          )
        );
        
        // Búsqueda en observaciones
        const inmueblesIds = new Set();
        const inmueblesDesdeObservaciones = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesObservaciones)
          .innerJoin(inmuebles, eq(inmueblesObservaciones.inmuebleId, inmuebles.id))
          .where(like(inmueblesObservaciones.detalle, searchPattern));
        
        // Unir resultados
        resultados.inmuebles = [...inmueblesBasicos];
        for (const item of inmueblesDesdeObservaciones) {
          if (!inmueblesIds.has(item.inmueble.id)) {
            resultados.inmuebles.push(item.inmueble);
            inmueblesIds.add(item.inmueble.id);
          }
        }
      }
      
      // Buscar ubicaciones
      if (tipos.includes('ubicaciones')) {
        resultados.ubicaciones = await db.select().from(ubicaciones).where(
          or(
            like(ubicaciones.tipo, searchPattern),
            sql`${ubicaciones.observaciones} IS NOT NULL AND ${ubicaciones.observaciones} LIKE ${searchPattern}`,
            sql`CAST(${ubicaciones.latitud} AS TEXT) LIKE ${searchPattern}`,
            sql`CAST(${ubicaciones.longitud} AS TEXT) LIKE ${searchPattern}`
          )
        );
      }
      
      console.log("Resultados de búsqueda:", JSON.stringify(resultados));
      return resultados;
    } catch (error) {
      console.error("Error en búsqueda:", error);
      throw error;
    }
  }

  async crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
    try {
      // Normalize tipos
      const t1 = tipo1.replace(/s$/, ''); // remove trailing 's' if present
      const t2 = tipo2.replace(/s$/, '');
      
      // Relaciones entre entidades del mismo tipo
      if (t1 === 'persona' && t2 === 'persona') {
        await db.insert(personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        });
        return { success: true };
      } else if (t1 === 'vehiculo' && t2 === 'vehiculo') {
        await db.insert(vehiculosVehiculos).values({
          vehiculoId1: id1,
          vehiculoId2: id2
        });
        return { success: true };
      } else if (t1 === 'inmueble' && t2 === 'inmueble') {
        await db.insert(inmueblesInmuebles).values({
          inmuebleId1: id1,
          inmuebleId2: id2
        });
        return { success: true };
      }
      // Relaciones entre diferentes tipos de entidades
      else if (t1 === 'persona' && t2 === 'vehiculo') {
        await db.insert(personasVehiculos).values({
          personaId: id1,
          vehiculoId: id2
        });
        return { success: true };
      } else if (t1 === 'persona' && t2 === 'inmueble') {
        await db.insert(personasInmuebles).values({
          personaId: id1,
          inmuebleId: id2
        });
        return { success: true };
      } else if (t1 === 'persona' && t2 === 'ubicacion') {
        await db.insert(personasUbicaciones).values({
          personaId: id1,
          ubicacionId: id2
        });
        return { success: true };
      } else if (t1 === 'vehiculo' && t2 === 'persona') {
        return this.crearRelacion(t2, id2, t1, id1);
      } else if (t1 === 'vehiculo' && t2 === 'inmueble') {
        await db.insert(vehiculosInmuebles).values({
          vehiculoId: id1,
          inmuebleId: id2
        });
        return { success: true };
      } else if (t1 === 'vehiculo' && t2 === 'ubicacion') {
        await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id1,
          ubicacionId: id2
        });
        return { success: true };
      } else if (t1 === 'inmueble' && t2 === 'persona') {
        return this.crearRelacion(t2, id2, t1, id1);
      } else if (t1 === 'inmueble' && t2 === 'vehiculo') {
        return this.crearRelacion(t2, id2, t1, id1);
      } else if (t1 === 'inmueble' && t2 === 'ubicacion') {
        await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id1,
          ubicacionId: id2
        });
        return { success: true };
      } else if (t1 === 'ubicacion') {
        return this.crearRelacion(t2, id2, t1, id1);
      }
      
      return { error: 'Combinación de tipos inválida' };
    } catch (error) {
      console.error("Error al crear relación:", error);
      return { error: 'Error al crear relación', details: error };
    }
  }

  async buscarUbicacionesConCoordenadas(query: string, tipos: string[]): Promise<any> {
    const searchPattern = `%${query}%`;
    const resultado: any = {
      ubicacionesDirectas: [],      // Ubicaciones que directamente coinciden con la búsqueda
      entidadesRelacionadas: [],    // Entidades encontradas que están relacionadas con ubicaciones
      ubicacionesRelacionadas: []   // Ubicaciones con coordenadas relacionadas con entidades encontradas
    };
    
    try {
      console.log(`Buscando ubicaciones con query: "${query}", patrón: "${searchPattern}" y tipos: ${tipos.join(', ')}`);
      
      // 1. Primero, buscar ubicaciones directas con coordenadas válidas
      const ubicacionesDirectas = await db
        .select()
        .from(ubicaciones)
        .where(
          and(
            or(
              like(ubicaciones.tipo, searchPattern),
              sql`${ubicaciones.observaciones} IS NOT NULL AND ${ubicaciones.observaciones} LIKE ${searchPattern}`
            ),
            sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
          )
        );
      
      console.log(`Ubicaciones directas encontradas: ${ubicacionesDirectas.length}`);
      resultado.ubicacionesDirectas = ubicacionesDirectas;
      
      // Procesar cada ubicación encontrada
      for (const ubicacion of ubicacionesDirectas) {
        console.log(`Procesando ubicación ID ${ubicacion.id}: ${ubicacion.tipo}`);
        
        // Buscar entidades relacionadas con cada ubicación
        const relaciones = await this.getRelaciones('ubicacion', ubicacion.id);
        console.log(`Relaciones encontradas para ubicación ${ubicacion.id}:`, {
          personas: relaciones.personas?.length || 0,
          vehiculos: relaciones.vehiculos?.length || 0,
          inmuebles: relaciones.inmuebles?.length || 0
        });
        
        // Agregar las relaciones al resultado
        if (tipos.includes('personas') && relaciones.personas && relaciones.personas.length > 0) {
          for (const persona of relaciones.personas) {
            resultado.entidadesRelacionadas.push({
              tipo: 'persona',
              entidad: persona,
              ubicacionId: ubicacion.id
            });
          }
        }
        
        if (tipos.includes('vehiculos') && relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          for (const vehiculo of relaciones.vehiculos) {
            resultado.entidadesRelacionadas.push({
              tipo: 'vehiculo',
              entidad: vehiculo,
              ubicacionId: ubicacion.id
            });
          }
        }
        
        if (tipos.includes('inmuebles') && relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          for (const inmueble of relaciones.inmuebles) {
            resultado.entidadesRelacionadas.push({
              tipo: 'inmueble',
              entidad: inmueble,
              ubicacionId: ubicacion.id
            });
          }
        }
      }
      
      // 2. Buscar entidades que coincidan con la búsqueda y luego sus ubicaciones
      
      // Buscar personas que coincidan
      if (tipos.includes('personas')) {
        // Cambiamos a consulta SQL directa para verificar que funcione correctamente
        // y evitar cualquier problema con la sintaxis de Drizzle
        const queryString = query.trim();
        
        // Para la identificación, intentamos primero una coincidencia exacta
        // y luego una coincidencia parcial con LIKE
        const personasEncontradas = await db.execute(
          sql`SELECT * FROM personas WHERE 
              LOWER(nombre) LIKE LOWER(${searchPattern}) OR 
              identificacion = ${queryString} OR 
              LOWER(identificacion) LIKE LOWER(${searchPattern}) OR 
              alias::text LIKE LOWER(${searchPattern})`
        );
        
        // Los resultados de db.execute() vienen en formato diferente
        const personasResultados = personasEncontradas.rows || [];
        console.log(`Personas encontradas por búsqueda: ${personasResultados.length}`, personasResultados);
        
        // Para cada persona encontrada, buscar sus ubicaciones y relaciones bidireccionales
        for (const persona of personasResultados) {
          console.log(`Buscando ubicaciones para persona (ID ${persona.id}): ${persona.nombre || 'Sin nombre'}`);
          
          // 1. Buscar ubicaciones directamente relacionadas con esta persona
          const relacionesPersona = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(personasUbicaciones)
            .innerJoin(ubicaciones, eq(personasUbicaciones.ubicacionId, ubicaciones.id))
            .where(
              and(
                eq(personasUbicaciones.personaId, persona.id),
                sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
              )
            );
          
          console.log(`Ubicaciones directas encontradas para persona (ID ${persona.id}): ${relacionesPersona.length}`);
          
          for (const rel of relacionesPersona) {
            resultado.ubicacionesRelacionadas.push({
              ubicacion: rel.ubicacion,
              entidadRelacionada: {
                tipo: 'persona',
                entidad: persona
              }
            });
          }
          
          // 2. Buscar relaciones con inmuebles y obtener sus ubicaciones
          const inmueblesRelacionados = await db
            .select({
              inmueble: inmuebles
            })
            .from(personasInmuebles)
            .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
            .where(eq(personasInmuebles.personaId, persona.id));
            
          console.log(`Inmuebles relacionados con persona (ID ${persona.id}): ${inmueblesRelacionados.length}`);
          
          // Para cada inmueble relacionado, buscar sus ubicaciones
          for (const inmuebleRel of inmueblesRelacionados) {
            const ubicacionesInmueble = await db
              .select({
                ubicacion: ubicaciones
              })
              .from(inmueblesUbicaciones)
              .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
              .where(
                and(
                  eq(inmueblesUbicaciones.inmuebleId, inmuebleRel.inmueble.id),
                  sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
                )
              );
              
            console.log(`Ubicaciones encontradas para inmueble relacionado (ID ${inmuebleRel.inmueble.id}): ${ubicacionesInmueble.length}`);
            
            for (const ubiInmueble of ubicacionesInmueble) {
              resultado.ubicacionesRelacionadas.push({
                ubicacion: ubiInmueble.ubicacion,
                entidadRelacionada: {
                  tipo: 'inmueble',
                  entidad: inmuebleRel.inmueble,
                  vinculadoCon: {
                    tipo: 'persona',
                    entidad: persona
                  }
                }
              });
            }
          }
          
          // 3. Buscar relaciones con vehículos y obtener sus ubicaciones
          const vehiculosRelacionados = await db
            .select({
              vehiculo: vehiculos
            })
            .from(personasVehiculos)
            .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
            .where(eq(personasVehiculos.personaId, persona.id));
            
          console.log(`Vehículos relacionados con persona (ID ${persona.id}): ${vehiculosRelacionados.length}`);
          
          // Para cada vehículo relacionado, buscar sus ubicaciones
          for (const vehiculoRel of vehiculosRelacionados) {
            const ubicacionesVehiculo = await db
              .select({
                ubicacion: ubicaciones
              })
              .from(vehiculosUbicaciones)
              .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
              .where(
                and(
                  eq(vehiculosUbicaciones.vehiculoId, vehiculoRel.vehiculo.id),
                  sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
                )
              );
              
            console.log(`Ubicaciones encontradas para vehículo relacionado (ID ${vehiculoRel.vehiculo.id}): ${ubicacionesVehiculo.length}`);
            
            for (const ubiVehiculo of ubicacionesVehiculo) {
              resultado.ubicacionesRelacionadas.push({
                ubicacion: ubiVehiculo.ubicacion,
                entidadRelacionada: {
                  tipo: 'vehiculo',
                  entidad: vehiculoRel.vehiculo,
                  vinculadoCon: {
                    tipo: 'persona',
                    entidad: persona
                  }
                }
              });
            }
          }
        }
      }
      
      // Buscar vehículos que coincidan
      if (tipos.includes('vehiculos')) {
        // Obtenemos el string literal de la consulta para búsquedas exactas
        const queryString = query.trim();
        
        // Usamos SQL directo para poder hacer búsqueda exacta por placa
        const vehiculosEncontrados = await db.execute(
          sql`SELECT * FROM vehiculos WHERE 
              placa = ${queryString} OR
              LOWER(placa) LIKE LOWER(${searchPattern}) OR 
              LOWER(marca) LIKE LOWER(${searchPattern}) OR 
              LOWER(modelo) LIKE LOWER(${searchPattern}) OR 
              LOWER(color) LIKE LOWER(${searchPattern}) OR
              LOWER(tipo) LIKE LOWER(${searchPattern})`
        );
        
        // Los resultados de db.execute() vienen en formato diferente
        const vehiculosResultados = vehiculosEncontrados.rows || [];
        
        console.log(`Vehículos encontrados por búsqueda: ${vehiculosResultados.length}`);
        
        // Para cada vehículo encontrado, buscar sus ubicaciones relacionadas
        for (const vehiculo of vehiculosResultados) {
          console.log(`Buscando ubicaciones para vehículo (ID ${vehiculo.id}): ${vehiculo.placa || 'Sin placa'}`);
          
          const relacionesVehiculo = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(vehiculosUbicaciones)
            .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
            .where(
              and(
                eq(vehiculosUbicaciones.vehiculoId, vehiculo.id),
                sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
              )
            );
          
          for (const rel of relacionesVehiculo) {
            resultado.ubicacionesRelacionadas.push({
              ubicacion: rel.ubicacion,
              entidadRelacionada: {
                tipo: 'vehiculo',
                entidad: vehiculo
              }
            });
          }
        }
      }
      
      // Buscar inmuebles que coincidan
      if (tipos.includes('inmuebles')) {
        // Obtenemos el string literal de la consulta para búsquedas exactas
        const queryString = query.trim();
        
        // Usamos SQL directo para poder hacer búsqueda exacta
        const inmueblesEncontrados = await db.execute(
          sql`SELECT * FROM inmuebles WHERE 
              identificacion = ${queryString} OR
              LOWER(identificacion) LIKE LOWER(${searchPattern}) OR 
              LOWER(direccion) LIKE LOWER(${searchPattern}) OR 
              LOWER(tipo) LIKE LOWER(${searchPattern}) OR 
              LOWER(propietario) LIKE LOWER(${searchPattern})`
        );
        
        // Los resultados de db.execute() vienen en formato diferente
        const inmueblesResultados = inmueblesEncontrados.rows || [];
        console.log(`Inmuebles encontrados por búsqueda: ${inmueblesResultados.length}`);
        
        // Para cada inmueble encontrado, buscar sus ubicaciones relacionadas
        for (const inmueble of inmueblesResultados) {
          console.log(`Buscando ubicaciones para inmueble (ID ${inmueble.id}): ${inmueble.direccion || 'Sin dirección'}`);
          
          const relacionesInmueble = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(inmueblesUbicaciones)
            .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
            .where(
              and(
                eq(inmueblesUbicaciones.inmuebleId, inmueble.id),
                sql`${ubicaciones.latitud} IS NOT NULL AND ${ubicaciones.longitud} IS NOT NULL`
              )
            );
          
          for (const rel of relacionesInmueble) {
            resultado.ubicacionesRelacionadas.push({
              ubicacion: rel.ubicacion,
              entidadRelacionada: {
                tipo: 'inmueble',
                entidad: inmueble
              }
            });
          }
        }
      }
      
    } catch (error) {
      console.error("Error al buscar ubicaciones con coordenadas:", error);
    }
    
    return resultado;
  }
  
  async getRelaciones(tipo: string, id: number): Promise<any> {
    const resultado: any = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
    
    try {
      // Normalize tipo
      const t = tipo.replace(/s$/, ''); // remove trailing 's' if present
      
      // Vamos a buscar todas las relaciones relevantes para cada tipo de entidad
      // independientemente del tipo que sea la entidad principal
      
      // 1. BUSCAR RELACIONES CON PERSONAS
      if (t === 'persona') {
        // Buscar otras personas relacionadas
        const personasRelacionadas1 = await db
          .select({
            persona: personas
          })
          .from(personasPersonas)
          .innerJoin(personas, eq(personasPersonas.personaId2, personas.id))
          .where(eq(personasPersonas.personaId1, id));
        
        const personasRelacionadas2 = await db
          .select({
            persona: personas
          })
          .from(personasPersonas)
          .innerJoin(personas, eq(personasPersonas.personaId1, personas.id))
          .where(eq(personasPersonas.personaId2, id));
        
        resultado.personas = [
          ...personasRelacionadas1.map(r => r.persona),
          ...personasRelacionadas2.map(r => r.persona)
        ];
        
        // Estamos viendo una persona, buscar vehículos relacionados
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(personasVehiculos)
          .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
          .where(eq(personasVehiculos.personaId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Buscar inmuebles relacionados
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(personasInmuebles)
          .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
          .where(eq(personasInmuebles.personaId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
        
        // Buscar ubicaciones relacionadas
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(personasUbicaciones)
          .innerJoin(ubicaciones, eq(personasUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(personasUbicaciones.personaId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'vehiculo') {
        // Buscar otros vehículos relacionados
        const vehiculosRelacionados1 = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosVehiculos)
          .innerJoin(vehiculos, eq(vehiculosVehiculos.vehiculoId2, vehiculos.id))
          .where(eq(vehiculosVehiculos.vehiculoId1, id));
        
        const vehiculosRelacionados2 = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosVehiculos)
          .innerJoin(vehiculos, eq(vehiculosVehiculos.vehiculoId1, vehiculos.id))
          .where(eq(vehiculosVehiculos.vehiculoId2, id));
        
        resultado.vehiculos = [
          ...vehiculosRelacionados1.map(r => r.vehiculo),
          ...vehiculosRelacionados2.map(r => r.vehiculo)
        ];
        
        // 1. Obtener personas relacionadas con este vehículo
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasVehiculos)
          .innerJoin(personas, eq(personasVehiculos.personaId, personas.id))
          .where(eq(personasVehiculos.vehiculoId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // 2. Obtener inmuebles relacionados con este vehículo
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(vehiculosInmuebles)
          .innerJoin(inmuebles, eq(vehiculosInmuebles.inmuebleId, inmuebles.id))
          .where(eq(vehiculosInmuebles.vehiculoId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
        
        // 3. Obtener ubicaciones relacionadas con este vehículo
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(vehiculosUbicaciones)
          .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(vehiculosUbicaciones.vehiculoId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'inmueble') {
        // Buscar otros inmuebles relacionados
        const inmueblesRelacionados1 = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesInmuebles)
          .innerJoin(inmuebles, eq(inmueblesInmuebles.inmuebleId2, inmuebles.id))
          .where(eq(inmueblesInmuebles.inmuebleId1, id));
        
        const inmueblesRelacionados2 = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesInmuebles)
          .innerJoin(inmuebles, eq(inmueblesInmuebles.inmuebleId1, inmuebles.id))
          .where(eq(inmueblesInmuebles.inmuebleId2, id));
        
        resultado.inmuebles = [
          ...inmueblesRelacionados1.map(r => r.inmueble),
          ...inmueblesRelacionados2.map(r => r.inmueble)
        ];
        
        // 1. Obtener personas relacionadas con este inmueble
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasInmuebles)
          .innerJoin(personas, eq(personasInmuebles.personaId, personas.id))
          .where(eq(personasInmuebles.inmuebleId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // 2. Obtener vehículos relacionados con este inmueble
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosInmuebles)
          .innerJoin(vehiculos, eq(vehiculosInmuebles.vehiculoId, vehiculos.id))
          .where(eq(vehiculosInmuebles.inmuebleId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // 3. Obtener ubicaciones relacionadas con este inmueble
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(inmueblesUbicaciones)
          .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(inmueblesUbicaciones.inmuebleId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'ubicacion') {
        // 1. Obtener personas relacionadas con esta ubicación
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasUbicaciones)
          .innerJoin(personas, eq(personasUbicaciones.personaId, personas.id))
          .where(eq(personasUbicaciones.ubicacionId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // 2. Obtener vehículos relacionados con esta ubicación
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosUbicaciones)
          .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
          .where(eq(vehiculosUbicaciones.ubicacionId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // 3. Obtener inmuebles relacionados con esta ubicación
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesUbicaciones)
          .innerJoin(inmuebles, eq(inmueblesUbicaciones.inmuebleId, inmuebles.id))
          .where(eq(inmueblesUbicaciones.ubicacionId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
      }
    } catch (error) {
      console.error("Error al obtener relaciones:", error);
    }
    
    return resultado;
  }
}