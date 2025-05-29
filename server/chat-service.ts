import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import { 
  conversaciones, mensajes, users,
  Conversacion, InsertConversacion,
  Mensaje, InsertMensaje
} from "@shared/schema";

// Obtener o crear una conversación entre dos usuarios
export async function obtenerOCrearConversacion(usuario1Id: number, usuario2Id: number): Promise<Conversacion> {
  try {
    // Buscar conversación existente (en cualquier orden)
    const [conversacionExistente] = await db
      .select()
      .from(conversaciones)
      .where(
        or(
          and(
            eq(conversaciones.usuario1Id, usuario1Id),
            eq(conversaciones.usuario2Id, usuario2Id)
          ),
          and(
            eq(conversaciones.usuario1Id, usuario2Id),
            eq(conversaciones.usuario2Id, usuario1Id)
          )
        )
      );

    if (conversacionExistente) {
      return conversacionExistente;
    }

    // Crear nueva conversación
    const [nuevaConversacion] = await db
      .insert(conversaciones)
      .values({
        usuario1Id: Math.min(usuario1Id, usuario2Id), // Mantener orden consistente
        usuario2Id: Math.max(usuario1Id, usuario2Id),
      })
      .returning();

    return nuevaConversacion;
  } catch (error) {
    console.error("Error al obtener o crear conversación:", error);
    throw error;
  }
}

// Obtener todas las conversaciones de un usuario
export async function obtenerConversacionesUsuario(usuarioId: number): Promise<any[]> {
  try {
    const conversacionesUsuario = await db
      .select({
        conversacion: conversaciones,
        otroUsuario: {
          id: users.id,
          nombre: users.nombre,
          email: users.email,
        },
        ultimoMensaje: {
          id: mensajes.id,
          contenido: mensajes.contenido,
          fechaEnvio: mensajes.fechaEnvio,
          remitenteId: mensajes.remitenteId,
          leido: mensajes.leido,
        }
      })
      .from(conversaciones)
      .leftJoin(
        users,
        or(
          and(eq(conversaciones.usuario1Id, usuarioId), eq(users.id, conversaciones.usuario2Id)),
          and(eq(conversaciones.usuario2Id, usuarioId), eq(users.id, conversaciones.usuario1Id))
        )
      )
      .leftJoin(
        mensajes,
        and(
          eq(mensajes.conversacionId, conversaciones.id),
          eq(mensajes.fechaEnvio, conversaciones.fechaUltimoMensaje)
        )
      )
      .where(
        and(
          or(
            eq(conversaciones.usuario1Id, usuarioId),
            eq(conversaciones.usuario2Id, usuarioId)
          ),
          or(
            and(eq(conversaciones.usuario1Id, usuarioId), eq(conversaciones.eliminadaUsuario1, false)),
            and(eq(conversaciones.usuario2Id, usuarioId), eq(conversaciones.eliminadaUsuario2, false))
          )
        )
      )
      .orderBy(desc(conversaciones.fechaUltimoMensaje));

    return conversacionesUsuario;
  } catch (error) {
    console.error("Error al obtener conversaciones del usuario:", error);
    return [];
  }
}

// Obtener mensajes de una conversación
export async function obtenerMensajesConversacion(conversacionId: number, usuarioId: number): Promise<Mensaje[]> {
  try {
    // Verificar que el usuario pertenece a la conversación
    const [conversacion] = await db
      .select()
      .from(conversaciones)
      .where(
        and(
          eq(conversaciones.id, conversacionId),
          or(
            eq(conversaciones.usuario1Id, usuarioId),
            eq(conversaciones.usuario2Id, usuarioId)
          )
        )
      );

    if (!conversacion) {
      throw new Error("Conversación no encontrada o sin permisos");
    }

    const mensajesConversacion = await db
      .select()
      .from(mensajes)
      .where(
        and(
          eq(mensajes.conversacionId, conversacionId),
          eq(mensajes.eliminado, false)
        )
      )
      .orderBy(mensajes.fechaEnvio);

    return mensajesConversacion;
  } catch (error) {
    console.error("Error al obtener mensajes de la conversación:", error);
    return [];
  }
}

// Enviar un mensaje
export async function enviarMensaje(conversacionId: number, remitenteId: number, contenido: string): Promise<Mensaje> {
  try {
    // Verificar que el usuario pertenece a la conversación
    const [conversacion] = await db
      .select()
      .from(conversaciones)
      .where(
        and(
          eq(conversaciones.id, conversacionId),
          or(
            eq(conversaciones.usuario1Id, remitenteId),
            eq(conversaciones.usuario2Id, remitenteId)
          )
        )
      );

    if (!conversacion) {
      throw new Error("Conversación no encontrada o sin permisos");
    }

    // Crear el mensaje
    const [nuevoMensaje] = await db
      .insert(mensajes)
      .values({
        conversacionId,
        remitenteId,
        contenido,
        tipoMensaje: "texto"
      })
      .returning();

    // Actualizar fecha del último mensaje en la conversación
    await db
      .update(conversaciones)
      .set({ fechaUltimoMensaje: nuevoMensaje.fechaEnvio })
      .where(eq(conversaciones.id, conversacionId));

    return nuevoMensaje;
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
}

// Marcar mensajes como leídos
export async function marcarMensajesComoLeidos(conversacionId: number, usuarioId: number): Promise<void> {
  try {
    await db
      .update(mensajes)
      .set({ leido: true })
      .where(
        and(
          eq(mensajes.conversacionId, conversacionId),
          eq(mensajes.remitenteId, usuarioId),
          eq(mensajes.leido, false)
        )
      );
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
  }
}

// Obtener usuarios disponibles para iniciar conversación
export async function obtenerUsuariosDisponibles(usuarioActualId: number): Promise<any[]> {
  try {
    const usuarios = await db
      .select({
        id: users.id,
        nombre: users.nombre,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.activo, "true"),
          // Excluir el usuario actual
        )
      );

    return usuarios.filter(u => u.id !== usuarioActualId);
  } catch (error) {
    console.error("Error al obtener usuarios disponibles:", error);
    return [];
  }
}

// Contar mensajes no leídos
export async function contarMensajesNoLeidos(usuarioId: number): Promise<number> {
  try {
    // Obtener todas las conversaciones del usuario
    const conversacionesUsuario = await db
      .select({ id: conversaciones.id })
      .from(conversaciones)
      .where(
        or(
          eq(conversaciones.usuario1Id, usuarioId),
          eq(conversaciones.usuario2Id, usuarioId)
        )
      );

    if (conversacionesUsuario.length === 0) {
      return 0;
    }

    const conversacionIds = conversacionesUsuario.map(c => c.id);

    // Contar mensajes no leídos donde el usuario NO es el remitente
    const mensajesNoLeidos = await db
      .select()
      .from(mensajes)
      .where(
        and(
          eq(mensajes.leido, false),
          eq(mensajes.eliminado, false),
          // El usuario no debe ser el remitente del mensaje
        )
      );

    return mensajesNoLeidos.filter(m => 
      conversacionIds.includes(m.conversacionId) && m.remitenteId !== usuarioId
    ).length;
  } catch (error) {
    console.error("Error al contar mensajes no leídos:", error);
    return 0;
  }
}