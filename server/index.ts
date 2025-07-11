import express, { type Request, Response, NextFunction } from "express";
// Asumimos que registerRoutes viene de un archivo 'routes.ts' o 'routes/index.ts'
// Si este archivo no existe, necesitaríamos crearlo también.
import { registerRoutes } from "./routes"; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- TU CÓDIGO ORIGINAL (CORS, Middlewares, etc.) ---
// Se mantiene intacto porque es robusto y funcional.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Aquí iría el resto de tu lógica de middlewares...
// ==========================================================

(async () => {
  // Configura tus rutas de la API. Esta función es la que debes revisar
  // para añadir las rutas de los criminales si lo necesitas.
  await registerRoutes(app);

  // --- LÓGICA DE PRODUCCIÓN PARA HEROKU ---
  // Si no estamos en desarrollo, servimos los archivos del cliente ya compilados.
  if (process.env.NODE_ENV === 'production') {
    // La carpeta 'dist' ahora contiene tanto el servidor como el cliente.
    // Servimos los archivos estáticos (JS, CSS, imágenes) desde la raíz.
    const staticPath = path.join(__dirname, '..');
    app.use(express.static(staticPath));
    
    // Para cualquier otra petición que no sea de la API, devolvemos
    // el index.html principal para que React/Wouter se encargue.
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }
  // ==========================================================


  // Tu manejador de errores y el resto del código se mantienen igual
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message, status });
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });

})();