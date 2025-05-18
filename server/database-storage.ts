import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { eq, or, like, and, ne, desc } from 'drizzle-orm/expressions';
import * as schema from '@shared/schema';
import { 
  personas, vehiculos, inmuebles, ubicaciones, tiposInmuebles, tiposUbicaciones,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones, ubicacionesObservaciones,
  personasVehiculos, personasInmuebles, personasUbicaciones,
  vehiculosInmuebles, vehiculosUbicaciones, inmueblesUbicaciones,
  personasPersonas, vehiculosVehiculos, inmueblesInmuebles, ubicacionesUbicaciones
} from '@shared/schema';
import { PgSession } from 'drizzle-orm/pg-core';
import session from 'express-session';
import { 
  type Persona, type InsertPersona, type PersonaObservacion, type InsertPersonaObservacion,
  type Vehiculo, type InsertVehiculo, type VehiculoObservacion, type InsertVehiculoObservacion,
  type TipoInmueble, type InsertTipoInmueble, type Inmueble, type InsertInmueble, 
  type InmuebleObservacion, type InsertInmuebleObservacion,
  type TipoUbicacion, type InsertTipoUbicacion, type Ubicacion, type InsertUbicacion,
  type UbicacionObservacion, type InsertUbicacionObservacion,
  type User, type InsertUser
} from '@shared/schema';

export class DatabaseStorage {
  // Implementación real que usa PostgreSQL
  
  constructor() {
    // Inicialización y conexión a la base de datos
    console.log("Inicializando DatabaseStorage");
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario con email ${email}:`, error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(schema.users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  // PERSONAS METHODS
  async getAllPersonas(): Promise<Persona[]> {
    try {
      const results = await db.select().from(schema.personas);
      return results;
    } catch (error) {
      console.error("Error al obtener todas las personas:", error);
      return [];
    }
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    try {
      const [persona] = await db.select().from(schema.personas).where(eq(schema.personas.id, id));
      return persona;
    } catch (error) {
      console.error(`Error al obtener persona con ID ${id}:`, error);
      return undefined;
    }
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    try {
      const [persona] = await db.insert(schema.personas).values(insertPersona).returning();
      return persona;
    } catch (error) {
      console.error("Error al crear persona:", error);
      throw error;
    }
  }

  // PERSONAS OBSERVACIONES
  async getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]> {
    try {
      const observaciones = await db.select()
        .from(schema.personasObservaciones)
        .where(eq(schema.personasObservaciones.personaId, personaId))
        .orderBy(desc(schema.personasObservaciones.fecha));
      
      return observaciones;
    } catch (error) {
      console.error(`Error al obtener observaciones para persona ID ${personaId}:`, error);
      return [];
    }
  }

  async createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion> {
    try {
      const [result] = await db.insert(schema.personasObservaciones)
        .values(observacion)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear observación para persona:", error);
      throw error;
    }
  }

  // VEHICULOS METHODS
  async getAllVehiculos(): Promise<Vehiculo[]> {
    try {
      const results = await db.select().from(schema.vehiculos);
      return results;
    } catch (error) {
      console.error("Error al obtener todos los vehículos:", error);
      return [];
    }
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    try {
      const [vehiculo] = await db.select().from(schema.vehiculos).where(eq(schema.vehiculos.id, id));
      return vehiculo;
    } catch (error) {
      console.error(`Error al obtener vehículo con ID ${id}:`, error);
      return undefined;
    }
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    try {
      const [vehiculo] = await db.insert(schema.vehiculos).values(insertVehiculo).returning();
      return vehiculo;
    } catch (error) {
      console.error("Error al crear vehículo:", error);
      throw error;
    }
  }

  // VEHICULOS OBSERVACIONES
  async getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]> {
    try {
      const observaciones = await db.select()
        .from(schema.vehiculosObservaciones)
        .where(eq(schema.vehiculosObservaciones.vehiculoId, vehiculoId))
        .orderBy(desc(schema.vehiculosObservaciones.fecha));
      
      return observaciones;
    } catch (error) {
      console.error(`Error al obtener observaciones para vehículo ID ${vehiculoId}:`, error);
      return [];
    }
  }

  async createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion> {
    try {
      const [result] = await db.insert(schema.vehiculosObservaciones)
        .values(observacion)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear observación para vehículo:", error);
      throw error;
    }
  }

  // TIPOS INMUEBLES METHODS
  async getAllTiposInmuebles(): Promise<TipoInmueble[]> {
    try {
      const results = await db.select().from(schema.tiposInmuebles);
      return results;
    } catch (error) {
      console.error("Error al obtener todos los tipos de inmuebles:", error);
      return [];
    }
  }

  async getTipoInmueble(id: number): Promise<TipoInmueble | undefined> {
    try {
      const [tipoInmueble] = await db.select()
        .from(schema.tiposInmuebles)
        .where(eq(schema.tiposInmuebles.id, id));
      
      return tipoInmueble;
    } catch (error) {
      console.error(`Error al obtener tipo de inmueble con ID ${id}:`, error);
      return undefined;
    }
  }

  async createTipoInmueble(tipoInmueble: InsertTipoInmueble): Promise<TipoInmueble> {
    try {
      const [result] = await db.insert(schema.tiposInmuebles)
        .values(tipoInmueble)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear tipo de inmueble:", error);
      throw error;
    }
  }

  async updateTipoInmueble(id: number, tipoInmueble: Partial<InsertTipoInmueble>): Promise<TipoInmueble | undefined> {
    try {
      const [result] = await db.update(schema.tiposInmuebles)
        .set(tipoInmueble)
        .where(eq(schema.tiposInmuebles.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Error al actualizar tipo de inmueble con ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteTipoInmueble(id: number): Promise<boolean> {
    try {
      const result = await db.delete(schema.tiposInmuebles)
        .where(eq(schema.tiposInmuebles.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar tipo de inmueble con ID ${id}:`, error);
      return false;
    }
  }

  // INMUEBLES METHODS
  async getAllInmuebles(): Promise<Inmueble[]> {
    try {
      const results = await db.select().from(schema.inmuebles);
      return results;
    } catch (error) {
      console.error("Error al obtener todos los inmuebles:", error);
      return [];
    }
  }

  async getInmueble(id: number): Promise<Inmueble | undefined> {
    try {
      const [inmueble] = await db.select()
        .from(schema.inmuebles)
        .where(eq(schema.inmuebles.id, id));
      
      return inmueble;
    } catch (error) {
      console.error(`Error al obtener inmueble con ID ${id}:`, error);
      return undefined;
    }
  }

  async createInmueble(insertInmueble: InsertInmueble): Promise<Inmueble> {
    try {
      const [inmueble] = await db.insert(schema.inmuebles)
        .values(insertInmueble)
        .returning();
      
      return inmueble;
    } catch (error) {
      console.error("Error al crear inmueble:", error);
      throw error;
    }
  }

  // INMUEBLES OBSERVACIONES
  async getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]> {
    try {
      const observaciones = await db.select()
        .from(schema.inmueblesObservaciones)
        .where(eq(schema.inmueblesObservaciones.inmuebleId, inmuebleId))
        .orderBy(desc(schema.inmueblesObservaciones.fecha));
      
      return observaciones;
    } catch (error) {
      console.error(`Error al obtener observaciones para inmueble ID ${inmuebleId}:`, error);
      return [];
    }
  }

  async createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion> {
    try {
      const [result] = await db.insert(schema.inmueblesObservaciones)
        .values(observacion)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear observación para inmueble:", error);
      throw error;
    }
  }

  // TIPOS UBICACIONES METHODS
  async getAllTiposUbicaciones(): Promise<TipoUbicacion[]> {
    try {
      const results = await db.select().from(schema.tiposUbicaciones);
      return results;
    } catch (error) {
      console.error("Error al obtener todos los tipos de ubicaciones:", error);
      return [];
    }
  }

  async getTipoUbicacion(id: number): Promise<TipoUbicacion | undefined> {
    try {
      const [tipoUbicacion] = await db.select()
        .from(schema.tiposUbicaciones)
        .where(eq(schema.tiposUbicaciones.id, id));
      
      return tipoUbicacion;
    } catch (error) {
      console.error(`Error al obtener tipo de ubicación con ID ${id}:`, error);
      return undefined;
    }
  }

  async createTipoUbicacion(tipoUbicacion: InsertTipoUbicacion): Promise<TipoUbicacion> {
    try {
      const [result] = await db.insert(schema.tiposUbicaciones)
        .values(tipoUbicacion)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear tipo de ubicación:", error);
      throw error;
    }
  }

  async updateTipoUbicacion(id: number, tipoUbicacion: Partial<InsertTipoUbicacion>): Promise<TipoUbicacion | undefined> {
    try {
      const [result] = await db.update(schema.tiposUbicaciones)
        .set(tipoUbicacion)
        .where(eq(schema.tiposUbicaciones.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Error al actualizar tipo de ubicación con ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteTipoUbicacion(id: number): Promise<boolean> {
    try {
      const result = await db.delete(schema.tiposUbicaciones)
        .where(eq(schema.tiposUbicaciones.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar tipo de ubicación con ID ${id}:`, error);
      return false;
    }
  }

  // UBICACIONES METHODS
  async getAllUbicaciones(): Promise<Ubicacion[]> {
    try {
      const results = await db.select().from(schema.ubicaciones);
      return results;
    } catch (error) {
      console.error("Error al obtener todas las ubicaciones:", error);
      return [];
    }
  }

  async getUbicacion(id: number): Promise<Ubicacion | undefined> {
    try {
      const [ubicacion] = await db.select()
        .from(schema.ubicaciones)
        .where(eq(schema.ubicaciones.id, id));
      
      return ubicacion;
    } catch (error) {
      console.error(`Error al obtener ubicación con ID ${id}:`, error);
      return undefined;
    }
  }

  async createUbicacion(insertUbicacion: InsertUbicacion): Promise<Ubicacion> {
    try {
      const [ubicacion] = await db.insert(schema.ubicaciones)
        .values(insertUbicacion)
        .returning();
      
      return ubicacion;
    } catch (error) {
      console.error("Error al crear ubicación:", error);
      throw error;
    }
  }

  async createUbicacionForInmueble(ubicacion: InsertUbicacion, inmuebleId: number): Promise<Ubicacion> {
    try {
      // 1. Crear la ubicación
      const nuevaUbicacion = await this.createUbicacion(ubicacion);
      
      // 2. Crear la relación con el inmueble
      await db.insert(schema.inmueblesUbicaciones)
        .values({
          inmuebleId,
          ubicacionId: nuevaUbicacion.id
        });
      
      return nuevaUbicacion;
    } catch (error) {
      console.error(`Error al crear ubicación para inmueble ID ${inmuebleId}:`, error);
      throw error;
    }
  }

  // UBICACIONES OBSERVACIONES
  async getUbicacionObservaciones(ubicacionId: number): Promise<UbicacionObservacion[]> {
    try {
      const observaciones = await db.select()
        .from(schema.ubicacionesObservaciones)
        .where(eq(schema.ubicacionesObservaciones.ubicacionId, ubicacionId))
        .orderBy(desc(schema.ubicacionesObservaciones.fecha));
      
      return observaciones;
    } catch (error) {
      console.error(`Error al obtener observaciones para ubicación ID ${ubicacionId}:`, error);
      return [];
    }
  }

  async createUbicacionObservacion(observacion: InsertUbicacionObservacion): Promise<UbicacionObservacion> {
    try {
      const [result] = await db.insert(schema.ubicacionesObservaciones)
        .values(observacion)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error al crear observación para ubicación:", error);
      throw error;
    }
  }

  // SEARCH METHODS
  async buscar(query: string, tipos: string[]): Promise<any> {
    try {
      // Buscar personas, vehículos, inmuebles y ubicaciones que coincidan con la consulta
      const resultados = {
        personas: [],
        vehiculos: [],
        inmuebles: [],
        ubicaciones: []
      };

      // Normalizar los tipos para la búsqueda
      const tiposNormalizados = tipos.map(tipo => {
        if (tipo === "personas") return "persona";
        if (tipo === "vehiculos") return "vehiculo";
        if (tipo === "inmuebles") return "inmueble";
        if (tipo === "ubicaciones") return "ubicacion";
        return tipo;
      });

      console.log(`Buscando con query: "${query}" y tipos: [${tiposNormalizados.join(', ')}]`);

      // Buscar personas
      if (tiposNormalizados.includes("persona")) {
        const personasResult = await db.execute(
          sql`SELECT * FROM personas 
              WHERE LOWER(nombre) LIKE ${`%${query.toLowerCase()}%`} 
              OR LOWER(identificacion) LIKE ${`%${query.toLowerCase()}%`}
              OR id::text = ${query}`
        );
        resultados.personas = personasResult.rows || [];
      }

      // Buscar vehículos
      if (tiposNormalizados.includes("vehiculo")) {
        const vehiculosResult = await db.execute(
          sql`SELECT * FROM vehiculos 
              WHERE LOWER(placa) LIKE ${`%${query.toLowerCase()}%`} 
              OR LOWER(marca) LIKE ${`%${query.toLowerCase()}%`}
              OR LOWER(modelo) LIKE ${`%${query.toLowerCase()}%`}
              OR id::text = ${query}`
        );
        resultados.vehiculos = vehiculosResult.rows || [];
      }

      // Buscar inmuebles
      if (tiposNormalizados.includes("inmueble")) {
        const inmueblesResult = await db.execute(
          sql`SELECT * FROM inmuebles 
              WHERE LOWER(direccion) LIKE ${`%${query.toLowerCase()}%`} 
              OR LOWER(tipo) LIKE ${`%${query.toLowerCase()}%`}
              OR LOWER(propietario) LIKE ${`%${query.toLowerCase()}%`}
              OR id::text = ${query}`
        );
        resultados.inmuebles = inmueblesResult.rows || [];
      }

      // Buscar ubicaciones
      if (tiposNormalizados.includes("ubicacion")) {
        const ubicacionesResult = await db.execute(
          sql`SELECT * FROM ubicaciones 
              WHERE LOWER(tipo) LIKE ${`%${query.toLowerCase()}%`} 
              OR LOWER(observaciones) LIKE ${`%${query.toLowerCase()}%`}
              OR id::text = ${query}`
        );
        resultados.ubicaciones = ubicacionesResult.rows || [];
      }

      return resultados;
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      return { personas: [], vehiculos: [], inmuebles: [], ubicaciones: [] };
    }
  }

  async crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
    try {
      // Validar tipos
      const tiposValidos = ["persona", "vehiculo", "inmueble", "ubicacion"];
      if (!tiposValidos.includes(tipo1) || !tiposValidos.includes(tipo2)) {
        throw new Error(`Tipos inválidos. Deben ser uno de: ${tiposValidos.join(', ')}`);
      }

      // Crear la relación correspondiente según los tipos
      if (tipo1 === "persona" && tipo2 === "vehiculo") {
        await db.insert(schema.personasVehiculos).values({
          personaId: id1,
          vehiculoId: id2
        });
        return { mensaje: `Relación creada entre persona ID ${id1} y vehículo ID ${id2}` };
      } 
      else if (tipo1 === "vehiculo" && tipo2 === "persona") {
        await db.insert(schema.personasVehiculos).values({
          personaId: id2,
          vehiculoId: id1
        });
        return { mensaje: `Relación creada entre vehículo ID ${id1} y persona ID ${id2}` };
      }
      else if (tipo1 === "persona" && tipo2 === "inmueble") {
        await db.insert(schema.personasInmuebles).values({
          personaId: id1,
          inmuebleId: id2
        });
        return { mensaje: `Relación creada entre persona ID ${id1} e inmueble ID ${id2}` };
      }
      else if (tipo1 === "inmueble" && tipo2 === "persona") {
        await db.insert(schema.personasInmuebles).values({
          personaId: id2,
          inmuebleId: id1
        });
        return { mensaje: `Relación creada entre inmueble ID ${id1} y persona ID ${id2}` };
      }
      else if (tipo1 === "persona" && tipo2 === "ubicacion") {
        await db.insert(schema.personasUbicaciones).values({
          personaId: id1,
          ubicacionId: id2
        });
        return { mensaje: `Relación creada entre persona ID ${id1} y ubicación ID ${id2}` };
      }
      else if (tipo1 === "ubicacion" && tipo2 === "persona") {
        await db.insert(schema.personasUbicaciones).values({
          personaId: id2,
          ubicacionId: id1
        });
        return { mensaje: `Relación creada entre ubicación ID ${id1} y persona ID ${id2}` };
      }
      else if (tipo1 === "vehiculo" && tipo2 === "inmueble") {
        await db.insert(schema.vehiculosInmuebles).values({
          vehiculoId: id1,
          inmuebleId: id2
        });
        return { mensaje: `Relación creada entre vehículo ID ${id1} e inmueble ID ${id2}` };
      }
      else if (tipo1 === "inmueble" && tipo2 === "vehiculo") {
        await db.insert(schema.vehiculosInmuebles).values({
          vehiculoId: id2,
          inmuebleId: id1
        });
        return { mensaje: `Relación creada entre inmueble ID ${id1} y vehículo ID ${id2}` };
      }
      else if (tipo1 === "vehiculo" && tipo2 === "ubicacion") {
        await db.insert(schema.vehiculosUbicaciones).values({
          vehiculoId: id1,
          ubicacionId: id2
        });
        return { mensaje: `Relación creada entre vehículo ID ${id1} y ubicación ID ${id2}` };
      }
      else if (tipo1 === "ubicacion" && tipo2 === "vehiculo") {
        await db.insert(schema.vehiculosUbicaciones).values({
          vehiculoId: id2,
          ubicacionId: id1
        });
        return { mensaje: `Relación creada entre ubicación ID ${id1} y vehículo ID ${id2}` };
      }
      else if (tipo1 === "inmueble" && tipo2 === "ubicacion") {
        await db.insert(schema.inmueblesUbicaciones).values({
          inmuebleId: id1,
          ubicacionId: id2
        });
        return { mensaje: `Relación creada entre inmueble ID ${id1} y ubicación ID ${id2}` };
      }
      else if (tipo1 === "ubicacion" && tipo2 === "inmueble") {
        await db.insert(schema.inmueblesUbicaciones).values({
          inmuebleId: id2,
          ubicacionId: id1
        });
        return { mensaje: `Relación creada entre ubicación ID ${id1} e inmueble ID ${id2}` };
      }
      else if (tipo1 === "persona" && tipo2 === "persona") {
        await db.insert(schema.personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        });
        return { mensaje: `Relación creada entre persona ID ${id1} y persona ID ${id2}` };
      }
      else if (tipo1 === "vehiculo" && tipo2 === "vehiculo") {
        await db.insert(schema.vehiculosVehiculos).values({
          vehiculoId1: id1,
          vehiculoId2: id2
        });
        return { mensaje: `Relación creada entre vehículo ID ${id1} y vehículo ID ${id2}` };
      }
      else if (tipo1 === "inmueble" && tipo2 === "inmueble") {
        await db.insert(schema.inmueblesInmuebles).values({
          inmuebleId1: id1,
          inmuebleId2: id2
        });
        return { mensaje: `Relación creada entre inmueble ID ${id1} e inmueble ID ${id2}` };
      }
      else if (tipo1 === "ubicacion" && tipo2 === "ubicacion") {
        await db.insert(schema.ubicacionesUbicaciones).values({
          ubicacionId1: id1,
          ubicacionId2: id2
        });
        return { mensaje: `Relación creada entre ubicación ID ${id1} y ubicación ID ${id2}` };
      }
      else {
        throw new Error(`Combinación de tipos no soportada: ${tipo1} y ${tipo2}`);
      }
    } catch (error) {
      console.error("Error al crear relación:", error);
      throw error;
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
      // Normalizar tipo (convertir plurales a singular)
      if (tipo === "personas") tipo = "persona";
      if (tipo === "vehiculos") tipo = "vehiculo";
      if (tipo === "inmuebles") tipo = "inmueble";
      if (tipo === "ubicaciones") tipo = "ubicacion";
      
      // Validar tipo
      const tiposValidos = ["persona", "vehiculo", "inmueble", "ubicacion"];
      if (!tiposValidos.includes(tipo)) {
        throw new Error(`Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`);
      }
      
      console.log(`[DEBUG] Buscando relaciones para: ${tipo}(${id})`);
      

      // Obtener relaciones según el tipo
      if (tipo === "persona") {
        // Personas relacionadas (directamente)
        const personasResult = await db.execute(
          sql`SELECT p.* FROM personas p
              JOIN personas_personas pp ON p.id = pp.persona_id_2
              WHERE pp.persona_id_1 = ${id}
              UNION
              SELECT p.* FROM personas p
              JOIN personas_personas pp ON p.id = pp.persona_id_1
              WHERE pp.persona_id_2 = ${id}`
        );
        resultado.personas = personasResult.rows || [];
        
        // Vehículos relacionados
        const vehiculosResult = await db.execute(
          sql`SELECT v.* FROM vehiculos v
              JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
              WHERE pv.persona_id = ${id}`
        );
        resultado.vehiculos = vehiculosResult.rows || [];
        
        // Inmuebles relacionados
        const inmueblesResult = await db.execute(
          sql`SELECT i.* FROM inmuebles i
              JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
              WHERE pi.persona_id = ${id}`
        );
        resultado.inmuebles = inmueblesResult.rows || [];
        
        // Ubicaciones relacionadas
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
              WHERE pu.persona_id = ${id}`
        );
        resultado.ubicaciones = ubicacionesResult.rows || [];
      } 
      else if (tipo === "vehiculo") {
        // Personas relacionadas
        const personasResult = await db.execute(
          sql`SELECT p.* FROM personas p
              JOIN personas_vehiculos pv ON p.id = pv.persona_id
              WHERE pv.vehiculo_id = ${id}`
        );
        resultado.personas = personasResult.rows || [];
        
        // Vehículos relacionados (directamente)
        const vehiculosResult = await db.execute(
          sql`SELECT v.* FROM vehiculos v
              JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id2
              WHERE vv.vehiculo_id1 = ${id}
              UNION
              SELECT v.* FROM vehiculos v
              JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id1
              WHERE vv.vehiculo_id2 = ${id}`
        );
        resultado.vehiculos = vehiculosResult.rows || [];
        
        // Inmuebles relacionados
        const inmueblesResult = await db.execute(
          sql`SELECT i.* FROM inmuebles i
              JOIN vehiculos_inmuebles vi ON i.id = vi.inmueble_id
              WHERE vi.vehiculo_id = ${id}`
        );
        resultado.inmuebles = inmueblesResult.rows || [];
        
        // Ubicaciones relacionadas
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
              WHERE vu.vehiculo_id = ${id}`
        );
        resultado.ubicaciones = ubicacionesResult.rows || [];
      }
      else if (tipo === "inmueble") {
        // Personas relacionadas
        const personasResult = await db.execute(
          sql`SELECT p.* FROM personas p
              JOIN personas_inmuebles pi ON p.id = pi.persona_id
              WHERE pi.inmueble_id = ${id}`
        );
        resultado.personas = personasResult.rows || [];
        
        // Vehículos relacionados
        const vehiculosResult = await db.execute(
          sql`SELECT v.* FROM vehiculos v
              JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id
              WHERE vi.inmueble_id = ${id}`
        );
        resultado.vehiculos = vehiculosResult.rows || [];
        
        // Inmuebles relacionados (directamente)
        const inmueblesResult = await db.execute(
          sql`SELECT i.* FROM inmuebles i
              JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id2
              WHERE ii.inmueble_id1 = ${id}
              UNION
              SELECT i.* FROM inmuebles i
              JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id1
              WHERE ii.inmueble_id2 = ${id}`
        );
        resultado.inmuebles = inmueblesResult.rows || [];
        
        // Ubicaciones relacionadas
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${id}`
        );
        resultado.ubicaciones = ubicacionesResult.rows || [];
      }
      else if (tipo === "ubicacion") {
        // Personas relacionadas
        const personasResult = await db.execute(
          sql`SELECT p.* FROM personas p
              JOIN personas_ubicaciones pu ON p.id = pu.persona_id
              WHERE pu.ubicacion_id = ${id}`
        );
        resultado.personas = personasResult.rows || [];
        
        // Vehículos relacionados
        const vehiculosResult = await db.execute(
          sql`SELECT v.* FROM vehiculos v
              JOIN vehiculos_ubicaciones vu ON v.id = vu.vehiculo_id
              WHERE vu.ubicacion_id = ${id}`
        );
        resultado.vehiculos = vehiculosResult.rows || [];
        
        // Inmuebles relacionados
        const inmueblesResult = await db.execute(
          sql`SELECT i.* FROM inmuebles i
              JOIN inmuebles_ubicaciones iu ON i.id = iu.inmueble_id
              WHERE iu.ubicacion_id = ${id}`
        );
        resultado.inmuebles = inmueblesResult.rows || [];
        
        // Ubicaciones relacionadas (directamente)
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id2
              WHERE uu.ubicacion_id1 = ${id}
              UNION
              SELECT u.* FROM ubicaciones u
              JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id1
              WHERE uu.ubicacion_id2 = ${id}`
        );
        resultado.ubicaciones = ubicacionesResult.rows || [];
      }

      return resultado;
    } catch (error) {
      console.error(`Error al obtener relaciones para ${tipo} ID ${id}:`, error);
      return resultado;
    }
  }

  async buscarUbicacionesConCoordenadas(query: string, tipos: string[]): Promise<any> {
    try {
      console.log(`DEBUG - Buscando ubicaciones con coordenadas para: "${query}", tipos: ${tipos.join(',')}`);
      
      // Normalizar los tipos para la búsqueda
      const tiposNormalizados = tipos.map(tipo => {
        if (tipo === "personas") return "persona";
        if (tipo === "vehiculos") return "vehiculo";
        if (tipo === "inmuebles") return "inmueble";
        if (tipo === "ubicaciones") return "ubicacion";
        return tipo;
      });
      
      console.log(`DEBUG - Tipos normalizados para la búsqueda: [${tiposNormalizados.join(', ')}]`);
      
      // Variables para el resultado
      const resultado: any = {
        ubicacionesDirectas: [],
        ubicacionesRelacionadas: []
      };
      
      // Set para mantener un registro de las ubicaciones ya encontradas (evitar duplicados)
      const ubicacionesEncontradas = new Set();
      
      // Patrón para búsqueda SQL LIKE
      const queryExacto = query.trim();
      const searchPattern = `%${queryExacto}%`;
      
      console.log(`********** INICIO DE BÚSQUEDA MEJORADA **********`);
      console.log(`Buscando con: "${queryExacto}", exacto: "${queryExacto}", patrón: "${searchPattern}", tipos: ${tiposNormalizados.join(', ')}`);
      
      try {
        // 1. BÚSQUEDA DE PERSONAS
        if (tiposNormalizados.includes('persona') || tiposNormalizados.includes('personas')) {
          console.log(`Buscando personas con ID/identificación/nombre: ${queryExacto}`);
          
          // Verificar si el término de búsqueda podría ser un ID numérico
          let idNumerico: number | null = null;
          if (!isNaN(parseInt(queryExacto))) {
            idNumerico = parseInt(queryExacto);
            console.log(`Detectado posible ID numérico: ${idNumerico}`);
          }
          
          // Consulta SQL directa para personas
          let personasResult;
          if (idNumerico !== null) {
            console.log(`Ejecutando consulta SQL para personas con id=${idNumerico}`);
            personasResult = await db.execute(
              sql`SELECT * FROM personas WHERE id = ${idNumerico}`
            );
          } else {
            console.log(`Ejecutando consulta SQL para personas con identificacion=${queryExacto} O nombre LIKE ${searchPattern}`);
            personasResult = await db.execute(
              sql`SELECT * FROM personas WHERE 
                  identificacion = ${queryExacto} OR 
                  nombre LIKE ${searchPattern}`
            );
          }
          
          const personas = personasResult.rows || [];
          console.log(`Personas encontradas: ${personas.length}`);
          
          // Para cada persona, buscar sus ubicaciones y relaciones
          for (const persona of personas) {
            console.log(`Buscando ubicaciones para persona ID: ${persona.id}, Nombre: ${persona.nombre}`);
            
            // 1. Buscar ubicaciones directamente asociadas a la persona
            console.log(`[DEBUG] Relaciones en personas_ubicaciones para persona ID ${persona.id}: 0`);
            const ubicacionesPersonaResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                  WHERE pu.persona_id = ${persona.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesPersona = ubicacionesPersonaResult.rows || [];
            console.log(`Ubicaciones encontradas para persona ID ${persona.id}: ${ubicacionesPersona.length}`);
            
            // Si la persona tiene ubicaciones, agregarlas al resultado
            for (const ubicacion of ubicacionesPersona) {
              if (!ubicacionesEncontradas.has(ubicacion.id)) {
                ubicacionesEncontradas.add(ubicacion.id);
                resultado.ubicacionesDirectas.push({
                  ...ubicacion,
                  entidad: {
                    tipo: 'persona',
                    ...persona
                  }
                });
              }
            }
            
            // 2. Buscar personas relacionadas con esta persona
            console.log(`Buscando personas relacionadas a la persona ID: ${persona.id}`);
            const personasRelacionadasResult = await db.execute(
              sql`SELECT p.* FROM personas p
                  JOIN personas_personas pp ON p.id = pp.persona_id_2
                  WHERE pp.persona_id_1 = ${persona.id}
                  UNION
                  SELECT p.* FROM personas p
                  JOIN personas_personas pp ON p.id = pp.persona_id_1
                  WHERE pp.persona_id_2 = ${persona.id}`
            );
            
            const personasRelacionadas = personasRelacionadasResult.rows || [];
            console.log(`Personas relacionadas a la persona ID ${persona.id}: ${personasRelacionadas.length}`);
            
            // Para cada persona relacionada, buscar sus ubicaciones
            for (const personaRelacionada of personasRelacionadas) {
              console.log(`Buscando ubicaciones para persona relacionada ID: ${personaRelacionada.id}`);
              
              const ubicacionesRelacionadasResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                    WHERE pu.persona_id = ${personaRelacionada.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesRelacionadas = ubicacionesRelacionadasResult.rows || [];
              console.log(`Ubicaciones encontradas para persona relacionada ID ${personaRelacionada.id}: ${ubicacionesRelacionadas.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesRelacionadas) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'persona',
                      entidad: personaRelacionada,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: persona
                      }
                    }
                  });
                }
              }
            }
            
            // 3. Buscar vehículos relacionados con esta persona
            console.log(`Buscando vehículos relacionados a la persona ID: ${persona.id}`);
            const vehiculosRelacionadosResult = await db.execute(
              sql`SELECT v.* FROM vehiculos v
                  JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
                  WHERE pv.persona_id = ${persona.id}`
            );
            
            const vehiculosRelacionados = vehiculosRelacionadosResult.rows || [];
            console.log(`Vehículos relacionados a la persona ID ${persona.id}: ${vehiculosRelacionados.length}`);
            
            // Para cada vehículo, buscar sus ubicaciones
            for (const vehiculo of vehiculosRelacionados) {
              console.log(`Buscando ubicaciones para vehículo ID: ${vehiculo.id}`);
              
              const ubicacionesVehiculoResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                    WHERE vu.vehiculo_id = ${vehiculo.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesVehiculo = ubicacionesVehiculoResult.rows || [];
              console.log(`Ubicaciones encontradas para vehículo ID ${vehiculo.id}: ${ubicacionesVehiculo.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesVehiculo) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'vehiculo',
                      entidad: vehiculo,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: persona
                      }
                    }
                  });
                }
              }
            }
            
            // 4. Buscar inmuebles relacionados con esta persona
            console.log(`Buscando inmuebles relacionados a la persona ID: ${persona.id}`);
            const inmueblesRelacionadosResult = await db.execute(
              sql`SELECT i.* FROM inmuebles i
                  JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
                  WHERE pi.persona_id = ${persona.id}`
            );
            
            const inmueblesRelacionados = inmueblesRelacionadosResult.rows || [];
            console.log(`Inmuebles relacionados a la persona ID ${persona.id}: ${inmueblesRelacionados.length}`);
            
            // Para cada inmueble, buscar sus ubicaciones
            for (const inmueble of inmueblesRelacionados) {
              console.log(`Buscando ubicaciones para inmueble relacionado ID: ${inmueble.id}`);
              
              const ubicacionesInmuebleResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                    WHERE iu.inmueble_id = ${inmueble.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesInmueble = ubicacionesInmuebleResult.rows || [];
              console.log(`Ubicaciones encontradas para inmueble relacionado ID ${inmueble.id}: ${ubicacionesInmueble.length}`);
              
              // Agregar cada ubicación al resultado
              for (const ubicacion of ubicacionesInmueble) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmueble,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: persona
                      }
                    }
                  });
                }
              }
              
              // Si no hay ubicaciones específicas, verificar si el inmueble tiene coordenadas propias
              if (ubicacionesInmueble.length === 0) {
                const inmuebleConCoordenadas = await db.execute(
                  sql`SELECT * FROM inmuebles WHERE id = ${inmueble.id}
                      AND latitud IS NOT NULL AND longitud IS NOT NULL
                      AND latitud != 0 AND longitud != 0`
                );
                
                if (inmuebleConCoordenadas.rows && inmuebleConCoordenadas.rows.length > 0) {
                  const inmuebleInfo = inmuebleConCoordenadas.rows[0];
                  console.log(`El inmueble ID ${inmueble.id} tiene coordenadas propias: [${inmuebleInfo.latitud}, ${inmuebleInfo.longitud}]`);
                  
                  // Crear una ubicación virtual a partir del inmueble
                  const ubicacionId = `inmueble-${inmueble.id}`;
                  
                  if (!ubicacionesEncontradas.has(ubicacionId)) {
                    ubicacionesEncontradas.add(ubicacionId);
                    
                    const ubicacionVirtual = {
                      id: ubicacionId,
                      latitud: inmuebleInfo.latitud,
                      longitud: inmuebleInfo.longitud,
                      tipo: inmuebleInfo.tipo || "Inmueble",
                      observaciones: `Inmueble: ${inmuebleInfo.direccion || "Sin dirección"}`
                    };
                    
                    resultado.ubicacionesRelacionadas.push({
                      ubicacion: ubicacionVirtual,
                      entidadRelacionada: {
                        tipo: 'inmueble',
                        entidad: inmueble,
                        relacionadoCon: {
                          tipo: 'persona',
                          entidad: persona
                        }
                      }
                    });
                  }
                }
              }
              
              // NIVEL 3: Buscar vehículos relacionados con este inmueble
              console.log(`Buscando vehículos relacionados al inmueble ID: ${inmueble.id} (de la persona ID: ${persona.id})`);
              const vehiculosInmuebleResult = await db.execute(
                sql`SELECT v.* FROM vehiculos v
                    JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id
                    WHERE vi.inmueble_id = ${inmueble.id}`
              );
              
              const vehiculosInmueble = vehiculosInmuebleResult.rows || [];
              console.log(`Vehículos relacionados al inmueble ID ${inmueble.id}: ${vehiculosInmueble.length}`);
              
              // Para cada vehículo, obtener sus ubicaciones
              for (const vehiculoInmueble of vehiculosInmueble) {
                console.log(`Buscando ubicaciones para vehículo ${vehiculoInmueble.id} relacionado con inmueble ${inmueble.id}`);
                
                const ubicacionesVehiculoResult = await db.execute(
                  sql`SELECT u.* FROM ubicaciones u
                      JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                      WHERE vu.vehiculo_id = ${vehiculoInmueble.id}
                      AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
                );
                
                const ubicacionesVehiculo = ubicacionesVehiculoResult.rows || [];
                console.log(`Ubicaciones encontradas para vehículo ${vehiculoInmueble.id}: ${ubicacionesVehiculo.length}`);
                
                // Agregar cada ubicación al resultado con la cadena de relaciones
                for (const ubicacion of ubicacionesVehiculo) {
                  if (!ubicacionesEncontradas.has(ubicacion.id)) {
                    ubicacionesEncontradas.add(ubicacion.id);
                    resultado.ubicacionesRelacionadas.push({
                      ubicacion: ubicacion,
                      entidadRelacionada: {
                        tipo: 'vehiculo',
                        entidad: vehiculoInmueble,
                        relacionadoCon: {
                          tipo: 'inmueble',
                          entidad: inmueble,
                          relacionadoCon: {
                            tipo: 'persona',
                            entidad: persona
                          }
                        }
                      }
                    });
                  }
                }
              }
            }
          }
        }

        // 2. BÚSQUEDA DE VEHÍCULOS
        if (tiposNormalizados.includes('vehiculo') || tiposNormalizados.includes('vehiculos')) {
          console.log(`Buscando vehículos con ID/placa/marca/modelo: ${queryExacto}`);
          
          // Verificar si el término de búsqueda podría ser un ID numérico
          let idNumerico: number | null = null;
          if (!isNaN(parseInt(queryExacto))) {
            idNumerico = parseInt(queryExacto);
            console.log(`Detectado posible ID numérico: ${idNumerico}`);
          }
          
          // Consulta SQL directa para vehículos
          let vehiculosResult;
          if (idNumerico !== null) {
            console.log(`Ejecutando consulta SQL para vehículos con id=${idNumerico}`);
            vehiculosResult = await db.execute(
              sql`SELECT * FROM vehiculos WHERE id = ${idNumerico}`
            );
          } else {
            console.log(`Ejecutando consulta SQL para vehículos con placa=${queryExacto} O marca/modelo/tipo LIKE ${searchPattern}`);
            vehiculosResult = await db.execute(
              sql`SELECT * FROM vehiculos WHERE 
                  placa = ${queryExacto} OR 
                  marca LIKE ${searchPattern} OR
                  modelo LIKE ${searchPattern} OR
                  tipo LIKE ${searchPattern}`
            );
          }
          
          const vehiculos = vehiculosResult.rows || [];
          console.log(`Vehículos encontrados: ${vehiculos.length}`);
          
          // Para cada vehículo, buscar sus ubicaciones y relaciones
          for (const vehiculo of vehiculos) {
            console.log(`Buscando ubicaciones para vehículo ID: ${vehiculo.id}, Placa: ${vehiculo.placa}`);
            
            // 1. Buscar ubicaciones directamente asociadas al vehículo
            const ubicacionesVehiculoResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                  WHERE vu.vehiculo_id = ${vehiculo.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesVehiculo = ubicacionesVehiculoResult.rows || [];
            console.log(`Ubicaciones encontradas para vehículo ID ${vehiculo.id}: ${ubicacionesVehiculo.length}`);
            
            // Si el vehículo tiene ubicaciones, agregarlas al resultado
            for (const ubicacion of ubicacionesVehiculo) {
              if (!ubicacionesEncontradas.has(ubicacion.id)) {
                ubicacionesEncontradas.add(ubicacion.id);
                resultado.ubicacionesDirectas.push({
                  ...ubicacion,
                  entidad: {
                    tipo: 'vehiculo',
                    ...vehiculo
                  }
                });
              }
            }
            
            // 2. Buscar personas relacionadas con este vehículo
            console.log(`Buscando personas relacionadas al vehículo ID: ${vehiculo.id}`);
            const personasRelacionadasResult = await db.execute(
              sql`SELECT p.* FROM personas p
                  JOIN personas_vehiculos pv ON p.id = pv.persona_id
                  WHERE pv.vehiculo_id = ${vehiculo.id}`
            );
            
            const personasRelacionadas = personasRelacionadasResult.rows || [];
            console.log(`Personas relacionadas al vehículo ID ${vehiculo.id}: ${personasRelacionadas.length}`);
            
            // Para cada persona relacionada, buscar sus ubicaciones
            for (const personaRelacionada of personasRelacionadas) {
              console.log(`Buscando ubicaciones para persona relacionada ID: ${personaRelacionada.id}`);
              
              const ubicacionesPersonaResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                    WHERE pu.persona_id = ${personaRelacionada.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesPersona = ubicacionesPersonaResult.rows || [];
              console.log(`Ubicaciones encontradas para persona relacionada ID ${personaRelacionada.id}: ${ubicacionesPersona.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesPersona) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'persona',
                      entidad: personaRelacionada,
                      relacionadoCon: {
                        tipo: 'vehiculo',
                        entidad: vehiculo
                      }
                    }
                  });
                }
              }
            }
            
            // 3. Buscar vehículos relacionados con este vehículo
            console.log(`Buscando vehículos relacionados al vehículo ID: ${vehiculo.id}`);
            const vehiculosRelacionadosResult = await db.execute(
              sql`SELECT v.* FROM vehiculos v
                  JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id2
                  WHERE vv.vehiculo_id1 = ${vehiculo.id}
                  UNION
                  SELECT v.* FROM vehiculos v
                  JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id1
                  WHERE vv.vehiculo_id2 = ${vehiculo.id}`
            );
            
            const vehiculosRelacionados = vehiculosRelacionadosResult.rows || [];
            console.log(`Vehículos relacionados al vehículo ID ${vehiculo.id}: ${vehiculosRelacionados.length}`);
            
            // Para cada vehículo relacionado, buscar sus ubicaciones
            for (const vehiculoRelacionado of vehiculosRelacionados) {
              console.log(`Buscando ubicaciones para vehículo relacionado ID: ${vehiculoRelacionado.id}`);
              
              const ubicacionesVehiculoRelResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                    WHERE vu.vehiculo_id = ${vehiculoRelacionado.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesVehiculoRel = ubicacionesVehiculoRelResult.rows || [];
              console.log(`Ubicaciones encontradas para vehículo relacionado ID ${vehiculoRelacionado.id}: ${ubicacionesVehiculoRel.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesVehiculoRel) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'vehiculo',
                      entidad: vehiculoRelacionado,
                      relacionadoCon: {
                        tipo: 'vehiculo',
                        entidad: vehiculo
                      }
                    }
                  });
                }
              }
            }
            
            // 4. Buscar inmuebles relacionados con este vehículo
            console.log(`Buscando inmuebles relacionados al vehículo ID: ${vehiculo.id}`);
            const inmueblesRelacionadosResult = await db.execute(
              sql`SELECT i.* FROM inmuebles i
                  JOIN vehiculos_inmuebles vi ON i.id = vi.inmueble_id
                  WHERE vi.vehiculo_id = ${vehiculo.id}`
            );
            
            const inmueblesRelacionados = inmueblesRelacionadosResult.rows || [];
            console.log(`Inmuebles relacionados al vehículo ID ${vehiculo.id}: ${inmueblesRelacionados.length}`);
            
            // Para cada inmueble, buscar sus ubicaciones
            for (const inmuebleRelacionado of inmueblesRelacionados) {
              console.log(`Buscando ubicaciones para inmueble relacionado ID: ${inmuebleRelacionado.id}`);
              
              const ubicacionesInmuebleResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                    WHERE iu.inmueble_id = ${inmuebleRelacionado.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesInmueble = ubicacionesInmuebleResult.rows || [];
              console.log(`Ubicaciones encontradas para inmueble relacionado ID ${inmuebleRelacionado.id}: ${ubicacionesInmueble.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesInmueble) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmuebleRelacionado,
                      relacionadoCon: {
                        tipo: 'vehiculo',
                        entidad: vehiculo
                      }
                    }
                  });
                }
              }
            }
          }
        }

        // 3. BÚSQUEDA DE INMUEBLES
        if (tiposNormalizados.includes('inmueble') || tiposNormalizados.includes('inmuebles')) {
          console.log(`Buscando inmuebles con ID/dirección/tipo/propietario: ${queryExacto}`);
          
          // Verificar si el término de búsqueda podría ser un ID numérico
          let idNumerico: number | null = null;
          if (!isNaN(parseInt(queryExacto))) {
            idNumerico = parseInt(queryExacto);
            console.log(`Detectado posible ID numérico: ${idNumerico}`);
          }
          
          // Consulta SQL directa para inmuebles
          let inmueblesResult;
          if (idNumerico !== null) {
            console.log(`Ejecutando consulta SQL para inmuebles con id=${idNumerico}`);
            inmueblesResult = await db.execute(
              sql`SELECT * FROM inmuebles WHERE id = ${idNumerico}`
            );
          } else {
            console.log(`Ejecutando consulta SQL para inmuebles con dirección/tipo/propietario LIKE ${searchPattern}`);
            inmueblesResult = await db.execute(
              sql`SELECT * FROM inmuebles WHERE 
                  direccion LIKE ${searchPattern} OR 
                  tipo LIKE ${searchPattern} OR
                  propietario LIKE ${searchPattern}`
            );
          }
          
          const inmuebles = inmueblesResult.rows || [];
          console.log(`Inmuebles encontrados: ${inmuebles.length}`);
          
          // Para cada inmueble, buscar sus ubicaciones y relaciones
          for (const inmueble of inmuebles) {
            console.log(`Buscando ubicaciones para inmueble ID: ${inmueble.id}`);
            
            // 1. Buscar ubicaciones directamente asociadas al inmueble
            const ubicacionesInmuebleResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                  WHERE iu.inmueble_id = ${inmueble.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesInmueble = ubicacionesInmuebleResult.rows || [];
            console.log(`Ubicaciones encontradas para inmueble ID ${inmueble.id}: ${ubicacionesInmueble.length}`);
            
            // Si el inmueble tiene ubicaciones, agregarlas al resultado
            for (const ubicacion of ubicacionesInmueble) {
              if (!ubicacionesEncontradas.has(ubicacion.id)) {
                ubicacionesEncontradas.add(ubicacion.id);
                resultado.ubicacionesDirectas.push({
                  ...ubicacion,
                  entidad: {
                    tipo: 'inmueble',
                    ...inmueble
                  }
                });
              }
            }
            
            // 2. Buscar inmuebles relacionados con este inmueble
            console.log(`Buscando inmuebles relacionados al inmueble ID: ${inmueble.id}`);
            const inmueblesRelacionadosResult = await db.execute(
              sql`SELECT i.* FROM inmuebles i
                  JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id2
                  WHERE ii.inmueble_id1 = ${inmueble.id}
                  UNION
                  SELECT i.* FROM inmuebles i
                  JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id1
                  WHERE ii.inmueble_id2 = ${inmueble.id}`
            );
            
            const inmueblesRelacionados = inmueblesRelacionadosResult.rows || [];
            console.log(`Inmuebles relacionados al inmueble ID ${inmueble.id}: ${inmueblesRelacionados.length}`);
            
            // Para cada inmueble relacionado, buscar sus ubicaciones
            for (const inmuebleRelacionado of inmueblesRelacionados) {
              console.log(`Buscando ubicaciones para inmueble relacionado ID: ${inmuebleRelacionado.id}`);
              
              const ubicacionesInmuebleRelResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                    WHERE iu.inmueble_id = ${inmuebleRelacionado.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesInmuebleRel = ubicacionesInmuebleRelResult.rows || [];
              console.log(`Ubicaciones encontradas para inmueble relacionado ID ${inmuebleRelacionado.id}: ${ubicacionesInmuebleRel.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesInmuebleRel) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmuebleRelacionado,
                      relacionadoCon: {
                        tipo: 'inmueble',
                        entidad: inmueble
                      }
                    }
                  });
                }
              }
            }
            
            // 3. Buscar personas relacionadas con este inmueble
            console.log(`Buscando personas relacionadas al inmueble ID: ${inmueble.id}`);
            const personasRelacionadasResult = await db.execute(
              sql`SELECT p.* FROM personas p
                  JOIN personas_inmuebles pi ON p.id = pi.persona_id
                  WHERE pi.inmueble_id = ${inmueble.id}`
            );
            
            // Verificación SQL directa para depuración
            console.log(`[DEBUG] Raw SQL check personas_inmuebles con inmueble_id=${inmueble.id}: ${JSON.stringify(await db.execute(sql`SELECT * FROM personas_inmuebles WHERE inmueble_id = ${inmueble.id}`).then(res => res.rows))}`);
            
            const personasRelacionadas = personasRelacionadasResult.rows || [];
            console.log(`Personas relacionadas al inmueble ID ${inmueble.id}: ${personasRelacionadas.length}`);
            if (personasRelacionadas.length > 0) {
              console.log(`[DEBUG] Detalle de personas relacionadas con inmueble ID ${inmueble.id}: ${personasRelacionadas.map(p => `ID: ${p.id}, Nombre: ${p.nombre}`)}`);
            }
            
            // Para cada persona relacionada, buscar sus ubicaciones
            for (const personaRelacionada of personasRelacionadas) {
              console.log(`Buscando ubicaciones para persona relacionada ID: ${personaRelacionada.id}`);
              
              const ubicacionesPersonaResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                    WHERE pu.persona_id = ${personaRelacionada.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesPersona = ubicacionesPersonaResult.rows || [];
              console.log(`Ubicaciones encontradas para persona relacionada ID ${personaRelacionada.id}: ${ubicacionesPersona.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesPersona) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'persona',
                      entidad: personaRelacionada,
                      relacionadoCon: {
                        tipo: 'inmueble',
                        entidad: inmueble
                      }
                    }
                  });
                }
              }
            }
            
            // 4. Buscar vehículos relacionados con este inmueble
            console.log(`Buscando vehículos relacionados al inmueble ID: ${inmueble.id}`);
            const vehiculosRelacionadosResult = await db.execute(
              sql`SELECT v.* FROM vehiculos v
                  JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id
                  WHERE vi.inmueble_id = ${inmueble.id}`
            );
            
            const vehiculosRelacionados = vehiculosRelacionadosResult.rows || [];
            console.log(`Vehículos relacionados al inmueble ID ${inmueble.id}: ${vehiculosRelacionados.length}`);
            
            // Para cada vehículo relacionado, buscar sus ubicaciones
            for (const vehiculoRelacionado of vehiculosRelacionados) {
              console.log(`Buscando ubicaciones para vehículo relacionado ID: ${vehiculoRelacionado.id}`);
              
              const ubicacionesVehiculoResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                    WHERE vu.vehiculo_id = ${vehiculoRelacionado.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesVehiculo = ubicacionesVehiculoResult.rows || [];
              console.log(`Ubicaciones encontradas para vehículo relacionado ID ${vehiculoRelacionado.id}: ${ubicacionesVehiculo.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesVehiculo) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'vehiculo',
                      entidad: vehiculoRelacionado,
                      relacionadoCon: {
                        tipo: 'inmueble',
                        entidad: inmueble
                      }
                    }
                  });
                }
              }
            }
          }
        }

        // 4. BÚSQUEDA DE UBICACIONES
        if (tiposNormalizados.includes('ubicacion') || tiposNormalizados.includes('ubicaciones')) {
          console.log(`Buscando ubicaciones con ID/tipo/descripción/observaciones: ${queryExacto}`);
          
          // Verificar si el término de búsqueda podría ser un ID numérico
          let idNumerico: number | null = null;
          if (!isNaN(parseInt(queryExacto))) {
            idNumerico = parseInt(queryExacto);
            console.log(`Detectado posible ID numérico: ${idNumerico}`);
          }
          
          // Consulta SQL directa para ubicaciones
          let ubicacionesResult;
          if (idNumerico !== null) {
            console.log(`Ejecutando consulta SQL para ubicaciones con id=${idNumerico}`);
            ubicacionesResult = await db.execute(
              sql`SELECT * FROM ubicaciones WHERE id = ${idNumerico} AND latitud IS NOT NULL AND longitud IS NOT NULL`
            );
          } else {
            console.log(`Ejecutando consulta SQL para ubicaciones con tipo/observaciones LIKE ${searchPattern}`);
            ubicacionesResult = await db.execute(
              sql`SELECT * FROM ubicaciones 
                  WHERE (tipo LIKE ${searchPattern} OR observaciones LIKE ${searchPattern})
                  AND latitud IS NOT NULL AND longitud IS NOT NULL`
            );
          }
          
          const ubicaciones = ubicacionesResult.rows || [];
          const ubicacionesDirectas = [];
          console.log(`Ubicaciones directas encontradas: ${ubicaciones.length}`);
          
          // Agregar cada ubicación encontrada al resultado
          for (const ubicacion of ubicaciones) {
            resultado.ubicacionesDirectas.push(ubicacion);
            ubicacionesEncontradas.add(ubicacion.id);
            
            // También buscamos relaciones para cada ubicación encontrada
            console.log(`Buscando relaciones para las ubicaciones directas encontradas...`);
            
            // 1. Buscar otras ubicaciones relacionadas con esta ubicación
            const ubicacionesRelacionadasResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id2
                  WHERE uu.ubicacion_id1 = ${ubicacion.id} AND u.id != ${ubicacion.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                  UNION
                  SELECT u.* FROM ubicaciones u
                  JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id1
                  WHERE uu.ubicacion_id2 = ${ubicacion.id} AND u.id != ${ubicacion.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesRelacionadas = ubicacionesRelacionadasResult.rows || [];
            console.log(`Ubicaciones relacionadas a la ubicación ID ${ubicacion.id}: ${ubicacionesRelacionadas.length}`);
            
            // Agregar cada ubicación relacionada al resultado
            for (const ubicacionRel of ubicacionesRelacionadas) {
              if (!ubicacionesEncontradas.has(ubicacionRel.id)) {
                ubicacionesEncontradas.add(ubicacionRel.id);
                resultado.ubicacionesRelacionadas.push({
                  ubicacion: ubicacionRel,
                  entidadRelacionada: {
                    tipo: 'ubicacion',
                    entidad: ubicacionRel,
                    relacionadoCon: {
                      tipo: 'ubicacion',
                      entidad: ubicacion
                    }
                  }
                });
              }
            }
          }
        }
        
        console.log(`Total de ubicaciones encontradas: ${resultado.ubicacionesDirectas.length + resultado.ubicacionesRelacionadas.length}`);
      } catch (error) {
        console.error("Error durante la búsqueda de ubicaciones:", error);
      }
      
      // Log del resultado final (resumido para no llenar la consola)
      console.log(`DEBUG - Resultado final (resumido): ${JSON.stringify({
        totalUbicacionesDirectas: resultado.ubicacionesDirectas.length,
        totalUbicacionesRelacionadas: resultado.ubicacionesRelacionadas.length
      })}`);
      
      return resultado;
    } catch (error) {
      console.error("Error general en la búsqueda de ubicaciones:", error);
      return {
        ubicacionesDirectas: [],
        ubicacionesRelacionadas: []
      };
    }
  }
}

// Conexión a la base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Instancia exportada de DatabaseStorage
export const storage = new DatabaseStorage();