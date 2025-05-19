import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "registro-policial-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async (email, password, done) => {
        try {
          console.log(`Intento de inicio de sesión para: ${email}`);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`Usuario no encontrado: ${email}`);
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }
          
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            console.log(`Contraseña incorrecta para: ${email}`);
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }
          
          // Verificar si el usuario está activo
          if (user.activo === "false") {
            console.log(`Usuario inactivo: ${email}`);
            return done(null, false, { message: "ACCESO RESTRINGIDO: Este usuario no tiene acceso al sistema, por favor comuníquese con el administrador de la aplicación." });
          }
          
          console.log(`Inicio de sesión exitoso para: ${email} (ID: ${user.id}, Rol: ${user.rol})`);
          return done(null, user);
        } catch (err) {
          console.error("Error en autenticación:", err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        activo: "false", // Asegurarnos de que los nuevos usuarios siempre comiencen inactivos
      });

      // Verificar si el usuario está activo antes de iniciar sesión automática
      if (user.activo === "true") {
        req.login(user, (err) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      } else {
        // Usuario creado pero no inicia sesión automáticamente
        console.log(`Usuario registrado pero inactivo: ${user.email} (ID: ${user.id})`);
        res.status(201).json({
          ...user,
          message: "ACCESO RESTRINGIDO: Su cuenta ha sido creada pero está pendiente de activación por un administrador."
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al registrar usuario" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Email o contraseña incorrectos" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Actualizar perfil del usuario (sólo teléfono y unidad)
  app.patch("/api/user/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    
    try {
      const { telefono, unidad } = req.body;
      
      // Realizar actualización parcial (solo los campos permitidos)
      const [updatedUser] = await db
        .update(users)
        .set({ 
          telefono: telefono || "",
          unidad: unidad || ""
        })
        .where(eq(users.id, req.user.id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Error al actualizar el perfil" });
      }
      
      // Actualizar la sesión del usuario con los nuevos datos
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Error al actualizar la sesión:", err);
          return res.status(500).json({ message: "Error al actualizar la sesión" });
        }
        
        res.json(updatedUser);
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  });
}
