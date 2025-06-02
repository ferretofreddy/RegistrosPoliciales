import React, { useState, useEffect, useRef } from "react";
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

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);
  const [entityData, setEntityData] = useState<any>(null);
  const [relationData, setRelationData] = useState<any>(null);
  const [ubicacionesData, setUbicacionesData] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Query para obtener ubicaciones directamente desde el endpoint /api/ubicaciones
  const {
    data: ubicacionesList,
    isLoading: isLoadingUbicaciones,
    error: ubicacionesError
  } = useQuery({
    queryKey: ['/api/ubicaciones'],
    queryFn: async () => {
      const response = await fetch('/api/ubicaciones');
      if (!response.ok) {
        throw new Error('Error al cargar ubicaciones');
      }
      return response.json();
    },
    enabled: !selectedResult // Solo cargar cuando no hay entidad seleccionada
  });

  // Función para manejar la selección de resultado y cargar datos relacionados
  const handleResultSelect = async (result: SearchResult) => {
    console.log("[UBICACIONES] Resultado seleccionado:", result);
    setSelectedResult(result);
    setIsLoading(true);
    
    try {
      // Obtener datos de la entidad
      const entityResponse = await fetch(`/api/${result.tipo}s/${result.id}`);
      if (entityResponse.ok) {
        const entData = await entityResponse.json();
        setEntityData(entData);
      }
      
      // Obtener relaciones de la entidad
      const relationResponse = await fetch(`/api/relaciones/${result.tipo}/${result.id}`);
      if (relationResponse.ok) {
        const relData = await relationResponse.json();
        setRelationData(relData);
      }
    } catch (error) {
      console.error("[UBICACIONES] Error cargando datos:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de la entidad",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para procesar ubicaciones cuando cambien los datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!selectedResult) return;
      
      setIsLoading(true);
      let ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;
      let enteredMap = false;

      try {
        // Caso 1: Si no hay entidad seleccionada, mostrar todas las ubicaciones de la página
        if (!selectedResult && ubicacionesData) {
          console.log("[UBICACIONES] Cargando todas las ubicaciones de la página");
          console.log("[UBICACIONES] Datos recibidos:", ubicacionesData);
          
          // Procesar ubicaciones directas usando coordenadas reales de la base de datos
          if (ubicacionesData.ubicacionesDirectas && ubicacionesData.ubicacionesDirectas.length > 0) {
            for (const ubicacion of ubicacionesData.ubicacionesDirectas) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title: ubicacion.tipo || "Ubicación",
                  description: ubicacion.observaciones || "Ubicación directa",
                  type: "ubicacion",
                  relation: "direct",
                  entityId: ubicacion.id
                });
              }
            }
          }
          
          // Procesar ubicaciones relacionadas usando coordenadas reales de la base de datos
          if (ubicacionesData.ubicacionesRelacionadas && ubicacionesData.ubicacionesRelacionadas.length > 0) {
            for (const ubicacion of ubicacionesData.ubicacionesRelacionadas) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                let title = ubicacion.tipo || "Ubicación relacionada";
                let description = ubicacion.observaciones || "";
                
                // Agregar información de la entidad relacionada
                if (ubicacion.entidad_tipo && ubicacion.entidad_nombre) {
                  const tipoTexto = ubicacion.entidad_tipo === 'persona' ? 'Persona' : 
                                   ubicacion.entidad_tipo === 'vehiculo' ? 'Vehículo' :
                                   ubicacion.entidad_tipo === 'inmueble' ? 'Inmueble' : 'Entidad';
                  description = `${tipoTexto}: ${ubicacion.entidad_nombre}. ${description}`;
                }
                
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title,
                  description,
                  type: ubicacion.entidad_tipo || "ubicacion",
                  relation: "related",
                  entityId: ubicacion.id
                });
              }
            }
          }
          
          // Centrar mapa en primera ubicación encontrada
          if (ubicacionesEncontradas.length > 0 && !hasCenteredMap) {
            setMapCenter([ubicacionesEncontradas[0].lat, ubicacionesEncontradas[0].lng]);
            hasCenteredMap = true;
          }
        }
        
        // Caso 2: Si hay entidad seleccionada, procesar como antes
        else if (selectedResult) {
          console.log("[UBICACIONES] Procesando entidad:", selectedResult.tipo, selectedResult);
          console.log("[UBICACIONES] Datos de entidad:", entityData);
          console.log("[UBICACIONES] Datos de relaciones:", relationData);
          
          // Caso especial: entidad es una ubicación
          if (selectedResult.tipo === "ubicacion" && entityData) {
            const lat = parseFloat(String(entityData.latitud));
            const lng = parseFloat(String(entityData.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: entityData.id,
                lat,
                lng,
                title: entityData.tipo || "Ubicación",
                description: entityData.observaciones || "Ubicación seleccionada",
                type: "ubicacion",
                relation: "direct",
                entityId: entityData.id
              });
              
              setMapCenter([lat, lng]);
              hasCenteredMap = true;
            }
          }
        
          // Procesar ubicaciones directas según el tipo de entidad usando coordenadas reales
          if (relationData) {
            // 1. Ubicaciones directas (domicilios para personas, coordenadas para inmuebles, etc.)
            if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              console.log("[UBICACIONES] Procesando ubicaciones directas:", relationData.ubicaciones.length);
            
            for (const ubicacion of relationData.ubicaciones) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                let title = "";
                let description = "";
                let entityType: "persona" | "vehiculo" | "inmueble" | "ubicacion" = "ubicacion";
                
                // Determinar el tipo y descripción según el tipo de entidad principal
                switch (selectedResult.tipo) {
                  case "persona":
                    title = ubicacion.tipo || "Domicilio";
                    description = `Domicilio de ${selectedResult.nombre}`;
                    entityType = "persona";
                    break;
                  case "inmueble":
                    title = "Ubicación del inmueble";
                    description = `Ubicación de ${selectedResult.referencia || "inmueble"} en ${selectedResult.direccion}`;
                    entityType = "inmueble";
                    break;
                  case "vehiculo":
                    title = ubicacion.tipo || "Ubicación del vehículo";
                    description = `Ubicación de vehículo ${selectedResult.placa} (${selectedResult.marca} ${selectedResult.modelo})`;
                    entityType = "vehiculo";
                    break;
                  default:
                    title = ubicacion.tipo || "Ubicación";
                    description = ubicacion.observaciones || "Ubicación directa";
                    entityType = "ubicacion";
                    break;
                }
                
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title,
                  description,
                  type: entityType,
                  relation: "direct",
                  entityId: selectedResult.id
                });
                
                if (!hasCenteredMap) {
                  setMapCenter([lat, lng]);
                  hasCenteredMap = true;
                }
              }
            }
          }
          
          // 2. Avistamientos o ubicaciones específicas según el tipo usando coordenadas reales
          if (relationData.ubicaciones && selectedResult.tipo === "vehiculo") {
            for (const ubicacion of relationData.ubicaciones) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title: ubicacion.tipo || "Avistamiento",
                  description: ubicacion.observaciones || `Avistamiento de ${selectedResult.nombre || selectedResult.placa || selectedResult.referencia}`,
                  type: selectedResult.tipo as "persona" | "vehiculo" | "inmueble" | "ubicacion",
                  relation: "related",
                  entityId: selectedResult.id
                });
                
                if (!hasCenteredMap) {
                  setMapCenter([lat, lng]);
                  hasCenteredMap = true;
                }
              }
            }
          }
          
          // 3. Ubicaciones de entidades relacionadas usando coordenadas reales
          // Personas relacionadas
          if (relationData.personas && relationData.personas.length > 0) {
            console.log("[UBICACIONES] Procesando personas relacionadas:", relationData.personas.length);
            
            for (const persona of relationData.personas) {
              try {
                const response = await fetch(`/api/relaciones/persona/${persona.id}`);
                if (response.ok) {
                  const personaData = await response.json();
                  
                  // Domicilios de personas relacionadas usando coordenadas reales
                  if (personaData.ubicaciones) {
                    for (const ubicacion of personaData.ubicaciones) {
                      const lat = parseFloat(String(ubicacion.latitud));
                      const lng = parseFloat(String(ubicacion.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacion.id,
                          lat,
                          lng,
                          title: `Domicilio de ${persona.nombre}`,
                          description: `Domicilio de ${persona.nombre} (persona relacionada)`,
                          type: "persona",
                          relation: "related",
                          entityId: persona.id
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("[UBICACIONES] Error al obtener ubicaciones de persona:", error);
              }
            }
          }
          
          // Vehículos relacionados usando coordenadas reales
          if (relationData.vehiculos && relationData.vehiculos.length > 0) {
            console.log("[UBICACIONES] Procesando vehículos relacionados:", relationData.vehiculos.length);
            
            for (const vehiculo of relationData.vehiculos) {
              try {
                const response = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
                if (response.ok) {
                  const vehiculoData = await response.json();
                  
                  // Avistamientos de vehículos relacionados usando coordenadas reales
                  if (vehiculoData.ubicaciones) {
                    for (const ubicacion of vehiculoData.ubicaciones) {
                      const lat = parseFloat(String(ubicacion.latitud));
                      const lng = parseFloat(String(ubicacion.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacion.id,
                          lat,
                          lng,
                          title: `${ubicacion.tipo || "Avistamiento"} de ${vehiculo.placa}`,
                          description: `${ubicacion.tipo || "Avistamiento"} de vehículo ${vehiculo.placa} (${vehiculo.marca} ${vehiculo.modelo})`,
                          type: "vehiculo",
                          relation: "related",
                          entityId: vehiculo.id
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("[UBICACIONES] Error al obtener ubicaciones del vehículo:", error);
              }
            }
          }
          }
        }
        
        // Establecer ubicaciones encontradas y finalizar carga
        console.log("[UBICACIONES] Total de ubicaciones encontradas:", ubicacionesEncontradas.length);
        setLocations(ubicacionesEncontradas);
        
        // Si no se centró el mapa en ninguna ubicación específica, centrarlo en todas las ubicaciones
        if (!hasCenteredMap && ubicacionesEncontradas.length > 0) {
          const lats = ubicacionesEncontradas.map(loc => loc.lat);
          const lngs = ubicacionesEncontradas.map(loc => loc.lng);
          const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
          const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
          setMapCenter([centerLat, centerLng]);
        }
        
      } catch (error) {
        console.error("[UBICACIONES] Error al cargar ubicaciones:", error);
        toast({
          title: "Error al cargar ubicaciones",
          description: "No se pudieron cargar las ubicaciones. Inténtalo de nuevo.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarUbicaciones();
  }, [selectedResult, entityData, relationData, toast]);

  // Función para manejar clics en ubicaciones de la tabla
  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
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
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const fecha = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });

      // Configurar encabezado azul con título
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INFORME DE UBICACIONES', 105, 20, { align: 'center' });

      // Información de la entidad
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      
      switch (selectedResult.tipo) {
        case 'persona':
          doc.text('INFORMACIÓN DE UBICACIÓN DE PERSONA', 20, 45);
          break;
        case 'vehiculo':
          doc.text('INFORMACIÓN DE UBICACIÓN DE VEHÍCULO', 20, 45);
          break;
        case 'inmueble':
          doc.text('INFORMACIÓN DE UBICACIÓN DE INMUEBLE', 20, 45);
          break;
        default:
          doc.text('INFORMACIÓN DE UBICACIÓN', 20, 45);
      }

      // Detalles de la entidad
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      let yPos = 60;
      
      doc.text(`Nombre/Identificación: ${selectedResult.nombre || selectedResult.placa || selectedResult.referencia}`, 20, yPos);
      yPos += 8;
      
      if (selectedResult.tipo === 'vehiculo' && selectedResult.marca && selectedResult.modelo) {
        doc.text(`Vehículo: ${selectedResult.marca} ${selectedResult.modelo}`, 20, yPos);
        yPos += 8;
      }
      
      if (selectedResult.direccion) {
        doc.text(`Dirección: ${selectedResult.direccion}`, 20, yPos);
        yPos += 8;
      }
      
      doc.text(`Fecha de generación: ${fecha}`, 20, yPos);
      yPos += 15;

      // Tabla de ubicaciones
      const tableData = locations.map(loc => [
        loc.title,
        loc.description,
        `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
        loc.relation === 'direct' ? 'Directa' : 'Relacionada'
      ]);

      autoTable(doc, {
        head: [['Tipo', 'Descripción', 'Coordenadas', 'Relación']],
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      // Capturar imagen del mapa
      const mapElement = mapContainerRef.current;
      if (mapElement) {
        try {
          const canvas = await html2canvas(mapElement);
          const imgData = canvas.toDataURL('image/png');
          
          // Agregar nueva página para el mapa
          doc.addPage();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('MAPA DE UBICACIONES', 20, 30);
          
          // Calcular dimensiones para ajustar el mapa
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error capturando mapa:', error);
        }
      }
      
      // Guardar PDF
      doc.save(`ubicaciones-${selectedResult.nombre || selectedResult.placa || selectedResult.referencia}-${fecha.replace(/\//g, '-')}.pdf`);
      
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Ubicaciones</h1>
          
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <SearchComponent 
                  onResultSelect={handleResultSelect}
                />
              </div>
              <div className="flex gap-2">
                {selectedResult && locations.length > 0 && (
                  <Button onClick={generatePDF} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar a PDF
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Cargando ubicaciones...</span>
              </div>
            ) : (
              <>
                {/* Mapa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-red-500" />
                      Mapa de Ubicaciones ({locations.length} ubicaciones)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={mapContainerRef} className="h-96 w-full rounded-lg overflow-hidden border">
                      <LocationMap 
                        markers={locations} 
                        center={mapCenter}
                        zoom={locations.length === 1 ? 15 : 10}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tabla de ubicaciones */}
                {locations.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Detalle de Ubicaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationsTable 
                        locations={locations} 
                        onLocationClick={handleLocationClick}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Información de la entidad seleccionada */}
                {selectedResult && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {selectedResult.tipo === "persona" && <User className="h-5 w-5" />}
                        {selectedResult.tipo === "vehiculo" && <Car className="h-5 w-5" />}
                        {selectedResult.tipo === "inmueble" && <Building className="h-5 w-5" />}
                        {selectedResult.tipo === "ubicacion" && <MapPin className="h-5 w-5" />}
                        Información de la Entidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {selectedResult.nombre || selectedResult.placa || selectedResult.referencia}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            Tipo: {selectedResult.tipo}
                          </p>
                          
                          {selectedResult.placa && (
                            <p className="text-sm text-gray-600">
                              Placa: {selectedResult.placa}
                            </p>
                          )}
                          
                          {selectedResult.direccion && (
                            <p className="text-sm text-gray-600">
                              Dirección: {selectedResult.direccion}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Estadísticas de Ubicaciones</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-medium">{locations.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Directas:</span>
                              <span className="font-medium">{locations.filter(l => l.relation === 'direct').length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Relacionadas:</span>
                              <span className="font-medium">{locations.filter(l => l.relation === 'related').length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}