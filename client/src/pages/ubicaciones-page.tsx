import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";
import { SearchResult, EntityType } from "@/components/search-component";
import { 
  PersonaEntity, 
  VehiculoEntity, 
  InmuebleEntity, 
  UbicacionEntity, 
  RelacionesResponse 
} from "@/types/api-types";

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]); // Costa Rica centro
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  // Manejar la selección de un resultado
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
  };

  // Obtener datos de la entidad seleccionada
  const { data: entityData, isLoading: isLoadingEntity } = useQuery<
    PersonaEntity | VehiculoEntity | InmuebleEntity | UbicacionEntity
  >({
    queryKey: [selectedResult ? `api/${selectedResult.tipo === "ubicacion" ? "ubicaciones" : selectedResult.tipo + "s"}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Obtener relaciones para buscar ubicaciones
  const { data: relationData, isLoading: isLoadingRelations } = useQuery<RelacionesResponse>({
    queryKey: [selectedResult ? `api/relaciones/${selectedResult.tipo}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Procesar los datos y crear las ubicaciones para el mapa y la tabla
  useEffect(() => {
    if (!selectedResult) {
      setLocations([]);
      return;
    }

    console.log("Procesando datos para:", selectedResult);
    console.log("Entity Data:", entityData);
    console.log("Relation Data:", relationData);

    const newLocations: LocationData[] = [];
    let hasCenteredMap = false;
    
    // Procesar los datos según el tipo de entidad seleccionada
    if (entityData) {
      // Para ubicaciones directas
      if (selectedResult.tipo === "ubicacion") {
        const ubicacion = entityData as UbicacionEntity;
        if (ubicacion.latitud && ubicacion.longitud) {
          newLocations.push({
            id: ubicacion.id,
            lat: ubicacion.latitud,
            lng: ubicacion.longitud,
            title: ubicacion.tipo || "Ubicación",
            description: ubicacion.observaciones || "Sin descripción",
            type: "ubicacion",
            relation: "direct",
            entityId: ubicacion.id
          });
          
          // Centrar el mapa en la ubicación
          setMapCenter([ubicacion.latitud, ubicacion.longitud]);
          hasCenteredMap = true;
        }
      }
      
      // Para personas
      else if (selectedResult.tipo === "persona") {
        const persona = entityData as PersonaEntity;
        if (persona.latitud && persona.longitud) {
          newLocations.push({
            id: persona.id,
            lat: persona.latitud,
            lng: persona.longitud,
            title: persona.nombre || "Persona",
            description: persona.identificacion || "Sin identificación",
            type: "persona",
            relation: "direct",
            entityId: persona.id
          });
          
          // Centrar el mapa en esta ubicación
          setMapCenter([persona.latitud, persona.longitud]);
          hasCenteredMap = true;
        }
      }
      
      // Para vehículos
      else if (selectedResult.tipo === "vehiculo") {
        const vehiculo = entityData as VehiculoEntity;
        if (vehiculo.latitud && vehiculo.longitud) {
          newLocations.push({
            id: vehiculo.id,
            lat: vehiculo.latitud,
            lng: vehiculo.longitud,
            title: `${vehiculo.marca} ${vehiculo.modelo}` || "Vehículo",
            description: vehiculo.placa || "Sin placa",
            type: "vehiculo",
            relation: "direct",
            entityId: vehiculo.id
          });
          
          // Centrar el mapa en esta ubicación
          setMapCenter([vehiculo.latitud, vehiculo.longitud]);
          hasCenteredMap = true;
        }
      }
      
      // Para inmuebles
      else if (selectedResult.tipo === "inmueble") {
        const inmueble = entityData as InmuebleEntity;
        if (inmueble.latitud && inmueble.longitud) {
          newLocations.push({
            id: inmueble.id,
            lat: inmueble.latitud,
            lng: inmueble.longitud,
            title: inmueble.tipo || "Inmueble",
            description: inmueble.direccion || "Sin dirección",
            type: "inmueble",
            relation: "direct",
            entityId: inmueble.id
          });
          
          // Centrar el mapa en esta ubicación
          setMapCenter([inmueble.latitud, inmueble.longitud]);
          hasCenteredMap = true;
        }
      }
    }
    
    // Procesar relaciones
    if (relationData) {
      // Procesar ubicaciones relacionadas
      if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
        console.log("Procesando ubicaciones relacionadas:", relationData.ubicaciones);
        
        // Mostramos cada ubicación relacionada
        relationData.ubicaciones.forEach((ubicacion) => {
          console.log("Verificando ubicación:", ubicacion);
          
          // Nos aseguramos de que tenga coordenadas y sean números válidos
          const latitud = parseFloat(String(ubicacion.latitud));
          const longitud = parseFloat(String(ubicacion.longitud));
          
          if (!isNaN(latitud) && !isNaN(longitud)) {
            console.log(`Añadiendo ubicación: ${latitud}, ${longitud}`);
            
            // Generamos un mensaje más informativo sobre la relación
            let infoRelacion = "";
            
            if (selectedResult.tipo === "persona") {
              const persona = entityData as PersonaEntity;
              infoRelacion = `Ubicación relacionada con ${persona.nombre}`;
            } else if (selectedResult.tipo === "vehiculo") {
              const vehiculo = entityData as VehiculoEntity;
              infoRelacion = `Ubicación relacionada con vehículo ${vehiculo.marca} ${vehiculo.modelo}`;
            } else if (selectedResult.tipo === "inmueble") {
              const inmueble = entityData as InmuebleEntity;
              infoRelacion = `Ubicación relacionada con inmueble ${inmueble.tipo} en ${inmueble.direccion}`;
            }
            
            newLocations.push({
              id: ubicacion.id,
              lat: latitud,
              lng: longitud,
              title: ubicacion.tipo || "Ubicación",
              description: ubicacion.observaciones || "Sin descripción",
              type: "ubicacion",
              relation: "related",
              entityId: ubicacion.id,
              relationInfo: infoRelacion
            });
            
            // Si no hay ubicación directa, centrar en la primera ubicación relacionada
            if (!hasCenteredMap) {
              console.log(`Centrando mapa en: ${latitud}, ${longitud}`);
              setMapCenter([latitud, longitud]);
              hasCenteredMap = true;
            }
          } else {
            console.log(`Ubicación sin coordenadas válidas: ${ubicacion.id}`);
          }
        });
      }
      
      // Procesar inmuebles relacionados (si tienen coordenadas)
      if (relationData.inmuebles && relationData.inmuebles.length > 0) {
        console.log("Procesando inmuebles relacionados:", relationData.inmuebles);
        relationData.inmuebles.forEach((inmueble) => {
          // Nos aseguramos de que tenga coordenadas y sean números válidos
          const latitud = parseFloat(String(inmueble.latitud));
          const longitud = parseFloat(String(inmueble.longitud));
          
          if (!isNaN(latitud) && !isNaN(longitud)) {
            console.log(`Añadiendo inmueble: ${latitud}, ${longitud}`);
            
            // Generamos un mensaje más informativo sobre la relación con el inmueble
            let infoRelacion = "";
            
            if (selectedResult.tipo === "persona") {
              const persona = entityData as PersonaEntity;
              infoRelacion = `Inmueble relacionado con ${persona.nombre}`;
            } else if (selectedResult.tipo === "vehiculo") {
              const vehiculo = entityData as VehiculoEntity;
              infoRelacion = `Inmueble relacionado con vehículo ${vehiculo.marca} ${vehiculo.modelo}`;
            } else if (selectedResult.tipo === "ubicacion") {
              const ubicacion = entityData as UbicacionEntity;
              infoRelacion = `Inmueble cercano a ubicación ${ubicacion.tipo || ""}`;
            }
            
            newLocations.push({
              id: inmueble.id,
              lat: latitud,
              lng: longitud,
              title: inmueble.tipo || "Inmueble",
              description: inmueble.direccion || "Sin dirección",
              type: "inmueble",
              relation: "related",
              entityId: inmueble.id,
              relationInfo: infoRelacion
            });
            
            // Si no hay ubicación directa, centrar en el primer inmueble
            if (!hasCenteredMap) {
              console.log(`Centrando mapa en inmueble: ${latitud}, ${longitud}`);
              setMapCenter([latitud, longitud]);
              hasCenteredMap = true;
            }
          } else {
            console.log(`Inmueble sin coordenadas válidas: ${inmueble.id}`);
          }
        });
      }
      
      // Procesar personas relacionadas (si tienen coordenadas en su dirección)
      if (relationData.personas && relationData.personas.length > 0) {
        console.log("Procesando personas relacionadas:", relationData.personas);
        relationData.personas.forEach((persona) => {
          // Nos aseguramos de que tenga coordenadas y sean números válidos
          const latitud = parseFloat(String(persona.latitud));
          const longitud = parseFloat(String(persona.longitud));
          
          if (!isNaN(latitud) && !isNaN(longitud)) {
            console.log(`Añadiendo persona: ${latitud}, ${longitud}`);
            
            // Generamos un mensaje más informativo sobre la relación con la persona
            let infoRelacion = "";
            
            if (selectedResult.tipo === "vehiculo") {
              const vehiculo = entityData as VehiculoEntity;
              infoRelacion = `Persona relacionada con vehículo ${vehiculo.marca} ${vehiculo.modelo}`;
            } else if (selectedResult.tipo === "inmueble") {
              const inmueble = entityData as InmuebleEntity;
              infoRelacion = `Persona relacionada con inmueble en ${inmueble.direccion}`;
            } else if (selectedResult.tipo === "ubicacion") {
              const ubicacion = entityData as UbicacionEntity;
              infoRelacion = `Persona relacionada con ubicación ${ubicacion.tipo || ""}`;
            } else if (selectedResult.tipo === "persona") {
              const otraPersona = entityData as PersonaEntity;
              infoRelacion = `Persona relacionada con ${otraPersona.nombre}`;
            }
            
            newLocations.push({
              id: persona.id,
              lat: latitud,
              lng: longitud,
              title: persona.nombre || "Persona",
              description: persona.identificacion || "Sin identificación",
              type: "persona",
              relation: "related",
              entityId: persona.id,
              relationInfo: infoRelacion
            });
            
            // Si no hay ubicación directa, centrar en la persona
            if (!hasCenteredMap) {
              console.log(`Centrando mapa en persona: ${latitud}, ${longitud}`);
              setMapCenter([latitud, longitud]);
              hasCenteredMap = true;
            }
          } else {
            console.log(`Persona sin coordenadas válidas: ${persona.id}`);
          }
        });
      }
      
      // Procesar vehículos relacionados (si tienen ubicaciones registradas)
      if (relationData.vehiculos && relationData.vehiculos.length > 0) {
        console.log("Procesando vehículos relacionados:", relationData.vehiculos);
        relationData.vehiculos.forEach((vehiculo) => {
          // Nos aseguramos de que tenga coordenadas y sean números válidos
          const latitud = parseFloat(String(vehiculo.latitud));
          const longitud = parseFloat(String(vehiculo.longitud));
          
          if (!isNaN(latitud) && !isNaN(longitud)) {
            console.log(`Añadiendo vehículo: ${latitud}, ${longitud}`);
            
            newLocations.push({
              id: vehiculo.id,
              lat: latitud,
              lng: longitud,
              title: `${vehiculo.marca} ${vehiculo.modelo}` || "Vehículo",
              description: vehiculo.placa || "Sin placa",
              type: "vehiculo",
              relation: "related",
              entityId: vehiculo.id,
              relationInfo: "Vehículo relacionado"
            });
            
            // Si no hay ubicación directa, centrar en el vehículo
            if (!hasCenteredMap) {
              console.log(`Centrando mapa en vehículo: ${latitud}, ${longitud}`);
              setMapCenter([latitud, longitud]);
              hasCenteredMap = true;
            }
          } else {
            console.log(`Vehículo sin coordenadas válidas: ${vehiculo.id}`);
          }
        });
      }
    }
    
    console.log("Ubicaciones encontradas:", newLocations);
    setLocations(newLocations);
    
    // Si no hay ubicaciones, mostrar mensaje
    if (newLocations.length === 0) {
      console.log("No se encontraron ubicaciones para la entidad seleccionada o sus relaciones.");
    }
  }, [selectedResult, entityData, relationData]);

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setSelectedLocation(location);
    setMapCenter([location.lat, location.lng]);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Ubicaciones</h1>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {selectedResult ? (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">Ubicaciones de {selectedResult.nombre}</h2>
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
              
              {/* Sección del Mapa */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    <span>Mapa de Ubicaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locations.length > 0 ? (
                    <LocationMap 
                      markers={locations.map(loc => ({
                        id: loc.id,
                        lat: loc.lat,
                        lng: loc.lng,
                        title: loc.title,
                        description: loc.description,
                        type: loc.type,
                        relation: loc.relation,
                        entityId: loc.entityId,
                        relationInfo: loc.relationInfo
                      }))} 
                      center={mapCenter}
                      zoom={15}
                    />
                  ) : (
                    <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                      <MapPin className="h-12 w-12 mb-4 text-gray-400" />
                      <p className="mb-2 text-lg">No se encontraron ubicaciones</p>
                      <p className="text-sm text-center max-w-md">
                        Esta entidad no tiene coordenadas registradas ni relaciones con coordenadas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tabla de Ubicaciones */}
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ubicaciones Encontradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationsTable 
                    locations={locations}
                    onLocationClick={handleLocationClick}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg">Realice una búsqueda para ver ubicaciones</p>
              <p className="text-sm text-center max-w-md">
                Seleccione una persona, vehículo, inmueble o ubicación para ver sus coordenadas en el mapa
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}