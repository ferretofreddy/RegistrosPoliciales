// Definición de tipos para respuestas de la API

// Persona
export interface PersonaEntity {
  id: number;
  nombre: string;
  identificacion: string;
  alias: string[] | null;
  telefonos: string[] | null;
  domicilios: string[] | null;
  foto: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

// Vehículo
export interface VehiculoEntity {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  tipo: string | null;
  observaciones: string | null;
  foto: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

// Inmueble
export interface InmuebleEntity {
  id: number;
  tipo: string;
  direccion: string;
  propietario: string | null;
  observaciones: string | null;
  foto: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

// Ubicación
export interface UbicacionEntity {
  id: number;
  latitud: number | null;
  longitud: number | null;
  fecha: Date | null;
  tipo: string | null;
  observaciones: string | null;
  referencia?: string | null;
}

// Observación de entidades
export interface ObservacionEntity {
  id: number;
  fecha: Date | null;
  detalle: string;
  usuario: string | null;
  entidadId?: number;
}

// Respuesta de relaciones
export interface RelacionesResponse {
  personas?: PersonaEntity[];
  vehiculos?: VehiculoEntity[];
  inmuebles?: InmuebleEntity[];
  ubicaciones?: UbicacionEntity[];
}