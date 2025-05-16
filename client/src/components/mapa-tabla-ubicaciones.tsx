import React, { useEffect, useRef, useState } from 'react';
import { Ubicacion } from "@shared/schema";
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Definir iconos personalizados para los diferentes tipos de entidades
const iconoPersona = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-persona'
});

// Icono para domicilio (casa)
const iconoDomicilio = L.divIcon({
  html: '<div class="map-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5722" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>',
  className: 'marker-domicilio',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Icono para vehículo (carro)
const iconoVehiculo = L.divIcon({
  html: '<div class="map-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect><path d="M4 12h16"></path><path d="M7 6v4"></path><path d="M17 6v4"></path><path d="M7 18v2"></path><path d="M17 18v2"></path></svg></div>',
  className: 'marker-vehiculo',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Icono para inmueble (edificio)
const iconoInmueble = L.divIcon({
  html: '<div class="map-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="6" x2="12" y2="6"></line><line x1="12" y1="12" x2="12" y2="12"></line><line x1="12" y1="18" x2="12" y2="18"></line></svg></div>',
  className: 'marker-inmueble',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Icono para ubicación (marcador por defecto)
const iconoUbicacion = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-ubicacion'
});

interface MapaTablaUbicacionesProps {
  entidadSeleccionada: {
    tipo: string;
    id: number;
    nombre: string;
    descripcion: string;
  };
  detalleData: any;
}

export default function MapaTablaUbicaciones({ 
  entidadSeleccionada,
  detalleData
}: MapaTablaUbicacionesProps) {
  // Definimos estados para ubicaciones usando datos reales en lugar de procesados
  const [ubicacionesDirectas, setUbicacionesDirectas] = useState<any[]>([]);
  const [ubicacionesRelacionadas, setUbicacionesRelacionadas] = useState<any[]>([]);
  
  // Implementación simplificada para mostrar ubicaciones en el mapa
  useEffect(() => {
    console.log("Datos detallados completos:", detalleData);
    
    if (!entidadSeleccionada || !detalleData) return;
    
    // Extraer ubicaciones directas de detalleData
    let directas: any[] = [];
    
    // Combinar todas las fuentes de ubicaciones disponibles
    let todasLasUbicaciones = [];
    
    // 1. Ubicaciones directas desde el backend
    if (Array.isArray(detalleData.ubicaciones)) {
      todasLasUbicaciones.push(...detalleData.ubicaciones);
    }
    
    // 2. Ubicaciones de domicilios generadas
    if (Array.isArray(detalleData.ubicacionesDomicilio)) {
      todasLasUbicaciones.push(...detalleData.ubicacionesDomicilio);
    }
    
    // Filtrar ubicaciones válidas con coordenadas
    directas = todasLasUbicaciones.filter(
      (ubi: any) => ubi && typeof ubi.latitud === 'number' && typeof ubi.longitud === 'number'
    );
    
    console.log("Fuentes combinadas de ubicaciones:", {
      directasBackend: Array.isArray(detalleData.ubicaciones) ? detalleData.ubicaciones.length : 0,
      domiciliosGenerados: Array.isArray(detalleData.ubicacionesDomicilio) ? detalleData.ubicacionesDomicilio.length : 0,
      total: directas.length
    });
    
    // Actualizar estados
    setUbicacionesDirectas(directas);
    setUbicacionesRelacionadas([]);
    
    // Esto registrará información detallada para depuración
    if (directas.length === 0) {
      console.log("Estructura de ubicaciones:", {
        tipo: entidadSeleccionada.tipo,
        id: entidadSeleccionada.id,
        tieneUbicaciones: detalleData.ubicaciones ? "Sí" : "No",
        tipoUbicaciones: typeof detalleData.ubicaciones,
        esArray: Array.isArray(detalleData.ubicaciones),
        propiedades: detalleData.ubicaciones ? Object.keys(detalleData.ubicaciones) : "Ninguna",
        ubicacionesDirectas: 
          detalleData.ubicaciones && detalleData.ubicaciones.ubicacionesDirectas ? 
          detalleData.ubicaciones.ubicacionesDirectas.length : "No disponible",
        ubicacionesRelacionadas: 
          detalleData.ubicaciones && detalleData.ubicaciones.ubicacionesRelacionadas ? 
          detalleData.ubicaciones.ubicacionesRelacionadas.length : "No disponible"
      });
    }
    
  }, [entidadSeleccionada, detalleData]);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [totalMarcadores, setTotalMarcadores] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  
  console.log("Renderizando componente MapaTablaUbicaciones");
  console.log("ubicacionesDirectas:", ubicacionesDirectas);
  console.log("ubicacionesRelacionadas:", ubicacionesRelacionadas);
  
  const hayUbicaciones = 
    (ubicacionesDirectas && ubicacionesDirectas.length > 0) || 
    (ubicacionesRelacionadas && ubicacionesRelacionadas.length > 0);

  useEffect(() => {
    if (!hayUbicaciones) {
      return;
    }
    
    console.log("MapaTablaUbicaciones - useEffect activado");
    
    // Asegurarse de que el contenedor del mapa existe
    if (!mapContainerRef.current) {
      console.error("Contenedor del mapa no encontrado");
      return;
    }

    // Cleanup anterior si es necesario
    if (mapRef.current) {
      console.log("Limpiando mapa anterior");
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Inicializar el mapa
    console.log("Inicializando mapa...");
    mapRef.current = L.map(mapContainerRef.current).setView([8.6, -82.9], 8);
    
    // Agregar el tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Crear límites para ajustar la vista
    const bounds = L.latLngBounds([]);
    let marcadoresAgregados = 0;

    // Procesar ubicaciones directas
    if (ubicacionesDirectas && ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", ubicacionesDirectas);
      
      ubicacionesDirectas.forEach((ubicacion, index) => {
        if (!ubicacion || typeof ubicacion.latitud !== 'number' || typeof ubicacion.longitud !== 'number') {
          console.warn(`Ubicación directa inválida en índice ${index}:`, ubicacion);
          return;
        }
        
        console.log(`Ubicación directa ${index}:`, ubicacion);
        const position: L.LatLngExpression = [ubicacion.latitud, ubicacion.longitud];
        
        // Determinar icono según el tipo de ubicación
        let icon = iconoUbicacion; // Por defecto usar el icono estándar
        
        // Detectar si es un domicilio por el tipo de ubicación
        if (ubicacion.tipo.toLowerCase().includes('domicilio') || 
            ubicacion.tipo.toLowerCase().includes('casa') || 
            ubicacion.tipo.toLowerCase().includes('residencia')) {
          // Usar íconos con colores diferentes según el tipo
          let markerHtml = '<div class="map-icon" style="background-color: #FFF5F0; border: 2px solid #FF5722;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
          icon = L.divIcon({
            html: markerHtml,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
        } 
        // Detectar si es una ubicación de inmueble
        else if (ubicacion.tipo.toLowerCase().includes('inmueble') || 
                ubicacion.tipo.toLowerCase().includes('edificio') || 
                ubicacion.tipo.toLowerCase().includes('terreno') ||
                ubicacion.tipo.toLowerCase().includes('local')) {
          // Usar íconos con colores diferentes según el tipo
          let markerHtml = '<div class="map-icon" style="background-color: #E8F5E9; border: 2px solid #4CAF50;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="6" x2="12" y2="6"></line><line x1="12" y1="12" x2="12" y2="12"></line></svg></div>';
          icon = L.divIcon({
            html: markerHtml,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
        }
        // Para otros tipos de ubicaciones, usar un pin estándar pero con color distintivo
        else {
          let markerHtml = '<div class="map-icon" style="background-color: #F3E5F5; border: 2px solid #9C27B0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>';
          icon = L.divIcon({
            html: markerHtml,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
        }
        
        console.log(`Agregando marcador en [${position}] con tipo ${ubicacion.tipo}`);
        const marker = L.marker(position, { icon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div>
              <strong>${ubicacion.tipo}</strong><br/>
              Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}<br/>
              ${ubicacion.fecha ? `Fecha: ${new Date(ubicacion.fecha).toLocaleString()}` : ''}<br/>
              ${ubicacion.observaciones ? `Observaciones: ${ubicacion.observaciones}` : ''}
            </div>
          `);

        markersRef.current.push(marker);
        bounds.extend(position);
        marcadoresAgregados++;
      });
    }

    // Procesar ubicaciones relacionadas
    if (ubicacionesRelacionadas && ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", ubicacionesRelacionadas);
      
      ubicacionesRelacionadas.forEach((item, index) => {
        if (!item.ubicacion || typeof item.ubicacion.latitud !== 'number' || typeof item.ubicacion.longitud !== 'number') {
          console.warn(`Ubicación relacionada inválida en índice ${index}:`, item);
          return;
        }
        
        console.log(`Ubicación relacionada ${index}:`, item);
        const position: L.LatLngExpression = [item.ubicacion.latitud, item.ubicacion.longitud];
        
        // Determinar el icono según el tipo de entidad relacionada y tipo de ubicación
        let icon = iconoUbicacion; // Por defecto usar el icono estándar
        let relacion = '';
        
        if (item.entidadRelacionada) {
          console.log(`Procesando entidad relacionada para [${position}]: ${item.entidadRelacionada.tipo}`);
          
          // Persona y sus domicilios
          if (item.entidadRelacionada.tipo === 'persona') {
            // Usar ícono según tipo de ubicación
            if (item.ubicacion.tipo.toLowerCase().includes('domicilio') || 
                item.ubicacion.tipo.toLowerCase().includes('casa') || 
                item.ubicacion.tipo.toLowerCase().includes('residencia')) {
              // Usar íconos con colores diferentes según el tipo
              let markerHtml = '<div class="map-icon" style="background-color: #FFF5F0; border: 2px solid #FF5722;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
              icon = L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
            }
            
            // Información de relación
            const nombreEntidad = item.entidadRelacionada.entidad?.nombre || "Persona";
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `${nombreEntidad} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : nombreEntidad;
          } 
          // Vehículo
          else if (item.entidadRelacionada.tipo === 'vehiculo') {
            // Usar íconos con colores diferentes según el tipo
            let markerHtml = '<div class="map-icon" style="background-color: #E3F2FD; border: 2px solid #2196F3;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2196F3" stroke-width="2"><rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect><path d="M4 12h16"></path></svg></div>';
            icon = L.divIcon({
              html: markerHtml,
              className: '',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            
            // Información de relación
            const detalleVehiculo = item.entidadRelacionada.entidad?.marca 
              ? `${item.entidadRelacionada.entidad.marca} ${item.entidadRelacionada.entidad.modelo || ''}`
              : "Vehículo";
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `${detalleVehiculo} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : detalleVehiculo;
          } 
          // Inmueble
          else if (item.entidadRelacionada.tipo === 'inmueble') {
            // Usar íconos con colores diferentes según el tipo
            let markerHtml = '<div class="map-icon" style="background-color: #E8F5E9; border: 2px solid #4CAF50;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="6" x2="12" y2="6"></line><line x1="12" y1="12" x2="12" y2="12"></line></svg></div>';
            icon = L.divIcon({
              html: markerHtml,
              className: '',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            
            // Información de relación
            const detalleInmueble = item.entidadRelacionada.entidad?.tipo || "Inmueble";
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `${detalleInmueble} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : detalleInmueble;
          }
          // Ubicación por defecto
          else {
            relacion = item.entidadRelacionada.tipo.toUpperCase();
          }
        } else {
          // Si no hay entidad relacionada, usar icono por defecto
          relacion = 'Sin relación';
        }
        
        const marker = L.marker(position, { icon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div>
              <strong>${item.ubicacion.tipo}</strong><br/>
              Coordenadas: ${item.ubicacion.latitud.toFixed(6)}, ${item.ubicacion.longitud.toFixed(6)}<br/>
              ${item.ubicacion.fecha ? `Fecha: ${new Date(item.ubicacion.fecha).toLocaleString()}` : ''}<br/>
              Relación: ${relacion}<br/>
              ${item.ubicacion.observaciones ? `Observaciones: ${item.ubicacion.observaciones}` : ''}
            </div>
          `);

        markersRef.current.push(marker);
        bounds.extend(position);
        marcadoresAgregados++;
      });
    }

    // Ajustar la vista si hay marcadores
    if (marcadoresAgregados > 0) {
      console.log(`Ajustando mapa a los límites: ${bounds} con ${marcadoresAgregados} marcadores`);
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13
      });
      setIsMapReady(true);
    } else {
      console.warn("No se agregaron marcadores al mapa");
    }

    setTotalMarcadores(marcadoresAgregados);

    // Cleanup al desmontar componente
    return () => {
      if (mapRef.current) {
        console.log("Limpiando mapa...");
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ubicacionesDirectas, ubicacionesRelacionadas, hayUbicaciones]);

  if (!hayUbicaciones) {
    return (
      <div className="text-center p-8 bg-gray-50 border rounded-lg">
        <p className="text-lg font-medium text-gray-600">No hay ubicaciones para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mapa de ubicaciones */}
      <div>
        <div className="bg-gray-50 px-4 py-3 border-t border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mapa de Ubicaciones</h3>
        </div>
        <div className="border border-gray-200 rounded-b-lg" style={{ height: '400px' }}>
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}>
            {!isMapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de ubicaciones */}
      <div>
        <div className="bg-gray-50 px-4 py-3 border-t border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ubicaciones Encontradas ({totalMarcadores})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relación</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ubicacionesDirectas.map((ubicacion: Ubicacion) => (
                <tr key={`directa-${ubicacion.id}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ubicacion.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Directa</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ubicacion.observaciones || ""}</td>
                </tr>
              ))}
              {ubicacionesRelacionadas.map((item: any, index: number) => (
                <tr key={`relacionada-${index}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.ubicacion.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.ubicacion.latitud.toFixed(6)}, {item.ubicacion.longitud.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.ubicacion.fecha ? new Date(item.ubicacion.fecha).toLocaleString() : "No registrada"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.entidadRelacionada.relacionadoCon 
                      ? `${item.entidadRelacionada.tipo.toUpperCase()} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
                      : item.entidadRelacionada.tipo.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.ubicacion.observaciones || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}