import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, User, Car, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EntitySearchProps {
  entityType: 'persona' | 'vehiculo' | 'inmueble' | 'ubicacion';
  placeholder?: string;
  onSelect: (entity: any) => void;
  selectedEntities?: any[];
  multiple?: boolean;
  disabled?: boolean;
}

interface SearchResult {
  id: number;
  nombre?: string;
  marca?: string;
  placa?: string;
  direccion?: string;
  tipo?: string;
  identificacion?: string;
  latitud?: number;
  longitud?: number;
}

export default function EntitySearch({
  entityType,
  placeholder,
  onSelect,
  selectedEntities = [],
  multiple = false,
  disabled = false
}: EntitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>(selectedEntities);

  // Configurar el endpoint y campos de búsqueda según el tipo de entidad
  const getEntityConfig = (type: string) => {
    switch (type) {
      case 'persona':
        return {
          endpoint: '/api/personas',
          searchFields: ['nombre', 'identificacion'],
          displayField: (item: any) => `${item.nombre || 'Sin nombre'} - ${item.identificacion || 'Sin ID'}`,
          icon: User,
          color: 'bg-blue-50 border-blue-200'
        };
      case 'vehiculo':
        return {
          endpoint: '/api/vehiculos',
          searchFields: ['placa', 'marca', 'modelo'],
          displayField: (item: any) => `${item.placa || 'Sin placa'} - ${item.marca || ''} ${item.modelo || ''}`.trim(),
          icon: Car,
          color: 'bg-green-50 border-green-200'
        };
      case 'inmueble':
        return {
          endpoint: '/api/inmuebles',
          searchFields: ['direccion', 'tipo'],
          displayField: (item: any) => `${item.tipo || 'Inmueble'} - ${item.direccion || 'Sin dirección'}`,
          icon: Building,
          color: 'bg-purple-50 border-purple-200'
        };
      case 'ubicacion':
        return {
          endpoint: '/api/ubicaciones',
          searchFields: ['tipo', 'observaciones'],
          displayField: (item: any) => `${item.tipo || 'Ubicación'} - Lat: ${item.latitud?.toFixed(6) || 'N/A'}, Lng: ${item.longitud?.toFixed(6) || 'N/A'}`,
          icon: MapPin,
          color: 'bg-red-50 border-red-200'
        };
      default:
        throw new Error(`Tipo de entidad no soportado: ${type}`);
    }
  };

  const config = getEntityConfig(entityType);
  const IconComponent = config.icon;

  // Cargar datos de la entidad
  const { data: allEntities = [], isLoading } = useQuery({
    queryKey: [config.endpoint],
    queryFn: async () => {
      const res = await fetch(config.endpoint);
      if (!res.ok) throw new Error(`Error al cargar ${entityType}s`);
      return res.json();
    }
  });

  // Filtrar resultados basados en la búsqueda
  const filteredResults = allEntities.filter((entity: SearchResult) => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase();
    return config.searchFields.some(field => {
      const value = entity[field as keyof SearchResult];
      return value && String(value).toLowerCase().includes(query);
    });
  });

  // Manejar selección de entidad
  const handleSelect = (entity: any) => {
    if (multiple) {
      const isAlreadySelected = selectedItems.some(item => item.id === entity.id);
      if (!isAlreadySelected) {
        const newSelection = [...selectedItems, entity];
        setSelectedItems(newSelection);
        onSelect(entity);
      }
    } else {
      setSelectedItems([entity]);
      onSelect(entity);
      setSearchQuery(config.displayField(entity));
    }
    setShowResults(false);
  };

  // Remover entidad seleccionada (solo para múltiple)
  const handleRemove = (entityId: number) => {
    const newSelection = selectedItems.filter(item => item.id !== entityId);
    setSelectedItems(newSelection);
  };

  // Actualizar selectedItems cuando cambie selectedEntities desde el padre
  useEffect(() => {
    setSelectedItems(selectedEntities);
  }, [selectedEntities]);

  return (
    <div className="space-y-2">
      {/* Campo de búsqueda */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder || `Buscar ${entityType}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setShowResults(true);
              }
            }}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Resultados de búsqueda */}
        {showResults && searchQuery.trim().length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="py-1">
                  {filteredResults.slice(0, 10).map((entity) => (
                    <button
                      key={entity.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      onClick={() => handleSelect(entity)}
                    >
                      <IconComponent className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{config.displayField(entity)}</span>
                    </button>
                  ))}
                  {filteredResults.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-500 border-t">
                      Mostrando 10 de {filteredResults.length} resultados
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No se encontraron resultados
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Entidades seleccionadas (solo para múltiple) */}
      {multiple && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((entity) => (
            <Badge
              key={entity.id}
              variant="secondary"
              className={`${config.color} flex items-center gap-1 pr-1`}
            >
              <IconComponent className="h-3 w-3" />
              <span className="text-xs">
                {config.displayField(entity)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-100"
                onClick={() => handleRemove(entity.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Entidad seleccionada (solo para único) */}
      {!multiple && selectedItems.length > 0 && (
        <Badge
          variant="secondary"
          className={`${config.color} flex items-center gap-1 pr-1 w-fit`}
        >
          <IconComponent className="h-3 w-3" />
          <span className="text-xs">
            {config.displayField(selectedItems[0])}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-red-100"
            onClick={() => {
              setSelectedItems([]);
              setSearchQuery("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}