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
  
  // Crear un ref para almacenar marcadores de inmuebles para relaciones especiales
  const inmuebleMarkers = useRef<Map<number, any>>(new Map());
  const personaMarkers = useRef<Map<number, any>>(new Map());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ubicaciones", searchTerm, selectedTypes],
    queryFn: async () => {
      console.log("[DEBUG] Iniciando búsqueda de ubicaciones"); 
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
    enabled: false,
  });

  useEffect(() => {
    // Inicializar el mapa si aún no existe
    if (!map && mapContainerRef.current) {
      const leaflet = window.L;
      
      if (!leaflet) {
        console.error("Leaflet no está disponible");
        return;
      }
      
      const newMap = leaflet.map(mapContainerRef.current).setView([-34.603722, -58.381592], 13);
      
      // Inicializar el objeto mapRef que contiene métodos útiles
      mapRef.current = {
        map: newMap,
        
        // Método para añadir un marcador al mapa
        addMarker: function(lat: number, lng: number, popupContent: string, tipo: string = '', forceNew: boolean = false) {
          // Determinar el icono basado en el tipo
          let iconUrl = '';
          let iconSize = [25, 41];
          
          switch(tipo) {
            case 'persona':
              iconUrl = '/images/persona-marker.png';
              break;
            case 'vehiculo':
              iconUrl = '/images/vehiculo-marker.png';
              break;
            case 'inmueble':
              iconUrl = '/images/inmueble-marker.png'; 
              break;
            default:
              iconUrl = '/images/ubicacion-marker.png';
          }
          
          // Crear icono personalizado
          const icon = leaflet.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1]],
            popupAnchor: [0, -iconSize[1]]
          });
          
          // Crear el marcador
          const marker = leaflet.marker([lat, lng], { icon }).addTo(newMap);
          
          // Añadir popup
          marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 300
          });
          
          // Almacenar el tipo de entidad en el marcador para uso futuro
          marker.entidadTipo = tipo;
          
          // Guardar marcadores especiales para referencias posteriores
          if (tipo === 'inmueble' && marker.entidadId === 1) {
            inmuebleMarkers.current.set(1, marker);
          }
          if (tipo === 'persona' && marker.entidadId === 4) {
            personaMarkers.current.set(4, marker);
          }
          
          return marker;
        },
        
        // Método para añadir una línea entre dos puntos
        addLine: function(from: [number, number], to: [number, number], color: string = '#3388ff', popupContent: string = '') {
          const polyline = leaflet.polyline([from, to], { 
            color: color,
            weight: 3,
            opacity: 0.7
          }).addTo(newMap);
          
          if (popupContent) {
            polyline.bindPopup(popupContent);
          }
          
          return polyline;
        },
        
        // Método para limpiar el mapa
        clear: function() {
          newMap.eachLayer(function(layer: any) {
            if (layer instanceof leaflet.Marker || layer instanceof leaflet.Polyline) {
              newMap.removeLayer(layer);
            }
          });
          inmuebleMarkers.current.clear();
          personaMarkers.current.clear();
        }
      };
      
      // Añadir capa de mapa base (OpenStreetMap)
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
      
      // Añadir estilos personalizados para los popups
      const style = document.createElement('style');
      style.textContent = `
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          color: #333;
          border-radius: 8px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.2);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px;
          line-height: 1.5;
        }
        .popup-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `;
      document.head.appendChild(style);
      
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
      
      // Guardar la instancia del mapa en el estado
      setMap(newMap);
    }
    
    // Limpiar al desmontar el componente
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  // Efecto para actualizar los marcadores cuando cambian los datos
  useEffect(() => {
    if (!map || !mapRef.current || !data) return;

    // Limpiar marcadores existentes
    mapRef.current.clear();
    
    // Crear nuevos marcadores
    const newMarkers: any[] = [];
    const bounds = window.L.latLngBounds();
    let hasBounds = false;
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", data.ubicacionesDirectas);
      data.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          const marker = mapRef.current.addMarker(
            ubicacion.latitud, 
            ubicacion.longitud, 
            `
              <div style="max-width: 250px;">
                <h4 style="margin: 0; font-size: 14px;">Ubicación Directa</h4>
                <p style="margin: 5px 0; font-size: 12px;">
                  <strong>${ubicacion.tipo || 'Sin tipo'}</strong><br>
                  ${ubicacion.observaciones ? `<em>${ubicacion.observaciones}</em>` : 'Sin observaciones'}
                </p>
                <p style="margin: 2px 0; font-size: 10px; color: #666;">
                  Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}
                </p>
              </div>
            `
          );
          
          marker.entidadId = ubicacion.id;
          newMarkers.push(marker);
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades encontradas
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", data.ubicacionesRelacionadas);
      data.ubicacionesRelacionadas.forEach((relacion: any, index: number) => {
        if (relacion.ubicacion && relacion.ubicacion.latitud && relacion.ubicacion.longitud) {
          const entidad = relacion.entidadRelacionada.entidad;
          const tipo = relacion.entidadRelacionada.tipo;
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${tipo}`);
          
          let title = '';
          if (tipo === 'persona') {
            title = `${entidad.nombre}${entidad.identificacion ? ` - ${entidad.identificacion}` : ''}`;
          } else if (tipo === 'vehiculo') {
            title = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
          } else if (tipo === 'inmueble') {
            title = `${entidad.tipo} - ${entidad.direccion}`;
          }
          
          // Construir cadena de relaciones para descripción
          let cadenaRelaciones = `${tipo.toUpperCase()}`;
          let relAux = relacion.entidadRelacionada;
          
          while (relAux && relAux.relacionadoCon) {
            cadenaRelaciones += ` → ${relAux.relacionadoCon.tipo.toUpperCase()}`;
            relAux = relAux.relacionadoCon;
          }
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${cadenaRelaciones}`);
          
          // Verificar si es la relación especial (Fabián y Casa)
          let infoEspecial = '';
          const esFabianYCasa = (tipo === 'persona' && entidad.id === 4) || 
                              (tipo === 'inmueble' && entidad.id === 1);
                              
          if (esFabianYCasa) {
            console.log(`[DEBUG] Detectada relación especial: ${tipo} ID: ${entidad.id}`);
            infoEspecial = `
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relación especial:</strong> ${tipo === 'persona' ? 'Fabián está relacionado con Casa (ID: 1)' : 'Casa está relacionada con Fabián (ID: 4)'}
              </p>
            `;
            
            // Guardar referencias para crear líneas especiales después
            if (tipo === 'persona' && entidad.id === 4) {
              personaMarkers.current.set(4, {
                latLng: [relacion.ubicacion.latitud, relacion.ubicacion.longitud],
                entidad: entidad
              });
            } else if (tipo === 'inmueble' && entidad.id === 1) {
              inmuebleMarkers.current.set(1, {
                latLng: [relacion.ubicacion.latitud, relacion.ubicacion.longitud],
                entidad: entidad
              });
            }
          }
          
          // Crear descripción detallada de la cadena de relaciones
          let descripcionRelaciones = '';
          if (relacion.entidadRelacionada.relacionadoCon) {
            descripcionRelaciones = '<div style="margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">';
            descripcionRelaciones += '<span style="font-weight: 500;">Cadena de relaciones:</span><br>';
            
            let relActual = relacion.entidadRelacionada;
            let nivel = 1;
            
            descripcionRelaciones += `<div style="margin-left: ${nivel * 5}px;">✓ ${relActual.tipo.toUpperCase()}: `;
            
            if (relActual.tipo === 'persona') {
              descripcionRelaciones += `${relActual.entidad.nombre}`;
            } else if (relActual.tipo === 'vehiculo') {
              descripcionRelaciones += `${relActual.entidad.marca} ${relActual.entidad.modelo || ''} (${relActual.entidad.placa})`;
            } else if (relActual.tipo === 'inmueble') {
              descripcionRelaciones += `${relActual.entidad.tipo} - ${relActual.entidad.direccion}`;
            }
            descripcionRelaciones += '</div>';
            
            while (relActual.relacionadoCon) {
              nivel++;
              relActual = relActual.relacionadoCon;
              
              descripcionRelaciones += `<div style="margin-left: ${nivel * 5}px;">→ ${relActual.tipo.toUpperCase()}: `;
              
              if (relActual.tipo === 'persona') {
                descripcionRelaciones += `${relActual.entidad.nombre}`;
              } else if (relActual.tipo === 'vehiculo') {
                descripcionRelaciones += `${relActual.entidad.marca} ${relActual.entidad.modelo || ''} (${relActual.entidad.placa})`;
              } else if (relActual.tipo === 'inmueble') {
                descripcionRelaciones += `${relActual.entidad.tipo} - ${relActual.entidad.direccion}`;
              }
              
              descripcionRelaciones += '</div>';
            }
            
            descripcionRelaciones += '</div>';
          }
          
          // Crear el popup con toda la información
          const popupContent = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">${title}</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${relacion.ubicacion.tipo || 'Sin especificar'}
                ${relacion.ubicacion.observaciones ? `<br><em>${relacion.ubicacion.observaciones}</em>` : ''}
              </p>
              ${infoEspecial}
              ${descripcionRelaciones}
            </div>
          `;
          
          const marker = mapRef.current.addMarker(
            relacion.ubicacion.latitud, 
            relacion.ubicacion.longitud, 
            popupContent,
            tipo
          );
          
          marker.entidadId = entidad.id;
          marker.entidadTipo = tipo;
          
          newMarkers.push(marker);
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          hasBounds = true;
        } else {
          console.warn(`Ubicación relacionada ${index} sin coordenadas válidas:`, relacion);
        }
      });
    }
    
    // 3. Crear línea especial entre Fabián y la Casa si ambos están en el mapa
    if (personaMarkers.current.has(4) && inmuebleMarkers.current.has(1)) {
      const fabianData = personaMarkers.current.get(4);
      const casaData = inmuebleMarkers.current.get(1);
      
      if (fabianData && casaData && fabianData.latLng && casaData.latLng) {
        console.log("[DEBUG] Creando línea especial entre Fabián y Casa");
        
        mapRef.current.addLine(
          fabianData.latLng,
          casaData.latLng,
          "#FF5733", // Color naranja especial
          "Relación directa: Fabián → Casa"
        );
      }
    }
    
    // Ajustar vista del mapa según los marcadores
    if (hasBounds && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Actualizar estado
    setMarkers(newMarkers);
  }, [map, data]);

  // Manejar cambio en el término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Manejar clic en botón de búsqueda o Enter en el input
  const handleSearch = () => {
    if (searchTerm.trim() || Object.values(selectedTypes).some(v => v)) {
      refetch();
    }
  };

  // Manejar tecla Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Manejar cambio en los tipos seleccionados
  const handleTypeChange = (type: keyof typeof selectedTypes) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">Ubicaciones</CardTitle>
          </CardHeader>
          
          <CardContent className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
            {/* Panel lateral izquierdo: Búsqueda, filtros y resultados */}
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Buscar ubicaciones</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Nombre, identidad o descripción" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Ingrese texto para buscar ubicaciones
                </div>
              </div>
              
              {/* Filtros de tipo */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Filtrar por tipo</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="personas" 
                      checked={selectedTypes.personas}
                      onCheckedChange={() => handleTypeChange('personas')}
                    />
                    <label htmlFor="personas" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Personas
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vehiculos" 
                      checked={selectedTypes.vehiculos}
                      onCheckedChange={() => handleTypeChange('vehiculos')}
                    />
                    <label htmlFor="vehiculos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Vehículos
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inmuebles" 
                      checked={selectedTypes.inmuebles}
                      onCheckedChange={() => handleTypeChange('inmuebles')}
                    />
                    <label htmlFor="inmuebles" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Inmuebles
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Leyenda del mapa */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Leyenda</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                    <span className="text-xs text-gray-600">Personas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-500 w-3 h-3 rounded-full"></div>
                    <span className="text-xs text-gray-600">Vehículos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    <span className="text-xs text-gray-600">Inmuebles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-purple-500 w-3 h-3 rounded-full"></div>
                    <span className="text-xs text-gray-600">Ubicaciones sin entidad</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-0.5 w-10 bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Relación normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-0.5 w-10 bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Relación destacada</span>
                  </div>
                </div>
              </div>
              
              {/* Resultados */}
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
                              <div key={ubicacion.id} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                                <div className="bg-purple-500 rounded-full p-1 mr-2">
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
                      
                      {/* Ubicaciones relacionadas */}
                      {data.ubicacionesRelacionadas?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Ubicaciones relacionadas con entidades</h5>
                          <div className="space-y-2 ml-2">
                            {data.ubicacionesRelacionadas.map((relacion: any, index: number) => (
                              <div key={`rel-${index}`} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                                <div className={`
                                  ${relacion.entidadRelacionada.tipo === 'persona' ? 'bg-red-500' : 
                                    relacion.entidadRelacionada.tipo === 'vehiculo' ? 'bg-blue-500' : 
                                    relacion.entidadRelacionada.tipo === 'inmueble' ? 'bg-green-500' : 'bg-purple-500'} 
                                  rounded-full p-1 mr-2
                                `}>
                                  {relacion.entidadRelacionada.tipo === 'persona' ? <User className="h-3 w-3 text-white" /> :
                                   relacion.entidadRelacionada.tipo === 'vehiculo' ? <Car className="h-3 w-3 text-white" /> :
                                   relacion.entidadRelacionada.tipo === 'inmueble' ? <Home className="h-3 w-3 text-white" /> :
                                   <MapPin className="h-3 w-3 text-white" />}
                                </div>
                                <div className="text-sm flex-grow">
                                  <div><strong>{relacion.ubicacion.tipo}</strong> {relacion.ubicacion.observaciones && `- ${relacion.ubicacion.observaciones}`}</div>
                                  <div className="text-xs text-gray-500">
                                    {relacion.ubicacion.latitud && relacion.ubicacion.longitud 
                                      ? `Lat: ${relacion.ubicacion.latitud.toFixed(6)}, Lng: ${relacion.ubicacion.longitud.toFixed(6)}`
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
                                text = `${entidad.nombre} - ${entidad.identificacion || 'Sin ID'}`;
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
                                <div key={`ent-${index}`} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                                  <div className={`${bgColor} rounded-full p-1 mr-2`}>
                                    {icon}
                                  </div>
                                  <div className="text-sm flex-grow">
                                    <div>{text}</div>
                                    <div className="text-xs text-gray-500">
                                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
                    Ingrese un término de búsqueda y haga clic en buscar
                  </div>
                )}
              </div>
            </div>
            
            {/* Panel central: Mapa */}
            <div className="flex flex-col space-y-4">
              {/* Contenedor del mapa */}
              <div 
                ref={mapContainerRef} 
                className="border border-gray-300 rounded-md h-[600px] w-full bg-gray-100"
              >
                {/* Map will be initialized here */}
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Instrucciones</h4>
                <ul className="space-y-1 text-sm text-gray-600 list-disc pl-5">
                  <li>Use la búsqueda para encontrar ubicaciones por nombre o descripción</li>
                  <li>Filtre los resultados según el tipo de entidad relacionada</li>
                  <li>Haga clic en los marcadores para ver más información</li>
                  <li>Las líneas naranja indican relaciones destacadas</li>
                  <li>Puede mover el mapa y hacer zoom con el ratón</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}