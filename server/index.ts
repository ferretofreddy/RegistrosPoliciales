import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';

// Importar el servidor de ubicación independiente
import { ubicacionServer } from './ubicacion-handler';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar cabeceras CORS para permitir conexiones desde cualquier origen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Permitir solicitudes pre-flight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware para la seguridad
// Redireccionar a HTTPS cuando sea necesario
app.use((req, res, next) => {
  // Verificar si la conexión es segura
  // En producción, siempre redirigir a HTTPS
  // En desarrollo, comprobar si la petición viene de un proxy y podría necesitar HTTPS
  const shouldRedirect = process.env.NODE_ENV === 'production' 
    ? (!req.secure && req.get('x-forwarded-proto') !== 'https')
    : (req.get('x-forwarded-proto') === 'http'); // Solo en desarrollo, si detectamos explícitamente HTTP
  
  if (shouldRedirect) {
    const hostWithoutPort = req.get('host')?.split(':')[0] || req.get('host') || 'localhost';
    const targetHost = process.env.NODE_ENV === 'production' 
      ? hostWithoutPort
      : `${hostWithoutPort}:${process.env.PORT || 5000}`;
    
    log(`Redirigiendo petición insegura a HTTPS: ${req.method} ${req.url}`);
    return res.redirect(`https://${targetHost}${req.url}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const timestamp = new Date().toISOString();
    
    // Log detallado del error
    const errorDetails = {
      status,
      message,
      stack: err.stack,
      path: _req.path,
      method: _req.method,
      headers: _req.headers,
      query: _req.query,
      body: _req.body,
      timestamp
    };
    
    console.error("Error en la aplicación:", errorDetails);
    
    // Si estamos en producción, guardar errores a un archivo para diagnóstico
    if (process.env.NODE_ENV === 'production') {
      try {
        const logDir = path.join(__dirname, 'production-logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, `error-${new Date().toISOString().replace(/:/g, '-')}.json`);
        fs.writeFileSync(logFile, JSON.stringify(errorDetails, null, 2));
      } catch (logError) {
        console.error("Error al guardar log de error:", logError);
      }
    }

    // Solo enviar información básica de error al cliente por seguridad
    res.status(status).json({ 
      message, 
      status,
      timestamp
    });
    
    // No lanzar el error para evitar que la aplicación se detenga
    // throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.setTimeout(120000); // Aumentar el timeout a 2 minutos (120,000 ms)
  
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    log(`Server timeout set to ${server.timeout}ms`);
  });
  
  // Iniciar servidor de ubicaciones independiente en un puerto diferente
  // En producción, es posible que necesitemos deshabilitar este servidor adicional
  // ya que algunos entornos no permiten múltiples puertos abiertos
  if (process.env.NODE_ENV !== 'production') {
    const ubicacionPort = 5001;
    ubicacionServer.listen(ubicacionPort, "0.0.0.0", () => {
      log(`Servidor de ubicaciones escuchando en puerto ${ubicacionPort}`);
    });
  } else {
    log(`Servidor de ubicaciones no iniciado en modo producción`);
  }
})();
