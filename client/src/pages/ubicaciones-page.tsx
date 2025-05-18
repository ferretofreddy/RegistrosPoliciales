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

  // Función para obtener ubicaciones relacionadas con personas
  const obtenerUbicacionesDePersonas = async (persona: PersonaEntity, tipoRelacion: "direct" | "related" = "direct") => {
    try {
      const respuesta = await fetch(`/api/relaciones/persona/${persona.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con esta persona
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        // Solo agregar la primera ubicación (domicilio principal)
        const ubicacion = data.ubicaciones[0];
        const lat = parseFloat(String(ubicacion.latitud));
        const lng = parseFloat(String(ubicacion.longitud));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`Añadiendo ubicación de ${persona.nombre}`);
          ubicaciones.push({
            id: ubicacion.id,
            lat: lat,
            lng: lng,
            title: "Domicilio",
            description: `Domicilio de ${persona.nombre}`,
            type: "ubicacion",
            relation: tipoRelacion,
            entityId: persona.id
          });
        }
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de persona ${persona.id}:`, error);
      return [];
    }
  };
  
  // Función para obtener ubicaciones relacionadas con inmuebles
  const obtenerUbicacionesDeInmuebles = async (inmueble: InmuebleEntity, tipoRelacion: "direct" | "related" = "direct") => {
    try {
      const respuesta = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con este inmueble
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        // Solo agregar la primera ubicación
        const ubicacion = data.ubicaciones[0];
        const lat = parseFloat(String(ubicacion.latitud));
        const lng = parseFloat(String(ubicacion.longitud));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`Añadiendo ubicación de inmueble ${inmueble.id}`);
          ubicaciones.push({
            id: ubicacion.id,
            lat: lat,
            lng: lng,
            title: inmueble.tipo || "Inmueble",
            description: inmueble.direccion || "Sin dirección",
            type: "inmueble",
            relation: tipoRelacion,
            entityId: inmueble.id
          });
        }
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de inmueble ${inmueble.id}:`, error);
      return [];
    }
  };
  
  // Función para obtener ubicaciones relacionadas con vehículos
  const obtenerUbicacionesDeVehiculos = async (vehiculo: VehiculoEntity, tipoRelacion: "direct" | "related" = "direct") => {
    try {
      const respuesta = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con este vehículo
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        // Solo agregar la primera ubicación
        const ubicacion = data.ubicaciones[0];
        const lat = parseFloat(String(ubicacion.latitud));
        const lng = parseFloat(String(ubicacion.longitud));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`Añadiendo ubicación de vehículo ${vehiculo.id}`);
          ubicaciones.push({
            id: ubicacion.id,
            lat: lat,
            lng: lng,
            title: `${vehiculo.marca} ${vehiculo.modelo}`,
            description: vehiculo.placa || "Sin placa",
            type: "vehiculo",
            relation: tipoRelacion,
            entityId: vehiculo.id
          });
        }
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de vehículo ${vehiculo.id}:`, error);
      return [];
    }
  };
  
  // Función para quitar duplicados de las ubicaciones
  const eliminarUbicacionesDuplicadas = (ubicaciones: LocationData[]): LocationData[] => {
    const ubicacionesUnicas = new Map<string, LocationData>();
    
    ubicaciones.forEach(ub => {
      const key = `${ub.lat}-${ub.lng}`;
      if (!ubicacionesUnicas.has(key)) {
        ubicacionesUnicas.set(key, ub);
      }
    });
    
    return Array.from(ubicacionesUnicas.values());
  };
  
  // Procesamiento principal de datos para el mapa
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!selectedResult) {
        setLocations([]);
        return;
      }

      console.log("Procesando datos para:", selectedResult);
      console.log("Entity Data:", entityData);
      console.log("Relation Data:", relationData);

      const ubicacionesEncontradas: LocationData[] = [];
      const ubicacionesYaProcesadas = new Set<number>();
      let hasCenteredMap = false;
      
      // Paso 1: Procesar la entidad principal seleccionada
      if (entityData) {
        if (selectedResult.tipo === "ubicacion") {
          // Si es una ubicación directa
          const ubicacion = entityData as UbicacionEntity;
          if (ubicacion.latitud && ubicacion.longitud) {
            ubicacionesEncontradas.push({
              id: ubicacion.id,
              lat: ubicacion.latitud,
              lng: ubicacion.longitud,
              title: ubicacion.tipo || "Ubicación",
              description: ubicacion.observaciones || "Sin descripción",
              type: "ubicacion",
              relation: "direct",
              entityId: ubicacion.id
            });
            
            ubicacionesYaProcesadas.add(ubicacion.id);
            setMapCenter([ubicacion.latitud, ubicacion.longitud]);
            hasCenteredMap = true;
          }
        } else if (selectedResult.tipo === "persona") {
          // Si es una persona, obtener sus ubicaciones directas (domicilios)
          const persona = entityData as PersonaEntity;
          const ubicacionesDirectas = await obtenerUbicacionesDePersonas(persona, "direct");
          
          ubicacionesDirectas.forEach(ub => {
            ubicacionesEncontradas.push(ub);
            ubicacionesYaProcesadas.add(ub.id);
          });
          
          if (ubicacionesDirectas.length > 0 && !hasCenteredMap) {
            setMapCenter([ubicacionesDirectas[0].lat, ubicacionesDirectas[0].lng]);
            hasCenteredMap = true;
          }
        } else if (selectedResult.tipo === "inmueble") {
          // Si es un inmueble, obtener sus ubicaciones directas
          const inmueble = entityData as InmuebleEntity;
          const ubicacionesDirectas = await obtenerUbicacionesDeInmuebles(inmueble, "direct");
          
          ubicacionesDirectas.forEach(ub => {
            ubicacionesEncontradas.push(ub);
            ubicacionesYaProcesadas.add(ub.id);
          });
          
          if (ubicacionesDirectas.length > 0 && !hasCenteredMap) {
            setMapCenter([ubicacionesDirectas[0].lat, ubicacionesDirectas[0].lng]);
            hasCenteredMap = true;
          }
        } else if (selectedResult.tipo === "vehiculo") {
          // Si es un vehículo, obtener sus ubicaciones directas y las de sus propietarios
          const vehiculo = entityData as VehiculoEntity;
          const ubicacionesDirectas = await obtenerUbicacionesDeVehiculos(vehiculo, "direct");
          
          ubicacionesDirectas.forEach(ub => {
            ubicacionesEncontradas.push(ub);
            ubicacionesYaProcesadas.add(ub.id);
          });
          
          if (ubicacionesDirectas.length > 0 && !hasCenteredMap) {
            setMapCenter([ubicacionesDirectas[0].lat, ubicacionesDirectas[0].lng]);
            hasCenteredMap = true;
          }
        }
      }
      
      // Paso 2: Procesar relaciones para obtener ubicaciones relacionadas
      if (relationData) {
        // Procesar ubicaciones directamente relacionadas
        if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
          for (const ubicacion of relationData.ubicaciones) {
            // Evitar duplicados
            if (ubicacionesYaProcesadas.has(ubicacion.id)) continue;
            
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat: lat,
                lng: lng,
                title: ubicacion.tipo || "Ubicación",
                description: ubicacion.observaciones || "Sin descripción",
                type: "ubicacion",
                relation: "direct",
                entityId: ubicacion.id
              });
              
              ubicacionesYaProcesadas.add(ubicacion.id);
              
              if (!hasCenteredMap) {
                setMapCenter([lat, lng]);
                hasCenteredMap = true;
              }
            }
          }
        }
        
        // Procesar personas relacionadas
        if (relationData.personas && relationData.personas.length > 0) {
          for (const persona of relationData.personas) {
            const ubicacionesRelacionadas = await obtenerUbicacionesDePersonas(persona, "related");
            
            for (const ub of ubicacionesRelacionadas) {
              if (!ubicacionesYaProcesadas.has(ub.id)) {
                ubicacionesEncontradas.push(ub);
                ubicacionesYaProcesadas.add(ub.id);
                
                if (!hasCenteredMap) {
                  setMapCenter([ub.lat, ub.lng]);
                  hasCenteredMap = true;
                }
              }
            }
          }
        }
        
        // Procesar inmuebles relacionados
        if (relationData.inmuebles && relationData.inmuebles.length > 0) {
          for (const inmueble of relationData.inmuebles) {
            const ubicacionesRelacionadas = await obtenerUbicacionesDeInmuebles(inmueble, "related");
            
            for (const ub of ubicacionesRelacionadas) {
              if (!ubicacionesYaProcesadas.has(ub.id)) {
                ubicacionesEncontradas.push(ub);
                ubicacionesYaProcesadas.add(ub.id);
                
                if (!hasCenteredMap) {
                  setMapCenter([ub.lat, ub.lng]);
                  hasCenteredMap = true;
                }
              }
            }
          }
        }
        
        // Procesar vehículos relacionados
        if (relationData.vehiculos && relationData.vehiculos.length > 0) {
          for (const vehiculo of relationData.vehiculos) {
            // Ubicaciones directas del vehículo
            const ubicacionesRelacionadas = await obtenerUbicacionesDeVehiculos(vehiculo, "related");
            
            for (const ub of ubicacionesRelacionadas) {
              if (!ubicacionesYaProcesadas.has(ub.id)) {
                ubicacionesEncontradas.push(ub);
                ubicacionesYaProcesadas.add(ub.id);
                
                if (!hasCenteredMap) {
                  setMapCenter([ub.lat, ub.lng]);
                  hasCenteredMap = true;
                }
              }
            }
            
            // Buscar personas relacionadas con el vehículo
            const respuestaVehiculo = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
            const dataVehiculo = await respuestaVehiculo.json();
            
            if (dataVehiculo.personas && dataVehiculo.personas.length > 0) {
              for (const personaVehiculo of dataVehiculo.personas) {
                const ubicacionesPersonaVehiculo = await obtenerUbicacionesDePersonas(personaVehiculo, "related");
                
                for (const ub of ubicacionesPersonaVehiculo) {
                  if (!ubicacionesYaProcesadas.has(ub.id)) {
                    // Modificar la descripción para que sea más informativa
                    const ubicacionModificada = {
                      ...ub,
                      description: `Domicilio de ${personaVehiculo.nombre} (dueño de ${vehiculo.marca} ${vehiculo.modelo})`
                    };
                    
                    ubicacionesEncontradas.push(ubicacionModificada);
                    ubicacionesYaProcesadas.add(ub.id);
                    
                    if (!hasCenteredMap) {
                      setMapCenter([ub.lat, ub.lng]);
                      hasCenteredMap = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      console.log("Ubicaciones encontradas:", ubicacionesEncontradas);
      setLocations(ubicacionesEncontradas);
      
      // Si no hay ubicaciones, mostrar mensaje
      if (ubicacionesEncontradas.length === 0) {
        console.log("No se encontraron ubicaciones para la entidad seleccionada o sus relaciones.");
      }
    };
    
    cargarUbicaciones();
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