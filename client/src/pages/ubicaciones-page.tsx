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
  const obtenerUbicacionesDePersonas = async (persona: PersonaEntity) => {
    try {
      const respuesta = await fetch(`/api/relaciones/persona/${persona.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con esta persona
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        data.ubicaciones.forEach((ubicacion: any) => {
          const lat = parseFloat(String(ubicacion.latitud));
          const lng = parseFloat(String(ubicacion.longitud));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`Añadiendo ubicación de ${persona.nombre}:`, ubicacion);
            ubicaciones.push({
              id: ubicacion.id,
              lat: lat,
              lng: lng,
              title: ubicacion.tipo || "Domicilio",
              description: ubicacion.observaciones || `Domicilio de ${persona.nombre}`,
              type: "ubicacion",
              relation: "direct",
              entityId: persona.id
            });
          }
        });
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de persona ${persona.id}:`, error);
      return [];
    }
  };
  
  // Función para obtener ubicaciones relacionadas con inmuebles
  const obtenerUbicacionesDeInmuebles = async (inmueble: InmuebleEntity) => {
    try {
      const respuesta = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con este inmueble
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        data.ubicaciones.forEach((ubicacion: any) => {
          const lat = parseFloat(String(ubicacion.latitud));
          const lng = parseFloat(String(ubicacion.longitud));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`Añadiendo ubicación de inmueble ${inmueble.id}:`, ubicacion);
            ubicaciones.push({
              id: ubicacion.id,
              lat: lat,
              lng: lng,
              title: inmueble.tipo || "Inmueble",
              description: inmueble.direccion || "Sin dirección",
              type: "inmueble",
              relation: "direct",
              entityId: inmueble.id
            });
          }
        });
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de inmueble ${inmueble.id}:`, error);
      return [];
    }
  };
  
  // Función para obtener ubicaciones relacionadas con vehículos
  const obtenerUbicacionesDeVehiculos = async (vehiculo: VehiculoEntity) => {
    try {
      const respuesta = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
      const data = await respuesta.json();
      const ubicaciones: LocationData[] = [];
      
      // Añadir ubicaciones directamente relacionadas con este vehículo
      if (data.ubicaciones && data.ubicaciones.length > 0) {
        data.ubicaciones.forEach((ubicacion: any) => {
          const lat = parseFloat(String(ubicacion.latitud));
          const lng = parseFloat(String(ubicacion.longitud));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`Añadiendo ubicación de vehículo ${vehiculo.id}:`, ubicacion);
            ubicaciones.push({
              id: ubicacion.id,
              lat: lat,
              lng: lng,
              title: `${vehiculo.marca} ${vehiculo.modelo}`,
              description: vehiculo.placa || "Sin placa",
              type: "vehiculo",
              relation: "direct",
              entityId: vehiculo.id
            });
          }
        });
      }
      return ubicaciones;
    } catch (error) {
      console.error(`Error al obtener ubicaciones de vehículo ${vehiculo.id}:`, error);
      return [];
    }
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

      const todasLasUbicaciones: LocationData[] = [];
      let hasCenteredMap = false;
      
      // Paso 1: Procesar la entidad principal seleccionada
      if (entityData) {
        if (selectedResult.tipo === "ubicacion") {
          // Si es una ubicación directa
          const ubicacion = entityData as UbicacionEntity;
          if (ubicacion.latitud && ubicacion.longitud) {
            todasLasUbicaciones.push({
              id: ubicacion.id,
              lat: ubicacion.latitud,
              lng: ubicacion.longitud,
              title: ubicacion.tipo || "Ubicación",
              description: ubicacion.observaciones || "Sin descripción",
              type: "ubicacion",
              relation: "direct",
              entityId: ubicacion.id
            });
            
            setMapCenter([ubicacion.latitud, ubicacion.longitud]);
            hasCenteredMap = true;
          }
        } else if (selectedResult.tipo === "persona") {
          // Si es una persona, obtener sus ubicaciones directas (domicilios)
          const persona = entityData as PersonaEntity;
          const ubicacionesPersona = await obtenerUbicacionesDePersonas(persona);
          
          if (ubicacionesPersona.length > 0) {
            todasLasUbicaciones.push(...ubicacionesPersona);
            
            if (!hasCenteredMap) {
              setMapCenter([ubicacionesPersona[0].lat, ubicacionesPersona[0].lng]);
              hasCenteredMap = true;
            }
          }
        } else if (selectedResult.tipo === "inmueble") {
          // Si es un inmueble, obtener sus ubicaciones directas
          const inmueble = entityData as InmuebleEntity;
          const ubicacionesInmueble = await obtenerUbicacionesDeInmuebles(inmueble);
          
          if (ubicacionesInmueble.length > 0) {
            todasLasUbicaciones.push(...ubicacionesInmueble);
            
            if (!hasCenteredMap) {
              setMapCenter([ubicacionesInmueble[0].lat, ubicacionesInmueble[0].lng]);
              hasCenteredMap = true;
            }
          }
        } else if (selectedResult.tipo === "vehiculo") {
          // Si es un vehículo, obtener sus ubicaciones directas
          const vehiculo = entityData as VehiculoEntity;
          const ubicacionesVehiculo = await obtenerUbicacionesDeVehiculos(vehiculo);
          
          if (ubicacionesVehiculo.length > 0) {
            todasLasUbicaciones.push(...ubicacionesVehiculo);
            
            if (!hasCenteredMap) {
              setMapCenter([ubicacionesVehiculo[0].lat, ubicacionesVehiculo[0].lng]);
              hasCenteredMap = true;
            }
          }
        }
      }
      
      // Paso 2: Procesar relaciones para obtener ubicaciones relacionadas
      if (relationData) {
        // Procesar personas relacionadas y sus ubicaciones
        if (relationData.personas && relationData.personas.length > 0) {
          console.log("Procesando ubicaciones de personas relacionadas");
          
          for (const persona of relationData.personas) {
            const ubicacionesPersonaRelacionada = await obtenerUbicacionesDePersonas(persona);
            
            // Marcar estas ubicaciones como relacionadas
            const ubicacionesRelacionadas = ubicacionesPersonaRelacionada.map(ub => ({
              ...ub,
              relation: "related" as "related"
            }));
            
            todasLasUbicaciones.push(...ubicacionesRelacionadas);
            
            if (!hasCenteredMap && ubicacionesRelacionadas.length > 0) {
              setMapCenter([ubicacionesRelacionadas[0].lat, ubicacionesRelacionadas[0].lng]);
              hasCenteredMap = true;
            }
          }
        }
        
        // Procesar inmuebles relacionados y sus ubicaciones
        if (relationData.inmuebles && relationData.inmuebles.length > 0) {
          console.log("Procesando ubicaciones de inmuebles relacionados");
          
          for (const inmueble of relationData.inmuebles) {
            const ubicacionesInmuebleRelacionado = await obtenerUbicacionesDeInmuebles(inmueble);
            
            // Marcar estas ubicaciones como relacionadas
            const ubicacionesRelacionadas = ubicacionesInmuebleRelacionado.map(ub => ({
              ...ub,
              relation: "related" as "related"
            }));
            
            todasLasUbicaciones.push(...ubicacionesRelacionadas);
            
            if (!hasCenteredMap && ubicacionesRelacionadas.length > 0) {
              setMapCenter([ubicacionesRelacionadas[0].lat, ubicacionesRelacionadas[0].lng]);
              hasCenteredMap = true;
            }
          }
        }
        
        // Procesar vehículos relacionados y sus ubicaciones
        if (relationData.vehiculos && relationData.vehiculos.length > 0) {
          console.log("Procesando ubicaciones de vehículos relacionados");
          
          for (const vehiculo of relationData.vehiculos) {
            const ubicacionesVehiculoRelacionado = await obtenerUbicacionesDeVehiculos(vehiculo);
            
            // Marcar estas ubicaciones como relacionadas
            const ubicacionesRelacionadas = ubicacionesVehiculoRelacionado.map(ub => ({
              ...ub,
              relation: "related" as "related"
            }));
            
            todasLasUbicaciones.push(...ubicacionesRelacionadas);
            
            if (!hasCenteredMap && ubicacionesRelacionadas.length > 0) {
              setMapCenter([ubicacionesRelacionadas[0].lat, ubicacionesRelacionadas[0].lng]);
              hasCenteredMap = true;
            }
            
            // Buscar las personas relacionadas con este vehículo y sus ubicaciones
            const respuestaVehiculo = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
            const dataVehiculo = await respuestaVehiculo.json();
            
            if (dataVehiculo.personas && dataVehiculo.personas.length > 0) {
              for (const personaVehiculo of dataVehiculo.personas) {
                const ubicacionesPersonaVehiculo = await obtenerUbicacionesDePersonas(personaVehiculo);
                
                // Marcar estas ubicaciones como relacionadas
                const ubicacionesRelPersonaVehiculo = ubicacionesPersonaVehiculo.map(ub => ({
                  ...ub,
                  relation: "related" as "related",
                  description: `Domicilio de ${personaVehiculo.nombre} (relacionado con vehículo ${vehiculo.marca} ${vehiculo.modelo})`
                }));
                
                todasLasUbicaciones.push(...ubicacionesRelPersonaVehiculo);
                
                if (!hasCenteredMap && ubicacionesRelPersonaVehiculo.length > 0) {
                  setMapCenter([ubicacionesRelPersonaVehiculo[0].lat, ubicacionesRelPersonaVehiculo[0].lng]);
                  hasCenteredMap = true;
                }
              }
            }
          }
        }
        
        // Procesar ubicaciones directamente relacionadas
        if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
          console.log("Procesando ubicaciones directamente relacionadas");
          
          relationData.ubicaciones.forEach((ubicacion) => {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              todasLasUbicaciones.push({
                id: ubicacion.id,
                lat: lat,
                lng: lng,
                title: ubicacion.tipo || "Ubicación",
                description: ubicacion.observaciones || "Sin descripción",
                type: "ubicacion",
                relation: "direct",
                entityId: ubicacion.id
              });
              
              if (!hasCenteredMap) {
                setMapCenter([lat, lng]);
                hasCenteredMap = true;
              }
            }
          });
        }
      }
      
      console.log("Todas las ubicaciones encontradas:", todasLasUbicaciones);
      setLocations(todasLasUbicaciones);
      
      // Si no hay ubicaciones, mostrar mensaje
      if (todasLasUbicaciones.length === 0) {
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