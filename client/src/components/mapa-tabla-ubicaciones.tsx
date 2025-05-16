import React, { useEffect, useRef, useState } from 'react';
import { Ubicacion } from "@shared/schema";
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Corregir el problema de iconos de marcadores en Leaflet
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

const iconoVehiculo = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-vehiculo'
});

const iconoInmueble = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-inmueble'
});

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
  ubicacionesDirectas: Ubicacion[];
  ubicacionesRelacionadas: {
    ubicacion: Ubicacion;
    entidadRelacionada: {
      tipo: string;
      entidad: any;
      relacionadoCon?: {
        tipo: string;
        entidad: any;
      };
    };
  }[];
}

export default function MapaTablaUbicaciones({ 
  ubicacionesDirectas = [],
  ubicacionesRelacionadas = []
}: MapaTablaUbicacionesProps) {
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
        
        console.log(`Agregando marcador en [${position}]`);
        const marker = L.marker(position, { icon: iconoUbicacion })
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
        
        // Determinar el icono según el tipo de entidad relacionada
        let icon = iconoUbicacion;
        let relacion = '';
        
        if (item.entidadRelacionada) {
          console.log(`Procesando entidad relacionada para [${position}]: ${item.entidadRelacionada.tipo}`);
          
          if (item.entidadRelacionada.tipo === 'persona') {
            icon = iconoPersona;
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `PERSONA → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : 'PERSONA';
          } else if (item.entidadRelacionada.tipo === 'vehiculo') {
            icon = iconoVehiculo;
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `VEHICULO → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : 'VEHICULO';
          } else if (item.entidadRelacionada.tipo === 'inmueble') {
            icon = iconoInmueble;
            relacion = item.entidadRelacionada.relacionadoCon 
              ? `INMUEBLE → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : 'INMUEBLE';
          }
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