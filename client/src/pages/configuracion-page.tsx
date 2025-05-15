import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TipoInmueble, TipoUbicacion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/main-layout";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";

// Esquema para el formulario de tipo de inmueble
const tipoInmuebleFormSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
});

// Esquema para el formulario de tipo de ubicación
const tipoUbicacionFormSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
});

// Tipos para los formularios
type TipoInmuebleFormValues = z.infer<typeof tipoInmuebleFormSchema>;
type TipoUbicacionFormValues = z.infer<typeof tipoUbicacionFormSchema>;

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [editingTipoInmuebleId, setEditingTipoInmuebleId] = useState<number | null>(null);
  const [editingTipoUbicacionId, setEditingTipoUbicacionId] = useState<number | null>(null);

  // Formulario para tipos de inmuebles
  const inmuebleForm = useForm<TipoInmuebleFormValues>({
    resolver: zodResolver(tipoInmuebleFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  // Formulario para tipos de ubicaciones
  const ubicacionForm = useForm<TipoUbicacionFormValues>({
    resolver: zodResolver(tipoUbicacionFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  });

  // Consulta para obtener todos los tipos de inmuebles
  const {
    data: tiposInmuebles,
    isLoading: loadingTiposInmuebles,
    refetch: refetchTiposInmuebles,
  } = useQuery({
    queryKey: ["/api/tipos-inmuebles-admin"],
    queryFn: async () => {
      const res = await fetch("/api/tipos-inmuebles-admin");
      if (!res.ok) throw new Error("Error al cargar tipos de inmuebles");
      return res.json();
    },
  });

  // Consulta para obtener todos los tipos de ubicaciones
  const {
    data: tiposUbicaciones,
    isLoading: loadingTiposUbicaciones,
    refetch: refetchTiposUbicaciones,
  } = useQuery({
    queryKey: ["/api/tipos-ubicaciones-admin"],
    queryFn: async () => {
      const res = await fetch("/api/tipos-ubicaciones-admin");
      if (!res.ok) throw new Error("Error al cargar tipos de ubicaciones");
      return res.json();
    },
  });

  // Mutación para crear un nuevo tipo de inmueble
  const createTipoInmuebleMutation = useMutation({
    mutationFn: async (values: TipoInmuebleFormValues) => {
      console.log("Creando tipo de inmueble con valores:", values);
      const res = await apiRequest("POST", "/api/tipos-inmuebles", values);
      const data = await res.json();
      console.log("Respuesta al crear tipo de inmueble:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Tipo de inmueble creado correctamente",
      });
      inmuebleForm.reset();
      
      // Forzar actualización de las listas
      console.log("Actualizando listas después de crear tipo de inmueble");
      refetchTiposInmuebles().then(() => {
        console.log("Lista de tipos de inmuebles actualizada");
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-inmuebles"] });
    },
    onError: (error) => {
      console.error("Error al crear tipo de inmueble:", error);
      toast({
        title: "Error",
        description: `Error al crear tipo de inmueble: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar un tipo de inmueble existente
  const updateTipoInmuebleMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: TipoInmuebleFormValues;
    }) => {
      console.log("Actualizando tipo de inmueble con ID:", id, "Valores:", values);
      const res = await apiRequest("PATCH", `/api/tipos-inmuebles/${id}`, values);
      const data = await res.json();
      console.log("Respuesta al actualizar tipo de inmueble:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Tipo de inmueble actualizado correctamente",
      });
      setEditingTipoInmuebleId(null);
      inmuebleForm.reset();
      
      // Forzar actualización de las listas
      console.log("Actualizando listas después de editar tipo de inmueble");
      refetchTiposInmuebles().then(() => {
        console.log("Lista de tipos de inmuebles actualizada después de editar");
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-inmuebles"] });
    },
    onError: (error) => {
      console.error("Error al actualizar tipo de inmueble:", error);
      toast({
        title: "Error",
        description: `Error al actualizar tipo de inmueble: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar un tipo de inmueble
  const deleteTipoInmuebleMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Eliminando tipo de inmueble con ID:", id);
      try {
        // Usamos fetch directamente para tener más control
        const res = await fetch(`/api/tipos-inmuebles/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Respuesta de eliminación status:", res.status);
        
        const data = await res.json();
        console.log("Datos de respuesta eliminación:", data);
        
        if (!res.ok) {
          throw new Error(data.message || "Error al eliminar tipo de inmueble");
        }
        
        return data;
      } catch (error) {
        console.error("Error en la mutación de eliminación:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Tipo de inmueble eliminado correctamente:", data);
      toast({
        title: "Éxito",
        description: data.message || "Tipo de inmueble eliminado correctamente",
      });
      
      // Forzar la actualización de las listas con retraso para asegurar que la BD se actualice
      setTimeout(() => {
        console.log("Actualizando listas después de eliminar tipo de inmueble");
        refetchTiposInmuebles().then(() => {
          console.log("Lista de tipos de inmuebles actualizada después de eliminar");
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tipos-inmuebles"] });
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Error en onError de eliminación:", error);
      toast({
        title: "Error",
        description: `Error al eliminar tipo de inmueble: ${error.message}`,
        variant: "destructive",
      });
    },
    retry: 0 // Desactivar reintentos automáticos
  });

  // Mutación para crear un nuevo tipo de ubicación
  const createTipoUbicacionMutation = useMutation({
    mutationFn: async (values: TipoUbicacionFormValues) => {
      const res = await apiRequest("POST", "/api/tipos-ubicaciones", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Tipo de ubicación creado correctamente",
      });
      ubicacionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-ubicaciones-admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-ubicaciones"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear tipo de ubicación: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar un tipo de ubicación existente
  const updateTipoUbicacionMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: TipoUbicacionFormValues;
    }) => {
      const res = await apiRequest("PATCH", `/api/tipos-ubicaciones/${id}`, values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Tipo de ubicación actualizado correctamente",
      });
      setEditingTipoUbicacionId(null);
      ubicacionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-ubicaciones-admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-ubicaciones"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar tipo de ubicación: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar un tipo de ubicación
  const deleteTipoUbicacionMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Eliminando tipo de ubicación con ID:", id);
      try {
        const res = await apiRequest("DELETE", `/api/tipos-ubicaciones/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error al eliminar");
        }
        return await res.json();
      } catch (error) {
        console.error("Error en la mutación:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Tipo de ubicación eliminado correctamente:", data);
      toast({
        title: "Éxito",
        description: data.message || "Tipo de ubicación eliminado correctamente",
      });
      // Forzar la actualización de las listas
      refetchTiposUbicaciones();
      queryClient.invalidateQueries({ queryKey: ["/api/tipos-ubicaciones"] });
    },
    onError: (error: Error) => {
      console.error("Error en onError:", error);
      toast({
        title: "Error",
        description: `Error al eliminar tipo de ubicación: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Función para manejar la edición de un tipo de inmueble
  const handleEditTipoInmueble = (tipo: TipoInmueble) => {
    setEditingTipoInmuebleId(tipo.id);
    inmuebleForm.reset({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || "",
      activo: Boolean(tipo.activo),
    });
  };

  // Función para manejar la edición de un tipo de ubicación
  const handleEditTipoUbicacion = (tipo: TipoUbicacion) => {
    setEditingTipoUbicacionId(tipo.id);
    ubicacionForm.reset({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || "",
      activo: Boolean(tipo.activo),
    });
  };

  // Función para cancelar la edición
  const handleCancelEdit = (formType: "inmueble" | "ubicacion") => {
    if (formType === "inmueble") {
      setEditingTipoInmuebleId(null);
      inmuebleForm.reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    } else {
      setEditingTipoUbicacionId(null);
      ubicacionForm.reset({
        nombre: "",
        descripcion: "",
        activo: true,
      });
    }
  };

  // Manejar envío del formulario de tipo de inmueble
  const onSubmitTipoInmueble = (values: TipoInmuebleFormValues) => {
    if (editingTipoInmuebleId !== null) {
      updateTipoInmuebleMutation.mutate({
        id: editingTipoInmuebleId,
        values,
      });
    } else {
      createTipoInmuebleMutation.mutate(values);
    }
  };

  // Manejar envío del formulario de tipo de ubicación
  const onSubmitTipoUbicacion = (values: TipoUbicacionFormValues) => {
    if (editingTipoUbicacionId !== null) {
      updateTipoUbicacionMutation.mutate({
        id: editingTipoUbicacionId,
        values,
      });
    } else {
      createTipoUbicacionMutation.mutate(values);
    }
  };

  return (
    <>
      <MainLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">Configuración del Sistema</h1>
          
          <Tabs defaultValue="inmuebles" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="inmuebles">Tipos de Inmuebles</TabsTrigger>
              <TabsTrigger value="ubicaciones">Tipos de Ubicaciones</TabsTrigger>
            </TabsList>
        
        {/* Contenido para Tipos de Inmuebles */}
        <TabsContent value="inmuebles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario para crear/editar tipos de inmuebles */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>
                  {editingTipoInmuebleId ? "Editar Tipo de Inmueble" : "Nuevo Tipo de Inmueble"}
                </CardTitle>
                <CardDescription>
                  {editingTipoInmuebleId
                    ? "Actualice los datos del tipo de inmueble"
                    : "Complete los datos para crear un nuevo tipo de inmueble"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...inmuebleForm}>
                  <form
                    onSubmit={inmuebleForm.handleSubmit(onSubmitTipoInmueble)}
                    className="space-y-4"
                  >
                    <FormField
                      control={inmuebleForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del tipo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inmuebleForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción (opcional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inmuebleForm.control}
                      name="activo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Activo</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Mostrar este tipo en los formularios
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between">
                      {editingTipoInmuebleId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCancelEdit("inmueble")}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className={editingTipoInmuebleId ? "ml-auto" : "w-full"}
                      >
                        {editingTipoInmuebleId ? (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Actualizar
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Crear
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Tabla de tipos de inmuebles existentes */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tipos de Inmuebles Existentes</CardTitle>
                <CardDescription>
                  Administre los tipos de inmuebles disponibles en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTiposInmuebles ? (
                  <div className="text-center py-4">Cargando tipos de inmuebles...</div>
                ) : tiposInmuebles && tiposInmuebles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposInmuebles.map((tipo: TipoInmueble) => (
                        <TableRow key={tipo.id}>
                          <TableCell className="font-medium">{tipo.nombre}</TableCell>
                          <TableCell>{tipo.descripcion || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                tipo.activo
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {tipo.activo ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTipoInmueble(tipo)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTipoInmuebleMutation.mutate(tipo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    No hay tipos de inmuebles definidos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Contenido para Tipos de Ubicaciones */}
        <TabsContent value="ubicaciones">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario para crear/editar tipos de ubicaciones */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>
                  {editingTipoUbicacionId ? "Editar Tipo de Ubicación" : "Nuevo Tipo de Ubicación"}
                </CardTitle>
                <CardDescription>
                  {editingTipoUbicacionId
                    ? "Actualice los datos del tipo de ubicación"
                    : "Complete los datos para crear un nuevo tipo de ubicación"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...ubicacionForm}>
                  <form
                    onSubmit={ubicacionForm.handleSubmit(onSubmitTipoUbicacion)}
                    className="space-y-4"
                  >
                    <FormField
                      control={ubicacionForm.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del tipo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ubicacionForm.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción (opcional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ubicacionForm.control}
                      name="activo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Activo</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Mostrar este tipo en los formularios
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between">
                      {editingTipoUbicacionId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCancelEdit("ubicacion")}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className={editingTipoUbicacionId ? "ml-auto" : "w-full"}
                      >
                        {editingTipoUbicacionId ? (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Actualizar
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Crear
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Tabla de tipos de ubicaciones existentes */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tipos de Ubicaciones Existentes</CardTitle>
                <CardDescription>
                  Administre los tipos de ubicaciones disponibles en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTiposUbicaciones ? (
                  <div className="text-center py-4">Cargando tipos de ubicaciones...</div>
                ) : tiposUbicaciones && tiposUbicaciones.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposUbicaciones.map((tipo: TipoUbicacion) => (
                        <TableRow key={tipo.id}>
                          <TableCell className="font-medium">{tipo.nombre}</TableCell>
                          <TableCell>{tipo.descripcion || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                tipo.activo
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {tipo.activo ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTipoUbicacion(tipo)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTipoUbicacionMutation.mutate(tipo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    No hay tipos de ubicaciones definidos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </MainLayout>
    </>
  );
}