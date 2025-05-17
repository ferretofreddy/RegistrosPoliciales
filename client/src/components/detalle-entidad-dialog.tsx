import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Car, Home, Map } from "lucide-react";

// Componente para mostrar detalles de entidades y sus relaciones
export default function DetalleEntidadDialog({
  tipo,
  id,
  onVerEnMapa
}: {
  tipo: string;
  id: number;
  onVerEnMapa: (tipo: string, id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  
  // Consulta para obtener los detalles y relaciones de la entidad
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/relaciones/${tipo}/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/relaciones/${tipo}/${id}`);
      if (!response.ok) {
        throw new Error(`Error al obtener relaciones para ${tipo} ${id}`);
      }
      return response.json();
    },
    enabled: open,
  });

  // Consulta para obtener los detalles específicos de la entidad
  const { data: entidadData, isLoading: isLoadingEntidad } = useQuery({
    queryKey: [`/api/${tipo === 'persona' ? 'personas' : tipo === 'vehiculo' ? 'vehiculos' : tipo === 'inmueble' ? 'inmuebles' : 'ubicaciones'}/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/${tipo === 'persona' ? 'personas' : tipo === 'vehiculo' ? 'vehiculos' : tipo === 'inmueble' ? 'inmuebles' : 'ubicaciones'}/${id}`);
      if (!response.ok) {
        throw new Error(`Error al obtener detalles para ${tipo} ${id}`);
      }
      return response.json();
    },
    enabled: open,
  });

  // Manejar la visualización en el mapa
  const handleVerEnMapa = () => {
    onVerEnMapa(tipo, id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ver detalles</Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isLoadingEntidad ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando detalles...
              </span>
            ) : (
              <>
                {tipo === 'persona' ? (
                  <span className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-red-500" />
                    {entidadData?.nombre || `Persona ID: ${id}`}
                  </span>
                ) : tipo === 'vehiculo' ? (
                  <span className="flex items-center">
                    <Car className="h-5 w-5 mr-2 text-blue-500" />
                    {(entidadData?.marca && entidadData?.placa) ? 
                      `${entidadData.marca} (${entidadData.placa})` : 
                      `Vehículo ID: ${id}`}
                  </span>
                ) : tipo === 'inmueble' ? (
                  <span className="flex items-center">
                    <Home className="h-5 w-5 mr-2 text-green-500" />
                    {entidadData?.tipo ? 
                      `${entidadData.tipo} - ${entidadData?.direccion || 'Sin dirección'}` : 
                      `Inmueble ID: ${id}`}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Map className="h-5 w-5 mr-2 text-purple-500" />
                    {entidadData?.tipo ? 
                      `Ubicación: ${entidadData.tipo}` : 
                      `Ubicación ID: ${id}`}
                  </span>
                )}
              </>
            )}
          </DialogTitle>
          
          <DialogDescription>
            {entidadData && (
              <div className="text-sm text-gray-500 mt-1">
                {tipo === 'persona' && entidadData.identificacion && (
                  <div>Identificación: {entidadData.identificacion}</div>
                )}
                
                {tipo === 'vehiculo' && (
                  <>
                    {entidadData.tipo && <div>Tipo: {entidadData.tipo}</div>}
                    {entidadData.color && <div>Color: {entidadData.color}</div>}
                    {entidadData.modelo && <div>Modelo: {entidadData.modelo}</div>}
                  </>
                )}
                
                {tipo === 'inmueble' && (
                  <>
                    {entidadData.propietario && <div>Propietario: {entidadData.propietario}</div>}
                  </>
                )}
                
                {tipo === 'ubicacion' && (
                  <>
                    {entidadData.fecha && <div>Fecha: {entidadData.fecha}</div>}
                    {entidadData.latitud && entidadData.longitud && (
                      <div>Coordenadas: {entidadData.latitud.toFixed(6)}, {entidadData.longitud.toFixed(6)}</div>
                    )}
                  </>
                )}
                
                {entidadData.observaciones && (
                  <div className="mt-1 italic">{entidadData.observaciones}</div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-4" />
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3">Cargando relaciones...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            Error al cargar las relaciones: {(error as Error).message}
          </div>
        ) : (
          <Tabs defaultValue="personas" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="personas" className="flex items-center gap-1">
                <User className="h-4 w-4" /> 
                Personas
                {data?.personas && (
                  <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-1.5 py-0.5">
                    {data.personas.length}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="vehiculos" className="flex items-center gap-1">
                <Car className="h-4 w-4" /> 
                Vehículos
                {data?.vehiculos && (
                  <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-1.5 py-0.5">
                    {data.vehiculos.length}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="inmuebles" className="flex items-center gap-1">
                <Home className="h-4 w-4" /> 
                Inmuebles
                {data?.inmuebles && (
                  <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-1.5 py-0.5">
                    {data.inmuebles.length}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="ubicaciones" className="flex items-center gap-1">
                <Map className="h-4 w-4" /> 
                Ubicaciones
                {data?.ubicaciones && (
                  <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-1.5 py-0.5">
                    {data.ubicaciones.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personas" className="overflow-y-auto max-h-[300px]">
              {data?.personas && data.personas.length > 0 ? (
                <div className="space-y-2">
                  {data.personas.map((persona: any) => (
                    <div key={persona.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-1 text-red-500" />
                          {persona.nombre}
                        </div>
                        {persona.identificacion && (
                          <div className="text-sm text-gray-500">ID: {persona.identificacion}</div>
                        )}
                      </div>
                      <DetalleEntidadDialog tipo="persona" id={persona.id} onVerEnMapa={onVerEnMapa} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No hay personas relacionadas</div>
              )}
            </TabsContent>
            
            <TabsContent value="vehiculos" className="overflow-y-auto max-h-[300px]">
              {data?.vehiculos && data.vehiculos.length > 0 ? (
                <div className="space-y-2">
                  {data.vehiculos.map((vehiculo: any) => (
                    <div key={vehiculo.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <Car className="h-4 w-4 mr-1 text-blue-500" />
                          {vehiculo.marca} {vehiculo.placa && `(${vehiculo.placa})`}
                        </div>
                        {vehiculo.tipo && (
                          <div className="text-sm text-gray-500">{vehiculo.tipo} {vehiculo.color && `- ${vehiculo.color}`}</div>
                        )}
                      </div>
                      <DetalleEntidadDialog tipo="vehiculo" id={vehiculo.id} onVerEnMapa={onVerEnMapa} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No hay vehículos relacionados</div>
              )}
            </TabsContent>
            
            <TabsContent value="inmuebles" className="overflow-y-auto max-h-[300px]">
              {data?.inmuebles && data.inmuebles.length > 0 ? (
                <div className="space-y-2">
                  {data.inmuebles.map((inmueble: any) => (
                    <div key={inmueble.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <Home className="h-4 w-4 mr-1 text-green-500" />
                          {inmueble.tipo || "Inmueble"}
                        </div>
                        {inmueble.direccion && (
                          <div className="text-sm text-gray-500">{inmueble.direccion}</div>
                        )}
                      </div>
                      <DetalleEntidadDialog tipo="inmueble" id={inmueble.id} onVerEnMapa={onVerEnMapa} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No hay inmuebles relacionados</div>
              )}
            </TabsContent>
            
            <TabsContent value="ubicaciones" className="overflow-y-auto max-h-[300px]">
              {data?.ubicaciones && data.ubicaciones.length > 0 ? (
                <div className="space-y-2">
                  {data.ubicaciones.map((ubicacion: any) => (
                    <div key={ubicacion.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <Map className="h-4 w-4 mr-1 text-purple-500" />
                          {ubicacion.tipo || "Ubicación"}
                        </div>
                        {ubicacion.latitud && ubicacion.longitud && (
                          <div className="text-sm text-gray-500">
                            {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                          </div>
                        )}
                        {ubicacion.observaciones && (
                          <div className="text-xs text-gray-500 italic mt-1">{ubicacion.observaciones}</div>
                        )}
                      </div>
                      <DetalleEntidadDialog tipo="ubicacion" id={ubicacion.id} onVerEnMapa={onVerEnMapa} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No hay ubicaciones relacionadas</div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="default" onClick={handleVerEnMapa}>Ver ubicaciones en mapa</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}