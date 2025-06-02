import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/main-layout";
import LocationMap from "@/components/location-map";
import EntityDetails from "@/components/entity-details";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface SearchResult {
  id: number;
  nombre: string;
  tipo: string;
}

interface LocationData {
  id: number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  type: string;
  relation: string;
  entityId: number;
}

interface RelacionesResponse {
  personas?: Array<{ id: number; nombre: string; apellidos: string }>;
  vehiculos?: Array<{ id: number; marca: string; modelo: string; placa: string }>;
  inmuebles?: Array<{ id: number; direccion: string; tipo_inmueble: any }>;
  ubicaciones?: Array<{ id: number; tipo: string; observaciones: string }>;
}

export default function UbicacionesPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([8.6, -82.9]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Solo obtener todas las ubicaciones si no hay entidad seleccionada (deshabilitado para empezar vacío)
  const { data: ubicacionesData, isLoading: ubicacionesLoading } = useQuery<{
    ubicacionesDirectas: any[];
    ubicacionesRelacionadas: any[];
  }>({
    queryKey: ['api/ubicaciones'],
    enabled: false // Deshabilitado para que el mapa empiece vacío
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

  // Función para generar informe PDF
  const generarInformePDF = async () => {
    if (!selectedResult || locations.length === 0) {
      toast({
        title: "No se puede generar el informe",
        description: "Selecciona una entidad con ubicaciones para generar el informe",
        variant: "destructive"
      });
      return;
    }

    try {
      let mapImageUrl: string | null = null;
      if (mapContainerRef.current && locations.length > 0) {
        try {
          const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
          });
          mapImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        } catch (mapError) {
          console.warn("No se pudo capturar la imagen del mapa:", mapError);
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text("INFORME DE UBICACIONES", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // Información de la entidad
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("ENTIDAD CONSULTADA:", 20, yPosition);
      yPosition += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const entityName = selectedResult.nombre;
      const entityType = selectedResult.tipo === 'persona' ? 'Persona' :
                        selectedResult.tipo === 'vehiculo' ? 'Vehículo' :
                        selectedResult.tipo === 'inmueble' ? 'Inmueble' : 'Ubicación';
      doc.text(`Tipo: ${entityType}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Nombre: ${entityName}`, 20, yPosition);
      yPosition += 6;

      // Fecha de generación
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Fecha de consulta: ${fecha}`, 20, yPosition);
      yPosition += 15;

      // Incluir imagen del mapa si está disponible
      if (mapImageUrl && locations.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("MAPA DE UBICACIONES:", 20, yPosition);
        yPosition += 10;

        const mapWidth = pageWidth - 40;
        const mapHeight = 120;
        
        if (yPosition + mapHeight > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.addImage(mapImageUrl, 'JPEG', 20, yPosition, mapWidth, mapHeight);
        yPosition += mapHeight + 15;
      }

      // Lista de ubicaciones
      if (yPosition + 30 > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("UBICACIONES ENCONTRADAS:", 20, yPosition);
      yPosition += 10;

      locations.forEach((location, index) => {
        if (yPosition + 25 > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${location.title}`, 20, yPosition);
        yPosition += 6;

        doc.setFont("helvetica", "normal");
        doc.text(`   Coordenadas: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`, 20, yPosition);
        yPosition += 5;
        
        if (location.description) {
          const descLines = doc.splitTextToSize(`   Descripción: ${location.description}`, pageWidth - 40);
          doc.text(descLines, 20, yPosition);
          yPosition += descLines.length * 5;
        }
        
        doc.text(`   Tipo de relación: ${location.relation === 'direct' ? 'Directa' : 'Relacionada'}`, 20, yPosition);
        yPosition += 8;
      });

      // Pie de página
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("Sistema de Registros Policiales", pageWidth - 20, pageHeight - 10, { align: "right" });
      }

      // Descargar el PDF
      const fileName = `informe_ubicaciones_${selectedResult.tipo}_${selectedResult.id}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Informe generado exitosamente",
        description: `Se ha descargado el archivo: ${fileName}`,
      });

    } catch (error) {
      console.error("Error al generar el informe PDF:", error);
      toast({
        title: "Error al generar el informe",
        description: "No se pudo generar el informe PDF. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Función de búsqueda
  const buscar = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      setSelectedResult(null);
      return;
    }

    try {
      const response = await fetch(`/api/buscar?q=${encodeURIComponent(query)}&tipos=persona,vehiculo,inmueble,ubicacion`);
      if (!response.ok) throw new Error("Error en la búsqueda");
      
      const data = await response.json();
      console.log("Datos de búsqueda recibidos:", data);
      // El servidor puede devolver directamente un array o un objeto con resultados
      const resultados = Array.isArray(data) ? data : (data.resultados || []);
      setSearchResults(resultados);
    } catch (error) {
      console.error("Error al buscar:", error);
      toast({
        title: "Error en la búsqueda",
        description: "No se pudo realizar la búsqueda. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Función para seleccionar una entidad
  const seleccionarEntidad = (result: SearchResult) => {
    setSelectedResult(result);
    setSearchResults([]);
    setQuery(result.nombre);
  };

  // Función para limpiar la búsqueda
  const limpiarBusqueda = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedResult(null);
  };

  // Función para manejar clic en una ubicación del mapa
  const handleLocationClick = (location: LocationData) => {
    console.log("[UBICACIONES] Clic en ubicación:", location);
    
    if (location.type !== 'ubicacion' && location.entityId) {
      const entidadSeleccionada: SearchResult = {
        id: location.entityId,
        nombre: location.title,
        tipo: location.type
      };
      
      setSelectedResult(entidadSeleccionada);
      setQuery(location.title);
    }
  };

  // Procesar ubicaciones cuando tengamos datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        // Solo cargar ubicaciones cuando hay una entidad seleccionada
        if (!selectedResult) {
          console.log("[UBICACIONES] No hay entidad seleccionada, mapa vacío");
          setLocations([]);
          setIsLoading(false);
          return;
        }
        
        // Caso 2: Si hay entidad seleccionada, buscar sus ubicaciones
        if (selectedResult && entityData) {
          console.log("[UBICACIONES] Procesando entidad seleccionada:", selectedResult);
          
          // Si es una ubicación directa, usar coordenadas reales de la base de datos
          if (selectedResult.tipo === "ubicacion" && entityData.latitud && entityData.longitud) {
            const lat = parseFloat(String(entityData.latitud));
            const lng = parseFloat(String(entityData.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: entityData.id,
                lat,
                lng,
                title: entityData.tipo || "Ubicación",
                description: entityData.observaciones || "Ubicación principal",
                type: "ubicacion",
                relation: "direct",
                entityId: entityData.id
              });
              
              setMapCenter([lat, lng]);
              hasCenteredMap = true;
            }
          }
          
          // Buscar ubicaciones de entidades relacionadas usando coordenadas reales
          if (relationData) {
            // Procesar ubicaciones relacionadas
            if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              for (const ubicacion of relationData.ubicaciones) {
                try {
                  const response = await fetch(`/api/ubicaciones/${ubicacion.id}`);
                  if (response.ok) {
                    const ubicacionData = await response.json();
                    const lat = parseFloat(String(ubicacionData.latitud));
                    const lng = parseFloat(String(ubicacionData.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacionData.id,
                        lat,
                        lng,
                        title: ubicacionData.tipo || "Ubicación relacionada",
                        description: ubicacionData.observaciones || "",
                        type: "ubicacion",
                        relation: "related",
                        entityId: ubicacionData.id
                      });
                      
                      if (!hasCenteredMap) {
                        setMapCenter([lat, lng]);
                        hasCenteredMap = true;
                      }
                    }
                  }
                } catch (error) {
                  console.error("[UBICACIONES] Error al obtener ubicación relacionada:", error);
                }
              }
            }

            // Procesar inmuebles relacionados usando coordenadas reales
            if (relationData.inmuebles && relationData.inmuebles.length > 0) {
              for (const inmueble of relationData.inmuebles) {
                try {
                  const response = await fetch(`/api/inmuebles/${inmueble.id}`);
                  if (response.ok) {
                    const inmuebleData = await response.json();
                    if (inmuebleData.ubicacion && inmuebleData.ubicacion.latitud && inmuebleData.ubicacion.longitud) {
                      const lat = parseFloat(String(inmuebleData.ubicacion.latitud));
                      const lng = parseFloat(String(inmuebleData.ubicacion.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: inmuebleData.id,
                          lat,
                          lng,
                          title: `Inmueble: ${inmuebleData.direccion}`,
                          description: `${inmuebleData.tipo_inmueble?.nombre || 'Inmueble'} - ${inmuebleData.direccion}`,
                          type: "inmueble",
                          relation: "related",
                          entityId: inmuebleData.id
                        });
                        
                        if (!hasCenteredMap) {
                          setMapCenter([lat, lng]);
                          hasCenteredMap = true;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("[UBICACIONES] Error al obtener ubicación del inmueble:", error);
                }
              }
            }

            // Procesar vehículos relacionados usando coordenadas reales
            if (relationData.vehiculos && relationData.vehiculos.length > 0) {
              for (const vehiculo of relationData.vehiculos) {
                try {
                  const relResponse = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
                  if (relResponse.ok) {
                    const relData = await relResponse.json();
                    if (relData.ubicaciones?.length > 0) {
                      for (const ubicacionRel of relData.ubicaciones) {
                        const ubResponse = await fetch(`/api/ubicaciones/${ubicacionRel.id}`);
                        if (ubResponse.ok) {
                          const ubicacionData = await ubResponse.json();
                          const lat = parseFloat(String(ubicacionData.latitud));
                          const lng = parseFloat(String(ubicacionData.longitud));
                          
                          if (!isNaN(lat) && !isNaN(lng)) {
                            ubicacionesEncontradas.push({
                              id: ubicacionData.id,
                              lat,
                              lng,
                              title: `Vehículo: ${vehiculo.marca} ${vehiculo.modelo}`,
                              description: `Placa: ${vehiculo.placa} - ${ubicacionData.observaciones || ''}`,
                              type: "vehiculo",
                              relation: "related",
                              entityId: vehiculo.id
                            });
                          }
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Ubicaciones</h1>

          {/* Búsqueda */}
          <div className="relative mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar persona, vehículo, inmueble o ubicación..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && buscar()}
                  className="pl-10"
                />
              </div>
              <Button onClick={buscar} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              {selectedResult && (
                <Button variant="outline" onClick={limpiarBusqueda}>
                  Limpiar
                </Button>
              )}
              {selectedResult && locations.length > 0 && (
                <Button variant="outline" onClick={generarInformePDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
                {searchResults.map((result) => (
                  <div
                    key={`${result.tipo}-${result.id}`}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => seleccionarEntidad(result)}
                  >
                    <div className="font-medium">{result.nombre}</div>
                    <div className="text-sm text-gray-500 capitalize">{result.tipo}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estado de carga */}
          {(isLoading || ubicacionesLoading) && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando ubicaciones...</p>
              </div>
            </div>
          )}

          {/* Información de la entidad seleccionada */}
          {selectedResult && entityData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <EntityDetails entity={entityData} entityType={selectedResult.tipo} />
            </motion.div>
          )}

          {/* Mensaje cuando no hay ubicaciones */}
          {!isLoading && !ubicacionesLoading && locations.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedResult ? "No se encontraron ubicaciones" : "Busca una entidad para ver sus ubicaciones"}
              </h3>
              <p className="text-gray-500">
                {selectedResult 
                  ? "Esta entidad no tiene ubicaciones asociadas en el sistema."
                  : "Utiliza el buscador para encontrar personas, vehículos, inmuebles o ubicaciones específicas."
                }
              </p>
            </div>
          )}

          {/* Mapa de ubicaciones */}
          {locations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mapa de Ubicaciones ({locations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapContainerRef}>
                  <LocationMap
                    center={mapCenter}
                    locations={locations} 
                    onLocationClick={handleLocationClick}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}