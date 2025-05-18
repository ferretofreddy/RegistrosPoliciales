import { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { storage } from './storage';
import { getRelaciones } from './database-storage-fix';
import { serveStatic, setupVite } from './vite';

export async function registerRoutes(app: Express): Promise<Server> {
  // Crear el servidor HTTP para Express
  const httpServer = createServer(app);
  
  // API routes
  app.get('/api/user', (req, res) => {
    if (req.session && req.session.passport && req.session.passport.user) {
      return res.json(req.session.passport.user);
    }
    res.status(401).json({ message: "No autenticado" });
  });
  
  // Autenticación
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Se requiere email y contraseña" });
      }
      
      console.log(`Intento de inicio de sesión para: ${email}`);
      
      // Por simplificar, usamos autenticación básica para este ejemplo
      // En un entorno real, usar passport o similar
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // En un entorno real, verificar contraseña hasheada
      if (password !== user.password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // Simular passport.js
      if (!req.session) {
        return res.status(500).json({ message: "Error de sesión" });
      }
      
      req.session.passport = {
        user: user
      };
      
      console.log(`Inicio de sesión exitoso para: ${email} (ID: ${user.id}, Rol: ${user.role})`);
      
      res.json(user);
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });
  
  app.post('/api/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error al cerrar sesión:", err);
          return res.status(500).json({ message: "Error al cerrar sesión" });
        }
        res.json({ message: "Sesión cerrada" });
      });
    } else {
      res.json({ message: "No hay sesión activa" });
    }
  });
  
  // Relaciones entre entidades
  app.get('/api/relaciones/:tipo/:id', async (req, res) => {
    try {
      const { tipo, id } = req.params;
      
      if (!tipo || !id) {
        return res.status(400).json({ message: "Se requiere tipo y ID" });
      }
      
      console.log(`[DEBUG] Recibida solicitud de relaciones para tipo: "${tipo}", id: "${id}"`);
      
      // Normalizar tipo
      const tipoNormalizado = tipo.toLowerCase();
      console.log(`[DEBUG] Obteniendo relaciones para: ${tipoNormalizado}(${id}), normalizado a: ${tipoNormalizado}(${id})`);
      
      // Convertir ID a número
      const idNumerico = parseInt(id);
      if (isNaN(idNumerico)) {
        return res.status(400).json({ message: "ID debe ser un número" });
      }
      
      // Verificar que la entidad existe
      let entidadExiste = false;
      
      if (tipoNormalizado === "persona" || tipoNormalizado === "personas") {
        const persona = await storage.getPersona(idNumerico);
        entidadExiste = !!persona;
      } else if (tipoNormalizado === "vehiculo" || tipoNormalizado === "vehiculos") {
        const vehiculo = await storage.getVehiculo(idNumerico);
        entidadExiste = !!vehiculo;
      } else if (tipoNormalizado === "inmueble" || tipoNormalizado === "inmuebles") {
        const inmueble = await storage.getInmueble(idNumerico);
        entidadExiste = !!inmueble;
      } else if (tipoNormalizado === "ubicacion" || tipoNormalizado === "ubicaciones") {
        const ubicacion = await storage.getUbicacion(idNumerico);
        entidadExiste = !!ubicacion;
      } else {
        return res.status(400).json({ message: `Tipo de entidad no válido: ${tipoNormalizado}` });
      }
      
      if (!entidadExiste) {
        console.error(`[ERROR] Entidad no encontrada: ${tipoNormalizado}(${idNumerico})`);
        return res.status(404).json({ message: `No se encontró ${tipoNormalizado} con ID ${idNumerico}` });
      }
      
      // Obtener relaciones usando nuestra función corregida
      const relaciones = await getRelaciones(tipoNormalizado, idNumerico);
      
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
      console.error("Error al obtener relaciones:", error);
      res.status(500).json({ message: "Error al obtener relaciones" });
    }
  });
  
  // Búsqueda de entidades
  app.get('/api/buscar', async (req, res) => {
    try {
      const { q, tipos } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: "Se requiere un término de búsqueda" });
      }
      
      // Normalizar tipos para la búsqueda
      const tiposArray = Array.isArray(tipos) ? tipos : tipos ? [tipos.toString()] : ["personas", "vehiculos", "inmuebles", "ubicaciones"];
      
      // Normalizar tipos para la función de búsqueda
      const tiposNormalizados = tiposArray.map(tipo => {
        if (tipo === "personas") return "persona";
        if (tipo === "vehiculos") return "vehiculo";
        if (tipo === "inmuebles") return "inmueble";
        if (tipo === "ubicaciones") return "ubicacion";
        return tipo;
      });
      
      console.log(`Buscando con query: "${q}" y tipos: [${tiposNormalizados.join(', ')}]`);
      
      const resultados = await storage.buscar(q.toString(), tiposNormalizados);
      res.json(resultados);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      res.status(500).json({ message: "Error al realizar búsqueda" });
    }
  });
  
  // Middleware para manejo de errores
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  });
  
  // Configurar el entorno de desarrollo con Vite o servir estáticos en producción
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }
  
  return httpServer;
}