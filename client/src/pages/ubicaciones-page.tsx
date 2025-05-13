import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, User, Car, Home } from "lucide-react";

// Make sure to import Leaflet via CDN in index.html
declare global {
  interface Window {
    L: any;
  }
}

export default function UbicacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/ubicaciones", searchTerm, selectedTypes],
    enabled: false,
  });

  useEffect(() => {
    // Initialize map when component mounts
    if (!mapRef.current && mapContainerRef.current) {
      const leaflet = window.L;
      if (!leaflet) return;

      const newMap = leaflet.map(mapContainerRef.current).setView([-34.603722, -58.381592], 13);
      
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
      
      mapRef.current = newMap;
      setMap(newMap);

      // Add demo markers for visualization
      const personMarker = leaflet.marker([-34.603722, -58.381592])
        .addTo(newMap)
        .bindPopup("Carlos Rodríguez - Domicilio Principal");
          
      const vehicleMarker = leaflet.marker([-34.595588, -58.373867])
        .addTo(newMap)
        .bindPopup("Toyota Corolla (ABC-123) - Última ubicación");
          
      const propertyMarker = leaflet.marker([-34.610987, -58.385941])
        .addTo(newMap)
        .bindPopup("Casa - Propiedad de Ana Martínez");
      
      setMarkers([personMarker, vehicleMarker, propertyMarker]);
    }

    // Clean up map instance when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      refetch();
      
      // Here we would update markers based on search results
      // For demo purposes, we'll just use the existing markers
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
            <CardTitle>Ubicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, placa, dirección, etc."
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
            
            {/* Map Container */}
            <div className="border rounded-lg overflow-hidden">
              <div ref={mapContainerRef} className="leaflet-container">
                {/* Map will be initialized here */}
              </div>
              
              <div className="p-4 bg-gray-50 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Ubicaciones encontradas</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center mr-2">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">Carlos Rodríguez - Domicilio (Av. Principal #123)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                      <Car className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">Toyota Corolla (ABC-123) - Última ubicación registrada</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                      <Home className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">Casa - Propiedad de Ana Martínez</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
