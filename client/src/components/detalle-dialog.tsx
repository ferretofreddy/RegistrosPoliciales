import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Home, User, MapPin, AlertCircle, Plus } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion, PersonaObservacion, VehiculoObservacion, InmuebleObservacion } from "@shared/schema";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Componente para agregar una nueva observación
function AddObservacionForm({
  tipo,
  id,
  onSuccess
}: {
  tipo: "persona" | "vehiculo" | "inmueble",
  id: number,
  onSuccess: () => void
}) {
  const [detalle, setDetalle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const endpointMap = {
    persona: `/api/personas/${id}/observaciones`,
    vehiculo: `/api/vehiculos/${id}/observaciones`,
    inmueble: `/api/inmuebles/${id}/observaciones`
  };
  
  const mutation = useMutation({
    mutationFn: async (data: { detalle: string }) => {
      const response = await apiRequest("POST", endpointMap[tipo], data);
      return response.json();
    },
    onSuccess: () => {
      // Limpiar el formulario
      setDetalle("");
      // Invalidar la consulta para refrescar los datos
      queryClient.invalidateQueries({ queryKey: [endpointMap[tipo]] });
      toast({
        title: "Observación agregada",
        description: "La observación ha sido agregada exitosamente.",
      });
      // Notificar al componente padre
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo agregar la observación: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalle.trim()) return;
    
    mutation.mutate({ detalle });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 border rounded-md p-4 bg-muted/30">
      <div className="space-y-2">
        <Label htmlFor="detalle">Nueva observación</Label>
        <Textarea
          id="detalle"
          placeholder="Ingrese la observación"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          required
          className="min-h-[80px]"
        />
      </div>
      <Button 
        type="submit" 
        size="sm"
        disabled={mutation.isPending || !detalle.trim()}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        {mutation.isPending ? "Agregando..." : "Agregar observación"}
      </Button>
    </form>
  );
}

// Componente para mostrar observaciones
function TablaObservaciones({ 
  observaciones 
}: { 
  observaciones: (PersonaObservacion | VehiculoObservacion | InmuebleObservacion)[] 
}) {
  // Aseguramos que observaciones siempre sea un array
  const items = Array.isArray(observaciones) ? observaciones : [];
  
  if (items.length === 0) {
    return (
      <Alert variant="default" className="bg-muted">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay observaciones registradas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((obs) => (
            <TableRow key={obs.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}
              </TableCell>
              <TableCell>{obs.usuario}</TableCell>
              <TableCell className="whitespace-pre-wrap">{obs.detalle}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface DetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion";
  dato: Persona | Vehiculo | Inmueble | Ubicacion | null;
}

export default function DetalleDialog({
  open,
  onOpenChange,
  tipo,
  dato,
}: DetalleDialogProps) {
  // Si no hay datos o el diálogo no está abierto, no renderizamos nada
  if (!dato || !open) return null;
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Consultas para obtener las observaciones según el tipo de dato
  const { data: observacionesPersona = [], refetch: refetchPersonaObs } = useQuery<PersonaObservacion[]>({
    queryKey: ['/api/personas', dato.id, 'observaciones'],
    enabled: tipo === 'persona' && open,
  });
  
  const { data: observacionesVehiculo = [], refetch: refetchVehiculoObs } = useQuery<VehiculoObservacion[]>({
    queryKey: ['/api/vehiculos', dato.id, 'observaciones'],
    enabled: tipo === 'vehiculo' && open,
  });
  
  const { data: observacionesInmueble = [], refetch: refetchInmuebleObs } = useQuery<InmuebleObservacion[]>({
    queryKey: ['/api/inmuebles', dato.id, 'observaciones'],
    enabled: tipo === 'inmueble' && open,
  });
  
  // Función para refrescar las observaciones después de agregar una nueva
  const handleObservacionAdded = () => {
    if (tipo === 'persona') {
      refetchPersonaObs();
    } else if (tipo === 'vehiculo') {
      refetchVehiculoObs();
    } else if (tipo === 'inmueble') {
      refetchInmuebleObs();
    }
    setShowAddForm(false);
  };

  // Valores por defecto
  let icon = <User className="h-6 w-6 text-gray-500" />;
  let color = "bg-gray-100";
  let titulo = "Detalles";
  let contenido = <p>No hay datos disponibles</p>;

  // Procesamos el contenido según el tipo de dato
  if (tipo === "persona") {
    const persona = dato as Persona;
    icon = <User className="h-6 w-6 text-blue-500" />;
    color = "bg-blue-100";
    titulo = persona.nombre || "Persona";
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Identificación</p>
            <p>{persona.identificacion || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Teléfonos</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.telefonos && persona.telefonos.length > 0 ? (
                persona.telefonos.map((telefono, index) => (
                  <Badge key={index} variant="outline">{telefono}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin teléfonos</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Domicilios</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.domicilios && persona.domicilios.length > 0 ? (
                persona.domicilios.map((domicilio, index) => (
                  <Badge key={index} variant="outline">{domicilio}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin domicilios</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Alias</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.alias && persona.alias.length > 0 ? (
                persona.alias.map((alias, index) => (
                  <Badge key={index} variant="outline">{alias}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin alias</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800">Observaciones</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? "Cancelar" : "Agregar"}
            </Button>
          </div>
          
          {showAddForm && tipo === "persona" && (
            <AddObservacionForm 
              tipo="persona" 
              id={persona.id} 
              onSuccess={handleObservacionAdded} 
            />
          )}
          
          <TablaObservaciones observaciones={observacionesPersona} />
        </div>
      </>
    );
  } 
  else if (tipo === "vehiculo") {
    const vehiculo = dato as Vehiculo;
    icon = <Car className="h-6 w-6 text-green-500" />;
    color = "bg-green-100";
    titulo = `${vehiculo.marca || ""} ${vehiculo.placa || ""}`;
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{vehiculo.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Color</p>
            <p>{vehiculo.color || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Modelo</p>
            <p>{vehiculo.modelo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Placa</p>
            <p>{vehiculo.placa || "No disponible"}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800">Observaciones</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? "Cancelar" : "Agregar"}
            </Button>
          </div>
          
          {showAddForm && tipo === "vehiculo" && (
            <AddObservacionForm 
              tipo="vehiculo" 
              id={vehiculo.id} 
              onSuccess={handleObservacionAdded} 
            />
          )}
          
          <TablaObservaciones observaciones={observacionesVehiculo} />
        </div>
      </>
    );
  }
  else if (tipo === "inmueble") {
    const inmueble = dato as Inmueble;
    icon = <Home className="h-6 w-6 text-purple-500" />;
    color = "bg-purple-100";
    titulo = inmueble.direccion || "Inmueble";
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{inmueble.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Propietario</p>
            <p>{inmueble.propietario || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Dirección</p>
            <p>{inmueble.direccion || "No disponible"}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800">Observaciones</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? "Cancelar" : "Agregar"}
            </Button>
          </div>
          
          {showAddForm && tipo === "inmueble" && (
            <AddObservacionForm 
              tipo="inmueble" 
              id={inmueble.id} 
              onSuccess={handleObservacionAdded} 
            />
          )}
          
          <TablaObservaciones observaciones={observacionesInmueble} />
        </div>
      </>
    );
  }
  else if (tipo === "ubicacion") {
    const ubicacion = dato as Ubicacion;
    icon = <MapPin className="h-6 w-6 text-amber-500" />;
    color = "bg-amber-100";
    titulo = `Ubicación ${ubicacion.tipo || ""}`;
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{ubicacion.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Fecha</p>
            <p>{ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Coordenadas</p>
            <p>Lat: {ubicacion.latitud}, Long: {ubicacion.longitud}</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Observaciones</h3>
          {ubicacion.observaciones ? (
            <p className="mt-1 whitespace-pre-wrap p-4 border rounded-md bg-muted">{ubicacion.observaciones}</p>
          ) : (
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay observaciones registradas.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </>
    );
  }

  // Obtener relaciones del elemento seleccionado
  const { data: relaciones, isLoading: cargandoRelaciones, error: errorRelaciones } = useQuery({
    queryKey: [`/api/relaciones/${tipo}/${dato?.id}`],
    queryFn: async () => {
      if (!dato) return null;
      console.log(`Obteniendo relaciones para ${tipo} con ID ${dato.id}`);
      try {
        // Usando apiRequest en lugar de fetch directo
        const url = `/api/relaciones/${tipo}/${dato.id}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          console.error(`Error al obtener relaciones: ${res.status} ${res.statusText}`);
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log(`Relaciones obtenidas:`, data);
        
        // Asegurarnos de que todas las propiedades existen
        const resultado = {
          personas: Array.isArray(data.personas) ? data.personas : [],
          vehiculos: Array.isArray(data.vehiculos) ? data.vehiculos : [],
          inmuebles: Array.isArray(data.inmuebles) ? data.inmuebles : [],
          ubicaciones: Array.isArray(data.ubicaciones) ? data.ubicaciones : []
        };
        
        return resultado;
      } catch (error) {
        console.error("Error al obtener relaciones:", error);
        // Retornar un objeto vacío pero válido en caso de error
        return {personas: [], vehiculos: [], inmuebles: [], ubicaciones: []};
      }
    },
    enabled: !!dato?.id,
    retry: 1 // Intentar una vez más en caso de error
  });
  
  // Verificación adicional de depuración
  console.log("Estado actual de relaciones:", {
    tieneRelaciones: !!relaciones,
    cargandoRelaciones,
    errorRelaciones,
    relaciones,
    tipo,
    datoId: dato?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className={`rounded-full p-2 ${color} w-fit mb-2`}>
            {icon}
          </div>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Información detallada
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {contenido}
          
          {/* Sección de relaciones */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Entidades Relacionadas</h3>
            
            {cargandoRelaciones && (
              <div className="text-center py-3">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Cargando relaciones...</p>
              </div>
            )}
            
            {errorRelaciones && (
              <div className="bg-red-50 p-3 rounded-md text-red-500 text-sm">
                Error al cargar relaciones: {errorRelaciones.message}
              </div>
            )}
            
            {/* Verificar si hay alguna relación */}
            {relaciones && !cargandoRelaciones && !errorRelaciones && 
              ((relaciones.personas?.length > 0 || 
               relaciones.vehiculos?.length > 0 || 
               relaciones.inmuebles?.length > 0 || 
               relaciones.ubicaciones?.length > 0) ? (
                <>
                  {/* Personas relacionadas */}
                  {relaciones.personas && relaciones.personas.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2 text-blue-500" />
                        Personas
                      </h4>
                      <div className="bg-blue-50 rounded-md p-3">
                        {relaciones.personas.map((persona: Persona) => (
                          <div key={persona.id} className="mb-2 last:mb-0 p-2 bg-white rounded border border-blue-100">
                            <p className="font-medium">{persona.nombre}</p>
                            <p className="text-sm text-gray-600">ID: {persona.identificacion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Vehículos relacionados */}
                  {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2 flex items-center">
                        <Car className="h-4 w-4 mr-2 text-green-500" />
                        Vehículos
                      </h4>
                      <div className="bg-green-50 rounded-md p-3">
                        {relaciones.vehiculos.map((vehiculo: Vehiculo) => (
                          <div key={vehiculo.id} className="mb-2 last:mb-0 p-2 bg-white rounded border border-green-100">
                            <p className="font-medium">{vehiculo.marca} {vehiculo.modelo}</p>
                            <p className="text-sm text-gray-600">Placa: {vehiculo.placa}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Inmuebles relacionados */}
                  {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2 flex items-center">
                        <Home className="h-4 w-4 mr-2 text-purple-500" />
                        Inmuebles
                      </h4>
                      <div className="bg-purple-50 rounded-md p-3">
                        {relaciones.inmuebles.map((inmueble: Inmueble) => (
                          <div key={inmueble.id} className="mb-2 last:mb-0 p-2 bg-white rounded border border-purple-100">
                            <p className="font-medium">{inmueble.tipo}</p>
                            <p className="text-sm text-gray-600">{inmueble.direccion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Ubicaciones relacionadas */}
                  {relaciones.ubicaciones && relaciones.ubicaciones.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                        Ubicaciones
                      </h4>
                      <div className="bg-amber-50 rounded-md p-3">
                        {relaciones.ubicaciones.map((ubicacion: Ubicacion) => (
                          <div key={ubicacion.id} className="mb-2 last:mb-0 p-2 bg-white rounded border border-amber-100">
                            <p className="font-medium">{ubicacion.tipo || "Ubicación"}</p>
                            <p className="text-sm text-gray-600">
                              {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleDateString() : "Sin fecha"} - 
                              Lat: {ubicacion.latitud}, Long: {ubicacion.longitud}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-md">
                  No hay entidades relacionadas con este registro
                </div>
              ))
            }
            
            {/* Mensaje si no hay relaciones cargadas y no hay error ni carga en progreso */}
            {!relaciones && !cargandoRelaciones && !errorRelaciones && (
              <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-md">
                No se pudieron cargar las relaciones
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}