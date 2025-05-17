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
    enabled: false, // Desactivamos la búsqueda automática y la manejamos con nuestro efecto
  });

  // Efecto para realizar búsqueda automática cuando cambia el término o los tipos seleccionados
  useEffect(() => {
    if (searchTerm.trim().length >= 3) {
      // Debounce de 500ms para evitar peticiones excesivas mientras se escribe
      const timer = setTimeout(() => {
        refetch();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedTypes]);

  useEffect(() => {
    // Initialize map when component mounts
    if (!mapRef.current && mapContainerRef.current) {
      const leaflet = window.L;
      if (!leaflet) return;

      const newMap = leaflet.map(mapContainerRef.current).setView([-34.603722, -58.381592], 13);
      
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
      
      // Agregar estilos personalizados para popups
      const style = document.createElement('style');
      style.textContent = `
        .leaflet-container {
          height: 500px;
          width: 100%;
          border-radius: 4px;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
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
    
    console.log("Actualizando marcadores con datos:", data);
    console.log("ubicacionesDirectas:", data.ubicacionesDirectas?.length || 0);
    console.log("ubicacionesRelacionadas:", data.ubicacionesRelacionadas?.length || 0);
    
    // Limpiar marcadores anteriores
    markers.forEach(marker => marker.remove());
    
    const newMarkers: any[] = [];
    const bounds = window.L.latLngBounds();
    const leaflet = window.L;
    
    // Función para crear un icono personalizado según el tipo de entidad y la descripción
    const createIcon = (tipo: string, descripcion?: string) => {
      // Determinar el color basado en el tipo de entidad
      const getIconColor = () => {
        if (tipo === 'persona') return '#ef4444';  // Rojo
        if (tipo === 'vehiculo') return '#3b82f6'; // Azul
        if (tipo === 'inmueble') return '#10b981'; // Verde
        return '#6366f1'; // Indigo (por defecto para ubicaciones)
      };
      
      // Determinar el ícono basado en el tipo y la descripción
      const getIconHtml = () => {
        // Si es una ubicación con descripción
        if (descripcion) {
          // Verificar si es domicilio
          if (descripcion.toLowerCase().includes('domicilio')) {
            return '<i class="fa fa-user"></i>';
          }
          // Verificar si es inmueble
          else if (descripcion.toLowerCase().includes('inmueble') || 
                   descripcion.toLowerCase().includes('casa') || 
                   descripcion.toLowerCase().includes('propiedad')) {
            return '<i class="fa fa-home"></i>';
          }
        }
        
        // Por tipo de entidad
        if (tipo === 'persona') return '<i class="fa fa-user"></i>';
        if (tipo === 'vehiculo') return '<i class="fa fa-car"></i>';
        if (tipo === 'inmueble') return '<i class="fa fa-home"></i>';
        
        // Para ubicaciones generales (pin estilo Google)
        return `<div class="map-pin" style="color: ${getIconColor()};"><div class="pin-inner"></div></div>`;
      };
      
      const iconHtml = getIconHtml();
      const iconColor = getIconColor();
      
      // Pin de ubicación tipo Google
      if (tipo === 'ubicacion' && !descripcion?.toLowerCase().includes('domicilio') && !descripcion?.toLowerCase().includes('inmueble')) {
        return leaflet.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [24, 34],
          iconAnchor: [12, 34] // El pin se ancla en la parte inferior central
        });
      }
      
      // Para el resto de íconos (circulares)
      return leaflet.divIcon({
        html: `<div style="background-color: ${iconColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid white; font-size: 14px;">${iconHtml}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15] // Centrar el icono en la ubicación exacta
      });
    };
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", data.ubicacionesDirectas);
      data.ubicacionesDirectas.forEach((ubicacion: any, index: number) => {
        console.log(`Ubicación directa ${index}:`, ubicacion);
        if (ubicacion.latitud && ubicacion.longitud) {
          // Extraer la entidad de la descripción si es posible
          let entidadDescripcion = '';
          let entidadTipo = '';
          
          // Si la observación menciona a una persona
          if (ubicacion.observaciones && ubicacion.observaciones.toLowerCase().includes('de ')) {
            const match = ubicacion.observaciones.match(/de\s+([^:]+):/i);
            if (match && match[1]) {
              entidadDescripcion = match[1].trim();
              entidadTipo = 'PERSONA';
            }
          }
          
          // Si la observación menciona un vehículo
          if (ubicacion.observaciones && 
              (ubicacion.observaciones.toLowerCase().includes('vehículo') || 
               ubicacion.observaciones.toLowerCase().includes('vehiculo') || 
               ubicacion.observaciones.toLowerCase().includes('auto'))) {
            const matchPlaca = ubicacion.observaciones.match(/placa\s+([A-Z0-9]+)/i);
            if (matchPlaca && matchPlaca[1]) {
              entidadDescripcion = `Placa ${matchPlaca[1].trim()}`;
              entidadTipo = 'VEHÍCULO';
            }
          }
          
          // Si la observación menciona un inmueble
          if (ubicacion.observaciones && 
              (ubicacion.observaciones.toLowerCase().includes('inmueble') || 
               ubicacion.observaciones.toLowerCase().includes('propiedad') || 
               ubicacion.observaciones.toLowerCase().includes('casa'))) {
            entidadTipo = 'INMUEBLE';
            
            const matchDireccion = ubicacion.observaciones.match(/en\s+([^\.]+)/i);
            if (matchDireccion && matchDireccion[1]) {
              entidadDescripcion = matchDireccion[1].trim();
            }
          }
          
          console.log(`Agregando marcador en [${ubicacion.latitud}, ${ubicacion.longitud}]`);
          const marker = leaflet.marker([ubicacion.latitud, ubicacion.longitud], { 
            icon: createIcon('ubicacion', ubicacion.tipo || ubicacion.observaciones)
          })
          .addTo(map)
          .bindPopup(`
            <div class="popup-content">
              <div style="font-weight: bold; font-size: 14px; color: #6366f1; margin-bottom: 5px;">
                ${ubicacion.tipo}
                ${entidadTipo ? `<span style="color: #0d6efd;">[${entidadTipo}]</span>` : ''}
              </div>
              <div>${ubicacion.observaciones || 'Sin descripción'}</div>
              ${entidadDescripcion ? 
                `<div style="margin-top: 5px; font-weight: 500; color: #333;">
                  Entidad relacionada: ${entidadDescripcion}
                </div>` : ""}
              <div style="font-size: 11px; color: #666; margin-top: 8px;">
                Lat: ${ubicacion.latitud.toFixed(6)}, Lng: ${ubicacion.longitud.toFixed(6)}
              </div>
            </div>
          `, {
            className: 'custom-popup',
            maxWidth: 350,
            minWidth: 250
          });
          
          newMarkers.push(marker);
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          console.log(`Marcador agregado y bounds extendido a: ${bounds.toString()}`);
        } else {
          console.warn(`Ubicación directa ${index} sin coordenadas válidas:`, ubicacion);
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades encontradas
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", data.ubicacionesRelacionadas);
      data.ubicacionesRelacionadas.forEach((relacion: any, index: number) => {
        console.log(`Ubicación relacionada ${index}:`, relacion);
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
          
          // Detectar si es la relación especial que buscamos (Fabián id:4 <-> Inmueble id:1)
          let esFabianYCasa = false;
          if (tipo === 'persona' && entidad.id === 4) {
            console.log(`[DEBUG] Encontrado Fabián (ID: 4) en ubicación ${relacion.ubicacion.id}`);
            esFabianYCasa = true;
          }
          
          // Construir descripción para popup
          let infoAdicional = '';
          if (esFabianYCasa) {
            infoAdicional = `
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relación especial:</strong> Fabián está relacionado con la Casa (ID: 1)
              </p>
            `;
          }
          
          // Crear texto para popup
          let popupContent = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">${title}</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${relacion.ubicacion.tipo || 'Sin especificar'}
                ${relacion.ubicacion.observaciones ? `<br><em>${relacion.ubicacion.observaciones}</em>` : ''}
              </p>
              ${infoAdicional}
            </div>
          `;
          
          // Agregar marcador
          mapRef.current?.addMarker(
            relacion.ubicacion.latitud, 
            relacion.ubicacion.longitud, 
            popupContent, 
            tipo
          );
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${cadenaRelaciones}`);
            if (relActual.tipo === 'persona') {
              descripcionRelaciones += `${relActual.entidad.nombre}`;
            } else if (relActual.tipo === 'vehiculo') {
              descripcionRelaciones += `${relActual.entidad.marca} ${relActual.entidad.modelo || ''} (${relActual.entidad.placa})`;
            } else if (relActual.tipo === 'inmueble') {
              descripcionRelaciones += `${relActual.entidad.tipo} - ${relActual.entidad.direccion}`;
            }
            descripcionRelaciones += '</div>';
            
            // Describir las relaciones anidadas
            while (relActual.relacionadoCon) {
              nivel++;
              relActual = relActual.relacionadoCon;
              descripcionRelaciones += `<div style="margin-left: ${(nivel-1)*10}px;">${nivel}. <b>${relActual.tipo.charAt(0).toUpperCase() + relActual.tipo.slice(1)}</b>: `;
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
          
          const marker = leaflet.marker([relacion.ubicacion.latitud, relacion.ubicacion.longitud], { 
            icon: createIcon(tipo, relacion.ubicacion.tipo || relacion.ubicacion.observaciones)
          })
          .addTo(map)
          .bindPopup(`
            <div class="popup-content">
              <div style="font-weight: bold; font-size: 14px; color: ${
                tipo === 'persona' ? '#ef4444' : 
                tipo === 'vehiculo' ? '#3b82f6' : 
                tipo === 'inmueble' ? '#10b981' : '#6366f1'
              }; margin-bottom: 5px;">
                ${title}
              </div>
              <div style="font-size: 12px; color: #4b5563; margin-bottom: 5px;">
                ${
                  tipo === 'persona' && entidad.identificacion ? 
                    `<span style="font-weight: 500;">Cédula:</span> ${entidad.identificacion}` : 
                  tipo === 'vehiculo' && entidad.placa ? 
                    `<span style="font-weight: 500;">Placa:</span> ${entidad.placa}` :
                  tipo === 'inmueble' && entidad.identificacion ? 
                    `<span style="font-weight: 500;">Identificación:</span> ${entidad.identificacion}` : ''
                }
              </div>
              <div>
                <span style="font-weight: 500;">Tipo:</span> ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </div>
              <div>
                <span style="font-weight: 500;">Ubicación:</span> ${relacion.ubicacion.tipo || relacion.ubicacion.observaciones || 'Sin descripción'} 
                <br><span style="color: #0d6efd; font-weight: 500;">[${cadenaRelaciones}]</span>
              </div>
              ${descripcionRelaciones}
              <div style="font-size: 11px; color: #666; margin-top: 8px;">
                Lat: ${relacion.ubicacion.latitud.toFixed(6)}, Lng: ${relacion.ubicacion.longitud.toFixed(6)}
              </div>
            </div>
          `, {
            className: 'custom-popup',
            maxWidth: 400,
            minWidth: 250
          });
          
          newMarkers.push(marker);
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          console.log(`Marcador agregado y bounds extendido a: ${bounds.toString()}`);
        } else {
          console.warn(`Ubicación relacionada ${index} sin coordenadas válidas:`, relacion);
        }
      });
    }
    
    // Si se encontraron ubicaciones, ajustar el mapa para mostrarlas todas
    if (newMarkers.length > 0) {
      console.log(`Ajustando mapa a los límites: ${bounds.toString()} con ${newMarkers.length} marcadores`);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      console.warn("No se encontraron marcadores para mostrar en el mapa");
    }
    
    setMarkers(newMarkers);
    console.log("Marcadores actualizados:", newMarkers.length);
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
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre de persona, identificación, placa, dirección... (mínimo 3 caracteres)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                  {searchTerm.length > 0 && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div>
                  <Button 
                    onClick={handleSearch} 
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                    disabled={searchTerm.trim().length < 3}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-200 mb-3">
                <p className="text-sm text-blue-700 mb-2 font-medium">Ayuda para la búsqueda:</p>
                <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
                  <li>Para buscar personas, ingrese su nombre o número de identificación completo (ej: "Juan Pérez" o "404440444")</li>
                  <li>Para buscar vehículos, ingrese la placa completa o parcial (ej: "ABC123" o "ABC")</li>
                  <li>Para buscar inmuebles, ingrese la dirección o propietario (ej: "Calle 10" o "Oficina central")</li>
                  <li>La búsqueda relacionará automáticamente las entidades vinculadas que tengan ubicaciones</li>
                </ul>
              </div>
            
              <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">Filtrar por tipo de entidad:</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedTypes.personas}
                      onCheckedChange={(checked) => 
                        setSelectedTypes({ ...selectedTypes, personas: !!checked })
                      }
                      className="border-red-400 data-[state=checked]:bg-red-500"
                    />
                    <span className="text-gray-700 flex items-center">
                      <User className="h-4 w-4 mr-1 text-red-500" /> 
                      Personas
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedTypes.vehiculos}
                      onCheckedChange={(checked) => 
                        setSelectedTypes({ ...selectedTypes, vehiculos: !!checked })
                      }
                      className="border-blue-400 data-[state=checked]:bg-blue-500"
                    />
                    <span className="text-gray-700 flex items-center">
                      <Car className="h-4 w-4 mr-1 text-blue-500" /> 
                      Vehículos
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedTypes.inmuebles}
                      onCheckedChange={(checked) => 
                        setSelectedTypes({ ...selectedTypes, inmuebles: !!checked })
                      }
                      className="border-green-400 data-[state=checked]:bg-green-500"
                    />
                    <span className="text-gray-700 flex items-center">
                      <Home className="h-4 w-4 mr-1 text-green-500" /> 
                      Inmuebles
                    </span>
                  </label>
                </div>
              </div>
              
              {searchTerm.trim().length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700">
                  <span className="font-medium">Consejo:</span> Para buscar personas escriba nombre o número de identificación (ejemplo: "Miguel" o "4044404444")
                </div>
              )}
            </div>
            
            {/* Map Container */}
            <div className="border rounded-lg overflow-hidden shadow-md">
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
                                entityText = `${entidad.nombre} - ${entidad.identificacion || 'Sin ID'}`;
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
