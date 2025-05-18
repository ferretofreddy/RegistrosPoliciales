import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { User, Car, Home, MapPin } from "lucide-react";

interface BusquedaDesplegableProps {
  searchTerm: string;
  onSelectResult: (result: SearchResult) => void;
  onClose: () => void;
}

export interface SearchResult {
  id: number;
  tipo: string;
  texto: string;
  entidad: any;
}

export default function BusquedaDesplegable({
  searchTerm,
  onSelectResult,
  onClose
}: BusquedaDesplegableProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Buscar resultados cuando cambia el término de búsqueda
  useEffect(() => {
    const searchResults = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Buscar en todas las entidades (personas, vehículos, inmuebles)
        const personasPromise = fetch(`/api/personas?buscar=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .catch(() => []);
          
        const vehiculosPromise = fetch(`/api/vehiculos?buscar=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .catch(() => []);
          
        const inmueblesPromise = fetch(`/api/inmuebles?buscar=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .catch(() => []);
        
        const [personas, vehiculos, inmuebles] = await Promise.all([
          personasPromise,
          vehiculosPromise,
          inmueblesPromise
        ]);
        
        // Formatear resultados
        const formattedResults: SearchResult[] = [];
        
        // Agregar personas
        personas.forEach((persona: any) => {
          formattedResults.push({
            id: persona.id,
            tipo: 'persona',
            texto: `${persona.nombre} ${persona.identificacion ? `(${persona.identificacion})` : ''}`,
            entidad: persona
          });
        });
        
        // Agregar vehículos
        vehiculos.forEach((vehiculo: any) => {
          formattedResults.push({
            id: vehiculo.id,
            tipo: 'vehiculo',
            texto: `${vehiculo.marca} ${vehiculo.modelo || ''} (${vehiculo.placa})`,
            entidad: vehiculo
          });
        });
        
        // Agregar inmuebles
        inmuebles.forEach((inmueble: any) => {
          formattedResults.push({
            id: inmueble.id,
            tipo: 'inmueble',
            texto: `${inmueble.tipo}: ${inmueble.direccion || 'Sin dirección'}`,
            entidad: inmueble
          });
        });
        
        setResults(formattedResults);
      } catch (error) {
        console.error("Error al buscar coincidencias:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(searchResults, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  // Cerrar la lista desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Si no hay resultados o el término es muy corto, no mostrar nada
  if (results.length === 0 || searchTerm.trim().length < 2) {
    return null;
  }
  
  // Renderizar icono según el tipo de entidad
  const renderIcon = (tipo: string) => {
    switch (tipo) {
      case 'persona':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'vehiculo':
        return <Car className="h-4 w-4 text-green-500" />;
      case 'inmueble':
        return <Home className="h-4 w-4 text-orange-500" />;
      default:
        return <MapPin className="h-4 w-4 text-red-500" />;
    }
  };
  
  // Renderizar etiqueta según el tipo de entidad
  const renderTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'persona':
        return <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Persona</span>;
      case 'vehiculo':
        return <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">Vehículo</span>;
      case 'inmueble':
        return <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">Inmueble</span>;
      default:
        return <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">Otro</span>;
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="absolute z-50 w-full max-h-80 overflow-auto bg-white rounded-md border border-gray-200 shadow-lg"
    >
      <Card className="p-0">
        <div className="p-2 border-b">
          <p className="text-sm text-gray-500">
            {isLoading ? "Buscando..." : `${results.length} resultados encontrados`}
          </p>
        </div>
        <ul className="p-0 m-0 list-none">
          {results.map((result) => (
            <li 
              key={`${result.tipo}-${result.id}`}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center"
              onClick={() => onSelectResult(result)}
            >
              <div className="mr-2">
                {renderIcon(result.tipo)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{result.texto}</p>
                  {renderTipoLabel(result.tipo)}
                </div>
                {/* Podríamos mostrar detalles adicionales aquí si es necesario */}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}