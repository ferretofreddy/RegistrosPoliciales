import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Importar el servidor de ubicación independiente
import { ubicacionServer } from './ubicacion-handler';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para la seguridad en producción
// Redireccionar a HTTPS en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Verificar si la conexión es segura
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Si estamos en producción y no es una conexión segura, redireccionamos a HTTPS
      log(`Redirigiendo petición insegura a HTTPS: ${req.method} ${req.url}`);
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}

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

    res.status(status).json({ message });
    throw err;
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
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
  
  // Iniciar servidor de ubicaciones independiente en un puerto diferente
  const ubicacionPort = 5001;
  ubicacionServer.listen(ubicacionPort, "0.0.0.0", () => {
    log(`Servidor de ubicaciones escuchando en puerto ${ubicacionPort}`);
  });
})();
