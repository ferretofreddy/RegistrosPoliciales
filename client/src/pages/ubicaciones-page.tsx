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
  // otros campos...
}

interface VehiculoEntity {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  // otros campos...
}

interface InmuebleEntity {
  id: number;
  direccion: string;
  tipo?: string;
  // otros campos...
}

interface UbicacionEntity {
  id: number;
  tipo?: string;
  latitud: number;
  longitud: number;
  observaciones?: string;
  // otros campos...
}

interface RelacionesResponse {
  personas?: PersonaEntity[];
  vehiculos?: VehiculoEntity[];
  inmuebles?: InmuebleEntity[];
  ubicaciones?: UbicacionEntity[];
  [key: string]: any; // Para permitir otras propiedades que puedan venir en la respuesta
}



export default function UbicacionesPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    if (!selectedResult || locations.length === 0) {
      toast({
        title: "No se puede generar el informe",
        description: "Selecciona una entidad con ubicaciones para generar el informe",
        variant: "destructive"
      });
      return;
    }

    try {
      // Primero verificamos si podemos capturar el mapa
      let mapImageUrl: string | null = null;
      if (mapContainerRef.current && locations.length > 0) {
        try {
          const canvas = await html2canvas(mapContainerRef.current, {
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            scale: 1,
            backgroundColor: null,
            logging: false
          });
          
          mapImageUrl = canvas.toDataURL('image/png');
          console.log("Mapa capturado como imagen");
        } catch (e) {
          console.error("Error al capturar el mapa:", e);
        }
      }

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
        case 'ubicacion':
          doc.text('INFORMACIÓN DE UBICACIÓN', 20, 45);
          break;
      }

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 48, 190, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let yPos = 58;

      switch (selectedResult.tipo) {
        case 'persona':
          doc.text(`Nombre: ${selectedResult.nombre || selectedResult.referencia || 'N/A'}`, 20, yPos);
          if (entityData && entityData.identificacion) {
            doc.text(`Identificación: ${entityData.identificacion}`, 20, yPos + 6);
            yPos += 6;
          }
          break;
        case 'vehiculo':
          doc.text(`Marca: ${selectedResult.marca || 'N/A'}`, 20, yPos);
          doc.text(`Modelo: ${selectedResult.modelo || 'N/A'}`, 20, yPos + 6);
          doc.text(`Placa: ${selectedResult.placa || 'Sin placa'}`, 20, yPos + 12);
          yPos += 6;
          break;
        case 'inmueble':
          doc.text(`Tipo de inmueble: ${(selectedResult as any).tipo_inmueble || selectedResult.referencia || 'N/A'}`, 20, yPos);
          doc.text(`Dirección: ${selectedResult.direccion || 'N/A'}`, 20, yPos + 6);
          yPos += 6;
          break;
        case 'ubicacion':
          doc.text(`Tipo de ubicación: ${(selectedResult as any).tipo_ubicacion || selectedResult.referencia || 'N/A'}`, 20, yPos);
          if ((selectedResult as any).observaciones) {
            doc.text(`Observaciones: ${(selectedResult as any).observaciones}`, 20, yPos + 6);
            yPos += 6;
          }
          break;
      }

      doc.text(`Fecha de generación: ${fecha}`, 20, yPos + 12);
      doc.text(`Total de ubicaciones: ${locations.length}`, 20, yPos + 18);

      yPos += 35;

      // Incluir mapa si está disponible
      if (mapImageUrl) {
        try {
          if (yPos > 150) {
            doc.addPage();
            yPos = 30;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('MAPA DE UBICACIONES', 20, yPos);
          yPos += 10;

          const maxWidth = pageWidth - 40;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth * (9 / 16);
          
          const maxHeight = 100;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * (16 / 9);
          }
          
          const xOffset = (pageWidth - imgWidth) / 2;
          
          doc.addImage(mapImageUrl, 'PNG', xOffset, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
          
          doc.setFontSize(8);
          doc.text("Vista del mapa con las ubicaciones relacionadas", pageWidth / 2, yPos, { align: "center" });
          yPos += 15;
        } catch (e) {
          console.error("Error al añadir imagen del mapa al PDF:", e);
        }
      }

      // Tablas de ubicaciones
      const ubicacionesDirectas = locations.filter(loc => loc.relation === 'direct');
      const ubicacionesRelacionadas = locations.filter(loc => loc.relation === 'related');

      if (ubicacionesDirectas.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 30;
        }

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

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      if (ubicacionesRelacionadas.length > 0) {
        if (yPos > 200) {
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

      const nombreArchivo = `informe_ubicaciones_${selectedResult.tipo}_${selectedResult.id}_${fecha.replace(/\//g, '-')}.pdf`;
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
    console.log("Resultado seleccionado:", result);
    setLocations([]);
  };

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
  };

  // Procesar ubicaciones cuando tengamos datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!selectedResult) return;
      
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        console.log("[UBICACIONES] Procesando entidad:", selectedResult.tipo, selectedResult);
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
        
        // Procesar ubicaciones de los datos de relaciones
        if (relationData) {
          // 1. Ubicaciones directas
          if (relationData.ubicaciones) {
            console.log("[UBICACIONES] Procesando ubicaciones directas:", relationData.ubicaciones.length);
            
            for (const ubicacion of relationData.ubicaciones) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title: ubicacion.tipo || "Ubicación directa",
                  description: ubicacion.observaciones || `Ubicación directa de ${selectedResult.nombre || selectedResult.referencia}`,
                  type: "ubicacion",
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
          
          // 2. Otras ubicaciones
          if (relationData.otrasUbicaciones) {
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
                  description: ubicacion.observaciones || `Ubicación relacionada con ${selectedResult.nombre || selectedResult.referencia}`,
                  type: "ubicacion",
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
          
          // 3. Ubicaciones de entidades relacionadas
          if (relationData.personas) {
            console.log("[UBICACIONES] Procesando personas relacionadas:", relationData.personas.length);
            
            for (const persona of relationData.personas) {
              try {
                const response = await fetch(`/api/relaciones/persona/${persona.id}`);
                const personaData = await response.json();
                
                // Ubicaciones directas de la persona relacionada
                if (personaData.ubicaciones) {
                  for (const ubicacion of personaData.ubicaciones) {
                    const lat = parseFloat(String(ubicacion.latitud));
                    const lng = parseFloat(String(ubicacion.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacion.id,
                        lat,
                        lng,
                        title: ubicacion.tipo || "Domicilio",
                        description: `Domicilio de ${persona.nombre} (relacionada)`,
                        type: "ubicacion",
                        relation: "related",
                        entityId: persona.id
                      });
                    }
                  }
                }
                
                // Otras ubicaciones de la persona relacionada
                if (personaData.otrasUbicaciones) {
                  for (const ubicacion of personaData.otrasUbicaciones) {
                    const lat = parseFloat(String(ubicacion.latitud));
                    const lng = parseFloat(String(ubicacion.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacion.id,
                        lat,
                        lng,
                        title: ubicacion.tipo || "Avistamiento",
                        description: `${ubicacion.tipo || "Avistamiento"} de ${persona.nombre}`,
                        type: "ubicacion",
                        relation: "related",
                        entityId: persona.id
                      });
                    }
                  }
                }
              } catch (error) {
                console.error("[UBICACIONES] Error al obtener ubicaciones de persona relacionada:", error);
              }
            }
          }
          
          // 4. Inmuebles relacionados
          if (relationData.inmuebles) {
            console.log("[UBICACIONES] Procesando inmuebles relacionados:", relationData.inmuebles.length);
            
            for (const inmueble of relationData.inmuebles) {
              try {
                const response = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
                const inmuebleData = await response.json();
                
                if (inmuebleData.ubicaciones) {
                  for (const ubicacion of inmuebleData.ubicaciones) {
                    const lat = parseFloat(String(ubicacion.latitud));
                    const lng = parseFloat(String(ubicacion.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacion.id,
                        lat,
                        lng,
                        title: inmueble.tipo || "Inmueble",
                        description: `${inmueble.tipo || "Inmueble"} en ${inmueble.direccion}`,
                        type: "inmueble",
                        relation: "related",
                        entityId: inmueble.id
                      });
                    }
                  }
                }
                
                if (inmuebleData.otrasUbicaciones) {
                  for (const ubicacion of inmuebleData.otrasUbicaciones) {
                    const lat = parseFloat(String(ubicacion.latitud));
                    const lng = parseFloat(String(ubicacion.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacion.id,
                        lat,
                        lng,
                        title: ubicacion.tipo || "Ubicación",
                        description: ubicacion.observaciones || "Ubicación relacionada con inmueble",
                        type: "ubicacion",
                        relation: "related",
                        entityId: inmueble.id
                      });
                    }
                  }
                }
              } catch (error) {
                console.error("[UBICACIONES] Error al obtener ubicaciones del inmueble:", error);
              }
            }
          }
          
          // 5. Vehículos relacionados
          if (relationData.vehiculos) {
            console.log("[UBICACIONES] Procesando vehículos relacionados:", relationData.vehiculos.length);
            
            for (const vehiculo of relationData.vehiculos) {
              try {
                const response = await fetch(`/api/relaciones/vehiculo/${vehiculo.id}`);
                const vehiculoData = await response.json();
                
                if (vehiculoData.otrasUbicaciones) {
                  for (const ubicacion of vehiculoData.otrasUbicaciones) {
                    const lat = parseFloat(String(ubicacion.latitud));
                    const lng = parseFloat(String(ubicacion.longitud));
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                      ubicacionesEncontradas.push({
                        id: ubicacion.id,
                        lat,
                        lng,
                        title: ubicacion.tipo || "Avistamiento",
                        description: `${ubicacion.tipo || "Avistamiento"} de vehículo ${vehiculo.placa}`,
                        type: "vehiculo",
                        relation: "related",
                        entityId: vehiculo.id
                      });
                    }
                  }
                }
              } catch (error) {
                console.error("[UBICACIONES] Error al obtener ubicaciones del vehículo:", error);
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold">
                  Ubicaciones de{' '}
                  {selectedResult.tipo === 'persona' && selectedResult.nombre}
                  {selectedResult.tipo === 'vehiculo' && `${selectedResult.marca || ''} ${selectedResult.modelo || ''} - Placa: ${selectedResult.placa || 'Sin placa'}`}
                  {selectedResult.tipo === 'inmueble' && `${selectedResult.referencia || 'Inmueble'} en ${selectedResult.direccion || 'ubicación desconocida'}`}
                  {selectedResult.tipo === 'ubicacion' && `${selectedResult.referencia || 'Ubicación'}`}
                  <span className="ml-2 text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {selectedResult.tipo === 'persona' && 'Persona'}
                    {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                    {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                  </span>
                </h2>
                
                <Button 
                  onClick={generarInformePDF}
                  disabled={locations.length === 0 || isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Informe PDF
                </Button>
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
                          locations={locations} 
                          center={mapCenter}
                          zoom={locations.length === 1 ? 15 : 10}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tablas de ubicaciones */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ubicaciones Directas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-green-500" />
                          Ubicaciones Directas ({locations.filter(loc => loc.relation === 'direct').length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LocationsTable 
                          locations={locations.filter(loc => loc.relation === 'direct')}
                          onLocationClick={handleLocationClick}
                          type="direct"
                        />
                      </CardContent>
                    </Card>

                    {/* Ubicaciones Relacionadas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                          Ubicaciones Relacionadas ({locations.filter(loc => loc.relation === 'related').length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LocationsTable 
                          locations={locations.filter(loc => loc.relation === 'related')}
                          onLocationClick={handleLocationClick}
                          type="related"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Buscar ubicaciones
              </h3>
              <p className="text-gray-500">
                Selecciona una persona, vehículo, inmueble o ubicación para ver sus ubicaciones en el mapa
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
