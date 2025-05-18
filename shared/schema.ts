import { pgTable, text, serial, integer, boolean, json, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuarios
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  cedula: text("cedula").notNull(),
  telefono: text("telefono").notNull(),
  unidad: text("unidad").notNull(),
  rol: text("rol").notNull(), // admin, investigador, agente
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  nombre: true,
  cedula: true,
  telefono: true,
  unidad: true,
  rol: true,
});

// Personas
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  identificacion: text("identificacion").notNull(),
  alias: json("alias").$type<string[]>(),
  telefonos: json("telefonos").$type<string[]>(),
  domicilios: json("domicilios").$type<string[]>(),
  foto: text("foto"), // URL to photo
});

export const insertPersonaSchema = createInsertSchema(personas).pick({
  nombre: true,
  identificacion: true,
  alias: true,
  telefonos: true,
  domicilios: true,
  foto: true,
});

// Observaciones de Personas
export const personasObservaciones = pgTable("personas_observaciones", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario").notNull(),
  detalle: text("detalle").notNull(),
});

export const insertPersonaObservacionSchema = createInsertSchema(personasObservaciones).pick({
  personaId: true,
  usuario: true,
  detalle: true,
});

// Vehículos
export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  marca: text("marca").notNull(),
  tipo: text("tipo").notNull(),
  color: text("color").notNull(),
  placa: text("placa").notNull(),
  modelo: text("modelo"), // año
  foto: text("foto"), // URL to photo
});

export const insertVehiculoSchema = createInsertSchema(vehiculos).pick({
  marca: true,
  tipo: true,
  color: true,
  placa: true,
  modelo: true,
  foto: true,
});

// Observaciones de Vehículos
export const vehiculosObservaciones = pgTable("vehiculos_observaciones", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario").notNull(),
  detalle: text("detalle").notNull(),
});

export const insertVehiculoObservacionSchema = createInsertSchema(vehiculosObservaciones).pick({
  vehiculoId: true,
  usuario: true,
  detalle: true,
});

// Tipos de Inmuebles
export const tiposInmuebles = pgTable("tipos_inmuebles", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
});

export const insertTipoInmuebleSchema = createInsertSchema(tiposInmuebles).pick({
  nombre: true,
  descripcion: true,
  activo: true,
});

// Inmuebles
export const inmuebles = pgTable("inmuebles", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // casa, apartamento, etc
  propietario: text("propietario").notNull(),
  direccion: text("direccion").notNull(),
  observaciones: text("observaciones"),
  foto: text("foto"), // URL to photo
});

export const insertInmuebleSchema = createInsertSchema(inmuebles).pick({
  tipo: true,
  propietario: true,
  direccion: true,
  observaciones: true,
  foto: true,
});

// Observaciones de Inmuebles
export const inmueblesObservaciones = pgTable("inmuebles_observaciones", {
  id: serial("id").primaryKey(),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario").notNull(),
  detalle: text("detalle").notNull(),
});

export const insertInmuebleObservacionSchema = createInsertSchema(inmueblesObservaciones).pick({
  inmuebleId: true,
  usuario: true,
  detalle: true,
});

// Tipos de Ubicaciones
export const tiposUbicaciones = pgTable("tipos_ubicaciones", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
});

export const insertTipoUbicacionSchema = createInsertSchema(tiposUbicaciones).pick({
  nombre: true,
  descripcion: true,
  activo: true,
});

// Ubicaciones
export const ubicaciones = pgTable("ubicaciones", {
  id: serial("id").primaryKey(),
  latitud: doublePrecision("latitud").notNull(),
  longitud: doublePrecision("longitud").notNull(),
  tipo: text("tipo").notNull(), // domicilio, avistamiento, etc
  fecha: timestamp("fecha").notNull().defaultNow(),
  observaciones: text("observaciones"),
});

export const insertUbicacionSchema = createInsertSchema(ubicaciones).pick({
  latitud: true,
  longitud: true,
  tipo: true,
  fecha: true,
  observaciones: true,
});

// Observaciones de Ubicaciones
export const ubicacionesObservaciones = pgTable("ubicaciones_observaciones", {
  id: serial("id").primaryKey(),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  usuario: text("usuario").notNull(),
  detalle: text("detalle").notNull(),
});

export const insertUbicacionObservacionSchema = createInsertSchema(ubicacionesObservaciones).pick({
  ubicacionId: true,
  usuario: true,
  detalle: true,
});

// Relaciones muchos a muchos
export const personasVehiculos = pgTable("personas_vehiculos", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
});

export const personasInmuebles = pgTable("personas_inmuebles", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
});

export const personasUbicaciones = pgTable("personas_ubicaciones", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

export const vehiculosInmuebles = pgTable("vehiculos_inmuebles", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
});

export const vehiculosUbicaciones = pgTable("vehiculos_ubicaciones", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

export const inmueblesUbicaciones = pgTable("inmuebles_ubicaciones", {
  id: serial("id").primaryKey(),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  ubicacionId: integer("ubicacion_id").notNull().references(() => ubicaciones.id),
});

// Relaciones adicionales entre entidades del mismo tipo
export const personasPersonas = pgTable("personas_personas", {
  id: serial("id").primaryKey(),
  personaId1: integer("persona_id_1").notNull().references(() => personas.id),
  personaId2: integer("persona_id_2").notNull().references(() => personas.id),
});

export const vehiculosVehiculos = pgTable("vehiculos_vehiculos", {
  id: serial("id").primaryKey(),
  vehiculoId1: integer("vehiculo_id_1").notNull().references(() => vehiculos.id),
  vehiculoId2: integer("vehiculo_id_2").notNull().references(() => vehiculos.id),
});

export const inmueblesInmuebles = pgTable("inmuebles_inmuebles", {
  id: serial("id").primaryKey(),
  inmuebleId1: integer("inmueble_id_1").notNull().references(() => inmuebles.id),
  inmuebleId2: integer("inmueble_id_2").notNull().references(() => inmuebles.id),
});

export const ubicacionesUbicaciones = pgTable("ubicaciones_ubicaciones", {
  id: serial("id").primaryKey(),
  ubicacionId1: integer("ubicacion_id_1").notNull().references(() => ubicaciones.id),
  ubicacionId2: integer("ubicacion_id_2").notNull().references(() => ubicaciones.id),
});

// Types
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

export type TipoInmueble = typeof tiposInmuebles.$inferSelect;
export type InsertTipoInmueble = z.infer<typeof insertTipoInmuebleSchema>;

export type Inmueble = typeof inmuebles.$inferSelect;
export type InsertInmueble = z.infer<typeof insertInmuebleSchema>;

export type InmuebleObservacion = typeof inmueblesObservaciones.$inferSelect;
export type InsertInmuebleObservacion = z.infer<typeof insertInmuebleObservacionSchema>;

export type TipoUbicacion = typeof tiposUbicaciones.$inferSelect;
export type InsertTipoUbicacion = z.infer<typeof insertTipoUbicacionSchema>;

export type Ubicacion = typeof ubicaciones.$inferSelect;
export type InsertUbicacion = z.infer<typeof insertUbicacionSchema>;

export type UbicacionObservacion = typeof ubicacionesObservaciones.$inferSelect;
export type InsertUbicacionObservacion = z.infer<typeof insertUbicacionObservacionSchema>;
