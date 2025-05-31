import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, Link2, Plus, Car, Building, MapPin, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/components/search-component";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EntitySearch from "@/components/entity-search";

// Esquema para las observaciones
const observacionSchema = z.object({
  detalle: z.string().min(3, { message: "La observación debe tener al menos 3 caracteres" }),
});

// Esquema para las relaciones
const relacionSchema = z.object({
  tipo: z.enum(["persona", "vehiculo", "inmueble", "ubicacion"]),
});

// Tipos para las entidades y relaciones
type Observacion = {
  id?: number;
  detalle: string;
  fecha: string | Date;
  usuario?: string;
};

type Persona = {
  id: number;
  nombre: string;
  identificacion: string;
};

type Vehiculo = {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
};

type Inmueble = {
  id: number;
  tipo: string;
  direccion: string;
};

type Ubicacion = {
  id: number;
  tipo: string;
  observaciones?: string;
  latitud?: number;
  longitud?: number;
};

type Relaciones = {
  personas: Persona[];
  vehiculos: Vehiculo[];
  inmuebles: Inmueble[];
  ubicaciones: Ubicacion[];
};

interface UpdateEntityDetailsProps {
  entityId: number;
  entityType: Exclude<EntityType, "todas">;
}

export default function UpdateEntityDetails({ entityId, entityType }: UpdateEntityDetailsProps) {
  const { toast } = useToast();
  const [showObservacionForm, setShowObservacionForm] = useState(false);
  const [relacionTipo, setRelacionTipo] = useState<"persona" | "vehiculo" | "inmueble" | "ubicacion">("persona");
  const [showRelacionForm, setShowRelacionForm] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  // Estado para guardar las observaciones y relaciones
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<Relaciones>({
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
  });
  
  // Formulario para nuevas observaciones
  const observacionForm = useForm<z.infer<typeof observacionSchema>>({
    resolver: zodResolver(observacionSchema),
    defaultValues: {
      detalle: "",
    },
  });
  
  // Formulario para nuevas relaciones
  const relacionForm = useForm<z.infer<typeof relacionSchema>>({
    resolver: zodResolver(relacionSchema),
    defaultValues: {
      tipo: "persona",
    },
  });
  
  // Establecer el tipo de relación cuando cambia
  useEffect(() => {
    relacionForm.setValue("tipo", relacionTipo);
  }, [relacionTipo, relacionForm]);

  // Obtener los datos de la entidad
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}`],
    enabled: !!entityId
  });

  // Obtener las observaciones de la entidad
  const { data: observacionesData, isLoading: isLoadingObservaciones, refetch: refetchObservaciones } = useQuery<Observacion[]>({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}/observaciones`],
    enabled: !!entityId,
  });

  // Obtener las relaciones de la entidad
  const { data: relacionesData, isLoading: isLoadingRelaciones, refetch: refetchRelaciones } = useQuery<Relaciones>({
    queryKey: [`/api/relaciones/${entityType}/${entityId}`],
    enabled: !!entityId
  });
  
  // Obtener listas de entidades para las relaciones
  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    enabled: showRelacionForm && relacionTipo === "persona"
  });

  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ['/api/vehiculos'],
    enabled: showRelacionForm && relacionTipo === "vehiculo"
  });

  const { data: inmuebles = [] } = useQuery<Inmueble[]>({
    queryKey: ['/api/inmuebles'],
    enabled: showRelacionForm && relacionTipo === "inmueble"
  });

  const { data: ubicaciones = [] } = useQuery<Ubicacion[]>({
    queryKey: ['/api/ubicaciones'],
    enabled: showRelacionForm && relacionTipo === "ubicacion"
  });
  
  // Mutación para agregar una observación
  const addObservacionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof observacionSchema>) => {
      const endpoint = entityType === 'ubicacion' ? 'ubicaciones' : `${entityType}s`;
      const response = await fetch(`/api/${endpoint}/${entityId}/observaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar la observación');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Observación agregada",
        description: "La observación se ha agregado correctamente.",
      });
      observacionForm.reset();
      setShowObservacionForm(false);
      refetchObservaciones();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo agregar la observación: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutación para agregar una relación
  const addRelacionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof relacionSchema>) => {
      if (!selectedEntity) {
        throw new Error('Debe seleccionar una entidad');
      }
      
      // Construir la URL según los tipos de entidades
      let url = `/api/relaciones/${entityType}/${entityId}/${data.tipo}/${selectedEntity.id}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la relación');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Relación creada",
        description: "La relación se ha creado correctamente.",
      });
      relacionForm.reset({ 
        tipo: relacionTipo 
      });
      setSelectedEntity(null);
      setShowRelacionForm(false);
      refetchRelaciones();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la relación: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Manejar envío de nueva observación
  const onSubmitObservacion = (data: z.infer<typeof observacionSchema>) => {
    addObservacionMutation.mutate(data);
  };
  
  // Manejar envío de nueva relación
  const onSubmitRelacion = (data: z.infer<typeof relacionSchema>) => {
    if (!selectedEntity) {
      toast({
        title: "Error",
        description: "Debe seleccionar una entidad para crear la relación",
        variant: "destructive",
      });
      return;
    }
    addRelacionMutation.mutate(data);
  };

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
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold">Observaciones existentes</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setShowObservacionForm(!showObservacionForm)}
          >
            <Plus className="h-4 w-4" />
            {showObservacionForm ? "Cancelar" : "Agregar Observación"}
          </Button>
        </div>
        
        {/* Formulario para agregar observaciones */}
        {showObservacionForm && (
          <div className="border border-gray-200 rounded-md p-4 mb-4 bg-muted/30">
            <Form {...observacionForm}>
              <form onSubmit={observacionForm.handleSubmit(onSubmitObservacion)} className="space-y-4">
                <FormField
                  control={observacionForm.control}
                  name="detalle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Observación</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ingrese una observación relevante" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={addObservacionMutation.isPending}
                  >
                    {addObservacionMutation.isPending ? "Guardando..." : "Guardar Observación"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
        
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
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setShowRelacionForm(!showRelacionForm)}
          >
            <Plus className="h-4 w-4" />
            {showRelacionForm ? "Cancelar" : "Crear Relación"}
          </Button>
        </div>
        
        {/* Formulario para agregar relaciones */}
        {showRelacionForm && (
          <div className="border border-gray-200 rounded-md p-4 mb-4 bg-muted/30">
            <Form {...relacionForm}>
              <form onSubmit={relacionForm.handleSubmit(onSubmitRelacion)} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRelacionTipo("persona")}
                    className={`flex items-center justify-center gap-2 ${
                      relacionTipo === "persona" 
                        ? "bg-blue-500 text-white hover:bg-blue-600" 
                        : "border-blue-200 hover:border-blue-300"
                    }`}
                  >
                    <User className={`h-4 w-4 ${relacionTipo === "persona" ? "text-white" : "text-blue-500"}`} />
                    <span className="hidden sm:inline">Persona</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRelacionTipo("vehiculo")}
                    className={`flex items-center justify-center gap-2 ${
                      relacionTipo === "vehiculo" 
                        ? "bg-green-500 text-white hover:bg-green-600" 
                        : "border-green-200 hover:border-green-300"
                    }`}
                  >
                    <Car className={`h-4 w-4 ${relacionTipo === "vehiculo" ? "text-white" : "text-green-500"}`} />
                    <span className="hidden sm:inline">Vehículo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRelacionTipo("inmueble")}
                    className={`flex items-center justify-center gap-2 ${
                      relacionTipo === "inmueble" 
                        ? "bg-purple-500 text-white hover:bg-purple-600" 
                        : "border-purple-200 hover:border-purple-300"
                    }`}
                  >
                    <Building className={`h-4 w-4 ${relacionTipo === "inmueble" ? "text-white" : "text-purple-500"}`} />
                    <span className="hidden sm:inline">Inmueble</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRelacionTipo("ubicacion")}
                    className={`flex items-center justify-center gap-2 ${
                      relacionTipo === "ubicacion" 
                        ? "bg-red-500 text-white hover:bg-red-600" 
                        : "border-red-200 hover:border-red-300"
                    }`}
                  >
                    <MapPin className={`h-4 w-4 ${relacionTipo === "ubicacion" ? "text-white" : "text-red-500"}`} />
                    <span className="hidden sm:inline">Ubicación</span>
                  </Button>
                </div>
                
                <div>
                  <FormLabel>Seleccionar {relacionTipo}</FormLabel>
                  <div className="mt-1">
                    <EntitySearch
                      entityType={relacionTipo}
                      placeholder={`Buscar ${relacionTipo}...`}
                      onSelect={(entity) => setSelectedEntity(entity)}
                      selectedEntities={selectedEntity ? [selectedEntity] : []}
                      multiple={false}
                    />
                  </div>
                </div>
                

                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={addRelacionMutation.isPending}
                  >
                    {addRelacionMutation.isPending ? "Creando relación..." : "Crear Relación"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
        
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
                    {(relaciones.personas as Persona[]).map((persona) => (
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
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <Car className="h-4 w-4 mr-2 text-green-500" />
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
                    {(relaciones.vehiculos as Vehiculo[]).map((vehiculo) => (
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
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-purple-500" />
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
                    {(relaciones.inmuebles as Inmueble[]).map((inmueble) => (
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
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
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
                    {(relaciones.ubicaciones as Ubicacion[]).map((ubicacion) => (
                      <TableRow key={ubicacion.id}>
                        <TableCell>{ubicacion.tipo}</TableCell>
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