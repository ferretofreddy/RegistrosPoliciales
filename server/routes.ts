import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPersonaSchema, insertVehiculoSchema, insertInmuebleSchema, insertUbicacionSchema,
  insertPersonaObservacionSchema, insertVehiculoObservacionSchema, insertInmuebleObservacionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);

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
        
        // Si tipos es un string (común cuando viene como query param), dividirlo por comas
        if (typeof tipos === 'string' && tipos.includes(',')) {
          tiposArray = tipos.split(',').map(t => t.trim());
          console.log(`DEBUG - Procesando tipos (string con comas): ${tipos} -> Array de ${tiposArray.length} elementos: [${tiposArray.join(', ')}]`);
        } 
        // Si tipos es un array, usarlo directamente
        else if (Array.isArray(tipos)) {
          tiposArray = tipos;
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
        
        console.log(`DEBUG - Tipos finales para la búsqueda: [${tiposArray.join(', ')}]`);
        
        const resultados = await storage.buscarUbicacionesConCoordenadas(buscar.toString(), tiposArray);
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
      const ubicacionData = insertUbicacionSchema.parse(req.body);
      const ubicacion = await storage.createUbicacion(ubicacionData);
      res.status(201).json(ubicacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear ubicación" });
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
      
      const relacion = await storage.crearRelacion(tipo1, parseInt(id1), tipo2, parseInt(id2));
      res.status(201).json(relacion);
    } catch (error) {
      res.status(500).json({ message: "Error al crear relación" });
    }
  });

  app.get("/api/relaciones/:tipo/:id", async (req, res) => {
    try {
      const { tipo, id } = req.params;
      const relaciones = await storage.getRelaciones(tipo, parseInt(id));
      res.json(relaciones);
    } catch (error) {
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
  
  // Ruta alternativa para crear ubicaciones sin filtros de autenticación
  app.post("/api/_create_ubicacion_direct", (req, res) => {
    console.log("⭐ Recibiendo solicitud para crear ubicación directa");
    console.log("Body recibido:", req.body);
    
    try {
      // Verificar si tenemos datos válidos
      if (!req.body.latitud || !req.body.longitud || !req.body.tipo) {
        console.log("❌ Datos incompletos:", Object.keys(req.body));
        return res.status(400).send(JSON.stringify({ 
          success: false,
          error: "Datos incompletos", 
          requeridos: "latitud, longitud, tipo",
          recibidos: Object.keys(req.body).join(", ")
        }));
      }
      
      const ubicacionData = {
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        tipo: req.body.tipo,
        fecha: req.body.fecha || new Date(),
        observaciones: req.body.observaciones || ""
      };
      
      console.log("✅ Intentando crear ubicación con datos:", ubicacionData);
      
      // IMPORTANTE: Hacer esto de manera síncrona para evitar problemas
      storage.createUbicacion(ubicacionData)
        .then(ubicacion => {
          console.log("✅ Ubicación creada exitosamente:", ubicacion);
          // Usar res.send en lugar de res.json para evitar interferencia con middleware
          res.status(201);
          // Establecer encabezado antes de enviar cualquier dato
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          // Enviar respuesta plana para evitar procesamiento
          res.end(JSON.stringify({
            success: true,
            data: ubicacion
          }));
        })
        .catch(err => {
          console.error("❌ Error al crear ubicación:", err);
          res.status(500);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : "Error desconocido"
          }));
        });
    } catch (error) {
      console.error("❌ Error en el procesamiento:", error);
      res.status(500);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      }));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
