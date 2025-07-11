import { sql, eq, and, or, like } from 'drizzle-orm';
import { db, pool } from './db';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { 
  users, 
  personas, 
  vehiculos, 
  inmuebles, 
  ubicaciones, 
  tiposInmuebles, 
  tiposUbicaciones, 
  tiposIdentificacion, 
  posicionesEstructura, 
  celulas, 
  celulasPersonas, 
  nivelesCelula,
  personasObservaciones,
  vehiculosObservaciones,
  inmueblesObservaciones,
  ubicacionesObservaciones,
  personasVehiculos,
  personasInmuebles,
  personasUbicaciones,
  vehiculosInmuebles,
  vehiculosUbicaciones,
  inmueblesUbicaciones,
  inmueblesInmuebles,
  personasPersonas,
  vehiculosVehiculos,
  User, 
  Persona, 
  Vehiculo, 
  Inmueble, 
  Ubicacion, 
  TipoInmueble, 
  TipoUbicacion, 
  TipoIdentificacion,
  PosicionEstructura,
  Celula,
  NivelCelula,
  InsertUser, 
  InsertPersona, 
  InsertVehiculo, 
  InsertInmueble,
  InsertUbicacion,
  InsertTipoInmueble,
  InsertTipoUbicacion,
  InsertTipoIdentificacion,
  InsertPosicionEstructura,
  InsertCelula,
  InsertNivelCelula,
  InsertPersonaObservacion,
  PersonaObservacion,
  InsertVehiculoObservacion,
  VehiculoObservacion,
  InsertInmuebleObservacion,
  InmuebleObservacion,
  InsertUbicacionObservacion,
  UbicacionObservacion,
  CelulaPersona,
  InsertCelulaPersona
} from '../shared/schema';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // USER METHODS
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

  // PERSONAS METHODS (REFACTORIZADOS A DRIZZLE)
  async getAllPersonas(): Promise<any[]> {
    const result = await db.select({
        id: personas.id,
        nombre: personas.nombre,
        identificacion: personas.identificacion,
        alias: personas.alias,
        telefonos: personas.telefonos,
        domicilios: personas.domicilios,
        foto: personas.foto,
        posicionEstructura: personas.posicionEstructura,
        tipoIdentificacionId: personas.tipoIdentificacionId,
        tipoIdentificacion: tiposIdentificacion.tipo
      })
      .from(personas)
      .leftJoin(tiposIdentificacion, eq(personas.tipoIdentificacionId, tiposIdentificacion.id))
      .orderBy(personas.id);
    
    return result;
  }

  async getPersona(id: number): Promise<any | undefined> {
    const [persona] = await db.select({
        id: personas.id,
        nombre: personas.nombre,
        identificacion: personas.identificacion,
        alias: personas.alias,
        telefonos: personas.telefonos,
        domicilios: personas.domicilios,
        foto: personas.foto,
        posicionEstructura: personas.posicionEstructura,
        tipoIdentificacionId: personas.tipoIdentificacionId,
        tipoIdentificacion: tiposIdentificacion.tipo
      })
      .from(personas)
      .leftJoin(tiposIdentificacion, eq(personas.tipoIdentificacionId, tiposIdentificacion.id))
      .where(eq(personas.id, id));

    return persona;
  }

  async checkPersonaIdentificacionExists(identificacion: string): Promise<boolean> {
    const [existing] = await db.select({ count: sql<number>`count(*)` }).from(personas).where(eq(personas.identificacion, identificacion));
    return existing.count > 0;
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    const identificacionExists = await this.checkPersonaIdentificacionExists(insertPersona.identificacion);
    if (identificacionExists) {
      throw new Error("El número de identificación que intentas guardar ya se encuentra registrado");
    }
    const [persona] = await db.insert(personas).values(insertPersona).returning();
    return persona;
  }

  // VEHICULOS METHODS
  async getAllVehiculos(): Promise<Vehiculo[]> {
    return await db.select().from(vehiculos);
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, id));
    return vehiculo;
  }

  async checkVehiculoPlacaExists(placa: string): Promise<boolean> {
    const [existing] = await db.select().from(vehiculos).where(eq(vehiculos.placa, placa));
    return !!existing;
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    const placaExists = await this.checkVehiculoPlacaExists(insertVehiculo.placa);
    if (placaExists) {
      throw new Error("El número de placa que intentas guardar ya se encuentra registrado");
    }
    const [vehiculo] = await db.insert(vehiculos).values(insertVehiculo).returning();
    return vehiculo;
  }

  // TIPOS DE INMUEBLES METHODS
  async getAllTiposInmuebles(): Promise<TipoInmueble[]> {
    return await db.select().from(tiposInmuebles)
      .where(eq(tiposInmuebles.activo, true))
      .orderBy(tiposInmuebles.nombre);
  }

  async getTipoInmueble(id: number): Promise<TipoInmueble | undefined> {
    const [tipoInmueble] = await db.select().from(tiposInmuebles).where(eq(tiposInmuebles.id, id));
    return tipoInmueble;
  }

  async createTipoInmueble(tipoInmueble: InsertTipoInmueble): Promise<TipoInmueble> {
    const [nuevoTipoInmueble] = await db.insert(tiposInmuebles).values(tipoInmueble).returning();
    return nuevoTipoInmueble;
  }

  async updateTipoInmueble(id: number, tipoInmueble: Partial<InsertTipoInmueble>): Promise<TipoInmueble | undefined> {
    const [tipoActualizado] = await db.update(tiposInmuebles)
      .set(tipoInmueble)
      .where(eq(tiposInmuebles.id, id))
      .returning();
    return tipoActualizado;
  }

  async deleteTipoInmueble(id: number): Promise<boolean> {
    try {
      const relatedInmuebles = await db.select().from(inmuebles).where(
        or(
          eq(inmuebles.tipo, String(id)),
          eq(inmuebles.tipoId, id)
        )
      );
      
      if (relatedInmuebles.length > 0) {
        await db.update(tiposInmuebles)
          .set({ activo: false })
          .where(eq(tiposInmuebles.id, id));
      } else {
        await db.delete(tiposInmuebles).where(eq(tiposInmuebles.id, id));
      }
      return true;
    } catch (error) {
      console.error('Error al eliminar tipo de inmueble:', error);
      return false;
    }
  }

  // INMUEBLES METHODS
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

  // TIPOS DE UBICACIONES METHODS
  async getAllTiposUbicaciones(): Promise<TipoUbicacion[]> {
    return await db.select().from(tiposUbicaciones)
      .where(eq(tiposUbicaciones.activo, true))
      .orderBy(tiposUbicaciones.nombre);
  }

  async getTipoUbicacion(id: number): Promise<TipoUbicacion | undefined> {
    const [tipoUbicacion] = await db.select().from(tiposUbicaciones).where(eq(tiposUbicaciones.id, id));
    return tipoUbicacion;
  }

  async createTipoUbicacion(tipoUbicacion: InsertTipoUbicacion): Promise<TipoUbicacion> {
    const [nuevoTipoUbicacion] = await db.insert(tiposUbicaciones).values(tipoUbicacion).returning();
    return nuevoTipoUbicacion;
  }

  async updateTipoUbicacion(id: number, tipoUbicacion: Partial<InsertTipoUbicacion>): Promise<TipoUbicacion | undefined> {
    const [tipoActualizado] = await db.update(tiposUbicaciones)
      .set(tipoUbicacion)
      .where(eq(tiposUbicaciones.id, id))
      .returning();
    return tipoActualizado;
  }

  async deleteTipoUbicacion(id: number): Promise<boolean> {
    try {
      const relatedUbicaciones = await db.select().from(ubicaciones).where(
        or(
          eq(ubicaciones.tipo, String(id)),
          eq(ubicaciones.tipoId, id)
        )
      );
      
      if (relatedUbicaciones.length > 0) {
        await db.update(tiposUbicaciones)
          .set({ activo: false })
          .where(eq(tiposUbicaciones.id, id));
      } else {
        await db.delete(tiposUbicaciones).where(eq(tiposUbicaciones.id, id));
      }
      return true;
    } catch (error) {
      console.error('Error al eliminar tipo de ubicacion:', error);
      return false;
    }
  }

  // POSICIONES ESTRUCTURA METHODS
  async getAllPosicionesEstructura(): Promise<PosicionEstructura[]> {
    return await db.select().from(posicionesEstructura);
  }

  async getPosicionEstructura(id: number): Promise<PosicionEstructura | undefined> {
    const [posicion] = await db.select().from(posicionesEstructura).where(eq(posicionesEstructura.id, id));
    return posicion;
  }

  async createPosicionEstructura(posicion: InsertPosicionEstructura): Promise<PosicionEstructura> {
    const [nuevaPosicion] = await db.insert(posicionesEstructura).values(posicion).returning();
    return nuevaPosicion;
  }

  async updatePosicionEstructura(id: number, posicion: Partial<InsertPosicionEstructura>): Promise<PosicionEstructura | undefined> {
    const [updatedPosicion] = await db.update(posicionesEstructura)
      .set(posicion)
      .where(eq(posicionesEstructura.id, id))
      .returning();
    return updatedPosicion;
  }

  async deletePosicionEstructura(id: number): Promise<boolean> {
    try {
      const personasConPosicion = await db.select().from(personas).where(eq(personas.posicionEstructura, String(id)));
      
      if (personasConPosicion.length > 0) {
        return false;
      }
      
      await db.delete(posicionesEstructura).where(eq(posicionesEstructura.id, id));
      return true;
    } catch (error) {
      console.error('Error al eliminar posición de estructura:', error);
      return false;
    }
  }

  // TIPOS DE IDENTIFICACIÓN METHODS
  async getAllTiposIdentificacion(): Promise<TipoIdentificacion[]> {
    return await db.select().from(tiposIdentificacion)
      .where(eq(tiposIdentificacion.activo, "true"))
      .orderBy(tiposIdentificacion.tipo);
  }

  async getTipoIdentificacion(id: number): Promise<TipoIdentificacion | undefined> {
    const [tipoIdentificacion] = await db.select().from(tiposIdentificacion).where(eq(tiposIdentificacion.id, id));
    return tipoIdentificacion;
  }

  async createTipoIdentificacion(tipoIdentificacion: InsertTipoIdentificacion): Promise<TipoIdentificacion> {
    const [nuevoTipoIdentificacion] = await db.insert(tiposIdentificacion).values(tipoIdentificacion).returning();
    return nuevoTipoIdentificacion;
  }

  async updateTipoIdentificacion(id: number, tipoIdentificacion: Partial<InsertTipoIdentificacion>): Promise<TipoIdentificacion | undefined> {
    const [tipoActualizado] = await db.update(tiposIdentificacion)
      .set(tipoIdentificacion)
      .where(eq(tiposIdentificacion.id, id))
      .returning();
    return tipoActualizado;
  }

  async deleteTipoIdentificacion(id: number): Promise<boolean> {
    try {
      await db.update(tiposIdentificacion)
        .set({ activo: "false" })
        .where(eq(tiposIdentificacion.id, id));
      return true;
    } catch (error) {
      console.error('Error al eliminar tipo de identificación:', error);
      return false;
    }
  }

  // UBICACIONES METHODS
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
  
  async createUbicacionForInmueble(insertUbicacion: InsertUbicacion, inmuebleId: number): Promise<Ubicacion> {
    const [ubicacion] = await db.insert(ubicaciones).values(insertUbicacion).returning();
    await db.insert(inmueblesUbicaciones).values({
      inmuebleId: inmuebleId,
      ubicacionId: ubicacion.id
    });
    return ubicacion;
  }

  // OBSERVACIONES METHODS
  async getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]> {
    return await db
      .select()
      .from(personasObservaciones)
      .where(eq(personasObservaciones.personaId, personaId))
      .orderBy(personasObservaciones.fecha);
  }

  async createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion> {
    const [nuevaObservacion] = await db
      .insert(personasObservaciones)
      .values(observacion)
      .returning();
    return nuevaObservacion;
  }

  async getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]> {
    return await db
      .select()
      .from(vehiculosObservaciones)
      .where(eq(vehiculosObservaciones.vehiculoId, vehiculoId))
      .orderBy(vehiculosObservaciones.fecha);
  }

  async createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion> {
    const [nuevaObservacion] = await db
      .insert(vehiculosObservaciones)
      .values(observacion)
      .returning();
    return nuevaObservacion;
  }

  async getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]> {
    return await db
      .select()
      .from(inmueblesObservaciones)
      .where(eq(inmueblesObservaciones.inmuebleId, inmuebleId))
      .orderBy(inmueblesObservaciones.fecha);
  }

  async createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion> {
    const [nuevaObservacion] = await db
      .insert(inmueblesObservaciones)
      .values(observacion)
      .returning();
    return nuevaObservacion;
  }
  
  async getUbicacionObservaciones(ubicacionId: number): Promise<UbicacionObservacion[]> {
    return await db
      .select()
      .from(ubicacionesObservaciones)
      .where(eq(ubicacionesObservaciones.ubicacionId, ubicacionId))
      .orderBy(ubicacionesObservaciones.fecha);
  }

  async createUbicacionObservacion(observacion: InsertUbicacionObservacion): Promise<UbicacionObservacion> {
    const [nuevaObservacion] = await db
      .insert(ubicacionesObservaciones)
      .values(observacion)
      .returning();
    return nuevaObservacion;
  }

  // BÚSQUEDA Y RELACIONES
  
  // Función para buscar entidades
  async buscar(query: string, tipos: string[]): Promise<any> {
    const searchPattern = `%${query}%`;
    const queryExacto = query.trim();
    const resultados: any = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: [],
      // Agregamos un nuevo campo para almacenar las ubicaciones relacionadas
      ubicacionesRelacionadas: []
    };
    
    // Set para evitar duplicados de ubicaciones
    const ubicacionesEncontradas = new Set<number>();
    
    try {
      console.log(`********** INICIO DE BÚSQUEDA ESTÁNDAR **********`);
      console.log(`Buscando con: "${query}", patrón: "${searchPattern}", tipos: ${tipos.join(', ')}`);
      
      // Buscar personas
      if (tipos.includes('personas')) {
        console.log(`Buscando personas con nombre/identificación que coincida con: ${queryExacto}`);
        
        const personasBasicas = await db
          .select()
          .from(personas)
          .where(
            or(
              sql`LOWER(${personas.nombre}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${personas.identificacion}) = LOWER(${query})`,
              sql`LOWER(${personas.identificacion}) LIKE LOWER(${searchPattern})`
            )
          );
        
        resultados.personas = [...personasBasicas];
        console.log(`Encontradas ${resultados.personas.length} personas`);
        
        // Para cada persona encontrada, buscar sus ubicaciones relacionadas
        for (const persona of personasBasicas) {
          console.log(`Buscando ubicaciones relacionadas para persona ID ${persona.id}`);
          
          // Incluir todas las ubicaciones relacionadas con coordenadas válidas
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${persona.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesPersona = ubicacionesResult.rows || [];
          console.log(`Encontradas ${ubicacionesPersona.length} ubicaciones para persona ID ${persona.id}`);
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesPersona) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultados.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'persona',
                  entidad: persona
                }
              });
            }
          }
        }
      }
      
      // Buscar vehículos
      if (tipos.includes('vehiculos')) {
        console.log(`Buscando vehículos con placa/marca/modelo que coincida con: ${queryExacto}`);
        
        const vehiculosBasicos = await db
          .select()
          .from(vehiculos)
          .where(
            or(
              sql`LOWER(${vehiculos.placa}) = LOWER(${query})`,
              sql`LOWER(${vehiculos.placa}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${vehiculos.marca}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${vehiculos.modelo}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${vehiculos.tipo}) LIKE LOWER(${searchPattern})`
            )
          );
        
        resultados.vehiculos = [...vehiculosBasicos];
        console.log(`Encontrados ${resultados.vehiculos.length} vehículos`);
        
        // Para cada vehículo, buscar sus ubicaciones relacionadas
        for (const vehiculo of vehiculosBasicos) {
          console.log(`Buscando ubicaciones relacionadas para vehículo ID ${vehiculo.id}`);
          
          // Consultar solo ubicaciones relacionadas que NO sean domicilios ni inmuebles
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                WHERE vu.vehiculo_id = ${vehiculo.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                AND NOT (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')
                AND NOT (u.tipo ILIKE '%inmueble%' OR u.tipo = 'Inmueble')`
          );
          
          const ubicacionesVehiculo = ubicacionesResult.rows || [];
          console.log(`Encontradas ${ubicacionesVehiculo.length} ubicaciones para vehículo ID ${vehiculo.id}`);
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesVehiculo) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultados.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'vehiculo',
                  entidad: vehiculo
                }
              });
            }
          }
        }
      }
      
      // Buscar inmuebles
      if (tipos.includes('inmuebles')) {
        console.log(`Buscando inmuebles con dirección/propietario que coincida con: ${queryExacto}`);
        
        const inmueblesBasicos = await db
          .select()
          .from(inmuebles)
          .where(
            or(
              sql`LOWER(${inmuebles.direccion}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${inmuebles.propietario}) LIKE LOWER(${searchPattern})`,
              sql`LOWER(${inmuebles.tipo}) LIKE LOWER(${searchPattern})`
            )
          );
        
        resultados.inmuebles = [...inmueblesBasicos];
        console.log(`Encontrados ${resultados.inmuebles.length} inmuebles`);
        
        // Para cada inmueble, buscar sus ubicaciones relacionadas
        for (const inmueble of inmueblesBasicos) {
          console.log(`Buscando ubicaciones relacionadas para inmueble ID ${inmueble.id}`);
          
          // Incluir todas las ubicaciones relacionadas con coordenadas válidas
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                WHERE iu.inmueble_id = ${inmueble.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesInmueble = ubicacionesResult.rows || [];
          console.log(`Encontradas ${ubicacionesInmueble.length} ubicaciones para inmueble ID ${inmueble.id}`);
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesInmueble) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultados.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'inmueble',
                  entidad: inmueble
                }
              });
            }
          }
        }
      }
      
      // Buscar ubicaciones
      if (tipos.includes('ubicaciones')) {
        console.log(`Buscando ubicaciones con tipo que coincida con: ${queryExacto}`);
        
        const ubicacionesBasicas = await db.select().from(ubicaciones).where(
          or(
            sql`LOWER(${ubicaciones.tipo}) LIKE LOWER(${searchPattern})`,
            sql`LOWER(${ubicaciones.observaciones}) LIKE LOWER(${searchPattern})`
          )
        );
        
        resultados.ubicaciones = [...ubicacionesBasicas];
        console.log(`Encontradas ${resultados.ubicaciones.length} ubicaciones directas`);
      }
      
      console.log(`********** FIN DE BÚSQUEDA ESTÁNDAR **********`);
      console.log(`Resultados totales: 
        - Personas: ${resultados.personas.length}
        - Vehículos: ${resultados.vehiculos.length}
        - Inmuebles: ${resultados.inmuebles.length}
        - Ubicaciones directas: ${resultados.ubicaciones.length}
        - Ubicaciones relacionadas: ${resultados.ubicacionesRelacionadas.length}`);
      
      return resultados;
    } catch (error) {
      console.error("Error en búsqueda:", error);
      throw error;
    }
  }
  
  // Crear relación entre entidades
  async crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
    try {
      // Normalizar tipos (convertir plural a singular para consistencia lógica)
      let tipo1Normalizado = tipo1.toLowerCase();
      let tipo2Normalizado = tipo2.toLowerCase();
      
      // Convertir a singular si está en plural
      if (tipo1Normalizado === "personas") tipo1Normalizado = "persona";
      if (tipo1Normalizado === "vehiculos") tipo1Normalizado = "vehiculo";
      if (tipo1Normalizado === "inmuebles") tipo1Normalizado = "inmueble";
      if (tipo1Normalizado === "ubicaciones") tipo1Normalizado = "ubicacion";
      
      if (tipo2Normalizado === "personas") tipo2Normalizado = "persona";
      if (tipo2Normalizado === "vehiculos") tipo2Normalizado = "vehiculo";
      if (tipo2Normalizado === "inmuebles") tipo2Normalizado = "inmueble";
      if (tipo2Normalizado === "ubicaciones") tipo2Normalizado = "ubicacion";
      
      console.log(`Creando relación normalizada: ${tipo1Normalizado}(${id1}) -> ${tipo2Normalizado}(${id2})`);
      
      // Persona-Vehículo
      if (tipo1Normalizado === 'persona' && tipo2Normalizado === 'vehiculo') {
        await db.insert(personasVehiculos).values({
          personaId: id1,
          vehiculoId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'vehiculo' && tipo2Normalizado === 'persona') {
        await db.insert(personasVehiculos).values({
          personaId: id2,
          vehiculoId: id1
        });
        return { success: true };
      }
      
      // Persona-Inmueble
      if (tipo1Normalizado === 'persona' && tipo2Normalizado === 'inmueble') {
        await db.insert(personasInmuebles).values({
          personaId: id1,
          inmuebleId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'inmueble' && tipo2Normalizado === 'persona') {
        await db.insert(personasInmuebles).values({
          personaId: id2,
          inmuebleId: id1
        });
        return { success: true };
      }
      
      // Persona-Ubicación
      if (tipo1Normalizado === 'persona' && tipo2Normalizado === 'ubicacion') {
        await db.insert(personasUbicaciones).values({
          personaId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'ubicacion' && tipo2Normalizado === 'persona') {
        await db.insert(personasUbicaciones).values({
          personaId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Vehículo-Inmueble
      if (tipo1Normalizado === 'vehiculo' && tipo2Normalizado === 'inmueble') {
        await db.insert(vehiculosInmuebles).values({
          vehiculoId: id1,
          inmuebleId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'inmueble' && tipo2Normalizado === 'vehiculo') {
        await db.insert(vehiculosInmuebles).values({
          vehiculoId: id2,
          inmuebleId: id1
        });
        return { success: true };
      }
      
      // Vehículo-Ubicación
      if (tipo1Normalizado === 'vehiculo' && tipo2Normalizado === 'ubicacion') {
        await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'ubicacion' && tipo2Normalizado === 'vehiculo') {
        await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Inmueble-Ubicación
      if (tipo1Normalizado === 'inmueble' && tipo2Normalizado === 'ubicacion') {
        await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1Normalizado === 'ubicacion' && tipo2Normalizado === 'inmueble') {
        await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Persona-Persona
      if (tipo1Normalizado === 'persona' && tipo2Normalizado === 'persona') {
        await db.insert(personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        });
        return { success: true };
      }
      
      // Vehículo-Vehículo
      if (tipo1Normalizado === 'vehiculo' && tipo2Normalizado === 'vehiculo') {
        await db.insert(vehiculosVehiculos).values({
          vehiculoId1: id1,
          vehiculoId2: id2
        });
        return { success: true };
      }
      
      // Inmueble-Inmueble
      if (tipo1Normalizado === 'inmueble' && tipo2Normalizado === 'inmueble') {
        await db.insert(inmueblesInmuebles).values({
          inmuebleId1: id1,
          inmuebleId2: id2
        });
        return { success: true };
      }
      
      return { error: 'Tipos no válidos para crear relación' };
    } catch (error) {
      console.error("Error al crear relación:", error);
      return { error: 'Error al crear relación', details: error };
    }
  }

  // Versión mejorada de búsqueda de ubicaciones con coordenadas
  async buscarUbicacionesConCoordenadas(query: string, tipos: string[]): Promise<any> {
    // Enfoque simplificado para solucionar el problema de búsqueda
    const searchPattern = `%${query}%`;
    const queryExacto = query.trim();
    const resultado: any = {
      ubicacionesDirectas: [],
      entidadesRelacionadas: [],
      ubicacionesRelacionadas: []
    };
    
    // Set para evitar duplicados de ubicaciones
    const ubicacionesEncontradas = new Set<number>();
    
    try {
      console.log(`********** INICIO DE BÚSQUEDA MEJORADA **********`);
      console.log(`Buscando con: "${query}", exacto: "${queryExacto}", patrón: "${searchPattern}", tipos: ${tipos.join(', ')}`);
      
      // Procesando cada tipo de entidad por separado
      // 1. BÚSQUEDA DE PERSONAS
      if (tipos.includes('persona') || tipos.includes('personas')) {
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
          console.log(`Ejecutando consulta SQL para personas con id=${idNumerico} O identificacion=${queryExacto} O nombre LIKE ${searchPattern}`);
          personasResult = await db.execute(
            sql`SELECT * FROM personas 
                WHERE id = ${idNumerico}
                OR identificacion = ${queryExacto}
                OR LOWER(nombre) LIKE LOWER(${searchPattern})`
          );
        } else {
          console.log(`Ejecutando consulta SQL para personas con identificacion=${queryExacto} O nombre LIKE ${searchPattern}`);
          personasResult = await db.execute(
            sql`SELECT * FROM personas 
                WHERE identificacion = ${queryExacto}
                OR LOWER(nombre) LIKE LOWER(${searchPattern})`
          );
        }
        
        const personas = personasResult.rows || [];
        console.log(`Personas encontradas: ${personas.length}`);
        
        // Para cada persona encontrada, buscar sus ubicaciones relacionadas
        for (const persona of personas) {
          console.log(`Buscando ubicaciones para persona ID: ${persona.id}, Nombre: ${persona.nombre}`);
          
          // Verificar directamente en la tabla de relaciones
          const relacionesResult = await db.execute(
            sql`SELECT * FROM personas_ubicaciones WHERE persona_id = ${persona.id}`
          );
          
          console.log(`[DEBUG] Relaciones en personas_ubicaciones para persona ID ${persona.id}:`, 
                      relacionesResult.rows ? relacionesResult.rows.length : 0);
          
          if (relacionesResult.rows && relacionesResult.rows.length > 0) {
            console.log(`[DEBUG] Primera relación:`, relacionesResult.rows[0]);
          }
          
          // Buscar ubicaciones relacionadas con esta persona mediante SQL directo
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${persona.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesPersona = ubicacionesResult.rows || [];
          console.log(`Ubicaciones encontradas para persona ID ${persona.id}: ${ubicacionesPersona.length}`);
          
          if (ubicacionesPersona.length > 0) {
            console.log(`[DEBUG] Primera ubicación encontrada:`, ubicacionesPersona[0]);
          }
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesPersona) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultado.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'persona',
                  entidad: persona
                }
              });
            }
          }
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Personas relacionadas a esta persona
          console.log(`Buscando personas relacionadas a la persona ID: ${persona.id}`);
          
          const personasRelacionadas1Result = await db.execute(
            sql`SELECT p.* FROM personas p
                JOIN personas_personas pp ON p.id = pp.persona_id_2
                WHERE pp.persona_id_1 = ${persona.id}`
          );
          
          const personasRelacionadas2Result = await db.execute(
            sql`SELECT p.* FROM personas p
                JOIN personas_personas pp ON p.id = pp.persona_id_1
                WHERE pp.persona_id_2 = ${persona.id}`
          );
          
          const personasRelacionadas = [
            ...(personasRelacionadas1Result.rows || []),
            ...(personasRelacionadas2Result.rows || [])
          ];
          
          console.log(`Personas relacionadas a la persona ID ${persona.id}: ${personasRelacionadas.length}`);
          
          // Para cada persona relacionada, buscar ubicaciones
          for (const personaRelacionada of personasRelacionadas) {
            console.log(`Buscando ubicaciones para persona relacionada ID: ${personaRelacionada.id}`);
            
            const ubicacionesPersonaRelaResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                  WHERE pu.persona_id = ${personaRelacionada.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesPersonaRela = ubicacionesPersonaRelaResult.rows || [];
            console.log(`Ubicaciones encontradas para persona relacionada ID ${personaRelacionada.id}: ${ubicacionesPersonaRela.length}`);
            
            // Agregar cada ubicación al resultado
            for (const ubicacion of ubicacionesPersonaRela) {
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
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Vehículos relacionados a esta persona
          console.log(`Buscando vehículos relacionados a la persona ID: ${persona.id}`);
          const vehiculosRelacionadosResult = await db.execute(
            sql`SELECT v.* FROM vehiculos v
                JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
                WHERE pv.persona_id = ${persona.id}`
          );
          
          const vehiculosRelacionados = vehiculosRelacionadosResult.rows || [];
          console.log(`Vehículos relacionados a la persona ID ${persona.id}: ${vehiculosRelacionados.length}`);
          
          // Para cada vehículo relacionado, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
            for (const ubicacion of ubicacionesVehiculo) {
              if (!ubicacionesEncontradas.has(ubicacion.id)) {
                ubicacionesEncontradas.add(ubicacion.id);
                resultado.ubicacionesRelacionadas.push({
                  ubicacion: ubicacion,
                  entidadRelacionada: {
                    tipo: 'vehiculo',
                    entidad: vehiculoRelacionado,
                    relacionadoCon: {
                      tipo: 'persona',
                      entidad: persona
                    }
                  }
                });
              }
            }
          }
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Inmuebles relacionados a esta persona
          console.log(`Buscando inmuebles relacionados a la persona ID: ${persona.id}`);
          const inmueblesRelacionadosResult = await db.execute(
            sql`SELECT i.* FROM inmuebles i
                JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
                WHERE pi.persona_id = ${persona.id}`
          );
          
          const inmueblesRelacionados = inmueblesRelacionadosResult.rows || [];
          console.log(`Inmuebles relacionados a la persona ID ${persona.id}: ${inmueblesRelacionados.length}`);
          
          // Para cada inmueble relacionado, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
            for (const ubicacion of ubicacionesInmueble) {
              if (!ubicacionesEncontradas.has(ubicacion.id)) {
                ubicacionesEncontradas.add(ubicacion.id);
                resultado.ubicacionesRelacionadas.push({
                  ubicacion: ubicacion,
                  entidadRelacionada: {
                    tipo: 'inmueble',
                    entidad: inmuebleRelacionado,
                    relacionadoCon: {
                      tipo: 'persona',
                      entidad: persona
                    }
                  }
                });
              }
            }
            
            // Si no hay ubicaciones específicas, pero el inmueble tiene coordenadas propias
            // lo agregamos directamente como ubicación
            if (ubicacionesInmueble.length === 0) {
              // Verificamos si el inmueble tiene coordenadas propias
              const inmuebleConCoordenadas = await db.execute(
                sql`SELECT * FROM inmuebles WHERE id = ${inmuebleRelacionado.id}
                    AND latitud IS NOT NULL AND longitud IS NOT NULL
                    AND latitud != 0 AND longitud != 0`
              );
              
              if (inmuebleConCoordenadas.rows && inmuebleConCoordenadas.rows.length > 0) {
                const inmuebleInfo = inmuebleConCoordenadas.rows[0];
                console.log(`El inmueble ID ${inmuebleRelacionado.id} tiene coordenadas propias: [${inmuebleInfo.latitud}, ${inmuebleInfo.longitud}]`);
                
                // Creamos una ubicación virtual a partir del inmueble
                const ubicacionVirtual = {
                  id: `inmueble-${inmuebleRelacionado.id}`,
                  latitud: inmuebleInfo.latitud,
                  longitud: inmuebleInfo.longitud,
                  tipo: inmuebleInfo.tipo || "Inmueble",
                  observaciones: `Inmueble relacionado con ${persona.nombre}: ${inmuebleInfo.direccion || "Sin dirección"}`
                };
                
                // Usamos una clave especial que no colisione con IDs numéricos
                const ubicacionKey = `virtual-inmueble-${inmuebleRelacionado.id}`;
                if (!ubicacionesEncontradas.has(ubicacionKey)) {
                  ubicacionesEncontradas.add(ubicacionKey);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacionVirtual,
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmuebleRelacionado,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: persona
                      }
                    }
                  });
                  console.log(`Agregada ubicación virtual para inmueble ID ${inmuebleRelacionado.id}`);
                }
              } else {
                // Si el inmueble tampoco tiene coordenadas propias, aun así queremos mostrarlo en los resultados
                // pero en este caso lo incluimos en un arreglo especial de entidades relacionadas sin ubicación
                console.log(`El inmueble ID ${inmuebleRelacionado.id} no tiene coordenadas propias ni ubicaciones relacionadas`);
                
                if (!resultado.entidadesRelacionadasSinUbicacion) {
                  resultado.entidadesRelacionadasSinUbicacion = [];
                }
                
                resultado.entidadesRelacionadasSinUbicacion.push({
                  tipo: 'inmueble',
                  entidad: inmuebleRelacionado,
                  relacionadoCon: {
                    tipo: 'persona',
                    entidad: persona
                  }
                });
              }
            }
            
            // Verificar si el inmueble tiene coordenadas propias
            if (inmuebleRelacionado.latitud && inmuebleRelacionado.longitud && 
                inmuebleRelacionado.latitud !== 0 && inmuebleRelacionado.longitud !== 0) {
              const ubicacionId = `inmueble-${inmuebleRelacionado.id}`; // ID único para evitar duplicados
              
              if (!ubicacionesEncontradas.has(ubicacionId)) {
                ubicacionesEncontradas.add(ubicacionId);
                
                const ubicacionInmueble = {
                  id: ubicacionId,
                  latitud: inmuebleRelacionado.latitud,
                  longitud: inmuebleRelacionado.longitud,
                  tipo: inmuebleRelacionado.tipo || "Inmueble",
                  observaciones: `Inmueble: ${inmuebleRelacionado.direccion || "Sin dirección"}`
                };
                
                resultado.ubicacionesRelacionadas.push({
                  ubicacion: ubicacionInmueble,
                  entidadRelacionada: {
                    tipo: 'inmueble',
                    entidad: inmuebleRelacionado,
                    relacionadoCon: {
                      tipo: 'persona',
                      entidad: persona
                    }
                  }
                });
                console.log(`Agregada ubicación virtual para inmueble ID ${inmuebleRelacionado.id} relacionado con persona ${persona.nombre}`);
              }
            }
            
            // NIVEL 3: Buscar vehículos relacionados con este inmueble
            console.log(`Buscando vehículos relacionados al inmueble ID: ${inmuebleRelacionado.id} (de la persona ID: ${persona.id})`);
            const vehiculosInmuebleResult = await db.execute(
              sql`SELECT v.* FROM vehiculos v
                  JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id
                  WHERE vi.inmueble_id = ${inmuebleRelacionado.id}`
            );
            
            const vehiculosInmueble = vehiculosInmuebleResult.rows || [];
            console.log(`Vehículos relacionados al inmueble ID ${inmuebleRelacionado.id}: ${vehiculosInmueble.length}`);
            
            // Para cada vehículo, obtener sus ubicaciones
            for (const vehiculoInmueble of vehiculosInmueble) {
              console.log(`Buscando ubicaciones para vehículo ${vehiculoInmueble.id} relacionado con inmueble ${inmuebleRelacionado.id}`);
              
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
                        entidad: inmuebleRelacionado,
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
      
      // 2. BÚSQUEDA DE VEHÍCULOS (Implementemos correctamente todas las búsquedas)
      if (tipos.includes('vehiculo') || tipos.includes('vehiculos')) {
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
          console.log(`Ejecutando consulta SQL para vehículos con id=${idNumerico} O placa=${queryExacto} O marca/modelo/tipo LIKE ${searchPattern}`);
          vehiculosResult = await db.execute(
            sql`SELECT * FROM vehiculos 
                WHERE id = ${idNumerico}
                OR placa = ${queryExacto}
                OR LOWER(marca) LIKE LOWER(${searchPattern})
                OR LOWER(modelo) LIKE LOWER(${searchPattern})
                OR LOWER(tipo) LIKE LOWER(${searchPattern})`
          );
        } else {
          console.log(`Ejecutando consulta SQL para vehículos con placa=${queryExacto} O marca/modelo/tipo LIKE ${searchPattern}`);
          vehiculosResult = await db.execute(
            sql`SELECT * FROM vehiculos 
                WHERE placa = ${queryExacto}
                OR LOWER(marca) LIKE LOWER(${searchPattern})
                OR LOWER(modelo) LIKE LOWER(${searchPattern})
                OR LOWER(tipo) LIKE LOWER(${searchPattern})`
          );
        }
        
        const vehiculos = vehiculosResult.rows || [];
        console.log(`Vehículos encontrados: ${vehiculos.length}`);
        
        // Para cada vehículo encontrado, buscar sus ubicaciones relacionadas
        for (const vehiculo of vehiculos) {
          console.log(`Buscando ubicaciones para vehículo ID: ${vehiculo.id}`);
          
          // Buscar ubicaciones relacionadas con este vehículo mediante SQL directo
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                WHERE vu.vehiculo_id = ${vehiculo.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesVehiculo = ubicacionesResult.rows || [];
          console.log(`Ubicaciones encontradas para vehículo ID ${vehiculo.id}: ${ubicacionesVehiculo.length}`);
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesVehiculo) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultado.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'vehiculo',
                  entidad: vehiculo
                }
              });
            }
          }
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Vehículos relacionados a este vehículo
          console.log(`Buscando vehículos relacionados al vehículo ID: ${vehiculo.id}`);
          
          // Buscar vehículos donde el vehículo actual es vehiculo_id_1
          const vehiculosRelacionados1Result = await db.execute(
            sql`SELECT v.* FROM vehiculos v
                JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_2
                WHERE vv.vehiculo_id_1 = ${vehiculo.id}`
          );
          
          // Buscar vehículos donde el vehículo actual es vehiculo_id_2
          const vehiculosRelacionados2Result = await db.execute(
            sql`SELECT v.* FROM vehiculos v
                JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_1
                WHERE vv.vehiculo_id_2 = ${vehiculo.id}`
          );
          
          const vehiculosRelacionados = [
            ...(vehiculosRelacionados1Result.rows || []),
            ...(vehiculosRelacionados2Result.rows || [])
          ];
          
          console.log(`Vehículos relacionados al vehículo ID ${vehiculo.id}: ${vehiculosRelacionados.length}`);
          
          // Para cada vehículo relacionado, buscar ubicaciones
          for (const vehiculoRelacionado of vehiculosRelacionados) {
            console.log(`Buscando ubicaciones para vehículo relacionado ID: ${vehiculoRelacionado.id}`);
            
            const ubicacionesVehiculoRelaResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                  WHERE vu.vehiculo_id = ${vehiculoRelacionado.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesVehiculoRela = ubicacionesVehiculoRelaResult.rows || [];
            console.log(`Ubicaciones encontradas para vehículo relacionado ID ${vehiculoRelacionado.id}: ${ubicacionesVehiculoRela.length}`);
            
            // Agregar cada ubicación al resultado
            for (const ubicacion of ubicacionesVehiculoRela) {
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
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Personas relacionadas a este vehículo
          console.log(`Buscando personas relacionadas al vehículo ID: ${vehiculo.id}`);
          const personasRelacionadasResult = await db.execute(
            sql`SELECT p.* FROM personas p
                JOIN personas_vehiculos pv ON p.id = pv.persona_id
                WHERE pv.vehiculo_id = ${vehiculo.id}`
          );
          
          const personasRelacionadas = personasRelacionadasResult.rows || [];
          console.log(`Personas relacionadas al vehículo ID ${vehiculo.id}: ${personasRelacionadas.length}`);
          
          // Para cada persona relacionada, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
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
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Inmuebles relacionados a este vehículo
          console.log(`Buscando inmuebles relacionados al vehículo ID: ${vehiculo.id}`);
          const inmueblesRelacionadosResult = await db.execute(
            sql`SELECT i.* FROM inmuebles i
                JOIN vehiculos_inmuebles vi ON i.id = vi.inmueble_id
                WHERE vi.vehiculo_id = ${vehiculo.id}`
          );
          
          const inmueblesRelacionados = inmueblesRelacionadosResult.rows || [];
          console.log(`Inmuebles relacionados al vehículo ID ${vehiculo.id}: ${inmueblesRelacionados.length}`);
          
          // Para cada inmueble relacionado, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
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
            
            // NIVEL 3: Buscar personas relacionadas con este inmueble que a su vez está relacionado con el vehículo
            console.log(`Buscando personas relacionadas al inmueble ID: ${inmuebleRelacionado.id} (del vehículo ID: ${vehiculo.id})`);
            const personasInmuebleResult = await db.execute(
              sql`SELECT p.* FROM personas p
                  JOIN personas_inmuebles pi ON p.id = pi.persona_id
                  WHERE pi.inmueble_id = ${inmuebleRelacionado.id}`
            );
            
            const personasInmueble = personasInmuebleResult.rows || [];
            console.log(`Personas relacionadas al inmueble ID ${inmuebleRelacionado.id}: ${personasInmueble.length}`);
            
            // Para cada persona relacionada, buscar ubicaciones
            for (const personaInmueble of personasInmueble) {
              console.log(`Buscando ubicaciones para persona ${personaInmueble.id} relacionada con inmueble ${inmuebleRelacionado.id}`);
              
              const ubicacionesPersonaResult = await db.execute(
                sql`SELECT u.* FROM ubicaciones u
                    JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                    WHERE pu.persona_id = ${personaInmueble.id}
                    AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
              );
              
              const ubicacionesPersona = ubicacionesPersonaResult.rows || [];
              console.log(`Ubicaciones encontradas para persona ${personaInmueble.id}: ${ubicacionesPersona.length}`);
              
              // Agregar cada ubicación al resultado con la cadena de relaciones
              for (const ubicacion of ubicacionesPersona) {
                if (!ubicacionesEncontradas.has(ubicacion.id)) {
                  ubicacionesEncontradas.add(ubicacion.id);
                  resultado.ubicacionesRelacionadas.push({
                    ubicacion: ubicacion,
                    entidadRelacionada: {
                      tipo: 'persona',
                      entidad: personaInmueble,
                      relacionadoCon: {
                        tipo: 'inmueble',
                        entidad: inmuebleRelacionado,
                        relacionadoCon: {
                          tipo: 'vehiculo',
                          entidad: vehiculo
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
      
      // 3. BÚSQUEDA DE INMUEBLES
      if (tipos.includes('inmueble') || tipos.includes('inmuebles')) {
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
          console.log(`Ejecutando consulta SQL para inmuebles con id=${idNumerico} O dirección/tipo/propietario LIKE ${searchPattern}`);
          inmueblesResult = await db.execute(
            sql`SELECT * FROM inmuebles 
                WHERE id = ${idNumerico}
                OR LOWER(direccion) LIKE LOWER(${searchPattern})
                OR LOWER(tipo) LIKE LOWER(${searchPattern})
                OR LOWER(propietario) LIKE LOWER(${searchPattern})`
          );
        } else {
          console.log(`Ejecutando consulta SQL para inmuebles con dirección/tipo/propietario LIKE ${searchPattern}`);
          inmueblesResult = await db.execute(
            sql`SELECT * FROM inmuebles 
                WHERE LOWER(direccion) LIKE LOWER(${searchPattern})
                OR LOWER(tipo) LIKE LOWER(${searchPattern})
                OR LOWER(propietario) LIKE LOWER(${searchPattern})`
          );
        }
        
        const inmuebles = inmueblesResult.rows || [];
        console.log(`Inmuebles encontrados: ${inmuebles.length}`);
        
        // Para cada inmueble encontrado, buscar sus ubicaciones relacionadas
        for (const inmueble of inmuebles) {
          console.log(`Buscando ubicaciones para inmueble ID: ${inmueble.id}`);
          
          // Buscar ubicaciones relacionadas con este inmueble mediante SQL directo
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                WHERE iu.inmueble_id = ${inmueble.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesInmueble = ubicacionesResult.rows || [];
          console.log(`Ubicaciones encontradas para inmueble ID ${inmueble.id}: ${ubicacionesInmueble.length}`);
          
          // Agregar cada ubicación al resultado
          for (const ubicacion of ubicacionesInmueble) {
            if (!ubicacionesEncontradas.has(ubicacion.id)) {
              ubicacionesEncontradas.add(ubicacion.id);
              resultado.ubicacionesRelacionadas.push({
                ubicacion: ubicacion,
                entidadRelacionada: {
                  tipo: 'inmueble',
                  entidad: inmueble
                }
              });
            }
          }
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Inmuebles relacionados a este inmueble
          console.log(`Buscando inmuebles relacionados al inmueble ID: ${inmueble.id}`);
          
          // Buscar inmuebles donde el inmueble actual es inmueble_id_1
          const inmueblesRelacionados1Result = await db.execute(
            sql`SELECT i.* FROM inmuebles i
                JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_2
                WHERE ii.inmueble_id_1 = ${inmueble.id}`
          );
          
          // Buscar inmuebles donde el inmueble actual es inmueble_id_2
          const inmueblesRelacionados2Result = await db.execute(
            sql`SELECT i.* FROM inmuebles i
                JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_1
                WHERE ii.inmueble_id_2 = ${inmueble.id}`
          );
          
          const inmueblesRelacionados = [
            ...(inmueblesRelacionados1Result.rows || []),
            ...(inmueblesRelacionados2Result.rows || [])
          ];
          
          console.log(`Inmuebles relacionados al inmueble ID ${inmueble.id}: ${inmueblesRelacionados.length}`);
          
          // Para cada inmueble relacionado, buscar ubicaciones
          for (const inmuebleRelacionado of inmueblesRelacionados) {
            console.log(`Buscando ubicaciones para inmueble relacionado ID: ${inmuebleRelacionado.id}`);
            
            const ubicacionesInmuebleRelaResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                  WHERE iu.inmueble_id = ${inmuebleRelacionado.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
            );
            
            const ubicacionesInmuebleRela = ubicacionesInmuebleRelaResult.rows || [];
            console.log(`Ubicaciones encontradas para inmueble relacionado ID ${inmuebleRelacionado.id}: ${ubicacionesInmuebleRela.length}`);
            
            // Agregar cada ubicación al resultado
            for (const ubicacion of ubicacionesInmuebleRela) {
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
        
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Personas relacionadas a este inmueble
          console.log(`Buscando personas relacionadas al inmueble ID: ${inmueble.id}`);
          
          // Agregar registro de debug para diagnóstico
          const sqlLogPersonasInmuebles = await db.execute(
            sql`SELECT * FROM personas_inmuebles WHERE inmueble_id = ${inmueble.id}`
          );
          console.log(`[DEBUG] Raw SQL check personas_inmuebles con inmueble_id=${inmueble.id}:`, sqlLogPersonasInmuebles.rows);
          
          const personasRelacionadasResult = await db.execute(
            sql`SELECT p.* FROM personas p
                JOIN personas_inmuebles pi ON p.id = pi.persona_id
                WHERE pi.inmueble_id = ${inmueble.id}`
          );
          
          const personasRelacionadas = personasRelacionadasResult.rows || [];
          console.log(`Personas relacionadas al inmueble ID ${inmueble.id}: ${personasRelacionadas.length}`);
          
          // Mostrar detalle de cada persona encontrada para diagnóstico
          if (personasRelacionadas.length > 0) {
            console.log(`[DEBUG] Detalle de personas relacionadas con inmueble ID ${inmueble.id}:`, 
                        personasRelacionadas.map(p => `ID: ${p.id}, Nombre: ${p.nombre}`));
          }
          
          // Para cada persona relacionada, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
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
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Vehículos relacionados a este inmueble
          console.log(`Buscando vehículos relacionados al inmueble ID: ${inmueble.id}`);
          const vehiculosRelacionadosResult = await db.execute(
            sql`SELECT v.* FROM vehiculos v
                JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id
                WHERE vi.inmueble_id = ${inmueble.id}`
          );
          
          const vehiculosRelacionados = vehiculosRelacionadosResult.rows || [];
          console.log(`Vehículos relacionados al inmueble ID ${inmueble.id}: ${vehiculosRelacionados.length}`);
          
          // Para cada vehículo relacionado, buscar ubicaciones
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
            
            // Agregar cada ubicación al resultado
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
      
      // 4. BÚSQUEDA DIRECTA DE UBICACIONES
      console.log(`Buscando ubicaciones con ID/tipo/descripción/observaciones: ${queryExacto}`);
      
      // Verificar si el término de búsqueda podría ser un ID numérico
      let idNumerico: number | null = null;
      if (!isNaN(parseInt(queryExacto))) {
        idNumerico = parseInt(queryExacto);
        console.log(`Detectado posible ID numérico para ubicación: ${idNumerico}`);
      }
      
      // Consulta SQL directa para ubicaciones
      let ubicacionesResult;
      if (idNumerico !== null) {
        console.log(`Ejecutando consulta SQL para ubicaciones con id=${idNumerico} O tipo/observaciones LIKE ${searchPattern}`);
        ubicacionesResult = await db.execute(
          sql`SELECT * FROM ubicaciones 
              WHERE (id = ${idNumerico}
              OR LOWER(tipo) LIKE LOWER(${searchPattern})
              OR (observaciones IS NOT NULL AND LOWER(observaciones) LIKE LOWER(${searchPattern})))
              AND latitud IS NOT NULL AND longitud IS NOT NULL`
        );
      } else {
        console.log(`Ejecutando consulta SQL para ubicaciones con tipo/observaciones LIKE ${searchPattern}`);
        ubicacionesResult = await db.execute(
          sql`SELECT * FROM ubicaciones 
              WHERE (LOWER(tipo) LIKE LOWER(${searchPattern})
              OR (observaciones IS NOT NULL AND LOWER(observaciones) LIKE LOWER(${searchPattern})))
              AND latitud IS NOT NULL AND longitud IS NOT NULL`
        );
      }
      
      const ubicacionesDirectas = ubicacionesResult.rows || [];
      console.log(`Ubicaciones directas encontradas: ${ubicacionesDirectas.length}`);
      
      // Agregar ubicaciones directas evitando duplicados
      for (const ubicacion of ubicacionesDirectas) {
        if (!ubicacionesEncontradas.has(ubicacion.id)) {
          ubicacionesEncontradas.add(ubicacion.id);
          resultado.ubicacionesDirectas.push(ubicacion);
        }
      }
      
      // Antes de terminar, busquemos relaciones adicionales para todas las ubicaciones directas
      console.log("Buscando relaciones para las ubicaciones directas encontradas...");
      
      // Creamos una copia de las ubicaciones directas para procesar las relaciones
      // Esto es necesario porque el arreglo original puede cambiar mientras iteramos
      const ubicacionesParaProcesar = [...resultado.ubicacionesDirectas];
      
      for (const ubicacion of ubicacionesParaProcesar) {
        // Buscar personas relacionadas con esta ubicación
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasUbicaciones)
          .innerJoin(personas, eq(personasUbicaciones.personaId, personas.id))
          .where(eq(personasUbicaciones.ubicacionId, ubicacion.id));
          
        for (const { persona } of personasRelacionadas) {
          resultado.ubicacionesRelacionadas.push({
            ubicacion: ubicacion,
            entidadRelacionada: {
              tipo: 'persona',
              entidad: persona
            }
          });
        }
        
        // Buscar vehículos relacionados con esta ubicación
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosUbicaciones)
          .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
          .where(eq(vehiculosUbicaciones.ubicacionId, ubicacion.id));
          
        for (const { vehiculo } of vehiculosRelacionados) {
          resultado.ubicacionesRelacionadas.push({
            ubicacion: ubicacion,
            entidadRelacionada: {
              tipo: 'vehiculo',
              entidad: vehiculo
            }
          });
        }
        
        // Buscar inmuebles relacionados con esta ubicación
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesUbicaciones)
          .innerJoin(inmuebles, eq(inmueblesUbicaciones.inmuebleId, inmuebles.id))
          .where(eq(inmueblesUbicaciones.ubicacionId, ubicacion.id));
          
        for (const { inmueble } of inmueblesRelacionados) {
          resultado.ubicacionesRelacionadas.push({
            ubicacion: ubicacion,
            entidadRelacionada: {
              tipo: 'inmueble',
              entidad: inmueble
            }
          });
        }
        
        // Buscar ubicaciones relacionadas con esta ubicación (relaciones del mismo tipo)
        // Buscar ubicaciones donde la ubicación actual es ubicacion_id_1
        const ubicacionesRelacionadas1Result = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id_2
              WHERE uu.ubicacion_id_1 = ${ubicacion.id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
        );
        
        // Buscar ubicaciones donde la ubicación actual es ubicacion_id_2
        const ubicacionesRelacionadas2Result = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN ubicaciones_ubicaciones uu ON u.id = uu.ubicacion_id_1
              WHERE uu.ubicacion_id_2 = ${ubicacion.id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
        );
        
        const ubicacionesRelacionadas = [
          ...(ubicacionesRelacionadas1Result.rows || []),
          ...(ubicacionesRelacionadas2Result.rows || [])
        ];
        
        console.log(`Ubicaciones relacionadas a la ubicación ID ${ubicacion.id}: ${ubicacionesRelacionadas.length}`);
        
        // Para cada ubicación relacionada, agregarla al resultado
        for (const ubicacionRelacionada of ubicacionesRelacionadas) {
          // Convertir el ID a número para comparación consistente
          const relacionadaId = Number(ubicacionRelacionada.id);
          console.log(`Procesando ubicación relacionada ID: ${relacionadaId}, ya en conjunto: ${ubicacionesEncontradas.has(relacionadaId)}`);
          
          // Solo agregar si no está ya en el conjunto
          if (!ubicacionesEncontradas.has(relacionadaId)) {
            ubicacionesEncontradas.add(relacionadaId);
            
            // Agregar a las ubicaciones relacionadas en el resultado
            resultado.ubicacionesRelacionadas.push({
              ubicacion: ubicacionRelacionada,
              entidadRelacionada: {
                tipo: 'ubicacion',
                entidad: ubicacionRelacionada,
                relacionadoCon: {
                  tipo: 'ubicacion',
                  entidad: ubicacion
                }
              }
            });
            
            console.log(`Agregada ubicación relacionada ID: ${relacionadaId} al resultado`);
          }
        }
      }
      
      // Terminamos aquí y retornamos los resultados
      console.log(`Total de ubicaciones encontradas: ${resultado.ubicacionesDirectas.length + resultado.ubicacionesRelacionadas.length}`);
      console.log(`DEBUG - Resultado final (resumido):`, JSON.stringify({
        totalUbicacionesDirectas: resultado.ubicacionesDirectas.length,
        totalUbicacionesRelacionadas: resultado.ubicacionesRelacionadas.length
      }));
      return resultado;
    } catch (error) {
      console.error("Error en la búsqueda de ubicaciones:", error);
      throw error;
    }
  }

  // Obtener relaciones de una entidad
  async getRelaciones(tipo: string, id: number): Promise<any> {
    console.log(`[DEBUG] INICIO getRelaciones - tipo: "${tipo}", id: ${id}`);
    
    const resultado: any = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
    
    try {
      // Validar tipo
      if (!['personas', 'vehiculos', 'inmuebles', 'ubicaciones'].includes(tipo)) {
        console.error(`[ERROR] Tipo inválido: "${tipo}"`);
        throw new Error(`Tipo inválido: ${tipo}`);
      }
      
      // Relaciones persona
      if (tipo === 'personas') {
        console.log(`[DEBUG] Buscando relaciones para persona con ID ${id}`);
        
        try {
          // Verificar si la persona existe
          const personaExiste = await db
            .select({ count: sql`count(*)` })
            .from(personas)
            .where(eq(personas.id, id));
          
          console.log(`[DEBUG] Verificación de existencia de persona ID ${id}:`, personaExiste[0]);
          
          // Buscar otras personas relacionadas CON tipos de identificación
          const personasRelacionadas1Result = await db.execute(
            sql`SELECT p.*, ti.nombre as tipo_identificacion 
                FROM personas_personas pp
                JOIN personas p ON pp.persona_id2 = p.id
                LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
                WHERE pp.persona_id1 = ${id}`
          );
          
          const personasRelacionadas2Result = await db.execute(
            sql`SELECT p.*, ti.nombre as tipo_identificacion 
                FROM personas_personas pp
                JOIN personas p ON pp.persona_id1 = p.id
                LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
                WHERE pp.persona_id2 = ${id}`
          );
          
          // Procesar los resultados para incluir el tipo de identificación
          const personasRelacionadas1 = personasRelacionadas1Result.rows || [];
          const personasRelacionadas2 = personasRelacionadas2Result.rows || [];
          
          console.log(`[DEBUG] Personas relacionadas: 
            - Dirección 1->2: ${personasRelacionadas1.length}
            - Dirección 2->1: ${personasRelacionadas2.length}`);
          
          // Obtener las personas relacionadas con tipo de identificación
          const personasRelacionadasArray = [
            ...personasRelacionadas1.map(row => ({
              id: row.id,
              nombre: row.nombre,
              identificacion: row.identificacion,
              alias: row.alias || [],
              telefonos: row.telefonos || [],
              domicilios: row.domicilios || [],
              foto: row.foto,
              posicionEstructura: row.posicion_estructura,
              tipoIdentificacionId: row.tipo_identificacion_id,
              tipoIdentificacion: row.tipo_identificacion
            })),
            ...personasRelacionadas2.map(row => ({
              id: row.id,
              nombre: row.nombre,
              identificacion: row.identificacion,
              alias: row.alias || [],
              telefonos: row.telefonos || [],
              domicilios: row.domicilios || [],
              foto: row.foto,
              posicionEstructura: row.posicion_estructura,
              tipoIdentificacionId: row.tipo_identificacion_id,
              tipoIdentificacion: row.tipo_identificacion
            }))
          ];
          
          resultado.personas = personasRelacionadasArray;
          
          // Para cada persona relacionada, buscar sus domicilios (ubicaciones)
          console.log(`[DEBUG] Buscando domicilios de las personas relacionadas (${personasRelacionadasArray.length})`);
          
          for (const personaRelacionada of personasRelacionadasArray) {
            console.log(`[DEBUG] Buscando domicilios para persona relacionada ID: ${personaRelacionada.id}`);
            
            // Buscar ubicaciones relacionadas con esta persona mediante SQL directo
            const domiciliosResult = await db.execute(
              sql`SELECT u.* FROM ubicaciones u
                  JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                  WHERE pu.persona_id = ${personaRelacionada.id}
                  AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                  AND (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')`
            );
            
            const domicilios = domiciliosResult.rows || [];
            console.log(`[DEBUG] Domicilios encontrados para persona relacionada ID ${personaRelacionada.id}: ${domicilios.length}`);
            
            // Agregar cada domicilio a las ubicaciones del resultado
            for (const domicilio of domicilios) {
              // Verificar si ya existe en el resultado
              const yaExiste = resultado.ubicaciones.some((u: any) => u.id === domicilio.id);
              
              if (!yaExiste) {
                // Marcar esta ubicación como un domicilio de una persona relacionada
                domicilio.esDomicilioPersonaRelacionada = true;
                domicilio.personaRelacionadaId = personaRelacionada.id;
                domicilio.personaRelacionadaNombre = personaRelacionada.nombre;
                
                resultado.ubicaciones.push(domicilio);
              }
            }
          }
          
          // Buscar vehículos relacionados
          // Consulta SQL directa para debug
          const sqlLog = await db.execute(sql`
            SELECT * FROM personas_vehiculos WHERE persona_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check personas_vehiculos:`, sqlLog.rows);
          
          const vehiculosRelacionados = await db
            .select({
              vehiculo: vehiculos
            })
            .from(personasVehiculos)
            .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
            .where(eq(personasVehiculos.personaId, id));
          
          console.log(`[DEBUG] Vehículos relacionados: ${vehiculosRelacionados.length}`);
          
          resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
          
          // Buscar inmuebles relacionados
          const inmueblesRelacionados = await db
            .select({
              inmueble: inmuebles
            })
            .from(personasInmuebles)
            .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
            .where(eq(personasInmuebles.personaId, id));
          
          console.log(`[DEBUG] Inmuebles relacionados: ${inmueblesRelacionados.length}`);
          
          resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
          
          // Buscar ubicaciones relacionadas - IMPORTANTE: Separar domicilios de otro tipo de ubicaciones
          // 1. Obtener solo los domicilios (ubicaciones directas)
          const domiciliosResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                AND (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')`
          );
          
          const domicilios = domiciliosResult.rows || [];
          console.log(`[DEBUG] Domicilios directos encontrados: ${domicilios.length}`);
          
          // 2. Obtener otras ubicaciones (que no son domicilios, como avistamientos)
          const otrasUbicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                AND NOT (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')`
          );
          
          const otrasUbicaciones = otrasUbicacionesResult.rows || [];
          console.log(`[DEBUG] Otras ubicaciones encontradas (avistamientos, etc.): ${otrasUbicaciones.length}`);
          
          // Solo los domicilios son ubicaciones directas de personas
          resultado.ubicaciones = domicilios;
          
          // Si hay otras ubicaciones (como avistamientos), agregarlas como una propiedad separada
          resultado.otrasUbicaciones = otrasUbicaciones;
          
        } catch (err) {
          console.error(`[ERROR] Error al buscar relaciones para persona ${id}:`, err);
        }
      } 
      
      // Relaciones vehículo
      else if (tipo === 'vehiculo') {
        console.log(`[DEBUG] Buscando relaciones para vehículo con ID ${id}`);
        
        try {
          // Verificar si el vehículo existe
          const vehiculoExiste = await db
            .select({ count: sql`count(*)` })
            .from(vehiculos)
            .where(eq(vehiculos.id, id));
          
          console.log(`[DEBUG] Verificación de existencia de vehículo ID ${id}:`, vehiculoExiste[0]);
          
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
          
          console.log(`[DEBUG] Vehículos relacionados: 
            - Dirección 1->2: ${vehiculosRelacionados1.length}
            - Dirección 2->1: ${vehiculosRelacionados2.length}`);
          
          resultado.vehiculos = [
            ...vehiculosRelacionados1.map(r => r.vehiculo),
            ...vehiculosRelacionados2.map(r => r.vehiculo)
          ];
          
          // Buscar personas relacionadas CON tipos de identificación
          const personasVehiculoResult = await db.execute(
            sql`SELECT p.*, ti.nombre as tipo_identificacion 
                FROM personas_vehiculos pv
                JOIN personas p ON pv.persona_id = p.id
                LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
                WHERE pv.vehiculo_id = ${id}`
          );
          
          const personasVehiculoArray = (personasVehiculoResult.rows || []).map(row => ({
            id: row.id,
            nombre: row.nombre,
            identificacion: row.identificacion,
            alias: row.alias || [],
            telefonos: row.telefonos || [],
            domicilios: row.domicilios || [],
            foto: row.foto,
            posicionEstructura: row.posicion_estructura,
            tipoIdentificacionId: row.tipo_identificacion_id,
            tipoIdentificacion: row.tipo_identificacion
          }));
          
          console.log(`[DEBUG] Personas relacionadas: ${personasVehiculoArray.length}`);
          
          resultado.personas = personasVehiculoArray;
          
          // Buscar inmuebles relacionados
          const inmueblesRelacionados = await db
            .select({
              inmueble: inmuebles
            })
            .from(vehiculosInmuebles)
            .innerJoin(inmuebles, eq(vehiculosInmuebles.inmuebleId, inmuebles.id))
            .where(eq(vehiculosInmuebles.vehiculoId, id));
          
          console.log(`[DEBUG] Inmuebles relacionados: ${inmueblesRelacionados.length}`);
          
          resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
          
          // Buscar ubicaciones relacionadas
          const ubicacionesRelacionadas = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(vehiculosUbicaciones)
            .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
            .where(eq(vehiculosUbicaciones.vehiculoId, id));
          
          console.log(`[DEBUG] Ubicaciones relacionadas: ${ubicacionesRelacionadas.length}`);
          
          resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
          
        } catch (err) {
          console.error(`[ERROR] Error al buscar relaciones para vehículo ${id}:`, err);
        }
      } 
      
      // Relaciones inmueble
      else if (tipo === 'inmuebles') {
        console.log(`[DEBUG] Buscando relaciones para inmueble con ID ${id}`);
        
        try {
          // Verificar si el inmueble existe
          const inmuebleExiste = await db
            .select({ count: sql`count(*)` })
            .from(inmuebles)
            .where(eq(inmuebles.id, id));
          
          console.log(`[DEBUG] Verificación de existencia de inmueble ID ${id}:`, inmuebleExiste[0]);
          
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
          
          console.log(`[DEBUG] Inmuebles relacionados: 
            - Dirección 1->2: ${inmueblesRelacionados1.length}
            - Dirección 2->1: ${inmueblesRelacionados2.length}`);
          
          resultado.inmuebles = [
            ...inmueblesRelacionados1.map(r => r.inmueble),
            ...inmueblesRelacionados2.map(r => r.inmueble)
          ];
          
          // Buscar personas relacionadas CON tipos de identificación
          const personasInmuebleResult = await db.execute(
            sql`SELECT p.*, ti.nombre as tipo_identificacion 
                FROM personas_inmuebles pi
                JOIN personas p ON pi.persona_id = p.id
                LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
                WHERE pi.inmueble_id = ${id}`
          );
          
          const personasInmuebleArray = (personasInmuebleResult.rows || []).map(row => ({
            id: row.id,
            nombre: row.nombre,
            identificacion: row.identificacion,
            alias: row.alias || [],
            telefonos: row.telefonos || [],
            domicilios: row.domicilios || [],
            foto: row.foto,
            posicionEstructura: row.posicion_estructura,
            tipoIdentificacionId: row.tipo_identificacion_id,
            tipoIdentificacion: row.tipo_identificacion
          }));
          
          console.log(`[DEBUG] Personas relacionadas: ${personasInmuebleArray.length}`);
          
          resultado.personas = personasInmuebleArray;
          
          // Buscar vehículos relacionados
          const vehiculosRelacionados = await db
            .select({
              vehiculo: vehiculos
            })
            .from(vehiculosInmuebles)
            .innerJoin(vehiculos, eq(vehiculosInmuebles.vehiculoId, vehiculos.id))
            .where(eq(vehiculosInmuebles.inmuebleId, id));
          
          console.log(`[DEBUG] Vehículos relacionados: ${vehiculosRelacionados.length}`);
          
          resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
          
          // Buscar ubicaciones relacionadas
          const ubicacionesRelacionadas = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(inmueblesUbicaciones)
            .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
            .where(eq(inmueblesUbicaciones.inmuebleId, id));
          
          console.log(`[DEBUG] Ubicaciones relacionadas: ${ubicacionesRelacionadas.length}`);
          
          resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
          
        } catch (err) {
          console.error(`[ERROR] Error al buscar relaciones para inmueble ${id}:`, err);
        }
      } 
      
      // Relaciones ubicación
      else if (tipo === 'ubicaciones') {
        console.log(`[DEBUG] Buscando relaciones para ubicacion con ID ${id}`);
        
        try {
          // Verificar si la ubicación existe
          const ubicacionExiste = await db
            .select({ count: sql`count(*)` })
            .from(ubicaciones)
            .where(eq(ubicaciones.id, id));
          
          console.log(`[DEBUG] Verificación de existencia de ubicación ID ${id}:`, ubicacionExiste[0]);
          
          // Buscar personas relacionadas
          // Consulta SQL directa para debug
          const sqlLogPersonas = await db.execute(sql`
            SELECT * FROM personas_ubicaciones WHERE ubicacion_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check personas_ubicaciones:`, sqlLogPersonas.rows);
          
          const personasRelacionadas = await db
            .select({
              persona: personas
            })
            .from(personasUbicaciones)
            .innerJoin(personas, eq(personasUbicaciones.personaId, personas.id))
            .where(eq(personasUbicaciones.ubicacionId, id));
          
          console.log(`[DEBUG] Personas relacionadas: ${personasRelacionadas.length}`);
          
          resultado.personas = personasRelacionadas.map(r => r.persona);
          
          // Buscar vehículos relacionados
          const sqlLogVehiculos = await db.execute(sql`
            SELECT * FROM vehiculos_ubicaciones WHERE ubicacion_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check vehiculos_ubicaciones:`, sqlLogVehiculos.rows);
          
          const vehiculosRelacionados = await db
            .select({
              vehiculo: vehiculos
            })
            .from(vehiculosUbicaciones)
            .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
            .where(eq(vehiculosUbicaciones.ubicacionId, id));
          
          console.log(`[DEBUG] Vehículos relacionados: ${vehiculosRelacionados.length}`);
          
          resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
          
          // Buscar inmuebles relacionados
          const sqlLogInmuebles = await db.execute(sql`
            SELECT * FROM inmuebles_ubicaciones WHERE ubicacion_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check inmuebles_ubicaciones:`, sqlLogInmuebles.rows);
          
          const inmueblesRelacionados = await db
            .select({
              inmueble: inmuebles
            })
            .from(inmueblesUbicaciones)
            .innerJoin(inmuebles, eq(inmueblesUbicaciones.inmuebleId, inmuebles.id))
            .where(eq(inmueblesUbicaciones.ubicacionId, id));
          
          console.log(`[DEBUG] Inmuebles relacionados: ${inmueblesRelacionados.length}`);
          
          resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
          
        } catch (err) {
          console.error(`[ERROR] Error al buscar relaciones para ubicación ${id}:`, err);
        }
      }
      
      console.log(`[DEBUG] FIN getRelaciones - tipo: "${tipo}", id: ${id} - Resultados:`, {
        cantidadPersonas: resultado.personas.length,
        cantidadVehiculos: resultado.vehiculos.length,
        cantidadInmuebles: resultado.inmuebles.length,
        cantidadUbicaciones: resultado.ubicaciones.length
      });
      
      return resultado;
    } catch (error) {
      console.error(`[ERROR] Error general al obtener relaciones para ${tipo} con ID ${id}:`, error);
      // No lanzamos el error, devolvemos un objeto vacío para evitar que se rompa la UI
      return {
        personas: [],
        vehiculos: [],
        inmuebles: [],
        ubicaciones: []
      };
    }
  }

  // CÉLULAS METHODS
  async getAllCelulas(): Promise<Celula[]> {
    return await db.select().from(celulas).orderBy(celulas.nombreCelula);
  }

  async getCelula(id: number): Promise<Celula | undefined> {
    const [celula] = await db.select().from(celulas).where(eq(celulas.id, id));
    return celula;
  }

  async createCelula(insertCelula: InsertCelula): Promise<Celula> {
    const [celula] = await db
      .insert(celulas)
      .values({
        ...insertCelula,
        fechaCreacion: new Date(),
        fechaModificacion: new Date()
      })
      .returning();
    return celula;
  }

  async updateCelula(id: number, updateData: Partial<InsertCelula>): Promise<Celula | undefined> {
    const [celula] = await db
      .update(celulas)
      .set({
        ...updateData,
        fechaModificacion: new Date()
      })
      .where(eq(celulas.id, id))
      .returning();
    return celula;
  }

  async deleteCelula(id: number): Promise<boolean> {
    try {
      console.log(`Iniciando eliminación de célula ID: ${id}`);
      
      // Verificar cuántas relaciones existen antes de eliminar
      const relacionesExistentes = await db
        .select()
        .from(celulasPersonas)
        .where(eq(celulasPersonas.celulaId, id));
      
      console.log(`Encontradas ${relacionesExistentes.length} relaciones persona-célula para eliminar`);
      
      // Primero eliminar las relaciones con personas
      const deleteRelationsResult = await db
        .delete(celulasPersonas)
        .where(eq(celulasPersonas.celulaId, id));
      
      console.log(`Relaciones eliminadas: ${deleteRelationsResult.rowCount}`);
      
      // Luego eliminar la célula
      const result = await db.delete(celulas).where(eq(celulas.id, id));
      
      if (result.rowCount > 0) {
        console.log(`Célula ID ${id} eliminada exitosamente con todas sus relaciones`);
        return true;
      } else {
        console.log(`No se encontró célula con ID ${id} para eliminar`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting celula:', error);
      return false;
    }
  }

  async getCelulaWithPersonas(id: number): Promise<any> {
    try {
      // Obtener la célula
      const celula = await this.getCelula(id);
      if (!celula) return null;

      // Obtener niveles de célula
      const niveles = await db.select().from(nivelesCelula).orderBy(nivelesCelula.nivel);

      // Obtener personas relacionadas con posición de estructura
      const personasResult = await db.execute(
        sql`SELECT p.*, pe.nombre as posicion_estructura_nombre, ti.tipo as tipo_identificacion_nombre
            FROM personas p
            JOIN celulas_personas cp ON p.id = cp.persona_id
            LEFT JOIN posiciones_estructura pe ON p.posicion_estructura = pe.nombre
            LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
            WHERE cp.celula_id = ${id}`
      );

      const personas = personasResult.rows || [];

      // Organizar personas por nivel según su posición
      const organigrama: { [key: number]: any[] } = {};
      
      for (const nivel of niveles) {
        organigrama[nivel.nivel] = personas.filter(p => 
          nivel.posiciones.includes(p.posicion_estructura || '')
        );
      }

      return {
        celula,
        organigrama,
        niveles,
        personas
      };
    } catch (error) {
      console.error('Error getting celula with personas:', error);
      return null;
    }
  }

  async addPersonaToCelula(celulaId: number, personaId: number): Promise<CelulaPersona> {
    const [relacion] = await db
      .insert(celulasPersonas)
      .values({ celulaId, personaId })
      .returning();
    return relacion;
  }

  async removePersonaFromCelula(celulaId: number, personaId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(celulasPersonas)
        .where(and(
          eq(celulasPersonas.celulaId, celulaId),
          eq(celulasPersonas.personaId, personaId)
        ));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error removing persona from celula:', error);
      return false;
    }
  }

  async getPersonasCelula(celulaId: number): Promise<any[]> {
    const result = await db.execute(
      sql`SELECT p.*, pe.nombre as posicion_estructura_nombre, ti.tipo as tipo_identificacion_nombre
          FROM personas p
          JOIN celulas_personas cp ON p.id = cp.persona_id
          LEFT JOIN posiciones_estructura pe ON p.posicion_estructura = pe.nombre
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE cp.celula_id = ${celulaId}
          ORDER BY p.nombre`
    );
    return result.rows || [];
  }

  // NIVELES CÉLULA METHODS
  async getAllNivelesCelula(): Promise<NivelCelula[]> {
    return await db.select().from(nivelesCelula).orderBy(nivelesCelula.nivel);
  }

  async getNivelCelula(id: number): Promise<NivelCelula | undefined> {
    const [nivel] = await db.select().from(nivelesCelula).where(eq(nivelesCelula.id, id));
    return nivel;
  }

  async updateNivelCelula(id: number, posiciones: string[]): Promise<NivelCelula | undefined> {
    // 1. Obtener todas las posiciones válidas de la tabla posiciones_estructura
    const posicionesValidas = await db.select().from(posicionesEstructura);
    const nombresValidos = new Set(posicionesValidas.map(p => p.nombre));
    
    // 2. Filtrar SOLO las posiciones que existen actualmente en la tabla
    const posicionesFiltradas = posiciones.filter(posicion => nombresValidos.has(posicion));
    
    // 3. Log para debugging y transparencia
    const posicionesRechazadas = posiciones.filter(p => !nombresValidos.has(p));
    if (posicionesRechazadas.length > 0) {
      console.warn(`Posiciones rechazadas para nivel ${id} (no existen en posiciones_estructura):`, posicionesRechazadas);
    }
    console.log(`Actualizando nivel ${id} con posiciones válidas:`, posicionesFiltradas);
    
    // 4. REEMPLAZAR COMPLETAMENTE el array de posiciones (borrar previos, insertar nuevos)
    const [nivel] = await db
      .update(nivelesCelula)
      .set({ posiciones: posicionesFiltradas }) // Esto reemplaza el array completo
      .where(eq(nivelesCelula.id, id))
      .returning();
    
    // 5. Verificación adicional post-actualización
    if (nivel) {
      console.log(`Nivel ${id} actualizado. Posiciones finales:`, nivel.posiciones);
    }
    
    return nivel;
  }

  // Función de mantenimiento para limpiar referencias inválidas
  async cleanupInvalidPosicionesInNiveles(): Promise<void> {
    console.log('Iniciando limpieza de posiciones inválidas en niveles_celula...');
    
    // Obtener todas las posiciones válidas actuales
    const posicionesValidas = await db.select().from(posicionesEstructura);
    const nombresValidos = new Set(posicionesValidas.map(p => p.nombre));
    
    // Obtener todos los niveles
    const niveles = await db.select().from(nivelesCelula);
    
    for (const nivel of niveles) {
      // Filtrar posiciones válidas para este nivel
      const posicionesLimpias = nivel.posiciones.filter(posicion => nombresValidos.has(posicion));
      
      // Si hay diferencias, actualizar
      if (posicionesLimpias.length !== nivel.posiciones.length) {
        const posicionesInvalidas = nivel.posiciones.filter(p => !nombresValidos.has(p));
        console.log(`Limpiando nivel ${nivel.id}: removiendo posiciones inválidas:`, posicionesInvalidas);
        
        await db
          .update(nivelesCelula)
          .set({ posiciones: posicionesLimpias })
          .where(eq(nivelesCelula.id, nivel.id));
      }
    }
    
    console.log('Limpieza de posiciones inválidas completada.');
  }
}

export const storage = new DatabaseStorage();