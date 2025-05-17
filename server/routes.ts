import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  personas, vehiculos, inmuebles, ubicaciones, tiposInmuebles, tiposUbicaciones,
  insertPersonaSchema, insertVehiculoSchema, insertInmuebleSchema, insertUbicacionSchema,
  insertPersonaObservacionSchema, insertVehiculoObservacionSchema, insertInmuebleObservacionSchema,
  insertUbicacionObservacionSchema,
  insertTipoInmuebleSchema, insertTipoUbicacionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);
  
  // Ruta de estado para verificar el servidor
  app.get("/api/status", (req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      }
    });
  });
  
  // Ruta especial para verificar la conectividad y los encabezados
  app.get("/api/connection-test", (req, res) => {
    const clientIp = req.ip || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      req.headers['x-forwarded-for'];
    
    const forwardedProtocol = req.get('x-forwarded-proto') || 'none';
    const isSecure = req.secure || forwardedProtocol === 'https';
    
    res.json({
      success: true,
      message: "Conectividad con el servidor establecida correctamente",
      timestamp: new Date().toISOString(),
      clientInfo: {
        ip: clientIp,
        userAgent: req.get('user-agent'),
        acceptEncoding: req.get('accept-encoding'),
        acceptLanguage: req.get('accept-language'),
      },
      connectionInfo: {
        isSecure,
        protocol: req.protocol,
        forwardedProtocol,
        host: req.get('host'),
        originalUrl: req.originalUrl,
      },
      headers: req.headers
    });
  });

  // Middleware to check user role
  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      console.log("ERROR: Usuario no autenticado al intentar acceder a ruta protegida");
      return res.status(401).json({ message: "No autorizado. Inicie sesión para continuar." });
    }
    
    console.log(`Usuario autenticado: ID=${req.user.id}, Nombre=${req.user.nombre}, Rol=${req.user.rol}`);
    
    if (!roles.includes(req.user.rol)) {
      console.log(`ERROR: Usuario con rol '${req.user.rol}' intenta acceder a ruta que requiere: ${roles.join(', ')}`);
      return res.status(403).json({ message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` });
    }
    
    next();
  };

  // API routes
  // Personas
  app.get("/api/personas", async (req, res) => {
    try {
      const personas = await storage.getAllPersonas();
      res.json(personas);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener personas" });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const persona = await storage.getPersona(parseInt(req.params.id));
      if (!persona) {
        return res.status(404).json({ message: "Persona no encontrada" });
      }
      res.json(persona);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener persona" });
    }
  });

  app.post("/api/personas", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const personaData = insertPersonaSchema.parse(req.body);
      const persona = await storage.createPersona(personaData);
      res.status(201).json(persona);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear persona" });
    }
  });
  
  // Observaciones de personas
  app.get("/api/personas/:id/observaciones", async (req, res) => {
    try {
      const observaciones = await storage.getPersonaObservaciones(parseInt(req.params.id));
      res.json(observaciones);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });
  
  app.post("/api/personas/:id/observaciones", requireRole(["admin", "investigador", "agente"]), async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      const usuario = req.user?.nombre || "Sistema"; // El nombre del usuario autenticado
      
      const observacionData = insertPersonaObservacionSchema.parse({
        ...req.body,
        personaId,
        usuario
      });
      
      const observacion = await storage.createPersonaObservacion(observacionData);
      res.status(201).json(observacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  // Vehículos
  app.get("/api/vehiculos", async (req, res) => {
    try {
      const vehiculos = await storage.getAllVehiculos();
      res.json(vehiculos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener vehículos" });
    }
  });

  app.get("/api/vehiculos/:id", async (req, res) => {
    try {
      const vehiculo = await storage.getVehiculo(parseInt(req.params.id));
      if (!vehiculo) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      res.json(vehiculo);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener vehículo" });
    }
  });

  app.post("/api/vehiculos", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const vehiculoData = insertVehiculoSchema.parse(req.body);
      const vehiculo = await storage.createVehiculo(vehiculoData);
      res.status(201).json(vehiculo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear vehículo" });
    }
  });
  
  // Observaciones de vehículos
  app.get("/api/vehiculos/:id/observaciones", async (req, res) => {
    try {
      const observaciones = await storage.getVehiculoObservaciones(parseInt(req.params.id));
      res.json(observaciones);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });
  
  app.post("/api/vehiculos/:id/observaciones", requireRole(["admin", "investigador", "agente"]), async (req, res) => {
    try {
      const vehiculoId = parseInt(req.params.id);
      const usuario = req.user?.nombre || "Sistema"; // El nombre del usuario autenticado
      
      const observacionData = insertVehiculoObservacionSchema.parse({
        ...req.body,
        vehiculoId,
        usuario
      });
      
      const observacion = await storage.createVehiculoObservacion(observacionData);
      res.status(201).json(observacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  // Inmuebles
  app.get("/api/inmuebles", async (req, res) => {
    try {
      const inmuebles = await storage.getAllInmuebles();
      res.json(inmuebles);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener inmuebles" });
    }
  });

  app.get("/api/inmuebles/:id", async (req, res) => {
    try {
      const inmueble = await storage.getInmueble(parseInt(req.params.id));
      if (!inmueble) {
        return res.status(404).json({ message: "Inmueble no encontrado" });
      }
      res.json(inmueble);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener inmueble" });
    }
  });

  app.post("/api/inmuebles", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const inmuebleData = insertInmuebleSchema.parse(req.body);
      const inmueble = await storage.createInmueble(inmuebleData);
      res.status(201).json(inmueble);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear inmueble" });
    }
  });
  
  // Observaciones de inmuebles
  app.get("/api/inmuebles/:id/observaciones", async (req, res) => {
    try {
      const observaciones = await storage.getInmuebleObservaciones(parseInt(req.params.id));
      res.json(observaciones);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });
  
  app.post("/api/inmuebles/:id/observaciones", requireRole(["admin", "investigador", "agente"]), async (req, res) => {
    try {
      const inmuebleId = parseInt(req.params.id);
      const usuario = req.user?.nombre || "Sistema"; // El nombre del usuario autenticado
      
      const observacionData = insertInmuebleObservacionSchema.parse({
        ...req.body,
        inmuebleId,
        usuario
      });
      
      const observacion = await storage.createInmuebleObservacion(observacionData);
      res.status(201).json(observacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  // Ubicaciones
  app.get("/api/ubicaciones", async (req, res) => {
    try {
      const { buscar, tipos } = req.query;
      
      if (buscar) {
        // Si hay un parámetro de búsqueda, buscar ubicaciones con coordenadas
        // Mejorar el procesamiento de los tipos para manejar valores separados por comas
        let tiposArray: string[] = [];
        
        try {
          // Si tipos es un string (común cuando viene como query param), dividirlo por comas
          if (typeof tipos === 'string' && tipos.includes(',')) {
            tiposArray = tipos.split(',').map(t => t.trim());
            console.log(`DEBUG - Procesando tipos (string con comas): ${tipos} -> Array de ${tiposArray.length} elementos: [${tiposArray.join(', ')}]`);
          } 
          // Si tipos es un array, convertir cada elemento a string
          else if (Array.isArray(tipos)) {
            tiposArray = [];
            for (const t of tipos) {
              if (typeof t === 'string') {
                tiposArray.push(t);
              } else if (t && typeof t === 'object') {
                tiposArray.push(String(t));
              }
            }
            console.log(`DEBUG - Procesando tipos (array): Array de ${tiposArray.length} elementos`);
          } 
          // Si tipos es un string simple (sin comas), ponerlo en un array
          else if (typeof tipos === 'string') {
            tiposArray = [tipos];
            console.log(`DEBUG - Procesando tipos (string simple): ${tipos}`);
          } 
          // Si no hay tipos, usar todos por defecto
          else {
            tiposArray = ["personas", "vehiculos", "inmuebles"];
            console.log(`DEBUG - No se proporcionaron tipos, usando valores por defecto: [${tiposArray.join(', ')}]`);
          }
        } catch (error) {
          console.error(`Error procesando tipos: ${error}`, tipos);
          tiposArray = ["personas", "vehiculos", "inmuebles"];
          console.log(`DEBUG - Error al procesar tipos, usando valores por defecto: [${tiposArray.join(', ')}]`);
        }
        
        // Normalizar los tipos: convertir plural a singular para consistencia
        const tiposNormalizados = tiposArray.map(tipo => {
          if (tipo === "personas") return "persona";
          if (tipo === "vehiculos") return "vehiculo";
          if (tipo === "inmuebles") return "inmueble";
          return tipo;
        });
        
        console.log(`DEBUG - Tipos normalizados para la búsqueda: [${tiposNormalizados.join(', ')}]`);
        
        const resultados = await storage.buscarUbicacionesConCoordenadas(buscar.toString(), tiposNormalizados);
        return res.json(resultados);
      }
      
      // Si no hay parámetro de búsqueda, devolver todas las ubicaciones
      const ubicaciones = await storage.getAllUbicaciones();
      res.json(ubicaciones);
    } catch (error) {
      console.error("Error en búsqueda de ubicaciones:", error);
      res.status(500).json({ message: "Error al obtener ubicaciones" });
    }
  });

  app.get("/api/ubicaciones/:id", async (req, res) => {
    try {
      const ubicacion = await storage.getUbicacion(parseInt(req.params.id));
      if (!ubicacion) {
        return res.status(404).json({ message: "Ubicación no encontrada" });
      }
      res.json(ubicacion);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener ubicación" });
    }
  });

  app.post("/api/ubicaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      console.log("📍 Recibido datos para nueva ubicación:", req.body);
      
      // Validar datos recibidos
      if (!req.body.latitud || !req.body.longitud || !req.body.tipo) {
        console.error("⚠️ Datos incompletos:", req.body);
        return res.status(400).json({ 
          success: false, 
          error: "Faltan datos requeridos (latitud, longitud, tipo)" 
        });
      }
      
      // Normalizar datos
      const ubicacionData = {
        latitud: parseFloat(req.body.latitud),
        longitud: parseFloat(req.body.longitud),
        tipo: req.body.tipo,
        fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
        observaciones: req.body.observaciones || ""
      };
      
      console.log("📍 Datos normalizados para guardar:", ubicacionData);
      
      // Guardar en la base de datos
      const ubicacion = await storage.createUbicacion(ubicacionData);
      console.log("✅ Ubicación creada con éxito:", ubicacion);
      
      // Asegurar el Content-Type adecuado
      res.setHeader('Content-Type', 'application/json');
      
      // Enviar respuesta exitosa
      return res.status(201).json({
        success: true,
        data: ubicacion
      });
    } catch (error) {
      console.error("❌ Error al crear ubicación:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: "Datos inválidos", 
          details: error.errors 
        });
      }
      
      // Asegurar el Content-Type adecuado
      res.setHeader('Content-Type', 'application/json');
      
      // Enviar respuesta de error
      return res.status(500).json({ 
        success: false, 
        error: "Error al crear ubicación" 
      });
    }
  });

  // Búsqueda
  app.get("/api/buscar", async (req, res) => {
    try {
      const { query, tipos } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Se requiere un término de búsqueda" });
      }
      
      const tiposArray = Array.isArray(tipos) 
        ? tipos 
        : tipos ? [tipos] : ["personas", "vehiculos", "inmuebles"];
      
      // Búsqueda estándar como estaba originalmente
      const resultados = await storage.buscar(query.toString(), tiposArray as string[]);
      res.json(resultados);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      res.status(500).json({ message: "Error al realizar la búsqueda" });
    }
  });
  
  // Búsqueda por ID directo - utilizado por el componente de búsqueda avanzada
  app.get("/api/buscarporids", async (req, res) => {
    try {
      const entidades = {
        personas: [],
        vehiculos: [],
        inmuebles: [],
        ubicaciones: []
      };
      
      // Obtener parámetros de búsqueda
      const { personaId, vehiculoId, inmuebleId, ubicacionId } = req.query;
      
      // Buscar persona por ID
      if (personaId) {
        const persona = await storage.getPersona(parseInt(personaId.toString()));
        if (persona) entidades.personas.push(persona);
      }
      
      // Buscar vehículo por ID
      if (vehiculoId) {
        const vehiculo = await storage.getVehiculo(parseInt(vehiculoId.toString()));
        if (vehiculo) entidades.vehiculos.push(vehiculo);
      }
      
      // Buscar inmueble por ID
      if (inmuebleId) {
        const inmueble = await storage.getInmueble(parseInt(inmuebleId.toString()));
        if (inmueble) entidades.inmuebles.push(inmueble);
      }
      
      // Buscar ubicación por ID
      if (ubicacionId) {
        const ubicacion = await storage.getUbicacion(parseInt(ubicacionId.toString()));
        if (ubicacion) entidades.ubicaciones.push(ubicacion);
      }
      
      // Si no se encontró ninguna entidad, devolver error
      if (Object.values(entidades).every(arr => arr.length === 0)) {
        return res.status(404).json({ message: "No se encontraron entidades con los IDs proporcionados" });
      }
      
      res.json(entidades);
    } catch (error) {
      console.error("Error al buscar por IDs:", error);
      res.status(500).json({ message: "Error al realizar la búsqueda por IDs" });
    }
  });

  // Endpoint para obtener entidad específica por tipo e ID con todas sus ubicaciones (directas, relacionadas y de segundo nivel)
  app.get("/api/entidad/:tipo/:id", async (req, res) => {
    try {
      const { tipo, id } = req.params;
      const idNumerico = parseInt(id);
      
      console.log(`[SERVIDOR] Buscando entidad específica: ${tipo} con ID ${idNumerico}`);
      
      // Implementación directa de búsqueda avanzada de ubicaciones para asegurar resultados completos
      let entidad = null;
      const ubicacionesDirectas = [];
      const ubicacionesRelacionadas = [];
      const entidadesRelacionadas = [];
      
      // 1. Obtener la entidad principal según su tipo
      if (tipo === 'persona' || tipo === 'personas') {
        entidad = await storage.getPersona(idNumerico);
        
        if (entidad) {
          console.log(`[SERVIDOR] Encontrada persona: ${entidad.nombre} (${entidad.identificacion})`);
          
          // Buscar ubicaciones directas (replicamos algunas partes del relation-finder pero de forma más directa)
          
          // Buscar ubicaciones relacionadas directamente en la tabla
          const relacionesUbicaciones = await db.select().from(sql`personas_ubicaciones`)
            .where(sql`persona_id = ${idNumerico}`);
          
          console.log(`[SERVIDOR] Relaciones directas con ubicaciones: ${relacionesUbicaciones.length}`);
          
          // Obtener ubicaciones relacionadas
          for (const rel of relacionesUbicaciones) {
            const [ubi] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, rel.ubicacion_id));
            if (ubi && ubi.latitud && ubi.longitud) {
              console.log(`[SERVIDOR] Añadiendo ubicación directa: ${ubi.id} (${ubi.tipo})`);
              ubicacionesDirectas.push(ubi);
            }
          }
          
          // Buscar ubicaciones que mencionen domicilios de la persona
          if (entidad.domicilios && entidad.domicilios.length > 0) {
            console.log(`[SERVIDOR] Buscando por domicilios: ${entidad.domicilios.join(', ')}`);
            
            for (const domicilio of entidad.domicilios) {
              if (!domicilio) continue;
              
              // Búsqueda extendida de domicilios
              const ubicacionesDomicilio = await db.select().from(ubicaciones)
                .where(sql`(
                  tipo = 'Domicilio' AND 
                  (observaciones LIKE ${'%' + domicilio + '%'} OR 
                   observaciones LIKE ${'%' + entidad.nombre + '%'})
                )`);
              
              if (ubicacionesDomicilio.length > 0) {
                console.log(`[SERVIDOR] Encontradas ${ubicacionesDomicilio.length} ubicaciones por domicilio "${domicilio}"`);
                for (const ubi of ubicacionesDomicilio) {
                  if (ubi.latitud && ubi.longitud) {
                    ubicacionesDirectas.push(ubi);
                  }
                }
              }
            }
          }
          
          // SIEMPRE buscar todas las ubicaciones de tipo Domicilio
          const todasUbicacionesDomicilio = await db.select().from(ubicaciones)
            .where(sql`tipo = 'Domicilio'`);
          
          console.log(`[SERVIDOR] Buscando todas las ubicaciones de Domicilio: encontradas ${todasUbicacionesDomicilio.length}`);
          
          for (const ubi of todasUbicacionesDomicilio) {
            if (ubi.latitud && ubi.longitud) {
              ubicacionesDirectas.push(ubi);
            }
          }
          
          // Buscar relaciones con otras entidades
          
          // 1. Relación con vehículos
          const vehiculosRelacionados = await db.select().from(sql`personas_vehiculos`)
            .where(sql`persona_id = ${idNumerico}`);
          
          console.log(`[SERVIDOR] Vehículos relacionados: ${vehiculosRelacionados.length}`);
          
          for (const relVehiculo of vehiculosRelacionados) {
            const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, relVehiculo.vehiculo_id));
            
            if (vehiculo) {
              console.log(`[SERVIDOR] Vehículo relacionado: ${vehiculo.marca} ${vehiculo.placa}`);
              entidadesRelacionadas.push({
                tipo: 'vehiculo',
                nivel: 1,
                ...vehiculo
              });
              
              // Buscar ubicaciones del vehículo
              const ubicacionesVehiculo = await db.select().from(sql`vehiculos_ubicaciones`)
                .where(sql`vehiculo_id = ${vehiculo.id}`);
              
              for (const relUbiVehiculo of ubicacionesVehiculo) {
                const [ubiVehiculo] = await db.select().from(ubicaciones)
                  .where(eq(ubicaciones.id, relUbiVehiculo.ubicacion_id));
                
                if (ubiVehiculo && ubiVehiculo.latitud && ubiVehiculo.longitud) {
                  ubicacionesRelacionadas.push({
                    ubicacion: ubiVehiculo,
                    entidadRelacionada: {
                      tipo: 'vehiculo',
                      entidad: vehiculo,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: entidad
                      }
                    }
                  });
                }
              }
            }
          }
          
          // 2. Relación con inmuebles
          const inmueblesRelacionados = await db.select().from(sql`personas_inmuebles`)
            .where(sql`persona_id = ${idNumerico}`);
          
          console.log(`[SERVIDOR] Inmuebles relacionados: ${inmueblesRelacionados.length}`);
          
          for (const relInmueble of inmueblesRelacionados) {
            const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, relInmueble.inmueble_id));
            
            if (inmueble) {
              console.log(`[SERVIDOR] Inmueble relacionado: ${inmueble.tipo} en ${inmueble.direccion}`);
              entidadesRelacionadas.push({
                tipo: 'inmueble',
                nivel: 1,
                ...inmueble
              });
              
              // Buscar ubicaciones del inmueble
              const ubicacionesInmueble = await db.select().from(sql`inmuebles_ubicaciones`)
                .where(sql`inmueble_id = ${inmueble.id}`);
              
              for (const relUbiInmueble of ubicacionesInmueble) {
                const [ubiInmueble] = await db.select().from(ubicaciones)
                  .where(eq(ubicaciones.id, relUbiInmueble.ubicacion_id));
                
                if (ubiInmueble && ubiInmueble.latitud && ubiInmueble.longitud) {
                  ubicacionesRelacionadas.push({
                    ubicacion: ubiInmueble,
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmueble,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: entidad
                      }
                    }
                  });
                }
              }
              
              // También buscar ubicaciones por dirección del inmueble
              if (inmueble.direccion) {
                const ubicacionesDireccion = await db.select().from(ubicaciones)
                  .where(sql`observaciones LIKE ${'%' + inmueble.direccion + '%'}`);
                
                for (const ubiDir of ubicacionesDireccion) {
                  if (ubiDir && ubiDir.latitud && ubiDir.longitud) {
                    ubicacionesRelacionadas.push({
                      ubicacion: ubiDir,
                      entidadRelacionada: {
                        tipo: 'inmueble',
                        entidad: inmueble,
                        relacionadoCon: {
                          tipo: 'persona',
                          entidad: entidad
                        }
                      }
                    });
                  }
                }
              }
            }
          }
        }
      } else if (tipo === 'vehiculo' || tipo === 'vehiculos') {
        // Implementar búsqueda similar para vehículos
        entidad = await storage.getVehiculo(idNumerico);
        if (entidad) {
          // (Lógica similar para vehículos)
        }
      } else if (tipo === 'inmueble' || tipo === 'inmuebles') {
        // Implementar búsqueda similar para inmuebles
        entidad = await storage.getInmueble(idNumerico);
        if (entidad) {
          // (Lógica similar para inmuebles)
        }
      }
      
      if (!entidad) {
        return res.status(404).json({ message: `${tipo} con ID ${id} no encontrado` });
      }
      
      // Eliminar duplicados en ubicaciones directas e indirectas
      const ubicacionesDirectasUnicas = ubicacionesDirectas.filter((ubicacion, index, self) =>
        index === self.findIndex(u => u.id === ubicacion.id)
      );
      
      const ubicacionesRelacionadasUnicas = ubicacionesRelacionadas.filter((relacion, index, self) =>
        index === self.findIndex(r => r.ubicacion.id === relacion.ubicacion.id)
      );
      
      // Registrar estadísticas
      console.log(`[SERVIDOR] Resultados para ${tipo} ID ${idNumerico}:`);
      console.log(`- Ubicaciones directas: ${ubicacionesDirectasUnicas.length}`);
      console.log(`- Ubicaciones relacionadas: ${ubicacionesRelacionadasUnicas.length}`);
      console.log(`- Entidades relacionadas: ${entidadesRelacionadas.length}`);
      
      // Devolver resultados
      res.json({
        entidad,
        tipo: tipo.toLowerCase(),
        ubicacionesDirectas: ubicacionesDirectasUnicas,
        ubicacionesRelacionadas: ubicacionesRelacionadasUnicas,
        entidadesRelacionadas
      });
    } catch (error) {
      console.error(`Error al obtener entidad ${req.params.tipo} con ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Error al obtener la entidad solicitada", error: error.message });
    }
  });

  // Relaciones
  app.post("/api/relaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const { tipo1, id1, tipo2, id2 } = req.body;
      if (!tipo1 || !id1 || !tipo2 || !id2) {
        return res.status(400).json({ message: "Datos incompletos para la relación" });
      }
      
      // Normalizar tipos (convertir singular a plural para consistencia con storage)
      let tipo1Normalizado = tipo1;
      let tipo2Normalizado = tipo2;
      
      // Convertir a plural si está en singular
      if (tipo1 === "persona") tipo1Normalizado = "personas";
      if (tipo1 === "vehiculo") tipo1Normalizado = "vehiculos";
      if (tipo1 === "inmueble") tipo1Normalizado = "inmuebles";
      if (tipo1 === "ubicacion") tipo1Normalizado = "ubicaciones";
      
      if (tipo2 === "persona") tipo2Normalizado = "personas";
      if (tipo2 === "vehiculo") tipo2Normalizado = "vehiculos";
      if (tipo2 === "inmueble") tipo2Normalizado = "inmuebles";
      if (tipo2 === "ubicacion") tipo2Normalizado = "ubicaciones";
      
      console.log(`Creando relación: ${tipo1}(${id1}) -> ${tipo2}(${id2})`);
      console.log(`Tipos normalizados: ${tipo1Normalizado}(${id1}) -> ${tipo2Normalizado}(${id2})`);
      
      const relacion = await storage.crearRelacion(tipo1Normalizado, parseInt(id1), tipo2Normalizado, parseInt(id2));
      res.status(201).json(relacion);
    } catch (error) {
      console.error("Error al crear relación:", error);
      res.status(500).json({ message: "Error al crear relación" });
    }
  });
  
  // Ruta especial para crear múltiples relaciones para una ubicación de una sola vez
  // Ubicaciones observaciones
  app.get("/api/ubicaciones/:id/observaciones", async (req, res) => {
    try {
      const observaciones = await storage.getUbicacionObservaciones(parseInt(req.params.id));
      res.json(observaciones);
    } catch (error) {
      console.error("Error al obtener observaciones de ubicación:", error);
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });

  app.post("/api/ubicaciones/:id/observaciones", requireRole(["admin", "investigador", "agente"]), async (req, res) => {
    try {
      const ubicacionId = parseInt(req.params.id);
      const usuario = req.user?.nombre || "Sistema"; // El nombre del usuario autenticado
      
      const observacionData = insertUbicacionObservacionSchema.parse({
        ...req.body,
        ubicacionId,
        usuario
      });
      
      const observacion = await storage.createUbicacionObservacion(observacionData);
      res.status(201).json(observacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error al crear observación de ubicación:", error);
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  app.post("/api/ubicaciones/:id/relaciones", async (req, res) => {
    try {
      const ubicacionId = parseInt(req.params.id);
      const { personas, vehiculos, inmuebles } = req.body;
      
      console.log(`Creando múltiples relaciones para ubicación ${ubicacionId}:`);
      console.log(`- Personas: ${personas?.length || 0}`);
      console.log(`- Vehículos: ${vehiculos?.length || 0}`);
      console.log(`- Inmuebles: ${inmuebles?.length || 0}`);
      
      const resultados: {
        personas: Array<{id: number; exito: boolean; error?: string}>;
        vehiculos: Array<{id: number; exito: boolean; error?: string}>;
        inmuebles: Array<{id: number; exito: boolean; error?: string}>;
      } = {
        personas: [],
        vehiculos: [],
        inmuebles: []
      };
      
      // Crear relaciones con personas
      if (personas && personas.length > 0) {
        for (const personaId of personas) {
          try {
            const relacion = await storage.crearRelacion("ubicaciones", ubicacionId, "personas", parseInt(String(personaId)));
            resultados.personas.push({ id: parseInt(String(personaId)), exito: true });
          } catch (error) {
            console.error(`Error al crear relación con persona ${personaId}:`, error);
            resultados.personas.push({ id: parseInt(String(personaId)), exito: false, error: "Error al crear relación" });
          }
        }
      }
      
      // Crear relaciones con vehículos
      if (vehiculos && vehiculos.length > 0) {
        for (const vehiculoId of vehiculos) {
          try {
            const relacion = await storage.crearRelacion("ubicaciones", ubicacionId, "vehiculos", parseInt(String(vehiculoId)));
            resultados.vehiculos.push({ id: parseInt(String(vehiculoId)), exito: true });
          } catch (error) {
            console.error(`Error al crear relación con vehículo ${vehiculoId}:`, error);
            resultados.vehiculos.push({ id: parseInt(String(vehiculoId)), exito: false, error: "Error al crear relación" });
          }
        }
      }
      
      // Crear relaciones con inmuebles
      if (inmuebles && inmuebles.length > 0) {
        for (const inmuebleId of inmuebles) {
          try {
            const relacion = await storage.crearRelacion("ubicaciones", ubicacionId, "inmuebles", parseInt(String(inmuebleId)));
            resultados.inmuebles.push({ id: parseInt(String(inmuebleId)), exito: true });
          } catch (error) {
            console.error(`Error al crear relación con inmueble ${inmuebleId}:`, error);
            resultados.inmuebles.push({ id: parseInt(String(inmuebleId)), exito: false, error: "Error al crear relación" });
          }
        }
      }
      
      res.status(201).json({ 
        mensaje: "Relaciones creadas",
        resultados 
      });
    } catch (error) {
      console.error("Error al crear relaciones:", error);
      res.status(500).json({ message: "Error al crear relaciones" });
    }
  });

  app.get("/api/relaciones/:tipo/:id", async (req, res) => {
    try {
      const { tipo, id } = req.params;
      
      console.log(`[DEBUG] Recibida solicitud de relaciones para tipo: "${tipo}", id: "${id}"`);
      
      // Verificar parámetros
      if (!tipo || !id) {
        console.error(`[ERROR] Parámetros incompletos - tipo: "${tipo}", id: "${id}"`);
        return res.status(400).json({ message: "Tipo e ID son requeridos" });
      }
      
      // Convertir ID a número
      const idNumerico = parseInt(id);
      if (isNaN(idNumerico)) {
        console.error(`[ERROR] ID inválido: "${id}"`);
        return res.status(400).json({ message: "ID debe ser un número" });
      }
      
      // Normalizar tipos (convertir singular a plural para consistencia con storage)
      let tipoNormalizado = tipo;
      
      // Convertir a plural si está en singular
      if (tipo === "persona") tipoNormalizado = "personas";
      if (tipo === "vehiculo") tipoNormalizado = "vehiculos";
      if (tipo === "inmueble") tipoNormalizado = "inmuebles";
      if (tipo === "ubicacion") tipoNormalizado = "ubicaciones";
      
      console.log(`[DEBUG] Obteniendo relaciones para: ${tipo}(${idNumerico}), normalizado a: ${tipoNormalizado}(${idNumerico})`);
      
      // Verificar existencia de la entidad según el tipo
      let entidadExiste = false;
      
      if (tipoNormalizado === "personas") {
        const [persona] = await db.select().from(personas).where(eq(personas.id, idNumerico));
        entidadExiste = !!persona;
      } else if (tipoNormalizado === "vehiculos") {
        const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, idNumerico));
        entidadExiste = !!vehiculo;
      } else if (tipoNormalizado === "inmuebles") {
        const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, idNumerico));
        entidadExiste = !!inmueble;
      } else if (tipoNormalizado === "ubicaciones") {
        const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, idNumerico));
        entidadExiste = !!ubicacion;
      }
      
      if (!entidadExiste) {
        console.error(`[ERROR] Entidad no encontrada: ${tipoNormalizado}(${idNumerico})`);
        return res.status(404).json({ message: `No se encontró ${tipoNormalizado} con ID ${idNumerico}` });
      }
      
      // Obtener relaciones
      const relaciones = await storage.getRelaciones(tipoNormalizado, idNumerico);
      
      console.log(`[DEBUG] Relaciones obtenidas:`, {
        tipoEntidad: tipoNormalizado,
        idEntidad: idNumerico,
        cantidadPersonas: relaciones.personas?.length || 0,
        cantidadVehiculos: relaciones.vehiculos?.length || 0,
        cantidadInmuebles: relaciones.inmuebles?.length || 0,
        cantidadUbicaciones: relaciones.ubicaciones?.length || 0
      });
      
      // Verificar si hay al menos una relación
      const tieneRelaciones = 
        (relaciones.personas?.length > 0) || 
        (relaciones.vehiculos?.length > 0) || 
        (relaciones.inmuebles?.length > 0) || 
        (relaciones.ubicaciones?.length > 0);
      
      if (!tieneRelaciones) {
        console.log(`[INFO] No se encontraron relaciones para ${tipoNormalizado}(${idNumerico})`);
      }
      
      res.json(relaciones);
    } catch (error) {
      console.error("[ERROR] Error al obtener relaciones:", error);
      // Devolver un objeto vacío pero válido en caso de error
      res.status(200).json({
        personas: [],
        vehiculos: [],
        inmuebles: [],
        ubicaciones: []
      });
    }
  });
  
  // Ruta pública para obtener tipos de inmuebles (accesible para todos los usuarios)
  app.get("/api/tipos-inmuebles", async (req, res) => {
    try {
      const tiposInmuebles = await storage.getAllTiposInmuebles();
      // Filtrar solo los tipos activos para el uso en formularios
      const tiposActivos = tiposInmuebles.filter(tipo => tipo.activo);
      res.json(tiposActivos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de inmuebles" });
    }
  });
  
  // Ruta pública para obtener tipos de ubicaciones (accesible para todos los usuarios)
  app.get("/api/tipos-ubicaciones", async (req, res) => {
    try {
      const tiposUbicaciones = await storage.getAllTiposUbicaciones();
      // Filtrar solo los tipos activos para el uso en formularios
      const tiposActivos = tiposUbicaciones.filter(tipo => tipo.activo);
      res.json(tiposActivos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones" });
    }
  });

  // Función middleware para verificar rol de administrador
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    if (req.user?.rol !== "admin") {
      return res.status(403).json({ message: "No tiene permisos para esta acción" });
    }
    next();
  };
  
  // Rutas de administración para tipos de inmuebles (solo accesibles por administradores)
  
  // Obtener todos los tipos de inmuebles (incluyendo activos e inactivos)
  app.get("/api/tipos-inmuebles-admin", requireAdmin, async (req, res) => {
    try {
      console.log("GET /api/tipos-inmuebles-admin: Obteniendo todos los tipos de inmuebles");
      // Usamos una consulta directa de la BD con Drizzle
      const tipos = await db.select().from(tiposInmuebles).orderBy(tiposInmuebles.nombre);
      console.log("GET /api/tipos-inmuebles-admin: Tipos encontrados:", tipos.length);
      res.json(tipos);
    } catch (error) {
      console.error("GET /api/tipos-inmuebles-admin Error:", error);
      res.status(500).json({ message: "Error al obtener tipos de inmuebles", error: String(error) });
    }
  });
  
  // Crear un nuevo tipo de inmueble
  app.post("/api/tipos-inmuebles", requireAdmin, async (req, res) => {
    try {
      console.log("POST /api/tipos-inmuebles: Creando nuevo tipo de inmueble:", req.body);
      
      // Validamos los datos con el esquema
      const validatedData = insertTipoInmuebleSchema.parse(req.body);
      console.log("POST /api/tipos-inmuebles: Datos validados:", validatedData);
      
      // Insertamos directamente con Drizzle
      const [nuevoTipo] = await db.insert(tiposInmuebles).values(validatedData).returning();
      console.log("POST /api/tipos-inmuebles: Tipo creado:", nuevoTipo);
      
      res.status(201).json(nuevoTipo);
    } catch (error) {
      console.error("POST /api/tipos-inmuebles Error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos para el tipo de inmueble", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Error al crear tipo de inmueble", 
        error: String(error) 
      });
    }
  });
  
  // Actualizar un tipo de inmueble existente
  app.patch("/api/tipos-inmuebles/:id", requireAdmin, async (req, res) => {
    try {
      console.log("PATCH /api/tipos-inmuebles/:id - Actualizando tipo de inmueble con ID:", req.params.id);
      console.log("PATCH /api/tipos-inmuebles/:id - Datos:", req.body);
      
      const id = parseInt(req.params.id);
      
      // Validamos los datos
      const validatedData = insertTipoInmuebleSchema.partial().parse(req.body);
      console.log("PATCH /api/tipos-inmuebles/:id - Datos validados:", validatedData);
      
      // Actualizamos directamente con Drizzle
      const [tipoActualizado] = await db.update(tiposInmuebles)
        .set(validatedData)
        .where(eq(tiposInmuebles.id, id))
        .returning();
        
      if (!tipoActualizado) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
      }
      
      console.log("PATCH /api/tipos-inmuebles/:id - Tipo actualizado:", tipoActualizado);
      res.json(tipoActualizado);
    } catch (error) {
      console.error("PATCH /api/tipos-inmuebles/:id Error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos para el tipo de inmueble", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Error al actualizar tipo de inmueble",
        error: String(error)
      });
    }
  });
  
  // Eliminar un tipo de inmueble
  app.delete("/api/tipos-inmuebles/:id", requireAdmin, async (req, res) => {
    try {
      console.log("DELETE /api/tipos-inmuebles/:id - Intentando eliminar tipo de inmueble con ID:", req.params.id);
      const id = parseInt(req.params.id);
      
      // Primero verificamos si existen inmuebles con este tipo (sólo usando campo tipo)
      // Usamos sólo el campo 'tipo' ya que 'tipoId' se convierte a 'tipo_id' en SQL
      const relatedInmuebles = await db.select().from(inmuebles).where(
        eq(inmuebles.tipo, String(id))
      );
      
      // NOTA: En esta base de datos solo existe el campo 'tipo', no hay 'tipo_id'
      // por lo que solo verificamos por tipo (ya hecho en la consulta anterior)
      console.log("DELETE /api/tipos-inmuebles/:id - Inmuebles relacionados:", relatedInmuebles.length);
      
      if (relatedInmuebles.length > 0) {
        // Si hay inmuebles usando este tipo, solo marcamos como inactivo
        console.log("DELETE /api/tipos-inmuebles/:id - Marcando como inactivo por tener inmuebles relacionados");
        const [tipoActualizado] = await db.update(tiposInmuebles)
          .set({ activo: false })
          .where(eq(tiposInmuebles.id, id))
          .returning();
          
        if (!tipoActualizado) {
          return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
        }
        
        return res.json({ success: true, message: "Tipo de inmueble marcado como inactivo" });
      } else {
        // Si no hay inmuebles relacionados, eliminamos físicamente
        console.log("DELETE /api/tipos-inmuebles/:id - Eliminando físicamente el tipo");
        const [eliminado] = await db.delete(tiposInmuebles)
          .where(eq(tiposInmuebles.id, id))
          .returning();
          
        if (!eliminado) {
          return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
        }
        
        return res.json({ success: true, message: "Tipo de inmueble eliminado correctamente" });
      }
    } catch (error) {
      console.error("DELETE /api/tipos-inmuebles/:id Error:", error);
      res.status(500).json({ 
        message: "Error al eliminar tipo de inmueble",
        error: String(error)
      });
    }
  });
  
  // Rutas de administración para tipos de ubicaciones (solo accesibles por administradores)
  
  // Obtener todos los tipos de ubicaciones (incluyendo activos e inactivos)
  app.get("/api/tipos-ubicaciones-admin", requireAdmin, async (req, res) => {
    try {
      console.log("GET /api/tipos-ubicaciones-admin: Obteniendo todos los tipos de ubicaciones");
      // Consulta directa con Drizzle
      const tipos = await db.select().from(tiposUbicaciones).orderBy(tiposUbicaciones.nombre);
      console.log("GET /api/tipos-ubicaciones-admin: Tipos encontrados:", tipos.length);
      res.json(tipos);
    } catch (error) {
      console.error("GET /api/tipos-ubicaciones-admin Error:", error);
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones", error: String(error) });
    }
  });
  
  // Crear un nuevo tipo de ubicación
  app.post("/api/tipos-ubicaciones", requireAdmin, async (req, res) => {
    try {
      console.log("POST /api/tipos-ubicaciones: Creando nuevo tipo de ubicación:", req.body);
      
      // Validamos los datos con el esquema
      const validatedData = insertTipoUbicacionSchema.parse(req.body);
      console.log("POST /api/tipos-ubicaciones: Datos validados:", validatedData);
      
      // Insertamos directamente con Drizzle
      const [nuevoTipo] = await db.insert(tiposUbicaciones).values(validatedData).returning();
      console.log("POST /api/tipos-ubicaciones: Tipo creado:", nuevoTipo);
      
      res.status(201).json(nuevoTipo);
    } catch (error) {
      console.error("POST /api/tipos-ubicaciones Error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos para el tipo de ubicación", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Error al crear tipo de ubicación", 
        error: String(error) 
      });
    }
  });
  
  // Actualizar un tipo de ubicación existente
  app.patch("/api/tipos-ubicaciones/:id", requireAdmin, async (req, res) => {
    try {
      console.log("PATCH /api/tipos-ubicaciones/:id - Actualizando tipo de ubicación con ID:", req.params.id);
      console.log("PATCH /api/tipos-ubicaciones/:id - Datos:", req.body);
      
      const id = parseInt(req.params.id);
      
      // Validamos los datos
      const validatedData = insertTipoUbicacionSchema.partial().parse(req.body);
      console.log("PATCH /api/tipos-ubicaciones/:id - Datos validados:", validatedData);
      
      // Actualizamos directamente con Drizzle
      const [tipoActualizado] = await db.update(tiposUbicaciones)
        .set(validatedData)
        .where(eq(tiposUbicaciones.id, id))
        .returning();
        
      if (!tipoActualizado) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
      }
      
      console.log("PATCH /api/tipos-ubicaciones/:id - Tipo actualizado:", tipoActualizado);
      res.json(tipoActualizado);
    } catch (error) {
      console.error("PATCH /api/tipos-ubicaciones/:id Error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos inválidos para el tipo de ubicación", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Error al actualizar tipo de ubicación",
        error: String(error)
      });
    }
  });
  
  // Eliminar un tipo de ubicación
  app.delete("/api/tipos-ubicaciones/:id", requireAdmin, async (req, res) => {
    try {
      console.log("DELETE /api/tipos-ubicaciones/:id - Intentando eliminar tipo de ubicación con ID:", req.params.id);
      const id = parseInt(req.params.id);
      
      // Primero verificamos si existen ubicaciones con este tipo (sólo usando campo tipo)
      // Usamos sólo el campo 'tipo' ya que 'tipoId' se convierte a 'tipo_id' en SQL
      const relatedUbicaciones = await db.select().from(ubicaciones).where(
        eq(ubicaciones.tipo, String(id))
      );
      
      // NOTA: En esta base de datos solo existe el campo 'tipo', no hay 'tipo_id'
      // por lo que solo verificamos por tipo (ya hecho en la consulta anterior)
      console.log("DELETE /api/tipos-ubicaciones/:id - Ubicaciones relacionadas:", relatedUbicaciones.length);
      
      if (relatedUbicaciones.length > 0) {
        // Si hay ubicaciones usando este tipo, solo marcamos como inactivo
        console.log("DELETE /api/tipos-ubicaciones/:id - Marcando como inactivo por tener ubicaciones relacionadas");
        const [tipoActualizado] = await db.update(tiposUbicaciones)
          .set({ activo: false })
          .where(eq(tiposUbicaciones.id, id))
          .returning();
          
        if (!tipoActualizado) {
          return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
        }
        
        return res.json({ success: true, message: "Tipo de ubicación marcado como inactivo" });
      } else {
        // Si no hay ubicaciones relacionadas, eliminamos físicamente
        console.log("DELETE /api/tipos-ubicaciones/:id - Eliminando físicamente el tipo");
        const [eliminado] = await db.delete(tiposUbicaciones)
          .where(eq(tiposUbicaciones.id, id))
          .returning();
          
        if (!eliminado) {
          return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
        }
        
        return res.json({ success: true, message: "Tipo de ubicación eliminado correctamente" });
      }
    } catch (error) {
      console.error("DELETE /api/tipos-ubicaciones/:id Error:", error);
      res.status(500).json({ 
        message: "Error al eliminar tipo de ubicación",
        error: String(error)
      });
    }
  });
  
  // Ruta temporal para verificar la autenticación
  app.get("/api/test-auth", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        message: "Autenticado correctamente",
        user: {
          id: req.user.id,
          email: req.user.email,
          rol: req.user.rol,
          nombre: req.user.nombre
        },
        sessionId: req.sessionID
      });
    } else {
      res.status(401).json({
        message: "No autenticado",
        sessionExists: !!req.session,
        sessionId: req.sessionID
      });
    }
  });
  
  // Ruta especial para crear ubicaciones sin problemas de middleware
  app.post("/api/_create_ubicacion_direct", async (req, res) => {
    console.log("⭐ Recibiendo solicitud en _create_ubicacion_direct");
    
    try {
      // Validar los datos mínimos necesarios
      if (!req.body.latitud || !req.body.longitud || !req.body.tipo) {
        console.error("❌ Datos incompletos:", req.body);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write(JSON.stringify({ 
          success: false, 
          error: "Faltan datos requeridos (latitud, longitud, tipo)" 
        }));
        return res.end();
      }
      
      const ubicacionData = {
        latitud: parseFloat(req.body.latitud),
        longitud: parseFloat(req.body.longitud),
        tipo: req.body.tipo,
        fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
        observaciones: req.body.observaciones || ""
      };
      
      console.log("⭐ Datos de ubicación a guardar:", ubicacionData);
      
      // Guardar directamente en la base de datos
      const ubicacion = await storage.createUbicacion(ubicacionData);
      console.log("✅ Ubicación guardada exitosamente:", ubicacion);
      
      // Devolver respuesta como texto plano para evitar interferencias con middleware
      res.writeHead(201, { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.write(JSON.stringify({ 
        success: true, 
        data: ubicacion 
      }));
      res.end();
    } catch (error) {
      console.error("❌ Error al guardar ubicación:", error);
      res.writeHead(500, { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.write(JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido" 
      }));
      res.end();
    }
  });
  
  // Ruta de diagnóstico para ubicaciones relacionadas
  app.get("/api/debug/ubicaciones-relacionadas/:personaId", async (req, res) => {
    try {
      const personaId = parseInt(req.params.personaId);
      
      if (isNaN(personaId)) {
        return res.status(400).json({ error: "ID de persona inválido" });
      }
      
      // Obtener información de la persona
      const persona = await storage.getPersona(personaId);
      
      if (!persona) {
        return res.status(404).json({ error: "Persona no encontrada" });
      }
      
      // Consultar directamente las relaciones
      const relacionesResult = await db.execute(
        sql`SELECT * FROM personas_ubicaciones WHERE persona_id = ${personaId}`
      );
      
      // Obtener datos completos de las ubicaciones relacionadas
      const ubicacionesPromises = [];
      const relacionesArray = relacionesResult.rows || [];
      
      for (const relacion of relacionesArray) {
        // Asegurarse de que ubicacion_id sea un número
        const ubicacionId = typeof relacion.ubicacion_id === 'number' 
          ? relacion.ubicacion_id 
          : parseInt(relacion.ubicacion_id as string);
        
        if (!isNaN(ubicacionId)) {
          ubicacionesPromises.push(storage.getUbicacion(ubicacionId));
        }
      }
      
      const ubicaciones = await Promise.all(ubicacionesPromises);
      
      // Responder con los datos
      res.status(200).json({
        persona,
        relaciones: relacionesArray,
        ubicacionesDetalle: ubicaciones.filter(u => u) // Filtrar nulls
      });
    } catch (error) {
      console.error("Error al consultar ubicaciones relacionadas:", error);
      res.status(500).json({ error: "Error al consultar relaciones" });
    }
  });

  // Rutas de administración para tipos de inmuebles
  app.get("/api/admin/tipos-inmuebles", requireRole(["admin"]), async (req, res) => {
    try {
      const tiposInmuebles = await storage.getAllTiposInmuebles();
      res.json(tiposInmuebles);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de inmuebles" });
    }
  });

  app.get("/api/admin/tipos-inmuebles/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const tipoInmueble = await storage.getTipoInmueble(parseInt(req.params.id));
      if (!tipoInmueble) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
      }
      res.json(tipoInmueble);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipo de inmueble" });
    }
  });

  app.post("/api/admin/tipos-inmuebles", requireRole(["admin"]), async (req, res) => {
    try {
      const tipoInmuebleData = insertTipoInmuebleSchema.parse(req.body);
      const tipoInmueble = await storage.createTipoInmueble(tipoInmuebleData);
      res.status(201).json(tipoInmueble);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear tipo de inmueble" });
    }
  });

  app.put("/api/admin/tipos-inmuebles/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tipoInmuebleData = insertTipoInmuebleSchema.partial().parse(req.body);
      const tipoInmueble = await storage.updateTipoInmueble(id, tipoInmuebleData);
      
      if (!tipoInmueble) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
      }
      
      res.json(tipoInmueble);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar tipo de inmueble" });
    }
  });

  app.delete("/api/admin/tipos-inmuebles/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteTipoInmueble(id);
      
      if (!result) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado o no se pudo eliminar" });
      }
      
      res.json({ message: "Tipo de inmueble eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar tipo de inmueble" });
    }
  });

  // Rutas de administración para tipos de ubicaciones
  app.get("/api/admin/tipos-ubicaciones", requireRole(["admin"]), async (req, res) => {
    try {
      const tiposUbicaciones = await storage.getAllTiposUbicaciones();
      res.json(tiposUbicaciones);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones" });
    }
  });

  app.get("/api/admin/tipos-ubicaciones/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const tipoUbicacion = await storage.getTipoUbicacion(parseInt(req.params.id));
      if (!tipoUbicacion) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
      }
      res.json(tipoUbicacion);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipo de ubicación" });
    }
  });

  app.post("/api/admin/tipos-ubicaciones", requireRole(["admin"]), async (req, res) => {
    try {
      const tipoUbicacionData = insertTipoUbicacionSchema.parse(req.body);
      const tipoUbicacion = await storage.createTipoUbicacion(tipoUbicacionData);
      res.status(201).json(tipoUbicacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear tipo de ubicación" });
    }
  });

  app.put("/api/admin/tipos-ubicaciones/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tipoUbicacionData = insertTipoUbicacionSchema.partial().parse(req.body);
      const tipoUbicacion = await storage.updateTipoUbicacion(id, tipoUbicacionData);
      
      if (!tipoUbicacion) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
      }
      
      res.json(tipoUbicacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar tipo de ubicación" });
    }
  });

  app.delete("/api/admin/tipos-ubicaciones/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteTipoUbicacion(id);
      
      if (!result) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado o no se pudo eliminar" });
      }
      
      res.json({ message: "Tipo de ubicación eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar tipo de ubicación" });
    }
  });

  // Rutas para obtener tipos de inmuebles y ubicaciones (accesibles por todos los roles)
  app.get("/api/tipos-inmuebles", async (req, res) => {
    try {
      console.log("GET /api/tipos-inmuebles: Obteniendo tipos de inmuebles activos");
      // Solo retornamos los tipos activos para estas rutas públicas
      const tipos = await db.select().from(tiposInmuebles)
        .where(eq(tiposInmuebles.activo, true))
        .orderBy(tiposInmuebles.nombre);
      console.log("GET /api/tipos-inmuebles: Tipos activos encontrados:", tipos.length);
      res.json(tipos);
    } catch (error) {
      console.error("GET /api/tipos-inmuebles Error:", error);
      res.status(500).json({ message: "Error al obtener tipos de inmuebles", error: String(error) });
    }
  });

  app.get("/api/tipos-ubicaciones", async (req, res) => {
    try {
      console.log("GET /api/tipos-ubicaciones: Obteniendo tipos de ubicaciones activos");
      // Solo retornamos los tipos activos para estas rutas públicas
      const tipos = await db.select().from(tiposUbicaciones)
        .where(eq(tiposUbicaciones.activo, true))
        .orderBy(tiposUbicaciones.nombre);
      console.log("GET /api/tipos-ubicaciones: Tipos activos encontrados:", tipos.length);
      res.json(tipos);
    } catch (error) {
      console.error("GET /api/tipos-ubicaciones Error:", error);
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
