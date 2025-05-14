import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertPersonaSchema, insertPersonaObservacionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Upload, Camera, MapPin, CalendarClock, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

// Esquema para observaciones
const observacionSchema = z.object({
  detalle: z.string().min(1, "La observación no puede estar vacía"),
});

// Extender el esquema para el formulario con validaciones adicionales
const personaFormSchema = insertPersonaSchema.extend({
  nuevoAlias: z.string().optional(),
  nuevoTelefono: z.string().optional(),
  nuevoDomicilio: z.string().optional(),
  vehiculoSeleccionado: z.string().optional(),
  inmuebleSeleccionado: z.string().optional(),
  personaSeleccionada: z.string().optional(),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
  nuevaObservacion: z.string().optional(),
});

type PersonaFormValues = z.infer<typeof personaFormSchema>;

export default function PersonaForm() {
  const { toast } = useToast();
  const [aliases, setAliases] = useState<string[]>([]);
  const [telefonos, setTelefonos] = useState<string[]>([]);
  const [domicilios, setDomicilios] = useState<{ direccion: string; latitud?: string; longitud?: string }[]>([]);
  const [relacionVehiculos, setRelacionVehiculos] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionInmuebles, setRelacionInmuebles] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionPersonas, setRelacionPersonas] = useState<{ id: number; nombre: string }[]>([]);
  const [observaciones, setObservaciones] = useState<{detalle: string; fecha?: Date}[]>([]);
  const [showNewDomicilio, setShowNewDomicilio] = useState(false);
  const [showObservacionForm, setShowObservacionForm] = useState(false);

  // Obtener lista de vehículos disponibles para las relaciones
  const { data: vehiculos } = useQuery({
    queryKey: ['/api/vehiculos'],
    queryFn: async () => {
      const res = await fetch('/api/vehiculos');
      if (!res.ok) throw new Error('Error al cargar vehículos');
      return res.json();
    }
  });

  // Obtener lista de inmuebles disponibles para las relaciones
  const { data: inmuebles } = useQuery({
    queryKey: ['/api/inmuebles'],
    queryFn: async () => {
      const res = await fetch('/api/inmuebles');
      if (!res.ok) throw new Error('Error al cargar inmuebles');
      return res.json();
    }
  });
  
  // Obtener lista de personas disponibles para las relaciones
  const { data: personas } = useQuery({
    queryKey: ['/api/personas'],
    queryFn: async () => {
      const res = await fetch('/api/personas');
      if (!res.ok) throw new Error('Error al cargar personas');
      return res.json();
    }
  });

  // Configurar el formulario con React Hook Form
  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      nombre: "",
      identificacion: "",
      nuevoAlias: "",
      nuevoTelefono: "",
      nuevoDomicilio: "",
      latitud: "",
      longitud: "",
      vehiculoSeleccionado: "",
      inmuebleSeleccionado: "",
      personaSeleccionada: "",
      nuevaObservacion: "",
    },
  });

  // Mutación para enviar el formulario
  const createPersonaMutation = useMutation({
    mutationFn: async (values: PersonaFormValues) => {
      // Preparar los datos para enviar al servidor
      const personaData = {
        nombre: values.nombre,
        identificacion: values.identificacion,
        alias: aliases,
        telefonos: telefonos,
        domicilios: domicilios.map(d => d.direccion),
      };

      const res = await apiRequest("POST", "/api/personas", personaData);
      const persona = await res.json();
      
      // Si hay observaciones, las agregamos a la persona creada
      if (observaciones.length > 0) {
        for (const obs of observaciones) {
          await apiRequest("POST", `/api/personas/${persona.id}/observaciones`, {
            detalle: obs.detalle
          });
        }
      }
      
      // Si hay vehículos relacionados, creamos las relaciones
      if (relacionVehiculos.length > 0) {
        for (const vehiculo of relacionVehiculos) {
          await apiRequest("POST", `/api/relaciones`, {
            tipo1: "personas",
            id1: persona.id,
            tipo2: "vehiculos",
            id2: vehiculo.id
          });
        }
      }
      
      // Si hay inmuebles relacionados, creamos las relaciones
      if (relacionInmuebles.length > 0) {
        for (const inmueble of relacionInmuebles) {
          await apiRequest("POST", `/api/relaciones`, {
            tipo1: "personas",
            id1: persona.id,
            tipo2: "inmuebles",
            id2: inmueble.id
          });
        }
      }
      
      // Si hay personas relacionadas, creamos las relaciones
      if (relacionPersonas.length > 0) {
        for (const otraPersona of relacionPersonas) {
          await apiRequest("POST", `/api/relaciones`, {
            tipo1: "persona",
            id1: persona.id,
            tipo2: "persona",
            id2: otraPersona.id
          });
        }
      }
      
      return persona;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Persona registrada correctamente",
      });
      // Reiniciar formulario
      form.reset();
      setAliases([]);
      setTelefonos([]);
      setDomicilios([]);
      setRelacionVehiculos([]);
      setRelacionInmuebles([]);
      setRelacionPersonas([]);
      setObservaciones([]);
      setShowObservacionForm(false);
      // Invalidar queries para actualizar todos los datos relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inmuebles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ubicaciones'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar persona: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PersonaFormValues) => {
    createPersonaMutation.mutate(values);
  };

  // Funciones para manejar aliases
  const addAlias = () => {
    const nuevoAlias = form.getValues("nuevoAlias");
    if (nuevoAlias && nuevoAlias.trim()) {
      setAliases([...aliases, nuevoAlias.trim()]);
      form.setValue("nuevoAlias", "");
    }
  };

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  // Funciones para manejar teléfonos
  const addTelefono = () => {
    const nuevoTelefono = form.getValues("nuevoTelefono");
    if (nuevoTelefono && nuevoTelefono.trim()) {
      setTelefonos([...telefonos, nuevoTelefono.trim()]);
      form.setValue("nuevoTelefono", "");
    }
  };

  const removeTelefono = (index: number) => {
    setTelefonos(telefonos.filter((_, i) => i !== index));
  };

  // Funciones para manejar domicilios
  const addDomicilio = () => {
    const nuevoDomicilio = form.getValues("nuevoDomicilio");
    const latitud = form.getValues("latitud");
    const longitud = form.getValues("longitud");

    if (nuevoDomicilio && nuevoDomicilio.trim()) {
      setDomicilios([...domicilios, { 
        direccion: nuevoDomicilio.trim(),
        latitud: latitud || undefined,
        longitud: longitud || undefined
      }]);
      form.setValue("nuevoDomicilio", "");
      form.setValue("latitud", "");
      form.setValue("longitud", "");
      setShowNewDomicilio(false);
    }
  };

  const removeDomicilio = (index: number) => {
    setDomicilios(domicilios.filter((_, i) => i !== index));
  };

  // Funciones para manejar relaciones con vehículos
  const addRelacionVehiculo = () => {
    const vehiculoId = form.getValues("vehiculoSeleccionado");
    if (vehiculoId && vehiculos) {
      const vehiculo = vehiculos.find((v: any) => v.id.toString() === vehiculoId);
      if (vehiculo && !relacionVehiculos.some(rv => rv.id === vehiculo.id)) {
        setRelacionVehiculos([...relacionVehiculos, { 
          id: vehiculo.id,
          nombre: `${vehiculo.marca} (${vehiculo.placa})`
        }]);
        form.setValue("vehiculoSeleccionado", "");
      }
    }
  };

  const removeRelacionVehiculo = (id: number) => {
    setRelacionVehiculos(relacionVehiculos.filter(v => v.id !== id));
  };
  
  // Funciones para relaciones con inmuebles
  const addRelacionInmueble = () => {
    const inmuebleId = form.getValues("inmuebleSeleccionado");
    if (!inmuebleId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un inmueble",
        variant: "destructive",
      });
      return;
    }
    
    const inmuebleSeleccionado = inmuebles?.find((i: any) => i.id.toString() === inmuebleId);
    if (inmuebleSeleccionado && !relacionInmuebles.some((i: {id: number}) => i.id === inmuebleSeleccionado.id)) {
      setRelacionInmuebles([...relacionInmuebles, { 
        id: inmuebleSeleccionado.id, 
        nombre: `${inmuebleSeleccionado.tipo} (${inmuebleSeleccionado.direccion})`
      }]);
      form.setValue("inmuebleSeleccionado", "");
    }
  };

  const removeRelacionInmueble = (id: number) => {
    setRelacionInmuebles(relacionInmuebles.filter(i => i.id !== id));
  };
  
  // Funciones para relaciones con otras personas
  const addRelacionPersona = () => {
    const personaId = form.getValues("personaSeleccionada");
    if (!personaId) {
      toast({
        title: "Error",
        description: "Debe seleccionar una persona",
        variant: "destructive",
      });
      return;
    }
    
    const personaSeleccionada = personas?.find((p: any) => p.id.toString() === personaId);
    if (personaSeleccionada && !relacionPersonas.some((p: {id: number}) => p.id === personaSeleccionada.id)) {
      setRelacionPersonas([...relacionPersonas, { 
        id: personaSeleccionada.id, 
        nombre: `${personaSeleccionada.nombre} (${personaSeleccionada.identificacion})`
      }]);
      form.setValue("personaSeleccionada", "");
    }
  };

  const removeRelacionPersona = (id: number) => {
    setRelacionPersonas(relacionPersonas.filter(p => p.id !== id));
  };

  // Función para capturar ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitud", position.coords.latitude.toString());
          form.setValue("longitud", position.coords.longitude.toString());
          toast({
            title: "Ubicación capturada",
            description: "Las coordenadas han sido registradas correctamente",
          });
        },
        (error) => {
          toast({
            title: "Error de geolocalización",
            description: `No se pudo obtener la ubicación: ${error.message}`,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocalización no soportada",
        description: "Su navegador no soporta la geolocalización",
        variant: "destructive",
      });
    }
  };

  // Función para capturar imágenes con la cámara
  const capturePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Aquí se procesaría el archivo capturado
        toast({
          title: "Foto capturada",
          description: `Imagen "${file.name}" ha sido capturada`,
        });
      }
    };
    input.click();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre y apellidos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="identificacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Identificación</FormLabel>
                <FormControl>
                  <Input placeholder="Cédula o documento de identidad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormLabel>Alias (Apodos)</FormLabel>
          <div className="mt-1 flex flex-wrap gap-2">
            {aliases.map((alias, index) => (
              <Badge key={index} variant="blue" className="flex items-center gap-1">
                {alias}
                <button 
                  type="button" 
                  onClick={() => removeAlias(index)}
                  className="ml-1 text-blue-700 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="nuevoAlias"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Agregar alias" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={addAlias} 
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <FormLabel>Teléfonos</FormLabel>
          <div className="mt-1 flex flex-wrap gap-2">
            {telefonos.map((telefono, index) => (
              <Badge key={index} variant="blue" className="flex items-center gap-1">
                {telefono}
                <button 
                  type="button" 
                  onClick={() => removeTelefono(index)}
                  className="ml-1 text-blue-700 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="nuevoTelefono"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Agregar teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={addTelefono} 
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <FormLabel>Domicilios</FormLabel>
          <div className="mt-1">
            {domicilios.map((domicilio, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Domicilio {index + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => removeDomicilio(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm mb-2">{domicilio.direccion}</div>
                {domicilio.latitud && domicilio.longitud && (
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>Latitud: {domicilio.latitud}</div>
                    <div>Longitud: {domicilio.longitud}</div>
                  </div>
                )}
              </div>
            ))}
            
            {showNewDomicilio ? (
              <div className="border border-gray-200 rounded-md p-3 mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Nuevo Domicilio</span>
                  <button 
                    type="button" 
                    onClick={() => setShowNewDomicilio(false)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FormField
                  control={form.control}
                  name="nuevoDomicilio"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormControl>
                        <Input placeholder="Dirección completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <FormField
                    control={form.control}
                    name="latitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Latitud" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Longitud" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={getCurrentLocation}
                    className="text-xs"
                  >
                    <MapPin className="h-3 w-3 mr-1" /> Obtener ubicación actual
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addDomicilio}
                  >
                    Guardar domicilio
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center"
                onClick={() => setShowNewDomicilio(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar Domicilio
              </Button>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>Observaciones</FormLabel>
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
          
          {showObservacionForm && (
            <div className="border border-gray-200 rounded-md p-4 mb-4 bg-muted/30">
              <FormField
                control={form.control}
                name="nuevaObservacion"
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
              <div className="flex justify-end mt-2">
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => {
                    const nuevaObservacion = form.getValues("nuevaObservacion");
                    if (nuevaObservacion && nuevaObservacion.trim()) {
                      setObservaciones([
                        ...observaciones, 
                        { 
                          detalle: nuevaObservacion.trim(),
                          fecha: new Date()
                        }
                      ]);
                      form.setValue("nuevaObservacion", "");
                      // Opcionalmente, podemos ocultar el formulario
                      // setShowObservacionForm(false);
                    }
                  }}
                >
                  Guardar Observación
                </Button>
              </div>
            </div>
          )}
          
          {/* Lista de observaciones */}
          {observaciones.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Fecha</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {observaciones.map((obs, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          {obs.fecha ? format(obs.fecha, "dd/MM/yyyy HH:mm") : "Ahora"}
                        </div>
                      </TableCell>
                      <TableCell>{obs.detalle}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => setObservaciones(observaciones.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
        </div>
        
        <div>
          <FormLabel>Fotografías</FormLabel>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Subir archivos</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <div className="flex justify-center mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={capturePhoto}
                  className="text-xs"
                >
                  <Camera className="h-3 w-3 mr-1" /> Tomar foto
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF hasta 10MB
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <FormLabel>Relaciones con Vehículos</FormLabel>
          <div className="mt-1">
            <FormField
              control={form.control}
              name="vehiculoSeleccionado"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehiculos && vehiculos.map((vehiculo: any) => (
                        <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                          {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-2 flex justify-end">
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelacionVehiculo}
              >
                <Plus className="h-4 w-4 mr-1" /> Vincular vehículo
              </Button>
            </div>
            
            {relacionVehiculos.length > 0 && (
              <div className="mt-2">
                {relacionVehiculos.map((vehiculo) => (
                  <div 
                    key={vehiculo.id} 
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md mb-1"
                  >
                    <span className="text-sm">{vehiculo.nombre}</span>
                    <button 
                      type="button" 
                      onClick={() => removeRelacionVehiculo(vehiculo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <FormLabel>Relaciones con Inmuebles</FormLabel>
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="flex-grow">
                <FormField
                  control={form.control}
                  name="inmuebleSeleccionado"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar inmueble" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inmuebles && inmuebles.map((inmueble: any) => (
                            <SelectItem key={inmueble.id} value={inmueble.id.toString()}>
                              {inmueble.tipo} ({inmueble.direccion})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelacionInmueble}
              >
                <Plus className="h-4 w-4 mr-1" /> Vincular inmueble
              </Button>
            </div>
            
            {relacionInmuebles.length > 0 && (
              <div className="mt-2">
                {relacionInmuebles.map((inmueble) => (
                  <div 
                    key={inmueble.id} 
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md mb-1"
                  >
                    <span className="text-sm">{inmueble.nombre}</span>
                    <button 
                      type="button" 
                      onClick={() => removeRelacionInmueble(inmueble.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sección de relaciones con Personas */}
        <div className="mt-4">
          <FormLabel>Relaciones con Personas</FormLabel>
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="flex-grow">
                <FormField
                  control={form.control}
                  name="personaSeleccionada"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {personas && personas.map((persona: any) => (
                            <SelectItem key={persona.id} value={persona.id.toString()}>
                              {persona.nombre} ({persona.identificacion})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelacionPersona}
              >
                <Plus className="h-4 w-4 mr-1" /> Vincular persona
              </Button>
            </div>
            
            {relacionPersonas.length > 0 && (
              <div className="mt-2">
                {relacionPersonas.map((persona) => (
                  <div 
                    key={persona.id} 
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md mb-1"
                  >
                    <span className="text-sm">{persona.nombre}</span>
                    <button
                      type="button"
                      onClick={() => removeRelacionPersona(persona.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createPersonaMutation.isPending}
          >
            {createPersonaMutation.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
