import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, User, Car, Home, Eye, Edit, Trash2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DetalleDialog from "@/components/detalle-dialog";

export default function ConsultaPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  // Estado para el diálogo de detalles
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"persona" | "vehiculo" | "inmueble" | "ubicacion">("persona");

  const { data, isLoading, refetch } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
  }>({
    queryKey: ["/api/buscar", searchTerm, selectedTypes],
    enabled: false,
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      refetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Consulta de Datos</CardTitle>
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
                      setSelectedTypes({ ...selectedTypes, personas: !!checked })
                    }
                  />
                  <span className="text-gray-700">Personas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedTypes.vehiculos}
                    onCheckedChange={(checked) => 
                      setSelectedTypes({ ...selectedTypes, vehiculos: !!checked })
                    }
                  />
                  <span className="text-gray-700">Vehículos</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedTypes.inmuebles}
                    onCheckedChange={(checked) => 
                      setSelectedTypes({ ...selectedTypes, inmuebles: !!checked })
                    }
                  />
                  <span className="text-gray-700">Inmuebles</span>
                </label>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Cargando resultados...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personas Results */}
                {selectedTypes.personas && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Personas</h3>
                    </div>
                    <div className="overflow-x-auto">
                      {data?.personas?.length ? (
                        <table className="min-w-full divide-y divide-gray-200 responsive-table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Identificación
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="h-5 w-5 text-gray-500" />
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{persona.nombre}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{persona.identificacion}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 flex flex-wrap gap-1">
                                    {persona.alias?.map((alias, index) => (
                                      <Badge key={index} variant="blue">{alias}</Badge>
                                    ))}
                                    {!persona.alias?.length && (
                                      <span className="text-gray-500 text-xs">Sin alias</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-3 table-actions">
                                    {isMobile && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="md:hidden visible"
                                        onClick={() => {
                                          setItemSeleccionado(persona);
                                          setTipoSeleccionado("persona");
                                          setDetalleDialogOpen(true);
                                        }}
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
                                            onClick={() => {
                                              setItemSeleccionado(persona);
                                              setTipoSeleccionado("persona");
                                              setDetalleDialogOpen(true);
                                            }}
                                          >
                                            <Eye className="h-4 w-4 text-secondary-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver detalles</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {(user?.rol === "admin" || user?.rol === "investigador") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Edit className="h-4 w-4 text-secondary-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Editar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    {user?.rol === "admin" && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Eliminar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
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
                  </div>
                )}

                {/* Vehículos Results */}
                {selectedTypes.vehiculos && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Vehículos</h3>
                    </div>
                    <div className="overflow-x-auto">
                      {data?.vehiculos?.length ? (
                        <table className="min-w-full divide-y divide-gray-200 responsive-table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Marca/Modelo
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Placa
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Color
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
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Car className="h-5 w-5 text-gray-500" />
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{vehiculo.marca}</div>
                                      <div className="text-sm text-gray-500">{vehiculo.tipo}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{vehiculo.placa}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{vehiculo.color}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-3">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4 text-secondary-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver detalles</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {(user?.rol === "admin" || user?.rol === "investigador") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Edit className="h-4 w-4 text-secondary-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Editar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    {user?.rol === "admin" && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Eliminar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
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
                  </div>
                )}

                {/* Inmuebles Results */}
                {selectedTypes.inmuebles && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Inmuebles</h3>
                    </div>
                    <div className="overflow-x-auto">
                      {data?.inmuebles?.length ? (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ubicación
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Home className="h-5 w-5 text-gray-500" />
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{inmueble.tipo}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{inmueble.direccion}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{inmueble.propietario}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-3">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4 text-secondary-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver detalles</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {(user?.rol === "admin" || user?.rol === "investigador") && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Edit className="h-4 w-4 text-secondary-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Editar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    {user?.rol === "admin" && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Eliminar</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
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
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo de detalles */}
      <DetalleDialog 
        open={detalleDialogOpen} 
        onOpenChange={setDetalleDialogOpen}
        tipo={tipoSeleccionado}
        dato={itemSeleccionado}
      />
    </MainLayout>
  );
}
