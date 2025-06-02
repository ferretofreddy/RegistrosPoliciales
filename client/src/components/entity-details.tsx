import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, Link2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/components/search-component";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ObservacionType = {
  id?: number;
  detalle: string;
  fecha: string | Date;
  usuario?: string;
};

type RelacionesType = {
  personas: any[];
  vehiculos: any[];
  inmuebles: any[];
  ubicaciones: any[];
};

interface EntityDetailsProps {
  entityId: number;
  entityType: Exclude<EntityType, "todas">;
  onRelatedItemClick?: (item: { id: number; tipo: EntityType; nombre?: string; referencia?: string }) => void;
}

export default function EntityDetails({ entityId, entityType, onRelatedItemClick }: EntityDetailsProps) {
  // Estado para guardar las observaciones y relaciones
  const [observaciones, setObservaciones] = useState<ObservacionType[]>([]);
  const [relaciones, setRelaciones] = useState<RelacionesType>({
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
  });

  // Obtener los datos de la entidad
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}`],
    enabled: !!entityId
  });

  // Obtener las observaciones de la entidad
  const { data: observacionesData, isLoading: isLoadingObservaciones } = useQuery<ObservacionType[]>({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}/observaciones`],
    enabled: !!entityId,
  });

  // Obtener las relaciones de la entidad
  const { data: relacionesData, isLoading: isLoadingRelaciones } = useQuery<RelacionesType>({
    queryKey: [`/api/relaciones/${entityType}/${entityId}`],
    enabled: !!entityId
  });
  
  // Actualizar los estados cuando llegan los datos
  useEffect(() => {
    if (observacionesData) {
      setObservaciones(observacionesData);
    }
  }, [observacionesData]);

  useEffect(() => {
    if (relacionesData) {
      setRelaciones(relacionesData);
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
              <p>
                {entityData.tipoIdentificacion && (
                  <span className="text-gray-600 mr-2">({entityData.tipoIdentificacion})</span>
                )}
                {entityData.identificacion}
              </p>
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
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold">Observaciones</h3>
        </div>
        
        {/* Tabla de observaciones */}
        {isLoadingObservaciones ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : observaciones.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-[100px]">Fecha</TableHead>
                <TableHead className="w-[120px]">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {observaciones.map((obs, index) => (
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
        ) : (
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay observaciones registradas para esta entidad.</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Renderizar sección de relaciones
  const renderRelaciones = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold">Entidades relacionadas</h3>
        </div>
        
        {/* Lista de relaciones existentes */}
        {isLoadingRelaciones ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Personas relacionadas */}
            {relaciones.personas && relaciones.personas.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Personas relacionadas
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Identificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relaciones.personas.map((persona) => (
                      <TableRow 
                        key={persona.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onRelatedItemClick?.({ 
                          id: persona.id, 
                          tipo: 'persona' as EntityType,
                          nombre: persona.nombre,
                          referencia: persona.identificacion
                        })}
                      >
                        <TableCell className="text-blue-600 hover:text-blue-800">{persona.nombre}</TableCell>
                        <TableCell>
                          {persona.tipoIdentificacion && (
                            <span className="text-gray-600 mr-2">({persona.tipoIdentificacion})</span>
                          )}
                          {persona.identificacion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Vehículos relacionados */}
            {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <span className="h-4 w-4 mr-2 text-green-500">🚗</span>
                  Vehículos relacionados
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relaciones.vehiculos.map((vehiculo) => (
                      <TableRow 
                        key={vehiculo.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onRelatedItemClick?.({ 
                          id: vehiculo.id, 
                          tipo: 'vehiculo' as EntityType,
                          nombre: `${vehiculo.marca} ${vehiculo.modelo}`,
                          referencia: vehiculo.placa
                        })}
                      >
                        <TableCell className="text-blue-600 hover:text-blue-800">{vehiculo.placa}</TableCell>
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
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <span className="h-4 w-4 mr-2 text-purple-500">🏢</span>
                  Inmuebles relacionados
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Dirección</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relaciones.inmuebles.map((inmueble) => (
                      <TableRow 
                        key={inmueble.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onRelatedItemClick?.({ 
                          id: inmueble.id, 
                          tipo: 'inmueble' as EntityType,
                          nombre: inmueble.tipo,
                          referencia: inmueble.direccion
                        })}
                      >
                        <TableCell className="text-blue-600 hover:text-blue-800">{inmueble.tipo}</TableCell>
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
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <span className="h-4 w-4 mr-2 text-red-500">📍</span>
                  Ubicaciones relacionadas
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Coordenadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relaciones.ubicaciones.map((ubicacion) => (
                      <TableRow 
                        key={ubicacion.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onRelatedItemClick?.({ 
                          id: ubicacion.id, 
                          tipo: 'ubicacion' as EntityType,
                          nombre: ubicacion.tipo,
                          referencia: ubicacion.observaciones || 'Sin observaciones'
                        })}
                      >
                        <TableCell className="text-blue-600 hover:text-blue-800">{ubicacion.tipo}</TableCell>
                        <TableCell>{ubicacion.observaciones || 'Sin observaciones'}</TableCell>
                        <TableCell>
                          {ubicacion.latitud && ubicacion.longitud ? 
                            `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` : 
                            'No disponibles'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Mensaje si no hay relaciones */}
            {!relaciones.personas?.length && 
             !relaciones.vehiculos?.length && 
             !relaciones.inmuebles?.length &&
             !relaciones.ubicaciones?.length && (
              <Alert variant="default" className="bg-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No hay relaciones registradas para esta entidad.</AlertDescription>
              </Alert>
            )}
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