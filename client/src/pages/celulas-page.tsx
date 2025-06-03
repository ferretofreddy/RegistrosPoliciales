import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Eye, Edit, Trash2, UserPlus, UserMinus, Search, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { insertCelulaSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import MainLayout from "@/components/main-layout";

type Celula = {
  id: number;
  nombreCelula: string;
  zona: string;
  detalle?: string;
  usuario: string;
  fechaCreacion: Date;
  fechaModificacion: Date;
};

type CelulaWithPersonas = {
  celula: Celula;
  organigrama: { [nivel: number]: any[] };
  niveles: any[];
  personas: any[];
};

type Persona = {
  id: number;
  nombre: string;
  identificacion: string;
  posicion_estructura_nombre?: string;
  tipo_identificacion_nombre?: string;
};

const formSchema = insertCelulaSchema;

type FormData = z.infer<typeof formSchema>;

export default function CelulasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCelula, setSelectedCelula] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCelula, setEditingCelula] = useState<Celula | null>(null);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [searchPersona, setSearchPersona] = useState("");
  
  // Form para crear/editar célula
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCelula: "",
      zona: "",
      detalle: "",
      usuario: user?.nombre || user?.email || ""
    }
  });

  // Queries
  const { data: celulas = [], isLoading: loadingCelulas } = useQuery({
    queryKey: ["/api/celulas"],
    enabled: !!user
  });

  const { data: celulaDetalle, isLoading: loadingDetalle } = useQuery({
    queryKey: ["/api/celulas", selectedCelula],
    enabled: !!selectedCelula
  });

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
    enabled: showAddPersonDialog
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/celulas", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/celulas"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ description: "Célula creada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Error al crear la célula"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      apiRequest(`/api/celulas/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/celulas"] });
      if (selectedCelula) {
        queryClient.invalidateQueries({ queryKey: ["/api/celulas", selectedCelula] });
      }
      setShowEditDialog(false);
      setEditingCelula(null);
      form.reset();
      toast({ description: "Célula actualizada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Error al actualizar la célula"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/celulas/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/celulas"] });
      setSelectedCelula(null);
      toast({ description: "Célula eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Error al eliminar la célula"
      });
    }
  });

  const addPersonaMutation = useMutation({
    mutationFn: ({ celulaId, personaId }: { celulaId: number; personaId: number }) =>
      apiRequest(`/api/celulas/${celulaId}/personas`, {
        method: "POST",
        body: JSON.stringify({ personaId })
      }),
    onSuccess: () => {
      if (selectedCelula) {
        queryClient.invalidateQueries({ queryKey: ["/api/celulas", selectedCelula] });
      }
      setShowAddPersonDialog(false);
      setSearchPersona("");
      toast({ description: "Persona agregada a la célula exitosamente" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Error al agregar persona a la célula"
      });
    }
  });

  const removePersonaMutation = useMutation({
    mutationFn: ({ celulaId, personaId }: { celulaId: number; personaId: number }) =>
      apiRequest(`/api/celulas/${celulaId}/personas/${personaId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      if (selectedCelula) {
        queryClient.invalidateQueries({ queryKey: ["/api/celulas", selectedCelula] });
      }
      toast({ description: "Persona removida de la célula exitosamente" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Error al remover persona de la célula"
      });
    }
  });

  const handleCreate = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (celula: Celula) => {
    setEditingCelula(celula);
    form.reset({
      nombreCelula: celula.nombreCelula,
      zona: celula.zona,
      detalle: celula.detalle || "",
      usuario: celula.usuario
    });
    setShowEditDialog(true);
  };

  const handleUpdate = (data: FormData) => {
    if (editingCelula) {
      updateMutation.mutate({ id: editingCelula.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta célula?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddPersona = (personaId: number) => {
    if (selectedCelula) {
      addPersonaMutation.mutate({ celulaId: selectedCelula, personaId });
    }
  };

  const handleRemovePersona = (personaId: number) => {
    if (selectedCelula && confirm("¿Está seguro de que desea remover esta persona de la célula?")) {
      removePersonaMutation.mutate({ celulaId: selectedCelula, personaId });
    }
  };

  const filteredPersonas = personas.filter((persona: Persona) =>
    persona.nombre.toLowerCase().includes(searchPersona.toLowerCase()) ||
    persona.identificacion.toLowerCase().includes(searchPersona.toLowerCase())
  );

  const personasEnCelula = celulaDetalle?.personas?.map((p: any) => p.id) || [];
  const personasDisponibles = filteredPersonas.filter((persona: Persona) =>
    !personasEnCelula.includes(persona.id)
  );

  const getNivelColor = (nivel: number) => {
    switch (nivel) {
      case 1: return "bg-red-100 text-red-800";
      case 2: return "bg-orange-100 text-orange-800";
      case 3: return "bg-blue-100 text-blue-800";
      case 4: return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loadingCelulas) {
    return <div className="flex justify-center p-8">Cargando células...</div>;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Células</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Célula
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Células */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Células Registradas</h2>
          {celulas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No hay células registradas
              </CardContent>
            </Card>
          ) : (
            celulas.map((celula: Celula) => (
              <Card 
                key={celula.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCelula === celula.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCelula(celula.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{celula.nombreCelula}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{celula.zona}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCelula(celula.id);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(celula);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user?.rol === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(celula.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {celula.detalle && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600">{celula.detalle}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Detalle de Célula Seleccionada */}
        <div>
          {selectedCelula && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Organigrama de Célula</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowAddPersonDialog(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Persona
                </Button>
              </div>

              {loadingDetalle ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    Cargando organigrama...
                  </CardContent>
                </Card>
              ) : celulaDetalle ? (
                <div className="space-y-4">
                  {celulaDetalle.niveles?.map((nivel: any) => (
                    <Card key={nivel.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge className={getNivelColor(nivel.nivel)}>
                            Nivel {nivel.nivel}
                          </Badge>
                          {nivel.nombre}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{nivel.descripcion}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {celulaDetalle.organigrama[nivel.nivel]?.length > 0 ? (
                            celulaDetalle.organigrama[nivel.nivel].map((persona: any) => (
                              <div key={persona.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="font-medium">{persona.nombre}</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    {persona.tipo_identificacion_nombre}: {persona.identificacion}
                                  </span>
                                  {persona.posicion_estructura_nombre && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {persona.posicion_estructura_nombre}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePersona(persona.id)}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No hay personas asignadas a este nivel
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    Seleccione una célula para ver su organigrama
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog para crear célula */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Célula</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombreCelula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Célula</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre de la célula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la zona de operación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="detalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese detalles adicionales sobre la célula"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creando..." : "Crear Célula"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar célula */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Célula</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombreCelula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Célula</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre de la célula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la zona de operación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="detalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ingrese detalles adicionales sobre la célula"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Actualizando..." : "Actualizar Célula"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar persona */}
      <Dialog open={showAddPersonDialog} onOpenChange={setShowAddPersonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Persona a la Célula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nombre o identificación..."
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {personasDisponibles.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No hay personas disponibles
                </p>
              ) : (
                personasDisponibles.map((persona: Persona) => (
                  <div
                    key={persona.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-medium">{persona.nombre}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {persona.tipo_identificacion_nombre}: {persona.identificacion}
                      </span>
                      {persona.posicion_estructura_nombre && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {persona.posicion_estructura_nombre}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddPersona(persona.id)}
                      disabled={addPersonaMutation.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}