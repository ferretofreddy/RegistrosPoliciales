import { useState } from "react";
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

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Manejar la selección de un resultado de búsqueda
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
    
    // Por ahora, simplemente limpiamos las ubicaciones
    // La lógica real será implementada posteriormente
    setLocations([]);
  };

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
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
                <h2 className="text-xl font-bold">Ubicaciones de {selectedResult.titulo}</h2>
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
                      markers={locations} 
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