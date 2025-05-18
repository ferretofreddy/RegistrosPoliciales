import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

// Tipo de entidad para la búsqueda
type EntityType = "todas" | "persona" | "vehiculo" | "inmueble" | "ubicacion";

// Tipo para los resultados de búsqueda
type SearchResult = {
  id: number;
  nombre: string;
  tipo: EntityType;
  referencia: string;
};

interface SearchComponentProps {
  onResultSelect?: (result: SearchResult) => void;
}

export default function SearchComponent({ onResultSelect }: SearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [entityType, setEntityType] = useState<EntityType>("todas");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Debounce el término de búsqueda para evitar demasiadas peticiones al API
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Función para realizar la búsqueda en la API
  const { data, isLoading } = useQuery({
    queryKey: ['/api/buscar', debouncedSearchTerm, entityType],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      const response = await fetch(`/api/buscar?q=${encodeURIComponent(debouncedSearchTerm)}&tipo=${entityType}`);
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      return response.json();
    },
    enabled: debouncedSearchTerm.length >= 2,
  });
  
  // Actualizar los resultados cuando cambia la respuesta de la API
  useEffect(() => {
    if (data) {
      // Transformar los datos de la API al formato necesario para la visualización
      const formattedResults = formatSearchResults(data);
      setSearchResults(formattedResults);
      setShowResults(formattedResults.length > 0);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [data]);
  
  // Formatear los resultados de la API al formato del componente
  const formatSearchResults = (apiResults: any[]): SearchResult[] => {
    return apiResults.map(item => {
      let nombre = '';
      let referencia = '';
      let tipo: EntityType = 'persona';
      
      if (item.tipo === 'persona') {
        nombre = item.nombre || 'Sin nombre';
        referencia = item.identificacion || 'Sin identificación';
        tipo = 'persona';
      } else if (item.tipo === 'vehiculo') {
        nombre = `${item.marca} ${item.modelo}` || 'Vehículo sin datos';
        referencia = item.placa || 'Sin placa';
        tipo = 'vehiculo';
      } else if (item.tipo === 'inmueble') {
        nombre = item.direccion || 'Inmueble sin dirección';
        referencia = item.tipo || 'Sin tipo';
        tipo = 'inmueble';
      } else if (item.tipo === 'ubicacion') {
        nombre = item.observaciones || 'Ubicación';
        referencia = item.tipo || 'Sin tipo';
        tipo = 'ubicacion';
      }
      
      return {
        id: item.id,
        nombre,
        referencia,
        tipo
      };
    });
  };
  
  // Manejar la selección de un resultado
  const handleResultSelect = (result: SearchResult) => {
    setSearchTerm("");
    setShowResults(false);
    if (onResultSelect) {
      onResultSelect(result);
    }
  };
  
  // Manejar el cambio en el término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };
  
  // Manejar el cambio en el tipo de entidad
  const handleEntityTypeChange = (value: string) => {
    setEntityType(value as EntityType);
  };
  
  // Limpiar la búsqueda
  const clearSearch = () => {
    setSearchTerm("");
    setShowResults(false);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre, identificación, placa..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Resultados de búsqueda */}
          {showResults && (
            <Card className="absolute z-50 mt-1 w-full max-h-60 overflow-auto shadow-lg">
              <div className="p-2">
                {isLoading ? (
                  <div className="text-center py-2 text-gray-500">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-1">
                    {searchResults.map((result) => (
                      <li 
                        key={`${result.tipo}-${result.id}`}
                        className="px-2 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors flex justify-between items-center"
                        onClick={() => handleResultSelect(result)}
                      >
                        <div>
                          <span className="font-medium block">{result.nombre}</span>
                          <span className="text-sm text-gray-500">{result.referencia}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800">
                          {result.tipo === 'persona' && 'Persona'}
                          {result.tipo === 'vehiculo' && 'Vehículo'}
                          {result.tipo === 'inmueble' && 'Inmueble'}
                          {result.tipo === 'ubicacion' && 'Ubicación'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : searchTerm.length >= 2 ? (
                  <div className="text-center py-2 text-gray-500">No se encontraron resultados</div>
                ) : null}
              </div>
            </Card>
          )}
        </div>
        
        <Select value={entityType} onValueChange={handleEntityTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todas">Todas las entidades</SelectItem>
              <SelectItem value="persona">Personas</SelectItem>
              <SelectItem value="vehiculo">Vehículos</SelectItem>
              <SelectItem value="inmueble">Inmuebles</SelectItem>
              <SelectItem value="ubicacion">Ubicaciones</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button 
          variant="default" 
          className="flex items-center gap-1"
        >
          <Search className="h-4 w-4" />
          <span>Buscar</span>
        </Button>
      </div>
    </div>
  );
}