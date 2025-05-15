// Manejador independiente para la creación de ubicaciones
import http from 'http';
import url from 'url';
import { storage } from './database-storage';

// Crear un servidor HTTP separado para manejar solo la creación de ubicaciones
const server = http.createServer(async (req, res) => {
  // Solo manejamos POSTs a /create-ubicacion
  if (req.method === 'POST' && req.url === '/create-ubicacion') {
    let body = '';
    
    // Recibir los datos del POST
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Parsear los datos JSON
        let data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          console.error("Error al parsear JSON:", e);
          sendErrorResponse(res, 400, "JSON inválido");
          return;
        }
        
        // Validar los datos mínimos necesarios
        if (!data.latitud || !data.longitud || !data.tipo) {
          console.error("Datos incompletos:", data);
          sendErrorResponse(res, 400, "Faltan datos requeridos (latitud, longitud, tipo)");
          return;
        }
        
        // Preparar el objeto de ubicación
        const ubicacionData = {
          latitud: parseFloat(data.latitud),
          longitud: parseFloat(data.longitud),
          tipo: data.tipo,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          observaciones: data.observaciones || ""
        };
        
        console.log("Datos a guardar:", ubicacionData);
        
        // Crear la ubicación en la base de datos
        try {
          const ubicacion = await storage.createUbicacion(ubicacionData);
          console.log("Ubicación creada:", ubicacion);
          
          // Enviar respuesta exitosa
          sendSuccessResponse(res, ubicacion);
        } catch (error: any) {
          console.error("Error al crear ubicación:", error);
          sendErrorResponse(res, 500, error.message || "Error interno del servidor");
        }
      } catch (error) {
        console.error("Error general:", error);
        sendErrorResponse(res, 500, "Error interno del servidor");
      }
    });
  } else {
    // Para cualquier otra ruta, devolver 404
    sendErrorResponse(res, 404, "Ruta no encontrada");
  }
});

// Función para enviar respuesta de éxito
function sendSuccessResponse(res: http.ServerResponse, data: any) {
  res.writeHead(201, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify({
    success: true,
    data: data
  }));
}

// Función para enviar respuesta de error
function sendErrorResponse(res: http.ServerResponse, statusCode: number, message: string) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify({
    success: false,
    error: message
  }));
}

// Exportar el servidor 
export const ubicacionServer = server;