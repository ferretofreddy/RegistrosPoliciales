import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User, Building, MapPin, Car } from 'lucide-react';

// Definir los tipos para los marcadores del mapa
interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  type: 'persona' | 'vehiculo' | 'inmueble' | 'ubicacion';
  relation: 'direct' | 'related';
  entityId: number;
  relationInfo?: string;
}

// Tipos para las propiedades
interface LocationMapProps {
  locations?: MapMarker[];
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onLocationClick?: (location: MapMarker) => void;
}

// Componente para ajustar automáticamente el mapa para mostrar todos los marcadores
function MapBoundsAdjuster({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      if (markers.length === 1) {
        // Para un solo marcador, centrar en él con zoom moderado
        const marker = markers[0];
        map.setView([marker.lat, marker.lng], 12); // Zoom moderado para un solo marcador
        console.log("Centrando mapa en marcador único con zoom moderado");
      } else {
        // Para múltiples marcadores, ajustar bounds
        const bounds = new LatLngBounds([]);
        
        markers.forEach(marker => {
          bounds.extend(new LatLng(marker.lat, marker.lng));
        });
        
        // Ajustar el mapa a los límites con padding
        map.fitBounds(bounds, { 
          padding: [50, 50], // Añadir padding para que los marcadores no estén en el borde
          maxZoom: 15 // No hacer zoom demasiado cercano
        });
        
        console.log("Ajustando mapa para mostrar todos los marcadores");
      }
    }
  }, [markers, map]);
  
  return null;
}

export default function LocationMap({ locations, markers, center = [9.9281, -84.0907], zoom = 10, onLocationClick }: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Usar locations o markers dependiendo de cuál esté disponible
  const mapMarkers = locations || markers || [];

  // Asegurarse de que los íconos se carguen correctamente en el cliente
  useEffect(() => {
    setMapLoaded(true);
    console.log("Marcadores recibidos en el mapa:", mapMarkers);
  }, [mapMarkers]);

  if (!mapLoaded) {
    return <div className="w-full h-96 bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }
  
  if (!mapMarkers || mapMarkers.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center flex-col">
        <p className="mb-2">No hay ubicaciones para mostrar</p>
        <p className="text-sm text-gray-500">No se encontraron coordenadas geográficas</p>
      </div>
    );
  }

  // Crear iconos personalizados para cada tipo de entidad
  const createCustomIcon = (type: string, relation: string = 'direct') => {
    // Definir colores basados en el tipo de entidad y la relación
    let iconColor: string;
    let iconSvg: string;
    let iconSize = 36; // Tamaño consistente para todos los iconos
    
    // Configura colores para cada tipo de entidad
    switch (type) {
      case 'persona':
        iconColor = relation === 'direct' ? '#2563eb' : '#60a5fa'; // azul
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${relation === 'direct' ? iconColor : 'white'}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="5" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
          <path d="M20 21a8 8 0 0 0-16 0" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
        </svg>`;
        break;
      case 'vehiculo':
        iconColor = relation === 'direct' ? '#16a34a' : '#4ade80'; // verde
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${relation === 'direct' ? iconColor : 'white'}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10h-1.6a1 1 0 0 1-.5-.1l-2.7-1.6a1 1 0 0 0-.5-.1H8a2 2 0 0 0-2 1.5L5 12v5c0 .6.4 1 1 1h2" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
          <circle cx="7" cy="17" r="2" fill="white" stroke="${iconColor}"/>
          <path d="M9 17h6" fill="none" stroke="${iconColor}"/>
          <circle cx="17" cy="17" r="2" fill="white" stroke="${iconColor}"/>
        </svg>`;
        break;
      case 'inmueble':
        iconColor = relation === 'direct' ? '#9333ea' : '#c084fc'; // púrpura
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${relation === 'direct' ? iconColor : 'white'}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
          <path d="M9 22v-4h6v4" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
          <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" fill="none" stroke="${iconColor}"/>
        </svg>`;
        break;
      case 'ubicacion':
      default:
        iconColor = relation === 'direct' ? '#dc2626' : '#f87171'; // rojo
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${relation === 'direct' ? iconColor : 'white'}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="${relation === 'direct' ? 'white' : iconColor}" stroke="${iconColor}"/>
          <circle cx="12" cy="10" r="3" fill="${relation === 'direct' ? iconColor : 'white'}" stroke="${iconColor}"/>
        </svg>`;
    }
    
    // Crear el icono con tamaño consistente
    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(iconSvg),
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize/2, iconSize],  // Centrar horizontalmente, anclar en la parte inferior
      popupAnchor: [0, -iconSize],         // Posicionar el popup encima del icono
      className: `icon-${type}-${relation}` // Clase para identificar los tipos de iconos
    });
  };

  // Organizar los marcadores por tipo para la leyenda
  const markerTypes = Array.from(new Set(mapMarkers.map(marker => marker.type)));

  return (
    <div className="border rounded-md overflow-hidden" style={{ height: '400px' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapMarkers.length > 0 && <MapBoundsAdjuster markers={mapMarkers} />}
        
        {mapMarkers.map((marker) => (
          <Marker 
            key={`${marker.type}-${marker.id}-${marker.relation}`}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.type, marker.relation)}
          >
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-bold">{marker.title}</h3>
                <p className="break-words">{marker.description}</p>
                {marker.relationInfo ? (
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {marker.relationInfo}
                  </p>
                ) : null}
                <p className="text-xs text-gray-500 mt-1">
                  {marker.relation === 'direct' ? 'Ubicación directa' : 'Ubicación relacionada'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}