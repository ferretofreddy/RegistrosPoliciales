import express, { Request, Response } from 'express';
import { Pool } from '@neondatabase/serverless';

// Create a direct database connection to avoid issues with the ORM
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export function setupRelationshipRoutes(app: express.Express) {
  // Endpoint to get relationships for a person
  app.get('/api/relaciones/persona/:id', async (req: Request, res: Response) => {
    try {
      const personaId = parseInt(req.params.id);
      
      if (isNaN(personaId)) {
        return res.status(400).json({ error: 'ID de persona inválido' });
      }
      
      // Get person details
      const personaResult = await pool.query(
        'SELECT * FROM personas WHERE id = $1',
        [personaId]
      );
      
      if (personaResult.rowCount === 0) {
        return res.status(404).json({ error: 'Persona no encontrada' });
      }
      
      const persona = personaResult.rows[0];
      
      // Get related properties
      const inmueblesResult = await pool.query(
        'SELECT i.* FROM inmuebles i ' +
        'JOIN personas_inmuebles pi ON i.id = pi.inmueble_id ' +
        'WHERE pi.persona_id = $1',
        [personaId]
      );
      
      const inmuebles = inmueblesResult.rows || [];
      
      // Get locations for each property
      const ubicaciones = [];
      
      for (const inmueble of inmuebles) {
        const ubicacionesResult = await pool.query(
          'SELECT u.* FROM ubicaciones u ' +
          'JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id ' +
          'WHERE iu.inmueble_id = $1',
          [inmueble.id]
        );
        
        ubicaciones.push(...(ubicacionesResult.rows || []));
      }
      
      res.json({
        persona,
        inmuebles,
        ubicaciones
      });
    } catch (error) {
      console.error('Error obteniendo relaciones de persona:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Endpoint to get relationships for a property
  app.get('/api/relaciones/inmueble/:id', async (req: Request, res: Response) => {
    try {
      const inmuebleId = parseInt(req.params.id);
      
      if (isNaN(inmuebleId)) {
        return res.status(400).json({ error: 'ID de inmueble inválido' });
      }
      
      // Get property details
      const inmuebleResult = await pool.query(
        'SELECT * FROM inmuebles WHERE id = $1',
        [inmuebleId]
      );
      
      if (inmuebleResult.rowCount === 0) {
        return res.status(404).json({ error: 'Inmueble no encontrado' });
      }
      
      const inmueble = inmuebleResult.rows[0];
      
      // Get related people
      const personasResult = await pool.query(
        'SELECT p.* FROM personas p ' +
        'JOIN personas_inmuebles pi ON p.id = pi.persona_id ' +
        'WHERE pi.inmueble_id = $1',
        [inmuebleId]
      );
      
      const personas = personasResult.rows || [];
      
      // Get related locations
      const ubicacionesResult = await pool.query(
        'SELECT u.* FROM ubicaciones u ' +
        'JOIN inmuebles_ubicaciones iu ON u.id = iu.ubicacion_id ' +
        'WHERE iu.inmueble_id = $1',
        [inmuebleId]
      );
      
      const ubicaciones = ubicacionesResult.rows || [];
      
      res.json({
        inmueble,
        personas,
        ubicaciones
      });
    } catch (error) {
      console.error('Error obteniendo relaciones de inmueble:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Endpoint to get relationships for a location
  app.get('/api/relaciones/ubicacion/:id', async (req: Request, res: Response) => {
    try {
      const ubicacionId = parseInt(req.params.id);
      
      if (isNaN(ubicacionId)) {
        return res.status(400).json({ error: 'ID de ubicación inválido' });
      }
      
      // Get location details
      const ubicacionResult = await pool.query(
        'SELECT * FROM ubicaciones WHERE id = $1',
        [ubicacionId]
      );
      
      if (ubicacionResult.rowCount === 0) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
      }
      
      const ubicacion = ubicacionResult.rows[0];
      
      // Get related properties
      const inmueblesResult = await pool.query(
        'SELECT i.* FROM inmuebles i ' +
        'JOIN inmuebles_ubicaciones iu ON i.id = iu.inmueble_id ' +
        'WHERE iu.ubicacion_id = $1',
        [ubicacionId]
      );
      
      const inmuebles = inmueblesResult.rows || [];
      
      // Get people related to these properties
      const personas = [];
      
      for (const inmueble of inmuebles) {
        const personasResult = await pool.query(
          'SELECT p.* FROM personas p ' +
          'JOIN personas_inmuebles pi ON p.id = pi.persona_id ' +
          'WHERE pi.inmueble_id = $1',
          [inmueble.id]
        );
        
        personas.push(...(personasResult.rows || []));
      }
      
      res.json({
        ubicacion,
        inmuebles,
        personas
      });
    } catch (error) {
      console.error('Error obteniendo relaciones de ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Special endpoint to display the specific relationship we're testing
  app.get('/api/relacion-pedro-terreno', async (_req: Request, res: Response) => {
    try {
      // Get Pedro (ID 1)
      const personaResult = await pool.query('SELECT * FROM personas WHERE id = 1');
      
      if (personaResult.rowCount === 0) {
        return res.status(404).json({ error: 'Persona "Pedro" (ID 1) no encontrada' });
      }
      
      const persona = personaResult.rows[0];
      
      // Get the Terreno (ID 3)
      const inmuebleResult = await pool.query('SELECT * FROM inmuebles WHERE id = 3');
      
      if (inmuebleResult.rowCount === 0) {
        return res.status(404).json({ error: 'Inmueble "Terreno" (ID 3) no encontrado' });
      }
      
      const inmueble = inmuebleResult.rows[0];
      
      // Get the Ubicacion (ID 3)
      const ubicacionResult = await pool.query('SELECT * FROM ubicaciones WHERE id = 3');
      
      if (ubicacionResult.rowCount === 0) {
        return res.status(404).json({ error: 'Ubicación (ID 3) no encontrada' });
      }
      
      const ubicacion = ubicacionResult.rows[0];
      
      // Verify relationship between Pedro and Terreno
      const personaInmuebleResult = await pool.query(
        'SELECT * FROM personas_inmuebles WHERE persona_id = 1 AND inmueble_id = 3'
      );
      
      const relacionPersonaInmueble = personaInmuebleResult.rowCount > 0;
      
      // Verify relationship between Terreno and Ubicacion
      const inmuebleUbicacionResult = await pool.query(
        'SELECT * FROM inmuebles_ubicaciones WHERE inmueble_id = 3 AND ubicacion_id = 3'
      );
      
      const relacionInmuebleUbicacion = inmuebleUbicacionResult.rowCount > 0;
      
      res.json({
        persona,
        inmueble,
        ubicacion,
        relaciones: {
          personaInmueble: relacionPersonaInmueble,
          inmuebleUbicacion: relacionInmuebleUbicacion
        }
      });
    } catch (error) {
      console.error('Error obteniendo relación Pedro-Terreno-Ubicación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
}