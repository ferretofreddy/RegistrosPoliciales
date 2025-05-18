import { useState } from "react";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

type SearchResult = {
  id: number;
  nombre: string;
  tipo: "todas" | "persona" | "vehiculo" | "inmueble" | "ubicacion";
  referencia: string;
};

export default function ConsultasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    // Aquí podrías navegar a la página de detalle o mostrar información adicional
    console.log("Resultado seleccionado:", result);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Consultas</h1>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Búsqueda centralizada</AlertTitle>
            <AlertDescription>
              Utilice el buscador para encontrar información sobre personas, vehículos, inmuebles o ubicaciones registradas en el sistema.
            </AlertDescription>
          </Alert>
          
          {selectedResult && (
            <div className="mt-8 border p-4 rounded-md">
              <h2 className="text-xl font-bold mb-2">Resultado seleccionado</h2>
              <p><strong>Nombre:</strong> {selectedResult.nombre}</p>
              <p><strong>Referencia:</strong> {selectedResult.referencia}</p>
              <p><strong>Tipo:</strong> {selectedResult.tipo}</p>
              <p><strong>ID:</strong> {selectedResult.id}</p>
            </div>
          )}
          
          {!selectedResult && (
            <div className="border rounded-md p-4 min-h-[200px] flex flex-col items-center justify-center text-gray-500">
              <p className="mb-2">Realice una búsqueda para ver los resultados</p>
              <p className="text-sm">Los resultados aparecerán en esta área</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}