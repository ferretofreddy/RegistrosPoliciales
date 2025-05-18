import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, User, Car, Home, MapPin } from "lucide-react";

// Definición de tipos
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
  const [inputValue, setInputValue] = useState(initialValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Buscar resultados cuando cambia el valor del input
  useEffect(() => {
    const searchResults = async () => {
      if (!inputValue || inputValue.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Buscar en cada tipo de entidad
        const searchTerm = encodeURIComponent(inputValue.trim());
        
        const [personasRes, vehiculosRes, inmueblesRes] = await Promise.all([
          fetch(`/api/personas?buscar=${searchTerm}`).then(res => res.json()).catch(() => []),
          fetch(`/api/vehiculos?buscar=${searchTerm}`).then(res => res.json()).catch(() => []),
          fetch(`/api/inmuebles?buscar=${searchTerm}`).then(res => res.json()).catch(() => [])
        ]);

        const formattedResults: SearchResult[] = [];

        // Procesar resultados de personas
        personasRes.forEach((persona: any) => {
          formattedResults.push({
            id: persona.id,
            tipo: 'persona',
            texto: `${persona.nombre} ${persona.identificacion ? `(${persona.identificacion})` : ''}`,
            detalle: persona.alias && Array.isArray(persona.alias) && persona.alias.length > 0 
              ? `Alias: ${persona.alias.join(', ')}` 
              : undefined,
            entidad: persona
          });
        });

        // Procesar resultados de vehículos
        vehiculosRes.forEach((vehiculo: any) => {
          formattedResults.push({
            id: vehiculo.id,
            tipo: 'vehiculo',
            texto: `${vehiculo.marca} ${vehiculo.modelo || ''} (${vehiculo.placa})`,
            detalle: vehiculo.tipo ? `Tipo: ${vehiculo.tipo}` : undefined,
            entidad: vehiculo
          });
        });

        // Procesar resultados de inmuebles
        inmueblesRes.forEach((inmueble: any) => {
          formattedResults.push({
            id: inmueble.id,
            tipo: 'inmueble',
            texto: `${inmueble.tipo}: ${inmueble.direccion || 'Sin dirección'}`,
            detalle: inmueble.propietario ? `Propietario: ${inmueble.propietario}` : undefined,
            entidad: inmueble
          });
        });

        setResults(formattedResults);
        if (formattedResults.length > 0) {
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error buscando resultados:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce para evitar muchas peticiones mientras se escribe
    const timeoutId = setTimeout(searchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Si el valor ya no coincide con el item seleccionado, limpiar la selección
    if (selectedItem && selectedItem.texto !== value) {
      setSelectedItem(null);
    }
  };

  // Manejar selección de un resultado
  const handleSelectResult = (result: SearchResult) => {
    setSelectedItem(result);
    setInputValue(result.texto);
    setShowResults(false);
  };

  // Manejar tecla Enter y Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  // Manejar clic en botón de búsqueda
  const handleSearch = () => {
    onSearch(inputValue, selectedItem);
    setShowResults(false);
  };

  // Renderizar icono según el tipo
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

  // Renderizar etiqueta de tipo
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
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim().length >= 2 && setShowResults(true)}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch}
          className={searchButtonClass}
          size="sm"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista desplegable de resultados */}
      {showResults && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto"
        >
          <Card className="p-0">
            <div className="p-2 border-b flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {isLoading 
                  ? "Buscando..." 
                  : results.length 
                    ? `${results.length} resultados encontrados` 
                    : "No se encontraron coincidencias"}
              </p>
              <button 
                onClick={() => setShowResults(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ul className="p-0 m-0 list-none">
              {results.map((result) => (
                <li 
                  key={`${result.tipo}-${result.id}`}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="mr-2">
                    {renderIcon(result.tipo)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{result.texto}</p>
                      {renderTipoLabel(result.tipo)}
                    </div>
                    {result.detalle && (
                      <p className="text-xs text-gray-500 mt-0.5">{result.detalle}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Indicador de selección activa */}
      {selectedItem && (
        <div className="mt-1 flex items-center text-xs text-blue-600">
          <span>Seleccionado: </span>
          <span className="font-medium ml-1">{selectedItem.texto}</span>
          <button 
            onClick={() => {
              setSelectedItem(null);
              setInputValue('');
            }}
            className="ml-2 text-xs text-gray-500 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;