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
import { 
  Car, Home, User, MapPin, Calendar, CalendarClock, 
  List, Link2, Info, AlertCircle, XCircle
} from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion";
  dato: Persona | Vehiculo | Inmueble | Ubicacion | null;
}

// Componente para mostrar las observaciones de una ubicación en un popover
function UbicacionObservaciones({ ubicacionId }: { ubicacionId: number }) {
  const [open, setOpen] = useState(false);
  
  // Consulta para obtener las observaciones de la ubicación
  const { data: observaciones, isLoading } = useQuery({
    queryKey: [`/api/ubicaciones/${ubicacionId}/observaciones`],
    queryFn: async () => {
      if (!open) return []; // No cargar datos hasta que se abra el popover
      const response = await fetch(`/api/ubicaciones/${ubicacionId}/observaciones`);
      if (!response.ok) throw new Error('Error al cargar observaciones');
      return response.json();
    },
    enabled: open, // Solo cargar cuando el popover esté abierto
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-left">
          Ver observaciones
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-[350px] max-h-[80vh] sm:w-80 sm:max-h-72 overflow-auto" side="right" align="start" alignOffset={-5} sideOffset={5}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">Observaciones de la ubicación</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={() => setOpen(false)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-2">Cargando...</div>
        ) : observaciones && observaciones.length > 0 ? (
          <div className="space-y-2">
            {observaciones.map((obs: any) => (
              <div key={obs.id} className="border rounded-sm p-2 text-xs">
                <div className="flex flex-wrap items-center gap-1 text-muted-foreground mb-1">
                  <CalendarClock className="h-3 w-3" />
                  <span className="truncate max-w-[150px] sm:max-w-[180px]">
                    {obs.fecha ? format(new Date(obs.fecha), "dd/MM/yyyy HH:mm") : "Fecha desconocida"}
                  </span>
                  <span className="ml-auto">{obs.usuario || "Sistema"}</span>
                </div>
                <p className="break-words">{obs.detalle}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-muted-foreground text-xs">
            No hay observaciones registradas
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function DetalleDialog({
  open,
  onOpenChange,
  tipo,
  dato,
}: DetalleDialogProps) {
  // Si no hay datos o el diálogo no está abierto, no renderizamos nada
  if (!dato || !open) return null;

  // Valores por defecto
  let icon = <User className="h-6 w-6 text-gray-500" />;
  let color = "bg-gray-100";
  let titulo = "Detalles";
  let contenido: React.ReactNode = <p>No hay datos disponibles</p>;

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
        {/* Las observaciones ahora se muestran en la pestaña de observaciones */}
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
        {/* Las observaciones ahora se muestran en la pestaña de observaciones */}
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
        {/* Las observaciones ahora se muestran en la pestaña de observaciones */}
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
        {/* Las observaciones ahora se muestran en la pestaña de observaciones */}
      </>
    );
  }

  // Obtener relaciones del elemento seleccionado
  const { data: relaciones = { personas: [], vehiculos: [], inmuebles: [], ubicaciones: [] } } = useQuery({
    queryKey: [`/api/relaciones/${tipo}/${dato?.id}`],
    queryFn: async () => {
      if (!dato) return { personas: [], vehiculos: [], inmuebles: [], ubicaciones: [] };
      const res = await fetch(`/api/relaciones/${tipo}/${dato.id}`);
      if (!res.ok) return { personas: [], vehiculos: [], inmuebles: [], ubicaciones: [] };
      return res.json();
    },
    enabled: !!dato?.id
  });

  // Obtener observaciones del elemento seleccionado
  const { data: observaciones = [] } = useQuery({
    queryKey: [`/api/${tipo === 'ubicacion' ? 'ubicaciones' : tipo + 's'}/${dato?.id}/observaciones`],
    queryFn: async () => {
      if (!dato) return [];
      // Manejar el caso especial para ubicaciones ya que no sigue el patrón regular de pluralización
      const endpoint = tipo === 'ubicacion' ? 'ubicaciones' : `${tipo}s`;
      const res = await fetch(`/api/${endpoint}/${dato.id}/observaciones`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!dato?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] mx-auto">
        <DialogHeader>
          <div className={`rounded-full p-2 ${color} w-fit mb-2`}>
            {icon}
          </div>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Información detallada
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacion">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline-block ml-2">Información</span>
            </TabsTrigger>
            <TabsTrigger value="observaciones">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline-block ml-2">
                Observaciones{observaciones.length > 0 && ` (${observaciones.length})`}
              </span>
              {observaciones.length > 0 && <span className="sm:hidden ml-1">{observaciones.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="relaciones">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline-block ml-2">Relaciones</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="informacion" className="py-4">
            {contenido}
          </TabsContent>
          
          <TabsContent value="observaciones" className="py-4">
            {observaciones.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Fecha</TableHead>
                      <TableHead className="w-[120px] hidden sm:table-cell">Usuario</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observaciones.map((obs: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1 text-xs">
                            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                            {obs.fecha ? format(new Date(obs.fecha), "dd/MM/yyyy HH:mm") : "Fecha desconocida"}
                            <span className="sm:hidden text-xs text-muted-foreground ml-1">({obs.usuario || "Sistema"})</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{obs.usuario || "Sistema"}</TableCell>
                        <TableCell>{obs.detalle}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert variant="default" className="bg-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No hay observaciones registradas.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="relaciones" className="py-4">
            <div className="space-y-6">
              {/* Personas relacionadas */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" /> 
                  Personas relacionadas
                </h3>
                {relaciones.personas && relaciones.personas.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="w-[140px]">Identificación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.personas.map((persona: any) => (
                          <TableRow key={persona.id}>
                            <TableCell className="align-top break-words">
                              <span className="line-clamp-2">{persona.nombre}</span>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              {persona.identificacion}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No hay personas relacionadas</div>
                )}
              </div>
              
              {/* Vehículos relacionados */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Car className="h-4 w-4 mr-2 text-green-500" /> 
                  Vehículos relacionados
                </h3>
                {relaciones.vehiculos && relaciones.vehiculos.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Marca</TableHead>
                          <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                          <TableHead className="w-[100px]">Placa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.vehiculos.map((vehiculo: any) => (
                          <TableRow key={vehiculo.id}>
                            <TableCell>
                              {vehiculo.marca}
                              <span className="sm:hidden text-xs text-muted-foreground ml-1">({vehiculo.tipo})</span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{vehiculo.tipo}</TableCell>
                            <TableCell>{vehiculo.placa}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No hay vehículos relacionados</div>
                )}
              </div>
              
              {/* Inmuebles relacionados */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Home className="h-4 w-4 mr-2 text-purple-500" /> 
                  Inmuebles relacionados
                </h3>
                {relaciones.inmuebles && relaciones.inmuebles.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/3">Tipo</TableHead>
                          <TableHead>Dirección</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.inmuebles.map((inmueble: any) => (
                          <TableRow key={inmueble.id}>
                            <TableCell className="align-top">{inmueble.tipo}</TableCell>
                            <TableCell className="break-words">{inmueble.direccion}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No hay inmuebles relacionados</div>
                )}
              </div>
              
              {/* Ubicaciones relacionadas */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-amber-500" /> 
                  Ubicaciones relacionadas
                </h3>
                {relaciones.ubicaciones && relaciones.ubicaciones.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="hidden sm:table-cell">Coordenadas</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.ubicaciones.map((ubicacion: any) => (
                          <TableRow key={ubicacion.id}>
                            <TableCell className="align-top">
                              {ubicacion.tipo}
                              <div className="sm:hidden text-xs text-muted-foreground mt-1">
                                {`${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)}`}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {`${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)}`}
                            </TableCell>
                            <TableCell className="align-top">
                              <UbicacionObservaciones ubicacionId={ubicacion.id} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No hay ubicaciones relacionadas</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between">
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}