import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { authRouter } from './auth.js';
import { criminalRouter } from './routes/criminal.routes.js';
import { sessionMiddleware } from './session.js';

// --- Helper para __dirname con ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -------------------------------------------

const app = express();

app.use(express.json());
app.use(sessionMiddleware);

// --- RUTAS DE LA API ---
app.use(authRouter);
app.use('/api', criminalRouter);
// --------------------

// --- SERVIR ARCHIVOS ESTÁTICOS DEL CLIENTE ---
// Tu script 'build' compila todo en una carpeta 'dist'.
// Esta línea sirve los assets (JS, CSS, imágenes) desde esa carpeta.
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

// 'Catch-all' para cualquier otra ruta: sirve el index.html principal.
// Esto permite que el enrutamiento del lado del cliente (wouter) funcione.
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});
// -----------------------------------------

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
