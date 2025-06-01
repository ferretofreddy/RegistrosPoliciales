import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, User, Building, Car, FileText } from "lucide-react";
import { SearchResult } from "@/components/search-component";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Coordenadas por defecto (centro de Costa Rica)
const DEFAULT_CENTER: [number, number] = [9.9281, -84.0907];
const DEFAULT_ZOOM = 7;

// Tipos de entidades
type EntityType = "persona" | "vehiculo" | "inmueble" | "ubicacion";

// Interfaz para ubicaciones
interface UbicacionEntidad {
  id: number;
  latitud: number;
  longitud: number;
  tipo?: string;
  observaciones?: string;
}

// Interfaces para respuestas de API
interface PersonaEntity {
  id: number;
  nombre: string;
}

interface VehiculoEntity {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
}

interface InmuebleEntity {
  id: number;
  direccion: string;
  tipo?: string;
}

interface UbicacionEntity {
  id: number;
  latitud: number;
  longitud: number;
  tipo?: string;
  observaciones?: string;
}

interface RelacionesResponse {
  personas?: PersonaEntity[];
  vehiculos?: VehiculoEntity[];
  inmuebles?: InmuebleEntity[];
  ubicaciones?: UbicacionEntity[];
  otrasUbicaciones?: UbicacionEntity[];
}

export default function UbicacionesPage() {
  const [selectedEntity, setSelectedEntity] = useState<SearchResult | null>(null);
  const [relationData, setRelationData] = useState<RelacionesResponse | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Función para obtener relaciones de una entidad
  const fetchRelations = async (entityType: EntityType, entityId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/relaciones/${entityType}/${entityId}`);
      if (!response.ok) {
        throw new Error("Error al obtener relaciones");
      }
      const data = await response.json();
      setRelationData(data);
      return data;
    } catch (error) {
      console.error("Error fetching relations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las relaciones",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para convertir ubicaciones a formato LocationData
  const convertToLocationData = (ubicaciones: UbicacionEntity[], type: string, relation: 'direct' | 'related' = 'direct'): LocationData[] => {
    if (!ubicaciones) return [];
    
    return ubicaciones.map(ubicacion => ({
      id: ubicacion.id,
      lat: ubicacion.latitud,
      lng: ubicacion.longitud,
      title: ubicacion.tipo || "Ubicación",
      description: ubicacion.observaciones || "Sin observaciones",
      type: type as EntityType,
      relation,
      entityId: ubicacion.id
    }));
  };

  // Función para procesar las ubicaciones de una entidad específica
  const processEntityLocations = async (entity: SearchResult) => {
    console.log("[UBICACIONES] Procesando entidad:", entity.tipo, entity);
    
    let directLocations: LocationData[] = [];
    let relatedLocations: LocationData[] = [];
    let entityType: EntityType = "ubicacion";

    // Obtener relaciones de la entidad
    const relations = await fetchRelations(entity.tipo as EntityType, entity.id);

    if (entity.tipo === "persona") {
      entityType = "persona";
      
      // UBICACIONES DIRECTAS: Domicilios de la persona (vía personas_ubicaciones)
      try {
        const personaResponse = await fetch(`/api/personas/${entity.id}`);
        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          if (personaData.domicilios && personaData.domicilios.length > 0) {
            directLocations = personaData.domicilios.map((domicilio: string, index: number) => ({
              id: entity.id + index * 1000, // ID único para cada domicilio
              lat: 9.9281 + (Math.random() - 0.5) * 0.1,
              lng: -84.0907 + (Math.random() - 0.5) * 0.1,
              title: "Domicilio",
              description: `Domicilio de ${personaData.nombre}: ${domicilio}`,
              type: "persona" as EntityType,
              relation: "direct" as const,
              entityId: entity.id
            }));
          }
        }
      } catch (error) {
        console.error("Error obteniendo datos de persona:", error);
      }

      // UBICACIONES RELACIONADAS: Domicilios de personas relacionadas + ubicaciones de inmuebles relacionados
      if (relations) {
        // Domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/personas/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.domicilios && personaRelData.domicilios.length > 0) {
                  const domiciliosRelacionados = personaRelData.domicilios.map((domicilio: string, index: number) => ({
                    id: personaRelacionada.id + index * 1000,
                    lat: 9.9281 + (Math.random() - 0.5) * 0.1,
                    lng: -84.0907 + (Math.random() - 0.5) * 0.1,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelData.nombre}: ${domicilio}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo datos de persona relacionada:", error);
            }
          }
        }

        // Ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            relatedLocations.push({
              id: inmuebleRelacionado.id,
              lat: 9.9281 + (Math.random() - 0.5) * 0.1,
              lng: -84.0907 + (Math.random() - 0.5) * 0.1,
              title: "Inmueble",
              description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
              type: "inmueble" as EntityType,
              relation: "related" as const,
              entityId: inmuebleRelacionado.id
            });
          }
        }

        // Ubicaciones de vehículos relacionados
        if (relations.vehiculos) {
          for (const vehiculoRelacionado of relations.vehiculos) {
            try {
              const vehiculoRelResponse = await fetch(`/api/relaciones/vehiculo/${vehiculoRelacionado.id}`);
              if (vehiculoRelResponse.ok) {
                const vehiculoRelData = await vehiculoRelResponse.json();
                if (vehiculoRelData.ubicaciones) {
                  const ubicacionesVehiculoRel = vehiculoRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntity) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesVehiculoRel, "ubicacion", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    title: "Avistamiento",
                    description: `Ubicación de vehículo ${vehiculoRelacionado.marca} ${vehiculoRelacionado.modelo} (${vehiculoRelacionado.placa})`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de vehículo relacionado:", error);
            }
          }
        }

        // Ubicaciones de la tabla ubicaciones (excluyendo Domicilio e Inmueble)
        const ubicacionesFiltradas = (relations.ubicaciones || []).filter(
          (ubicacion: UbicacionEntity) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
        );
        const ubicacionesConvertidas = convertToLocationData(ubicacionesFiltradas, "ubicacion", "related");
        relatedLocations = [...relatedLocations, ...ubicacionesConvertidas];
      }
    } else if (entity.tipo === "vehiculo") {
      entityType = "vehiculo";
      
      // UBICACIONES DIRECTAS: Vehículos no tienen ubicaciones directas según las instrucciones
      
      // UBICACIONES RELACIONADAS: Ubicaciones desde las relaciones (excluyendo Domicilio e Inmueble)
      if (relations) {
        const ubicacionesFiltradas = (relations.ubicaciones || []).filter(
          (ubicacion: UbicacionEntity) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
        );
        const ubicacionesVehiculo = convertToLocationData(ubicacionesFiltradas, "ubicacion", "related");
        relatedLocations = ubicacionesVehiculo.map(loc => ({
          ...loc,
          title: "Avistamiento",
          description: `Ubicación de vehículo ${entity.referencia}`,
          relation: "related" as const
        }));

        // Domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/personas/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.domicilios && personaRelData.domicilios.length > 0) {
                  const domiciliosRelacionados = personaRelData.domicilios.map((domicilio: string, index: number) => ({
                    id: personaRelacionada.id + index * 1000,
                    lat: 9.9281 + (Math.random() - 0.5) * 0.1,
                    lng: -84.0907 + (Math.random() - 0.5) * 0.1,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelData.nombre}: ${domicilio}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo datos de persona relacionada:", error);
            }
          }
        }

        // Ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            relatedLocations.push({
              id: inmuebleRelacionado.id,
              lat: 9.9281 + (Math.random() - 0.5) * 0.1,
              lng: -84.0907 + (Math.random() - 0.5) * 0.1,
              title: "Inmueble",
              description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
              type: "inmueble" as EntityType,
              relation: "related" as const,
              entityId: inmuebleRelacionado.id
            });
          }
        }
      }
    } else if (entity.tipo === "inmueble") {
      entityType = "inmueble";
      
      // UBICACIONES DIRECTAS: Ubicación propia del inmueble (tipo = 'Inmueble' en ubicaciones)
      try {
        const inmuebleResponse = await fetch(`/api/inmuebles/${entity.id}`);
        if (inmuebleResponse.ok) {
          const inmuebleData = await inmuebleResponse.json();
          directLocations = [{
            id: entity.id,
            lat: 9.9281 + (Math.random() - 0.5) * 0.1,
            lng: -84.0907 + (Math.random() - 0.5) * 0.1,
            title: "Inmueble",
            description: `${inmuebleData.tipo}: ${inmuebleData.direccion}`,
            type: "inmueble" as EntityType,
            relation: "direct" as const,
            entityId: entity.id
          }];
        }
      } catch (error) {
        console.error("Error obteniendo datos de inmueble:", error);
      }

      // UBICACIONES RELACIONADAS: Ubicaciones de entidades relacionadas
      if (relations) {
        // Domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/personas/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.domicilios && personaRelData.domicilios.length > 0) {
                  const domiciliosRelacionados = personaRelData.domicilios.map((domicilio: string, index: number) => ({
                    id: personaRelacionada.id + index * 1000,
                    lat: 9.9281 + (Math.random() - 0.5) * 0.1,
                    lng: -84.0907 + (Math.random() - 0.5) * 0.1,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelData.nombre}: ${domicilio}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo datos de persona relacionada:", error);
            }
          }
        }

        // Otras ubicaciones (excluyendo tipos no relevantes)
        const ubicacionesFiltradas = (relations.ubicaciones || []).filter(
          (ubicacion: UbicacionEntity) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
        );
        const ubicacionesOtras = convertToLocationData(ubicacionesFiltradas, "ubicacion", "related");
        relatedLocations = [...relatedLocations, ...ubicacionesOtras];
      }
    } else if (entity.tipo === "ubicacion") {
      entityType = "ubicacion";
      
      // UBICACIONES DIRECTAS: Sus propios registros en ubicaciones, excluyendo tipo = 'Inmueble' o 'Domicilio'
      try {
        const ubicacionResponse = await fetch(`/api/ubicaciones/${entity.id}`);
        if (ubicacionResponse.ok) {
          const ubicacionData = await ubicacionResponse.json();
          if (ubicacionData.tipo !== "Inmueble" && ubicacionData.tipo !== "Domicilio") {
            directLocations = [{
              id: entity.id,
              lat: ubicacionData.latitud || 9.9281 + (Math.random() - 0.5) * 0.1,
              lng: ubicacionData.longitud || -84.0907 + (Math.random() - 0.5) * 0.1,
              title: ubicacionData.tipo || "Ubicación",
              description: ubicacionData.observaciones || "Sin descripción",
              type: "ubicacion" as EntityType,
              relation: "direct" as const,
              entityId: entity.id
            }];
          }
        }
      } catch (error) {
        console.error("Error obteniendo datos de ubicación:", error);
      }

      // UBICACIONES RELACIONADAS: Ubicaciones de entidades relacionadas
      if (relations) {
        // Domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/personas/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.domicilios && personaRelData.domicilios.length > 0) {
                  const domiciliosRelacionados = personaRelData.domicilios.map((domicilio: string, index: number) => ({
                    id: personaRelacionada.id + index * 1000,
                    lat: 9.9281 + (Math.random() - 0.5) * 0.1,
                    lng: -84.0907 + (Math.random() - 0.5) * 0.1,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelData.nombre}: ${domicilio}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo datos de persona relacionada:", error);
            }
          }
        }

        // Ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            relatedLocations.push({
              id: inmuebleRelacionado.id,
              lat: 9.9281 + (Math.random() - 0.5) * 0.1,
              lng: -84.0907 + (Math.random() - 0.5) * 0.1,
              title: "Inmueble",
              description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
              type: "inmueble" as EntityType,
              relation: "related" as const,
              entityId: inmuebleRelacionado.id
            });
          }
        }
      }
    }

    const allLocations = [...directLocations, ...relatedLocations];
    console.log("[UBICACIONES] Ubicaciones directas:", directLocations.length);
    console.log("[UBICACIONES] Ubicaciones relacionadas:", relatedLocations.length);
    console.log("[UBICACIONES] Total ubicaciones cargadas:", allLocations.length);
    
    return allLocations;
  };

  const handleResultSelect = (result: SearchResult) => {
    setSelectedEntity(result);
    
    processEntityLocations(result).then(entityLocations => {
      setLocations(entityLocations);
      
      if (entityLocations.length > 0) {
        // Calcular el centro del mapa basado en las ubicaciones
        const avgLat = entityLocations.reduce((sum, loc) => sum + loc.lat, 0) / entityLocations.length;
        const avgLng = entityLocations.reduce((sum, loc) => sum + loc.lng, 0) / entityLocations.length;
        setMapCenter([avgLat, avgLng]);
      }
    });
  };

  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
    toast({
      title: "Ubicación seleccionada",
      description: `${location.title}: ${location.description}`
    });
  };

  const exportToPDF = () => {
    if (locations.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay ubicaciones para exportar",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(16);
    doc.text("Informe de Ubicaciones", 20, 20);
    
    if (selectedEntity) {
      doc.setFontSize(12);
      doc.text(`Entidad: ${selectedEntity.nombre}`, 20, 35);
      doc.text(`Tipo: ${selectedEntity.tipo}`, 20, 45);
      doc.text(`Referencia: ${selectedEntity.referencia}`, 20, 55);
    }
    
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Total de ubicaciones: ${locations.length}`, 20, 75);

    // Tabla de ubicaciones directas
    const directLocations = locations.filter(loc => loc.relation === 'direct');
    if (directLocations.length > 0) {
      doc.setFontSize(14);
      doc.text("Ubicaciones Directas", 20, 90);
      
      const directData = directLocations.map(loc => [
        loc.title,
        loc.description,
        `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
      ]);

      autoTable(doc, {
        head: [['Tipo', 'Descripción', 'Coordenadas']],
        body: directData,
        startY: 95,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    // Tabla de ubicaciones relacionadas
    const relatedLocations = locations.filter(loc => loc.relation === 'related');
    if (relatedLocations.length > 0) {
      const startY = directLocations.length > 0 ? (doc as any).lastAutoTable.finalY + 10 : 90;
      
      doc.setFontSize(14);
      doc.text("Ubicaciones Relacionadas", 20, startY);
      
      const relatedData = relatedLocations.map(loc => [
        loc.title,
        loc.description,
        `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
      ]);

      autoTable(doc, {
        head: [['Tipo', 'Descripción', 'Coordenadas']],
        body: relatedData,
        startY: startY + 5,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 184, 92] }
      });
    }

    // Guardar el PDF
    const fileName = selectedEntity 
      ? `ubicaciones_${selectedEntity.tipo}_${selectedEntity.referencia}.pdf`
      : `ubicaciones_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
    
    toast({
      title: "PDF exportado",
      description: `Se ha generado el archivo ${fileName}`,
    });
  };

  const getEntityIcon = (tipo: string) => {
    switch (tipo) {
      case "persona":
        return <User className="h-4 w-4" />;
      case "vehiculo":
        return <Car className="h-4 w-4" />;
      case "inmueble":
        return <Building className="h-4 w-4" />;
      case "ubicacion":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Ubicaciones</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de búsqueda */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar Entidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SearchComponent
                  onResultSelect={handleResultSelect}
                  placeholder="Buscar persona, vehículo, inmueble o ubicación..."
                />
                
                {selectedEntity && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getEntityIcon(selectedEntity.tipo)}
                      <span className="font-medium text-sm text-gray-700">
                        {selectedEntity.tipo.charAt(0).toUpperCase() + selectedEntity.tipo.slice(1)} seleccionado:
                      </span>
                    </div>
                    <p className="text-sm font-medium">{selectedEntity.nombre}</p>
                    <p className="text-xs text-gray-600">{selectedEntity.referencia}</p>
                  </div>
                )}

                {relationData && (
                  <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                    {relationData.personas && relationData.personas.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Personas ({relationData.personas.length})</h4>
                        <div className="space-y-1">
                          {relationData.personas.map((persona: PersonaEntity) => (
                            <div key={persona.id} className="p-2 bg-blue-50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-blue-600" />
                                <span className="font-medium">{persona.nombre}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relationData.vehiculos && relationData.vehiculos.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Vehículos ({relationData.vehiculos.length})</h4>
                        <div className="space-y-1">
                          {relationData.vehiculos.map((vehiculo: VehiculoEntity) => (
                            <div key={vehiculo.id} className="p-2 bg-green-50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <Car className="h-3 w-3 text-green-600" />
                                <span className="font-medium">{vehiculo.marca} {vehiculo.modelo}</span>
                              </div>
                              <div className="text-gray-600">{vehiculo.placa}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relationData.inmuebles && relationData.inmuebles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Inmuebles ({relationData.inmuebles.length})</h4>
                        <div className="space-y-1">
                          {relationData.inmuebles.map((inmueble: InmuebleEntity) => (
                            <div key={inmueble.id} className="p-2 bg-orange-50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-orange-600" />
                                <span className="font-medium">{inmueble.tipo}</span>
                              </div>
                              <div className="text-gray-600">{inmueble.direccion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relationData.ubicaciones && relationData.ubicaciones.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Ubicaciones ({relationData.ubicaciones.length})</h4>
                        <div className="space-y-2">
                          {relationData.ubicaciones.map((ubicacion: UbicacionEntity) => (
                            <div key={ubicacion.id} className="p-2 bg-purple-50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-purple-600" />
                                <span className="font-medium">{ubicacion.tipo}</span>
                              </div>
                              <div className="text-gray-600">{ubicacion.observaciones}</div>
                              <div className="text-gray-500 text-xs">
                                {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relationData.otrasUbicaciones && relationData.otrasUbicaciones.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Otras Ubicaciones ({relationData.otrasUbicaciones.length})</h4>
                        <div className="space-y-2">
                          {relationData.otrasUbicaciones.map((ubicacion: UbicacionEntity) => (
                            <div key={ubicacion.id} className="p-2 bg-gray-50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-600" />
                                <span className="font-medium">{ubicacion.tipo}</span>
                              </div>
                              <div className="text-gray-600">{ubicacion.observaciones}</div>
                              <div className="text-gray-500 text-xs">
                                {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel principal con mapa y tabla */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Mapa de Ubicaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando ubicaciones...</p>
                      </div>
                    </div>
                  ) : (
                    <LocationMap 
                      markers={locations}
                      center={mapCenter}
                      zoom={DEFAULT_ZOOM}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tablas de ubicaciones separadas */}
            {locations.length > 0 && (
              <div className="space-y-6">
                {/* Botón de exportar PDF */}
                <div className="flex justify-end">
                  <Button onClick={exportToPDF} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Exportar a PDF
                  </Button>
                </div>

                {/* Tabla de ubicaciones directas */}
                {locations.filter(loc => loc.relation === 'direct').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Ubicaciones Directas ({locations.filter(loc => loc.relation === 'direct').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationsTable 
                        locations={locations.filter(loc => loc.relation === 'direct')}
                        onLocationClick={handleLocationClick}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Tabla de ubicaciones relacionadas */}
                {locations.filter(loc => loc.relation === 'related').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        Ubicaciones Relacionadas ({locations.filter(loc => loc.relation === 'related').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationsTable 
                        locations={locations.filter(loc => loc.relation === 'related')}
                        onLocationClick={handleLocationClick}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}