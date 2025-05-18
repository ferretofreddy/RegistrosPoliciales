import { 
  User, InsertUser, 
  Persona, InsertPersona,
  PersonaObservacion, InsertPersonaObservacion,
  Vehiculo, InsertVehiculo,
  VehiculoObservacion, InsertVehiculoObservacion,
  Inmueble, InsertInmueble,
  InmuebleObservacion, InsertInmuebleObservacion,
  
  users, personas, personasObservaciones,
  vehiculos, vehiculosObservaciones,
  inmuebles, inmueblesObservaciones,
  personasVehiculos, personasInmuebles
} from "@shared/schema";
import { db } from "./db";
import { eq, or, like, sql, desc } from "drizzle-orm";
import session from "express-session";
import pgSessionStore from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Personas methods
  getAllPersonas(): Promise<Persona[]>;
  getPersona(id: number): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  
  // Personas observaciones methods
  getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]>;
  createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion>;
  
  // Vehiculos methods
  getAllVehiculos(): Promise<Vehiculo[]>;
  getVehiculo(id: number): Promise<Vehiculo | undefined>;
  createVehiculo(vehiculo: InsertVehiculo): Promise<Vehiculo>;
  
  // Vehiculos observaciones methods
  getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]>;
  createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion>;
  
  // Inmuebles methods
  getAllInmuebles(): Promise<Inmueble[]>;
  getInmueble(id: number): Promise<Inmueble | undefined>;
  createInmueble(inmueble: InsertInmueble): Promise<Inmueble>;
  
  // Inmuebles observaciones methods
  getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]>;
  createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion>;
  
  // Relaciones methods
  getPersonasRelacionadasConVehiculo(vehiculoId: number): Promise<Persona[]>;
  getVehiculosRelacionadosConPersona(personaId: number): Promise<Vehiculo[]>;
  getPersonasRelacionadasConInmueble(inmuebleId: number): Promise<Persona[]>;
  getInmueblesRelacionadosConPersona(personaId: number): Promise<Inmueble[]>;
  
  // Relaciones CRUD
  crearRelacionPersonaVehiculo(personaId: number, vehiculoId: number, relacion?: string): Promise<any>;
  crearRelacionPersonaInmueble(personaId: number, inmuebleId: number, relacion?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PgStore = pgSessionStore(session);
    this.sessionStore = new PgStore({
      pool,
      tableName: 'user_sessions'
    });
  }
  
  // === USERS ===
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error en getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error en getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error en createUser:", error);
      throw error;
    }
  }
  
  // === PERSONAS ===
  async getAllPersonas(): Promise<Persona[]> {
    try {
      return await db.select().from(personas).orderBy(personas.nombre);
    } catch (error) {
      console.error("Error en getAllPersonas:", error);
      return [];
    }
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    try {
      const [persona] = await db.select().from(personas).where(eq(personas.id, id));
      return persona;
    } catch (error) {
      console.error("Error en getPersona:", error);
      return undefined;
    }
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      // Preparamos los datos para asegurarnos que los arrays se manejen correctamente
      // Creamos explícitamente un objeto nuevo para evitar problemas con los tipos
      const personaData = {
        nombre: insertPersona.nombre,
        identificacion: insertPersona.identificacion,
        alias: insertPersona.alias ?? [],
        telefonos: insertPersona.telefonos ?? [],
        domicilios: insertPersona.domicilios ?? [],
        foto: insertPersona.foto
      };
      
      // Convertimos los campos que deben ser arrays a arrays si no lo son
      if (!Array.isArray(personaData.alias)) personaData.alias = [];
      if (!Array.isArray(personaData.telefonos)) personaData.telefonos = [];
      if (!Array.isArray(personaData.domicilios)) personaData.domicilios = [];
      
      // Introducimos un tipo explícito para la inserción
      const insertValues = {
        nombre: personaData.nombre,
        identificacion: personaData.identificacion,
        alias: personaData.alias,
        telefonos: personaData.telefonos,
        domicilios: personaData.domicilios,
        foto: personaData.foto
      };
      
      const [persona] = await db.insert(personas).values(insertValues).returning();
      return persona;
    } catch (error) {
      console.error("Error en createPersona:", error);
      throw error;
    }
  }
  
  // === PERSONAS OBSERVACIONES ===
  async getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]> {
    try {
      return await db
        .select()
        .from(personasObservaciones)
        .where(eq(personasObservaciones.personaId, personaId))
        .orderBy(desc(personasObservaciones.fecha));
    } catch (error) {
      console.error("Error en getPersonaObservaciones:", error);
      return [];
    }
  }

  async createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion> {
    try {
      const [newObservacion] = await db
        .insert(personasObservaciones)
        .values(observacion)
        .returning();
      return newObservacion;
    } catch (error) {
      console.error("Error en createPersonaObservacion:", error);
      throw error;
    }
  }
  
  // === VEHICULOS ===
  async getAllVehiculos(): Promise<Vehiculo[]> {
    try {
      return await db.select().from(vehiculos).orderBy(vehiculos.placa);
    } catch (error) {
      console.error("Error en getAllVehiculos:", error);
      return [];
    }
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    try {
      const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, id));
      return vehiculo;
    } catch (error) {
      console.error("Error en getVehiculo:", error);
      return undefined;
    }
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    try {
      const [vehiculo] = await db.insert(vehiculos).values(insertVehiculo).returning();
      return vehiculo;
    } catch (error) {
      console.error("Error en createVehiculo:", error);
      throw error;
    }
  }
  
  // === VEHICULOS OBSERVACIONES ===
  async getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]> {
    try {
      return await db
        .select()
        .from(vehiculosObservaciones)
        .where(eq(vehiculosObservaciones.vehiculoId, vehiculoId))
        .orderBy(desc(vehiculosObservaciones.fecha));
    } catch (error) {
      console.error("Error en getVehiculoObservaciones:", error);
      return [];
    }
  }

  async createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion> {
    try {
      const [newObservacion] = await db
        .insert(vehiculosObservaciones)
        .values(observacion)
        .returning();
      return newObservacion;
    } catch (error) {
      console.error("Error en createVehiculoObservacion:", error);
      throw error;
    }
  }
  
  // === INMUEBLES ===
  async getAllInmuebles(): Promise<Inmueble[]> {
    try {
      return await db.select().from(inmuebles).orderBy(inmuebles.direccion);
    } catch (error) {
      console.error("Error en getAllInmuebles:", error);
      return [];
    }
  }

  async getInmueble(id: number): Promise<Inmueble | undefined> {
    try {
      const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, id));
      return inmueble;
    } catch (error) {
      console.error("Error en getInmueble:", error);
      return undefined;
    }
  }

  async createInmueble(insertInmueble: InsertInmueble): Promise<Inmueble> {
    try {
      const [inmueble] = await db.insert(inmuebles).values(insertInmueble).returning();
      return inmueble;
    } catch (error) {
      console.error("Error en createInmueble:", error);
      throw error;
    }
  }
  
  // === INMUEBLES OBSERVACIONES ===
  async getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]> {
    try {
      return await db
        .select()
        .from(inmueblesObservaciones)
        .where(eq(inmueblesObservaciones.inmuebleId, inmuebleId))
        .orderBy(desc(inmueblesObservaciones.fecha));
    } catch (error) {
      console.error("Error en getInmuebleObservaciones:", error);
      return [];
    }
  }

  async createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion> {
    try {
      const [newObservacion] = await db
        .insert(inmueblesObservaciones)
        .values(observacion)
        .returning();
      return newObservacion;
    } catch (error) {
      console.error("Error en createInmuebleObservacion:", error);
      throw error;
    }
  }
  
  // === RELACIONES ===
  async getPersonasRelacionadasConVehiculo(vehiculoId: number): Promise<Persona[]> {
    try {
      return await db
        .select({
          persona: personas
        })
        .from(personasVehiculos)
        .innerJoin(personas, eq(personasVehiculos.personaId, personas.id))
        .where(eq(personasVehiculos.vehiculoId, vehiculoId))
        .then(rows => rows.map(row => row.persona));
    } catch (error) {
      console.error("Error en getPersonasRelacionadasConVehiculo:", error);
      return [];
    }
  }
  
  async getVehiculosRelacionadosConPersona(personaId: number): Promise<Vehiculo[]> {
    try {
      return await db
        .select({
          vehiculo: vehiculos
        })
        .from(personasVehiculos)
        .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
        .where(eq(personasVehiculos.personaId, personaId))
        .then(rows => rows.map(row => row.vehiculo));
    } catch (error) {
      console.error("Error en getVehiculosRelacionadosConPersona:", error);
      return [];
    }
  }
  
  async getPersonasRelacionadasConInmueble(inmuebleId: number): Promise<Persona[]> {
    try {
      return await db
        .select({
          persona: personas
        })
        .from(personasInmuebles)
        .innerJoin(personas, eq(personasInmuebles.personaId, personas.id))
        .where(eq(personasInmuebles.inmuebleId, inmuebleId))
        .then(rows => rows.map(row => row.persona));
    } catch (error) {
      console.error("Error en getPersonasRelacionadasConInmueble:", error);
      return [];
    }
  }
  
  async getInmueblesRelacionadosConPersona(personaId: number): Promise<Inmueble[]> {
    try {
      return await db
        .select({
          inmueble: inmuebles
        })
        .from(personasInmuebles)
        .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
        .where(eq(personasInmuebles.personaId, personaId))
        .then(rows => rows.map(row => row.inmueble));
    } catch (error) {
      console.error("Error en getInmueblesRelacionadosConPersona:", error);
      return [];
    }
  }
  
  // === RELACIONES CRUD ===
  async crearRelacionPersonaVehiculo(personaId: number, vehiculoId: number, relacion?: string): Promise<any> {
    try {
      // Verificar si ya existe
      const [existingRelation] = await db
        .select()
        .from(personasVehiculos)
        .where(sql`persona_id = ${personaId} AND vehiculo_id = ${vehiculoId}`);
      
      if (existingRelation) {
        return existingRelation;
      }
      
      // Crear nueva relación
      const [newRelation] = await db
        .insert(personasVehiculos)
        .values({
          personaId,
          vehiculoId,
          relacion: relacion || null,
          observaciones: null
        })
        .returning();
        
      return newRelation;
    } catch (error) {
      console.error("Error en crearRelacionPersonaVehiculo:", error);
      throw error;
    }
  }
  
  async crearRelacionPersonaInmueble(personaId: number, inmuebleId: number, relacion?: string): Promise<any> {
    try {
      // Verificar si ya existe
      const [existingRelation] = await db
        .select()
        .from(personasInmuebles)
        .where(sql`persona_id = ${personaId} AND inmueble_id = ${inmuebleId}`);
      
      if (existingRelation) {
        return existingRelation;
      }
      
      // Crear nueva relación
      const [newRelation] = await db
        .insert(personasInmuebles)
        .values({
          personaId,
          inmuebleId,
          relacion: relacion || null,
          observaciones: null
        })
        .returning();
        
      return newRelation;
    } catch (error) {
      console.error("Error en crearRelacionPersonaInmueble:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();