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
import html2canvas from "html2canvas";

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
  identificacion?: string;
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
      if (!response.ok) throw new Error("Error en la respuesta de la API");
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error obteniendo relaciones:", error);
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
      if (relations && relations.ubicaciones) {
        // Filtrar solo ubicaciones de tipo domicilio
        const domicilios = relations.ubicaciones.filter((ubicacion: UbicacionEntity) => 
          ubicacion.tipo === "Domicilio" || !ubicacion.tipo
        );
        
        directLocations = domicilios.map((ubicacion: UbicacionEntity) => ({
          id: ubicacion.id,
          lat: ubicacion.latitud,
          lng: ubicacion.longitud,
          title: "Domicilio",
          description: `Domicilio de ${entity.nombre}: ${ubicacion.observaciones || 'Sin observaciones'}`,
          type: "persona" as EntityType,
          relation: "direct" as const,
          entityId: entity.id
        }));
      }

      // UBICACIONES RELACIONADAS: Domicilios de personas relacionadas + ubicaciones de inmuebles relacionados
      if (relations) {
        // Domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const ubicacionesRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (ubicacionesRelResponse.ok) {
                const ubicacionesRelData = await ubicacionesRelResponse.json();
                if (ubicacionesRelData.ubicaciones) {
                  const domiciliosRel = ubicacionesRelData.ubicaciones.filter((ubicacion: UbicacionEntity) =>
                    ubicacion.tipo === "Domicilio" || !ubicacion.tipo
                  );
                  
                  const domiciliosRelacionados = domiciliosRel.map((ubicacion: UbicacionEntity) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelacionada.nombre}: ${ubicacion.observaciones || 'Sin observaciones'}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de persona relacionada:", error);
            }
          }
        }

        // Ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones && inmuebleRelData.ubicaciones.length > 0) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.map((ubicacion: any) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Inmueble",
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
                    type: "inmueble" as EntityType,
                    relation: "related" as const,
                    entityId: inmuebleRelacionado.id
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesInmueble];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de inmueble relacionado:", error);
            }
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
        const ubicacionesConvertidas = convertToLocationData(ubicacionesFiltradas, "ubicacion", "related");
        const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
          ...loc,
          title: "Avistamiento",
          description: `Ubicación de vehículo ${entity.nombre}`
        }));
        relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];

        // Agregar domicilios de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const ubicacionesRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (ubicacionesRelResponse.ok) {
                const ubicacionesRelData = await ubicacionesRelResponse.json();
                if (ubicacionesRelData.ubicaciones) {
                  const domiciliosRel = ubicacionesRelData.ubicaciones.filter((ubicacion: UbicacionEntity) =>
                    ubicacion.tipo === "Domicilio" || !ubicacion.tipo
                  );
                  
                  const domiciliosRelacionados = domiciliosRel.map((ubicacion: UbicacionEntity) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelacionada.nombre}: ${ubicacion.observaciones || 'Sin observaciones'}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de persona relacionada:", error);
            }
          }
        }

        // Agregar ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones && inmuebleRelData.ubicaciones.length > 0) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.map((ubicacion: any) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Inmueble",
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
                    type: "inmueble" as EntityType,
                    relation: "related" as const,
                    entityId: inmuebleRelacionado.id
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesInmueble];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de inmueble relacionado:", error);
            }
          }
        }
      }
    } else if (entity.tipo === "inmueble") {
      entityType = "inmueble";
      
      // UBICACIONES DIRECTAS: Ubicación propia del inmueble
      if (relations && relations.ubicaciones) {
        const ubicacionesPropias = relations.ubicaciones.filter((ubicacion: UbicacionEntity) => 
          ubicacion.tipo === "Inmueble" || !ubicacion.tipo
        );
        
        directLocations = ubicacionesPropias.map((ubicacion: UbicacionEntity) => ({
          id: ubicacion.id,
          lat: ubicacion.latitud,
          lng: ubicacion.longitud,
          title: "Inmueble",
          description: `${entity.nombre}: ${entity.referencia}`,
          type: "inmueble" as EntityType,
          relation: "direct" as const,
          entityId: entity.id
        }));
      }

      // UBICACIONES RELACIONADAS: Domicilios de personas relacionadas
      if (relations && relations.personas) {
        for (const personaRelacionada of relations.personas) {
          try {
            const ubicacionesRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
            if (ubicacionesRelResponse.ok) {
              const ubicacionesRelData = await ubicacionesRelResponse.json();
              if (ubicacionesRelData.ubicaciones) {
                const domiciliosRel = ubicacionesRelData.ubicaciones.filter((ubicacion: UbicacionEntity) =>
                  ubicacion.tipo === "Domicilio" || !ubicacion.tipo
                );
                
                const domiciliosRelacionados = domiciliosRel.map((ubicacion: UbicacionEntity) => ({
                  id: ubicacion.id,
                  lat: ubicacion.latitud,
                  lng: ubicacion.longitud,
                  title: "Domicilio",
                  description: `Domicilio de ${personaRelacionada.nombre}: ${ubicacion.observaciones || 'Sin observaciones'}`,
                  type: "persona" as EntityType,
                  relation: "related" as const,
                  entityId: personaRelacionada.id
                }));
                relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
              }
            }
          } catch (error) {
            console.error("Error obteniendo ubicaciones de persona relacionada:", error);
          }
        }
      }
    } else if (entity.tipo === "ubicacion") {
      entityType = "ubicacion";
      
      // UBICACIONES DIRECTAS: La ubicación misma
      try {
        const ubicacionResponse = await fetch(`/api/ubicaciones/${entity.id}`);
        if (ubicacionResponse.ok) {
          const ubicacionData = await ubicacionResponse.json();
          if (ubicacionData.latitud && ubicacionData.longitud) {
            directLocations = [{
              id: ubicacionData.id,
              lat: ubicacionData.latitud,
              lng: ubicacionData.longitud,
              title: ubicacionData.tipo || "Ubicación",
              description: ubicacionData.observaciones || "Sin observaciones",
              type: "ubicacion" as EntityType,
              relation: "direct" as const,
              entityId: entity.id
            }];
          }
        }
      } catch (error) {
        console.error("Error obteniendo datos de ubicación:", error);
      }

      // UBICACIONES RELACIONADAS: Domicilios de personas relacionadas + ubicaciones de inmuebles relacionados
      if (relations) {
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const ubicacionesRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (ubicacionesRelResponse.ok) {
                const ubicacionesRelData = await ubicacionesRelResponse.json();
                if (ubicacionesRelData.ubicaciones) {
                  const domiciliosRel = ubicacionesRelData.ubicaciones.filter((ubicacion: UbicacionEntity) =>
                    ubicacion.tipo === "Domicilio" || !ubicacion.tipo
                  );
                  
                  const domiciliosRelacionados = domiciliosRel.map((ubicacion: UbicacionEntity) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Domicilio",
                    description: `Domicilio de ${personaRelacionada.nombre}: ${ubicacion.observaciones || 'Sin observaciones'}`,
                    type: "persona" as EntityType,
                    relation: "related" as const,
                    entityId: personaRelacionada.id
                  }));
                  relatedLocations = [...relatedLocations, ...domiciliosRelacionados];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de persona relacionada:", error);
            }
          }
        }

        // Ubicaciones de inmuebles relacionados
        if (relations.inmuebles) {
          for (const inmuebleRelacionado of relations.inmuebles) {
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones && inmuebleRelData.ubicaciones.length > 0) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.map((ubicacion: any) => ({
                    id: ubicacion.id,
                    lat: ubicacion.latitud,
                    lng: ubicacion.longitud,
                    title: "Inmueble",
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`,
                    type: "inmueble" as EntityType,
                    relation: "related" as const,
                    entityId: inmuebleRelacionado.id
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesInmueble];
                }
              }
            } catch (error) {
              console.error("Error obteniendo ubicaciones de inmueble relacionado:", error);
            }
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

  const handleRelatedItemClick = (item: { id: number; tipo: EntityType; nombre?: string; referencia?: string }) => {
    console.log("Ítem relacionado seleccionado:", item);
    
    // Crear un nuevo SearchResult basado en el ítem relacionado
    const newResult: SearchResult = {
      id: item.id,
      tipo: item.tipo,
      nombre: item.nombre || '',
      referencia: item.referencia || ''
    };
    
    // Usar handleResultSelect para cargar todos los datos correctamente
    handleResultSelect(newResult);
  };

  const exportToPDF = async () => {
    if (locations.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay ubicaciones para exportar",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Configuración general
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Título principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REPORTE DE UBICACIONES", pageWidth / 2, 25, { align: "center" });
      
      // Información de la entidad
      if (selectedEntity) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const entityInfo = `Entidad: ${selectedEntity.nombre} (${selectedEntity.tipo})`;
        doc.text(entityInfo, pageWidth / 2, 35, { align: "center" });
      }
      
      // Tabla de ubicaciones
      const tableData = locations.map(location => [
        location.title,
        location.description,
        `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        location.relation === 'direct' ? 'Directa' : 'Relacionada'
      ]);
      
      autoTable(doc, {
        head: [['Tipo', 'Descripción', 'Coordenadas', 'Relación']],
        body: tableData,
        startY: 45,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Guardar
      doc.save(`Ubicaciones_${selectedEntity?.nombre || 'reporte'}.pdf`);
      
      toast({
        title: "PDF generado",
        description: "El reporte se ha descargado exitosamente"
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Ubicaciones</h1>
            
            {selectedEntity && locations.length > 0 && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={exportToPDF}
              >
                <FileText className="h-4 w-4" />
                <span>Exportar PDF</span>
              </Button>
            )}
          </div>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {!selectedEntity ? (
            <div className="border rounded-md p-4 min-h-[200px] flex flex-col items-center justify-center text-gray-500">
              <MapPin className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2">Seleccione una entidad para ver sus ubicaciones</p>
              <p className="text-sm text-center">Use el buscador para encontrar personas, vehículos, inmuebles o ubicaciones</p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedEntity.nombre}
                  <span className="ml-2 text-sm font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {selectedEntity.tipo === 'persona' && 'Persona'}
                    {selectedEntity.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedEntity.tipo === 'inmueble' && 'Inmueble'}
                    {selectedEntity.tipo === 'ubicacion' && 'Ubicación'}
                  </span>
                </h2>
              </div>
              
              {locations.length > 0 ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span>Mapa de Ubicaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="h-[350px] md:h-[450px] w-full">
                          <LocationMap 
                            markers={locations} 
                            center={mapCenter}
                            zoom={15}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        <span>Detalles de Ubicaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationsTable 
                        locations={locations} 
                        onLocationClick={handleLocationClick}
                        onRelatedItemClick={handleRelatedItemClick}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                  <MapPin className="h-12 w-12 mb-4 text-gray-400" />
                  <p className="mb-1 text-lg">No hay ubicaciones registradas</p>
                  <p className="text-sm text-center">No se encontraron coordenadas para esta entidad</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}