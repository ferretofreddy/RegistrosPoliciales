import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";
import { SearchResult } from "@/components/search-component";

// Coordenadas por defecto (centro de Costa Rica)
const DEFAULT_CENTER: [number, number] = [9.9281, -84.0907];
const DEFAULT_ZOOM = 7;

// Tipos de entidades
type EntityType = "persona" | "vehiculo" | "inmueble" | "ubicacion";

// Interfaz para ubicaciones
interface UbicacionEntidad {
  id: number;
  latitud: number;
  longitud: number;
  tipo?: string;
  observaciones?: string;
}

// Interfaces para respuestas de API
interface PersonaEntity {
  id: number;
  nombre: string;
  // otros campos...
}

interface VehiculoEntity {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  // otros campos...
}

interface InmuebleEntity {
  id: number;
  direccion: string;
  tipo?: string;
  // otros campos...
}

interface UbicacionEntity {
  id: number;
  tipo?: string;
  latitud: number;
  longitud: number;
  observaciones?: string;
  // otros campos...
}

interface RelacionesResponse {
  personas?: PersonaEntity[];
  vehiculos?: VehiculoEntity[];
  inmuebles?: InmuebleEntity[];
  ubicaciones?: UbicacionEntity[];
}

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener datos de la entidad seleccionada
  const { data: entityData } = useQuery({
    queryKey: [selectedResult ? `api/${selectedResult.tipo === "ubicacion" ? "ubicaciones" : selectedResult.tipo + "s"}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Obtener relaciones para buscar ubicaciones
  const { data: relationData } = useQuery({
    queryKey: [selectedResult ? `api/relaciones/${selectedResult.tipo}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Manejar la selección de un resultado de búsqueda
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
    setLocations([]);
  };

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
  };

  // Procesar ubicaciones cuando tengamos datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!selectedResult || !entityData || !relationData) return;
      
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        console.log("Procesando entidad:", selectedResult.tipo, entityData);
        
        // 1. Procesar según el tipo de entidad
        switch (selectedResult.tipo) {
          case "persona":
            // Buscar ubicaciones directas (domicilios) de la persona
            if (relationData && relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              for (const ubicacion of relationData.ubicaciones) {
                if (ubicacion.tipo === "domicilio" || !ubicacion.tipo) {
                  const lat = parseFloat(String(ubicacion.latitud));
                  const lng = parseFloat(String(ubicacion.longitud));
                  
                  if (!isNaN(lat) && !isNaN(lng)) {
                    ubicacionesEncontradas.push({
                      id: ubicacion.id,
                      lat: lat,
                      lng: lng,
                      title: ubicacion.tipo || "Domicilio",
                      description: `Domicilio de ${selectedResult.nombre}`,
                      type: "ubicacion",
                      relation: "direct",
                      entityId: selectedResult.id
                    });
                    
                    if (!hasCenteredMap) {
                      setMapCenter([lat, lng]);
                      hasCenteredMap = true;
                    }
                  }
                }
              }
            }
            break;
            
          case "inmueble":
            // Buscar ubicaciones directas del inmueble
            if (relationData && relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              for (const ubicacion of relationData.ubicaciones) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Inmueble",
                    description: `Ubicación de inmueble: ${selectedResult.nombre}`,
                    type: "inmueble",
                    relation: "direct",
                    entityId: selectedResult.id
                  });
                  
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            break;
            
          case "ubicacion":
            // La ubicación tiene coordenadas propias
            const ubicacion = entityData as UbicacionEntity;
            if (ubicacion.latitud && ubicacion.longitud) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat: lat,
                  lng: lng,
                  title: ubicacion.tipo || "Ubicación",
                  description: ubicacion.observaciones || "Sin descripción",
                  type: "ubicacion",
                  relation: "direct",
                  entityId: ubicacion.id
                });
                
                setMapCenter([lat, lng]);
                hasCenteredMap = true;
              }
            }
            break;
            
          case "vehiculo":
            // Los vehículos no tienen ubicaciones directas, pero podemos
            // buscar ubicaciones de sus propietarios si es necesario
            console.log("Los vehículos no tienen ubicaciones directas");
            break;
        }
        
        console.log("Ubicaciones encontradas:", ubicacionesEncontradas);
        setLocations(ubicacionesEncontradas);
        
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarUbicaciones();
  }, [selectedResult, entityData, relationData]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Ubicaciones</h1>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {selectedResult ? (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">
                  Ubicaciones de {selectedResult.nombre} 
                  <span className="ml-2 text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {selectedResult.tipo === 'persona' && 'Persona'}
                    {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                    {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                  </span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        <span>Mapa de Ubicaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="border rounded-md p-8 min-h-[300px] flex items-center justify-center text-gray-500">
                          <p>Cargando ubicaciones...</p>
                        </div>
                      ) : locations.length > 0 ? (
                        <div className="h-[400px]">
                          <LocationMap 
                            markers={locations} 
                            center={mapCenter}
                            zoom={15}
                          />
                        </div>
                      ) : (
                        <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                          <MapPin className="h-12 w-12 mb-4 text-gray-400" />
                          <p className="mb-2 text-lg">No se encontraron ubicaciones</p>
                          <p className="text-sm text-center max-w-md">
                            {selectedResult.tipo === 'vehiculo' 
                              ? 'Los vehículos no tienen ubicaciones directas. Consulte los propietarios para ver sus domicilios.'
                              : 'Esta entidad no tiene coordenadas registradas'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Search className="h-5 w-5" />
                        <span>Ubicaciones Encontradas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <p className="text-center py-4 text-gray-500">Cargando...</p>
                      ) : locations.length > 0 ? (
                        <LocationsTable 
                          locations={locations}
                          onLocationClick={handleLocationClick}
                        />
                      ) : (
                        <p className="text-center py-4 text-gray-500">
                          No se encontraron ubicaciones para esta entidad
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg">Realice una búsqueda para ver ubicaciones</p>
              <p className="text-sm text-center max-w-md">
                Seleccione una persona, vehículo, inmueble o ubicación para ver sus coordenadas en el mapa
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}