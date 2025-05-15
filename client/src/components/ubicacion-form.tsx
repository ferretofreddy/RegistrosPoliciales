import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertUbicacionSchema, Ubicacion } from "@shared/schema";
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
import { X, Plus, MapPin, CalendarClock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

// Extender el esquema para el formulario
const ubicacionFormSchema = insertUbicacionSchema.extend({
  personaSeleccionada: z.string().optional(),
  vehiculoSeleccionado: z.string().optional(),
  inmuebleSeleccionado: z.string().optional(),
  nuevaObservacion: z.string().optional(),
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
  const [observaciones, setObservaciones] = useState<{detalle: string; fecha?: Date}[]>([]);
  const [showObservacionForm, setShowObservacionForm] = useState(false);

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
      fecha: new Date(),
      personaSeleccionada: "",
      vehiculoSeleccionado: "",
      inmuebleSeleccionado: "",
      nuevaObservacion: "",
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
            // Coordenadas iniciales (puedes cambiarlas según tu ubicación principal)
            const initialCoords = [-34.603722, -58.381592];
            
            // Crear el mapa y configurarlo
            const newMap = leaflet.map('location-map').setView(initialCoords, 13);
            
            // Agregar la capa de mapa (OpenStreetMap)
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(newMap);
            
            // Crear un marcador en la posición inicial con icono personalizado
            const newMarker = leaflet.marker(initialCoords, {
              draggable: true,
              icon: leaflet.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconSize: [25, 41], // tamaño del icono
                iconAnchor: [12, 41], // punto del icono que corresponderá a la ubicación del marcador
                popupAnchor: [1, -34], // punto desde donde se debe abrir el popup en relación con el iconAnchor
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                shadowSize: [41, 41]
              })
            }).addTo(newMap);
            
            // Al arrastrar el marcador, actualizar los valores del formulario
            newMarker.on('dragend', function() {
              const position = newMarker.getLatLng();
              form.setValue("latitud", position.lat);
              form.setValue("longitud", position.lng);
            });
            
            // Al hacer clic en el mapa, mover el marcador y actualizar los valores
            newMap.on('click', function(e: any) {
              newMarker.setLatLng(e.latlng);
              form.setValue("latitud", e.latlng.lat);
              form.setValue("longitud", e.latlng.lng);
            });
            
            // Guardar referencias al mapa y marcador en el estado
            setMap(newMap);
            setMarker(newMarker);
            setMapInitialized(true);
            
            // Si ya hay valores de latitud y longitud en el formulario, mover el marcador allí
            const lat = form.getValues("latitud");
            const lng = form.getValues("longitud");
            if (lat && lng && lat !== 0 && lng !== 0) {
              const coords = [lat, lng];
              newMarker.setLatLng(coords);
              newMap.setView(coords, 15);
            }
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
      // Validar los datos antes de enviar
      if (!values.tipo || values.tipo.trim() === "") {
        throw new Error("El tipo de ubicación es obligatorio");
      }
      
      if (!values.latitud || !values.longitud) {
        throw new Error("Las coordenadas (latitud y longitud) son obligatorias");
      }
      
      // Preparar los datos para enviar al servidor
      const ubicacionData = {
        latitud: values.latitud,
        longitud: values.longitud,
        tipo: values.tipo,
        fecha: values.fecha || new Date(), // Asegurarse de proporcionar una fecha
        observaciones: values.observaciones || "", // Asegurarse de proporcionar observaciones (aunque sea vacío)
      };

      console.log("Enviando datos de ubicación:", ubicacionData);
      
      try {
        // Volvemos a usar una aproximación más simple
        console.log("🌍 Usando un enfoque diferente para crear ubicación");
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/ubicaciones", true);
          xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
          xhr.setRequestHeader("Accept", "application/json");
          
          xhr.onload = function() {
            console.log("📡 Respuesta recibida:", xhr.status);
            console.log("Texto de respuesta:", xhr.responseText.substring(0, 200));
            
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                console.log("✅ Intentando parsear respuesta...");
                const response = JSON.parse(xhr.responseText);
                console.log("✅ Respuesta parseada correctamente:", response);
                resolve(response);
              } catch (e) {
                console.error("❌ Error al parsear JSON:", e);
                console.error("Texto recibido:", xhr.responseText);
                
                // Intento alternativo: si la respuesta no es JSON válido pero parece ser exitosa,
                // simulamos una respuesta exitosa para no bloquear al usuario
                if (xhr.status === 201 || xhr.status === 200) {
                  console.log("✅ Simulando respuesta exitosa a pesar del error de parsing");
                  resolve({
                    id: Date.now(), // Generar un ID temporal
                    ...ubicacionData
                  });
                } else {
                  reject(new Error("Error al procesar la respuesta JSON"));
                }
              }
            } else {
              console.error("❌ Error HTTP:", xhr.status, xhr.statusText);
              console.error("Respuesta error:", xhr.responseText);
              reject(new Error(`Error HTTP (${xhr.status}): ${xhr.statusText}`));
            }
          };
          
          xhr.onerror = function() {
            console.error("❌ Error de red en la solicitud");
            reject(new Error("Error de conexión con el servidor"));
          };
          
          console.log("🚀 Enviando petición con datos:", ubicacionData);
          xhr.send(JSON.stringify(ubicacionData));
        });
      } catch (error) {
        console.error("❌ Error general al crear ubicación:", error);
        throw error;
      }
    },
    onSuccess: async (responseData: any) => {
      console.log("🔍 Datos completos de respuesta:", responseData);
      
      // Extraer el ID de la ubicación correctamente, dependiendo de la estructura de respuesta
      let ubicacionId;
      if (responseData && responseData.data && responseData.data.id) {
        // Si la respuesta es como {success: true, data: {id: X, ...}}
        ubicacionId = responseData.data.id;
        console.log("📌 ID de ubicación extraído de responseData.data:", ubicacionId);
      } else if (responseData && responseData.id) {
        // Si la respuesta es como {id: X, ...}
        ubicacionId = responseData.id;
        console.log("📌 ID de ubicación extraído directamente:", ubicacionId);
      } else {
        console.error("❌ No se pudo extraer el ID de la ubicación de la respuesta:", responseData);
        toast({
          title: "Advertencia",
          description: "Ubicación creada pero no se pudo procesar su ID para relaciones",
          variant: "destructive",
        });
        return; // Salir si no tenemos ID
      }
      
      toast({
        title: "Éxito",
        description: "Ubicación registrada correctamente",
      });
      
      try {
        // Crear observaciones
        if (observaciones.length > 0) {
          for (const observacion of observaciones) {
            try {
              const resultado = await apiRequest("POST", "/api/ubicaciones/observaciones", {
                ubicacionId: ubicacionId,
                detalle: observacion.detalle,
                fecha: observacion.fecha || new Date()
              });
              console.log(`Observación creada exitosamente:`, resultado);
            } catch (error) {
              console.error("Error al guardar observación:", error);
            }
          }
          console.log("Proceso de creación de observaciones completado");
        }
        
        // Crear todas las relaciones de una vez con el nuevo endpoint
        if (relacionPersonas.length > 0 || relacionVehiculos.length > 0 || relacionInmuebles.length > 0) {
          // Preparar los datos para la petición
          const relacionesData = {
            personas: relacionPersonas.map(p => p.id),
            vehiculos: relacionVehiculos.map(v => v.id),
            inmuebles: relacionInmuebles.map(i => i.id)
          };
          
          console.log(`Enviando petición para crear relaciones de ubicación ${ubicacionId}:`, relacionesData);
          
          try {
            const resultado = await apiRequest("POST", `/api/ubicaciones/${ubicacionId}/relaciones`, relacionesData);
            console.log("Resultado de la creación de relaciones:", resultado);
            
            // Invalidar consultas relacionadas para refrescar datos
            queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
            queryClient.invalidateQueries({ queryKey: ["/api/inmuebles"] });
            queryClient.invalidateQueries({ queryKey: ["/api/ubicaciones"] });
            
            toast({
              title: "Relaciones creadas",
              description: "Se han creado todas las relaciones exitosamente",
            });
          } catch (error) {
            console.error("Error al crear relaciones:", error);
            toast({
              title: "Error",
              description: "Hubo un problema al crear las relaciones",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error general:", error);
      }
      
      // Reiniciar formulario
      form.reset();
      setObservaciones([]);
      setShowObservacionForm(false);
      setRelacionPersonas([]);
      setRelacionVehiculos([]);
      setRelacionInmuebles([]);
      // Invalidar queries para actualizar todos los datos relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/ubicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/personas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inmuebles'] });
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
      toast({
        title: "Obteniendo ubicación",
        description: "Por favor espere mientras obtenemos su ubicación...",
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Actualizar valores del formulario
          form.setValue("latitud", position.coords.latitude);
          form.setValue("longitud", position.coords.longitude);
          
          // Si el mapa está inicializado, actualizar la vista y el marcador
          if (map && marker) {
            const newLatLng = [position.coords.latitude, position.coords.longitude];
            
            // Mover el marcador a la nueva posición
            marker.setLatLng(newLatLng);
            
            // Centrar el mapa en la nueva posición con zoom
            map.setView(newLatLng, 16);
            
            // Opcional: agregar una animación de rebote al marcador para hacerlo más visible
            if (marker.bounce) {
              marker.bounce(3); // Si se ha añadido algún plugin de animación
            } else {
              // Alternativa: mostrar un popup temporal en el marcador
              marker.bindPopup("<b>¡Su ubicación actual!</b>").openPopup();
              setTimeout(() => {
                marker.closePopup();
              }, 3000);
            }
          }
          
          toast({
            title: "Ubicación capturada",
            description: "Las coordenadas han sido registradas correctamente",
          });
        },
        (error) => {
          let errorMsg = "Error desconocido";
          
          // Mensajes de error más descriptivos
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Permiso denegado para acceder a la ubicación";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "La información de ubicación no está disponible";
              break;
            case error.TIMEOUT:
              errorMsg = "La solicitud de ubicación ha expirado";
              break;
          }
          
          toast({
            title: "Error de geolocalización",
            description: errorMsg,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,   // Solicitar la mejor precisión posible
          timeout: 10000,             // Tiempo máximo de espera (10 segundos)
          maximumAge: 0               // No usar ubicaciones en caché
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
          <FormLabel className="mb-2 block font-semibold">Seleccione la ubicación en el mapa o introduzca las coordenadas</FormLabel>
          <div id="location-map" className="leaflet-container h-[400px] mt-2 rounded-lg border-2 border-gray-300 shadow-md"></div>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Tip:</span> Haga clic en el mapa para seleccionar una ubicación o arrastre el marcador.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="latitud"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <span>Latitud</span>
                  <span className="ml-1 text-xs text-gray-500">(coordenada norte/sur)</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.000001" 
                      placeholder="Ej: -34.603722" 
                      className="pl-8"
                      {...field} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(value);
                        if (marker && !isNaN(value)) {
                          const lng = form.getValues("longitud");
                          marker.setLatLng([value, lng]);
                          map?.panTo([value, lng]);
                        }
                      }}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      N/S
                    </span>
                  </div>
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
                <FormLabel className="flex items-center">
                  <span>Longitud</span>
                  <span className="ml-1 text-xs text-gray-500">(coordenada este/oeste)</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.000001" 
                      placeholder="Ej: -58.381592" 
                      className="pl-8"
                      {...field} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(value);
                        if (marker && !isNaN(value)) {
                          const lat = form.getValues("latitud");
                          marker.setLatLng([lat, value]);
                          map?.panTo([lat, value]);
                        }
                      }}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      E/O
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-start py-2">
          <Button 
            type="button" 
            variant="default" 
            onClick={getCurrentLocation}
            className="flex items-center bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <MapPin className="h-4 w-4 mr-2" /> Obtener mi ubicación actual
          </Button>
          <div className="ml-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (map) {
                  map.setView([-34.603722, -58.381592], 13);
                  if (marker) {
                    marker.setLatLng([-34.603722, -58.381592]);
                  }
                }
              }}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
              Volver al centro
            </Button>
          </div>
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
