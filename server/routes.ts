import type { Express } from 'express';
// Importamos la instancia 'storage' ya creada, es la única forma de hablar con la BD.
import { storage } from './database-storage';

export async function registerRoutes(app: Express) {

  // --- RUTAS DE PERSONAS ---
  app.get('/api/personas', async (req, res) => {
    try {
      const data = await storage.getAllPersonas();
      res.json(data);
    } catch (error) {
      console.error('Error al obtener personas:', error);
      res.status(500).json({ error: 'Fallo al obtener las personas' });
    }
  });

  app.get('/api/personas/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const data = await storage.getPersona(id);
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ message: 'Persona no encontrada' });
      }
    } catch (error) {
      console.error(`Error al obtener persona ${req.params.id}:`, error);
      res.status(500).json({ error: 'Fallo al obtener la persona' });
    }
  });

  app.post('/api/personas', async (req, res) => {
    try {
        const nuevaPersona = req.body;
        const data = await storage.createPersona(nuevaPersona);
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Error al crear persona:', error);
        res.status(500).json({ error: 'Fallo al crear la persona', message: error.message });
    }
  });

  // --- RUTAS DE VEHÍCULOS ---
  app.get('/api/vehiculos', async (req, res) => {
    try {
      const data = await storage.getAllVehiculos();
      res.json(data);
    } catch (error) {
      console.error('Error al obtener vehiculos:', error);
      res.status(500).json({ error: 'Fallo al obtener los vehiculos' });
    }
  });
  
  // (Aquí puedes añadir todas las demás rutas para inmuebles, ubicaciones, etc., siguiendo el mismo patrón)

  return app;
}