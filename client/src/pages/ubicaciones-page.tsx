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

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);
  const [relationData, setRelationData] = useState<any>(null);
  const { toast } = useToast();

  // Función para obtener relaciones de una entidad
  const fetchRelations = async (entityType: EntityType, entityId: number) => {
    setIsLoading(true);
    try {
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
  const convertToLocationData = (ubicaciones: UbicacionEntidad[], type: string, relation: 'direct' | 'related' = 'direct'): LocationData[] => {
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
        const domicilios = relations.ubicaciones.filter((ubicacion: UbicacionEntidad) => 
          ubicacion.tipo === "Domicilio"
        );
        directLocations = convertToLocationData(domicilios, "persona", "direct");
      }

      // UBICACIONES RELACIONADAS: Ubicaciones de entidades relacionadas
      if (relations) {
        // Ubicaciones de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.ubicaciones) {
                  const domiciliosRelacionados = personaRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Domicilio"
                  );
                  const ubicacionesConvertidas = convertToLocationData(domiciliosRelacionados, "persona", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `Domicilio de ${personaRelacionada.nombre}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesInmueble, "inmueble", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesVehiculoRel, "vehiculo", "related");
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

        // Otras ubicaciones (excluyendo tipos no relevantes)
        const ubicacionesFiltradas = (relations.ubicaciones || []).filter(
          (ubicacion: UbicacionEntidad) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
        );
        const ubicacionesOtras = convertToLocationData(ubicacionesFiltradas, "ubicacion", "related");
        relatedLocations = [...relatedLocations, ...ubicacionesOtras];
      }
    } else if (entity.tipo === "vehiculo") {
      entityType = "vehiculo";
      
      // UBICACIONES DIRECTAS: Avistamientos del vehículo (vía vehiculos_ubicaciones)
      if (relations && relations.ubicaciones) {
        const avistamientos = relations.ubicaciones.filter((ubicacion: UbicacionEntidad) => 
          ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
        );
        directLocations = convertToLocationData(avistamientos, "vehiculo", "direct");
      }

      // UBICACIONES RELACIONADAS: Ubicaciones de entidades relacionadas
      if (relations) {
        // Ubicaciones de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.ubicaciones) {
                  const domiciliosRelacionados = personaRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Domicilio"
                  );
                  const ubicacionesConvertidas = convertToLocationData(domiciliosRelacionados, "persona", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `Domicilio de ${personaRelacionada.nombre}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesInmueble, "inmueble", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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
      
      // UBICACIONES DIRECTAS: Ubicación propia del inmueble (tipo = 'Inmueble' en ubicaciones)
      if (relations && relations.ubicaciones) {
        const ubicacionInmueble = relations.ubicaciones.filter((ubicacion: UbicacionEntidad) => 
          ubicacion.tipo === "Inmueble"
        );
        directLocations = convertToLocationData(ubicacionInmueble, "inmueble", "direct");
      }

      // UBICACIONES RELACIONADAS: Ubicaciones de entidades relacionadas
      if (relations) {
        // Ubicaciones de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.ubicaciones) {
                  const domiciliosRelacionados = personaRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Domicilio"
                  );
                  const ubicacionesConvertidas = convertToLocationData(domiciliosRelacionados, "persona", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `Domicilio de ${personaRelacionada.nombre}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
                }
              }
            } catch (error) {
              console.error("Error obteniendo datos de persona relacionada:", error);
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
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesVehiculoRel, "vehiculo", "related");
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
              lat: ubicacionData.latitud,
              lng: ubicacionData.longitud,
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
        // Ubicaciones de personas relacionadas
        if (relations.personas) {
          for (const personaRelacionada of relations.personas) {
            try {
              const personaRelResponse = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
              if (personaRelResponse.ok) {
                const personaRelData = await personaRelResponse.json();
                if (personaRelData.ubicaciones) {
                  const domiciliosRelacionados = personaRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Domicilio"
                  );
                  const ubicacionesConvertidas = convertToLocationData(domiciliosRelacionados, "persona", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `Domicilio de ${personaRelacionada.nombre}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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
            try {
              const inmuebleRelResponse = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
              if (inmuebleRelResponse.ok) {
                const inmuebleRelData = await inmuebleRelResponse.json();
                if (inmuebleRelData.ubicaciones) {
                  const ubicacionesInmueble = inmuebleRelData.ubicaciones.filter(
                    (ubicacion: UbicacionEntidad) => ubicacion.tipo === "Inmueble"
                  );
                  const ubicacionesConvertidas = convertToLocationData(ubicacionesInmueble, "inmueble", "related");
                  const ubicacionesFormateadas = ubicacionesConvertidas.map(loc => ({
                    ...loc,
                    description: `${inmuebleRelacionado.tipo}: ${inmuebleRelacionado.direccion}`
                  }));
                  relatedLocations = [...relatedLocations, ...ubicacionesFormateadas];
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

  // Función para manejar selección de resultado de búsqueda
  const handleSearchSelect = async (result: SearchResult) => {
    setSelectedResult(result);
    setIsLoading(true);
    
    try {
      const allLocations = await processEntityLocations(result);
      setLocations(allLocations);
      
      if (allLocations.length > 0) {
        // Centrar mapa en primera ubicación encontrada
        setMapCenter([allLocations[0].lat, allLocations[0].lng]);
      }
    } catch (error) {
      console.error("Error procesando ubicaciones:", error);
      toast({
        title: "Error",
        description: "Error al cargar las ubicaciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para generar PDF
  const generatePDF = async () => {
    if (!selectedResult || locations.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecciona una entidad con ubicaciones para generar el PDF",
        variant: "default"
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      
      // Título
      pdf.setFontSize(20);
      pdf.text(`Reporte de Ubicaciones - ${selectedResult.nombre || selectedResult.placa || selectedResult.referencia}`, 20, 30);
      
      // Información de la entidad
      pdf.setFontSize(12);
      let yPosition = 50;
      pdf.text(`Tipo: ${selectedResult.tipo}`, 20, yPosition);
      yPosition += 10;
      
      if (selectedResult.identificacion) {
        pdf.text(`Identificación: ${selectedResult.identificacion}`, 20, yPosition);
        yPosition += 10;
      }
      
      if (selectedResult.placa) {
        pdf.text(`Placa: ${selectedResult.placa}`, 20, yPosition);
        yPosition += 10;
      }
      
      if (selectedResult.direccion) {
        pdf.text(`Dirección: ${selectedResult.direccion}`, 20, yPosition);
        yPosition += 10;
      }
      
      yPosition += 10;
      
      // Tabla de ubicaciones
      const tableData = locations.map(location => [
        location.title,
        location.description,
        `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        location.relation === 'direct' ? 'Directa' : 'Relacionada'
      ]);
      
      autoTable(pdf, {
        head: [['Tipo', 'Descripción', 'Coordenadas', 'Relación']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Capturar imagen del mapa
      const mapElement = document.getElementById('location-map');
      if (mapElement) {
        try {
          const canvas = await html2canvas(mapElement);
          const imgData = canvas.toDataURL('image/png');
          
          // Agregar nueva página para el mapa
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.text('Mapa de Ubicaciones', 20, 30);
          
          // Calcular dimensiones para ajustar el mapa
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error capturando mapa:', error);
        }
      }
      
      // Guardar PDF
      pdf.save(`ubicaciones-${selectedResult.nombre || selectedResult.placa || selectedResult.referencia}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Éxito",
        description: "PDF generado correctamente",
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error",
        description: "Error al generar el PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <MapPin className="text-blue-600" />
            Ubicaciones Geográficas
          </h1>
          <p className="text-lg text-gray-600">
            Visualiza y analiza las ubicaciones de personas, vehículos e inmuebles en el mapa
          </p>
        </div>

        {/* Componente de búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Entidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SearchComponent
              onResultSelect={handleSearchSelect}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa Interactivo
              </CardTitle>
              {selectedResult && locations.length > 0 && (
                <Button onClick={generatePDF} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div id="location-map" className="h-96 w-full rounded-lg overflow-hidden">
                <LocationMap
                  markers={locations}
                  center={mapCenter}
                  zoom={DEFAULT_ZOOM}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de la entidad seleccionada */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedResult?.tipo === "persona" && <User className="h-5 w-5" />}
                {selectedResult?.tipo === "vehiculo" && <Car className="h-5 w-5" />}
                {selectedResult?.tipo === "inmueble" && <Building className="h-5 w-5" />}
                {selectedResult?.tipo === "ubicacion" && <MapPin className="h-5 w-5" />}
                Información de la Entidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedResult ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedResult.nombre || selectedResult.placa || selectedResult.referencia}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      Tipo: {selectedResult.tipo}
                    </p>
                  </div>

                  {selectedResult.identificacion && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Identificación: {selectedResult.identificacion}
                      </p>
                    </div>
                  )}

                  {selectedResult.placa && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Placa: {selectedResult.placa}
                      </p>
                    </div>
                  )}

                  {selectedResult.direccion && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Dirección: {selectedResult.direccion}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700">
                      Ubicaciones encontradas: {locations.length}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Directas: {locations.filter(l => l.relation === 'direct').length}</span>
                      <span>Relacionadas: {locations.filter(l => l.relation === 'related').length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona una entidad para ver sus ubicaciones</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabla de ubicaciones */}
        {locations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detalle de Ubicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationsTable locations={locations} onLocationClick={() => {}} />
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-center">Cargando ubicaciones...</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}