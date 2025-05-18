import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";
import { SearchResult, EntityType } from "@/components/search-component";

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]); // Costa Rica centro
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  // Manejar la selección de un resultado
  const handleResultSelect = (result: SearchResult) => {
    if (result.tipo === "todas") return;
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
  };

  // Obtener datos de la entidad seleccionada
  const { data: entityData, isLoading: isLoadingEntity } = useQuery({
    queryKey: [selectedResult?.tipo && `api/${selectedResult.tipo}s/${selectedResult.id}`],
    enabled: !!selectedResult && selectedResult.tipo !== "todas"
  });

  // Obtener relaciones para buscar ubicaciones
  const { data: relationData, isLoading: isLoadingRelations } = useQuery({
    queryKey: [selectedResult?.tipo && `api/relaciones/${selectedResult.tipo}/${selectedResult.id}`],
    enabled: !!selectedResult && selectedResult.tipo !== "todas"
  });

  // Procesar los datos y crear las ubicaciones para el mapa y la tabla
  useEffect(() => {
    if (!selectedResult) {
      setLocations([]);
      return;
    }

    const newLocations: LocationData[] = [];
    
    // Procesar los datos según el tipo de entidad seleccionada
    if (entityData) {
      // Para ubicaciones directas
      if (selectedResult.tipo === "ubicacion" && entityData.latitud && entityData.longitud) {
        newLocations.push({
          id: entityData.id,
          lat: entityData.latitud,
          lng: entityData.longitud,
          title: entityData.tipo || "Ubicación",
          description: entityData.observaciones || "Sin descripción",
          type: "ubicacion",
          relation: "direct",
          entityId: entityData.id
        });
        
        // Centrar el mapa en la ubicación
        setMapCenter([entityData.latitud, entityData.longitud]);
      }
      
      // Para personas, vehículos o inmuebles que tengan coordenadas
      if (selectedResult.tipo === "persona" || selectedResult.tipo === "vehiculo" || selectedResult.tipo === "inmueble") {
        // Si la entidad tiene coordenadas propias (algunos inmuebles pueden tenerlas)
        if (entityData.latitud && entityData.longitud) {
          newLocations.push({
            id: entityData.id,
            lat: entityData.latitud,
            lng: entityData.longitud,
            title: entityData.nombre || entityData.direccion || "Sin nombre",
            description: entityData.identificacion || entityData.referencia || "Sin descripción",
            type: selectedResult.tipo,
            relation: "direct",
            entityId: entityData.id
          });
          
          // Centrar el mapa en esta ubicación
          setMapCenter([entityData.latitud, entityData.longitud]);
        }
      }
    }
    
    // Procesar relaciones
    if (relationData) {
      // Procesar ubicaciones relacionadas
      if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
        relationData.ubicaciones.forEach((ubicacion: any) => {
          if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
            newLocations.push({
              id: ubicacion.id,
              lat: ubicacion.latitud,
              lng: ubicacion.longitud,
              title: ubicacion.tipo || "Ubicación",
              description: ubicacion.observaciones || "Sin descripción",
              type: "ubicacion",
              relation: "related",
              entityId: ubicacion.id,
              relationInfo: "Ubicación relacionada"
            });
            
            // Si no hay ubicación directa, centrar en la primera ubicación relacionada
            if (newLocations.length === 1) {
              setMapCenter([ubicacion.latitud, ubicacion.longitud]);
            }
          }
        });
      }
      
      // Procesar inmuebles relacionados (si tienen coordenadas)
      if (relationData.inmuebles && relationData.inmuebles.length > 0) {
        relationData.inmuebles.forEach((inmueble: any) => {
          if (inmueble && inmueble.latitud && inmueble.longitud) {
            newLocations.push({
              id: inmueble.id,
              lat: inmueble.latitud,
              lng: inmueble.longitud,
              title: inmueble.tipo || "Inmueble",
              description: inmueble.direccion || "Sin dirección",
              type: "inmueble",
              relation: "related",
              entityId: inmueble.id,
              relationInfo: "Inmueble relacionado"
            });
            
            // Si no hay ubicación directa, centrar en el primer inmueble
            if (newLocations.length === 1) {
              setMapCenter([inmueble.latitud, inmueble.longitud]);
            }
          }
        });
      }
      
      // Procesar personas relacionadas (si tienen coordenadas en su dirección)
      if (relationData.personas && relationData.personas.length > 0) {
        relationData.personas.forEach((persona: any) => {
          if (persona && persona.latitud && persona.longitud) {
            newLocations.push({
              id: persona.id,
              lat: persona.latitud,
              lng: persona.longitud,
              title: persona.nombre || "Persona",
              description: persona.identificacion || "Sin identificación",
              type: "persona",
              relation: "related",
              entityId: persona.id,
              relationInfo: "Persona relacionada"
            });
          }
        });
      }
      
      // Procesar vehículos relacionados (si tienen ubicaciones registradas)
      if (relationData.vehiculos && relationData.vehiculos.length > 0) {
        relationData.vehiculos.forEach((vehiculo: any) => {
          if (vehiculo && vehiculo.latitud && vehiculo.longitud) {
            newLocations.push({
              id: vehiculo.id,
              lat: vehiculo.latitud,
              lng: vehiculo.longitud,
              title: `${vehiculo.marca} ${vehiculo.modelo}` || "Vehículo",
              description: vehiculo.placa || "Sin placa",
              type: "vehiculo",
              relation: "related",
              entityId: vehiculo.id,
              relationInfo: "Vehículo relacionado"
            });
          }
        });
      }
    }
    
    setLocations(newLocations);
    
    // Si no hay ubicaciones, mostrar mensaje
    if (newLocations.length === 0) {
      console.log("No se encontraron ubicaciones para la entidad seleccionada o sus relaciones.");
    }
  }, [selectedResult, entityData, relationData]);

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setSelectedLocation(location);
    setMapCenter([location.lat, location.lng]);
  };

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
                <h2 className="text-xl font-bold">Ubicaciones de {selectedResult.nombre}</h2>
                <Separator className="flex-1 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded bg-primary-100 text-primary-800 text-sm font-medium">
                    {selectedResult.tipo === 'persona' && 'Persona'}
                    {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                    {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                  </div>
                </div>
              </div>
              
              {/* Sección del Mapa */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    <span>Mapa de Ubicaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locations.length > 0 ? (
                    <LocationMap 
                      markers={locations.map(loc => ({
                        id: loc.id,
                        lat: loc.lat,
                        lng: loc.lng,
                        title: loc.title,
                        description: loc.description,
                        type: loc.type,
                        relation: loc.relation
                      }))} 
                      center={mapCenter}
                      zoom={15}
                    />
                  ) : (
                    <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                      <MapPin className="h-12 w-12 mb-4 text-gray-400" />
                      <p className="mb-2 text-lg">No se encontraron ubicaciones</p>
                      <p className="text-sm text-center max-w-md">
                        Esta entidad no tiene coordenadas registradas ni relaciones con coordenadas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tabla de Ubicaciones */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ubicaciones Encontradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationsTable 
                    locations={locations}
                    onLocationClick={handleLocationClick}
                  />
                </CardContent>
              </Card>
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