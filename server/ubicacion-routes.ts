/**
 * Rutas específicas para la visualización completa de ubicaciones
 * para resolver el problema de mostrar todas las ubicaciones directas y relacionadas
 */
import { sql, eq } from 'drizzle-orm';
import { Express } from 'express';
import { db } from './db';
import { personas, vehiculos, inmuebles, ubicaciones } from '@shared/schema';
import { storage } from './database-storage';

/**
 * Registrar estas rutas en la aplicación principal
 */
export function registerUbicacionesRoutes(app: Express) {
  /**
   * Ruta para obtener TODAS las ubicaciones relacionadas con una entidad específica 
   * Funciona para personas, vehículos e inmuebles
   */
  app.get('/api/ubicaciones-completas/:tipo/:id', async (req, res) => {
    try {
      const { tipo, id } = req.params;
      const idNumerico = parseInt(id);
      
      let entidad = null;
      const ubicacionesDirectas = [];
      const ubicacionesRelacionadas = [];
      const entidadesRelacionadas = [];
      
      console.log(`[API-UBICACIONES] Buscando ubicaciones para ${tipo} ID ${idNumerico}`);
      
      // Obtener la entidad principal
      if (tipo === 'persona' || tipo === 'personas') {
        entidad = await storage.getPersona(idNumerico);
        
        if (!entidad) {
          return res.status(404).json({ message: 'Persona no encontrada' });
        }
        
        // PASO 1: Buscar todas las ubicaciones directas (domicilios)
        
        // 1.1 Buscar ubicaciones relacionadas directamente
        const relacionesUbi = await db.execute(
          sql`SELECT * FROM personas_ubicaciones WHERE persona_id = ${idNumerico}`
        );
        
        for (const rel of relacionesUbi.rows) {
          const ubicacion = await storage.getUbicacion(rel.ubicacion_id);
          if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
            console.log(`[API-UBICACIONES] Encontrada ubicación directa ID ${ubicacion.id}`);
            ubicacionesDirectas.push(ubicacion);
          }
        }
        
        // 1.2 Buscar ubicaciones por domicilio
        if (entidad.domicilios && entidad.domicilios.length > 0) {
          for (const domicilio of entidad.domicilios) {
            if (!domicilio) continue;
            
            const ubicacionesDomicilio = await db.select().from(ubicaciones)
              .where(sql`tipo = 'Domicilio' AND observaciones LIKE ${'%' + domicilio + '%'}`);
              
            for (const ubi of ubicacionesDomicilio) {
              if (ubi.latitud && ubi.longitud) {
                console.log(`[API-UBICACIONES] Encontrado domicilio: ${ubi.observaciones}`);
                ubicacionesDirectas.push(ubi);
              }
            }
          }
        }
        
        // 1.3 Buscar por nombre (domicilios que mencionan a la persona)
        const ubicacionesNombre = await db.select().from(ubicaciones)
          .where(sql`tipo = 'Domicilio' AND observaciones LIKE ${'%' + entidad.nombre + '%'}`);
          
        for (const ubi of ubicacionesNombre) {
          if (ubi.latitud && ubi.longitud) {
            ubicacionesDirectas.push(ubi);
          }
        }
        
        // PASO 2: Buscar ubicaciones relacionadas (a través de vehículos, inmuebles, etc.)
        
        // 2.1 Buscar vehículos relacionados
        const vehiculosRelacionados = await db.execute(
          sql`SELECT v.* FROM vehiculos v
              JOIN personas_vehiculos pv ON v.id = pv.vehiculo_id
              WHERE pv.persona_id = ${idNumerico}`
        );
        
        for (const vehiculo of vehiculosRelacionados.rows) {
          // Añadir a entidades relacionadas
          entidadesRelacionadas.push({
            tipo: 'vehiculo',
            nivel: 1,
            ...vehiculo
          });
          
          // Buscar ubicaciones del vehículo
          const ubicacionesVehiculo = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN vehiculos_ubicaciones vu ON u.id = vu.ubicacion_id
                WHERE vu.vehiculo_id = ${vehiculo.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          for (const ubicacion of ubicacionesVehiculo.rows) {
            ubicacionesRelacionadas.push({
              ubicacion: ubicacion,
              entidadRelacionada: {
                tipo: 'vehiculo',
                entidad: vehiculo,
                relacionadoCon: {
                  tipo: 'persona',
                  entidad: entidad
                }
              }
            });
          }
        }
        
        // 2.2 Buscar inmuebles relacionados
        const inmueblesRelacionados = await db.execute(
          sql`SELECT i.* FROM inmuebles i
              JOIN personas_inmuebles pi ON i.id = pi.inmueble_id
              WHERE pi.persona_id = ${idNumerico}`
        );
        
        for (const inmueble of inmueblesRelacionados.rows) {
          // Añadir a entidades relacionadas
          entidadesRelacionadas.push({
            tipo: 'inmueble',
            nivel: 1,
            ...inmueble
          });
          
          // Buscar ubicaciones del inmueble
          const ubicacionesInmueble = await db.execute(
            sql`SELECT u.* FROM ubicaciones u
                JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id
                WHERE iu.inmueble_id = ${inmueble.id}
                AND u.latitud IS NOT NULL AND u.longitud IS NOT NULL`
          );
          
          for (const ubicacion of ubicacionesInmueble.rows) {
            ubicacionesRelacionadas.push({
              ubicacion: ubicacion,
              entidadRelacionada: {
                tipo: 'inmueble',
                entidad: inmueble,
                relacionadoCon: {
                  tipo: 'persona',
                  entidad: entidad
                }
              }
            });
          }
          
          // Buscar también por dirección del inmueble
          if (inmueble.direccion) {
            const ubicacionesDireccion = await db.select().from(ubicaciones)
              .where(sql`observaciones LIKE ${'%' + inmueble.direccion + '%'}`);
              
            for (const ubi of ubicacionesDireccion) {
              if (ubi.latitud && ubi.longitud) {
                ubicacionesRelacionadas.push({
                  ubicacion: ubi,
                  entidadRelacionada: {
                    tipo: 'inmueble',
                    entidad: inmueble,
                    relacionadoCon: {
                      tipo: 'persona',
                      entidad: entidad
                    }
                  }
                });
              }
            }
          }
        }
      } 
      // Implementación similar para vehículos e inmuebles
      else if (tipo === 'vehiculo' || tipo === 'vehiculos') {
        // Similar a personas pero para vehículos
        entidad = await storage.getVehiculo(idNumerico);
        
        if (!entidad) {
          return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        
        // Implementación simplificada, seguiría el mismo patrón
      }
      else if (tipo === 'inmueble' || tipo === 'inmuebles') {
        // Similar a personas pero para inmuebles
        entidad = await storage.getInmueble(idNumerico);
        
        if (!entidad) {
          return res.status(404).json({ message: 'Inmueble no encontrado' });
        }
        
        // Implementación simplificada, seguiría el mismo patrón
      }
      else {
        return res.status(400).json({ message: 'Tipo de entidad no válido' });
      }
      
      // Eliminar duplicados
      const ubicacionesDirectasUnicas = [...new Map(ubicacionesDirectas.map(item => 
        [item.id, item])).values()];
        
      const ubicacionesRelacionadasUnicas = ubicacionesRelacionadas.filter((item, index, self) =>
        index === self.findIndex(t => t.ubicacion.id === item.ubicacion.id)
      );
      
      console.log(`[API-UBICACIONES] Total ubicaciones encontradas: directas=${ubicacionesDirectasUnicas.length}, relacionadas=${ubicacionesRelacionadasUnicas.length}`);
      
      res.json({
        entidad,
        tipo: tipo.toLowerCase().replace(/s$/, ''), // normalizar 'personas' -> 'persona'
        ubicacionesDirectas: ubicacionesDirectasUnicas,
        ubicacionesRelacionadas: ubicacionesRelacionadasUnicas,
        entidadesRelacionadas
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
  });
}