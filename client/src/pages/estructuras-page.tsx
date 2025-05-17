import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Car, Home, MapPin, FileText, Map } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Definición para Leaflet
declare global {
  interface Window {
    L: any;
  }
}

export default function EstructurasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<{
    tipo: string;
    id: number;
    nombre: string;
  } | null>(null);
  
  // Estados para controlar el filtrado
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  // Estados para el mapa
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const { toast } = useToast();

  const { data: searchResults, isLoading: searchLoading, refetch: searchRefetch } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
  }>({
    queryKey: ["/api/buscar", searchTerm],
    enabled: false,
  });
  
  // Consulta para buscar ubicaciones con coordenadas
  const { data: ubicacionesData, isLoading: ubicacionesLoading, refetch: ubicacionesRefetch } = useQuery({
    queryKey: ["/api/ubicaciones", searchTerm, selectedTypes],
    queryFn: async () => {
      console.log("[DEBUG] Iniciando búsqueda de ubicaciones en estructuras"); 
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      console.log(`[DEBUG] Búsqueda con término: "${searchTerm}" y tipos: ${tipos.join(', ')}`);
      const response = await fetch(`/api/ubicaciones?buscar=${encodeURIComponent(searchTerm)}&tipos=${tipos.join(',')}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] Error en la búsqueda: ${response.status} - ${errorText}`);
        throw new Error(`Error al buscar ubicaciones: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[DEBUG] Datos recibidos:", data);
      return data;
    },
    enabled: false, // Desactivamos la búsqueda automática
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
      // Buscar resultados normales
      searchRefetch();
      
      // También buscar ubicaciones con coordenadas
      ubicacionesRefetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInitialized) return;
    
    // Verificar si Leaflet está disponible
    if (typeof window !== 'undefined' && window.L) {
      try {
        console.log("Inicializando mapa en página de estructuras");
        const leaflet = window.L;
        
        // Coordenadas iniciales (Costa Rica - San José)
        const initialCoords = [9.9281, -84.0907];
        
        // Crear mapa
        const newMap = leaflet.map(mapContainerRef.current).setView(initialCoords, 8);
        
        // Agregar capa del mapa (OpenStreetMap)
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);
        
        // Guardar referencia al mapa
        mapRef.current = newMap;
        setMap(newMap);
        setMapInitialized(true);
        
        // Invalidar tamaño para renderizar correctamente
        setTimeout(() => {
          newMap.invalidateSize();
        }, 300);
        
        console.log("Mapa inicializado correctamente");
      } catch (error) {
        console.error("Error al inicializar el mapa:", error);
        toast({
          title: "Error al inicializar el mapa",
          description: "Ocurrió un error al cargar el mapa: " + (error instanceof Error ? error.message : String(error)),
          variant: "destructive",
        });
      }
    }
    
    // Limpieza cuando se desmonta el componente
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
        setMapInitialized(false);
      }
    };
  }, [mapContainerRef.current]);
  
  // Actualizar marcadores cuando cambian los datos de ubicaciones
  useEffect(() => {
    if (!map || !ubicacionesData) return;
    
    console.log("Actualizando marcadores con datos:", ubicacionesData);
    
    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.remove());
    
    const newMarkers: any[] = [];
    const bounds = window.L.latLngBounds();
    const leaflet = window.L;
    
    // Función para crear un icono personalizado según el tipo
    const createIcon = (tipo: string) => {
      // Determinar el color basado en el tipo de entidad
      const getIconColor = () => {
        if (tipo === 'persona') return '#ef4444';  // Rojo
        if (tipo === 'vehiculo') return '#3b82f6'; // Azul
        if (tipo === 'inmueble') return '#10b981'; // Verde
        return '#6366f1'; // Indigo (por defecto para ubicaciones)
      };
      
      const color = getIconColor();
      
      return leaflet.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${color};">
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    };
    
    // Procesar ubicaciones directas
    if (ubicacionesData.ubicacionesDirectas && ubicacionesData.ubicacionesDirectas.length > 0) {
      ubicacionesData.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          try {
            const marker = leaflet.marker([ubicacion.latitud, ubicacion.longitud], {
              icon: createIcon('ubicacion')
            }).addTo(map);
            
            // Crear popup con información
            const popupContent = `
              <div style="min-width: 150px">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${ubicacion.descripcion}</h3>
                <p style="margin: 2px 0"><strong>Tipo:</strong> ${ubicacion.tipo_descripcion || 'Ubicación'}</p>
                <p style="margin: 2px 0"><strong>Dirección:</strong> ${ubicacion.direccion || 'No disponible'}</p>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            newMarkers.push(marker);
            bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          } catch (error) {
            console.error("Error al crear marcador para ubicación:", error);
          }
        }
      });
    }
    
    // Procesar ubicaciones relacionadas
    if (ubicacionesData.ubicacionesRelacionadas && ubicacionesData.ubicacionesRelacionadas.length > 0) {
      ubicacionesData.ubicacionesRelacionadas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          try {
            const marker = leaflet.marker([ubicacion.latitud, ubicacion.longitud], {
              icon: createIcon(ubicacion.entidad_tipo || 'ubicacion')
            }).addTo(map);
            
            // Crear popup con información
            const popupContent = `
              <div style="min-width: 150px">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${ubicacion.descripcion}</h3>
                <p style="margin: 2px 0"><strong>Tipo:</strong> ${ubicacion.tipo_descripcion || 'Ubicación'}</p>
                <p style="margin: 2px 0"><strong>Relacionado a:</strong> ${ubicacion.entidad_nombre || 'No disponible'}</p>
                <p style="margin: 2px 0"><strong>Dirección:</strong> ${ubicacion.direccion || 'No disponible'}</p>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            newMarkers.push(marker);
            bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          } catch (error) {
            console.error("Error al crear marcador para ubicación relacionada:", error);
          }
        }
      });
    }
    
    // Actualizar el estado con los nuevos marcadores
    setMarkers(newMarkers);
    
    // Ajustar el zoom para ver todos los marcadores, si hay alguno
    if (newMarkers.length > 0) {
      try {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true
        });
      } catch (error) {
        console.error("Error al ajustar el zoom del mapa:", error);
      }
    }
  }, [map, ubicacionesData]);

  const selectEntityForStructure = (tipo: string, id: number, nombre: string) => {
    setSelectedEntity({ tipo, id, nombre });
    relacionesRefetch();
  };

  // Función de exportación a PDF eliminada

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
              
              {/* Filtros de tipo */}
              <div className="mt-3 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-personas"
                    checked={selectedTypes.personas}
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, personas: !!checked})
                    }
                  />
                  <label
                    htmlFor="filter-personas"
                    className="text-sm font-medium flex items-center"
                  >
                    <User className="h-4 w-4 mr-1 text-blue-600" />
                    Personas
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-vehiculos"
                    checked={selectedTypes.vehiculos}
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, vehiculos: !!checked})
                    }
                  />
                  <label
                    htmlFor="filter-vehiculos"
                    className="text-sm font-medium flex items-center"
                  >
                    <Car className="h-4 w-4 mr-1 text-green-600" />
                    Vehículos
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-inmuebles"
                    checked={selectedTypes.inmuebles}
                    onCheckedChange={(checked) => 
                      setSelectedTypes({...selectedTypes, inmuebles: !!checked})
                    }
                  />
                  <label
                    htmlFor="filter-inmuebles"
                    className="text-sm font-medium flex items-center"
                  >
                    <Home className="h-4 w-4 mr-1 text-red-600" />
                    Inmuebles
                  </label>
                </div>
              </div>
            </div>
            
            {/* Mapa de ubicaciones */}
            <div className="mb-6 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-red-500" />
                  Mapa de Ubicaciones
                </h3>
              </div>
              <div className="p-0 h-[400px] relative">
                {!mapInitialized && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                      <p className="mt-2 text-gray-600">Cargando mapa...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapContainerRef}
                  className="h-full w-full"
                  style={{ zIndex: 0 }}
                />
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
                
                {/* Botón de exportación a PDF eliminado */}
              </div>
            )}
            
            {/* El historial de registros ha sido eliminado */}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
