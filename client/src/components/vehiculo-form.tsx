import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertVehiculoSchema } from "@shared/schema";
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
import { X, Plus, Upload, Camera } from "lucide-react";

// Extender el esquema para el formulario
const vehiculoFormSchema = insertVehiculoSchema.extend({
  personaSeleccionada: z.string().optional(),
  inmuebleSeleccionado: z.string().optional(),
});

type VehiculoFormValues = z.infer<typeof vehiculoFormSchema>;

export default function VehiculoForm() {
  const { toast } = useToast();
  const [relacionPersonas, setRelacionPersonas] = useState<{ id: number; nombre: string }[]>([]);

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

  // Configurar el formulario
  const form = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoFormSchema),
    defaultValues: {
      marca: "",
      tipo: "",
      color: "",
      placa: "",
      modelo: "",
      observaciones: "",
      personaSeleccionada: "",
      inmuebleSeleccionado: "",
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
        observaciones: values.observaciones,
      };

      const res = await apiRequest("POST", "/api/vehiculos", vehiculoData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: "Vehículo registrado correctamente",
      });
      // Crear relaciones con personas si existen
      if (relacionPersonas.length > 0) {
        relacionPersonas.forEach(async (persona) => {
          try {
            await apiRequest("POST", "/api/relaciones", {
              tipo1: "vehiculos",
              id1: data.id,
              tipo2: "personas",
              id2: persona.id
            });
          } catch (error) {
            console.error("Error al crear relación:", error);
          }
        });
      }
      
      // Reiniciar formulario
      form.reset();
      setRelacionPersonas([]);
      // Invalidar queries para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ['/api/vehiculos'] });
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
                  <Input placeholder="Año del modelo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  htmlFor="vehicle-file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Subir archivos</span>
                  <input id="vehicle-file-upload" name="vehicle-file-upload" type="file" className="sr-only" multiple />
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
          <FormLabel>Relaciones con Inmuebles</FormLabel>
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
