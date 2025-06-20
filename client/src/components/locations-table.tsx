import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Building, MapPin, Car } from 'lucide-react';

// Definir los tipos para las ubicaciones
export interface LocationData {
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

interface LocationsTableProps {
  locations: LocationData[];
  onLocationClick: (location: LocationData) => void;
}

export default function LocationsTable({ locations, onLocationClick }: LocationsTableProps) {
  // Función para obtener el ícono según el tipo de entidad y relación
  const getEntityIcon = (type: string, relation: string = 'direct') => {
    // Usar exactamente los mismos colores que en el mapa
    let bgColor, iconColor;
    
    switch (type) {
      case 'persona':
        iconColor = relation === 'direct' ? 'text-blue-600' : 'text-blue-400';
        bgColor = 'bg-blue-50';
        break;
      case 'vehiculo':
        iconColor = relation === 'direct' ? 'text-green-600' : 'text-green-400';
        bgColor = 'bg-green-50';
        break;
      case 'inmueble':
        iconColor = relation === 'direct' ? 'text-purple-600' : 'text-purple-400';
        bgColor = 'bg-purple-50';
        break;
      case 'ubicacion':
      default:
        iconColor = relation === 'direct' ? 'text-red-600' : 'text-red-400';
        bgColor = 'bg-red-50';
    }
    
    // Crear un icono con fondo circular para que se vea consistente con los marcadores del mapa
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${bgColor}`}>
        {type === 'persona' && <User className={`h-4 w-4 ${iconColor}`} />}
        {type === 'vehiculo' && <Car className={`h-4 w-4 ${iconColor}`} />}
        {type === 'inmueble' && <Building className={`h-4 w-4 ${iconColor}`} />}
        {(type === 'ubicacion' || !type) && <MapPin className={`h-4 w-4 ${iconColor}`} />}
      </div>
    );
  };

  // Organizar las ubicaciones: primero las directas, luego las relacionadas
  const sortedLocations = [...locations].sort((a, b) => {
    if (a.relation === 'direct' && b.relation !== 'direct') return -1;
    if (a.relation !== 'direct' && b.relation === 'direct') return 1;
    return 0;
  });

  // Si no hay ubicaciones
  if (locations.length === 0) {
    return (
      <div className="border rounded-md p-4 text-center text-gray-500">
        No se encontraron ubicaciones para esta entidad o sus relaciones.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ubicación</TableHead>
            <TableHead className="hidden md:table-cell">Descripción</TableHead>
            <TableHead className="w-[150px] hidden sm:table-cell">Coordenadas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLocations.map((location) => (
            <TableRow 
              key={`${location.type}-${location.id}-${location.relation}`}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onLocationClick(location)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getEntityIcon(location.type, location.relation)}
                  <div>
                    <p>{location.title}</p>
                    <p className="text-xs text-gray-500 md:hidden whitespace-normal break-words">
                      {location.description}
                    </p>
                    <p className="text-xs font-mono text-gray-500 sm:hidden mt-1">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div>
                  <p>{location.description}</p>
                  {location.relationInfo && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      {location.relationInfo}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}