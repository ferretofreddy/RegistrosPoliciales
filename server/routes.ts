import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { 
  insertPersonaSchema, insertVehiculoSchema, insertInmuebleSchema, insertUbicacionSchema,
  insertPersonaObservacionSchema, insertVehiculoObservacionSchema, insertInmuebleObservacionSchema
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
      uptime: process.uptime()
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
      
      const resultados = await storage.buscar(query.toString(), tiposArray as string[]);
      res.json(resultados);
    } catch (error) {
      res.status(500).json({ message: "Error al realizar la búsqueda" });
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
      
      // Normalizar tipos (convertir singular a plural para consistencia con storage)
      let tipoNormalizado = tipo;
      
      // Convertir a plural si está en singular
      if (tipo === "persona") tipoNormalizado = "personas";
      if (tipo === "vehiculo") tipoNormalizado = "vehiculos";
      if (tipo === "inmueble") tipoNormalizado = "inmuebles";
      if (tipo === "ubicacion") tipoNormalizado = "ubicaciones";
      
      console.log(`Obteniendo relaciones para: ${tipo}(${id}), normalizado a: ${tipoNormalizado}(${id})`);
      
      const relaciones = await storage.getRelaciones(tipoNormalizado, parseInt(id));
      res.json(relaciones);
    } catch (error) {
      console.error("Error al obtener relaciones:", error);
      res.status(500).json({ message: "Error al obtener relaciones" });
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
        ubicacionesPromises.push(storage.getUbicacion(relacion.ubicacion_id));
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

  const httpServer = createServer(app);
  return httpServer;
}
