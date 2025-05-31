import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertVehiculoSchema, insertVehiculoObservacionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { invalidateAllQueries } from "@/lib/cache-utils";
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
import { X, Plus, CalendarClock, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import EntitySearch from "@/components/entity-search";

// Esquema para observaciones
const observacionSchema = z.object({
  detalle: z.string().min(1, "La observación no puede estar vacía"),
});

// Esquema para el formulario
const vehiculoFormSchema = z.object({
  placa: z.string().min(1, "La placa es requerida"),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  color: z.string().min(1, "El color es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  observaciones: z.string().optional(),
  foto: z.string().optional(),
  personaSeleccionada: z.string().optional(),
  inmuebleSeleccionado: z.string().optional(),
  vehiculoSeleccionado: z.string().optional(),
  nuevaObservacion: z.string().optional(),
});

type VehiculoFormValues = z.infer<typeof vehiculoFormSchema>;

export default function VehiculoForm() {
  const { toast } = useToast();
  const [relacionPersonas, setRelacionPersonas] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionInmuebles, setRelacionInmuebles] = useState<{ id: number; nombre: string }[]>([]);
  const [relacionVehiculos, setRelacionVehiculos] = useState<{ id: number; nombre: string }[]>([]);
  const [observaciones, setObservaciones] = useState<{detalle: string; fecha?: Date}[]>([]);
  const [showObservacionForm, setShowObservacionForm] = useState(false);
  
  // Obtener usuario autenticado
  const { data: usuarioActual } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Obtener lista de personas para las relaciones
  const { data: personas } = useQuery({
    queryKey: ['/api/personas'],
    queryFn: async () => {
      const res = await fetch('/api/personas');
      if (!res.ok) throw new Error('Error al cargar personas');
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
  const form = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoFormSchema),
    defaultValues: {
      marca: "",
      tipo: "",
      color: "",
      placa: "",
      modelo: "",
      personaSeleccionada: "",
      inmuebleSeleccionado: "",
      vehiculoSeleccionado: "",
      nuevaObservacion: "",
    },
  });

  // Mutación para enviar el formulario
  const createVehiculoMutation = useMutation({
    mutationFn: async (values: VehiculoFormValues) => {
      // Preparar los datos para enviar al servidor
      const vehiculoData = {
        marca: values.marca,
        tipo: values.tipo,
        color: values.color,
        placa: values.placa,
        modelo: values.modelo,
      };

      const res = await apiRequest("POST", "/api/vehiculos", vehiculoData);
      const vehiculo = await res.json();
      
      // Si hay observaciones, las agregamos al vehículo creado
      if (observaciones.length > 0) {
        for (const obs of observaciones) {
          await apiRequest("POST", `/api/vehiculos/${vehiculo.id}/observaciones`, {
            detalle: obs.detalle,
            usuario: usuarioActual?.nombre || "Usuario Anónimo"
          });
        }
      }
      
      return vehiculo;
    },
    onSuccess: async (data) => {
      try {
        // Crear todas las relaciones antes de mostrar éxito
        const promises = [];

        // Crear relaciones con personas si existen
        if (relacionPersonas.length > 0) {
          relacionPersonas.forEach((persona) => {
            promises.push(
              apiRequest("POST", "/api/relaciones", {
                tipo1: "vehiculo",
                id1: data.id,
                tipo2: "persona",
                id2: persona.id
              })
            );
          });
        }
        
        // Crear relaciones con otros vehículos si existen
        if (relacionVehiculos.length > 0) {
          relacionVehiculos.forEach((vehiculo) => {
            promises.push(
              apiRequest("POST", "/api/relaciones", {
                tipo1: "vehiculo",
                id1: data.id,
                tipo2: "vehiculo",
                id2: vehiculo.id
              })
            );
          });
        }
        
        // Crear relaciones con inmuebles si existen
        if (relacionInmuebles.length > 0) {
          relacionInmuebles.forEach((inmueble) => {
            promises.push(
              apiRequest("POST", "/api/relaciones", {
                tipo1: "vehiculo",
                id1: data.id,
                tipo2: "inmueble",
                id2: inmueble.id
              })
            );
          });
        }

        // Esperar a que todas las operaciones se completen
        if (promises.length > 0) {
          await Promise.all(promises);
        }

        // Solo después de completar todo, mostrar éxito y limpiar
        toast({
          title: "Éxito",
          description: "Vehículo registrado correctamente con todas sus relaciones",
        });
        
        // Reiniciar formulario
        form.reset();
        setRelacionPersonas([]);
        setRelacionVehiculos([]);
        setRelacionInmuebles([]);
        setObservaciones([]);
        setShowObservacionForm(false);
        
        // Usar la función centralizada para invalidar todas las consultas
        invalidateAllQueries('/api/vehiculos');
        
      } catch (error) {
        console.error("Error al crear relaciones:", error);
        toast({
          title: "Advertencia",
          description: "Vehículo creado pero hubo problemas con algunas relaciones",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar vehículo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: VehiculoFormValues) => {
    createVehiculoMutation.mutate(values);
  };

  // Funciones para manejar relaciones con personas
  const addRelacionPersona = (persona: any) => {
    if (persona && !relacionPersonas.some(rp => rp.id === persona.id)) {
      console.log('Agregando persona:', persona);
      const personaConNombre = {
        ...persona,
        nombre: `${persona.nombre} (${persona.identificacion})`
      };
      setRelacionPersonas([...relacionPersonas, personaConNombre]);
    }
  };

  const removeRelacionPersona = (id: number) => {
    setRelacionPersonas(relacionPersonas.filter(p => p.id !== id));
  };
  
  // Funciones para manejar relaciones con otros vehículos
  const addRelacionVehiculo = (vehiculo: any) => {
    if (vehiculo && !relacionVehiculos.some(rv => rv.id === vehiculo.id)) {
      console.log('Agregando vehículo:', vehiculo);
      const vehiculoConNombre = {
        ...vehiculo,
        nombre: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})`
      };
      setRelacionVehiculos([...relacionVehiculos, vehiculoConNombre]);
    }
  };

  const removeRelacionVehiculo = (id: number) => {
    setRelacionVehiculos(relacionVehiculos.filter(v => v.id !== id));
  };
  
  // Funciones para manejar relaciones con inmuebles
  const addRelacionInmueble = (inmueble: any) => {
    if (inmueble && !relacionInmuebles.some(ri => ri.id === inmueble.id)) {
      console.log('Agregando inmueble:', inmueble);
      const inmuebleConNombre = {
        ...inmueble,
        nombre: `${inmueble.tipo} - ${inmueble.direccion}`
      };
      setRelacionInmuebles([...relacionInmuebles, inmuebleConNombre]);
    }
  };

  const removeRelacionInmueble = (id: number) => {
    setRelacionInmuebles(relacionInmuebles.filter(i => i.id !== id));
  };

  // La función capturePhoto ha sido eliminada

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Marca del vehículo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
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
                    <SelectItem value="Sedán">Sedán</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Camioneta">Camioneta</SelectItem>
                    <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                    <SelectItem value="Camión">Camión</SelectItem>
                    <SelectItem value="Autobús">Autobús</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="Color del vehículo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="Número de placa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo (Año)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Año del modelo" 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={field.value === null ? "" : field.value} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        
        {/* El campo de fotografías ha sido eliminado */}
        
        <div>
          <FormLabel>Relaciones con Personas</FormLabel>
          <div className="mt-1">
            <EntitySearch
              entityType="persona"
              placeholder="Buscar persona..."
              onSelect={addRelacionPersona}
              selectedEntities={relacionPersonas}
              multiple={true}
            />
          </div>
        </div>
        
        <div>
          <FormLabel>Relaciones con Otros Vehículos</FormLabel>
          <div className="mt-1">
            <EntitySearch
              entityType="vehiculo"
              placeholder="Buscar vehículo..."
              onSelect={addRelacionVehiculo}
              selectedEntities={relacionVehiculos}
              multiple={true}
            />
          </div>
        </div>
        
        <div>
          <FormLabel>Relaciones con Inmuebles</FormLabel>
          <div className="mt-1">
            <EntitySearch
              entityType="inmueble"
              placeholder="Buscar inmueble..."
              onSelect={addRelacionInmueble}
              selectedEntities={relacionInmuebles}
              multiple={true}
            />
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
            disabled={createVehiculoMutation.isPending}
          >
            {createVehiculoMutation.isPending ? (
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
