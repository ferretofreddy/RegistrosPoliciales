import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./database-storage";
import { z } from "zod";
import { eq, or, sql, like, and } from "drizzle-orm";
import { db, pool } from "./db";
import { 
  users, personas, vehiculos, inmuebles,
  personasObservaciones, vehiculosObservaciones, inmueblesObservaciones,
  insertPersonaSchema, insertVehiculoSchema, insertInmuebleSchema,
  insertPersonaObservacionSchema, insertVehiculoObservacionSchema, insertInmuebleObservacionSchema,
  ubicaciones, insertUbicacionSchema,
  ubicacionesObservaciones, insertUbicacionObservacionSchema,
  personasVehiculos, personasInmuebles, personasPersonas, personasUbicaciones,
  vehiculosUbicaciones, inmueblesUbicaciones, vehiculosInmuebles, vehiculosVehiculos,
  inmueblesInmuebles, ubicacionesUbicaciones,
  tiposInmuebles, tiposUbicaciones, posicionesEstructura,
  insertTipoInmuebleSchema, insertTipoUbicacionSchema, insertPosicionEstructuraSchema
} from "@shared/schema";
import { registerChatRoutes } from "./routes-chat";

// Definir un tipo para el usuario autenticado basado en el objeto req.user
interface User {
  id: number;
  email: string;
  nombre?: string;
  rol?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación ANTES de registrar rutas
  setupAuth(app);
  
  // Registrar rutas de chat después de configurar autenticación
  registerChatRoutes(app);
  
  // Middleware para verificar autenticación
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "No autenticado" });
  };
  
  // Middleware para verificar rol de administrador y estado activo
  const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    // Verificar si el usuario está activo
    if (req.user?.activo === "false") {
      console.log(`ERROR: Usuario inactivo (ID=${req.user.id}) intenta acceder a ruta de administrador`);
      return res.status(403).json({ 
        message: "ACCESO RESTRINGIDO: Este usuario no tiene acceso al sistema, por favor comuníquese con el administrador de la aplicación." 
      });
    }
    
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador." });
    }
    
    next();
  };
  // setup auth routes
  setupAuth(app);
  
  // Chat routes are already registered above
  
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

  // Middleware to check user role and active status
  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      console.log("ERROR: Usuario no autenticado al intentar acceder a ruta protegida");
      return res.status(401).json({ message: "No autorizado. Inicie sesión para continuar." });
    }
    
    console.log(`Usuario autenticado: ID=${req.user.id}, Nombre=${req.user.nombre}, Rol=${req.user.rol}, Activo=${req.user.activo}`);
    
    // Verificar si el usuario está activo
    if (req.user.activo === "false") {
      console.log(`ERROR: Usuario inactivo (ID=${req.user.id}) intenta acceder a ruta protegida`);
      return res.status(403).json({ 
        message: "ACCESO RESTRINGIDO: Este usuario no tiene acceso al sistema, por favor comuníquese con el administrador de la aplicación." 
      });
    }
    
    // Verificar el rol del usuario
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
  
  // Obtener vehículos relacionados con una persona
  app.get("/api/personas/:id/vehiculos", async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      
      const relacionesVehiculos = await db
        .select({
          vehiculo: vehiculos
        })
        .from(personasVehiculos)
        .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
        .where(eq(personasVehiculos.personaId, personaId));
      
      const vehiculosRelacionados = relacionesVehiculos.map(r => r.vehiculo);
      res.json(vehiculosRelacionados);
    } catch (error) {
      console.error("Error al obtener vehículos relacionados:", error);
      res.status(500).json({ message: "Error al obtener vehículos relacionados" });
    }
  });
  
  // Obtener inmuebles relacionados con una persona
  app.get("/api/personas/:id/inmuebles", async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      
      const relacionesInmuebles = await db
        .select({
          inmueble: inmuebles
        })
        .from(personasInmuebles)
        .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
        .where(eq(personasInmuebles.personaId, personaId));
      
      const inmueblesRelacionados = relacionesInmuebles.map(r => r.inmueble);
      res.json(inmueblesRelacionados);
    } catch (error) {
      console.error("Error al obtener inmuebles relacionados:", error);
      res.status(500).json({ message: "Error al obtener inmuebles relacionados" });
    }
  });

  app.get("/api/personas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const persona = await storage.getPersona(id);
      
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
      console.log("Datos recibidos en req.body:", req.body);
      const result = insertPersonaSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log("Error de validación:", result.error.format());
        return res.status(400).json({ 
          message: "Datos de persona inválidos", 
          errors: result.error.format() 
        });
      }
      
      console.log("Datos validados:", result.data);
      
      // Utilizamos la función de almacenamiento en lugar de consultar la base de datos directamente
      // El manejo de arrays se hace ahora dentro de storage.createPersona
      const persona = await storage.createPersona(result.data);
      
      res.status(201).json(persona);
    } catch (error) {
      console.error("Error al crear persona:", error);
      
      // Manejar errores específicos de validación de unicidad
      if (error instanceof Error && error.message.includes("ya se encuentra registrado")) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Error al crear persona" });
    }
  });

  app.put("/api/personas/:id", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de persona inválido" });
      }

      // Verificar que la persona existe
      const [existingPersona] = await db.select().from(personas).where(eq(personas.id, id));
      if (!existingPersona) {
        return res.status(404).json({ message: "Persona no encontrada" });
      }

      const result = insertPersonaSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos de persona inválidos", 
          errors: result.error.format() 
        });
      }

      // Actualizar la persona
      const [updatedPersona] = await db.update(personas)
        .set({
          ...result.data,
          alias: result.data.alias || [],
          telefonos: result.data.telefonos || [],
          domicilios: result.data.domicilios || []
        })
        .where(eq(personas.id, id))
        .returning();

      res.json(updatedPersona);
    } catch (error) {
      console.error("Error al actualizar persona:", error);
      res.status(500).json({ message: "Error al actualizar persona" });
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
      
      const vehiculo = await storage.createVehiculo(result.data);
      
      res.status(201).json(vehiculo);
    } catch (error) {
      console.error("Error al crear vehículo:", error);
      
      // Manejar errores específicos de validación de unicidad
      if (error instanceof Error && error.message.includes("ya se encuentra registrado")) {
        return res.status(400).json({ message: error.message });
      }
      
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
      console.log("[DEBUG] Iniciando consulta completa de ubicaciones para página ubicaciones");
      
      const resultado = {
        ubicacionesDirectas: [],
        ubicacionesRelacionadas: []
      };

      // 1. UBICACIONES DIRECTAS
      // Todas las ubicaciones con coordenadas válidas
      const ubicacionesDirectasResult = await db.execute(
        sql`SELECT * FROM ubicaciones 
            WHERE latitud IS NOT NULL 
            AND longitud IS NOT NULL
            ORDER BY id`
      );
      
      console.log(`[DEBUG] Ubicaciones directas encontradas: ${ubicacionesDirectasResult.rows.length}`);
      resultado.ubicacionesDirectas = ubicacionesDirectasResult.rows || [];

      // 2. UBICACIONES RELACIONADAS 
      // Solo ubicaciones que NO sean domicilios ni inmuebles, relacionadas con otras entidades
      const ubicacionesRelacionadasResult = await db.execute(
        sql`SELECT DISTINCT u.*, 'vehiculo' as entidad_tipo, 
                   CONCAT(v.marca, ' ', v.modelo, ' (', v.placa, ')') as entidad_nombre
            FROM ubicaciones u
            JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
            JOIN vehiculos v ON vu.vehiculo_id = v.id
            WHERE u.latitud IS NOT NULL 
            AND u.longitud IS NOT NULL
            AND LOWER(u.tipo) != 'domicilio'
            AND LOWER(u.tipo) NOT LIKE '%domicilio%'
            AND LOWER(u.tipo) != 'inmueble'
            AND LOWER(u.tipo) NOT LIKE '%inmueble%'
            ORDER BY u.id`
      );
      
      console.log(`[DEBUG] Ubicaciones relacionadas (no domicilios/inmuebles) encontradas: ${ubicacionesRelacionadasResult.rows.length}`);

      // Combinar ubicaciones relacionadas (excluyendo domicilios e inmuebles)
      resultado.ubicacionesRelacionadas = ubicacionesRelacionadasResult.rows || [];

      console.log(`[DEBUG] Total ubicaciones directas: ${resultado.ubicacionesDirectas.length}`);
      console.log(`[DEBUG] Total ubicaciones relacionadas: ${resultado.ubicacionesRelacionadas.length}`);
      
      res.json(resultado);
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
      console.log("Creando ubicación con datos:", JSON.stringify(req.body));
      
      // Verificar si los datos tienen el formato esperado
      if (!req.body.latitud || !req.body.longitud) {
        console.error("Faltan coordenadas en los datos enviados");
        return res.status(400).json({ message: "Faltan coordenadas (latitud o longitud)" });
      }
      
      let latitudValue = req.body.latitud;
      let longitudValue = req.body.longitud;
      
      // Asegurarse de que latitud y longitud sean números
      if (typeof latitudValue === 'string') {
        latitudValue = parseFloat(latitudValue);
      }
      
      if (typeof longitudValue === 'string') {
        longitudValue = parseFloat(longitudValue);
      }
      
      console.log(`Coordenadas convertidas: Lat=${latitudValue}, Lng=${longitudValue}`);
      
      if (isNaN(latitudValue) || isNaN(longitudValue)) {
        console.error(`Error: Coordenadas inválidas: Lat=${latitudValue}, Lng=${longitudValue}`);
        return res.status(400).json({ message: "Coordenadas inválidas" });
      }
      
      // Crear la ubicación directamente sin pasar por el schema
      const query = `
        INSERT INTO ubicaciones (latitud, longitud, tipo, observaciones)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const valores = [
        latitudValue,
        longitudValue,
        req.body.tipo || "Sin especificar",
        req.body.observaciones || null
      ];
      
      console.log("Ejecutando query con valores:", valores);
      
      const result = await pool.query(query, valores);
      const ubicacion = result.rows[0];
      
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
      
      console.log(`[DEBUG] Creando observación para ubicación ${ubicacionId}`);
      console.log(`[DEBUG] Datos recibidos:`, req.body);
      
      // Verificar que existe la ubicación
      const [ubicacion] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, ubicacionId));
      if (!ubicacion) {
        return res.status(404).json({ message: "Ubicación no encontrada" });
      }
      
      // Agregar el usuario autenticado a la observación
      const user = req.user as User;
      
      // Validación básica de campos requeridos
      if (!req.body.detalle || req.body.detalle.trim() === '') {
        return res.status(400).json({ 
          message: "El detalle de la observación es requerido" 
        });
      }

      // Crear observación directamente
      const fechaFinal = req.body.fecha ? new Date(req.body.fecha) : new Date();
      
      const datosObservacion = {
        ubicacionId,
        detalle: req.body.detalle.trim(),
        usuario: user.nombre || `Usuario ${user.id}`,
        fecha: fechaFinal
      };
      
      console.log(`[DEBUG] Creando observación con datos:`, datosObservacion);
      
      const [observacion] = await db.insert(ubicacionesObservaciones).values(datosObservacion).returning();
      
      console.log(`[DEBUG] Observación creada exitosamente:`, observacion);
      
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
  
  // Endpoint para crear múltiples relaciones para una ubicación
  app.post("/api/ubicaciones/:id/relaciones", requireRole(["admin", "investigador"]), async (req, res) => {
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
      
      // Registrar el usuario que realiza la acción
      const user = req.user as User;
      console.log(`Usuario ${user.nombre || user.id} creando relaciones para ubicación ${ubicacionId}`);
      
      // Extraer los IDs de las entidades a relacionar
      const { personas = [], vehiculos = [], inmuebles = [] } = req.body;
      console.log(`Creando relaciones para ubicación ${ubicacionId}:`, { personas, vehiculos, inmuebles });
      
      // Contadores para verificar resultados
      let personasCreadas = 0;
      let vehiculosCreados = 0;
      let inmueblesCreados = 0;
      
      // Crear relaciones con personas
      if (Array.isArray(personas) && personas.length > 0) {
        for (const personaId of personas) {
          try {
            // Verificar si la persona existe usando SQL directo para evitar conflicto de nombres
            const resultado = await pool.query(
              `SELECT id FROM personas WHERE id = $1 LIMIT 1`, [personaId]
            );
            
            if (!resultado.rows || resultado.rows.length === 0) {
              console.warn(`Persona con ID ${personaId} no encontrada, omitiendo relación`);
              continue;
            }
            
            // Insertar la relación
            await db.insert(personasUbicaciones).values({
              personaId,
              ubicacionId
            });
            
            personasCreadas++;
          } catch (error) {
            console.error(`Error al crear relación con persona ${personaId}:`, error);
          }
        }
      }
      
      // Crear relaciones con vehículos
      if (Array.isArray(vehiculos) && vehiculos.length > 0) {
        for (const vehiculoId of vehiculos) {
          try {
            // Verificar si el vehículo existe usando SQL directo
            const resultado = await pool.query(
              `SELECT id FROM vehiculos WHERE id = $1 LIMIT 1`, [vehiculoId]
            );
            
            if (!resultado.rows || resultado.rows.length === 0) {
              console.warn(`Vehículo con ID ${vehiculoId} no encontrado, omitiendo relación`);
              continue;
            }
            
            // Insertar la relación
            await db.insert(vehiculosUbicaciones).values({
              vehiculoId,
              ubicacionId
            });
            
            vehiculosCreados++;
          } catch (error) {
            console.error(`Error al crear relación con vehículo ${vehiculoId}:`, error);
          }
        }
      }
      
      // Crear relaciones con inmuebles
      if (Array.isArray(inmuebles) && inmuebles.length > 0) {
        for (const inmuebleId of inmuebles) {
          try {
            // Verificar si el inmueble existe usando SQL directo
            const resultado = await pool.query(
              `SELECT id FROM inmuebles WHERE id = $1 LIMIT 1`, [inmuebleId]
            );
            
            if (!resultado.rows || resultado.rows.length === 0) {
              console.warn(`Inmueble con ID ${inmuebleId} no encontrado, omitiendo relación`);
              continue;
            }
            
            // Insertar la relación
            await db.insert(inmueblesUbicaciones).values({
              inmuebleId,
              ubicacionId
            });
            
            inmueblesCreados++;
          } catch (error) {
            console.error(`Error al crear relación con inmueble ${inmuebleId}:`, error);
          }
        }
      }
      
      // Responder con un resumen de las relaciones creadas
      res.status(200).json({
        ubicacionId,
        relacionesCreadas: {
          personas: personasCreadas,
          vehiculos: vehiculosCreados,
          inmuebles: inmueblesCreados
        }
      });
    } catch (error) {
      console.error("Error al crear relaciones para ubicación:", error);
      res.status(500).json({ message: "Error al crear relaciones" });
    }
  });

  // === TIPOS DE INMUEBLES ===
  // Obtener todos los tipos de inmuebles (público)
  app.get("/api/tipos-inmuebles", async (req, res) => {
    try {
      const allTipos = await db.select().from(tiposInmuebles).orderBy(tiposInmuebles.nombre);
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de inmuebles:", error);
      res.status(500).json({ message: "Error al obtener tipos de inmuebles" });
    }
  });

  // Obtener todos los tipos de inmuebles (admin)
  app.get("/api/tipos-inmuebles-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const allTipos = await db.select().from(tiposInmuebles).orderBy(tiposInmuebles.nombre);
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de inmuebles para admin:", error);
      res.status(500).json({ message: "Error al obtener tipos de inmuebles" });
    }
  });

  // Crear nuevo tipo de inmueble (admin)
  app.post("/api/tipos-inmuebles-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const { nombre, descripcion, activo } = req.body;
      
      if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }
      
      // Verificar si ya existe un tipo con ese nombre
      const existingTipo = await db
        .select()
        .from(tiposInmuebles)
        .where(eq(tiposInmuebles.nombre, nombre))
        .limit(1);
      
      if (existingTipo.length > 0) {
        return res.status(400).json({ message: "Ya existe un tipo de inmueble con ese nombre" });
      }
      
      const [nuevoTipo] = await db.insert(tiposInmuebles)
        .values({ 
          nombre, 
          descripcion: descripcion || "", 
          activo: activo ? "true" : "false" 
        })
        .returning();
      
      res.status(201).json(nuevoTipo);
    } catch (error) {
      console.error("Error al crear tipo de inmueble:", error);
      res.status(500).json({ message: "Error al crear tipo de inmueble" });
    }
  });

  // Actualizar tipo de inmueble existente (admin)
  app.put("/api/tipos-inmuebles-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion, activo } = req.body;
      
      if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }
      
      // Verificar si el tipo existe
      const tipoExistente = await db
        .select()
        .from(tiposInmuebles)
        .where(eq(tiposInmuebles.id, id))
        .limit(1);
      
      if (tipoExistente.length === 0) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
      }
      
      // Verificar si el nuevo nombre ya está en uso por otro registro
      if (nombre !== tipoExistente[0].nombre) {
        const nombreExistente = await db
          .select()
          .from(tiposInmuebles)
          .where(eq(tiposInmuebles.nombre, nombre))
          .limit(1);
        
        if (nombreExistente.length > 0 && nombreExistente[0].id !== id) {
          return res.status(400).json({ message: "Ya existe otro tipo de inmueble con ese nombre" });
        }
      }
      
      const [tipoActualizado] = await db.update(tiposInmuebles)
        .set({ 
          nombre, 
          descripcion: descripcion || "",
          activo: activo ? "true" : "false"
        })
        .where(eq(tiposInmuebles.id, id))
        .returning();
      
      res.json(tipoActualizado);
    } catch (error) {
      console.error("Error al actualizar tipo de inmueble:", error);
      res.status(500).json({ message: "Error al actualizar tipo de inmueble" });
    }
  });

  // Eliminar tipo de inmueble (admin)
  app.delete("/api/tipos-inmuebles-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar si el tipo existe
      const tipoExistente = await db
        .select()
        .from(tiposInmuebles)
        .where(eq(tiposInmuebles.id, id))
        .limit(1);
      
      if (tipoExistente.length === 0) {
        return res.status(404).json({ message: "Tipo de inmueble no encontrado" });
      }
      
      // Eliminar el tipo
      await db.delete(tiposInmuebles)
        .where(eq(tiposInmuebles.id, id));
      
      res.json({ message: "Tipo de inmueble eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar tipo de inmueble:", error);
      res.status(500).json({ message: "Error al eliminar tipo de inmueble" });
    }
  });

  // === TIPOS DE UBICACIONES ===
  // Obtener todos los tipos de ubicaciones (público)
  app.get("/api/tipos-ubicaciones", async (req, res) => {
    try {
      const allTipos = await db.select().from(tiposUbicaciones).orderBy(tiposUbicaciones.nombre);
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de ubicaciones:", error);
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones" });
    }
  });
  
  // Obtener todos los tipos de ubicaciones (admin)
  app.get("/api/tipos-ubicaciones-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const allTipos = await db.select().from(tiposUbicaciones).orderBy(tiposUbicaciones.nombre);
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de ubicaciones para admin:", error);
      res.status(500).json({ message: "Error al obtener tipos de ubicaciones" });
    }
  });
  
  // Crear nuevo tipo de ubicación (admin)
  app.post("/api/tipos-ubicaciones-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const { nombre, descripcion, activo } = req.body;
      
      if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }
      
      // Verificar si ya existe un tipo con ese nombre
      const existingTipo = await db
        .select()
        .from(tiposUbicaciones)
        .where(eq(tiposUbicaciones.nombre, nombre))
        .limit(1);
      
      if (existingTipo.length > 0) {
        return res.status(400).json({ message: "Ya existe un tipo de ubicación con ese nombre" });
      }
      
      const [nuevoTipo] = await db.insert(tiposUbicaciones)
        .values({ 
          nombre, 
          descripcion: descripcion || "", 
          activo: activo ? "true" : "false" 
        })
        .returning();
      
      res.status(201).json(nuevoTipo);
    } catch (error) {
      console.error("Error al crear tipo de ubicación:", error);
      res.status(500).json({ message: "Error al crear tipo de ubicación" });
    }
  });
  
  // Actualizar tipo de ubicación existente (admin)
  app.put("/api/tipos-ubicaciones-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion, activo } = req.body;
      
      if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }
      
      // Verificar si el tipo existe
      const tipoExistente = await db
        .select()
        .from(tiposUbicaciones)
        .where(eq(tiposUbicaciones.id, id))
        .limit(1);
      
      if (tipoExistente.length === 0) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
      }
      
      // Verificar si el nuevo nombre ya está en uso por otro registro
      if (nombre !== tipoExistente[0].nombre) {
        const nombreExistente = await db
          .select()
          .from(tiposUbicaciones)
          .where(eq(tiposUbicaciones.nombre, nombre))
          .limit(1);
        
        if (nombreExistente.length > 0 && nombreExistente[0].id !== id) {
          return res.status(400).json({ message: "Ya existe otro tipo de ubicación con ese nombre" });
        }
      }
      
      const [tipoActualizado] = await db.update(tiposUbicaciones)
        .set({ 
          nombre, 
          descripcion: descripcion || "",
          activo: activo ? "true" : "false"
        })
        .where(eq(tiposUbicaciones.id, id))
        .returning();
      
      res.json(tipoActualizado);
    } catch (error) {
      console.error("Error al actualizar tipo de ubicación:", error);
      res.status(500).json({ message: "Error al actualizar tipo de ubicación" });
    }
  });
  
  // Eliminar tipo de ubicación (admin)
  app.delete("/api/tipos-ubicaciones-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar si el tipo existe
      const tipoExistente = await db
        .select()
        .from(tiposUbicaciones)
        .where(eq(tiposUbicaciones.id, id))
        .limit(1);
      
      if (tipoExistente.length === 0) {
        return res.status(404).json({ message: "Tipo de ubicación no encontrado" });
      }
      
      // Eliminar el tipo
      await db.delete(tiposUbicaciones)
        .where(eq(tiposUbicaciones.id, id));
      
      res.json({ message: "Tipo de ubicación eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar tipo de ubicación:", error);
      res.status(500).json({ message: "Error al eliminar tipo de ubicación" });
    }
  });
  
  // === POSICIONES ESTRUCTURA (ADMIN) ===
  // Obtener todas las posiciones de estructura (admin)
  app.get("/api/posiciones-estructura-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const posiciones = await storage.getAllPosicionesEstructura();
      res.json(posiciones);
    } catch (error) {
      console.error("Error al obtener posiciones de estructura:", error);
      res.status(500).json({ message: "Error al obtener posiciones de estructura" });
    }
  });

  // Obtener todas las posiciones de estructura (para formularios)
  app.get("/api/posiciones-estructura", ensureAuthenticated, async (req, res) => {
    try {
      const posiciones = await storage.getAllPosicionesEstructura();
      res.json(posiciones);
    } catch (error) {
      console.error("Error al obtener posiciones de estructura:", error);
      res.status(500).json({ message: "Error al obtener posiciones de estructura" });
    }
  });

  // Crear nueva posición de estructura (admin)
  app.post("/api/posiciones-estructura-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;
      
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ message: "El nombre es requerido" });
      }
      
      const nuevaPosicion = await storage.createPosicionEstructura({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      });
      
      res.status(201).json(nuevaPosicion);
    } catch (error) {
      console.error("Error al crear posición de estructura:", error);
      res.status(500).json({ message: "Error al crear posición de estructura" });
    }
  });

  // Actualizar posición de estructura (admin)
  app.put("/api/posiciones-estructura-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion } = req.body;
      
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ message: "El nombre es requerido" });
      }
      
      const posicionActualizada = await storage.updatePosicionEstructura(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null
      });
      
      if (!posicionActualizada) {
        return res.status(404).json({ message: "Posición de estructura no encontrada" });
      }
      
      res.json(posicionActualizada);
    } catch (error) {
      console.error("Error al actualizar posición de estructura:", error);
      res.status(500).json({ message: "Error al actualizar posición de estructura" });
    }
  });

  // Eliminar posición de estructura (admin)
  app.delete("/api/posiciones-estructura-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const eliminado = await storage.deletePosicionEstructura(id);
      
      if (!eliminado) {
        return res.status(400).json({ 
          message: "No se puede eliminar la posición porque hay personas asociadas a ella" 
        });
      }
      
      res.json({ message: "Posición de estructura eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar posición de estructura:", error);
      res.status(500).json({ message: "Error al eliminar posición de estructura" });
    }
  });

  // Actualizar posición de estructura de una persona
  app.patch("/api/personas/:id/posicion", ensureAuthenticated, async (req, res) => {
    try {
      const personaId = parseInt(req.params.id);
      const { posicion } = req.body;
      
      console.log(`[PATCH /api/personas/${personaId}/posicion] Datos recibidos:`, { posicion });
      
      if (isNaN(personaId)) {
        return res.status(400).json({ message: "ID de persona inválido" });
      }
      
      if (!posicion || typeof posicion !== 'string') {
        return res.status(400).json({ message: "La posición es requerida" });
      }
      
      // Actualizar la posición en la base de datos
      const result = await db
        .update(personas)
        .set({ posicionEstructura: posicion })
        .where(eq(personas.id, personaId))
        .returning();
      
      if (!result.length) {
        return res.status(404).json({ message: "Persona no encontrada" });
      }
      
      console.log(`[PATCH /api/personas/${personaId}/posicion] Actualización exitosa:`, result[0]);
      res.json({ message: "Posición actualizada correctamente", persona: result[0] });
    } catch (error) {
      console.error("Error al actualizar posición de persona:", error);
      res.status(500).json({ message: "Error al actualizar posición de persona" });
    }
  });

  // Eliminar relaciones entre entidades
  app.delete("/api/relaciones/:tipoOrigen/:idOrigen/:tipoDestino/:idDestino", ensureAuthenticated, async (req, res) => {
    try {
      const { tipoOrigen, idOrigen, tipoDestino, idDestino } = req.params;
      
      console.log(`[DELETE] Eliminando relación:`, { 
        tipoOrigen, 
        idOrigen: parseInt(idOrigen), 
        tipoDestino, 
        idDestino: parseInt(idDestino) 
      });
      
      const id1 = parseInt(idOrigen);
      const id2 = parseInt(idDestino);
      
      if (isNaN(id1) || isNaN(id2)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }
      
      // Normalizar los tipos para evitar problemas de espacios o caracteres especiales
      const tipoOrigenNorm = tipoOrigen.trim().toLowerCase();
      const tipoDestinoNorm = tipoDestino.trim().toLowerCase();
      
      console.log(`[DELETE] Evaluando caso: ${tipoOrigenNorm} → ${tipoDestinoNorm}`);
      
      // Determinar qué tabla de relación usar y eliminar
      let deleteResult;
      
      if (tipoOrigenNorm === "persona" && tipoDestinoNorm === "vehiculo") {
        deleteResult = await db.delete(personasVehiculos)
          .where(and(
            eq(personasVehiculos.personaId, id1),
            eq(personasVehiculos.vehiculoId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "vehiculo" && tipoDestinoNorm === "persona") {
        deleteResult = await db.delete(personasVehiculos)
          .where(and(
            eq(personasVehiculos.personaId, id2),
            eq(personasVehiculos.vehiculoId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "persona" && tipoDestinoNorm === "inmueble") {
        deleteResult = await db.delete(personasInmuebles)
          .where(and(
            eq(personasInmuebles.personaId, id1),
            eq(personasInmuebles.inmuebleId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "inmueble" && tipoDestinoNorm === "persona") {
        deleteResult = await db.delete(personasInmuebles)
          .where(and(
            eq(personasInmuebles.personaId, id2),
            eq(personasInmuebles.inmuebleId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "persona" && tipoDestinoNorm === "ubicacion") {
        deleteResult = await db.delete(personasUbicaciones)
          .where(and(
            eq(personasUbicaciones.personaId, id1),
            eq(personasUbicaciones.ubicacionId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "ubicacion" && tipoDestinoNorm === "persona") {
        deleteResult = await db.delete(personasUbicaciones)
          .where(and(
            eq(personasUbicaciones.personaId, id2),
            eq(personasUbicaciones.ubicacionId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "persona" && tipoDestinoNorm === "persona") {
        // Para relaciones persona-persona, pueden estar en cualquier orden
        deleteResult = await db.delete(personasPersonas)
          .where(or(
            and(
              eq(personasPersonas.personaId1, id1),
              eq(personasPersonas.personaId2, id2)
            ),
            and(
              eq(personasPersonas.personaId1, id2),
              eq(personasPersonas.personaId2, id1)
            )
          ))
          .returning();
      } else if (tipoOrigenNorm === "vehiculo" && tipoDestinoNorm === "vehiculo") {
        // Para relaciones vehiculo-vehiculo, pueden estar en cualquier orden
        deleteResult = await db.delete(vehiculosVehiculos)
          .where(or(
            and(
              eq(vehiculosVehiculos.vehiculoId1, id1),
              eq(vehiculosVehiculos.vehiculoId2, id2)
            ),
            and(
              eq(vehiculosVehiculos.vehiculoId1, id2),
              eq(vehiculosVehiculos.vehiculoId2, id1)
            )
          ))
          .returning();
      } else if (tipoOrigenNorm === "vehiculo" && tipoDestinoNorm === "inmueble") {
        deleteResult = await db.delete(vehiculosInmuebles)
          .where(and(
            eq(vehiculosInmuebles.vehiculoId, id1),
            eq(vehiculosInmuebles.inmuebleId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "inmueble" && tipoDestinoNorm === "vehiculo") {
        deleteResult = await db.delete(vehiculosInmuebles)
          .where(and(
            eq(vehiculosInmuebles.vehiculoId, id2),
            eq(vehiculosInmuebles.inmuebleId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "vehiculo" && tipoDestinoNorm === "ubicacion") {
        deleteResult = await db.delete(vehiculosUbicaciones)
          .where(and(
            eq(vehiculosUbicaciones.vehiculoId, id1),
            eq(vehiculosUbicaciones.ubicacionId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "ubicacion" && tipoDestinoNorm === "vehiculo") {
        deleteResult = await db.delete(vehiculosUbicaciones)
          .where(and(
            eq(vehiculosUbicaciones.vehiculoId, id2),
            eq(vehiculosUbicaciones.ubicacionId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "inmueble" && tipoDestinoNorm === "inmueble") {
        // Para relaciones inmueble-inmueble, pueden estar en cualquier orden
        deleteResult = await db.delete(inmueblesInmuebles)
          .where(or(
            and(
              eq(inmueblesInmuebles.inmuebleId1, id1),
              eq(inmueblesInmuebles.inmuebleId2, id2)
            ),
            and(
              eq(inmueblesInmuebles.inmuebleId1, id2),
              eq(inmueblesInmuebles.inmuebleId2, id1)
            )
          ))
          .returning();
      } else if (tipoOrigenNorm === "inmueble" && tipoDestinoNorm === "ubicacion") {
        deleteResult = await db.delete(inmueblesUbicaciones)
          .where(and(
            eq(inmueblesUbicaciones.inmuebleId, id1),
            eq(inmueblesUbicaciones.ubicacionId, id2)
          ))
          .returning();
      } else if (tipoOrigenNorm === "ubicacion" && tipoDestinoNorm === "inmueble") {
        deleteResult = await db.delete(inmueblesUbicaciones)
          .where(and(
            eq(inmueblesUbicaciones.inmuebleId, id2),
            eq(inmueblesUbicaciones.ubicacionId, id1)
          ))
          .returning();
      } else if (tipoOrigenNorm === "ubicacion" && tipoDestinoNorm === "ubicacion") {
        // Para relaciones ubicacion-ubicacion, pueden estar en cualquier orden
        deleteResult = await db.delete(ubicacionesUbicaciones)
          .where(or(
            and(
              eq(ubicacionesUbicaciones.ubicacionId1, id1),
              eq(ubicacionesUbicaciones.ubicacionId2, id2)
            ),
            and(
              eq(ubicacionesUbicaciones.ubicacionId1, id2),
              eq(ubicacionesUbicaciones.ubicacionId2, id1)
            )
          ))
          .returning();
      } else {
        console.log(`[DELETE] ERROR: Caso no encontrado para: "${tipoOrigen}" → "${tipoDestino}"`);
        console.log(`[DELETE] tipoOrigen type: ${typeof tipoOrigen}, value: '${tipoOrigen}'`);
        console.log(`[DELETE] tipoDestino type: ${typeof tipoDestino}, value: '${tipoDestino}'`);
        return res.status(400).json({ message: "Tipo de relación no válido" });
      }
      
      console.log(`[DELETE] Registros eliminados:`, deleteResult);
      
      if (!deleteResult || deleteResult.length === 0) {
        return res.status(404).json({ message: "Relación no encontrada o ya eliminada" });
      }
      
      console.log(`[DELETE] Relación eliminada exitosamente`);
      res.json({ message: "Relación eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar relación:", error);
      res.status(500).json({ message: "Error al eliminar relación" });
    }
  });
  
  // === ADMINISTRACION DE USUARIOS ===
  // Obtener todos los usuarios (solo admin)
  app.get("/api/admin/users", requireRole(["admin"]), async (req, res) => {
    try {
      const allUsers = await db.select().from(users).orderBy(users.nombre);
      res.json(allUsers);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });
  
  // Crear nuevo usuario (solo admin)
  app.post("/api/admin/users", requireRole(["admin"]), async (req, res) => {
    try {
      // Verificar si el email ya existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, req.body.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }
      
      // Hashear la contraseña
      const hashedPassword = await hashPassword(req.body.password);
      
      // Crear el usuario
      const [newUser] = await db.insert(users).values({
        email: req.body.email,
        password: hashedPassword,
        nombre: req.body.nombre,
        cedula: req.body.cedula || "",
        telefono: req.body.telefono || "",
        unidad: req.body.unidad || "",
        rol: req.body.rol || "agente",
        activo: req.body.activo || "false"
      }).returning();
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ message: "Error al crear usuario" });
    }
  });
  
  // Actualizar usuario (solo admin)
  app.put("/api/admin/users/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      // Actualizar el usuario
      const [updatedUser] = await db
        .update(users)
        .set({
          nombre: req.body.nombre,
          email: req.body.email,
          cedula: req.body.cedula,
          telefono: req.body.telefono,
          unidad: req.body.unidad,
          rol: req.body.rol,
          activo: req.body.activo
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json({ message: "Error al actualizar usuario" });
    }
  });
  
  // Cambiar contraseña de usuario (solo admin)
  app.put("/api/admin/users/:id/password", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      // Hashear la nueva contraseña
      const hashedPassword = await hashPassword(req.body.password);
      
      // Actualizar la contraseña
      const [updatedUser] = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      res.status(500).json({ message: "Error al cambiar contraseña" });
    }
  });
  
  // Eliminar usuario (solo admin)
  app.delete("/api/admin/users/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      // No permitir eliminar al propio usuario administrador
      if (userId === req.user.id) {
        return res.status(400).json({ message: "No puede eliminar su propia cuenta" });
      }
      
      const deleteResult = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      
      if (!deleteResult.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ message: "Error al eliminar usuario" });
    }
  });

  // === CONSULTA DE RELACIONES ===
  // Endpoint para consultar todas las relaciones de una entidad 
  app.get("/api/relaciones/:tipo/:id", async (req, res) => {
    try {
      const tipo = req.params.tipo;
      const id = parseInt(req.params.id);
      
      if (!tipo || isNaN(id)) {
        return res.status(400).json({ message: "Faltan datos para consultar relaciones" });
      }
      
      const relaciones = {
        personas: [],
        vehiculos: [],
        inmuebles: [],
        ubicaciones: [],
        otrasUbicaciones: []
      };
      
      // Obtener personas relacionadas
      if (tipo === "persona") {
        // Las personas relacionadas con esta persona (búsqueda bidireccional)
        // Consulta SQL directa para incluir tipos de identificación
        const relacionesPersonas1Result = await pool.query(`
          SELECT p.id, p.nombre, p.identificacion, p.alias, p.telefonos, p.domicilios, 
                 p.foto, p.posicion_estructura, p.tipo_identificacion_id,
                 ti.tipo as tipo_identificacion
          FROM personas_personas pp
          INNER JOIN personas p ON pp.persona_id_2 = p.id
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE pp.persona_id_1 = $1
        `, [id]);
          
        const relacionesPersonas2Result = await pool.query(`
          SELECT p.id, p.nombre, p.identificacion, p.alias, p.telefonos, p.domicilios, 
                 p.foto, p.posicion_estructura, p.tipo_identificacion_id,
                 ti.tipo as tipo_identificacion
          FROM personas_personas pp
          INNER JOIN personas p ON pp.persona_id_1 = p.id
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE pp.persona_id_2 = $1
        `, [id]);
          
        // Combinar los resultados de ambas direcciones y formatear
        const personasRelacionadas = [
          ...relacionesPersonas1Result.rows.map(persona => ({
            ...persona,
            alias: persona.alias || [],
            telefonos: persona.telefonos || [],
            domicilios: persona.domicilios || [],
            posicionEstructura: persona.posicion_estructura,
            tipoIdentificacionId: persona.tipo_identificacion_id,
            tipoIdentificacion: persona.tipo_identificacion
          })),
          ...relacionesPersonas2Result.rows.map(persona => ({
            ...persona,
            alias: persona.alias || [],
            telefonos: persona.telefonos || [],
            domicilios: persona.domicilios || [],
            posicionEstructura: persona.posicion_estructura,
            tipoIdentificacionId: persona.tipo_identificacion_id,
            tipoIdentificacion: persona.tipo_identificacion
          }))
        ];
        
        relaciones.personas = personasRelacionadas;
        
        // Vehículos relacionados con esta persona
        const relacionesVehiculos = await db
          .select({
            vehiculo: vehiculos
          })
          .from(personasVehiculos)
          .innerJoin(vehiculos, eq(personasVehiculos.vehiculoId, vehiculos.id))
          .where(eq(personasVehiculos.personaId, id));
          
        relaciones.vehiculos = relacionesVehiculos.map(r => r.vehiculo);
        
        // Inmuebles relacionados con esta persona
        const relacionesInmuebles = await db
          .select({
            inmueble: inmuebles
          })
          .from(personasInmuebles)
          .innerJoin(inmuebles, eq(personasInmuebles.inmuebleId, inmuebles.id))
          .where(eq(personasInmuebles.personaId, id));
          
        relaciones.inmuebles = relacionesInmuebles.map(r => r.inmueble);
        
        // Ubicaciones relacionadas con esta persona - SEPARADAS POR TIPO
        // 1. Domicilios (ubicaciones directas)
        const domiciliosResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
              WHERE pu.persona_id = ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
              AND (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')`
        );
        
        const domicilios = domiciliosResult.rows || [];
        console.log(`[DEBUG] Domicilios directos encontrados (routes): ${domicilios.length}`);
        
        // 2. Otras ubicaciones (avistamientos, etc.) - excluyendo domicilios e inmuebles
        const otrasUbicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN personas_ubicaciones pu ON u.id = pu.ubicacion_id
              WHERE pu.persona_id = ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
              AND NOT (u.tipo ILIKE '%domicilio%' OR u.tipo = 'Domicilio')
              AND NOT (u.tipo ILIKE '%inmueble%' OR u.tipo = 'Inmueble')`
        );
        
        const otrasUbicaciones = otrasUbicacionesResult.rows || [];
        console.log(`[DEBUG] Otras ubicaciones encontradas (routes): ${otrasUbicaciones.length}`);
        
        // Asignar solo las otras ubicaciones (avistamientos, etc.) NO domicilios
        relaciones.ubicaciones = otrasUbicaciones;
        
        // Los domicilios se manejan por separado en el frontend
        relaciones.domicilios = domicilios;
      }
      else if (tipo === "vehiculo") {
        // Personas relacionadas con este vehículo - usando SQL directo
        const relacionesPersonasResult = await pool.query(`
          SELECT p.id, p.nombre, p.identificacion, p.alias, p.telefonos, p.domicilios, 
                 p.foto, p.posicion_estructura, p.tipo_identificacion_id,
                 ti.tipo as tipo_identificacion
          FROM personas_vehiculos pv
          INNER JOIN personas p ON pv.persona_id = p.id
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE pv.vehiculo_id = $1
        `, [id]);
          
        relaciones.personas = relacionesPersonasResult.rows.map(persona => ({
          ...persona,
          alias: persona.alias || [],
          telefonos: persona.telefonos || [],
          domicilios: persona.domicilios || [],
          posicionEstructura: persona.posicion_estructura,
          tipoIdentificacionId: persona.tipo_identificacion_id,
          tipoIdentificacion: persona.tipo_identificacion
        }));
        
        // Otros vehículos relacionados con este vehículo
        const relacionesVehiculos = await db.execute(
          sql`SELECT v.* FROM vehiculos v 
              INNER JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_2 
              WHERE vv.vehiculo_id_1 = ${id}
              UNION
              SELECT v.* FROM vehiculos v 
              INNER JOIN vehiculos_vehiculos vv ON v.id = vv.vehiculo_id_1 
              WHERE vv.vehiculo_id_2 = ${id}`
        );
          
        relaciones.vehiculos = relacionesVehiculos.rows;
        
        // Inmuebles relacionados con este vehículo
        const relacionesInmuebles = await db.execute(
          sql`SELECT i.* FROM inmuebles i 
              INNER JOIN vehiculos_inmuebles vi ON i.id = vi.inmueble_id 
              WHERE vi.vehiculo_id = ${id}`
        );
          
        relaciones.inmuebles = relacionesInmuebles.rows;
        
        // Ubicaciones relacionadas con este vehículo (consideradas directas)
        const ubicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
              WHERE vu.vehiculo_id = ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
        );
        
        const ubicaciones = ubicacionesResult.rows || [];
        console.log(`[DEBUG] Ubicaciones de vehículo encontradas (routes): ${ubicaciones.length}`);
        
        // Asignar solo ubicaciones relacionadas que NO sean domicilios ni inmuebles
        relaciones.ubicaciones = ubicaciones.filter(u => 
          !(u.tipo && (u.tipo.toLowerCase().includes('domicilio') || u.tipo.toLowerCase().includes('inmueble')))
        );
        relaciones.ubicacionesDirectas = ubicaciones.filter(u => 
          u.tipo && (u.tipo.toLowerCase().includes('domicilio') || u.tipo.toLowerCase().includes('inmueble'))
        );
      }
      else if (tipo === "inmueble") {
        // Personas relacionadas con este inmueble - usando SQL directo
        const relacionesPersonasResult = await pool.query(`
          SELECT p.id, p.nombre, p.identificacion, p.alias, p.telefonos, p.domicilios, 
                 p.foto, p.posicion_estructura, p.tipo_identificacion_id,
                 ti.tipo as tipo_identificacion
          FROM personas_inmuebles pi
          INNER JOIN personas p ON pi.persona_id = p.id
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE pi.inmueble_id = $1
        `, [id]);
          
        relaciones.personas = relacionesPersonasResult.rows.map(persona => ({
          ...persona,
          alias: persona.alias || [],
          telefonos: persona.telefonos || [],
          domicilios: persona.domicilios || [],
          posicionEstructura: persona.posicion_estructura,
          tipoIdentificacionId: persona.tipo_identificacion_id,
          tipoIdentificacion: persona.tipo_identificacion
        }));
        
        // Vehículos relacionados con este inmueble
        const relacionesVehiculos = await db.execute(
          sql`SELECT v.* FROM vehiculos v 
              INNER JOIN vehiculos_inmuebles vi ON v.id = vi.vehiculo_id 
              WHERE vi.inmueble_id = ${id}`
        );
          
        relaciones.vehiculos = relacionesVehiculos.rows;
        
        // Otros inmuebles relacionados con este inmueble
        const relacionesInmuebles = await db.execute(
          sql`SELECT i.* FROM inmuebles i 
              INNER JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_2 
              WHERE ii.inmueble_id_1 = ${id}
              UNION
              SELECT i.* FROM inmuebles i 
              INNER JOIN inmuebles_inmuebles ii ON i.id = ii.inmueble_id_1 
              WHERE ii.inmueble_id_2 = ${id}`
        );
          
        relaciones.inmuebles = relacionesInmuebles.rows;
        
        // Ubicaciones relacionadas con este inmueble - SEPARADAS POR TIPO
        // 1. Ubicaciones directas (tipo "inmueble")
        const ubicacionesDirectasResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
              AND (LOWER(u.tipo) = 'inmueble' OR LOWER(u.tipo) LIKE '%inmueble%')`
        );
        
        const ubicacionesDirectas = ubicacionesDirectasResult.rows || [];
        console.log(`[DEBUG] Ubicaciones directas tipo inmueble encontradas (routes): ${ubicacionesDirectas.length}`);
        
        // 2. Otras ubicaciones relacionadas (excluyendo domicilios e inmuebles)
        const otrasUbicacionesResult = await db.execute(
          sql`SELECT u.* FROM ubicaciones u
              JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
              WHERE iu.inmueble_id = ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
              AND LOWER(u.tipo) != 'inmueble'
              AND LOWER(u.tipo) NOT LIKE '%inmueble%'
              AND LOWER(u.tipo) != 'domicilio'
              AND LOWER(u.tipo) NOT LIKE '%domicilio%'`
        );
        
        const otrasUbicaciones = otrasUbicacionesResult.rows || [];
        console.log(`[DEBUG] Otras ubicaciones relacionadas encontradas (routes): ${otrasUbicaciones.length}`);
        
        // Asignar solo las otras ubicaciones (avistamientos, etc.) NO ubicaciones directas
        relaciones.ubicaciones = otrasUbicaciones;
        
        // Las ubicaciones directas del inmueble se manejan por separado en el frontend
        relaciones.ubicacionesDirectas = ubicacionesDirectas;
      }
      else if (tipo === "ubicacion") {
        // Personas relacionadas con esta ubicación - usando SQL directo
        const relacionesPersonasResult = await pool.query(`
          SELECT p.id, p.nombre, p.identificacion, p.alias, p.telefonos, p.domicilios, 
                 p.foto, p.posicion_estructura, p.tipo_identificacion_id,
                 ti.tipo as tipo_identificacion
          FROM personas_ubicaciones pu
          INNER JOIN personas p ON pu.persona_id = p.id
          LEFT JOIN tipos_identificacion ti ON p.tipo_identificacion_id = ti.id
          WHERE pu.ubicacion_id = $1
        `, [id]);
          
        relaciones.personas = relacionesPersonasResult.rows.map(persona => ({
          ...persona,
          alias: persona.alias || [],
          telefonos: persona.telefonos || [],
          domicilios: persona.domicilios || [],
          posicionEstructura: persona.posicion_estructura,
          tipoIdentificacionId: persona.tipo_identificacion_id,
          tipoIdentificacion: persona.tipo_identificacion
        }));
        
        // Vehículos relacionados con esta ubicación
        const relacionesVehiculos = await db
          .select({
            vehiculo: vehiculos
          })
          .from(vehiculosUbicaciones)
          .innerJoin(vehiculos, eq(vehiculosUbicaciones.vehiculoId, vehiculos.id))
          .where(eq(vehiculosUbicaciones.ubicacionId, id));
          
        relaciones.vehiculos = relacionesVehiculos.map(r => r.vehiculo);
        
        // Inmuebles relacionados con esta ubicación
        const relacionesInmuebles = await db
          .select({
            inmueble: inmuebles
          })
          .from(inmueblesUbicaciones)
          .innerJoin(inmuebles, eq(inmueblesUbicaciones.inmuebleId, inmuebles.id))
          .where(eq(inmueblesUbicaciones.ubicacionId, id));
          
        relaciones.inmuebles = relacionesInmuebles.map(r => r.inmueble);
        
        // Verificar el tipo de esta ubicación
        const [ubicacionActual] = await db.select().from(ubicaciones).where(eq(ubicaciones.id, id));
        if (ubicacionActual) {
          const tipoUbicacion = (ubicacionActual.tipo || "").toLowerCase();
          console.log(`[DEBUG] Verificando tipo de ubicación ID ${id}: ${tipoUbicacion}`);
          
          // Aplicar filtros solo si es una ubicación tipo "ubicacion" (no domicilio ni inmueble)
          let filtroSQL = sql`SELECT DISTINCT u.* FROM ubicaciones u
              JOIN ubicaciones_ubicaciones uu ON (u.id = uu.ubicacion_id_1 OR u.id = uu.ubicacion_id_2)
              WHERE (uu.ubicacion_id_1 = ${id} OR uu.ubicacion_id_2 = ${id})
              AND u.id != ${id}
              AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`;
          
          // Solo aplicar filtro de exclusión si la ubicación actual no es domicilio ni inmueble
          if (tipoUbicacion !== "domicilio" && !tipoUbicacion.includes("domicilio") && 
              tipoUbicacion !== "inmueble" && !tipoUbicacion.includes("inmueble")) {
            filtroSQL = sql`SELECT DISTINCT u.* FROM ubicaciones u
                JOIN ubicaciones_ubicaciones uu ON (u.id = uu.ubicacion_id_1 OR u.id = uu.ubicacion_id_2)
                WHERE (uu.ubicacion_id_1 = ${id} OR uu.ubicacion_id_2 = ${id})
                AND u.id != ${id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL
                AND LOWER(u.tipo) != 'domicilio'
                AND LOWER(u.tipo) NOT LIKE '%domicilio%'
                AND LOWER(u.tipo) != 'inmueble'
                AND LOWER(u.tipo) NOT LIKE '%inmueble%'`;
          }
          
          const otrasUbicacionesResult = await db.execute(filtroSQL);
          
          const otrasUbicaciones = otrasUbicacionesResult.rows || [];
          console.log(`[DEBUG] Otras ubicaciones relacionadas encontradas: ${otrasUbicaciones.length}`);
          
          // Todas las ubicaciones relacionadas van en otrasUbicaciones
          relaciones.otrasUbicaciones = otrasUbicaciones;
          
          // Para una ubicación, no hay ubicaciones directas (son ella misma)
          relaciones.ubicaciones = [];
        }
      }
      
      res.json(relaciones);
    } catch (error) {
      console.error("Error al consultar relaciones:", error);
      res.status(500).json({ message: "Error al consultar relaciones" });
    }
  });

  // === CREACIÓN DE RELACIONES ===
  
  // Endpoint para crear relaciones usando path params (usado por el cliente)
  app.post("/api/relaciones/:tipo1/:id1/:tipo2/:id2", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const tipo1 = req.params.tipo1;
      const id1 = parseInt(req.params.id1);
      const tipo2 = req.params.tipo2;
      const id2 = parseInt(req.params.id2);
      
      if (!tipo1 || isNaN(id1) || !tipo2 || isNaN(id2)) {
        return res.status(400).json({ message: "Faltan datos o formato incorrecto para crear la relación" });
      }
      
      // Procesamos la misma lógica que el endpoint general
      let resultado;
      
      // Relaciones entre persona y vehículo (ambas direcciones)
      if ((tipo1 === "persona" && tipo2 === "vehiculo") || (tipo1 === "vehiculo" && tipo2 === "persona")) {
        let personaId, vehiculoId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          vehiculoId = id2;
        } else {
          personaId = id2;
          vehiculoId = id1;
        }
        
        const [relacion] = await db.insert(personasVehiculos).values({
          personaId: personaId,
          vehiculoId: vehiculoId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre persona e inmueble (ambas direcciones)
      else if ((tipo1 === "persona" && tipo2 === "inmueble") || (tipo1 === "inmueble" && tipo2 === "persona")) {
        let personaId, inmuebleId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          inmuebleId = id2;
        } else {
          personaId = id2;
          inmuebleId = id1;
        }
        
        const [relacion] = await db.insert(personasInmuebles).values({
          personaId: personaId,
          inmuebleId: inmuebleId
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
      // Relaciones entre persona y ubicación (ambas direcciones)
      else if ((tipo1 === "persona" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "persona")) {
        let personaId, ubicacionId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          ubicacionId = id2;
        } else {
          personaId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(personasUbicaciones).values({
          personaId: personaId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre vehículo y ubicación (ambas direcciones)
      else if ((tipo1 === "vehiculo" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "vehiculo")) {
        let vehiculoId, ubicacionId;
        
        if (tipo1 === "vehiculo") {
          vehiculoId = id1;
          ubicacionId = id2;
        } else {
          vehiculoId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(vehiculosUbicaciones).values({
          vehiculoId: vehiculoId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre inmueble y ubicación (ambas direcciones)
      else if ((tipo1 === "inmueble" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "inmueble")) {
        let inmuebleId, ubicacionId;
        
        if (tipo1 === "inmueble") {
          inmuebleId = id1;
          ubicacionId = id2;
        } else {
          inmuebleId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(inmueblesUbicaciones).values({
          inmuebleId: inmuebleId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre vehículo e inmueble (ambas direcciones)
      else if ((tipo1 === "vehiculo" && tipo2 === "inmueble") || (tipo1 === "inmueble" && tipo2 === "vehiculo")) {
        // Usar SQL directo para evitar problemas con Drizzle
        let vehiculoId, inmuebleId;
        
        if (tipo1 === "vehiculo") {
          vehiculoId = id1;
          inmuebleId = id2;
        } else {
          vehiculoId = id2;
          inmuebleId = id1;
        }
        
        const result = await db.execute(
          sql`INSERT INTO vehiculos_inmuebles (vehiculo_id, inmueble_id) VALUES (${vehiculoId}, ${inmuebleId}) RETURNING *`
        );
        resultado = result.rows[0];
      }
      // Relaciones entre vehículos
      else if (tipo1 === "vehiculo" && tipo2 === "vehiculo") {
        // Usar SQL directo para evitar problemas con Drizzle
        const result = await db.execute(
          sql`INSERT INTO vehiculos_vehiculos (vehiculo_id_1, vehiculo_id_2) VALUES (${id1}, ${id2}) RETURNING *`
        );
        resultado = result.rows[0];
      }
      // Relaciones entre inmuebles
      else if (tipo1 === "inmueble" && tipo2 === "inmueble") {
        // Primero, crearemos la tabla si no existe
        await db.execute(
          sql`CREATE TABLE IF NOT EXISTS inmuebles_inmuebles (
            id SERIAL PRIMARY KEY,
            inmueble_id_1 INTEGER NOT NULL REFERENCES inmuebles(id),
            inmueble_id_2 INTEGER NOT NULL REFERENCES inmuebles(id)
          )`
        );
        // Luego, insertamos la relación
        const result = await db.execute(
          sql`INSERT INTO inmuebles_inmuebles (inmueble_id_1, inmueble_id_2) VALUES (${id1}, ${id2}) RETURNING *`
        );
        resultado = result.rows[0];
      }
      else {
        return res.status(400).json({ message: "Tipo de relación no soportada" });
      }
      
      res.status(200).json(resultado);
    } catch (error) {
      console.error("Error al crear relación:", error);
      res.status(500).json({ message: "Error al crear relación" });
    }
  });

  // Endpoint para crear relaciones usando body (usado por el cliente)
  app.post("/api/relaciones", requireRole(["admin", "investigador"]), async (req, res) => {
    try {
      const { tipo1, id1, tipo2, id2 } = req.body;
      
      if (!tipo1 || !id1 || !tipo2 || !id2) {
        return res.status(400).json({ message: "Faltan datos para crear la relación" });
      }
      
      let resultado;
      
      // Relaciones entre persona e inmueble (ambas direcciones)
      if ((tipo1 === "persona" && tipo2 === "inmueble") || (tipo1 === "inmueble" && tipo2 === "persona")) {
        let personaId, inmuebleId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          inmuebleId = id2;
        } else {
          personaId = id2;
          inmuebleId = id1;
        }
        
        // Verificar si la relación ya existe usando SQL directo
        const relacionExistente = await db.execute(
          sql`SELECT * FROM personas_inmuebles WHERE persona_id = ${personaId} AND inmueble_id = ${inmuebleId} LIMIT 1`
        );
        
        if (relacionExistente.rows.length > 0) {
          return res.status(400).json({ 
            message: "La relación entre esta persona e inmueble ya existe" 
          });
        }
        
        const [relacion] = await db.insert(personasInmuebles).values({
          personaId: personaId,
          inmuebleId: inmuebleId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre persona y vehículo (ambas direcciones)
      else if ((tipo1 === "persona" && tipo2 === "vehiculo") || (tipo1 === "vehiculo" && tipo2 === "persona")) {
        let personaId, vehiculoId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          vehiculoId = id2;
        } else {
          personaId = id2;
          vehiculoId = id1;
        }
        
        // Verificar si la relación ya existe usando SQL directo
        const relacionExistente = await db.execute(
          sql`SELECT * FROM personas_vehiculos WHERE persona_id = ${personaId} AND vehiculo_id = ${vehiculoId} LIMIT 1`
        );
        
        if (relacionExistente.rows.length > 0) {
          return res.status(400).json({ 
            message: "La relación entre esta persona y vehículo ya existe" 
          });
        }
        
        const [relacion] = await db.insert(personasVehiculos).values({
          personaId: personaId,
          vehiculoId: vehiculoId
        }).returning();
        resultado = relacion;
      }
      // Otras relaciones (sin validación de duplicados por ahora)
      else if (tipo1 === "persona" && tipo2 === "persona") {
        const [relacion] = await db.insert(personasPersonas).values({
          personaId1: id1,
          personaId2: id2
        }).returning();
        resultado = relacion;
      }
      else if ((tipo1 === "persona" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "persona")) {
        let personaId, ubicacionId;
        
        if (tipo1 === "persona") {
          personaId = id1;
          ubicacionId = id2;
        } else {
          personaId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(personasUbicaciones).values({
          personaId: personaId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      else if ((tipo1 === "vehiculo" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "vehiculo")) {
        let vehiculoId, ubicacionId;
        
        if (tipo1 === "vehiculo") {
          vehiculoId = id1;
          ubicacionId = id2;
        } else {
          vehiculoId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(vehiculosUbicaciones).values({
          vehiculoId: vehiculoId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      else if ((tipo1 === "inmueble" && tipo2 === "ubicacion") || (tipo1 === "ubicacion" && tipo2 === "inmueble")) {
        let inmuebleId, ubicacionId;
        
        if (tipo1 === "inmueble") {
          inmuebleId = id1;
          ubicacionId = id2;
        } else {
          inmuebleId = id2;
          ubicacionId = id1;
        }
        
        const [relacion] = await db.insert(inmueblesUbicaciones).values({
          inmuebleId: inmuebleId,
          ubicacionId: ubicacionId
        }).returning();
        resultado = relacion;
      }
      // Relaciones entre vehículo e inmueble (ambas direcciones)
      else if ((tipo1 === "vehiculo" && tipo2 === "inmueble") || (tipo1 === "inmueble" && tipo2 === "vehiculo")) {
        let vehiculoId, inmuebleId;
        
        if (tipo1 === "vehiculo") {
          vehiculoId = id1;
          inmuebleId = id2;
        } else {
          vehiculoId = id2;
          inmuebleId = id1;
        }
        
        const result = await db.execute(
          sql`INSERT INTO vehiculos_inmuebles (vehiculo_id, inmueble_id) VALUES (${vehiculoId}, ${inmuebleId}) RETURNING *`
        );
        resultado = result.rows[0];
      }
      // Relaciones entre vehículos
      else if (tipo1 === "vehiculo" && tipo2 === "vehiculo") {
        const result = await db.execute(
          sql`INSERT INTO vehiculos_vehiculos (vehiculo_id_1, vehiculo_id_2) VALUES (${id1}, ${id2}) RETURNING *`
        );
        resultado = result.rows[0];
      }
      // Relaciones entre inmuebles
      else if (tipo1 === "inmueble" && tipo2 === "inmueble") {
        const result = await db.execute(
          sql`INSERT INTO inmuebles_inmuebles (inmueble_id_1, inmueble_id_2) VALUES (${id1}, ${id2}) RETURNING *`
        );
        resultado = result.rows[0];
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

  // API de búsqueda centralizada para todas las entidades
  app.get("/api/buscar", async (req, res) => {
    try {
      const query = req.query.q?.toString() || '';
      const tipo = req.query.tipo?.toString() || 'todas';
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const results = [];
      // Usar ILIKE para búsqueda insensible a mayúsculas/minúsculas
      const searchTerm = `%${query}%`;
      
      // Buscar en personas si el tipo es 'todas' o 'persona'
      if (tipo === 'todas' || tipo === 'persona') {
        // Usamos SQL directo para acceder a operadores de PostgreSQL no disponibles en Drizzle
        const personasResults = await db.execute(sql`
          SELECT * FROM personas 
          WHERE 
            unaccent(lower(nombre)) ILIKE unaccent(lower(${searchTerm})) OR 
            unaccent(lower(identificacion)) ILIKE unaccent(lower(${searchTerm}))
          LIMIT 5
        `);
        
        results.push(...personasResults.rows.map(p => ({ ...p, tipo: 'persona' })));
      }
      
      // Buscar en vehículos si el tipo es 'todas' o 'vehiculo'
      if (tipo === 'todas' || tipo === 'vehiculo') {
        const vehiculosResults = await db.execute(sql`
          SELECT * FROM vehiculos 
          WHERE 
            unaccent(lower(placa)) ILIKE unaccent(lower(${searchTerm})) OR
            unaccent(lower(marca)) ILIKE unaccent(lower(${searchTerm})) OR
            unaccent(lower(modelo)) ILIKE unaccent(lower(${searchTerm}))
          LIMIT 5
        `);
        
        results.push(...vehiculosResults.rows.map(v => ({ ...v, tipo: 'vehiculo' })));
      }
      
      // Buscar en inmuebles si el tipo es 'todas' o 'inmueble'
      if (tipo === 'todas' || tipo === 'inmueble') {
        const inmueblesResults = await db.execute(sql`
          SELECT * FROM inmuebles 
          WHERE 
            unaccent(lower(direccion)) ILIKE unaccent(lower(${searchTerm})) OR
            unaccent(lower(tipo)) ILIKE unaccent(lower(${searchTerm}))
          LIMIT 5
        `);
        
        results.push(...inmueblesResults.rows.map(i => ({ ...i, tipo: 'inmueble' })));
      }
      
      // Buscar en ubicaciones si el tipo es 'todas' o 'ubicacion'
      if (tipo === 'todas' || tipo === 'ubicacion') {
        const ubicacionesResults = await db.execute(sql`
          SELECT * FROM ubicaciones 
          WHERE 
            (tipo IS NOT NULL AND unaccent(lower(tipo)) ILIKE unaccent(lower(${searchTerm}))) OR
            (observaciones IS NOT NULL AND unaccent(lower(observaciones)) ILIKE unaccent(lower(${searchTerm})))
          LIMIT 5
        `);
        
        results.push(...ubicacionesResults.rows.map(u => ({ ...u, tipo: 'ubicacion' })));
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      res.status(500).json({ message: "Error al realizar la búsqueda" });
    }
  });

  const httpServer = createServer(app);
  // Rutas de administración de usuarios
  app.get('/api/admin/users', ensureAdmin, async (req, res) => {
    try {
      // Obtener el listado de todos los usuarios, excepto la contraseña
      const rawUsers = await db.query.users.findMany();
      const users = rawUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  });
  
  app.post('/api/admin/users', ensureAdmin, async (req, res) => {
    try {
      const { nombre, email, password, cedula, telefono, unidad, rol } = req.body;
      
      // Verificar campos obligatorios
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ message: 'Nombre, email, contraseña y rol son obligatorios' });
      }
      
      // Verificar que el email no exista
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
      
      // Hashear la contraseña
      const hashedPassword = await hashPassword(password);
      
      // Crear el usuario
      const [newUser] = await db.insert(users).values({
        nombre,
        email,
        password: hashedPassword,
        cedula: cedula || '',
        telefono: telefono || '',
        unidad: unidad || '',
        rol
      }).returning({
        id: users.id,
        nombre: users.nombre,
        email: users.email,
        cedula: users.cedula,
        telefono: users.telefono,
        unidad: users.unidad,
        rol: users.rol
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ message: 'Error al crear usuario' });
    }
  });
  
  app.put('/api/admin/users/:id', ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { nombre, email, cedula, telefono, unidad, rol } = req.body;
      
      // Verificar campos obligatorios
      if (!nombre || !email || !rol) {
        return res.status(400).json({ message: 'Nombre, email y rol son obligatorios' });
      }
      
      // Verificar que el usuario exista
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Verificar que el email no esté en uso por otro usuario
      if (email !== existingUser.email) {
        const userWithEmail = await db.query.users.findFirst({
          where: eq(users.email, email)
        });
        
        if (userWithEmail) {
          return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });
        }
      }
      
      // Actualizar el usuario
      const [updatedUser] = await db.update(users)
        .set({
          nombre,
          email,
          cedula: cedula || '',
          telefono: telefono || '',
          unidad: unidad || '',
          rol
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          nombre: users.nombre,
          email: users.email,
          cedula: users.cedula,
          telefono: users.telefono,
          unidad: users.unidad,
          rol: users.rol
        });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  });
  
  app.put('/api/admin/users/:id/password', ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password } = req.body;
      
      // Verificar que se proporcionó una contraseña
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      
      // Verificar que el usuario exista
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Hashear la nueva contraseña
      const hashedPassword = await hashPassword(password);
      
      // Actualizar la contraseña
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ message: 'Error al cambiar contraseña' });
    }
  });
  
  app.delete('/api/admin/users/:id', ensureAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verificar que el usuario no sea el que está realizando la solicitud
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: 'No puede eliminar su propio usuario' });
      }
      
      // Verificar que el usuario exista
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!existingUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Eliminar el usuario
      await db.delete(users).where(eq(users.id, userId));
      
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  });

  // === TIPOS DE IDENTIFICACIÓN ===
  // Obtener todos los tipos de identificación (público)
  app.get("/api/tipos-identificacion", async (req, res) => {
    try {
      const allTipos = await storage.getAllTiposIdentificacion();
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de identificación:", error);
      res.status(500).json({ message: "Error al obtener tipos de identificación" });
    }
  });

  // Obtener todos los tipos de identificación (admin)
  app.get("/api/tipos-identificacion-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const allTipos = await storage.getAllTiposIdentificacion();
      res.json(allTipos);
    } catch (error) {
      console.error("Error al obtener tipos de identificación para admin:", error);
      res.status(500).json({ message: "Error al obtener tipos de identificación" });
    }
  });

  // Crear nuevo tipo de identificación (admin)
  app.post("/api/tipos-identificacion-admin", requireRole(["admin"]), async (req, res) => {
    try {
      const { tipo } = req.body;
      
      if (!tipo) {
        return res.status(400).json({ message: "El tipo es obligatorio" });
      }
      
      // Verificar si ya existe un tipo con ese nombre
      const allTipos = await storage.getAllTiposIdentificacion();
      const existingTipo = allTipos.find(t => t.tipo.toLowerCase() === tipo.toLowerCase());
      
      if (existingTipo) {
        return res.status(400).json({ message: "Ya existe un tipo de identificación con ese nombre" });
      }
      
      const nuevoTipo = await storage.createTipoIdentificacion({ tipo });
      res.status(201).json(nuevoTipo);
    } catch (error) {
      console.error("Error al crear tipo de identificación:", error);
      res.status(500).json({ message: "Error al crear tipo de identificación" });
    }
  });

  // Actualizar tipo de identificación (admin)
  app.put("/api/tipos-identificacion-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tipo } = req.body;
      
      if (!tipo) {
        return res.status(400).json({ message: "El tipo es obligatorio" });
      }
      
      // Verificar si ya existe otro tipo con ese nombre
      const allTipos = await storage.getAllTiposIdentificacion();
      const existingTipo = allTipos.find(t => t.tipo.toLowerCase() === tipo.toLowerCase() && t.id !== id);
      
      if (existingTipo) {
        return res.status(400).json({ message: "Ya existe un tipo de identificación con ese nombre" });
      }
      
      const tipoActualizado = await storage.updateTipoIdentificacion(id, { tipo });
      
      if (!tipoActualizado) {
        return res.status(404).json({ message: "Tipo de identificación no encontrado" });
      }
      
      res.json(tipoActualizado);
    } catch (error) {
      console.error("Error al actualizar tipo de identificación:", error);
      res.status(500).json({ message: "Error al actualizar tipo de identificación" });
    }
  });

  // Eliminar tipo de identificación (admin)
  app.delete("/api/tipos-identificacion-admin/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteTipoIdentificacion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tipo de identificación no encontrado" });
      }
      
      res.json({ message: "Tipo de identificación eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar tipo de identificación:", error);
      res.status(500).json({ message: "Error al eliminar tipo de identificación" });
    }
  });
  
  return httpServer;
}