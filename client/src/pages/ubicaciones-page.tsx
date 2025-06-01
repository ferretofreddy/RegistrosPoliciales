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

// Respuesta de relaciones
interface RelacionesResponse {
  personas?: PersonaEntity[];
  vehiculos?: VehiculoEntity[];
  inmuebles?: InmuebleEntity[];
  ubicaciones?: UbicacionEntity[];
  otrasUbicaciones?: UbicacionEntity[];
}

export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Obtener todas las ubicaciones de la página ubicaciones
  const { data: ubicacionesData, isLoading: ubicacionesLoading } = useQuery<{
    ubicacionesDirectas: any[];
    ubicacionesRelacionadas: any[];
  }>({
    queryKey: ['api/ubicaciones'],
    enabled: !selectedResult
  });

  // Obtener datos de la entidad seleccionada
  const { data: entityData } = useQuery<any>({
    queryKey: [selectedResult ? `api/${selectedResult.tipo === "ubicacion" ? "ubicaciones" : selectedResult.tipo + "s"}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Obtener relaciones para buscar ubicaciones
  const { data: relationData } = useQuery<RelacionesResponse>({
    queryKey: [selectedResult ? `api/relaciones/${selectedResult.tipo}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Función para generar informe PDF de ubicaciones
  const generarInformePDF = async () => {
    if (locations.length === 0) {
      toast({
        title: "No se puede generar el informe",
        description: "No hay ubicaciones para incluir en el informe",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Título del informe
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INFORME DE UBICACIONES', pageWidth / 2, 25, { align: "center" });
      
      // Fecha y hora
      const fecha = new Date().toLocaleDateString('es-ES');
      const hora = new Date().toLocaleTimeString('es-ES');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado el: ${fecha} a las ${hora}`, 20, 35);
      
      // Información de la entidad seleccionada (si existe)
      let yPos = 45;
      if (selectedResult) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('ENTIDAD SELECCIONADA:', 20, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const tipoTexto = selectedResult.tipo === 'persona' ? 'Persona' : 
                         selectedResult.tipo === 'vehiculo' ? 'Vehículo' :
                         selectedResult.tipo === 'inmueble' ? 'Inmueble' : 'Ubicación';
        
        const nombreEntidad = selectedResult.nombre || selectedResult.placa || selectedResult.direccion || `ID ${selectedResult.id}`;
        doc.text(`Tipo: ${tipoTexto}`, 20, yPos);
        yPos += 6;
        doc.text(`Identificación: ${nombreEntidad}`, 20, yPos);
        yPos += 15;
      }

      // Separar ubicaciones directas y relacionadas
      const ubicacionesDirectas = locations.filter(loc => loc.relation === 'direct');
      const ubicacionesRelacionadas = locations.filter(loc => loc.relation === 'related');

      // Tabla de ubicaciones directas
      if (ubicacionesDirectas.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('UBICACIONES DIRECTAS', 20, yPos);
        yPos += 10;

        const columnasDirectas = [
          { header: 'Tipo', dataKey: 'tipo' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Latitud', dataKey: 'latitud' },
          { header: 'Longitud', dataKey: 'longitud' }
        ];

        const datosDirectas = ubicacionesDirectas.map(loc => ({
          tipo: loc.title,
          descripcion: loc.description,
          latitud: loc.lat.toFixed(6),
          longitud: loc.lng.toFixed(6)
        }));

        autoTable(doc, {
          startY: yPos,
          head: [columnasDirectas.map(col => col.header)],
          body: datosDirectas.map(row => columnasDirectas.map(col => row[col.dataKey as keyof typeof row])),
          theme: 'grid',
          headStyles: { 
            fillColor: [34, 197, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            cellWidth: 'wrap'
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 75 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'wrap'
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Tabla de ubicaciones relacionadas
      if (ubicacionesRelacionadas.length > 0) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 30;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('UBICACIONES RELACIONADAS', 20, yPos);
        yPos += 10;

        const columnasRelacionadas = [
          { header: 'Tipo', dataKey: 'tipo' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Latitud', dataKey: 'latitud' },
          { header: 'Longitud', dataKey: 'longitud' }
        ];

        const datosRelacionadas = ubicacionesRelacionadas.map(loc => ({
          tipo: loc.title,
          descripcion: loc.description,
          latitud: loc.lat.toFixed(6),
          longitud: loc.lng.toFixed(6)
        }));

        autoTable(doc, {
          startY: yPos,
          head: [columnasRelacionadas.map(col => col.header)],
          body: datosRelacionadas.map(row => columnasRelacionadas.map(col => row[col.dataKey as keyof typeof row])),
          theme: 'grid',
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            cellWidth: 'wrap'
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 75 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'wrap'
        });
      }

      // Pie de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        const pageText = `Página ${i} de ${totalPages}`;
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("INFORME CONFIDENCIAL", 20, pageHeight - 10);
      }

      const nombreArchivo = selectedResult 
        ? `informe_ubicaciones_${selectedResult.tipo}_${selectedResult.id}_${fecha.replace(/\//g, '-')}.pdf`
        : `informe_ubicaciones_general_${fecha.replace(/\//g, '-')}.pdf`;
      
      doc.save(nombreArchivo);

      toast({
        title: "Informe generado exitosamente",
        description: `Se ha descargado el archivo: ${nombreArchivo}`
      });

    } catch (error) {
      console.error('Error al generar el informe PDF:', error);
      toast({
        title: "Error al generar informe",
        description: "No se pudo generar el informe PDF. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Manejar la selección de un resultado de búsqueda
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setLocations([]);
  };

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
  };

  // Procesar ubicaciones cuando tengamos datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        // Caso 1: Si no hay entidad seleccionada, mostrar todas las ubicaciones de la página
        if (!selectedResult && ubicacionesData) {
          console.log("[UBICACIONES] Cargando todas las ubicaciones de la página");
          
          // Procesar ubicaciones directas
          if (ubicacionesData.ubicacionesDirectas?.length > 0) {
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
          
          // Procesar ubicaciones relacionadas
          if (ubicacionesData.ubicacionesRelacionadas?.length > 0) {
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
        
        // Caso 2: Si hay entidad seleccionada, procesar ubicaciones específicas
        else if (selectedResult) {
          console.log("[UBICACIONES] Procesando entidad:", selectedResult.tipo, selectedResult);
          
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
        
          // Procesar ubicaciones directas y relacionadas
          if (relationData) {
            // Ubicaciones directas
            if (relationData.ubicaciones?.length > 0) {
              console.log("[UBICACIONES] Procesando ubicaciones directas:", relationData.ubicaciones.length);
              
              for (const ubicacion of relationData.ubicaciones) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  let title = "";
                  let description = "";
                  let entityType: EntityType = "ubicacion";
                  
                  // Determinar el tipo y descripción según el tipo de entidad principal
                  switch (selectedResult.tipo) {
                    case "persona":
                      title = ubicacion.tipo || "Domicilio";
                      description = `Domicilio de ${selectedResult.nombre}`;
                      entityType = "persona";
                      break;
                    case "inmueble":
                      title = "Ubicación del inmueble";
                      description = `Ubicación de ${selectedResult.direccion}`;
                      entityType = "inmueble";
                      break;
                    case "vehiculo":
                      title = ubicacion.tipo || "Ubicación del vehículo";
                      description = `Ubicación de vehículo ${selectedResult.placa}`;
                      entityType = "vehiculo";
                      break;
                    default:
                      title = ubicacion.tipo || "Ubicación";
                      description = ubicacion.observaciones || "Ubicación relacionada";
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
                  
                  // Centrar el mapa en la primera ubicación directa
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            
            // Otras ubicaciones relacionadas
            if (relationData.otrasUbicaciones?.length > 0) {
              console.log("[UBICACIONES] Procesando otras ubicaciones:", relationData.otrasUbicaciones.length);
              
              for (const ubicacion of relationData.otrasUbicaciones) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat,
                    lng,
                    title: ubicacion.tipo || "Ubicación relacionada",
                    description: ubicacion.observaciones || "Ubicación relacionada con la entidad",
                    type: "ubicacion",
                    relation: "related",
                    entityId: selectedResult.id
                  });
                }
              }
            }
          }
        }

        setLocations(ubicacionesEncontradas);
        console.log(`[UBICACIONES] Total ubicaciones cargadas: ${ubicacionesEncontradas.length}`);

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
  }, [selectedResult, entityData, relationData, ubicacionesData, toast]);

  const isLoadingData = isLoading || ubicacionesLoading;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <MapPin className="h-10 w-10 text-blue-600" />
              Ubicaciones
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visualiza y gestiona todas las ubicaciones del sistema. Busca una entidad específica 
              o explora todas las ubicaciones disponibles en el mapa y tablas.
            </p>
          </div>

          {/* Search Component */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Entidad
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SearchComponent onResultSelect={handleResultSelect} />
              
              {selectedResult && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedResult.tipo === "persona" && <User className="h-5 w-5 text-blue-600" />}
                      {selectedResult.tipo === "vehiculo" && <Car className="h-5 w-5 text-blue-600" />}
                      {selectedResult.tipo === "inmueble" && <Building className="h-5 w-5 text-blue-600" />}
                      {selectedResult.tipo === "ubicacion" && <MapPin className="h-5 w-5 text-blue-600" />}
                      
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedResult.nombre || selectedResult.placa || selectedResult.direccion || `Ubicación ID ${selectedResult.id}`}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          Tipo: {selectedResult.tipo}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedResult(null)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Limpiar selección
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-0 h-[600px]">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Mapa de Ubicaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-4rem)]" ref={mapContainerRef}>
                  {isLoadingData ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600">Cargando ubicaciones...</p>
                      </div>
                    </div>
                  ) : (
                    <LocationMap 
                      locations={locations}
                      center={mapCenter}
                      zoom={DEFAULT_ZOOM}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {locations.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total de ubicaciones
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Directas:</span>
                      <span className="font-semibold text-green-600">
                        {locations.filter(loc => loc.relation === 'direct').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Relacionadas:</span>
                      <span className="font-semibold text-blue-600">
                        {locations.filter(loc => loc.relation === 'related').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <Button 
                    onClick={generarInformePDF}
                    disabled={locations.length === 0 || isLoadingData}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Informe PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Locations Table */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lista de Ubicaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingData ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600">Cargando tabla...</p>
                  </div>
                </div>
              ) : (
                <LocationsTable 
                  locations={locations}
                  onLocationClick={handleLocationClick}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}