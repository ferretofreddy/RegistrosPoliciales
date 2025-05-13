import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertUbicacionSchema } from "@shared/schema";
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
import { X, Plus, MapPin } from "lucide-react";

// Extender el esquema para el formulario
const ubicacionFormSchema = insertUbicacionSchema.extend({
  personaSeleccionada: z.string().optional(),
  vehiculoSeleccionado: z.string().optional(),
  inmuebleSeleccionado: z.string().optional(),
});

type UbicacionFormValues = z.infer<typeof ubicacionFormSchema>;

export default function UbicacionForm() {
  const { toast } = useToast();
  const [relacionPersonas, setRelacionPersonas] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionVehiculos, setRelacionVehiculos] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionInmuebles, setRelacionInmuebles] = useState<{ id: number; nombre: string }[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

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

  // Obtener lista de inmuebles para las relaciones
  const { data: inmuebles } = useQuery({
    queryKey: ['/api/inmuebles'],
    queryFn: async () => {
      const res = await fetch('/api/inmuebles');
      if (!res.ok) throw new Error('Error al cargar inmuebles');
      return res.json();
    }
  });

  // Configurar el formulario
  const form = useForm<UbicacionFormValues>({
    resolver: zodResolver(ubicacionFormSchema),
    defaultValues: {
      latitud: 0,
      longitud: 0,
      tipo: "",
      observaciones: "",
      fecha: new Date(),
      personaSeleccionada: "",
      vehiculoSeleccionado: "",
      inmuebleSeleccionado: "",
    },
  });

  // Inicializar mapa después de montar el componente
  useState(() => {
    if (typeof window !== 'undefined' && !mapInitialized && window.L) {
      setTimeout(() => {
        try {
          const leaflet = window.L;
          const mapElement = document.getElementById('location-map');
          
          if (mapElement) {
            const newMap = leaflet.map('location-map').setView([-34.603722, -58.381592], 13);
            
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(newMap);
            
            const newMarker = leaflet.marker([-34.603722, -58.381592], {
              draggable: true
            }).addTo(newMap);
            
            newMarker.on('dragend', function() {
              const position = newMarker.getLatLng();
              form.setValue("latitud", position.lat);
              form.setValue("longitud", position.lng);
            });
            
            newMap.on('click', function(e: any) {
              newMarker.setLatLng(e.latlng);
              form.setValue("latitud", e.latlng.lat);
              form.setValue("longitud", e.latlng.lng);
            });
            
            setMap(newMap);
            setMarker(newMarker);
            setMapInitialized(true);
          }
        } catch (error) {
          console.error("Error al inicializar el mapa:", error);
        }
      }, 500);
    }
  });

  // Mutación para enviar el formulario
  const createUbicacionMutation = useMutation({
    mutationFn: async (values: UbicacionFormValues) => {
      // Preparar los datos para enviar al servidor
      const ubicacionData = {
        latitud: values.latitud,
        longitud: values.longitud,
        tipo: values.tipo,
        observaciones: values.observaciones,
        fecha: values.fecha,
      };

      const res = await apiRequest("POST", "/api/ubicaciones", ubicacionData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: "Ubicación registrada correctamente",
      });
      
      // Crear relaciones con personas si existen
      if (relacionPersonas.length > 0) {
        relacionPersonas.forEach(async (persona) => {
          try {
            await apiRequest("POST", "/api/relaciones", {
              tipo1: "ubicaciones",
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
              tipo1: "ubicaciones",
              id1: data.id,
              tipo2: "vehiculos",
              id2: vehiculo.id
            });
          } catch (error) {
            console.error("Error al crear relación con vehículo:", error);
          }
        });
      }
      
      // Crear relaciones con inmuebles si existen
      if (relacionInmuebles.length > 0) {
        relacionInmuebles.forEach(async (inmueble) => {
          try {
            await apiRequest("POST", "/api/relaciones", {
              tipo1: "ubicaciones",
              id1: data.id,
              tipo2: "inmuebles",
              id2: inmueble.id
            });
          } catch (error) {
            console.error("Error al crear relación con inmueble:", error);
          }
        });
      }
      
      // Reiniciar formulario
      form.reset();
      setRelacionPersonas([]);
      setRelacionVehiculos([]);
      setRelacionInmuebles([]);
      // Invalidar queries para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ['/api/ubicaciones'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar ubicación: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: UbicacionFormValues) => {
    createUbicacionMutation.mutate(values);
  };

  // Función para capturar la ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitud", position.coords.latitude);
          form.setValue("longitud", position.coords.longitude);
          
          if (map && marker) {
            const newLatLng = [position.coords.latitude, position.coords.longitude];
            marker.setLatLng(newLatLng);
            map.setView(newLatLng, 15);
          }
          
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

  // Funciones para manejar relaciones con inmuebles
  const addRelacionInmueble = () => {
    const inmuebleId = form.getValues("inmuebleSeleccionado");
    if (inmuebleId && inmuebles) {
      const inmueble = inmuebles.find((i: any) => i.id.toString() === inmuebleId);
      if (inmueble && !relacionInmuebles.some(ri => ri.id === inmueble.id)) {
        setRelacionInmuebles([...relacionInmuebles, { 
          id: inmueble.id,
          nombre: `${inmueble.tipo} (${inmueble.direccion})`
        }]);
        form.setValue("inmuebleSeleccionado", "");
      }
    }
  };

  const removeRelacionInmueble = (id: number) => {
    setRelacionInmuebles(relacionInmuebles.filter(i => i.id !== id));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <FormLabel>Seleccione la ubicación en el mapa o introduzca las coordenadas</FormLabel>
          <div id="location-map" className="leaflet-container mt-2 rounded-md border border-gray-300"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="latitud"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.000001" 
                    placeholder="Latitud de la ubicación" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value));
                      if (marker) {
                        const lng = form.getValues("longitud");
                        marker.setLatLng([parseFloat(e.target.value), lng]);
                      }
                    }}
                  />
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
                  <Input 
                    type="number" 
                    step="0.000001" 
                    placeholder="Longitud de la ubicación" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value));
                      if (marker) {
                        const lat = form.getValues("latitud");
                        marker.setLatLng([lat, parseFloat(e.target.value)]);
                      }
                    }}
                  />
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
            onClick={getCurrentLocation}
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-1" /> Obtener ubicación actual
          </Button>
        </div>
        
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Ubicación</FormLabel>
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
                  <SelectItem value="Domicilio">Domicilio</SelectItem>
                  <SelectItem value="Trabajo">Trabajo</SelectItem>
                  <SelectItem value="Avistamiento">Avistamiento</SelectItem>
                  <SelectItem value="Lugar Frecuente">Lugar Frecuente</SelectItem>
                  <SelectItem value="Evento">Evento</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
        
        <div>
          <FormLabel>Relaciones con Inmuebles</FormLabel>
          <div className="mt-1">
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
            
            <div className="mt-2 flex justify-end">
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
            disabled={createUbicacionMutation.isPending}
          >
            {createUbicacionMutation.isPending ? (
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
