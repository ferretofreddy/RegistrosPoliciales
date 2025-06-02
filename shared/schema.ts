import { pgTable, text, serial, integer, json, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuarios
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  cedula: text("cedula").notNull(),
  telefono: text("telefono").default(""),  // Ya no obligatorio en registro
  unidad: text("unidad").default(""),    // Ya no obligatorio en registro
  rol: text("rol").notNull(), // admin, investigador, agente
  activo: text("activo").default("false"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  nombre: true,
  cedula: true,
  telefono: true,
  unidad: true,
  rol: true,
  activo: true,
});

// Personas
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  tipoIdentificacionId: integer("tipo_identificacion_id").references(() => tiposIdentificacion.id),
  identificacion: text("identificacion").notNull(),
  alias: json("alias").$type<string[]>().default([]),
  telefonos: json("telefonos").$type<string[]>().default([]),
  domicilios: json("domicilios").$type<string[]>().default([]),
  foto: text("foto"), // URL to photo
  posicionEstructura: text("posicion_estructura"), // Posición en la estructura
});

export const insertPersonaSchema = createInsertSchema(personas).pick({
  nombre: true,
  tipoIdentificacionId: true,
  identificacion: true,
  alias: true,
  telefonos: true,
  domicilios: true,
  foto: true,
  posicionEstructura: true,
});

// Observaciones de Personas
export const personasObservaciones = pgTable("personas_observaciones", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario"),
  detalle: text("detalle").notNull(),
});

export const insertPersonaObservacionSchema = createInsertSchema(personasObservaciones).pick({
  personaId: true,
  fecha: true,
  usuario: true,
  detalle: true,
});

// Vehículos
export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  color: text("color").notNull(),
  tipo: text("tipo"),
  observaciones: text("observaciones"),
  foto: text("foto"), // URL to photo
});

export const insertVehiculoSchema = createInsertSchema(vehiculos).pick({
  placa: true,
  marca: true,
  modelo: true,
  color: true,
  tipo: true,
  observaciones: true,
  foto: true,
});

// Observaciones de Vehículos
export const vehiculosObservaciones = pgTable("vehiculos_observaciones", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario"),
  detalle: text("detalle").notNull(),
});

export const insertVehiculoObservacionSchema = createInsertSchema(vehiculosObservaciones).pick({
  vehiculoId: true,
  fecha: true,
  usuario: true,
  detalle: true,
});

// Inmuebles
export const inmuebles = pgTable("inmuebles", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(),
  direccion: text("direccion").notNull(),
  propietario: text("propietario"),
  observaciones: text("observaciones"),
  foto: text("foto"), // URL to photo
});

export const insertInmuebleSchema = createInsertSchema(inmuebles).pick({
  tipo: true,
  direccion: true,
  propietario: true,
  observaciones: true,
  foto: true,
});

// Observaciones de Inmuebles
export const inmueblesObservaciones = pgTable("inmuebles_observaciones", {
  id: serial("id").primaryKey(),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario"),
  detalle: text("detalle").notNull(),
});

export const insertInmuebleObservacionSchema = createInsertSchema(inmueblesObservaciones).pick({
  inmuebleId: true,
  fecha: true,
  usuario: true,
  detalle: true,
});

// Relación Personas-Vehículos
export const personasVehiculos = pgTable("personas_vehiculos", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
});

// Relación Personas-Inmuebles
export const personasInmuebles = pgTable("personas_inmuebles", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
});

// Relación Personas-Personas
export const personasPersonas = pgTable("personas_personas", {
  id: serial("id").primaryKey(),
  personaId1: integer("persona_id_1").notNull().references(() => personas.id),
  personaId2: integer("persona_id_2").notNull().references(() => personas.id),
});

// Relación Personas-Ubicaciones
export const personasUbicaciones = pgTable("personas_ubicaciones", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

// Relación Vehiculos-Ubicaciones
export const vehiculosUbicaciones = pgTable("vehiculos_ubicaciones", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

// Relación Vehículos-Inmuebles
export const vehiculosInmuebles = pgTable("vehiculos_inmuebles", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
});

// Relación Vehículos-Vehículos
export const vehiculosVehiculos = pgTable("vehiculos_vehiculos", {
  id: serial("id").primaryKey(),
  vehiculoId1: integer("vehiculo_id_1").notNull().references(() => vehiculos.id),
  vehiculoId2: integer("vehiculo_id_2").notNull().references(() => vehiculos.id),
});

// Relación Inmuebles-Ubicaciones
export const inmueblesUbicaciones = pgTable("inmuebles_ubicaciones", {
  id: serial("id").primaryKey(),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

// Relación Inmuebles-Inmuebles
export const inmueblesInmuebles = pgTable("inmuebles_inmuebles", {
  id: serial("id").primaryKey(),
  inmuebleId1: integer("inmueble_id_1").notNull().references(() => inmuebles.id),
  inmuebleId2: integer("inmueble_id_2").notNull().references(() => inmuebles.id),
});

// Relación Ubicaciones-Ubicaciones
export const ubicacionesUbicaciones = pgTable("ubicaciones_ubicaciones", {
  id: serial("id").primaryKey(),
  ubicacionId1: integer("ubicacion_id_1").notNull().references(() => ubicaciones.id),
  ubicacionId2: integer("ubicacion_id_2").notNull().references(() => ubicaciones.id),
});

// Ubicaciones
export const ubicaciones = pgTable("ubicaciones", {
  id: serial("id").primaryKey(),
  latitud: doublePrecision("latitud"),
  longitud: doublePrecision("longitud"),
  fecha: timestamp("fecha").defaultNow(),
  tipo: text("tipo"),
  observaciones: text("observaciones"),
});

export const insertUbicacionSchema = createInsertSchema(ubicaciones).pick({
  latitud: true,
  longitud: true,
  fecha: true,
  tipo: true,
  observaciones: true,
});

// Observaciones de ubicaciones
export const ubicacionesObservaciones = pgTable("ubicaciones_observaciones", {
  id: serial("id").primaryKey(),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
  fecha: timestamp("fecha").defaultNow(),
  detalle: text("detalle"),
  usuario: text("usuario"),
});

export const insertUbicacionObservacionSchema = createInsertSchema(ubicacionesObservaciones).omit({
  id: true
}).extend({
  fecha: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional()
});

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;

export type PersonaObservacion = typeof personasObservaciones.$inferSelect;
export type InsertPersonaObservacion = z.infer<typeof insertPersonaObservacionSchema>;

export type Vehiculo = typeof vehiculos.$inferSelect;
export type InsertVehiculo = z.infer<typeof insertVehiculoSchema>;

export type VehiculoObservacion = typeof vehiculosObservaciones.$inferSelect;
export type InsertVehiculoObservacion = z.infer<typeof insertVehiculoObservacionSchema>;

export type Inmueble = typeof inmuebles.$inferSelect;
export type InsertInmueble = z.infer<typeof insertInmuebleSchema>;

export type InmuebleObservacion = typeof inmueblesObservaciones.$inferSelect;
export type InsertInmuebleObservacion = z.infer<typeof insertInmuebleObservacionSchema>;

export type Ubicacion = typeof ubicaciones.$inferSelect;
export type InsertUbicacion = z.infer<typeof insertUbicacionSchema>;

export type UbicacionObservacion = typeof ubicacionesObservaciones.$inferSelect;
export type InsertUbicacionObservacion = z.infer<typeof insertUbicacionObservacionSchema>;

// Tipos de inmuebles (usar tabla existente)
export const tiposInmuebles = pgTable("tipos_inmuebles", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  activo: text("activo")
});

export const insertTipoInmuebleSchema = createInsertSchema(tiposInmuebles).pick({
  nombre: true,
  descripcion: true
});

// Tipos de ubicaciones (usar tabla existente)
export const tiposUbicaciones = pgTable("tipos_ubicaciones", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  activo: text("activo")
});

export const insertTipoUbicacionSchema = createInsertSchema(tiposUbicaciones).pick({
  nombre: true,
  descripcion: true
});

// Exportar tipos para las tablas de tipos
export type TipoInmueble = typeof tiposInmuebles.$inferSelect;
export type InsertTipoInmueble = z.infer<typeof insertTipoInmuebleSchema>;

export type TipoUbicacion = typeof tiposUbicaciones.$inferSelect;
export type InsertTipoUbicacion = z.infer<typeof insertTipoUbicacionSchema>;

// Tipos de identificación
export const tiposIdentificacion = pgTable("tipos_identificacion", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(),
  activo: text("activo").default("true")
});

export const insertTipoIdentificacionSchema = createInsertSchema(tiposIdentificacion).pick({
  tipo: true
});

export type TipoIdentificacion = typeof tiposIdentificacion.$inferSelect;
export type InsertTipoIdentificacion = z.infer<typeof insertTipoIdentificacionSchema>;

// Tabla para posiciones en estructura
export const posicionesEstructura = pgTable("posiciones_estructura", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
});

export const insertPosicionEstructuraSchema = createInsertSchema(posicionesEstructura).pick({
  nombre: true,
  descripcion: true
});

export type PosicionEstructura = typeof posicionesEstructura.$inferSelect;
export type InsertPosicionEstructura = z.infer<typeof insertPosicionEstructuraSchema>;

// Sistema de mensajería tipo chat (WhatsApp/Telegram)
// Tabla para conversaciones entre usuarios
export const conversaciones = pgTable("conversaciones", {
  id: serial("id").primaryKey(),
  usuario1Id: integer("usuario1_id").notNull().references(() => users.id),
  usuario2Id: integer("usuario2_id").notNull().references(() => users.id),
  fechaCreacion: timestamp("fecha_creacion").notNull().defaultNow(),
  fechaUltimoMensaje: timestamp("fecha_ultimo_mensaje").notNull().defaultNow(),
  eliminadaUsuario1: boolean("eliminada_usuario1").default(false),
  eliminadaUsuario2: boolean("eliminada_usuario2").default(false),
});

// Tabla para mensajes dentro de conversaciones
export const mensajes = pgTable("mensajes", {
  id: serial("id").primaryKey(),
  conversacionId: integer("conversacion_id").notNull().references(() => conversaciones.id),
  remitenteId: integer("remitente_id").notNull().references(() => users.id),
  contenido: text("contenido").notNull(),
  fechaEnvio: timestamp("fecha_envio").notNull().defaultNow(),
  leido: boolean("leido").default(false),
  editado: boolean("editado").default(false),
  fechaEdicion: timestamp("fecha_edicion"),
  eliminado: boolean("eliminado").default(false),
  tipoMensaje: text("tipo_mensaje").default("texto"), // texto, imagen, archivo
});

// Tabla para archivos adjuntos en mensajes
export const archivosAdjuntos = pgTable("archivos_adjuntos", {
  id: serial("id").primaryKey(),
  mensajeId: integer("mensaje_id").notNull().references(() => mensajes.id),
  nombreArchivo: text("nombre_archivo").notNull(),
  rutaArchivo: text("ruta_archivo").notNull(),
  tipoArchivo: text("tipo_archivo").notNull(),
  tamanoArchivo: integer("tamano_archivo").notNull(),
  fechaSubida: timestamp("fecha_subida").notNull().defaultNow(),
});

// Esquemas de inserción
export const insertConversacionSchema = createInsertSchema(conversaciones).pick({
  usuario1Id: true,
  usuario2Id: true,
});

export const insertMensajeSchema = createInsertSchema(mensajes).pick({
  conversacionId: true,
  remitenteId: true,
  contenido: true,
  tipoMensaje: true,
});

export const insertArchivoAdjuntoSchema = createInsertSchema(archivosAdjuntos).pick({
  mensajeId: true,
  nombreArchivo: true,
  rutaArchivo: true,
  tipoArchivo: true,
  tamanoArchivo: true,
});

// Tipos para las nuevas relaciones
export type VehiculoInmueble = typeof vehiculosInmuebles.$inferSelect;
export type VehiculoVehiculo = typeof vehiculosVehiculos.$inferSelect;

// Tipos para mensajería tipo chat
export type Conversacion = typeof conversaciones.$inferSelect;
export type InsertConversacion = z.infer<typeof insertConversacionSchema>;
export type Mensaje = typeof mensajes.$inferSelect;
export type InsertMensaje = z.infer<typeof insertMensajeSchema>;
export type ArchivoAdjunto = typeof archivosAdjuntos.$inferSelect;
export type InsertArchivoAdjunto = z.infer<typeof insertArchivoAdjuntoSchema>;