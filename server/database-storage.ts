import { 
  User, personas, vehiculos, inmuebles, ubicaciones, InsertUser, 
  InsertPersona, Persona, InsertVehiculo, Vehiculo, InsertInmueble, Inmueble,
  InsertUbicacion, Ubicacion, personasObservaciones, InsertPersonaObservacion, PersonaObservacion,
  vehiculosObservaciones, InsertVehiculoObservacion, VehiculoObservacion,
  inmueblesObservaciones, InsertInmuebleObservacion, InmuebleObservacion,
  personasVehiculos, personasInmuebles, personasUbicaciones, vehiculosInmuebles,
  vehiculosUbicaciones, inmueblesUbicaciones, personasPersonas, vehiculosVehiculos,
  inmueblesInmuebles, users, tiposInmuebles, TipoInmueble, InsertTipoInmueble,
  tiposUbicaciones, TipoUbicacion, InsertTipoUbicacion
} from '@shared/schema';
import { sql, eq, and, or, like } from 'drizzle-orm';
import { db } from './db';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

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

  // PERSONAS METHODS
  async getAllPersonas(): Promise<Persona[]> {
    return await db.select().from(personas);
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    // Fix para arrays
    const datosPersona = { 
      ...insertPersona,
      alias: insertPersona.alias || [],
      telefonos: insertPersona.telefonos || [], 
      domicilios: insertPersona.domicilios || []
    };
    
    const [persona] = await db.insert(personas).values(datosPersona).returning();
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

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
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
      // Comprobamos si hay inmuebles usando este tipo
      const relatedInmuebles = await db.select().from(inmuebles).where(eq(inmuebles.tipo, String(id)));
      
      if (relatedInmuebles.length > 0) {
        // Si hay inmuebles usando este tipo, no eliminar físicamente, solo marcar como inactivo
        await db.update(tiposInmuebles)
          .set({ activo: false })
          .where(eq(tiposInmuebles.id, id));
      } else {
        // Si no hay inmuebles usando este tipo, podemos eliminarlo físicamente
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
      // Comprobamos si hay ubicaciones usando este tipo
      const relatedUbicaciones = await db.select().from(ubicaciones).where(eq(ubicaciones.tipo, String(id)));
      
      if (relatedUbicaciones.length > 0) {
        // Si hay ubicaciones usando este tipo, no eliminar físicamente, solo marcar como inactivo
        await db.update(tiposUbicaciones)
          .set({ activo: false })
          .where(eq(tiposUbicaciones.id, id));
      } else {
        // Si no hay ubicaciones usando este tipo, podemos eliminarlo físicamente
        await db.delete(tiposUbicaciones).where(eq(tiposUbicaciones.id, id));
      }
      return true;
    } catch (error) {
      console.error('Error al eliminar tipo de ubicacion:', error);
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
          
          // Consultar directamente las ubicaciones relacionadas con SQL
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
          
          // Consultar directamente las ubicaciones relacionadas con SQL
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                WHERE vu.vehiculo_id = ${vehiculo.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
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
          
          // Consultar directamente las ubicaciones relacionadas con SQL
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
          
          // BÚSQUEDA DE RELACIONES DE SEGUNDO GRADO - Personas relacionadas a este inmueble
          console.log(`Buscando personas relacionadas al inmueble ID: ${inmueble.id}`);
          const personasRelacionadasResult = await db.execute(
            sql`SELECT p.* FROM personas p
                JOIN personas_inmuebles pi ON p.id = pi.persona_id
                WHERE pi.inmueble_id = ${inmueble.id}`
          );
          
          const personasRelacionadas = personasRelacionadasResult.rows || [];
          console.log(`Personas relacionadas al inmueble ID ${inmueble.id}: ${personasRelacionadas.length}`);
          
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
      
      for (const ubicacion of resultado.ubicacionesDirectas) {
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
          
          console.log(`[DEBUG] Personas relacionadas: 
            - Dirección 1->2: ${personasRelacionadas1.length}
            - Dirección 2->1: ${personasRelacionadas2.length}`);
          
          resultado.personas = [
            ...personasRelacionadas1.map(r => r.persona),
            ...personasRelacionadas2.map(r => r.persona)
          ];
          
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
          
          // Buscar ubicaciones relacionadas
          const ubicacionesRelacionadas = await db
            .select({
              ubicacion: ubicaciones
            })
            .from(personasUbicaciones)
            .innerJoin(ubicaciones, eq(personasUbicaciones.ubicacionId, ubicaciones.id))
            .where(eq(personasUbicaciones.personaId, id));
          
          console.log(`[DEBUG] Ubicaciones relacionadas: ${ubicacionesRelacionadas.length}`);
          
          resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
          
        } catch (err) {
          console.error(`[ERROR] Error al buscar relaciones para persona ${id}:`, err);
        }
      } 
      
      // Relaciones vehículo
      else if (tipo === 'vehiculos') {
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
          
          // Buscar personas relacionadas
          // Consulta SQL directa para debug
          const sqlLog = await db.execute(sql`
            SELECT * FROM personas_vehiculos WHERE vehiculo_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check personas_vehiculos for vehiculo:`, sqlLog.rows);
          
          const personasRelacionadas = await db
            .select({
              persona: personas
            })
            .from(personasVehiculos)
            .innerJoin(personas, eq(personasVehiculos.personaId, personas.id))
            .where(eq(personasVehiculos.vehiculoId, id));
          
          console.log(`[DEBUG] Personas relacionadas: ${personasRelacionadas.length}`);
          
          resultado.personas = personasRelacionadas.map(r => r.persona);
          
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
          
          // Buscar personas relacionadas
          // Consulta SQL directa para debug
          const sqlLog = await db.execute(sql`
            SELECT * FROM personas_inmuebles WHERE inmueble_id = ${id}
          `);
          console.log(`[DEBUG] Raw SQL check personas_inmuebles:`, sqlLog.rows);
          
          const personasRelacionadas = await db
            .select({
              persona: personas
            })
            .from(personasInmuebles)
            .innerJoin(personas, eq(personasInmuebles.personaId, personas.id))
            .where(eq(personasInmuebles.inmuebleId, id));
          
          console.log(`[DEBUG] Personas relacionadas: ${personasRelacionadas.length}`);
          
          resultado.personas = personasRelacionadas.map(r => r.persona);
          
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
}

export const storage = new DatabaseStorage();