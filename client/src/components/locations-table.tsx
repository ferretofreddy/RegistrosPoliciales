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
  // Función para obtener el ícono según el tipo de entidad
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'persona':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'vehiculo':
        return <Car className="h-4 w-4 text-green-500" />;
      case 'inmueble':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'ubicacion':
      default:
        return <MapPin className="h-4 w-4 text-red-500" />;
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
            <TableHead>Nombre/Descripción</TableHead>
            <TableHead>Detalles</TableHead>
            <TableHead className="w-[180px]">Coordenadas</TableHead>
            <TableHead className="w-[100px]">Relación</TableHead>
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
                  {getEntityIcon(location.type)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{location.title}</TableCell>
              <TableCell>{location.description}</TableCell>
              <TableCell>
                <span className="text-xs font-mono">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  location.relation === 'direct' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {location.relation === 'direct' ? 'Directa' : 'Relacionada'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}