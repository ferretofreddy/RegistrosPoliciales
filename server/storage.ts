import { 
  User, InsertUser, 
  Persona, InsertPersona,
  PersonaObservacion, InsertPersonaObservacion,
  Vehiculo, InsertVehiculo,
  VehiculoObservacion, InsertVehiculoObservacion,
  Inmueble, InsertInmueble,
  InmuebleObservacion, InsertInmuebleObservacion,
  Mensaje, InsertMensaje,
  ArchivoAdjunto, InsertArchivoAdjunto,
  
  users, personas, personasObservaciones,
  vehiculos, vehiculosObservaciones,
  inmuebles, inmueblesObservaciones,
  personasVehiculos, personasInmuebles,
  mensajes, archivosAdjuntos
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
  crearRelacionPersonaVehiculo(personaId: number, vehiculoId: number): Promise<any>;
  crearRelacionPersonaInmueble(personaId: number, inmuebleId: number): Promise<any>;
  
  // Mensajería interna methods
  getMensajeById(id: number): Promise<Mensaje | undefined>;
  getMensajesRecibidos(usuarioId: number): Promise<Mensaje[]>;
  getMensajesEnviados(usuarioId: number): Promise<Mensaje[]>;
  createMensaje(mensaje: InsertMensaje): Promise<Mensaje>;
  marcarMensajeComoLeido(id: number): Promise<boolean>;
  eliminarMensaje(id: number, esRemitente: boolean): Promise<boolean>;
  
  // Archivos adjuntos methods
  getArchivosByMensajeId(mensajeId: number): Promise<ArchivoAdjunto[]>;
  createArchivoAdjunto(archivo: InsertArchivoAdjunto): Promise<ArchivoAdjunto>;
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
      const query = `
        SELECT * FROM personas 
        ORDER BY nombre
      `;
      const result = await pool.query(query);
      
      // Aseguramos que los arrays se procesen correctamente
      return result.rows.map(row => ({
        ...row,
        alias: Array.isArray(row.alias) ? row.alias : [],
        telefonos: Array.isArray(row.telefonos) ? row.telefonos : [],
        domicilios: Array.isArray(row.domicilios) ? row.domicilios : []
      }));
    } catch (error) {
      console.error("Error en getAllPersonas:", error);
      return [];
    }
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    try {
      const query = `
        SELECT * FROM personas 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const persona = result.rows[0];
      
      // Aseguramos que los arrays se procesen correctamente
      return {
        ...persona,
        alias: Array.isArray(persona.alias) ? persona.alias : [],
        telefonos: Array.isArray(persona.telefonos) ? persona.telefonos : [],
        domicilios: Array.isArray(persona.domicilios) ? persona.domicilios : []
      };
    } catch (error) {
      console.error("Error en getPersona:", error);
      return undefined;
    }
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      // Aseguramos que los arrays se manejen correctamente
      const insertValues = {
        nombre: insertPersona.nombre,
        identificacion: insertPersona.identificacion,
        alias: Array.isArray(insertPersona.alias) ? insertPersona.alias : [],
        telefonos: Array.isArray(insertPersona.telefonos) ? insertPersona.telefonos : [],
        domicilios: Array.isArray(insertPersona.domicilios) ? insertPersona.domicilios : [],
        foto: insertPersona.foto
      };
      
      // Usamos SQL directamente para garantizar que los campos JSON se manejen correctamente
      const query = `
        INSERT INTO personas (nombre, identificacion, alias, telefonos, domicilios, foto)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        insertValues.nombre,
        insertValues.identificacion,
        JSON.stringify(insertValues.alias),
        JSON.stringify(insertValues.telefonos),
        JSON.stringify(insertValues.domicilios),
        insertValues.foto
      ]);
      
      return result.rows[0];
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
      // Usamos SQL directo para mayor control
      const query = `
        INSERT INTO vehiculos (placa, marca, modelo, color, tipo, observaciones, foto)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        insertVehiculo.placa,
        insertVehiculo.marca,
        insertVehiculo.modelo,
        insertVehiculo.color,
        insertVehiculo.tipo || null,
        insertVehiculo.observaciones || null,
        insertVehiculo.foto || null
      ]);
      
      return result.rows[0];
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
      // Usamos SQL directo para mayor control
      const query = `
        INSERT INTO inmuebles (tipo, direccion, propietario, observaciones, foto)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        insertInmueble.tipo,
        insertInmueble.direccion,
        insertInmueble.propietario || null,
        insertInmueble.observaciones || null,
        insertInmueble.foto || null
      ]);
      
      return result.rows[0];
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
  async crearRelacionPersonaVehiculo(personaId: number, vehiculoId: number): Promise<any> {
    try {
      // Verificar si ya existe
      const checkQuery = `
        SELECT * FROM personas_vehiculos 
        WHERE persona_id = $1 AND vehiculo_id = $2
      `;
      
      const existingRelation = await pool.query(checkQuery, [personaId, vehiculoId]);
      
      if (existingRelation.rows.length > 0) {
        return existingRelation.rows[0];
      }
      
      // Crear nueva relación
      const insertQuery = `
        INSERT INTO personas_vehiculos (persona_id, vehiculo_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        personaId,
        vehiculoId
      ]);
        
      return result.rows[0];
    } catch (error) {
      console.error("Error en crearRelacionPersonaVehiculo:", error);
      throw error;
    }
  }
  
  async crearRelacionPersonaInmueble(personaId: number, inmuebleId: number): Promise<any> {
    try {
      // Verificar si ya existe
      const checkQuery = `
        SELECT * FROM personas_inmuebles 
        WHERE persona_id = $1 AND inmueble_id = $2
      `;
      
      const existingRelation = await pool.query(checkQuery, [personaId, inmuebleId]);
      
      if (existingRelation.rows.length > 0) {
        return existingRelation.rows[0];
      }
      
      // Crear nueva relación
      const insertQuery = `
        INSERT INTO personas_inmuebles (persona_id, inmueble_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        personaId,
        inmuebleId
      ]);
        
      return result.rows[0];
    } catch (error) {
      console.error("Error en crearRelacionPersonaInmueble:", error);
      throw error;
    }
  }
  // === MENSAJERÍA INTERNA ===
  async getMensajeById(id: number): Promise<Mensaje | undefined> {
    try {
      const [mensaje] = await db
        .select()
        .from(mensajes)
        .where(eq(mensajes.id, id));
      return mensaje;
    } catch (error) {
      console.error("Error en getMensajeById:", error);
      return undefined;
    }
  }

  async getMensajesRecibidos(usuarioId: number): Promise<Mensaje[]> {
    try {
      return await db
        .select()
        .from(mensajes)
        .where(
          eq(mensajes.destinatarioId, usuarioId),
          eq(mensajes.eliminadoDestinatario, false)
        )
        .orderBy(desc(mensajes.fechaEnvio));
    } catch (error) {
      console.error("Error en getMensajesRecibidos:", error);
      return [];
    }
  }

  async getMensajesEnviados(usuarioId: number): Promise<Mensaje[]> {
    try {
      return await db
        .select()
        .from(mensajes)
        .where(
          eq(mensajes.remiteId, usuarioId),
          eq(mensajes.eliminadoRemite, false)
        )
        .orderBy(desc(mensajes.fechaEnvio));
    } catch (error) {
      console.error("Error en getMensajesEnviados:", error);
      return [];
    }
  }

  async createMensaje(mensaje: InsertMensaje): Promise<Mensaje> {
    try {
      const [nuevoMensaje] = await db
        .insert(mensajes)
        .values(mensaje)
        .returning();
      return nuevoMensaje;
    } catch (error) {
      console.error("Error en createMensaje:", error);
      throw error;
    }
  }

  async marcarMensajeComoLeido(id: number): Promise<boolean> {
    try {
      const [mensaje] = await db
        .update(mensajes)
        .set({ leido: true })
        .where(eq(mensajes.id, id))
        .returning();
      return !!mensaje;
    } catch (error) {
      console.error("Error en marcarMensajeComoLeido:", error);
      return false;
    }
  }

  async eliminarMensaje(id: number, esRemitente: boolean): Promise<boolean> {
    try {
      const [mensaje] = await db
        .update(mensajes)
        .set(
          esRemitente
            ? { eliminadoRemite: true }
            : { eliminadoDestinatario: true }
        )
        .where(eq(mensajes.id, id))
        .returning();
      
      return !!mensaje;
    } catch (error) {
      console.error("Error en eliminarMensaje:", error);
      return false;
    }
  }

  // === ARCHIVOS ADJUNTOS ===
  async getArchivosByMensajeId(mensajeId: number): Promise<ArchivoAdjunto[]> {
    try {
      return await db
        .select()
        .from(archivosAdjuntos)
        .where(eq(archivosAdjuntos.mensajeId, mensajeId));
    } catch (error) {
      console.error("Error en getArchivosByMensajeId:", error);
      return [];
    }
  }

  async createArchivoAdjunto(archivo: InsertArchivoAdjunto): Promise<ArchivoAdjunto> {
    try {
      const [nuevoArchivo] = await db
        .insert(archivosAdjuntos)
        .values(archivo)
        .returning();
      return nuevoArchivo;
    } catch (error) {
      console.error("Error en createArchivoAdjunto:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();