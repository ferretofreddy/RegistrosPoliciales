import { useState } from "react";
import MainLayout from "@/components/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import PersonaForm from "@/components/persona-form";
import VehiculoForm from "@/components/vehiculo-form";
import InmuebleForm from "@/components/inmueble-form";
import UbicacionForm from "@/components/ubicacion-form";

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = useState("personas");

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <Tabs defaultValue="personas" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="border-b border-gray-200 w-full rounded-none bg-white px-6">
              <TabsTrigger value="personas" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Personas
              </TabsTrigger>
              <TabsTrigger value="vehiculos" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Vehículos
              </TabsTrigger>
              <TabsTrigger value="inmuebles" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Inmuebles
              </TabsTrigger>
              <TabsTrigger value="ubicaciones" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Ubicaciones
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
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
}
