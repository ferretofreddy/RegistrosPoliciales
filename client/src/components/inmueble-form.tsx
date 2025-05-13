import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertInmuebleSchema } from "@shared/schema";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Upload, Camera, MapPin } from "lucide-react";

// Extender el esquema para el formulario
const inmuebleFormSchema = insertInmuebleSchema.extend({
  personaSeleccionada: z.string().optional(),
  vehiculoSeleccionado: z.string().optional(),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
});

type InmuebleFormValues = z.infer<typeof inmuebleFormSchema>;

export default function InmuebleForm() {
  const { toast } = useToast();
  const [relacionPersonas, setRelacionPersonas] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionVehiculos, setRelacionVehiculos] = useState<{ id: number; nombre: string }[]>([]);

  // Obtener lista de personas para las relaciones
  const { data: personas } = useQuery({
    queryKey: ['/api/personas'],
    queryFn: async () => {
      const res = await fetch('/api/personas');
      if (!res.ok) throw new Error('Error al cargar personas');
      return res.json();
    }
  });

  // Obtener lista de vehículos para las relaciones
  const { data: vehiculos } = useQuery({
    queryKey: ['/api/vehiculos'],
    queryFn: async () => {
      const res = await fetch('/api/vehiculos');
      if (!res.ok) throw new Error('Error al cargar vehículos');
      return res.json();
    }
  });

  // Configurar el formulario
  const form = useForm<InmuebleFormValues>({
    resolver: zodResolver(inmuebleFormSchema),
    defaultValues: {
      tipo: "",
      propietario: "",
      direccion: "",
      observaciones: "",
      personaSeleccionada: "",
      vehiculoSeleccionado: "",
      latitud: "",
      longitud: "",
    },
  });

  // Mutación para enviar el formulario
  const createInmuebleMutation = useMutation({
    mutationFn: async (values: InmuebleFormValues) => {
      // Preparar los datos para enviar al servidor
      const inmuebleData = {
        tipo: values.tipo,
        propietario: values.propietario,
        direccion: values.direccion,
        observaciones: values.observaciones,
      };

      const res = await apiRequest("POST", "/api/inmuebles", inmuebleData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: "Inmueble registrado correctamente",
      });
      
      // Crear relaciones con personas si existen
      if (relacionPersonas.length > 0) {
        relacionPersonas.forEach(async (persona) => {
          try {
            await apiRequest("POST", "/api/relaciones", {
              tipo1: "inmuebles",
              id1: data.id,
              tipo2: "personas",
              id2: persona.id
            });
          } catch (error) {
            console.error("Error al crear relación con persona:", error);
          }
        });
      }
      
      // Crear relaciones con vehículos si existen
      if (relacionVehiculos.length > 0) {
        relacionVehiculos.forEach(async (vehiculo) => {
          try {
            await apiRequest("POST", "/api/relaciones", {
              tipo1: "inmuebles",
              id1: data.id,
              tipo2: "vehiculos",
              id2: vehiculo.id
            });
          } catch (error) {
            console.error("Error al crear relación con vehículo:", error);
          }
        });
      }
      
      // Si hay coordenadas, crear una ubicación para el inmueble
      const latitud = form.getValues("latitud");
      const longitud = form.getValues("longitud");
      
      if (latitud && longitud) {
        try {
          apiRequest("POST", "/api/ubicaciones", {
            latitud: parseFloat(latitud),
            longitud: parseFloat(longitud),
            tipo: "Inmueble",
            observaciones: `Ubicación del inmueble: ${data.tipo} en ${data.direccion}`,
          }).then(async (res) => {
            const ubicacion = await res.json();
            // Relacionar la ubicación con el inmueble
            apiRequest("POST", "/api/relaciones", {
              tipo1: "inmuebles",
              id1: data.id,
              tipo2: "ubicaciones",
              id2: ubicacion.id
            });
          });
        } catch (error) {
          console.error("Error al crear ubicación para el inmueble:", error);
        }
      }
      
      // Reiniciar formulario
      form.reset();
      setRelacionPersonas([]);
      setRelacionVehiculos([]);
      // Invalidar queries para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ['/api/inmuebles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar inmueble: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: InmuebleFormValues) => {
    createInmuebleMutation.mutate(values);
  };

  // Funciones para manejar relaciones con personas
  const addRelacionPersona = () => {
    const personaId = form.getValues("personaSeleccionada");
    if (personaId && personas) {
      const persona = personas.find((p: any) => p.id.toString() === personaId);
      if (persona && !relacionPersonas.some(rp => rp.id === persona.id)) {
        setRelacionPersonas([...relacionPersonas, { 
          id: persona.id,
          nombre: `${persona.nombre} (${persona.identificacion})`
        }]);
        form.setValue("personaSeleccionada", "");
      }
    }
  };

  const removeRelacionPersona = (id: number) => {
    setRelacionPersonas(relacionPersonas.filter(p => p.id !== id));
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

  // Función para capturar la ubicación actual
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
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Inmueble</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Casa">Casa</SelectItem>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Local Comercial">Local Comercial</SelectItem>
                    <SelectItem value="Bodega">Bodega</SelectItem>
                    <SelectItem value="Terreno">Terreno</SelectItem>
                    <SelectItem value="Oficina">Oficina</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="propietario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Propietario</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del propietario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Dirección completa del inmueble" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="latitud"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input placeholder="Latitud de la ubicación" {...field} />
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
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input placeholder="Longitud de la ubicación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-start">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={getCurrentLocation}
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-1" /> Obtener ubicación actual
          </Button>
        </div>
        
        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Información adicional relevante" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Fotografías</FormLabel>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="property-file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Subir archivos</span>
                  <input id="property-file-upload" name="property-file-upload" type="file" className="sr-only" multiple />
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
          <FormLabel>Relaciones con Personas</FormLabel>
          <div className="mt-1">
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
            
            <div className="mt-2 flex justify-end">
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
            disabled={createInmuebleMutation.isPending}
          >
            {createInmuebleMutation.isPending ? (
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
