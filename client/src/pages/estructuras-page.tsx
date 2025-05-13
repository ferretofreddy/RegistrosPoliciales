import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Car, Home, MapPin, FileText } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";

export default function EstructurasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<{
    tipo: string;
    id: number;
    nombre: string;
  } | null>(null);

  const { data: searchResults, isLoading: searchLoading, refetch: searchRefetch } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
  }>({
    queryKey: ["/api/buscar", searchTerm],
    enabled: false,
  });

  const { data: relaciones, isLoading: relacionesLoading, refetch: relacionesRefetch } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
    ubicaciones?: Ubicacion[];
  }>({
    queryKey: ["/api/relaciones", selectedEntity?.tipo, selectedEntity?.id],
    enabled: !!selectedEntity,
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchRefetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectEntityForStructure = (tipo: string, id: number, nombre: string) => {
    setSelectedEntity({ tipo, id, nombre });
    relacionesRefetch();
  };

  const exportToPdf = () => {
    // Implementación para exportar a PDF utilizando jsPDF o html-to-pdf
    console.log("Exportando a PDF...");
    alert("La exportación a PDF se implementará próximamente");
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Estructura de Relaciones</CardTitle>
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
            </div>

            {searchLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Buscando...</p>
              </div>
            ) : searchResults && Object.values(searchResults).some(arr => arr && arr.length > 0) ? (
              <div className="space-y-6 mb-6">
                {/* Search Results */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Resultados de búsqueda</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {searchResults.personas && searchResults.personas.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-2">Personas</h4>
                          <div className="space-y-2">
                            {searchResults.personas.map((persona) => (
                              <div 
                                key={persona.id}
                                className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded-md cursor-pointer hover:bg-blue-100"
                                onClick={() => selectEntityForStructure("personas", persona.id, persona.nombre)}
                              >
                                <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                                  <User className="h-4 w-4 text-blue-700" />
                                </div>
                                <div>
                                  <span className="font-medium text-blue-800">{persona.nombre}</span>
                                  <span className="ml-2 text-sm text-blue-600">({persona.identificacion})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.vehiculos && searchResults.vehiculos.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-2">Vehículos</h4>
                          <div className="space-y-2">
                            {searchResults.vehiculos.map((vehiculo) => (
                              <div 
                                key={vehiculo.id}
                                className="flex items-center p-3 bg-green-50 border border-green-100 rounded-md cursor-pointer hover:bg-green-100"
                                onClick={() => selectEntityForStructure("vehiculos", vehiculo.id, `${vehiculo.marca} (${vehiculo.placa})`)}
                              >
                                <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center mr-3">
                                  <Car className="h-4 w-4 text-green-700" />
                                </div>
                                <div>
                                  <span className="font-medium text-green-800">{vehiculo.marca}</span>
                                  <span className="ml-2 text-sm text-green-600">({vehiculo.placa})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.inmuebles && searchResults.inmuebles.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-gray-700 mb-2">Inmuebles</h4>
                          <div className="space-y-2">
                            {searchResults.inmuebles.map((inmueble) => (
                              <div 
                                key={inmueble.id}
                                className="flex items-center p-3 bg-yellow-50 border border-yellow-100 rounded-md cursor-pointer hover:bg-yellow-100"
                                onClick={() => selectEntityForStructure("inmuebles", inmueble.id, `${inmueble.tipo} (${inmueble.direccion})`)}
                              >
                                <div className="h-8 w-8 rounded-full bg-yellow-200 flex items-center justify-center mr-3">
                                  <Home className="h-4 w-4 text-yellow-700" />
                                </div>
                                <div>
                                  <span className="font-medium text-yellow-800">{inmueble.tipo}</span>
                                  <span className="ml-2 text-sm text-yellow-600">({inmueble.direccion})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-medium text-gray-700">No se encontraron resultados</h3>
                <p className="text-gray-500 mt-1">Intente con otros términos de búsqueda</p>
              </div>
            ) : null}

            {/* Estructura Visualización */}
            {selectedEntity && (
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Estructura para: {selectedEntity.nombre}
                  </h3>
                </div>
                
                {relacionesLoading ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-2 text-gray-500">Cargando relaciones...</p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary-100 border border-primary-300 rounded-lg p-4 mb-4 max-w-xs w-full text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="h-12 w-12 rounded-full bg-primary-200 flex items-center justify-center">
                            {selectedEntity.tipo === "personas" ? (
                              <User className="h-6 w-6 text-primary-600" />
                            ) : selectedEntity.tipo === "vehiculos" ? (
                              <Car className="h-6 w-6 text-primary-600" />
                            ) : (
                              <Home className="h-6 w-6 text-primary-600" />
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-primary-800">{selectedEntity.nombre}</h4>
                        <p className="text-sm text-primary-600">
                          {selectedEntity.tipo === "personas" ? (
                            `Identificación: ${(relaciones?.personas && relaciones.personas[0]?.identificacion) || "N/A"}`
                          ) : selectedEntity.tipo === "vehiculos" ? (
                            `Placa: ${(relaciones?.vehiculos && relaciones.vehiculos[0]?.placa) || "N/A"}`
                          ) : (
                            `Propietario: ${(relaciones?.inmuebles && relaciones.inmuebles[0]?.propietario) || "N/A"}`
                          )}
                        </p>
                      </div>
                      
                      <div className="w-px h-8 bg-gray-300"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {/* Vehículos relacionados */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-700 mb-2 flex items-center">
                            <Car className="mr-2 h-4 w-4" /> Vehículos relacionados
                          </h5>
                          {relaciones?.vehiculos && relaciones.vehiculos.length > 0 ? (
                            <ul className="space-y-2">
                              {relaciones.vehiculos.map((vehiculo) => (
                                <li key={vehiculo.id} className="text-sm bg-white p-2 rounded border border-blue-100">
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No hay vehículos relacionados</p>
                          )}
                        </div>
                        
                        {/* Inmuebles relacionados */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h5 className="font-medium text-green-700 mb-2 flex items-center">
                            <Home className="mr-2 h-4 w-4" /> Inmuebles relacionados
                          </h5>
                          {relaciones?.inmuebles && relaciones.inmuebles.length > 0 ? (
                            <ul className="space-y-2">
                              {relaciones.inmuebles.map((inmueble) => (
                                <li key={inmueble.id} className="text-sm bg-white p-2 rounded border border-green-100">
                                  {inmueble.tipo} ({inmueble.direccion})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No hay inmuebles relacionados</p>
                          )}
                        </div>
                        
                        {/* Ubicaciones relacionadas */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-700 mb-2 flex items-center">
                            <MapPin className="mr-2 h-4 w-4" /> Ubicaciones registradas
                          </h5>
                          {relaciones?.ubicaciones && relaciones.ubicaciones.length > 0 ? (
                            <ul className="space-y-2">
                              {relaciones.ubicaciones.map((ubicacion) => (
                                <li key={ubicacion.id} className="text-sm bg-white p-2 rounded border border-yellow-100">
                                  {ubicacion.tipo} ({ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No hay ubicaciones relacionadas</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <Button onClick={exportToPdf}>
                    <FileText className="mr-2 h-4 w-4" /> Exportar a PDF
                  </Button>
                </div>
              </div>
            )}
            
            {/* Historial de Registros */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Historial de Registros</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        12/05/2023 10:25
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Juan Pérez (Investigador)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Registro de nuevo domicilio
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Domicilio Principal para Carlos Rodríguez
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10/05/2023 15:10
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Ana López (Admin)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Vinculación de vehículo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Toyota Corolla (ABC-123) vinculado a Carlos Rodríguez
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
