import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Tu robusto middleware de CORS y seguridad se queda igual
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

(async () => {
  // Configura todas las rutas de la API llamando a tu manejador de rutas
  await registerRoutes(app);

  // En producción (Heroku), sirve los archivos estáticos del cliente
  if (process.env.NODE_ENV === 'production') {
    // La carpeta 'dist' ahora contiene todo lo compilado
    const staticPath = path.join(__dirname, '..');
    app.use(express.static(staticPath));
    
    // Para cualquier otra petición, devolvemos el index.html principal
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  // Tu manejador de errores
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Error Interno del Servidor';
    console.error("Error no manejado:", err.stack);
    res.status(status).json({ message, status });
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 El servidor está escuchando en el puerto ${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV}`);
  });
})();