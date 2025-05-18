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
    const color = relation === 'direct' 
      ? type === 'persona' ? 'text-blue-600' 
        : type === 'vehiculo' ? 'text-green-600' 
        : type === 'inmueble' ? 'text-purple-600' 
        : 'text-red-600'
      : type === 'persona' ? 'text-blue-400' 
        : type === 'vehiculo' ? 'text-green-400' 
        : type === 'inmueble' ? 'text-purple-400' 
        : 'text-red-400';
        
    switch (type) {
      case 'persona':
        return <User className={`h-4 w-4 ${color}`} />;
      case 'vehiculo':
        return <Car className={`h-4 w-4 ${color}`} />;
      case 'inmueble':
        return <Building className={`h-4 w-4 ${color}`} />;
      case 'ubicacion':
      default:
        return <MapPin className={`h-4 w-4 ${color}`} />;
    }
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
            <TableHead className="w-[60px]">Tipo</TableHead>
            <TableHead>Título</TableHead>
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
              <TableCell>
                <div className="flex justify-center">
                  {getEntityIcon(location.type, location.relation)}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <p>{location.title}</p>
                  <p className="text-xs text-gray-500 md:hidden">
                    {location.description.length > 40 
                      ? location.description.substring(0, 40) + '...' 
                      : location.description}
                  </p>
                  <p className="text-xs font-mono text-gray-500 sm:hidden mt-1">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
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