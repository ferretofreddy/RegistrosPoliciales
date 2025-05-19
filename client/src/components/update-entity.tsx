import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EntityType } from "@/components/search-component";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Link2, Plus, User, Car, Building, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Esquema para las observaciones
const observacionSchema = z.object({
  detalle: z.string().min(3, { message: "La observación debe tener al menos 3 caracteres" }),
});

// Esquema para las relaciones
const relacionSchema = z.object({
  entidadId: z.string().min(1, { message: "Seleccione una entidad" }),
  tipoRelacion: z.string().optional(),
  tipo: z.enum(["persona", "vehiculo", "inmueble", "ubicacion"]),
});

interface UpdateEntityProps {
  entityId: number;
  entityType: Exclude<EntityType, "todas">;
}

export default function UpdateEntity({ entityId, entityType }: UpdateEntityProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("observaciones");
  const [relacionTipo, setRelacionTipo] = useState<"persona" | "vehiculo" | "inmueble" | "ubicacion">("persona");

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
      entidadId: "",
      tipoRelacion: "",
      tipo: "persona",
    },
  });

  // Establecer el tipo de relación cuando cambia
  useEffect(() => {
    relacionForm.setValue("tipo", relacionTipo);
  }, [relacionTipo, relacionForm]);

  // Obtener los datos de la entidad
  const { data: entity } = useQuery({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}`],
    enabled: !!entityId
  });

  // Definir tipos para las observaciones y relaciones
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

  // Obtener las observaciones de la entidad
  const { data: observaciones = [], refetch: refetchObservaciones } = useQuery<Observacion[]>({
    queryKey: [`/api/${entityType === 'ubicacion' ? 'ubicaciones' : entityType + 's'}/${entityId}/observaciones`],
    enabled: !!entityId,
  });

  // Obtener las relaciones de la entidad
  const { data: relaciones = { personas: [], vehiculos: [], inmuebles: [], ubicaciones: [] }, refetch: refetchRelaciones } = useQuery<Relaciones>({
    queryKey: [`/api/relaciones/${entityType}/${entityId}`],
    enabled: !!entityId
  });

  // Obtener listas de entidades para las relaciones
  const { data: personas = [] } = useQuery<Persona[]>({
    queryKey: ['/api/personas'],
    enabled: activeTab === "relaciones" && relacionTipo === "persona"
  });

  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({
    queryKey: ['/api/vehiculos'],
    enabled: activeTab === "relaciones" && relacionTipo === "vehiculo"
  });

  const { data: inmuebles = [] } = useQuery<Inmueble[]>({
    queryKey: ['/api/inmuebles'],
    enabled: activeTab === "relaciones" && relacionTipo === "inmueble"
  });

  const { data: ubicaciones = [] } = useQuery<Ubicacion[]>({
    queryKey: ['/api/ubicaciones'],
    enabled: activeTab === "relaciones" && relacionTipo === "ubicacion"
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
      // Construir la URL según los tipos de entidades
      let url = `/api/relaciones/${entityType}/${entityId}/${data.tipo}/${data.entidadId}`;
      
      // Si hay un tipo de relación específico, agregarlo como query param
      if (data.tipoRelacion) {
        url += `?relacion=${data.tipoRelacion}`;
      }
      
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
        entidadId: "", 
        tipoRelacion: "", 
        tipo: relacionTipo 
      });
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
    addRelacionMutation.mutate(data);
  };

  // Renderizar sección de observaciones
  const renderObservacionesSection = () => {
    return (
      <div className="space-y-4">
        <Form {...observacionForm}>
          <form onSubmit={observacionForm.handleSubmit(onSubmitObservacion)} className="space-y-4 p-4 border rounded-md">
            <h3 className="font-medium">Agregar nueva observación</h3>
            <FormField
              control={observacionForm.control}
              name="detalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalle de la observación</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingrese una observación relevante"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={addObservacionMutation.isPending}
            >
              {addObservacionMutation.isPending ? "Guardando..." : "Guardar Observación"}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Observaciones existentes</h3>
          
          {observaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead className="w-[120px]">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(observaciones as Observacion[]).map((obs, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{obs.detalle}</TableCell>
                    <TableCell className="font-medium">
                      {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>{obs.usuario || "Sistema"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hay observaciones registradas.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  };

  // Renderizar sección de relaciones
  const renderRelacionesSection = () => {
    const renderRelacionForm = () => {
      return (
        <Form {...relacionForm}>
          <form onSubmit={relacionForm.handleSubmit(onSubmitRelacion)} className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={relacionTipo === "persona" ? "default" : "outline"}
                  onClick={() => setRelacionTipo("persona")}
                  className="flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Persona</span>
                </Button>
                <Button
                  type="button"
                  variant={relacionTipo === "vehiculo" ? "default" : "outline"}
                  onClick={() => setRelacionTipo("vehiculo")}
                  className="flex items-center justify-center gap-2"
                >
                  <Car className="h-4 w-4 text-green-500" />
                  <span className="hidden sm:inline">Vehículo</span>
                </Button>
                <Button
                  type="button"
                  variant={relacionTipo === "inmueble" ? "default" : "outline"}
                  onClick={() => setRelacionTipo("inmueble")}
                  className="flex items-center justify-center gap-2"
                >
                  <Building className="h-4 w-4 text-purple-500" />
                  <span className="hidden sm:inline">Inmueble</span>
                </Button>
                <Button
                  type="button"
                  variant={relacionTipo === "ubicacion" ? "default" : "outline"}
                  onClick={() => setRelacionTipo("ubicacion")}
                  className="flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="hidden sm:inline">Ubicación</span>
                </Button>
              </div>
            </div>

            <FormField
              control={relacionForm.control}
              name="entidadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar {relacionTipo}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Seleccionar ${relacionTipo}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relacionTipo === "persona" && personas.map((persona: any) => (
                        <SelectItem key={persona.id} value={persona.id.toString()}>
                          {persona.nombre} ({persona.identificacion})
                        </SelectItem>
                      ))}
                      {relacionTipo === "vehiculo" && vehiculos.map((vehiculo: any) => (
                        <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                          {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                        </SelectItem>
                      ))}
                      {relacionTipo === "inmueble" && inmuebles.map((inmueble: any) => (
                        <SelectItem key={inmueble.id} value={inmueble.id.toString()}>
                          {inmueble.tipo}: {inmueble.direccion}
                        </SelectItem>
                      ))}
                      {relacionTipo === "ubicacion" && ubicaciones.map((ubicacion: any) => (
                        <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                          {ubicacion.tipo} - {ubicacion.observaciones || 'Sin observaciones'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={relacionForm.control}
              name="tipoRelacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de relación (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Propietario, Familiar, Asociado, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={addRelacionMutation.isPending}
            >
              {addRelacionMutation.isPending ? "Creando relación..." : "Crear Relación"}
            </Button>
          </form>
        </Form>
      );
    };

    const renderRelaciones = () => {
      const hasRelaciones = 
        relaciones.personas?.length > 0 || 
        relaciones.vehiculos?.length > 0 || 
        relaciones.inmuebles?.length > 0 ||
        relaciones.ubicaciones?.length > 0;

      if (!hasRelaciones) {
        return (
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay relaciones registradas para esta entidad.</AlertDescription>
          </Alert>
        );
      }

      return (
        <Accordion type="single" collapsible className="w-full">
          {relaciones.personas && relaciones.personas.length > 0 && (
            <AccordionItem value="personas">
              <AccordionTrigger className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span>Personas relacionadas ({relaciones.personas.length})</span>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}

          {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
            <AccordionItem value="vehiculos">
              <AccordionTrigger className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-500" />
                <span>Vehículos relacionados ({relaciones.vehiculos.length})</span>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}

          {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
            <AccordionItem value="inmuebles">
              <AccordionTrigger className="flex items-center gap-2">
                <Building className="h-4 w-4 text-purple-500" />
                <span>Inmuebles relacionados ({relaciones.inmuebles.length})</span>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          )}

          {relaciones.ubicaciones && relaciones.ubicaciones.length > 0 && (
            <AccordionItem value="ubicaciones">
              <AccordionTrigger className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>Ubicaciones relacionadas ({relaciones.ubicaciones.length})</span>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Coordenadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relaciones.ubicaciones.map((ubicacion: any) => (
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
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      );
    };

    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-md">
          <h3 className="font-medium mb-4">Crear nueva relación</h3>
          {renderRelacionForm()}
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Relaciones existentes</h3>
          {renderRelaciones()}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Actualizar {entityType === "persona" ? "Persona" : 
                       entityType === "vehiculo" ? "Vehículo" :
                       entityType === "inmueble" ? "Inmueble" : "Ubicación"}
            {entity && (
              <span className="text-sm font-normal ml-2 text-gray-500">
                - ID: {entityId}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="observaciones" className="flex-1">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Observaciones</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="relaciones" className="flex-1">
                <div className="flex items-center justify-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>Relaciones</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="observaciones" className="pt-4">
              {renderObservacionesSection()}
            </TabsContent>
            
            <TabsContent value="relaciones" className="pt-4">
              {renderRelacionesSection()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}