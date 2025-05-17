import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, User, Car, Home, Network, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Make sure to import Leaflet via CDN in index.html
declare global {
  interface Window {
    L: any;
    handleVerRelaciones: (tipo: string, id: number, nombre?: string) => void;
  }
}

export default function UbicacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  // Estado para entidad seleccionada y sus relaciones
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<{
    tipo: string;
    id: number;
    nombre?: string;
  } | null>(null);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [relacionLines, setRelacionLines] = useState<any[]>([]);
  
  // Crear un ref para almacenar marcadores para referencias
  const entidadMarkers = useRef<Map<string, any>>(new Map());

  // Consulta principal para buscar ubicaciones
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
      
      // Resetear entidad seleccionada cuando se hace una nueva búsqueda
      setEntidadSeleccionada(null);
      
      return data;
    },
    enabled: false,
  });
  
  // Consulta para obtener relaciones de una entidad seleccionada
  const { data: relacionesData, isLoading: isLoadingRelaciones } = useQuery({
    queryKey: ["/api/relaciones", entidadSeleccionada?.tipo, entidadSeleccionada?.id],
    queryFn: async () => {
      if (!entidadSeleccionada) return null;
      
      console.log(`[DEBUG] Consultando relaciones para ${entidadSeleccionada.tipo} con ID ${entidadSeleccionada.id}`);
      
      const response = await fetch(`/api/relaciones/${entidadSeleccionada.tipo}/${entidadSeleccionada.id}`);
      if (!response.ok) {
        throw new Error(`Error al obtener relaciones: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!entidadSeleccionada,
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
        addMarker: function(lat: number, lng: number, popupContent: string, tipo: string = '', entidadId: number = 0) {
          // Determinar el color basado en el tipo
          let iconColor = '';
          
          switch(tipo.toLowerCase()) {
            case 'persona':
              iconColor = '#ef4444'; // bg-red-500
              break;
            case 'vehiculo':
              iconColor = '#3b82f6'; // bg-blue-500
              break;
            case 'inmueble':
              iconColor = '#22c55e'; // bg-green-500
              break;
            default:
              iconColor = '#8b5cf6'; // bg-purple-500
          }
          
          // Crear marcador con icono SVG personalizado
          const svgIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${iconColor}" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              ${tipo.toLowerCase() === 'persona' ? 
                '<circle cx="12" cy="8" r="5"/><path d="M20 21v-2a7 7 0 0 0-14 0v2"/>' : 
                tipo.toLowerCase() === 'vehiculo' ? 
                '<path d="M7 17m0 1a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1z"/><path d="M14 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M6 12l-2 4h16l-2 -4"/><path d="M6 12m0 -2v2h12v-2z"/>' : 
                tipo.toLowerCase() === 'inmueble' ? 
                '<path d="M3 21h18M5 21V7l7-4 7 4v14M13 10h4M13 14h4M13 18h4" />' : 
                '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'
              }
            </svg>
          `;
          
          // Convertir SVG a Data URL
          const svgBase64 = 'data:image/svg+xml;base64,' + btoa(svgIcon);
          
          // Crear un icono personalizado
          const customIcon = leaflet.icon({
            iconUrl: svgBase64,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
          });
          
          // Crear marcador con el icono personalizado
          const marker = leaflet.marker([lat, lng], {
            icon: customIcon
          }).addTo(newMap);
          
          // Añadir popup
          marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 300
          });
          
          // Almacenar el tipo y ID de entidad en el marcador
          marker.entidadTipo = tipo;
          marker.entidadId = entidadId;
          
          // Guardar marcador para referencia
          if (entidadId > 0) {
            const key = `${tipo}-${entidadId}`;
            entidadMarkers.current.set(key, marker);
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
          entidadMarkers.current.clear();
        },
        
        // Método para limpiar solo las líneas de relación
        clearLines: function() {
          newMap.eachLayer(function(layer: any) {
            if (layer instanceof leaflet.Polyline) {
              newMap.removeLayer(layer);
            }
          });
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
    
    // Limpiar referencias de marcadores
    entidadMarkers.current.clear();
    
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
            `,
            'ubicacion',
            ubicacion.id
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
          
          // Información sobre relaciones
          let infoRelaciones = '';
          if (relacion.entidadRelacionada.relacionadoCon) {
            const relacionadoCon = relacion.entidadRelacionada.relacionadoCon;
            const tipoRelacionado = relacionadoCon.tipo;
            const nombreRelacionado = relacionadoCon.entidad.nombre || 
                                     (tipoRelacionado === 'vehiculo' ? relacionadoCon.entidad.placa : '') ||
                                     (tipoRelacionado === 'inmueble' ? relacionadoCon.entidad.direccion : '') ||
                                     `ID: ${relacionadoCon.entidad.id}`;
            
            infoRelaciones = `
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relacionado con:</strong> ${nombreRelacionado} (${tipoRelacionado})
              </p>
            `;
          }
          
          // Botón para ver relaciones
          const botonRelaciones = `
            <div style="margin-top: 10px; text-align: center;">
              <button onclick="window.handleVerRelaciones('${tipo}', ${entidad.id}, '${encodeURIComponent(title)}')" 
                style="padding: 4px 8px; font-size: 12px; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; color: #0369a1;">
                Ver relaciones
              </button>
            </div>
          `;
          
          // Crear el popup con toda la información
          const popupContent = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">${title}</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${relacion.ubicacion.tipo || 'Sin especificar'}
                ${relacion.ubicacion.observaciones ? `<br><em>${relacion.ubicacion.observaciones}</em>` : ''}
              </p>
              ${infoRelaciones}
              ${botonRelaciones}
            </div>
          `;
          
          const marker = mapRef.current.addMarker(
            relacion.ubicacion.latitud, 
            relacion.ubicacion.longitud, 
            popupContent,
            tipo,
            entidad.id
          );
          
          marker.entidadId = entidad.id;
          marker.entidadTipo = tipo;
          
          newMarkers.push(marker);
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // Ajustar vista del mapa según los marcadores
    if (hasBounds && bounds && bounds.isValid && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Actualizar el estado de los marcadores
    setMarkers(newMarkers);
    
    // Limpiar líneas de relación cuando cambian los datos de búsqueda
    mapRef.current.clearLines();
    setRelacionLines([]);
    
  }, [map, data]);
  
  // Efecto para dibujar líneas de relación cuando se selecciona una entidad
  useEffect(() => {
    if (!map || !mapRef.current || !relacionesData || !entidadSeleccionada) return;
    
    // Limpiar líneas de relación anteriores
    mapRef.current.clearLines();
    
    const newLines: any[] = [];
    const entidadKey = `${entidadSeleccionada.tipo}-${entidadSeleccionada.id}`;
    const entidadMarker = entidadMarkers.current.get(entidadKey);
    
    if (!entidadMarker || !entidadMarker._latlng) {
      console.log("No se encontró marcador para la entidad seleccionada:", entidadKey);
      return;
    }
    
    const entidadLatLng = [entidadMarker._latlng.lat, entidadMarker._latlng.lng];
    
    // Dibujar líneas para personas relacionadas
    if (relacionesData.personas && relacionesData.personas.length > 0) {
      relacionesData.personas.forEach((persona: any) => {
        const personaKey = `persona-${persona.id}`;
        const personaMarker = entidadMarkers.current.get(personaKey);
        
        if (personaMarker && personaMarker._latlng) {
          const personaLatLng = [personaMarker._latlng.lat, personaMarker._latlng.lng];
          
          const line = mapRef.current.addLine(
            entidadLatLng,
            personaLatLng,
            '#ef4444', // Rojo para personas
            `Relación: ${entidadSeleccionada.nombre} → ${persona.nombre}`
          );
          
          newLines.push(line);
        }
      });
    }
    
    // Dibujar líneas para vehículos relacionados
    if (relacionesData.vehiculos && relacionesData.vehiculos.length > 0) {
      relacionesData.vehiculos.forEach((vehiculo: any) => {
        const vehiculoKey = `vehiculo-${vehiculo.id}`;
        const vehiculoMarker = entidadMarkers.current.get(vehiculoKey);
        
        if (vehiculoMarker && vehiculoMarker._latlng) {
          const vehiculoLatLng = [vehiculoMarker._latlng.lat, vehiculoMarker._latlng.lng];
          
          const line = mapRef.current.addLine(
            entidadLatLng,
            vehiculoLatLng,
            '#3b82f6', // Azul para vehículos
            `Relación: ${entidadSeleccionada.nombre} → ${vehiculo.marca} ${vehiculo.placa}`
          );
          
          newLines.push(line);
        }
      });
    }
    
    // Dibujar líneas para inmuebles relacionados
    if (relacionesData.inmuebles && relacionesData.inmuebles.length > 0) {
      relacionesData.inmuebles.forEach((inmueble: any) => {
        const inmuebleKey = `inmueble-${inmueble.id}`;
        const inmuebleMarker = entidadMarkers.current.get(inmuebleKey);
        
        if (inmuebleMarker && inmuebleMarker._latlng) {
          const inmuebleLatLng = [inmuebleMarker._latlng.lat, inmuebleMarker._latlng.lng];
          
          const line = mapRef.current.addLine(
            entidadLatLng,
            inmuebleLatLng,
            '#22c55e', // Verde para inmuebles
            `Relación: ${entidadSeleccionada.nombre} → ${inmueble.tipo} ${inmueble.direccion}`
          );
          
          newLines.push(line);
        }
      });
    }
    
    // Dibujar líneas para ubicaciones relacionadas
    if (relacionesData.ubicaciones && relacionesData.ubicaciones.length > 0) {
      relacionesData.ubicaciones.forEach((ubicacion: any) => {
        const ubicacionKey = `ubicacion-${ubicacion.id}`;
        const ubicacionMarker = entidadMarkers.current.get(ubicacionKey);
        
        if (ubicacionMarker && ubicacionMarker._latlng) {
          const ubicacionLatLng = [ubicacionMarker._latlng.lat, ubicacionMarker._latlng.lng];
          
          const line = mapRef.current.addLine(
            entidadLatLng,
            ubicacionLatLng,
            '#8b5cf6', // Púrpura para ubicaciones
            `Relación: ${entidadSeleccionada.nombre} → Ubicación ${ubicacion.tipo}`
          );
          
          newLines.push(line);
        }
      });
    }
    
    // Actualizar el estado de las líneas
    setRelacionLines(newLines);
    
  }, [map, relacionesData, entidadSeleccionada]);

  // Funciones de manejo de eventos
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
  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }));
  };
  
  // Función para manejar la visualización de relaciones
  const handleVerRelaciones = (tipo: string, id: number, nombre?: string) => {
    console.log(`[DEBUG] Ver relaciones para ${tipo} con ID ${id}`);
    
    // Si el nombre viene codificado, decodificarlo
    const nombreDecoded = nombre ? decodeURIComponent(nombre) : undefined;
    
    // Si es la misma entidad, deseleccionarla
    if (entidadSeleccionada && entidadSeleccionada.tipo === tipo && entidadSeleccionada.id === id) {
      setEntidadSeleccionada(null);
      return;
    }
    
    // Actualizar el estado de la entidad seleccionada
    setEntidadSeleccionada({
      tipo,
      id,
      nombre: nombreDecoded || `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ID: ${id}`
    });
  };
  
  // Exponer la función handleVerRelaciones al objeto window para que sea accesible desde los popups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.handleVerRelaciones = handleVerRelaciones;
    }
    
    return () => {
      // Limpiar al desmontar el componente
      if (typeof window !== 'undefined') {
        window.handleVerRelaciones = () => {};
      }
    };
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
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
                    placeholder="Buscar por nombre, identificación, placa, tipo de inmueble, etc."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div>
                  <Button onClick={handleSearch} className="w-full md:w-auto">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-personas"
                    checked={selectedTypes.personas}
                    onCheckedChange={() => handleTypeChange('personas')}
                  />
                  <label
                    htmlFor="filter-personas"
                    className="text-sm font-medium flex items-center"
                  >
                    <User className="h-4 w-4 mr-1 text-red-600" />
                    Personas
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-vehiculos"
                    checked={selectedTypes.vehiculos}
                    onCheckedChange={() => handleTypeChange('vehiculos')}
                  />
                  <label
                    htmlFor="filter-vehiculos"
                    className="text-sm font-medium flex items-center"
                  >
                    <Car className="h-4 w-4 mr-1 text-blue-600" />
                    Vehículos
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-inmuebles"
                    checked={selectedTypes.inmuebles}
                    onCheckedChange={() => handleTypeChange('inmuebles')}
                  />
                  <label
                    htmlFor="filter-inmuebles"
                    className="text-sm font-medium flex items-center"
                  >
                    <Home className="h-4 w-4 mr-1 text-green-600" />
                    Inmuebles
                  </label>
                </div>
              </div>
            </div>
            
            {entidadSeleccionada && (
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Network className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Visualizando relaciones para: 
                      <span className="ml-1 font-bold">{entidadSeleccionada.nombre}</span>
                    </span>
                  </div>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => setEntidadSeleccionada(null)}
                  >
                    <span className="mr-1 text-lg">×</span> Cerrar
                  </button>
                </div>
                {isLoadingRelaciones && (
                  <div className="flex items-center mt-2 text-sm text-blue-600">
                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    Cargando relaciones...
                  </div>
                )}
              </div>
            )}
            
            <div className="mb-6 border rounded-lg overflow-hidden">
              <div 
                ref={mapContainerRef}
                className="h-[500px] w-full"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Ubicaciones encontradas</h3>
            
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
                      {data.ubicacionesRelacionadas?.length || 0} ubicaciones relacionadas |
                      {data.entidadesRelacionadas?.length || 0} entidades relacionadas
                    </div>
                  )}
                  
                  <Tabs defaultValue="todas" className="mb-4">
                    <TabsList>
                      <TabsTrigger value="todas">Todas las ubicaciones</TabsTrigger>
                      {entidadSeleccionada && relacionesData && (
                        <TabsTrigger value="relaciones">
                          Relaciones de {entidadSeleccionada.nombre}
                          <Badge variant="outline" className="ml-2 bg-blue-100">
                            {
                              (relacionesData.personas?.length || 0) +
                              (relacionesData.vehiculos?.length || 0) +
                              (relacionesData.inmuebles?.length || 0) +
                              (relacionesData.ubicaciones?.length || 0)
                            }
                          </Badge>
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="todas">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Ubicaciones directas */}
                        {data.ubicacionesDirectas?.length > 0 && (
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Ubicaciones directas</h5>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
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
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Ubicaciones relacionadas con entidades</h5>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                              {data.ubicacionesRelacionadas.map((relacion: any, index: number) => (
                                <div key={`rel-${index}`} className={`flex items-center p-2 bg-white rounded border ${
                                  entidadSeleccionada && 
                                  relacion.entidadRelacionada.tipo === entidadSeleccionada.tipo && 
                                  relacion.entidadRelacionada.entidad.id === entidadSeleccionada.id 
                                    ? 'border-blue-400 bg-blue-50' 
                                    : 'border-gray-200'
                                } shadow-sm`}>
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
                                    <div className="flex justify-between">
                                      <div>
                                        <strong>{relacion.ubicacion.tipo}</strong> {relacion.ubicacion.observaciones && `- ${relacion.ubicacion.observaciones}`}
                                      </div>
                                      <button 
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                        onClick={() => handleVerRelaciones(
                                          relacion.entidadRelacionada.tipo, 
                                          relacion.entidadRelacionada.entidad.id,
                                          relacion.entidadRelacionada.tipo === 'persona' ? 
                                            relacion.entidadRelacionada.entidad.nombre : 
                                            relacion.entidadRelacionada.tipo === 'vehiculo' ? 
                                            `${relacion.entidadRelacionada.entidad.marca} (${relacion.entidadRelacionada.entidad.placa})` : 
                                            relacion.entidadRelacionada.tipo === 'inmueble' ? 
                                            `${relacion.entidadRelacionada.entidad.tipo} - ${relacion.entidadRelacionada.entidad.direccion}` : 
                                            'Entidad'
                                        )}
                                      >
                                        {entidadSeleccionada && 
                                         relacion.entidadRelacionada.tipo === entidadSeleccionada.tipo && 
                                         relacion.entidadRelacionada.entidad.id === entidadSeleccionada.id 
                                          ? 'Ocultar relaciones' 
                                          : 'Ver relaciones'
                                        }
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      <span className="font-semibold">{relacion.entidadRelacionada.tipo === 'persona' ? 
                                        relacion.entidadRelacionada.entidad.nombre : 
                                        relacion.entidadRelacionada.tipo === 'vehiculo' ? 
                                        `${relacion.entidadRelacionada.entidad.marca} (${relacion.entidadRelacionada.entidad.placa})` : 
                                        relacion.entidadRelacionada.tipo === 'inmueble' ? 
                                        `${relacion.entidadRelacionada.entidad.tipo} - ${relacion.entidadRelacionada.entidad.direccion || 'Sin dirección'}` : 
                                        'Entidad desconocida'}</span>
                                      
                                      {relacion.entidadRelacionada.relacionadoCon && (
                                        <span className="ml-1 text-blue-600">
                                          → {relacion.entidadRelacionada.relacionadoCon.tipo}: {
                                            relacion.entidadRelacionada.relacionadoCon.entidad.nombre ||
                                            (relacion.entidadRelacionada.relacionadoCon.tipo === 'vehiculo' ? 
                                              relacion.entidadRelacionada.relacionadoCon.entidad.placa : 
                                              relacion.entidadRelacionada.relacionadoCon.tipo === 'inmueble' ?
                                              relacion.entidadRelacionada.relacionadoCon.entidad.direccion : '')
                                          }
                                        </span>
                                      )}
                                      
                                      <br/>
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
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Entidades relacionadas</h5>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                              {data.entidadesRelacionadas.map((entidad: any, index: number) => (
                                <div key={`ent-${index}`} className={`flex items-center p-2 bg-white rounded border ${
                                  entidadSeleccionada && 
                                  entidadSeleccionada.tipo === entidad.tipo && 
                                  entidadSeleccionada.id === entidad.id 
                                    ? 'border-blue-400 bg-blue-50' 
                                    : 'border-gray-200'
                                } shadow-sm`}>
                                  <div className={`
                                    ${entidad.tipo === 'persona' ? 'bg-red-500' : 
                                      entidad.tipo === 'vehiculo' ? 'bg-blue-500' : 
                                      entidad.tipo === 'inmueble' ? 'bg-green-500' : 'bg-purple-500'} 
                                    rounded-full p-1 mr-2
                                  `}>
                                    {entidad.tipo === 'persona' ? <User className="h-3 w-3 text-white" /> :
                                     entidad.tipo === 'vehiculo' ? <Car className="h-3 w-3 text-white" /> :
                                     entidad.tipo === 'inmueble' ? <Home className="h-3 w-3 text-white" /> :
                                     <MapPin className="h-3 w-3 text-white" />}
                                  </div>
                                  <div className="text-sm flex-grow">
                                    <div className="font-medium flex justify-between">
                                      <div>
                                        {entidad.tipo === 'persona' ? 
                                          entidad.nombre : 
                                          entidad.tipo === 'vehiculo' ? 
                                          `${entidad.marca} (${entidad.placa})` : 
                                          entidad.tipo === 'inmueble' ? 
                                          `${entidad.tipo} - ${entidad.direccion || 'Sin dirección'}` : 
                                          'Entidad desconocida'}
                                      </div>
                                      <button 
                                        className="text-xs text-blue-600 hover:text-blue-800 ml-2 flex items-center"
                                        onClick={() => handleVerRelaciones(
                                          entidad.tipo, 
                                          entidad.id, 
                                          entidad.tipo === 'persona' ? 
                                            entidad.nombre : 
                                            entidad.tipo === 'vehiculo' ? 
                                            `${entidad.marca} (${entidad.placa})` : 
                                            entidad.tipo === 'inmueble' ? 
                                            `${entidad.tipo} - ${entidad.direccion}` : 
                                            'Entidad'
                                        )}
                                      >
                                        {entidadSeleccionada && 
                                         entidadSeleccionada.tipo === entidad.tipo && 
                                         entidadSeleccionada.id === entidad.id 
                                          ? 'Ocultar relaciones' 
                                          : 'Ver relaciones'
                                        }
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {entidad.tipo === 'persona' ? 
                                        `Identificación: ${entidad.identificacion || 'N/A'}` : 
                                        entidad.tipo === 'vehiculo' ? 
                                        `${entidad.modelo || ''} - ${entidad.color || 'Sin color'}` : 
                                        entidad.tipo === 'inmueble' ? 
                                        `${entidad.propietario || 'Sin propietario'}` : 
                                        ''}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    {entidadSeleccionada && relacionesData && (
                      <TabsContent value="relaciones">
                        <div className="border rounded-md p-4 mb-4 bg-white">
                          <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                            <Network className="h-4 w-4 mr-2 text-blue-600" />
                            Relaciones de {entidadSeleccionada.nombre}
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Personas relacionadas */}
                            {relacionesData.personas?.length > 0 && (
                              <div className="border rounded-md p-3">
                                <h6 className="text-sm font-medium mb-2 flex items-center">
                                  <User className="h-3 w-3 mr-1 text-red-600" />
                                  Personas ({relacionesData.personas.length})
                                </h6>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                  {relacionesData.personas.map((persona: any) => (
                                    <div key={`persona-${persona.id}`} className="text-xs p-2 border rounded-sm">
                                      <div className="font-medium">{persona.nombre}</div>
                                      <div className="text-gray-500">ID: {persona.identificacion || 'N/A'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Vehículos relacionados */}
                            {relacionesData.vehiculos?.length > 0 && (
                              <div className="border rounded-md p-3">
                                <h6 className="text-sm font-medium mb-2 flex items-center">
                                  <Car className="h-3 w-3 mr-1 text-blue-600" />
                                  Vehículos ({relacionesData.vehiculos.length})
                                </h6>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                  {relacionesData.vehiculos.map((vehiculo: any) => (
                                    <div key={`vehiculo-${vehiculo.id}`} className="text-xs p-2 border rounded-sm">
                                      <div className="font-medium">{vehiculo.marca} {vehiculo.modelo}</div>
                                      <div className="text-gray-500">Placa: {vehiculo.placa}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Inmuebles relacionados */}
                            {relacionesData.inmuebles?.length > 0 && (
                              <div className="border rounded-md p-3">
                                <h6 className="text-sm font-medium mb-2 flex items-center">
                                  <Home className="h-3 w-3 mr-1 text-green-600" />
                                  Inmuebles ({relacionesData.inmuebles.length})
                                </h6>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                  {relacionesData.inmuebles.map((inmueble: any) => (
                                    <div key={`inmueble-${inmueble.id}`} className="text-xs p-2 border rounded-sm">
                                      <div className="font-medium">{inmueble.tipo}</div>
                                      <div className="text-gray-500">{inmueble.direccion}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Ubicaciones relacionadas */}
                            {relacionesData.ubicaciones?.length > 0 && (
                              <div className="border rounded-md p-3">
                                <h6 className="text-sm font-medium mb-2 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-purple-600" />
                                  Ubicaciones ({relacionesData.ubicaciones.length})
                                </h6>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                  {relacionesData.ubicaciones.map((ubicacion: any) => (
                                    <div key={`ubicacion-${ubicacion.id}`} className="text-xs p-2 border rounded-sm">
                                      <div className="font-medium">{ubicacion.tipo}</div>
                                      <div className="text-gray-500">{ubicacion.observaciones || 'Sin observaciones'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </>
              ) : error ? (
                <div className="text-center py-3 text-red-500 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Error al buscar ubicaciones: {error.message}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500">
                  Ingresa un término de búsqueda y haz clic en "Buscar" para ver ubicaciones
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}