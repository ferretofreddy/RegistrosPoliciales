import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Info, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import MainLayout from "@/components/main-layout";
import DetalleDialog from "@/components/detalle-dialog-new";

export default function ConsultaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  // Estado para el diálogo de detalles
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"persona" | "vehiculo" | "inmueble" | "ubicacion">("persona");

  const { data, isLoading, refetch, error } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
    ubicaciones?: Ubicacion[];
  }>({
    queryKey: ["/api/buscar", searchTerm, selectedTypes],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        throw new Error("Se requiere un término de búsqueda");
      }
      
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
        
      const params = new URLSearchParams();
      params.append("query", searchTerm);
      tipos.forEach(tipo => params.append("tipos", tipo));
      
      console.log("Realizando búsqueda con parámetros:", params.toString());
      
      const res = await fetch(`/api/buscar?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Error al realizar la búsqueda");
      }
      
      const data = await res.json();
      console.log("Resultados de búsqueda:", data);
      
      return data;
    },
    enabled: false,
    retry: false,
  });

  const handleSearch = () => {
    refetch().then((result) => {
      if (result.data) {
        console.log("Búsqueda completada:", result.data);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Función para abrir el diálogo de detalles
  const abrirDetalleDialog = (item: any, tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion") => {
    setItemSeleccionado(item);
    setTipoSeleccionado(tipo);
    setDetalleDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Consulta de Registros</CardTitle>
              <CardDescription>
                Busca personas, vehículos e inmuebles registrados en el sistema
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, identificación, placa, etc."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div>
                  <Button onClick={handleSearch} className="w-full md:w-auto">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedTypes.personas} 
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, personas: !!checked})
                    }
                  />
                  <span>Personas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedTypes.vehiculos} 
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, vehiculos: !!checked})
                    }
                  />
                  <span>Vehículos</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedTypes.inmuebles} 
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, inmuebles: !!checked})
                    }
                  />
                  <span>Inmuebles</span>
                </label>
              </div>
            </div>

            {error ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">
                <p>{(error as Error).message}</p>
              </div>
            ) : (
              <div>
                {isLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Buscando resultados...</p>
                  </div>
                ) : (
                  <div>
                    {data && (
                      <Tabs defaultValue="personas" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="personas" disabled={!selectedTypes.personas}>
                            Personas{data?.personas && ` (${data.personas.length})`}
                          </TabsTrigger>
                          <TabsTrigger value="vehiculos" disabled={!selectedTypes.vehiculos}>
                            Vehículos{data?.vehiculos && ` (${data.vehiculos.length})`}
                          </TabsTrigger>
                          <TabsTrigger value="inmuebles" disabled={!selectedTypes.inmuebles}>
                            Inmuebles{data?.inmuebles && ` (${data.inmuebles.length})`}
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="personas">
                          <div className="overflow-x-auto bg-white rounded-md border shadow-sm">
                            {data?.personas && data.personas.length > 0 ? (
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Nombre
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Identificación
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                      Alias
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {data.personas.map((persona) => (
                                    <tr key={persona.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{persona.nombre}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{persona.identificacion}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                        <div className="text-sm text-gray-900">{persona.alias?.join(", ") || "—"}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3 table-actions">
                                          {isMobile && (
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="md:hidden visible"
                                              onClick={() => abrirDetalleDialog(persona, "persona")}
                                              >
                                              <Info className="h-4 w-4 text-primary-600" />
                                            </Button>
                                          )}
                                          
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  onClick={() => abrirDetalleDialog(persona, "persona")}
                                                >
                                                  <Eye className="h-4 w-4 text-secondary-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Ver detalles</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-6 text-center text-gray-500">
                                {searchTerm ? "No se encontraron personas" : "Ingrese un término de búsqueda para comenzar"}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="vehiculos">
                          <div className="overflow-x-auto bg-white rounded-md border shadow-sm">
                            {data?.vehiculos && data.vehiculos.length > 0 ? (
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Marca
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Tipo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                      Placa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {data.vehiculos.map((vehiculo) => (
                                    <tr key={vehiculo.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{vehiculo.marca}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{vehiculo.tipo}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                        <div className="text-sm text-gray-900">{vehiculo.placa}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  onClick={() => abrirDetalleDialog(vehiculo, "vehiculo")}
                                                >
                                                  <Eye className="h-4 w-4 text-secondary-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Ver detalles</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-6 text-center text-gray-500">
                                {searchTerm ? "No se encontraron vehículos" : "Ingrese un término de búsqueda para comenzar"}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="inmuebles">
                          <div className="overflow-x-auto bg-white rounded-md border shadow-sm">
                            {data?.inmuebles && data.inmuebles.length > 0 ? (
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Tipo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Dirección
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                      Propietario
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {data.inmuebles.map((inmueble) => (
                                    <tr key={inmueble.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{inmueble.tipo}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{inmueble.direccion}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                        <div className="text-sm text-gray-900">{inmueble.propietario}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  onClick={() => abrirDetalleDialog(inmueble, "inmueble")}
                                                >
                                                  <Eye className="h-4 w-4 text-secondary-600" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Ver detalles</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-6 text-center text-gray-500">
                                {searchTerm ? "No se encontraron inmuebles" : "Ingrese un término de búsqueda para comenzar"}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {detalleDialogOpen && (
        <DetalleDialog
          open={detalleDialogOpen}
          onOpenChange={setDetalleDialogOpen}
          tipo={tipoSeleccionado}
          dato={itemSeleccionado}
        />
      )}
    </MainLayout>
  );
}