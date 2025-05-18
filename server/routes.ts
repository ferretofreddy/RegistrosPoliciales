import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { db, pool } from "./db";
import { 
  users, personas, vehiculos, inmuebles,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones,
  insertPersonaSchema, insertVehiculoSchema, insertInmuebleSchema,
  insertPersonaObservacionSchema, insertVehiculoObservacionSchema, insertInmuebleObservacionSchema,
  ubicaciones, insertUbicacionSchema,
  ubicacionesObservaciones, insertUbicacionObservacionSchema,
  tiposInmuebles, tiposUbicaciones,
  personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones,
  vehiculosUbicaciones, inmueblesUbicaciones,
  insertTipoInmuebleSchema, insertTipoUbicacionSchema
} from "@shared/schema";

// Definir un tipo para el usuario autenticado basado en el objeto req.user
interface User {
  id: number;
  email: string;
  nombre?: string;
  rol?: string;
}

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
        platform: process.platform
      }
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
  // === PERSONAS ===
  app.get("/api/personas", async (req, res) => {
    try {
      const allPersonas = await db.select().from(personas).orderBy(personas.nombre);
      res.json(allPersonas);
    } catch (error) {
      console.error("Error al obtener personas:", error);
      res.status(500).json({ message: "Error al obtener personas" });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const [persona] = await db.select().from(personas).where(eq(personas.id, id));
      
      if (!persona) {
        return res.status(404).json({ message: "Persona no encontrada" });
      }
      
      res.json(persona);
    } catch (error) {
      console.error("Error al obtener persona:", error);
      res.status(500).json({ message: "Error al obtener persona" });
    }
  });

  app.post("/api/personas", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const result = insertPersonaSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de persona inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      // El manejo de arrays se hace ahora dentro de storage.createPersona
      const persona = await storage.createPersona(result.data);
      
      res.status(201).json(persona);
    } catch (error) {
      console.error("Error al crear persona:", error);
      res.status(500).json({ message: "Error al crear persona" });
    }
  });

  app.post("/api/personas/:id/observaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      if (isNaN(personaId)) {
        return res.status(400).json({ message: "ID de persona inválido" });
      }
      
      // Verificar que existe la persona
      const [persona] = await db.select().from(personas).where(eq(personas.id, personaId));
      if (!persona) {
        return res.status(404).json({ message: "Persona no encontrada" });
      }
      
      // Agregar el usuario autenticado a la observación
      const user = req.user as User;
      console.log("Usuario autenticado:", `ID=${user.id}, Nombre=${user.nombre}, Rol=${user.rol}`);
      
      const result = insertPersonaObservacionSchema.safeParse({
        ...req.body,
        personaId,
        usuario: user.nombre || `Usuario ${user.id}`
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de observación inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente 
      const observacion = await storage.createPersonaObservacion(result.data);
      
      res.status(201).json(observacion);
    } catch (error) {
      console.error("Error al crear observación de persona:", error);
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  app.get("/api/personas/:id/observaciones", async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      if (isNaN(personaId)) {
        return res.status(400).json({ message: "ID de persona inválido" });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      const observaciones = await storage.getPersonaObservaciones(personaId);
      
      res.json(observaciones);
    } catch (error) {
      console.error("Error al obtener observaciones de persona:", error);
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });

  // === VEHÍCULOS ===
  app.get("/api/vehiculos", async (req, res) => {
    try {
      // Usamos SQL para especificar exactamente las columnas que queremos
      const query = `
        SELECT id, placa, marca, modelo, color, tipo, observaciones, foto
        FROM vehiculos
        ORDER BY placa
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
      res.status(500).json({ message: "Error al obtener vehículos" });
    }
  });

  app.get("/api/vehiculos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Usamos SQL para especificar exactamente las columnas que queremos
      const query = `
        SELECT id, placa, marca, modelo, color, tipo, observaciones, foto
        FROM vehiculos
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener vehículo:", error);
      res.status(500).json({ message: "Error al obtener vehículo" });
    }
  });

  app.post("/api/vehiculos", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const result = insertVehiculoSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de vehículo inválidos", 
          errors: result.error.format() 
        });
      }
      
      const [vehiculo] = await db.insert(vehiculos).values(result.data).returning();
      
      res.status(201).json(vehiculo);
    } catch (error) {
      console.error("Error al crear vehículo:", error);
      res.status(500).json({ message: "Error al crear vehículo" });
    }
  });

  app.post("/api/vehiculos/:id/observaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const vehiculoId = parseInt(req.params.id);
      if (isNaN(vehiculoId)) {
        return res.status(400).json({ message: "ID de vehículo inválido" });
      }
      
      // Verificar que existe el vehículo
      const [vehiculo] = await db.select().from(vehiculos).where(eq(vehiculos.id, vehiculoId));
      if (!vehiculo) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      
      // Agregar el usuario autenticado a la observación
      const user = req.user as User;
      
      const result = insertVehiculoObservacionSchema.safeParse({
        ...req.body,
        vehiculoId,
        usuario: user.nombre || `Usuario ${user.id}`
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de observación inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      const observacion = await storage.createVehiculoObservacion(result.data);
      
      res.status(201).json(observacion);
    } catch (error) {
      console.error("Error al crear observación de vehículo:", error);
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  app.get("/api/vehiculos/:id/observaciones", async (req, res) => {
    try {
      const vehiculoId = parseInt(req.params.id);
      if (isNaN(vehiculoId)) {
        return res.status(400).json({ message: "ID de vehículo inválido" });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      const observaciones = await storage.getVehiculoObservaciones(vehiculoId);
      
      res.json(observaciones);
    } catch (error) {
      console.error("Error al obtener observaciones de vehículo:", error);
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });

  // === INMUEBLES ===
  app.get("/api/inmuebles", async (req, res) => {
    try {
      // Usamos SQL para especificar exactamente las columnas que queremos
      const query = `
        SELECT id, tipo, direccion, propietario, observaciones, foto
        FROM inmuebles
        ORDER BY direccion
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener inmuebles:", error);
      res.status(500).json({ message: "Error al obtener inmuebles" });
    }
  });

  app.get("/api/inmuebles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Usamos SQL para especificar exactamente las columnas que queremos
      const query = `
        SELECT id, tipo, direccion, propietario, observaciones, foto
        FROM inmuebles
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Inmueble no encontrado" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener inmueble:", error);
      res.status(500).json({ message: "Error al obtener inmueble" });
    }
  });

  app.post("/api/inmuebles", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const result = insertInmuebleSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de inmueble inválidos", 
          errors: result.error.format() 
        });
      }
      
      const [inmueble] = await db.insert(inmuebles).values(result.data).returning();
      
      res.status(201).json(inmueble);
    } catch (error) {
      console.error("Error al crear inmueble:", error);
      res.status(500).json({ message: "Error al crear inmueble" });
    }
  });

  app.post("/api/inmuebles/:id/observaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const inmuebleId = parseInt(req.params.id);
      if (isNaN(inmuebleId)) {
        return res.status(400).json({ message: "ID de inmueble inválido" });
      }
      
      // Verificar que existe el inmueble
      const [inmueble] = await db.select().from(inmuebles).where(eq(inmuebles.id, inmuebleId));
      if (!inmueble) {
        return res.status(404).json({ message: "Inmueble no encontrado" });
      }
      
      // Agregar el usuario autenticado a la observación
      const user = req.user as User;
      
      const result = insertInmuebleObservacionSchema.safeParse({
        ...req.body,
        inmuebleId,
        usuario: user.nombre || `Usuario ${user.id}`
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de observación inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      const observacion = await storage.createInmuebleObservacion(result.data);
      
      res.status(201).json(observacion);
    } catch (error) {
      console.error("Error al crear observación de inmueble:", error);
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  app.get("/api/inmuebles/:id/observaciones", async (req, res) => {
    try {
      const inmuebleId = parseInt(req.params.id);
      if (isNaN(inmuebleId)) {
        return res.status(400).json({ message: "ID de inmueble inválido" });
      }
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      const observaciones = await storage.getInmuebleObservaciones(inmuebleId);
      
      res.json(observaciones);
    } catch (error) {
      console.error("Error al obtener observaciones de inmueble:", error);
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });

  // === UBICACIONES ===
  app.get("/api/ubicaciones", async (req, res) => {
    try {
      const allUbicaciones = await db.select().from(ubicaciones);
      res.json(allUbicaciones);
    } catch (error) {
      console.error("Error al obtener ubicaciones:", error);
      res.status(500).json({ message: "Error al obtener ubicaciones" });
    }
  });

  app.get("/api/ubicaciones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, id));
      
      if (!ubicacion) {
        return res.status(404).json({ message: "Ubicación no encontrada" });
      }
      
      res.json(ubicacion);
    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      res.status(500).json({ message: "Error al obtener ubicación" });
    }
  });

  app.post("/api/ubicaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      console.log("Creando ubicación con datos:", req.body);
      
      const result = insertUbicacionSchema.safeParse(req.body);
      
      if (!result.success) {
        console.error("Error de validación:", result.error.format());
        return res.status(400).json({ 
          message: "Datos de ubicación inválidos", 
          errors: result.error.format() 
        });
      }
      
      const [ubicacion] = await db.insert(ubicaciones).values({
        ...result.data,
        // Aseguramos que latitud y longitud sean números, no strings
        latitud: typeof result.data.latitud === 'string' ? parseFloat(result.data.latitud) : result.data.latitud,
        longitud: typeof result.data.longitud === 'string' ? parseFloat(result.data.longitud) : result.data.longitud
      }).returning();
      
      console.log("Ubicación creada exitosamente:", ubicacion);
      res.status(201).json(ubicacion);
    } catch (error) {
      console.error("Error al crear ubicación:", error);
      res.status(500).json({ message: "Error al crear ubicación" });
    }
  });

  app.post("/api/ubicaciones/:id/observaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const ubicacionId = parseInt(req.params.id);
      if (isNaN(ubicacionId)) {
        return res.status(400).json({ message: "ID de ubicación inválido" });
      }
      
      // Verificar que existe la ubicación
      const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, ubicacionId));
      if (!ubicacion) {
        return res.status(404).json({ message: "Ubicación no encontrada" });
      }
      
      // Agregar el usuario autenticado a la observación
      const user = req.user as User;
      
      const result = insertUbicacionObservacionSchema.safeParse({
        ...req.body,
        ubicacionId,
        usuario: user.nombre || `Usuario ${user.id}`
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de observación inválidos", 
          errors: result.error.format() 
        });
      }
      
      const [observacion] = await db.insert(ubicacionesObservaciones).values(result.data).returning();
      
      res.status(201).json(observacion);
    } catch (error) {
      console.error("Error al crear observación de ubicación:", error);
      res.status(500).json({ message: "Error al crear observación" });
    }
  });

  app.get("/api/ubicaciones/:id/observaciones", async (req, res) => {
    try {
      const ubicacionId = parseInt(req.params.id);
      if (isNaN(ubicacionId)) {
        return res.status(400).json({ message: "ID de ubicación inválido" });
      }
      
      const observaciones = await db.select()
        .from(ubicacionesObservaciones)
        .where(eq(ubicacionesObservaciones.ubicacionId, ubicacionId));
      
      res.json(observaciones);
    } catch (error) {
      console.error("Error al obtener observaciones de ubicación:", error);
      res.status(500).json({ message: "Error al obtener observaciones" });
    }
  });

  // === RELACIONES ===
  app.post("/api/relaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const { tipo1, id1, tipo2, id2 } = req.body;
      
      if (!tipo1 || !id1 || !tipo2 || !id2) {
        return res.status(400).json({ message: "Faltan datos para crear la relación" });
      }
      
      let resultado;
      
      // Relaciones entre persona y vehículo
      if (tipo1 === "persona" && tipo2 === "vehiculo") {
        const [relacion] = await db.insert(personasVehiculos).values({
          personaId: id1,
          vehiculoId: id2
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre persona e inmueble
      else if (tipo1 === "persona" && tipo2 === "inmueble") {
        const [relacion] = await db.insert(personasInmuebles).values({
          personaId: id1,
          inmuebleId: id2
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre personas
      else if (tipo1 === "persona" && tipo2 === "persona") {
        const [relacion] = await db.insert(personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre persona y ubicación
      else if (tipo1 === "persona" && tipo2 === "ubicacion") {
        const [relacion] = await db.insert(personasUbicaciones).values({
          personaId: id1,
          ubicacionId: id2
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre vehículo y ubicación
      else if (tipo1 === "vehiculo" && tipo2 === "ubicacion") {
        const [relacion] = await db.insert(vehiculosUbicaciones).values({
          vehiculoId: id1,
          ubicacionId: id2
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre inmueble y ubicación
      else if (tipo1 === "inmueble" && tipo2 === "ubicacion") {
        const [relacion] = await db.insert(inmueblesUbicaciones).values({
          inmuebleId: id1,
          ubicacionId: id2
        }).returning();
        resultado = relacion;
      }
      else {
        return res.status(400).json({ message: "Tipo de relación no soportada" });
      }
      
      res.status(201).json(resultado);
    } catch (error) {
      console.error("Error al crear relación:", error);
      res.status(500).json({ message: "Error al crear relación" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}