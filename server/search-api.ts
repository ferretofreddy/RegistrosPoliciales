import { Request, Response } from 'express';
import { eq, or, sql } from "drizzle-orm";
import { db } from "./db";
import { personas, vehiculos, inmuebles, ubicaciones } from "@shared/schema";

// Función para buscar coincidencias en diversas entidades
export async function buscarCoincidencias(req: Request, res: Response) {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }
    
    const searchTerm = query.trim();
    const searchPattern = `%${searchTerm}%`;
    
    // Resultados de búsqueda
    const results: {
      personas: any[],
      vehiculos: any[],
      inmuebles: any[],
      ubicaciones: any[]
    } = {
      personas: [],
      vehiculos: [],
      inmuebles: [],
      ubicaciones: []
    };
    
    // Buscar personas
    try {
      const personasResult = await db.select().from(personas).where(
        or(
          sql`LOWER(nombre) LIKE LOWER(${searchPattern})`,
          sql`LOWER(identificacion) LIKE LOWER(${searchPattern})`
        )
      ).limit(10);
      
      results.personas = personasResult;
    } catch (error) {
      console.error("Error al buscar personas:", error);
    }
    
    // Buscar vehículos
    try {
      const vehiculosResult = await db.select().from(vehiculos).where(
        or(
          sql`LOWER(placa) LIKE LOWER(${searchPattern})`,
          sql`LOWER(marca) LIKE LOWER(${searchPattern})`,
          sql`LOWER(modelo) LIKE LOWER(${searchPattern})`
        )
      ).limit(10);
      
      results.vehiculos = vehiculosResult;
    } catch (error) {
      console.error("Error al buscar vehículos:", error);
    }
    
    // Buscar inmuebles
    try {
      const inmueblesResult = await db.select().from(inmuebles).where(
        or(
          sql`LOWER(tipo) LIKE LOWER(${searchPattern})`,
          sql`LOWER(direccion) LIKE LOWER(${searchPattern})`,
          sql`LOWER(propietario) LIKE LOWER(${searchPattern})`
        )
      ).limit(10);
      
      results.inmuebles = inmueblesResult;
    } catch (error) {
      console.error("Error al buscar inmuebles:", error);
    }
    
    // Buscar ubicaciones
    try {
      const ubicacionesResult = await db.select().from(ubicaciones).where(
        or(
          sql`LOWER(tipo) LIKE LOWER(${searchPattern})`,
          sql`LOWER(observaciones) LIKE LOWER(${searchPattern})`
        )
      ).limit(10);
      
      results.ubicaciones = ubicacionesResult;
    } catch (error) {
      console.error("Error al buscar ubicaciones:", error);
    }
    
    res.json(results);
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}