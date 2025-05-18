import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Car, Home, MapPin, X } from "lucide-react";

export interface SearchResult {
  id: number;
  tipo: string;
  texto: string;
  detalle?: string;
  entidad: any;
}

interface AutocompleteSearchProps {
  placeholder?: string;
  onSearch: (term: string, selectedItem?: SearchResult | null) => void;
  searchButtonClass?: string;
  className?: string;
  initialValue?: string;
}

const AutocompleteSearch = ({
  placeholder = "Buscar...",
  onSearch,
  searchButtonClass = "",
  className = "",
  initialValue = ""
}: AutocompleteSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar la lista de resultados cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función para buscar coincidencias cuando el usuario escribe
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        fetchResults(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  // Buscar coincidencias en la API
  const fetchResults = async (term: string) => {
    if (term.trim().length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/buscar?query=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      // Transformar los resultados en un formato unificado
      const transformedResults: SearchResult[] = [];
      
      // Procesar personas
      if (data.personas && Array.isArray(data.personas)) {
        data.personas.forEach((persona: any) => {
          transformedResults.push({
            id: persona.id,
            tipo: 'persona',
            texto: persona.nombre,
            detalle: persona.identificacion || '',
            entidad: persona
          });
        });
      }
      
      // Procesar vehículos
      if (data.vehiculos && Array.isArray(data.vehiculos)) {
        data.vehiculos.forEach((vehiculo: any) => {
          transformedResults.push({
            id: vehiculo.id,
            tipo: 'vehiculo',
            texto: vehiculo.placa,
            detalle: `${vehiculo.marca} ${vehiculo.modelo}`,
            entidad: vehiculo
          });
        });
      }
      
      // Procesar inmuebles
      if (data.inmuebles && Array.isArray(data.inmuebles)) {
        data.inmuebles.forEach((inmueble: any) => {
          transformedResults.push({
            id: inmueble.id,
            tipo: 'inmueble',
            texto: inmueble.direccion,
            detalle: inmueble.tipo || '',
            entidad: inmueble
          });
        });
      }
      
      // Procesar ubicaciones
      if (data.ubicaciones && Array.isArray(data.ubicaciones)) {
        data.ubicaciones.forEach((ubicacion: any) => {
          transformedResults.push({
            id: ubicacion.id,
            tipo: 'ubicacion',
            texto: ubicacion.tipo || 'Ubicación sin tipo',
            detalle: ubicacion.observaciones || '',
            entidad: ubicacion
          });
        });
      }
      
      setResults(transformedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error al buscar coincidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar la selección de un resultado
  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    setSearchTerm(result.texto);
    setShowResults(false);
    onSearch(result.texto, result);
  };

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si el usuario está borrando o cambiando el término, resetear la selección
    if (selectedResult && !value.includes(selectedResult.texto)) {
      setSelectedResult(null);
    }
  };

  // Manejar la pulsación de teclas (Enter para buscar)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && showResults) {
        handleSelectResult(results[0]);
      } else {
        onSearch(searchTerm, null);
        setShowResults(false);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Manejar el botón de búsqueda
  const handleSearchButton = () => {
    onSearch(searchTerm, selectedResult);
    setShowResults(false);
  };

  // Limpiar la búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedResult(null);
    onSearch('', null);
  };

  // Función para obtener el icono según el tipo de entidad
  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'persona':
        return <User className="h-4 w-4 mr-2 text-blue-500" />;
      case 'vehiculo':
        return <Car className="h-4 w-4 mr-2 text-green-500" />;
      case 'inmueble':
        return <Home className="h-4 w-4 mr-2 text-orange-500" />;
      case 'ubicacion':
        return <MapPin className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <Search className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="pr-8"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={handleSearchButton}
          className={searchButtonClass}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Lista desplegable de resultados */}
      {showResults && searchTerm.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
          {loading ? (
            <div className="p-2 text-center text-sm text-gray-500">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result) => (
                <div
                  key={`${result.tipo}-${result.id}`}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="flex items-center">
                    {getIconForType(result.tipo)}
                    <div>
                      <div className="font-medium">{result.texto}</div>
                      {result.detalle && (
                        <div className="text-xs text-gray-500">
                          {result.detalle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    {result.tipo === 'persona' ? 'Persona' : 
                     result.tipo === 'vehiculo' ? 'Vehículo' : 
                     result.tipo === 'inmueble' ? 'Inmueble' : 'Ubicación'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 text-center text-sm text-gray-500">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;