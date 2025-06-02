import { useState } from "react";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import EntityDetails from "@/components/entity-details";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SearchResult } from "@/components/search-component";

export default function ConsultasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
  };

  const handleRelatedItemClick = (item: { id: number; tipo: any; nombre?: string; referencia?: string }) => {
    console.log("Ítem relacionado seleccionado:", item);
    
    // Crear un nuevo SearchResult basado en el ítem relacionado
    const newResult: SearchResult = {
      id: item.id,
      tipo: item.tipo,
      nombre: item.nombre || '',
      referencia: item.referencia || ''
    };
    
    // Actualizar el resultado seleccionado para realizar una nueva búsqueda
    setSelectedResult(newResult);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Consultas</h1>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {selectedResult ? (
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">Detalles del registro</h2>
                <Separator className="flex-1 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded bg-primary-100 text-primary-800 text-sm font-medium">
                    {selectedResult.tipo === 'persona' && 'Persona'}
                    {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                    {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                  </div>
                </div>
              </div>
              
              <EntityDetails 
                entityId={selectedResult.id} 
                entityType={selectedResult.tipo}
                onRelatedItemClick={handleRelatedItemClick}
              />
            </div>
          ) : (
            <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg">Realice una búsqueda para ver los resultados</p>
              <p className="text-sm text-center max-w-md">
                Los resultados mostrarán información detallada, observaciones y relaciones de la entidad seleccionada
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}