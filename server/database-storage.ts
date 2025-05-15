import { 
  User, personas, vehiculos, inmuebles, ubicaciones, InsertUser, 
  InsertPersona, Persona, InsertVehiculo, Vehiculo, InsertInmueble, Inmueble,
  InsertUbicacion, Ubicacion, personasObservaciones, InsertPersonaObservacion, PersonaObservacion,
  vehiculosObservaciones, InsertVehiculoObservacion, VehiculoObservacion,
  inmueblesObservaciones, InsertInmuebleObservacion, InmuebleObservacion,
  personasVehiculos, personasInmuebles, personasUbicaciones, vehiculosInmuebles,
  vehiculosUbicaciones, inmueblesUbicaciones, personasPersonas, vehiculosVehiculos,
  inmueblesInmuebles, users
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
    const resultados: any = {};
    
    try {
      // Buscar personas
      if (tipos.includes('personas')) {
        const personasBasicas = await db
          .select()
          .from(personas)
          .where(
            or(
              like(personas.nombre, searchPattern),
              eq(personas.identificacion, query),
              like(personas.identificacion, searchPattern)
            )
          );
        
        resultados.personas = [...personasBasicas];
      }
      
      // Buscar vehículos
      if (tipos.includes('vehiculos')) {
        const vehiculosBasicos = await db
          .select()
          .from(vehiculos)
          .where(
            or(
              eq(vehiculos.placa, query),
              like(vehiculos.placa, searchPattern),
              like(vehiculos.marca, searchPattern),
              like(vehiculos.modelo, searchPattern)
            )
          );
        
        resultados.vehiculos = [...vehiculosBasicos];
      }
      
      // Buscar inmuebles
      if (tipos.includes('inmuebles')) {
        const inmueblesBasicos = await db
          .select()
          .from(inmuebles)
          .where(
            or(
              like(inmuebles.direccion, searchPattern),
              like(inmuebles.propietario, searchPattern)
            )
          );
        
        resultados.inmuebles = [...inmueblesBasicos];
      }
      
      // Buscar ubicaciones
      if (tipos.includes('ubicaciones')) {
        resultados.ubicaciones = await db.select().from(ubicaciones).where(
          like(ubicaciones.tipo, searchPattern)
        );
      }
      
      console.log("Resultados de búsqueda:", JSON.stringify(resultados));
      return resultados;
    } catch (error) {
      console.error("Error en búsqueda:", error);
      throw error;
    }
  }
  
  // Crear relación entre entidades
  async crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
    try {
      // Persona-Vehículo
      if (tipo1 === 'persona' && tipo2 === 'vehiculo') {
        await db.insert(personasVehiculos).values({
          personaId: id1,
          vehiculoId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'vehiculo' && tipo2 === 'persona') {
        await db.insert(personasVehiculos).values({
          personaId: id2,
          vehiculoId: id1
        });
        return { success: true };
      }
      
      // Persona-Inmueble
      if (tipo1 === 'persona' && tipo2 === 'inmueble') {
        await db.insert(personasInmuebles).values({
          personaId: id1,
          inmuebleId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'inmueble' && tipo2 === 'persona') {
        await db.insert(personasInmuebles).values({
          personaId: id2,
          inmuebleId: id1
        });
        return { success: true };
      }
      
      // Persona-Ubicación
      if (tipo1 === 'persona' && tipo2 === 'ubicacion') {
        await db.insert(personasUbicaciones).values({
          personaId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'ubicacion' && tipo2 === 'persona') {
        await db.insert(personasUbicaciones).values({
          personaId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Vehículo-Inmueble
      if (tipo1 === 'vehiculo' && tipo2 === 'inmueble') {
        await db.insert(vehiculosInmuebles).values({
          vehiculoId: id1,
          inmuebleId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'inmueble' && tipo2 === 'vehiculo') {
        await db.insert(vehiculosInmuebles).values({
          vehiculoId: id2,
          inmuebleId: id1
        });
        return { success: true };
      }
      
      // Vehículo-Ubicación
      if (tipo1 === 'vehiculo' && tipo2 === 'ubicacion') {
        await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'ubicacion' && tipo2 === 'vehiculo') {
        await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Inmueble-Ubicación
      if (tipo1 === 'inmueble' && tipo2 === 'ubicacion') {
        await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id1,
          ubicacionId: id2
        });
        return { success: true };
      }
      
      if (tipo1 === 'ubicacion' && tipo2 === 'inmueble') {
        await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id2,
          ubicacionId: id1
        });
        return { success: true };
      }
      
      // Persona-Persona
      if (tipo1 === 'persona' && tipo2 === 'persona') {
        await db.insert(personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        });
        return { success: true };
      }
      
      // Vehículo-Vehículo
      if (tipo1 === 'vehiculo' && tipo2 === 'vehiculo') {
        await db.insert(vehiculosVehiculos).values({
          vehiculoId1: id1,
          vehiculoId2: id2
        });
        return { success: true };
      }
      
      // Inmueble-Inmueble
      if (tipo1 === 'inmueble' && tipo2 === 'inmueble') {
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
      if (tipos.includes('personas')) {
        console.log(`Buscando personas con ID/nombre: ${queryExacto}`);
        
        // Consulta SQL directa para personas
        console.log(`Ejecutando consulta SQL para personas con identificacion=${queryExacto} O nombre LIKE ${searchPattern}`);
        const personasResult = await db.execute(
          sql`SELECT * FROM personas 
              WHERE identificacion = ${queryExacto}
              OR LOWER(nombre) LIKE LOWER(${searchPattern})`
        );
        
        const personas = personasResult.rows || [];
        console.log(`Personas encontradas: ${personas.length}`);
        
        // Para cada persona encontrada, buscar sus ubicaciones relacionadas
        for (const persona of personas) {
          console.log(`Buscando ubicaciones para persona ID: ${persona.id}`);
          
          // Buscar ubicaciones relacionadas con esta persona mediante SQL directo
          const ubicacionesResult = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
                WHERE pu.persona_id = ${persona.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          const ubicacionesPersona = ubicacionesResult.rows || [];
          console.log(`Ubicaciones encontradas para persona ID ${persona.id}: ${ubicacionesPersona.length}`);
          
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
          }
        }
      }
      
      // 2. BÚSQUEDA DE VEHÍCULOS (Implementemos correctamente todas las búsquedas)
      if (tipos.includes('vehiculos')) {
        console.log(`Buscando vehículos con placa/descripción: ${queryExacto}`);
        
        // Consulta SQL directa para vehículos
        console.log(`Ejecutando consulta SQL para vehículos con placa=${queryExacto} O marca/modelo LIKE ${searchPattern}`);
        const vehiculosResult = await db.execute(
          sql`SELECT * FROM vehiculos 
              WHERE placa = ${queryExacto}
              OR LOWER(marca) LIKE LOWER(${searchPattern})
              OR LOWER(modelo) LIKE LOWER(${searchPattern})`
        );
        
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
          }
        }
      }
      
      // 3. BÚSQUEDA DE INMUEBLES
      if (tipos.includes('inmuebles')) {
        console.log(`Buscando inmuebles con dirección/descripción: ${queryExacto}`);
        
        // Consulta SQL directa para inmuebles
        console.log(`Ejecutando consulta SQL para inmuebles con dirección LIKE ${searchPattern}`);
        const inmueblesResult = await db.execute(
          sql`SELECT * FROM inmuebles 
              WHERE LOWER(direccion) LIKE LOWER(${searchPattern})
              OR LOWER(tipo) LIKE LOWER(${searchPattern})
              OR LOWER(propietario) LIKE LOWER(${searchPattern})`
        );
        
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
      
      // 4. BUSCAR UBICACIONES DIRECTAS (por texto en tipo u observaciones)
      const ubicacionesResult = await db.execute(
        sql`SELECT * FROM ubicaciones 
            WHERE (LOWER(tipo) LIKE LOWER(${searchPattern})
                  OR (observaciones IS NOT NULL AND LOWER(observaciones) LIKE LOWER(${searchPattern})))
            AND latitud IS NOT NULL AND longitud IS NOT NULL`
      );
      
      const ubicacionesDirectas = ubicacionesResult.rows || [];
      console.log(`Ubicaciones directas encontradas: ${ubicacionesDirectas.length}`);
      
      // Agregar ubicaciones directas evitando duplicados
      for (const ubicacion of ubicacionesDirectas) {
        if (!ubicacionesEncontradas.has(ubicacion.id)) {
          ubicacionesEncontradas.add(ubicacion.id);
          resultado.ubicacionesDirectas.push(ubicacion);
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
    const resultado: any = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
    
    try {
      // Relaciones persona
      if (tipo === 'persona') {
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
      } 
      
      // Relaciones vehículo
      else if (tipo === 'vehiculo') {
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
        
        // Buscar personas relacionadas
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasVehiculos)
          .innerJoin(personas, eq(personasVehiculos.personaId, personas.id))
          .where(eq(personasVehiculos.vehiculoId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Buscar inmuebles relacionados
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(vehiculosInmuebles)
          .innerJoin(inmuebles, eq(vehiculosInmuebles.inmuebleId, inmuebles.id))
          .where(eq(vehiculosInmuebles.vehiculoId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
        
        // Buscar ubicaciones relacionadas
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(vehiculosUbicaciones)
          .innerJoin(ubicaciones, eq(vehiculosUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(vehiculosUbicaciones.vehiculoId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } 
      
      // Relaciones inmueble
      else if (tipo === 'inmueble') {
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
        
        // Buscar personas relacionadas
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasInmuebles)
          .innerJoin(personas, eq(personasInmuebles.personaId, personas.id))
          .where(eq(personasInmuebles.inmuebleId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Buscar vehículos relacionados
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosInmuebles)
          .innerJoin(vehiculos, eq(vehiculosInmuebles.vehiculoId, vehiculos.id))
          .where(eq(vehiculosInmuebles.inmuebleId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Buscar ubicaciones relacionadas
        const ubicacionesRelacionadas = await db
          .select({
            ubicacion: ubicaciones
          })
          .from(inmueblesUbicaciones)
          .innerJoin(ubicaciones, eq(inmueblesUbicaciones.ubicacionId, ubicaciones.id))
          .where(eq(inmueblesUbicaciones.inmuebleId, id));
        
        resultado.ubicaciones = ubicacionesRelacionadas.map(r => r.ubicacion);
      } 
      
      // Relaciones ubicación
      else if (tipo === 'ubicacion') {
        // Buscar personas relacionadas
        const personasRelacionadas = await db
          .select({
            persona: personas
          })
          .from(personasUbicaciones)
          .innerJoin(personas, eq(personasUbicaciones.personaId, personas.id))
          .where(eq(personasUbicaciones.ubicacionId, id));
        
        resultado.personas = personasRelacionadas.map(r => r.persona);
        
        // Buscar vehículos relacionados
        const vehiculosRelacionados = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosUbicaciones)
          .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
          .where(eq(vehiculosUbicaciones.ubicacionId, id));
        
        resultado.vehiculos = vehiculosRelacionados.map(r => r.vehiculo);
        
        // Buscar inmuebles relacionados
        const inmueblesRelacionados = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesUbicaciones)
          .innerJoin(inmuebles, eq(inmueblesUbicaciones.inmuebleId, inmuebles.id))
          .where(eq(inmueblesUbicaciones.ubicacionId, id));
        
        resultado.inmuebles = inmueblesRelacionados.map(r => r.inmueble);
      }
      
      return resultado;
    } catch (error) {
      console.error(`Error al obtener relaciones para ${tipo} con ID ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();