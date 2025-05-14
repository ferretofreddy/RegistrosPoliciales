import React from "react";
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
  List, Link2, Info, AlertCircle 
} from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import PdfExport from "@/components/pdf-export";
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
        {inmueble.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{inmueble.observaciones}</p>
          </div>
        )}
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
        {ubicacion.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{ubicacion.observaciones}</p>
          </div>
        )}
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
    queryKey: [`/api/${tipo}s/${dato?.id}/observaciones`],
    queryFn: async () => {
      if (!dato) return [];
      const res = await fetch(`/api/${tipo}s/${dato.id}/observaciones`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!dato?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              <Info className="h-4 w-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger value="observaciones">
              <List className="h-4 w-4 mr-2" />
              Observaciones{observaciones.length > 0 && ` (${observaciones.length})`}
            </TabsTrigger>
            <TabsTrigger value="relaciones">
              <Link2 className="h-4 w-4 mr-2" />
              Relaciones
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
                          </div>
                        </TableCell>
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
                            <TableCell>{persona.nombre}</TableCell>
                            <TableCell>{persona.identificacion}</TableCell>
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
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-[100px]">Placa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.vehiculos.map((vehiculo: any) => (
                          <TableRow key={vehiculo.id}>
                            <TableCell>{vehiculo.marca}</TableCell>
                            <TableCell>{vehiculo.tipo}</TableCell>
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
                          <TableHead>Tipo</TableHead>
                          <TableHead>Dirección</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.inmuebles.map((inmueble: any) => (
                          <TableRow key={inmueble.id}>
                            <TableCell>{inmueble.tipo}</TableCell>
                            <TableCell>{inmueble.direccion}</TableCell>
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
                          <TableHead>Fecha</TableHead>
                          <TableHead>Coordenadas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relaciones.ubicaciones.map((ubicacion: any) => (
                          <TableRow key={ubicacion.id}>
                            <TableCell>{ubicacion.tipo}</TableCell>
                            <TableCell>
                              {ubicacion.fecha ? format(new Date(ubicacion.fecha), "dd/MM/yyyy") : "N/A"}
                            </TableCell>
                            <TableCell>
                              {`${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)}`}
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
          <PdfExport 
            data={{
              tipo, 
              item: dato,
              relaciones: relaciones || undefined
            }} 
          />
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}