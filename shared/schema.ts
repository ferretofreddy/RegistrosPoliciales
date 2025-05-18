import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
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
  alias: json("alias").$type<string[]>().default([]),
  telefonos: json("telefonos").$type<string[]>().default([]),
  domicilios: json("domicilios").$type<string[]>().default([]),
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
  texto: text("texto").notNull(),
  creador: text("creador"),
});

export const insertPersonaObservacionSchema = createInsertSchema(personasObservaciones).pick({
  personaId: true,
  fecha: true,
  texto: true,
  creador: true,
});

// Vehículos
export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  color: text("color").notNull(),
  anio: text("anio"),
  propietario: text("propietario"),
  tipo: text("tipo"),
  observaciones: text("observaciones"),
  foto: text("foto"), // URL to photo
});

export const insertVehiculoSchema = createInsertSchema(vehiculos).pick({
  placa: true,
  marca: true,
  modelo: true,
  color: true,
  anio: true,
  propietario: true,
  tipo: true,
  observaciones: true,
  foto: true,
});

// Observaciones de Vehículos
export const vehiculosObservaciones = pgTable("vehiculos_observaciones", {
  id: serial("id").primaryKey(),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  texto: text("texto").notNull(),
  creador: text("creador"),
});

export const insertVehiculoObservacionSchema = createInsertSchema(vehiculosObservaciones).pick({
  vehiculoId: true,
  fecha: true,
  texto: true,
  creador: true,
});

// Inmuebles
export const inmuebles = pgTable("inmuebles", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(),
  direccion: text("direccion").notNull(),
  descripcion: text("descripcion"),
  propietario: text("propietario"),
  observaciones: text("observaciones"),
  foto: text("foto"), // URL to photo
});

export const insertInmuebleSchema = createInsertSchema(inmuebles).pick({
  tipo: true,
  direccion: true,
  descripcion: true,
  propietario: true,
  observaciones: true,
  foto: true,
});

// Observaciones de Inmuebles
export const inmueblesObservaciones = pgTable("inmuebles_observaciones", {
  id: serial("id").primaryKey(),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  fecha: timestamp("fecha").notNull().defaultNow(),
  texto: text("texto").notNull(),
  creador: text("creador"),
});

export const insertInmuebleObservacionSchema = createInsertSchema(inmueblesObservaciones).pick({
  inmuebleId: true,
  fecha: true,
  texto: true,
  creador: true,
});

// Relación Personas-Vehículos
export const personasVehiculos = pgTable("personas_vehiculos", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  vehiculoId: integer("vehiculo_id").notNull().references(() => vehiculos.id),
  relacion: text("relacion"), // propietario, conductor, etc
  observaciones: text("observaciones"),
});

// Relación Personas-Inmuebles
export const personasInmuebles = pgTable("personas_inmuebles", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  inmuebleId: integer("inmueble_id").notNull().references(() => inmuebles.id),
  relacion: text("relacion"), // propietario, inquilino, etc
  observaciones: text("observaciones"),
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