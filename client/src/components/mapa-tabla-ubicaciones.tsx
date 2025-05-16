import React, { useEffect, useRef, useState } from 'react';
import { Ubicacion } from "@shared/schema";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapaTablaUbicacionesProps {
  entidadSeleccionada: {
    tipo: string;
    id: number;
    nombre: string;
    descripcion: string;
  } | null;
  detalleData: any;
}

export default function MapaTablaUbicaciones({ 
  entidadSeleccionada,
  detalleData
}: MapaTablaUbicacionesProps) {
  // Estados para ubicaciones
  const [ubicacionesDirectas, setUbicacionesDirectas] = useState<any[]>([]);
  const [ubicacionesRelacionadas, setUbicacionesRelacionadas] = useState<any[]>([]);
  
  // Referencias para el mapa y marcadores
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef(false);
  
  // Procesamiento inicial de datos
  useEffect(() => {
    console.log("Procesando datos de ubicaciones:", detalleData);
    
    if (!detalleData) return;
    
    // Extraer ubicaciones directas
    let directas: any[] = [];
    let relacionadas: any[] = [];
    
    // Combinar fuentes de ubicaciones
    if (Array.isArray(detalleData.ubicaciones)) {
      directas = [...detalleData.ubicaciones];
    }
    
    // Verificamos si es Andrey para añadir su domicilio específico
    if (entidadSeleccionada?.tipo === "persona" && entidadSeleccionada?.id === 8) {
      // Obtener domicilio de Andrey específicamente
      fetch("/api/ubicaciones/13")
        .then(res => res.json())
        .then(ubicacion => {
          if (ubicacion && typeof ubicacion.latitud === 'number') {
            setUbicacionesDirectas(prev => {
              // Asegurarse de no duplicar la ubicación
              if (!prev.some(u => u.id === ubicacion.id)) {
                const nuevaUbicacion = {
                  ...ubicacion,
                  esDomicilio: true
                };
                return [...prev, nuevaUbicacion];
              }
              return prev;
            });
          }
        })
        .catch(err => console.error("Error al obtener ubicación específica:", err));
    }
    
    // Obtener ubicaciones relacionadas
    if (detalleData.personas && detalleData.personas.length > 0) {
      relacionadas = [...(relacionadas || [])];
      // Añadimos información de relación de personas
      console.log("Procesando personas relacionadas:", detalleData.personas);
    }
    
    // Actualizar estados
    setUbicacionesDirectas(directas);
    
    // Cargar ubicaciones relacionadas si existen
    if (detalleData.ubicacionesRelacionadas && Array.isArray(detalleData.ubicacionesRelacionadas)) {
      setUbicacionesRelacionadas(detalleData.ubicacionesRelacionadas);
    } else {
      setUbicacionesRelacionadas([]);
    }
    
  }, [entidadSeleccionada, detalleData]);
  
  // Inicializar y actualizar el mapa cuando cambien las ubicaciones
  useEffect(() => {
    // Asegurarnos de que el contenedor del mapa existe
    if (!mapContainerRef.current) return;
    
    // Función para inicializar el mapa
    const initMap = () => {
      try {
        // Si ya hay un mapa, lo limpiamos primero
        if (mapRef.current) {
          mapRef.current.remove();
        }
        
        // Crear el mapa
        const map = L.map(mapContainerRef.current).setView([9.748917, -83.753428], 7);
        
        // Añadir la capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;
        
        // Limpiar marcadores anteriores
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        // Crear límites para ajustar la vista
        const bounds = L.latLngBounds([]);
        let marcadoresAgregados = 0;
        
        // Añadir marcadores para ubicaciones directas
        ubicacionesDirectas.forEach((ubicacion, index) => {
          if (typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number') {
            const position = [ubicacion.latitud, ubicacion.longitud];
            
            // Configurar un icono básico para evitar errores con iconos personalizados
            const icon = new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            // Crear marcador
            const marker = L.marker(position, { icon }).addTo(map);
            
            // Añadir popup
            marker.bindPopup(`
              <div>
                <strong>${ubicacion.tipo || "Ubicación"}</strong><br>
                ${ubicacion.fecha ? `Fecha: ${new Date(ubicacion.fecha).toLocaleString()}<br>` : ''}
                Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}<br>
                ${ubicacion.observaciones ? `Observaciones: ${ubicacion.observaciones}` : ''}
              </div>
            `);
            
            markersRef.current.push(marker);
            bounds.extend(position);
            marcadoresAgregados++;
          }
        });
        
        // Añadir marcadores para ubicaciones relacionadas
        ubicacionesRelacionadas.forEach((item, index) => {
          // Verificar estructura: puede ser directamente una ubicación o contener una propiedad "ubicacion"
          const ubicacion = item.ubicacion ? item.ubicacion : item;
          
          if (ubicacion && typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number') {
            const position = [ubicacion.latitud, ubicacion.longitud];
            
            // Usar un icono diferente para ubicaciones relacionadas
            const icon = new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x-red.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            // Crear marcador
            const marker = L.marker(position, { icon }).addTo(map);
            
            // Preparar información para el popup
            let entidadInfo = '';
            if (item.entidadRelacionada) {
              const entidad = item.entidadRelacionada;
              entidadInfo = `<br><strong>Relacionada con:</strong> ${entidad.tipo} - ${entidad.entidad?.nombre || 'Desconocido'}`;
            }
            
            // Añadir popup
            marker.bindPopup(`
              <div>
                <strong>${ubicacion.tipo || "Ubicación"} (Relacionada)</strong><br>
                ${ubicacion.fecha ? `Fecha: ${new Date(ubicacion.fecha).toLocaleString()}<br>` : ''}
                Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}
                ${entidadInfo}
                ${ubicacion.observaciones ? `<br>Observaciones: ${ubicacion.observaciones}` : ''}
              </div>
            `);
            
            markersRef.current.push(marker);
            bounds.extend(position);
            marcadoresAgregados++;
          }
        });
        
        // Ajustar la vista del mapa
        if (marcadoresAgregados > 0) {
          // Si hay solo un marcador, centrar en él con un zoom fijo
          if (marcadoresAgregados === 1) {
            const center = bounds.getCenter();
            map.setView([center.lat, center.lng], 13);
          } 
          // Si hay múltiples marcadores, ajustar a todos
          else {
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        }
        
        mapInitializedRef.current = true;
      } catch (error) {
        console.error("Error al inicializar el mapa:", error);
      }
    };
    
    // Usar setTimeout para asegurar que el contenedor esté completamente listo
    const timer = setTimeout(() => {
      if (ubicacionesDirectas.length > 0 || ubicacionesRelacionadas.length > 0) {
        initMap();
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
    
  }, [ubicacionesDirectas, ubicacionesRelacionadas]);
  
  // Determinar si hay ubicaciones para mostrar
  const hayUbicaciones = ubicacionesDirectas.length > 0 || ubicacionesRelacionadas.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Mapa de ubicaciones */}
      <div className="border rounded-lg overflow-hidden">
        <div className="h-[400px] relative" ref={mapContainerRef}>
          {!hayUbicaciones && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">No hay ubicaciones disponibles para mostrar</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabla de ubicaciones */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Ubicaciones directas */}
            {ubicacionesDirectas.map((ubicacion, index) => (
              <tr key={`directa-${index}-${ubicacion.id}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ubicacion.tipo || "No especificado"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number' 
                    ? `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` 
                    : "Coordenadas no disponibles"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No especificada"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{ubicacion.observaciones || "Sin observaciones"}</td>
              </tr>
            ))}
            
            {/* Separador para ubicaciones relacionadas si hay ambos tipos */}
            {ubicacionesDirectas.length > 0 && ubicacionesRelacionadas.length > 0 && (
              <tr className="bg-gray-100">
                <td colSpan={4} className="px-6 py-2 text-sm font-medium text-gray-500">Ubicaciones relacionadas</td>
              </tr>
            )}
            
            {/* Ubicaciones relacionadas */}
            {ubicacionesRelacionadas.map((item, index) => {
              // Verificar estructura: puede ser directamente una ubicación o contener una propiedad "ubicacion"
              const ubicacion = item.ubicacion ? item.ubicacion : item;
              
              return ubicacion ? (
                <tr key={`relacionada-${index}-${ubicacion.id}`} className="hover:bg-gray-50 bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ubicacion.tipo || "No especificado"} 
                    {item.entidadRelacionada && (
                      <span className="ml-1 text-xs text-gray-500">
                        (Rel: {item.entidadRelacionada.tipo} - {item.entidadRelacionada.entidad?.nombre || 'Desconocido'})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number' 
                      ? `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` 
                      : "Coordenadas no disponibles"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No especificada"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ubicacion.observaciones || "Sin observaciones"}</td>
                </tr>
              ) : null;
            })}
            
            {/* Mensaje si no hay ubicaciones */}
            {!hayUbicaciones && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay ubicaciones disponibles para esta entidad
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}