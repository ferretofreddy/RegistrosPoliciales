import { Express, Request, Response, NextFunction } from "express";
import * as chatService from "./chat-service";

// Middleware para verificar autenticación
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "No autenticado" });
};

export function registerChatRoutes(app: Express) {
  // Obtener todas las conversaciones del usuario
  app.get("/api/chat/conversaciones", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const conversaciones = await chatService.obtenerConversacionesUsuario(req.user.id);
      res.json(conversaciones);
    } catch (error) {
      console.error("Error al obtener conversaciones:", error);
      res.status(500).json({ message: "Error al obtener conversaciones" });
    }
  });

  // Obtener mensajes de una conversación específica
  app.get("/api/chat/conversaciones/:id/mensajes", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const conversacionId = parseInt(req.params.id);
      const mensajes = await chatService.obtenerMensajesConversacion(conversacionId, req.user.id);
      
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  // Enviar un mensaje
  app.post("/api/chat/mensajes", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const { conversacionId, contenido } = req.body;

      if (!conversacionId || !contenido) {
        return res.status(400).json({ message: "Conversación ID y contenido son requeridos" });
      }

      const nuevoMensaje = await chatService.enviarMensaje(
        Number(conversacionId),
        req.user.id,
        contenido
      );

      res.status(201).json(nuevoMensaje);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  // Iniciar nueva conversación
  app.post("/api/chat/conversaciones", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const { otroUsuarioId } = req.body;

      if (!otroUsuarioId) {
        return res.status(400).json({ message: "ID del otro usuario es requerido" });
      }

      const conversacion = await chatService.obtenerOCrearConversacion(
        req.user.id,
        Number(otroUsuarioId)
      );

      res.status(201).json(conversacion);
    } catch (error) {
      console.error("Error al crear conversación:", error);
      res.status(500).json({ message: "Error al crear conversación" });
    }
  });

  // Marcar mensajes como leídos
  app.put("/api/chat/conversaciones/:id/leer", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const conversacionId = parseInt(req.params.id);
      await chatService.marcarMensajesComoLeidos(conversacionId, req.user.id);
      
      res.json({ message: "Mensajes marcados como leídos" });
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
      res.status(500).json({ message: "Error al marcar mensajes como leídos" });
    }
  });

  // Obtener usuarios disponibles para chat
  app.get("/api/chat/usuarios-disponibles", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const usuarios = await chatService.obtenerUsuariosDisponibles(req.user.id);
      res.json(usuarios);
    } catch (error) {
      console.error("Error al obtener usuarios disponibles:", error);
      res.status(500).json({ message: "Error al obtener usuarios disponibles" });
    }
  });

  // Obtener conteo de mensajes no leídos
  app.get("/api/chat/no-leidos", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuario no autenticado correctamente" });
      }

      const count = await chatService.contarMensajesNoLeidos(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error al contar mensajes no leídos:", error);
      res.status(500).json({ message: "Error al contar mensajes no leídos" });
    }
  });
}