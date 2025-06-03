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
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  
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
    queryFn: async () => {
      const response = await fetch(`/api/celulas/${selectedCelula}`);
      if (!response.ok) {
        throw new Error('Error al cargar detalles de la célula');
      }
      return response.json();
    },
    enabled: !!selectedCelula
  });

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
    enabled: showAddPersonDialog
  });

  // Buscar personas con debounce
  const searchPersonas = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/personas/search?search=${encodeURIComponent(searchTerm)}`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Error al buscar personas:", error);
      setSearchResults([]);
    }
  };

  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (value: string) => {
    setSearchPersona(value);
    searchPersonas(value);
  };

  // Agregar persona seleccionada
  const addSelectedPersona = (persona: Persona) => {
    if (!selectedPersonas.find(p => p.id === persona.id)) {
      setSelectedPersonas([...selectedPersonas, persona]);
    }
    setSearchPersona("");
    setSearchResults([]);
  };

  // Remover persona seleccionada
  const removeSelectedPersona = (personaId: number) => {
    setSelectedPersonas(selectedPersonas.filter(p => p.id !== personaId));
  };

  // Limpiar selecciones
  const clearSelections = () => {
    setSelectedPersonas([]);
    setSearchPersona("");
    setSearchResults([]);
  };

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
    mutationFn: (id: number) => apiRequest("DELETE", `/api/celulas/${id}`),
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
      apiRequest("POST", `/api/celulas/${celulaId}/personas`, { personaId }),
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
      apiRequest("DELETE", `/api/celulas/${celulaId}/personas/${personaId}`),
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

  const handleCreate = async (data: FormData) => {
    try {
      // Agregar IDs de personas seleccionadas al payload
      const payload = {
        ...data,
        personaIds: selectedPersonas.map(p => p.id)
      };

      console.log("Creando célula con payload:", payload);

      const response = await fetch("/api/celulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la célula");
      }

      const nuevaCelula = await response.json();
      console.log("Célula creada:", nuevaCelula);

      // Limpiar formulario y selecciones
      queryClient.invalidateQueries({ queryKey: ["/api/celulas"] });
      setShowCreateDialog(false);
      form.reset();
      clearSelections();
      toast({ 
        description: `Célula creada exitosamente${selectedPersonas.length > 0 ? ` con ${selectedPersonas.length} personas asignadas` : ''}`
      });

    } catch (error: any) {
      console.error("Error al crear célula:", error);
      toast({
        variant: "destructive",
        description: error.message || "Error al crear la célula"
      });
    }
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Células</h1>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Célula
          </Button>
        </div>

        {/* Responsive Layout */}
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
          {/* Lista de Células - Mobile: full width, Desktop: 20% */}
          <div className="w-full xl:w-1/5 space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold hidden xl:block">Células Registradas</h2>
            <h2 className="text-lg font-semibold xl:hidden">Células ({celulas.length})</h2>
            
            {celulas.length === 0 ? (
              <Card className="xl:min-h-[200px]">
                <CardContent className="p-4 sm:p-6 text-center text-gray-500">
                  <div className="hidden sm:block">No hay células registradas</div>
                  <div className="sm:hidden">Sin células</div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 xl:space-y-3">
                {celulas.map((celula: Celula) => (
                  <Card 
                    key={celula.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedCelula === celula.id ? 'ring-2 ring-primary shadow-md' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCelula(celula.id)}
                  >
                    {/* Mobile Layout - Solo nombre */}
                    <div className="block xl:hidden">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                              {celula.nombreCelula}
                            </CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500 truncate">{celula.zona}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(celula);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {user?.rol === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(celula.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </div>

                    {/* Desktop Layout - Información completa */}
                    <div className="hidden xl:block">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base leading-tight">
                              {celula.nombreCelula}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate">{celula.zona}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCelula(celula.id);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(celula);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {user?.rol === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(celula.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {celula.detalle && (
                        <CardContent className="pt-0 pb-3">
                          <p className="text-xs text-gray-600 line-clamp-2">{celula.detalle}</p>
                        </CardContent>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Área de Contenido Principal - Mobile: full width, Desktop: 80% */}
          <div className="w-full xl:w-4/5 flex-1">
            {selectedCelula ? (
              <div className="space-y-4">
                {/* Header del Organigrama */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">Organigrama de Célula</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPersonDialog(true)}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Agregar Persona</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </div>

                {loadingDetalle ? (
                  <Card>
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="hidden sm:block">Cargando organigrama...</div>
                      <div className="sm:hidden">Cargando...</div>
                    </CardContent>
                  </Card>
                ) : celulaDetalle ? (
                  <div className="space-y-3 sm:space-y-4">
                    {celulaDetalle.niveles?.map((nivel: any) => (
                      <Card key={nivel.id} className="overflow-hidden">
                        <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
                          <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge className={`${getNivelColor(nivel.nivel)} w-fit`}>
                              Nivel {nivel.nivel}
                            </Badge>
                            <span className="text-sm sm:text-lg">{nivel.nombre}</span>
                          </CardTitle>
                          {nivel.descripcion && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{nivel.descripcion}</p>
                          )}
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                          <div className="space-y-2">
                            {celulaDetalle.organigrama[nivel.nivel]?.length > 0 ? (
                              celulaDetalle.organigrama[nivel.nivel].map((persona: any) => (
                                <div key={persona.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm sm:text-base truncate">{persona.nombre}</div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                      <span className="text-xs sm:text-sm text-gray-500">
                                        {persona.tipo_identificacion_nombre}: {persona.identificacion}
                                      </span>
                                      {persona.posicion_estructura_nombre && (
                                        <Badge variant="outline" className="text-xs w-fit">
                                          {persona.posicion_estructura_nombre}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePersona(persona.id)}
                                    className="self-end sm:self-center h-8 w-8 p-0"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-500 italic text-center py-4">
                                <span className="hidden sm:inline">No hay personas asignadas a este nivel</span>
                                <span className="sm:hidden">Sin personas asignadas</span>
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="h-64 sm:h-96">
                    <CardContent className="p-4 sm:p-6 text-center text-gray-500 flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-4xl sm:text-6xl mb-4 opacity-20">📋</div>
                        <div className="hidden sm:block">Seleccione una célula para ver su organigrama</div>
                        <div className="sm:hidden text-sm">Seleccione una célula</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="h-64 sm:h-96">
                <CardContent className="p-4 sm:p-6 text-center text-gray-500 flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-4 opacity-20">🔍</div>
                    <div className="hidden sm:block">Seleccione una célula de la lista para ver su organigrama</div>
                    <div className="sm:hidden text-sm">Seleccione una célula</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog para crear célula */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Crear Nueva Célula</DialogTitle>
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

              {/* Sección para buscar y agregar personas */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Buscar Personas para Agregar</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre o identificación..."
                      value={searchPersona}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Resultados de búsqueda */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white shadow-sm">
                      {searchResults.map((persona) => (
                        <div
                          key={persona.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addSelectedPersona(persona)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{persona.nombre}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {persona.identificacion}
                              </span>
                              {persona.posicion_estructura && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {persona.posicion_estructura}
                                </Badge>
                              )}
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Personas seleccionadas */}
                {selectedPersonas.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Personas Seleccionadas ({selectedPersonas.length})</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {selectedPersonas.map((persona) => (
                        <div key={persona.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                          <div>
                            <span className="font-medium">{persona.nombre}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {persona.identificacion}
                            </span>
                            {persona.posicion_estructura && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {persona.posicion_estructura}
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedPersona(persona.id)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSelections}
                      className="mt-2"
                    >
                      Limpiar selección
                    </Button>
                  </div>
                )}
              </div>

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
    </MainLayout>
  );
}