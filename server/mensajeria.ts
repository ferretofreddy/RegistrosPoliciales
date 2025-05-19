import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { 
  mensajes, archivosAdjuntos,
  Mensaje, InsertMensaje,
  ArchivoAdjunto, InsertArchivoAdjunto,
  users
} from "@shared/schema";

// Funciones para el manejo de mensajes
export async function getMensajeById(id: number): Promise<Mensaje | undefined> {
  try {
    const [mensaje] = await db
      .select()
      .from(mensajes)
      .where(eq(mensajes.id, id));
    return mensaje;
  } catch (error) {
    console.error("Error en getMensajeById:", error);
    return undefined;
  }
}

export async function getMensajesRecibidos(usuarioId: number): Promise<Mensaje[]> {
  try {
    console.log(`Obteniendo mensajes recibidos para el usuario ${usuarioId}`);
    
    const resultados = await db
      .select()
      .from(mensajes)
      .where(
        and(
          eq(mensajes.destinatarioId, usuarioId),
          eq(mensajes.eliminadoDestinatario, false)
        )
      )
      .orderBy(desc(mensajes.fechaEnvio));
      
    console.log(`Mensajes recibidos encontrados: ${resultados.length}`);
    return resultados;
  } catch (error) {
    console.error("Error en getMensajesRecibidos:", error);
    return [];
  }
}

export async function getMensajesEnviados(usuarioId: number): Promise<Mensaje[]> {
  try {
    console.log(`Obteniendo mensajes enviados para el usuario ${usuarioId}`);
    
    const resultados = await db
      .select()
      .from(mensajes)
      .where(
        and(
          eq(mensajes.remiteId, usuarioId),
          eq(mensajes.eliminadoRemite, false)
        )
      )
      .orderBy(desc(mensajes.fechaEnvio));
      
    console.log(`Mensajes enviados encontrados: ${resultados.length}`);
    return resultados;
  } catch (error) {
    console.error("Error en getMensajesEnviados:", error);
    return [];
  }
}

export async function createMensaje(mensaje: InsertMensaje): Promise<Mensaje> {
  try {
    const [nuevoMensaje] = await db
      .insert(mensajes)
      .values(mensaje)
      .returning();
    return nuevoMensaje;
  } catch (error) {
    console.error("Error en createMensaje:", error);
    throw error;
  }
}

export async function marcarMensajeComoLeido(id: number): Promise<boolean> {
  try {
    const [mensaje] = await db
      .update(mensajes)
      .set({ leido: true })
      .where(eq(mensajes.id, id))
      .returning();
    return !!mensaje;
  } catch (error) {
    console.error("Error en marcarMensajeComoLeido:", error);
    return false;
  }
}

export async function eliminarMensaje(id: number, esRemitente: boolean): Promise<boolean> {
  try {
    const [mensaje] = await db
      .update(mensajes)
      .set(
        esRemitente
          ? { eliminadoRemite: true }
          : { eliminadoDestinatario: true }
      )
      .where(eq(mensajes.id, id))
      .returning();
    
    return !!mensaje;
  } catch (error) {
    console.error("Error en eliminarMensaje:", error);
    return false;
  }
}

// Funciones para el manejo de archivos adjuntos
export async function getArchivosByMensajeId(mensajeId: number): Promise<ArchivoAdjunto[]> {
  try {
    return await db
      .select()
      .from(archivosAdjuntos)
      .where(eq(archivosAdjuntos.mensajeId, mensajeId));
  } catch (error) {
    console.error("Error en getArchivosByMensajeId:", error);
    return [];
  }
}

export async function createArchivoAdjunto(archivo: InsertArchivoAdjunto): Promise<ArchivoAdjunto> {
  try {
    const [nuevoArchivo] = await db
      .insert(archivosAdjuntos)
      .values(archivo)
      .returning();
    return nuevoArchivo;
  } catch (error) {
    console.error("Error en createArchivoAdjunto:", error);
    throw error;
  }
}

// Función para obtener una lista de todos los usuarios (para seleccionar destinatarios)
export async function getAllUsers() {
  try {
    return await db
      .select({
        id: users.id,
        nombre: users.nombre,
        email: users.email
      })
      .from(users)
      .where(eq(users.activo, "true"));
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return [];
  }
}

// Función para verificar si un usuario tiene mensajes no leídos
export async function contarMensajesNoLeidos(usuarioId: number): Promise<number> {
  try {
    const result = await db
      .select()
      .from(mensajes)
      .where(
        and(
          eq(mensajes.destinatarioId, usuarioId),
          eq(mensajes.leido, false),
          eq(mensajes.eliminadoDestinatario, false)
        )
      );
    
    return result.length;
  } catch (error) {
    console.error("Error en contarMensajesNoLeidos:", error);
    return 0;
  }
}