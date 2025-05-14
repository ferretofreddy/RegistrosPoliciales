import { 
  users, User, InsertUser, 
  personas, Persona, InsertPersona,
  personasObservaciones, PersonaObservacion, InsertPersonaObservacion,
  vehiculos, Vehiculo, InsertVehiculo,
  vehiculosObservaciones, VehiculoObservacion, InsertVehiculoObservacion,
  inmuebles, Inmueble, InsertInmueble,
  inmueblesObservaciones, InmuebleObservacion, InsertInmuebleObservacion,
  ubicaciones, Ubicacion, InsertUbicacion
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Personas methods
  getAllPersonas(): Promise<Persona[]>;
  getPersona(id: number): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  
  // Personas observaciones methods
  getPersonaObservaciones(personaId: number): Promise<PersonaObservacion[]>;
  createPersonaObservacion(observacion: InsertPersonaObservacion): Promise<PersonaObservacion>;
  
  // Vehiculos methods
  getAllVehiculos(): Promise<Vehiculo[]>;
  getVehiculo(id: number): Promise<Vehiculo | undefined>;
  createVehiculo(vehiculo: InsertVehiculo): Promise<Vehiculo>;
  
  // Vehiculos observaciones methods
  getVehiculoObservaciones(vehiculoId: number): Promise<VehiculoObservacion[]>;
  createVehiculoObservacion(observacion: InsertVehiculoObservacion): Promise<VehiculoObservacion>;
  
  // Inmuebles methods
  getAllInmuebles(): Promise<Inmueble[]>;
  getInmueble(id: number): Promise<Inmueble | undefined>;
  createInmueble(inmueble: InsertInmueble): Promise<Inmueble>;
  
  // Inmuebles observaciones methods
  getInmuebleObservaciones(inmuebleId: number): Promise<InmuebleObservacion[]>;
  createInmuebleObservacion(observacion: InsertInmuebleObservacion): Promise<InmuebleObservacion>;
  
  // Ubicaciones methods
  getAllUbicaciones(): Promise<Ubicacion[]>;
  getUbicacion(id: number): Promise<Ubicacion | undefined>;
  createUbicacion(ubicacion: InsertUbicacion): Promise<Ubicacion>;
  
  // Search and relation methods
  buscar(query: string, tipos: string[]): Promise<any>;
  crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any>;
  getRelaciones(tipo: string, id: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private personas: Map<number, Persona>;
  private vehiculos: Map<number, Vehiculo>;
  private inmuebles: Map<number, Inmueble>;
  private ubicaciones: Map<number, Ubicacion>;
  private relacionesPersonasVehiculos: Map<number, Set<number>>; // personaId -> Set<vehiculoId>
  private relacionesPersonasInmuebles: Map<number, Set<number>>; // personaId -> Set<inmuebleId>
  private relacionesPersonasUbicaciones: Map<number, Set<number>>; // personaId -> Set<ubicacionId>
  private relacionesVehiculosInmuebles: Map<number, Set<number>>; // vehiculoId -> Set<inmuebleId>
  private relacionesVehiculosUbicaciones: Map<number, Set<number>>; // vehiculoId -> Set<ubicacionId>
  private relacionesInmueblesUbicaciones: Map<number, Set<number>>; // inmuebleId -> Set<ubicacionId>
  
  // IDs for auto-increment
  private currentUserId: number;
  private currentPersonaId: number;
  private currentVehiculoId: number;
  private currentInmuebleId: number;
  private currentUbicacionId: number;

  constructor() {
    this.users = new Map();
    this.personas = new Map();
    this.vehiculos = new Map();
    this.inmuebles = new Map();
    this.ubicaciones = new Map();
    
    this.relacionesPersonasVehiculos = new Map();
    this.relacionesPersonasInmuebles = new Map();
    this.relacionesPersonasUbicaciones = new Map();
    this.relacionesVehiculosInmuebles = new Map();
    this.relacionesVehiculosUbicaciones = new Map();
    this.relacionesInmueblesUbicaciones = new Map();
    
    this.currentUserId = 1;
    this.currentPersonaId = 1;
    this.currentVehiculoId = 1;
    this.currentInmuebleId = 1;
    this.currentUbicacionId = 1;
    
    // Create admin user
    this.createUser({
      email: "admin@policia.gob",
      password: "$2b$10$X7nHZ8oXs.oXO0HpYcjHE.l3AjGgY3SnOxLxC6rRaPJYgOVYSzlaO", // "admin123"
      nombre: "Administrador",
      cedula: "1000000000",
      telefono: "1234567890",
      unidad: "Administración",
      rol: "admin"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Personas methods
  async getAllPersonas(): Promise<Persona[]> {
    return Array.from(this.personas.values());
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    return this.personas.get(id);
  }

  async createPersona(insertPersona: InsertPersona): Promise<Persona> {
    const id = this.currentPersonaId++;
    const persona: Persona = { ...insertPersona, id };
    this.personas.set(id, persona);
    return persona;
  }

  // Vehiculos methods
  async getAllVehiculos(): Promise<Vehiculo[]> {
    return Array.from(this.vehiculos.values());
  }

  async getVehiculo(id: number): Promise<Vehiculo | undefined> {
    return this.vehiculos.get(id);
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    const id = this.currentVehiculoId++;
    const vehiculo: Vehiculo = { ...insertVehiculo, id };
    this.vehiculos.set(id, vehiculo);
    return vehiculo;
  }

  // Inmuebles methods
  async getAllInmuebles(): Promise<Inmueble[]> {
    return Array.from(this.inmuebles.values());
  }

  async getInmueble(id: number): Promise<Inmueble | undefined> {
    return this.inmuebles.get(id);
  }

  async createInmueble(insertInmueble: InsertInmueble): Promise<Inmueble> {
    const id = this.currentInmuebleId++;
    const inmueble: Inmueble = { ...insertInmueble, id };
    this.inmuebles.set(id, inmueble);
    return inmueble;
  }

  // Ubicaciones methods
  async getAllUbicaciones(): Promise<Ubicacion[]> {
    return Array.from(this.ubicaciones.values());
  }

  async getUbicacion(id: number): Promise<Ubicacion | undefined> {
    return this.ubicaciones.get(id);
  }

  async createUbicacion(insertUbicacion: InsertUbicacion): Promise<Ubicacion> {
    const id = this.currentUbicacionId++;
    const ubicacion: Ubicacion = { ...insertUbicacion, id };
    this.ubicaciones.set(id, ubicacion);
    return ubicacion;
  }

  // Search and relation methods
  async buscar(query: string, tipos: string[]): Promise<any> {
    const resultados: any = {};
    const searchTerm = query.toLowerCase();
    
    if (tipos.includes("personas")) {
      resultados.personas = Array.from(this.personas.values()).filter(
        persona => 
          persona.nombre.toLowerCase().includes(searchTerm) ||
          persona.identificacion.toLowerCase().includes(searchTerm) ||
          persona.alias?.some(alias => alias.toLowerCase().includes(searchTerm)) ||
          persona.telefonos?.some(tel => tel.toLowerCase().includes(searchTerm))
      );
    }
    
    if (tipos.includes("vehiculos")) {
      resultados.vehiculos = Array.from(this.vehiculos.values()).filter(
        vehiculo =>
          vehiculo.marca.toLowerCase().includes(searchTerm) ||
          vehiculo.tipo.toLowerCase().includes(searchTerm) ||
          vehiculo.placa.toLowerCase().includes(searchTerm) ||
          vehiculo.color.toLowerCase().includes(searchTerm)
      );
    }
    
    if (tipos.includes("inmuebles")) {
      resultados.inmuebles = Array.from(this.inmuebles.values()).filter(
        inmueble =>
          inmueble.tipo.toLowerCase().includes(searchTerm) ||
          inmueble.propietario.toLowerCase().includes(searchTerm) ||
          inmueble.direccion.toLowerCase().includes(searchTerm)
      );
    }
    
    if (tipos.includes("ubicaciones")) {
      resultados.ubicaciones = Array.from(this.ubicaciones.values()).filter(
        ubicacion =>
          ubicacion.tipo.toLowerCase().includes(searchTerm) ||
          ubicacion.observaciones?.toLowerCase().includes(searchTerm)
      );
    }
    
    return resultados;
  }

  async crearRelacion(tipo1: string, id1: number, tipo2: string, id2: number): Promise<any> {
    // Validate that entities exist
    let entity1, entity2;
    
    if (tipo1 === "personas") {
      entity1 = this.personas.get(id1);
    } else if (tipo1 === "vehiculos") {
      entity1 = this.vehiculos.get(id1);
    } else if (tipo1 === "inmuebles") {
      entity1 = this.inmuebles.get(id1);
    } else if (tipo1 === "ubicaciones") {
      entity1 = this.ubicaciones.get(id1);
    }
    
    if (tipo2 === "personas") {
      entity2 = this.personas.get(id2);
    } else if (tipo2 === "vehiculos") {
      entity2 = this.vehiculos.get(id2);
    } else if (tipo2 === "inmuebles") {
      entity2 = this.inmuebles.get(id2);
    } else if (tipo2 === "ubicaciones") {
      entity2 = this.ubicaciones.get(id2);
    }
    
    if (!entity1 || !entity2) {
      throw new Error("Entidad no encontrada");
    }
    
    // Create relation based on types
    if (tipo1 === "personas" && tipo2 === "vehiculos") {
      if (!this.relacionesPersonasVehiculos.has(id1)) {
        this.relacionesPersonasVehiculos.set(id1, new Set());
      }
      this.relacionesPersonasVehiculos.get(id1)!.add(id2);
    } else if (tipo1 === "personas" && tipo2 === "inmuebles") {
      if (!this.relacionesPersonasInmuebles.has(id1)) {
        this.relacionesPersonasInmuebles.set(id1, new Set());
      }
      this.relacionesPersonasInmuebles.get(id1)!.add(id2);
    } else if (tipo1 === "personas" && tipo2 === "ubicaciones") {
      if (!this.relacionesPersonasUbicaciones.has(id1)) {
        this.relacionesPersonasUbicaciones.set(id1, new Set());
      }
      this.relacionesPersonasUbicaciones.get(id1)!.add(id2);
    } else if (tipo1 === "vehiculos" && tipo2 === "personas") {
      return await this.crearRelacion(tipo2, id2, tipo1, id1);
    } else if (tipo1 === "vehiculos" && tipo2 === "inmuebles") {
      if (!this.relacionesVehiculosInmuebles.has(id1)) {
        this.relacionesVehiculosInmuebles.set(id1, new Set());
      }
      this.relacionesVehiculosInmuebles.get(id1)!.add(id2);
    } else if (tipo1 === "vehiculos" && tipo2 === "ubicaciones") {
      if (!this.relacionesVehiculosUbicaciones.has(id1)) {
        this.relacionesVehiculosUbicaciones.set(id1, new Set());
      }
      this.relacionesVehiculosUbicaciones.get(id1)!.add(id2);
    } else if (tipo1 === "inmuebles" && (tipo2 === "personas" || tipo2 === "vehiculos")) {
      return await this.crearRelacion(tipo2, id2, tipo1, id1);
    } else if (tipo1 === "inmuebles" && tipo2 === "ubicaciones") {
      if (!this.relacionesInmueblesUbicaciones.has(id1)) {
        this.relacionesInmueblesUbicaciones.set(id1, new Set());
      }
      this.relacionesInmueblesUbicaciones.get(id1)!.add(id2);
    } else if (tipo1 === "ubicaciones") {
      return await this.crearRelacion(tipo2, id2, tipo1, id1);
    }
    
    return { success: true, message: "Relación creada correctamente" };
  }

  async getRelaciones(tipo: string, id: number): Promise<any> {
    const relaciones: any = {};
    
    if (tipo === "personas") {
      // Get vehiculos related to this persona
      const vehiculoIds = this.relacionesPersonasVehiculos.get(id);
      if (vehiculoIds && vehiculoIds.size > 0) {
        relaciones.vehiculos = Array.from(vehiculoIds).map(vid => this.vehiculos.get(vid));
      } else {
        relaciones.vehiculos = [];
      }
      
      // Get inmuebles related to this persona
      const inmuebleIds = this.relacionesPersonasInmuebles.get(id);
      if (inmuebleIds && inmuebleIds.size > 0) {
        relaciones.inmuebles = Array.from(inmuebleIds).map(iid => this.inmuebles.get(iid));
      } else {
        relaciones.inmuebles = [];
      }
      
      // Get ubicaciones related to this persona
      const ubicacionIds = this.relacionesPersonasUbicaciones.get(id);
      if (ubicacionIds && ubicacionIds.size > 0) {
        relaciones.ubicaciones = Array.from(ubicacionIds).map(uid => this.ubicaciones.get(uid));
      } else {
        relaciones.ubicaciones = [];
      }
    } else if (tipo === "vehiculos") {
      // Get personas related to this vehiculo (reverse lookup)
      relaciones.personas = [];
      for (const [personaId, vehiculoIds] of this.relacionesPersonasVehiculos.entries()) {
        if (vehiculoIds.has(id)) {
          const persona = this.personas.get(personaId);
          if (persona) {
            relaciones.personas.push(persona);
          }
        }
      }
      
      // Get inmuebles related to this vehiculo
      const inmuebleIds = this.relacionesVehiculosInmuebles.get(id);
      if (inmuebleIds && inmuebleIds.size > 0) {
        relaciones.inmuebles = Array.from(inmuebleIds).map(iid => this.inmuebles.get(iid));
      } else {
        relaciones.inmuebles = [];
      }
      
      // Get ubicaciones related to this vehiculo
      const ubicacionIds = this.relacionesVehiculosUbicaciones.get(id);
      if (ubicacionIds && ubicacionIds.size > 0) {
        relaciones.ubicaciones = Array.from(ubicacionIds).map(uid => this.ubicaciones.get(uid));
      } else {
        relaciones.ubicaciones = [];
      }
    } else if (tipo === "inmuebles") {
      // Get personas related to this inmueble (reverse lookup)
      relaciones.personas = [];
      for (const [personaId, inmuebleIds] of this.relacionesPersonasInmuebles.entries()) {
        if (inmuebleIds.has(id)) {
          const persona = this.personas.get(personaId);
          if (persona) {
            relaciones.personas.push(persona);
          }
        }
      }
      
      // Get vehiculos related to this inmueble (reverse lookup)
      relaciones.vehiculos = [];
      for (const [vehiculoId, inmuebleIds] of this.relacionesVehiculosInmuebles.entries()) {
        if (inmuebleIds.has(id)) {
          const vehiculo = this.vehiculos.get(vehiculoId);
          if (vehiculo) {
            relaciones.vehiculos.push(vehiculo);
          }
        }
      }
      
      // Get ubicaciones related to this inmueble
      const ubicacionIds = this.relacionesInmueblesUbicaciones.get(id);
      if (ubicacionIds && ubicacionIds.size > 0) {
        relaciones.ubicaciones = Array.from(ubicacionIds).map(uid => this.ubicaciones.get(uid));
      } else {
        relaciones.ubicaciones = [];
      }
    } else if (tipo === "ubicaciones") {
      // Get all entities related to this ubicacion (reverse lookup)
      relaciones.personas = [];
      for (const [personaId, ubicacionIds] of this.relacionesPersonasUbicaciones.entries()) {
        if (ubicacionIds.has(id)) {
          const persona = this.personas.get(personaId);
          if (persona) {
            relaciones.personas.push(persona);
          }
        }
      }
      
      relaciones.vehiculos = [];
      for (const [vehiculoId, ubicacionIds] of this.relacionesVehiculosUbicaciones.entries()) {
        if (ubicacionIds.has(id)) {
          const vehiculo = this.vehiculos.get(vehiculoId);
          if (vehiculo) {
            relaciones.vehiculos.push(vehiculo);
          }
        }
      }
      
      relaciones.inmuebles = [];
      for (const [inmuebleId, ubicacionIds] of this.relacionesInmueblesUbicaciones.entries()) {
        if (ubicacionIds.has(id)) {
          const inmueble = this.inmuebles.get(inmuebleId);
          if (inmueble) {
            relaciones.inmuebles.push(inmueble);
          }
        }
      }
    }
    
    return relaciones;
  }
}

import { DatabaseStorage } from "./database-storage";

// Change from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
