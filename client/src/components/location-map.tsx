import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
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
}

// Tipos para las propiedades
interface LocationMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
}

export default function LocationMap({ markers, center = [9.9281, -84.0907], zoom = 10 }: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Asegurarse de que los íconos se carguen correctamente en el cliente
  useEffect(() => {
    setMapLoaded(true);
    console.log("Marcadores recibidos en el mapa:", markers);
  }, [markers]);

  if (!mapLoaded) {
    return <div className="w-full h-96 bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }
  
  if (markers.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center flex-col">
        <p className="mb-2">No hay ubicaciones para mostrar</p>
        <p className="text-sm text-gray-500">No se encontraron coordenadas geográficas</p>
      </div>
    );
  }

  // Crear iconos personalizados para cada tipo de entidad
  const createCustomIcon = (type: string) => {
    const iconHtml = document.createElement('div');
    iconHtml.className = 'custom-icon-container';
    
    let color = 'text-blue-500';
    let icon = '';
    
    switch (type) {
      case 'persona':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
        color = 'text-blue-500';
        break;
      case 'vehiculo':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10h-1.6a1 1 0 0 1-.5-.1l-2.7-1.6a1 1 0 0 0-.5-.1H8a2 2 0 0 0-2 1.5L5 12v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';
        color = 'text-green-500';
        break;
      case 'inmueble':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
        color = 'text-purple-500';
        break;
      case 'ubicacion':
      default:
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
        color = 'text-red-500';
    }
    
    iconHtml.innerHTML = icon;
    iconHtml.classList.add(color);
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(icon),
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
      className: `text-${color}`
    });
  };

  // Organizar los marcadores por tipo para la leyenda
  const markerTypes = Array.from(new Set(markers.map(marker => marker.type)));

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden" style={{ height: '400px' }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers.map((marker) => (
            <Marker 
              key={`${marker.type}-${marker.id}-${marker.relation}`}
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(marker.type)}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{marker.title}</h3>
                  <p>{marker.description}</p>
                  <p className="text-sm text-gray-500">
                    {marker.relation === 'direct' ? 'Ubicación directa' : 'Ubicación relacionada'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda del mapa */}
      <div className="flex flex-wrap gap-4 p-2 bg-gray-50 rounded border">
        <div className="font-semibold">Leyenda:</div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-500" />
          <span>Persona</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-green-500" />
          <span>Vehículo</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-purple-500" />
          <span>Inmueble</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <span>Ubicación</span>
        </div>
      </div>
    </div>
  );
}