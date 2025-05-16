import { useEffect, useRef, useState } from "react";
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

interface MapaUbicacionesProps {
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

export default function MapaUbicaciones({ ubicacionesDirectas, ubicacionesRelacionadas }: MapaUbicacionesProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [totalMarcadores, setTotalMarcadores] = useState(0);

  useEffect(() => {
    // Asegurarse de que el contenedor del mapa existe
    if (!mapContainerRef.current) return;

    // Inicializar el mapa si no existe
    if (!mapRef.current) {
      console.log("Inicializando mapa...");
      mapRef.current = L.map(mapContainerRef.current).setView([8.6, -82.9], 13);
      
      // Agregar el tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Crear límites para ajustar la vista
    const bounds = L.latLngBounds([]);

    // Procesar ubicaciones directas
    console.log("ubicacionesDirectas:", ubicacionesDirectas.length);
    console.log("ubicacionesRelacionadas:", ubicacionesRelacionadas.length);

    if (ubicacionesDirectas && ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", ubicacionesDirectas);
      
      ubicacionesDirectas.forEach((ubicacion, index) => {
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
        console.log("Marcador agregado y bounds extendido a:", bounds);
      });
    }

    // Procesar ubicaciones relacionadas
    if (ubicacionesRelacionadas && ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", ubicacionesRelacionadas);
      
      ubicacionesRelacionadas.forEach((item, index) => {
        console.log(`Ubicación relacionada ${index}:`, item);
        const position: L.LatLngExpression = [item.ubicacion.latitud, item.ubicacion.longitud];
        
        // Determinar el icono según el tipo de entidad relacionada
        let icon = iconoUbicacion;
        let relacion = '';
        
        if (item.entidadRelacionada) {
          console.log(`Agregando marcador en [${position}] para ${item.entidadRelacionada.tipo}`);
          
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
          
          console.log(`Agregando marcador en [${position}] para ${relacion}`);
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
      });
    }

    // Ajustar la vista si hay marcadores
    if (markersRef.current.length > 0) {
      console.log(`Ajustando mapa a los límites: ${bounds} con ${markersRef.current.length} marcadores`);
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13
      });
    }

    setTotalMarcadores(markersRef.current.length);
    console.log("Marcadores actualizados:", markersRef.current.length);

    // Cleanup al desmontar componente
    return () => {
      if (mapRef.current) {
        console.log("Limpiando mapa...");
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ubicacionesDirectas, ubicacionesRelacionadas]);

  return (
    <div ref={mapContainerRef} className="h-full w-full">
      {totalMarcadores === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600">No hay ubicaciones para mostrar</p>
          </div>
        </div>
      )}
    </div>
  );
}