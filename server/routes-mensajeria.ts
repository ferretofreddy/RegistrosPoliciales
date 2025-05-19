import { Express, Request, Response, NextFunction } from "express";
import * as mensajeriaService from "./mensajeria";
import { insertMensajeSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";

// Middleware para verificar autenticación
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "No autenticado" });
};

export function registerMensajeriaRoutes(app: Express) {
  // Obtener todos los mensajes recibidos
  app.get("/api/mensajes/recibidos", ensureAuthenticated, async (req, res) => {
    try {
      const mensajes = await mensajeriaService.getMensajesRecibidos(req.user!.id);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes recibidos:", error);
      res.status(500).json({ message: "Error al obtener mensajes recibidos" });
    }
  });

  // Obtener todos los mensajes enviados
  app.get("/api/mensajes/enviados", ensureAuthenticated, async (req, res) => {
    try {
      const mensajes = await mensajeriaService.getMensajesEnviados(req.user!.id);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes enviados:", error);
      res.status(500).json({ message: "Error al obtener mensajes enviados" });
    }
  });

  // Obtener un mensaje específico por ID
  app.get("/api/mensajes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const mensajeId = parseInt(req.params.id);
      const mensaje = await mensajeriaService.getMensajeById(mensajeId);
      
      if (!mensaje) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }
      
      // Verificar que el usuario tenga permiso para ver este mensaje
      if (mensaje.remiteId !== req.user!.id && mensaje.destinatarioId !== req.user!.id) {
        return res.status(403).json({ message: "No autorizado para ver este mensaje" });
      }
      
      // Si el usuario es el destinatario y el mensaje no ha sido leído, marcarlo como leído
      if (mensaje.destinatarioId === req.user!.id && !mensaje.leido) {
        await mensajeriaService.marcarMensajeComoLeido(mensajeId);
        mensaje.leido = true;
      }
      
      res.json(mensaje);
    } catch (error) {
      console.error("Error al obtener mensaje:", error);
      res.status(500).json({ message: "Error al obtener mensaje" });
    }
  });

  // Enviar un nuevo mensaje
  app.post("/api/mensajes", ensureAuthenticated, async (req, res) => {
    try {
      console.log("Datos recibidos para crear mensaje:", req.body);
      console.log("Usuario autenticado:", req.user);
      
      // Creamos directamente el objeto para el mensaje sin pasar por validación de Zod
      const mensajeData = {
        remiteId: req.user?.id, 
        destinatarioId: typeof req.body.destinatarioId === 'string' 
          ? parseInt(req.body.destinatarioId) 
          : req.body.destinatarioId,
        asunto: req.body.asunto || "",
        contenido: req.body.contenido || "",
        fechaEnvio: new Date(),
        leido: false,
        eliminadoRemite: false,
        eliminadoDestinatario: false
      };
      
      // Verificación manual de campos requeridos
      if (!mensajeData.remiteId) {
        return res.status(400).json({ message: "Error: ID de remitente no disponible" });
      }
      
      if (!mensajeData.destinatarioId) {
        return res.status(400).json({ message: "Error: Se requiere un destinatario" });
      }
      
      if (!mensajeData.asunto) {
        return res.status(400).json({ message: "Error: Se requiere un asunto" });
      }
      
      if (!mensajeData.contenido) {
        return res.status(400).json({ message: "Error: Se requiere contenido para el mensaje" });
      }
      
      console.log("Datos formateados para crear mensaje:", mensajeData);
      
      // Usar el servicio para insertar en la base de datos
      const nuevoMensaje = await mensajeriaService.createMensaje(mensajeData);
      console.log("Mensaje creado correctamente:", nuevoMensaje);
      res.status(201).json(nuevoMensaje);
    } catch (error) {
      console.error("Error al crear mensaje:", error);
      res.status(500).json({ message: "Error al crear mensaje" });
    }
  });

  // Eliminar un mensaje (marcar como eliminado para el usuario)
  app.delete("/api/mensajes/:id", ensureAuthenticated, async (req, res) => {
    try {
      const mensajeId = parseInt(req.params.id);
      const mensaje = await mensajeriaService.getMensajeById(mensajeId);
      
      if (!mensaje) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }
      
      // Verificar que el usuario tenga permiso para eliminar este mensaje
      if (mensaje.remiteId !== req.user!.id && mensaje.destinatarioId !== req.user!.id) {
        return res.status(403).json({ message: "No autorizado para eliminar este mensaje" });
      }
      
      // Marcar como eliminado según el rol del usuario (remitente o destinatario)
      const esRemitente = mensaje.remiteId === req.user!.id;
      const eliminado = await mensajeriaService.eliminarMensaje(mensajeId, esRemitente);
      
      if (eliminado) {
        res.json({ message: "Mensaje eliminado correctamente" });
      } else {
        res.status(500).json({ message: "Error al eliminar mensaje" });
      }
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      res.status(500).json({ message: "Error al eliminar mensaje" });
    }
  });

  // Obtener la cantidad de mensajes no leídos
  app.get("/api/mensajes/no-leidos/count", ensureAuthenticated, async (req, res) => {
    try {
      const cantidadNoLeidos = await mensajeriaService.contarMensajesNoLeidos(req.user!.id);
      res.json({ count: cantidadNoLeidos });
    } catch (error) {
      console.error("Error al contar mensajes no leídos:", error);
      res.status(500).json({ message: "Error al contar mensajes no leídos" });
    }
  });

  // Obtener lista de usuarios para enviar mensajes
  app.get("/api/usuarios-mensajeria", ensureAuthenticated, async (req, res) => {
    try {
      console.log("Obteniendo lista de usuarios para mensajería");
      const usuarios = await mensajeriaService.getAllUsers();
      console.log("Usuarios obtenidos:", usuarios);
      // Filtramos el usuario actual para que no pueda enviarse mensajes a sí mismo
      const usuariosFiltrados = usuarios.filter(u => u.id !== req.user!.id);
      console.log("Usuarios filtrados:", usuariosFiltrados);
      res.json(usuariosFiltrados);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });
}