import { useState } from "react";
import MainLayout from "@/components/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import PersonaForm from "@/components/persona-form";
import VehiculoForm from "@/components/vehiculo-form";
import InmuebleForm from "@/components/inmueble-form";
import UbicacionForm from "@/components/ubicacion-form";
import SearchComponent, { SearchResult } from "@/components/search-component";
import UpdateEntityDetails from "@/components/update-entity-details";
import { User, Car, Building, MapPin, FileEdit, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = useState("personas");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <Tabs defaultValue="personas" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="border-b border-gray-200 w-full rounded-none bg-white px-1 sm:px-6">
              <TabsTrigger 
                value="personas" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-2 sm:px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <span className="flex items-center">
                  <User className="h-5 w-5 text-blue-500" />
                  <span className="hidden sm:inline-block ml-2">Personas</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="vehiculos" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-2 sm:px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <span className="flex items-center">
                  <Car className="h-5 w-5 text-green-500" />
                  <span className="hidden sm:inline-block ml-2">Vehículos</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="inmuebles" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-2 sm:px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <span className="flex items-center">
                  <Building className="h-5 w-5 text-purple-500" />
                  <span className="hidden sm:inline-block ml-2">Inmuebles</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="ubicaciones" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-2 sm:px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <span className="flex items-center">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <span className="hidden sm:inline-block ml-2">Ubicaciones</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="actualizar" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-2 sm:px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <span className="flex items-center">
                  <FileEdit className="h-5 w-5 text-amber-500" />
                  <span className="hidden sm:inline-block ml-2">Actualizar</span>
                </span>
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="p-6">
              <TabsContent value="personas">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Registro de Persona</h2>
                <PersonaForm />
              </TabsContent>
              
              <TabsContent value="vehiculos">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Registro de Vehículo</h2>
                <VehiculoForm />
              </TabsContent>
              
              <TabsContent value="inmuebles">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Registro de Inmueble</h2>
                <InmuebleForm />
              </TabsContent>
              
              <TabsContent value="ubicaciones">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Registro de Ubicación</h2>
                <UbicacionForm />
              </TabsContent>
              
              <TabsContent value="actualizar">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Actualizar Registros</h2>
                
                <div className="mb-6">
                  <SearchComponent onResultSelect={handleResultSelect} />
                </div>
                
                {selectedResult ? (
                  <div className="mt-6">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-bold">Gestión del registro</h2>
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
                    
                    <UpdateEntityDetails 
                      entityId={selectedResult.id} 
                      entityType={selectedResult.tipo} 
                    />
                  </div>
                ) : (
                  <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 text-gray-400" />
                    <p className="mb-2 text-lg">Busque un registro para actualizar</p>
                    <p className="text-sm text-center max-w-md">
                      Los resultados mostrarán información detallada, observaciones y relaciones de la entidad seleccionada
                    </p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
}
