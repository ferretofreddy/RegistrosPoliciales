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
    queryFn: async () => {
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      const response = await fetch(`/api/ubicaciones?buscar=${encodeURIComponent(searchTerm)}&tipos=${tipos.join(',')}`);
      if (!response.ok) {
        throw new Error('Error al buscar ubicaciones');
      }
      return await response.json();
    },
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
      
      // Agregar control de escala
      leaflet.control.scale({ imperial: false, metric: true }).addTo(newMap);
      
      // Agregar botón para resetear la vista
      const resetViewControl = leaflet.control({ position: 'topright' });
      resetViewControl.onAdd = function() {
        const div = leaflet.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `<a href="#" title="Resetear vista" role="button" 
                            aria-label="Resetear vista del mapa" style="font-weight: bold; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                            <span>⌂</span>
                          </a>`;
        
        div.onclick = function() {
          newMap.setView([-34.603722, -58.381592], 13);
          return false;
        };
        
        return div;
      };
      resetViewControl.addTo(newMap);
      
      mapRef.current = newMap;
      setMap(newMap);
      
      // No agregar marcadores iniciales, se agregarán después de la búsqueda
    }

    // Clean up map instance when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Efecto para actualizar los marcadores cuando cambian los datos
  useEffect(() => {
    if (!map || !data) return;
    
    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.remove());
    
    const newMarkers: any[] = [];
    const bounds = window.L.latLngBounds();
    const leaflet = window.L;
    
    // Función para crear un icono personalizado según el tipo de entidad
    const createIcon = (tipo: string) => {
      const iconColor = tipo === 'persona' ? '#ef4444' : 
                        tipo === 'vehiculo' ? '#3b82f6' : 
                        tipo === 'inmueble' ? '#10b981' : '#6366f1';
                        
      const iconHtml = tipo === 'persona' ? '<i class="fas fa-user"></i>' : 
                       tipo === 'vehiculo' ? '<i class="fas fa-car"></i>' : 
                       tipo === 'inmueble' ? '<i class="fas fa-home"></i>' : 
                       '<i class="fas fa-map-marker-alt"></i>';
                       
      return leaflet.divIcon({
        html: `<div style="background-color: ${iconColor}; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center;">${iconHtml}</div>`,
        className: '',
        iconSize: [25, 25]
      });
    };
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      data.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          const marker = leaflet.marker([ubicacion.latitud, ubicacion.longitud], { 
            icon: createIcon('ubicacion')
          })
          .addTo(map)
          .bindPopup(`<b>${ubicacion.tipo}</b><br>${ubicacion.observaciones || 'Sin descripción'}`);
          
          newMarkers.push(marker);
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades encontradas
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      data.ubicacionesRelacionadas.forEach((relacion: any) => {
        if (relacion.ubicacion && relacion.ubicacion.latitud && relacion.ubicacion.longitud) {
          const entidad = relacion.entidadRelacionada.entidad;
          const tipo = relacion.entidadRelacionada.tipo;
          
          let title = '';
          if (tipo === 'persona') {
            title = entidad.nombre;
          } else if (tipo === 'vehiculo') {
            title = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
          } else if (tipo === 'inmueble') {
            title = `${entidad.tipo} - ${entidad.direccion}`;
          }
          
          const marker = leaflet.marker([relacion.ubicacion.latitud, relacion.ubicacion.longitud], { 
            icon: createIcon(tipo)
          })
          .addTo(map)
          .bindPopup(`<b>${title}</b><br>Ubicación: ${relacion.ubicacion.observaciones || relacion.ubicacion.tipo || 'Sin descripción'}`);
          
          newMarkers.push(marker);
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
        }
      });
    }
    
    // Si se encontraron ubicaciones, ajustar el mapa para mostrarlas todas
    if (newMarkers.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    setMarkers(newMarkers);
  }, [data, map]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
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
                
                {isLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-gray-600">Buscando ubicaciones...</span>
                  </div>
                ) : data ? (
                  <>
                    {/* Contador de resultados */}
                    {(
                      (data.ubicacionesDirectas?.length || 0) + 
                      (data.ubicacionesRelacionadas?.length || 0) +
                      (data.entidadesRelacionadas?.length || 0) === 0
                    ) ? (
                      <div className="text-center py-3 text-gray-500">
                        No se encontraron ubicaciones con los criterios especificados
                      </div>
                    ) : (
                      <div className="text-right mb-2 text-sm text-gray-500">
                        {data.ubicacionesDirectas?.length || 0} ubicaciones directas | 
                        {data.ubicacionesRelacionadas?.length || 0} ubicaciones relacionadas
                      </div>
                    )}
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {/* Ubicaciones directas */}
                      {data.ubicacionesDirectas?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Ubicaciones directas</h5>
                          <div className="space-y-2 ml-2">
                            {data.ubicacionesDirectas.map((ubicacion: any) => (
                              <div key={`ubicacion-${ubicacion.id}`} className="flex items-center border-l-2 border-indigo-500 pl-2 hover:bg-gray-100 rounded-r py-1">
                                <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
                                  <MapPin className="h-3 w-3 text-white" />
                                </div>
                                <div className="text-sm flex-grow">
                                  <div><strong>{ubicacion.tipo}</strong> {ubicacion.observaciones && `- ${ubicacion.observaciones}`}</div>
                                  <div className="text-xs text-gray-500">
                                    {ubicacion.latitud && ubicacion.longitud 
                                      ? `Lat: ${ubicacion.latitud.toFixed(6)}, Lng: ${ubicacion.longitud.toFixed(6)}`
                                      : 'Sin coordenadas'
                                    }
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Entidades relacionadas */}
                      {data.entidadesRelacionadas?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Entidades relacionadas con ubicaciones</h5>
                          <div className="space-y-2 ml-2">
                            {data.entidadesRelacionadas.map((relacion: any, index: number) => {
                              const { tipo, entidad } = relacion;
                              
                              let icon = <MapPin className="h-3 w-3 text-white" />;
                              let bgColor = 'bg-indigo-500';
                              let text = '';
                              
                              if (tipo === 'persona') {
                                icon = <User className="h-3 w-3 text-white" />;
                                bgColor = 'bg-red-500';
                                text = `${entidad.nombre} - ${entidad.identificacion}`;
                              } else if (tipo === 'vehiculo') {
                                icon = <Car className="h-3 w-3 text-white" />;
                                bgColor = 'bg-blue-500';
                                text = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
                              } else if (tipo === 'inmueble') {
                                icon = <Home className="h-3 w-3 text-white" />;
                                bgColor = 'bg-green-500';
                                text = `${entidad.tipo} - ${entidad.direccion}`;
                              }
                              
                              return (
                                <div key={`entidad-${tipo}-${entidad.id}-${index}`} className="flex items-center border-l-2 border-gray-300 pl-2 hover:bg-gray-100 rounded-r py-1">
                                  <div className={`h-6 w-6 rounded-full ${bgColor} flex items-center justify-center mr-2`}>
                                    {icon}
                                  </div>
                                  <span className="text-sm">{text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Ubicaciones relacionadas */}
                      {data.ubicacionesRelacionadas?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Ubicaciones relacionadas con entidades</h5>
                          <div className="space-y-2 ml-2">
                            {data.ubicacionesRelacionadas.map((relacion: any, index: number) => {
                              const { ubicacion, entidadRelacionada } = relacion;
                              const { tipo, entidad } = entidadRelacionada;
                              
                              let icon = <MapPin className="h-3 w-3 text-white" />;
                              let bgColor = 'bg-indigo-500';
                              let entityText = '';
                              
                              if (tipo === 'persona') {
                                icon = <User className="h-3 w-3 text-white" />;
                                bgColor = 'bg-red-500';
                                entityText = `${entidad.nombre}`;
                              } else if (tipo === 'vehiculo') {
                                icon = <Car className="h-3 w-3 text-white" />;
                                bgColor = 'bg-blue-500';
                                entityText = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
                              } else if (tipo === 'inmueble') {
                                icon = <Home className="h-3 w-3 text-white" />;
                                bgColor = 'bg-green-500';
                                entityText = `${entidad.tipo} - ${entidad.direccion}`;
                              }
                              
                              return (
                                <div key={`ubicacion-rel-${tipo}-${index}`} className="flex items-center border-l-2 border-gray-300 pl-2 hover:bg-gray-100 rounded-r py-1">
                                  <div className={`h-6 w-6 rounded-full ${bgColor} flex items-center justify-center mr-2`}>
                                    {icon}
                                  </div>
                                  <div className="text-sm flex-grow">
                                    <div>{entityText}</div>
                                    <div className="text-xs text-gray-500">
                                      {ubicacion.tipo}{ubicacion.observaciones ? `: ${ubicacion.observaciones}` : ''} 
                                      {ubicacion.latitud && ubicacion.longitud 
                                        ? ` (${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)})`
                                        : ''
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3 text-gray-500">
                    Realice una búsqueda para ver ubicaciones en el mapa
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
