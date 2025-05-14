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
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones
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
      // No necesitamos el formatting especial, drizzle-orm maneja correctamente los JSON arrays
      const [persona] = await db.insert(personas).values(insertPersona).returning();
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
      
      if (t1 === 'persona' && t2 === 'vehiculo') {
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
      
      // Buscamos relaciones bidireccionales independientemente del tipo
      // Para cada consulta, primero buscamos relaciones directas y luego inversas
      
      // 1. RELACIONES DE PERSONAS
      if (t === 'persona') {
        // Obtener vehículos relacionados con esta persona (directa)
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(personasVehiculos)
          .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
          .where(eq(personasVehiculos.personaId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Obtener inmuebles relacionados con esta persona (directa)
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(personasInmuebles)
          .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
          .where(eq(personasInmuebles.personaId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
        
        // Obtener ubicaciones relacionadas con esta persona (directa)
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(personasUbicaciones)
          .innerJoin(ubicaciones, eq(personasUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(personasUbicaciones.personaId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'vehiculo') {
        // Obtener personas relacionadas con este vehículo
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasVehiculos)
          .innerJoin(personas, eq(personasVehiculos.personaId, personas.id))
          .where(eq(personasVehiculos.vehiculoId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Obtener inmuebles relacionados con este vehículo
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(vehiculosInmuebles)
          .innerJoin(inmuebles, eq(vehiculosInmuebles.inmuebleId, inmuebles.id))
          .where(eq(vehiculosInmuebles.vehiculoId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
        
        // Obtener ubicaciones relacionadas con este vehículo
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(vehiculosUbicaciones)
          .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(vehiculosUbicaciones.vehiculoId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'inmueble') {
        // Obtener personas relacionadas con este inmueble
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasInmuebles)
          .innerJoin(personas, eq(personasInmuebles.personaId, personas.id))
          .where(eq(personasInmuebles.inmuebleId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Obtener vehículos relacionados con este inmueble
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosInmuebles)
          .innerJoin(vehiculos, eq(vehiculosInmuebles.vehiculoId, vehiculos.id))
          .where(eq(vehiculosInmuebles.inmuebleId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Obtener ubicaciones relacionadas con este inmueble
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(inmueblesUbicaciones)
          .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(inmueblesUbicaciones.inmuebleId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } else if (t === 'ubicacion') {
        // Obtener personas relacionadas con esta ubicación
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasUbicaciones)
          .innerJoin(personas, eq(personasUbicaciones.personaId, personas.id))
          .where(eq(personasUbicaciones.ubicacionId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Obtener vehículos relacionados con esta ubicación
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosUbicaciones)
          .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
          .where(eq(vehiculosUbicaciones.ubicacionId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Obtener inmuebles relacionados con esta ubicación
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