import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/components/search-component";

interface EntityDetailsProps {
  entityId: number;
  entityType: Exclude<EntityType, "todas">;
}

export default function EntityDetails({ entityId, entityType }: EntityDetailsProps) {
  // Estado para guardar las observaciones y relaciones
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [relaciones, setRelaciones] = useState<{
    personas: any[];
    vehiculos: any[];
    inmuebles: any[];
    ubicaciones: any[];
  }>({
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
  });

  // Obtener los datos de la entidad
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: [`/api/${entityType}s/${entityId}`],
    enabled: !!entityId
  });

  // Obtener las observaciones de la entidad
  const { data: observacionesData, isLoading: isLoadingObservaciones } = useQuery({
    queryKey: [`/api/${entityType}s/${entityId}/observaciones`],
    enabled: !!entityId,
  });

  // Obtener las relaciones de la entidad
  const { data: relacionesData, isLoading: isLoadingRelaciones } = useQuery({
    queryKey: [`/api/relaciones/${entityType}/${entityId}`],
    enabled: !!entityId
  });

  // Actualizar los estados cuando llegan los datos
  useEffect(() => {
    if (observacionesData) {
      setObservaciones(observacionesData as any[]);
    }
  }, [observacionesData]);

  useEffect(() => {
    if (relacionesData) {
      setRelaciones(relacionesData as {
        personas: any[];
        vehiculos: any[];
        inmuebles: any[];
        ubicaciones: any[];
      });
    }
  }, [relacionesData]);

  // Renderizar los detalles según el tipo de entidad
  const renderEntityDetails = () => {
    if (isLoadingEntity) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (!entity) {
      return <p className="text-gray-500">No se encontró información para este registro.</p>;
    }

    const entityData = entity as any;

    switch (entityType) {
      case "persona":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Nombre:</h3>
              <p>{entityData.nombre}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Identificación:</h3>
              <p>{entityData.identificacion}</p>
            </div>
            {entityData.alias && entityData.alias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="text-lg font-semibold">Alias:</h3>
                {entityData.alias.map((alias: string, index: number) => (
                  <Badge key={index} variant="outline">{alias}</Badge>
                ))}
              </div>
            )}
            {entityData.telefonos && entityData.telefonos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="text-lg font-semibold">Teléfonos:</h3>
                {entityData.telefonos.map((telefono: string, index: number) => (
                  <Badge key={index} variant="outline">{telefono}</Badge>
                ))}
              </div>
            )}
            {entityData.domicilios && entityData.domicilios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="text-lg font-semibold">Domicilios:</h3>
                {entityData.domicilios.map((domicilio: string, index: number) => (
                  <Badge key={index} variant="outline">{domicilio}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      case "vehiculo":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Placa:</h3>
              <p>{entityData.placa}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Marca:</h3>
              <p>{entityData.marca}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Modelo:</h3>
              <p>{entityData.modelo}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Color:</h3>
              <p>{entityData.color}</p>
            </div>
            {entityData.tipo && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Tipo:</h3>
                <p>{entityData.tipo}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "inmueble":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Tipo:</h3>
              <p>{entityData.tipo}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Dirección:</h3>
              <p>{entityData.direccion}</p>
            </div>
            {entityData.propietario && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Propietario:</h3>
                <p>{entityData.propietario}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "ubicacion":
        return (
          <div className="space-y-3">
            {entityData.tipo && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Tipo:</h3>
                <p>{entityData.tipo}</p>
              </div>
            )}
            {entityData.latitud && entityData.longitud && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Coordenadas:</h3>
                <p>Lat: {entityData.latitud.toFixed(6)}, Lng: {entityData.longitud.toFixed(6)}</p>
              </div>
            )}
            {entityData.fecha && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Fecha:</h3>
                <p>{new Date(entityData.fecha).toLocaleDateString()}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Tipo de entidad no reconocido.</p>;
    }
  };

  // Renderizar tabla de observaciones
  const renderObservaciones = () => {
    if (isLoadingObservaciones) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    if (!observaciones || observaciones.length === 0) {
      return <p className="text-gray-500">No hay observaciones registradas para esta entidad.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Detalle</TableHead>
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead className="w-[120px]">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {observaciones.map((obs: any, index: number) => (
            <TableRow key={index}>
              <TableCell>{obs.detalle}</TableCell>
              <TableCell className="font-medium">
                {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>{obs.usuario || "Usuario del sistema"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Renderizar sección de relaciones
  const renderRelaciones = () => {
    if (isLoadingRelaciones) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    const hasRelaciones = 
      relaciones.personas?.length > 0 || 
      relaciones.vehiculos?.length > 0 || 
      relaciones.inmuebles?.length > 0 || 
      relaciones.ubicaciones?.length > 0;

    if (!hasRelaciones) {
      return <p className="text-gray-500">No hay relaciones registradas para esta entidad.</p>;
    }

    return (
      <div className="space-y-6">
        {/* Personas relacionadas */}
        {relaciones.personas && relaciones.personas.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Personas relacionadas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Identificación</TableHead>
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
        )}

        {/* Vehículos relacionados */}
        {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Vehículos relacionados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.vehiculos.map((vehiculo: any) => (
                  <TableRow key={vehiculo.id}>
                    <TableCell>{vehiculo.placa}</TableCell>
                    <TableCell>{vehiculo.marca}</TableCell>
                    <TableCell>{vehiculo.modelo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Inmuebles relacionados */}
        {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Inmuebles relacionados</h3>
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
        )}

        {/* Ubicaciones relacionadas */}
        {relaciones.ubicaciones && relaciones.ubicaciones.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Ubicaciones directas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.ubicaciones.map((ubicacion: any) => (
                  <TableRow key={ubicacion.id}>
                    <TableCell>{ubicacion.tipo || "Sin tipo"}</TableCell>
                    <TableCell>
                      {ubicacion.latitud && ubicacion.longitud
                        ? `Lat: ${ubicacion.latitud.toFixed(6)}, Lng: ${ubicacion.longitud.toFixed(6)}`
                        : "Sin coordenadas"}
                    </TableCell>
                    <TableCell>
                      {ubicacion.fecha
                        ? new Date(ubicacion.fecha).toLocaleDateString()
                        : "Sin fecha"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Otras ubicaciones (no domicilios ni inmuebles) */}
        {relaciones.otrasUbicaciones && relaciones.otrasUbicaciones.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Ubicaciones relacionadas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.otrasUbicaciones.map((ubicacion: any) => {
                  // Excluir ubicaciones de tipo domicilio o inmueble para la página de consultas
                  const tipoLowerCase = (ubicacion.tipo || "").toLowerCase();
                  const esDomicilio = tipoLowerCase === 'domicilio' || tipoLowerCase.includes('domicilio');
                  const esInmueble = tipoLowerCase === 'inmueble' || tipoLowerCase.includes('inmueble');
                  
                  // Si es domicilio o inmueble, no mostrar en esta sección
                  if (esDomicilio || esInmueble) return null;
                  
                  return (
                    <TableRow key={ubicacion.id}>
                      <TableCell>{ubicacion.tipo || "Sin tipo"}</TableCell>
                      <TableCell>
                        {ubicacion.latitud && ubicacion.longitud
                          ? `Lat: ${ubicacion.latitud.toFixed(6)}, Lng: ${ubicacion.longitud.toFixed(6)}`
                          : "Sin coordenadas"}
                      </TableCell>
                      <TableCell>
                        {ubicacion.fecha
                          ? new Date(ubicacion.fecha).toLocaleDateString()
                          : "Sin fecha"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Información Detallada */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {entityType === "persona" && "Persona"}
            {entityType === "vehiculo" && "Vehículo"}
            {entityType === "inmueble" && "Inmueble"}
            {entityType === "ubicacion" && "Ubicación"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-semibold">Información Detallada</h3>
          </div>
          <div className="p-2">
            {renderEntityDetails()}
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span>Observaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-1">
            {renderObservaciones()}
          </div>
        </CardContent>
      </Card>

      {/* Relaciones */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            <span>Relaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-1">
            {renderRelaciones()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}