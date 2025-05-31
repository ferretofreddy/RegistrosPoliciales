import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent, { SearchResult, EntityType } from "@/components/search-component";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2Icon, 
  DownloadIcon, 
  Printer, 
  User, 
  Car, 
  Building, 
  MapPin, 
  Calendar, 
  Link2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function EstructurasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState("informacion");
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Obtener los datos de la entidad
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: [selectedResult ? `/api/${selectedResult.tipo}s/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Obtener las observaciones de la entidad
  const { data: observacionesData, isLoading: isLoadingObservaciones } = useQuery({
    queryKey: [selectedResult ? `/api/${selectedResult.tipo}s/${selectedResult.id}/observaciones` : null],
    enabled: !!selectedResult,
  });

  // Obtener las relaciones de la entidad
  const { data: relacionesData, isLoading: isLoadingRelaciones } = useQuery({
    queryKey: [selectedResult ? `/api/relaciones/${selectedResult.tipo}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Estados para guardar datos procesados
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [relaciones, setRelaciones] = useState<{
    personas: any[];
    vehiculos: any[];
    inmuebles: any[];
  }>({
    personas: [],
    vehiculos: [],
    inmuebles: []
  });

  // Actualizar los estados cuando llegan los datos
  useEffect(() => {
    if (observacionesData) {
      setObservaciones(observacionesData as any[]);
    }
  }, [observacionesData]);

  useEffect(() => {
    if (relacionesData) {
      setRelaciones({
        personas: relacionesData?.personas || [],
        vehiculos: relacionesData?.vehiculos || [],
        inmuebles: relacionesData?.inmuebles || []
      });
    }
  }, [relacionesData]);

  // Cargar datos de ubicaciones cuando cambia el resultado seleccionado
  useEffect(() => {
    if (selectedResult && entity) {
      loadLocationData();
    } else {
      setLocations([]);
    }
  }, [selectedResult, entity, relacionesData]);

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setActiveTab("informacion");
    console.log("Resultado seleccionado:", result);
  };

  // Cargar datos de ubicaciones basados en la entidad seleccionada
  const loadLocationData = async () => {
    if (!selectedResult || !relacionesData) return;

    const ubicacionesEncontradas: LocationData[] = [];
    
    try {
      // Diferentes lógicas según el tipo de entidad
      if (selectedResult.tipo === 'persona') {
        // Procesar ubicaciones directas (domicilios)
        if (relacionesData.ubicaciones && relacionesData.ubicaciones.length > 0) {
          for (const ubicacion of relacionesData.ubicaciones) {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat,
                lng,
                title: ubicacion.tipo || "Domicilio",
                description: ubicacion.observaciones || `Domicilio de ${selectedResult.nombre}`,
                type: "ubicacion",
                relation: "direct",
                entityId: selectedResult.id
              });
            }
          }
          
          // Si hay ubicaciones, centrar el mapa en la primera
          if (ubicacionesEncontradas.length > 0) {
            setMapCenter([ubicacionesEncontradas[0].lat, ubicacionesEncontradas[0].lng]);
          }
        }
        
        // Procesar otras ubicaciones relacionadas
        if (relacionesData.otrasUbicaciones && relacionesData.otrasUbicaciones.length > 0) {
          for (const ubicacion of relacionesData.otrasUbicaciones) {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat,
                lng,
                title: ubicacion.tipo || "Avistamiento",
                description: ubicacion.observaciones || `Avistamiento de ${selectedResult.nombre}`,
                type: "ubicacion",
                relation: "related",
                entityId: selectedResult.id
              });
            }
          }
        }
      } 
      else if (selectedResult.tipo === 'vehiculo') {
        // Para vehículos, todas son ubicaciones relacionadas
        if (relacionesData.otrasUbicaciones && relacionesData.otrasUbicaciones.length > 0) {
          for (const ubicacion of relacionesData.otrasUbicaciones) {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat,
                lng,
                title: ubicacion.tipo || "Avistamiento",
                description: ubicacion.observaciones || `Avistamiento de ${selectedResult.nombre}`,
                type: "ubicacion",
                relation: "related",
                entityId: selectedResult.id
              });
            }
          }
          
          // Centrar el mapa en la primera ubicación
          if (ubicacionesEncontradas.length > 0) {
            setMapCenter([ubicacionesEncontradas[0].lat, ubicacionesEncontradas[0].lng]);
          }
        }
      }
      else if (selectedResult.tipo === 'inmueble') {
        // Procesar ubicaciones directas (tipo inmueble)
        if (relacionesData.ubicaciones && relacionesData.ubicaciones.length > 0) {
          for (const ubicacion of relacionesData.ubicaciones) {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat,
                lng,
                title: ubicacion.tipo || "Inmueble",
                description: ubicacion.observaciones || `Ubicación de ${selectedResult.nombre}`,
                type: "ubicacion",
                relation: "direct",
                entityId: selectedResult.id
              });
            }
          }
          
          // Si hay ubicaciones, centrar el mapa en la primera
          if (ubicacionesEncontradas.length > 0) {
            setMapCenter([ubicacionesEncontradas[0].lat, ubicacionesEncontradas[0].lng]);
          }
        }
        
        // Procesar otras ubicaciones relacionadas
        if (relacionesData.otrasUbicaciones && relacionesData.otrasUbicaciones.length > 0) {
          for (const ubicacion of relacionesData.otrasUbicaciones) {
            const lat = parseFloat(String(ubicacion.latitud));
            const lng = parseFloat(String(ubicacion.longitud));
            
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacionesEncontradas.push({
                id: ubicacion.id,
                lat,
                lng,
                title: ubicacion.tipo || "Avistamiento",
                description: ubicacion.observaciones || `Avistamiento relacionado con ${selectedResult.nombre}`,
                type: "ubicacion",
                relation: "related",
                entityId: selectedResult.id
              });
            }
          }
        }
      }
      else if (selectedResult.tipo === 'ubicacion') {
        // Para ubicaciones, la propia ubicación es directa
        if (entity) {
          const lat = parseFloat(String(entity.latitud));
          const lng = parseFloat(String(entity.longitud));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            ubicacionesEncontradas.push({
              id: entity.id,
              lat,
              lng,
              title: entity.tipo || "Ubicación",
              description: entity.observaciones || `${entity.tipo || "Ubicación"}`,
              type: "ubicacion",
              relation: "direct",
              entityId: entity.id
            });
            
            // Centrar el mapa en esta ubicación
            setMapCenter([lat, lng]);
          }
        }
        
        // Procesar otras ubicaciones relacionadas
        if (relacionesData.otrasUbicaciones && relacionesData.otrasUbicaciones.length > 0) {
          for (const ubicacion of relacionesData.otrasUbicaciones) {
            // Filtrar para excluir ubicaciones de tipo domicilio o inmueble
            const tipoLowerCase = (ubicacion.tipo || "").toLowerCase();
            const esDomicilio = tipoLowerCase === 'domicilio' || tipoLowerCase.includes('domicilio');
            const esInmueble = tipoLowerCase === 'inmueble' || tipoLowerCase.includes('inmueble');
            
            if (!esDomicilio && !esInmueble) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat,
                  lng,
                  title: ubicacion.tipo || "Ubicación",
                  description: ubicacion.observaciones || `Ubicación relacionada con ${selectedResult.nombre || "ubicación principal"}`,
                  type: "ubicacion",
                  relation: "related",
                  entityId: ubicacion.id
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
    }
    
    console.log("Ubicaciones encontradas:", ubicacionesEncontradas);
    setLocations(ubicacionesEncontradas);
  };

  // Renderizar los detalles según el tipo de entidad
  const renderEntityDetails = () => {
    if (isLoadingEntity) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (!entity) {
      return <p className="text-gray-500">No se encontró información para este registro.</p>;
    }

    const entityData = entity as any;

    switch (selectedResult?.tipo) {
      case "persona":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Nombre:</h3>
              <p>{entityData.nombre}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Identificación:</h3>
              <p>
                {entityData.tipoIdentificacion && (
                  <span className="text-gray-600 mr-2">({entityData.tipoIdentificacion})</span>
                )}
                {entityData.identificacion}
              </p>
            </div>
            {entityData.posicionEstructura && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Posición en la Estructura:</h3>
                <Badge variant="secondary" className="font-medium">{entityData.posicionEstructura}</Badge>
              </div>
            )}
            {entityData.alias && entityData.alias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="font-semibold">Alias:</h3>
                {entityData.alias.map((alias: string, index: number) => (
                  <Badge key={index} variant="outline">{alias}</Badge>
                ))}
              </div>
            )}
            {entityData.telefonos && entityData.telefonos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="font-semibold">Teléfonos:</h3>
                {entityData.telefonos.map((telefono: string, index: number) => (
                  <Badge key={index} variant="outline">{telefono}</Badge>
                ))}
              </div>
            )}
            {entityData.domicilios && entityData.domicilios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <h3 className="font-semibold">Domicilios:</h3>
                {entityData.domicilios.map((domicilio: string, index: number) => (
                  <Badge key={index} variant="outline">{domicilio}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      case "vehiculo":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Placa:</h3>
              <p>{entityData.placa}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Marca:</h3>
              <p>{entityData.marca}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Modelo:</h3>
              <p>{entityData.modelo}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Color:</h3>
              <p>{entityData.color}</p>
            </div>
            {entityData.tipo && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Tipo:</h3>
                <p>{entityData.tipo}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "inmueble":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Tipo:</h3>
              <p>{entityData.tipo}</p>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Dirección:</h3>
              <p>{entityData.direccion}</p>
            </div>
            {entityData.propietario && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Propietario:</h3>
                <p>{entityData.propietario}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "ubicacion":
        return (
          <div className="space-y-3">
            {entityData.tipo && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Tipo:</h3>
                <p>{entityData.tipo}</p>
              </div>
            )}
            {entityData.latitud && entityData.longitud && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Coordenadas:</h3>
                <p>Lat: {entityData.latitud.toFixed(6)}, Lng: {entityData.longitud.toFixed(6)}</p>
              </div>
            )}
            {entityData.fecha && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Fecha:</h3>
                <p>{new Date(entityData.fecha).toLocaleDateString()}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Observaciones generales:</h3>
                <p>{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-500">Tipo de entidad no reconocido.</p>;
    }
  };

  // Renderizar tabla de observaciones
  const renderObservaciones = () => {
    if (isLoadingObservaciones) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    if (!observaciones || observaciones.length === 0) {
      return <p className="text-gray-500">No hay observaciones registradas para esta entidad.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Detalle</TableHead>
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead className="w-[120px]">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {observaciones.map((obs: any, index: number) => (
            <TableRow key={index}>
              <TableCell>{obs.detalle}</TableCell>
              <TableCell className="font-medium">
                {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>{obs.usuario || "Usuario del sistema"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Renderizar sección de relaciones
  const renderRelaciones = () => {
    if (isLoadingRelaciones) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    const hasRelaciones = 
      relaciones.personas?.length > 0 || 
      relaciones.vehiculos?.length > 0 || 
      relaciones.inmuebles?.length > 0;

    if (!hasRelaciones) {
      return <p className="text-gray-500">No hay relaciones registradas para esta entidad.</p>;
    }

    return (
      <div className="space-y-6">
        {/* Personas relacionadas */}
        {relaciones.personas && relaciones.personas.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Personas relacionadas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Posición en la estructura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.personas.map((persona: any) => (
                  <TableRow key={persona.id}>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>
                      {persona.tipoIdentificacion && (
                        <span className="text-gray-600 mr-2">({persona.tipoIdentificacion})</span>
                      )}
                      {persona.identificacion}
                    </TableCell>
                    <TableCell>
                      {persona.posicionEstructura && persona.posicionEstructura !== 'sin_posicion' 
                        ? persona.posicionEstructura 
                        : <span className="text-gray-400 italic">Sin posición específica</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Vehículos relacionados */}
        {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Vehículos relacionados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.vehiculos.map((vehiculo: any) => (
                  <TableRow key={vehiculo.id}>
                    <TableCell>{vehiculo.placa}</TableCell>
                    <TableCell>{vehiculo.marca}</TableCell>
                    <TableCell>{vehiculo.modelo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Inmuebles relacionados */}
        {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">Inmuebles relacionados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.inmuebles.map((inmueble: any) => (
                  <TableRow key={inmueble.id}>
                    <TableCell>{inmueble.tipo}</TableCell>
                    <TableCell>{inmueble.direccion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  // Función para generar el PDF
  const generatePDF = async () => {
    if (!selectedResult || !entity) return;

    try {
      // Primero verificamos si podemos capturar el mapa
      let mapImageUrl: string | null = null;
      if (mapContainerRef.current && locations.length > 0) {
        try {
          // Intentamos capturar el mapa como imagen
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
          // Continuamos sin la imagen del mapa
        }
      }

      // Utilizamos una estrategia simple y robusta para el PDF
      const doc = new jsPDF();
      
      // Configuración inicial
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      
      // Encabezado profesional con fondo
      doc.setFillColor(25, 25, 112); // Azul oscuro
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Título principal en blanco
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INFORME DE ESTRUCTURAS Y ASOCIACIONES", pageWidth / 2, 15, { align: "center" });
      
      // Subtítulo con tipo y nombre de entidad
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${selectedResult.tipo.toUpperCase()}: ${selectedResult.nombre}`, pageWidth / 2, 25, { align: "center" });
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0);
      
      // Información del documento
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - margin, 45, { align: "right" });
      doc.text(`Sistema de Gestión de Estructuras`, margin, 45);
      
      // Línea separadora elegante
      doc.setDrawColor(25, 25, 112);
      doc.setLineWidth(1);
      doc.line(margin, 50, pageWidth - margin, 50);
      
      // Sección de información general
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 112);
      doc.text("INFORMACIÓN GENERAL", margin, 65);
      doc.setTextColor(0, 0, 0);
      
      // Contenido específico según tipo
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let y = 75;
      
      const entityData = entity as any;
      
      // Información según tipo de entidad
      switch (selectedResult.tipo) {
        case "persona":
          y = addTextRow(doc, "Nombre:", entityData.nombre || "N/A", margin, y);
          y = addTextRow(doc, "Identificación:", entityData.identificacion || "N/A", margin, y);
          
          if (entityData.posicionEstructura && entityData.posicionEstructura !== 'sin_posicion') {
            y = addTextRow(doc, "Posición en la estructura:", entityData.posicionEstructura, margin, y);
          } else {
            y = addTextRow(doc, "Posición en la estructura:", "Sin posición específica", margin, y);
          }
          
          if (entityData.alias && entityData.alias.length > 0) {
            y = addTextRow(doc, "Alias:", entityData.alias.join(", "), margin, y);
          }
          
          if (entityData.telefonos && entityData.telefonos.length > 0) {
            y = addTextRow(doc, "Teléfonos:", entityData.telefonos.join(", "), margin, y);
          }
          
          if (entityData.domicilios && entityData.domicilios.length > 0) {
            doc.text("Domicilios:", margin, y); y += 5;
            
            entityData.domicilios.forEach((dom: string) => {
              if (dom && dom.trim()) {
                // Limitar longitud del texto
                const text = dom.length > 50 ? dom.substring(0, 50) + "..." : dom;
                doc.text(`• ${text}`, margin + 5, y); y += 5;
              }
            });
          }
          break;
          
        case "vehiculo":
          y = addTextRow(doc, "Placa:", entityData.placa || "N/A", margin, y);
          y = addTextRow(doc, "Marca:", entityData.marca || "N/A", margin, y);
          y = addTextRow(doc, "Modelo:", entityData.modelo || "N/A", margin, y);
          y = addTextRow(doc, "Color:", entityData.color || "N/A", margin, y);
          
          if (entityData.tipo) {
            y = addTextRow(doc, "Tipo:", entityData.tipo, margin, y);
          }
          
          if (entityData.observaciones) {
            const text = entityData.observaciones.length > 80 
              ? entityData.observaciones.substring(0, 80) + "..." 
              : entityData.observaciones;
            y = addTextRow(doc, "Observaciones:", text, margin, y);
          }
          break;
          
        case "inmueble":
          y = addTextRow(doc, "Tipo:", entityData.tipo || "N/A", margin, y);
          
          if (entityData.direccion) {
            const text = entityData.direccion.length > 80 
              ? entityData.direccion.substring(0, 80) + "..." 
              : entityData.direccion;
            y = addTextRow(doc, "Dirección:", text, margin, y);
          } else {
            y = addTextRow(doc, "Dirección:", "N/A", margin, y);
          }
          
          if (entityData.propietario) {
            y = addTextRow(doc, "Propietario:", entityData.propietario, margin, y);
          }
          
          if (entityData.observaciones) {
            const text = entityData.observaciones.length > 80 
              ? entityData.observaciones.substring(0, 80) + "..." 
              : entityData.observaciones;
            y = addTextRow(doc, "Observaciones:", text, margin, y);
          }
          break;
          
        case "ubicacion":
          if (entityData.tipo) {
            y = addTextRow(doc, "Tipo:", entityData.tipo, margin, y);
          }
          
          if (entityData.latitud !== undefined && entityData.longitud !== undefined) {
            const lat = parseFloat(String(entityData.latitud));
            const lng = parseFloat(String(entityData.longitud));
            if (!isNaN(lat) && !isNaN(lng)) {
              y = addTextRow(doc, "Coordenadas:", `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`, margin, y);
            } else {
              y = addTextRow(doc, "Coordenadas:", "No disponibles", margin, y);
            }
          }
          
          if (entityData.fecha) {
            try {
              const fecha = new Date(entityData.fecha).toLocaleDateString();
              y = addTextRow(doc, "Fecha:", fecha, margin, y);
            } catch (e) {
              y = addTextRow(doc, "Fecha:", "No disponible", margin, y);
            }
          }
          
          if (entityData.observaciones) {
            const text = entityData.observaciones.length > 80 
              ? entityData.observaciones.substring(0, 80) + "..." 
              : entityData.observaciones;
            y = addTextRow(doc, "Observaciones:", text, margin, y);
          }
          break;
      }
      
      // Nueva página para observaciones si estamos cerca del final
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      // Observaciones
      if (observaciones && observaciones.length > 0) {
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("OBSERVACIONES", margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Imprimimos las observaciones como texto simple
        observaciones.forEach((obs: any, index: number) => {
          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }
          
          const detalle = obs.detalle || "Sin detalle";
          const fecha = obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A";
          const usuario = obs.usuario || "Sistema";
          
          // Limitamos el largo del detalle para evitar problemas
          const textoDetalle = detalle.length > 60 ? detalle.substring(0, 60) + "..." : detalle;
          
          doc.setFont("helvetica", "bold");
          doc.text(`Observación #${index+1}:`, margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          doc.text(`• ${textoDetalle}`, margin + 5, y); y += 5;
          doc.text(`• Fecha: ${fecha} - Usuario: ${usuario}`, margin + 5, y); y += 8;
        });
      }
      
      // Nueva página para relaciones si estamos cerca del final
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      // Relaciones
      const hasRelaciones = 
        relaciones.personas?.length > 0 || 
        relaciones.vehiculos?.length > 0 || 
        relaciones.inmuebles?.length > 0;
        
      if (hasRelaciones) {
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELACIONES", margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Personas relacionadas en formato tabla
        if (relaciones.personas && relaciones.personas.length > 0) {
          // Verificar espacio para la tabla
          const tableHeight = (relaciones.personas.length + 2) * 6 + 15; // encabezado + filas + espacios
          if (y + tableHeight > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("PERSONAS RELACIONADAS", margin, y); 
          y += 8;
          
          // Línea de separación
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;
          
          // Configuración de la tabla
          const tableX = margin;
          const tableWidth = pageWidth - (2 * margin);
          const col1Width = tableWidth * 0.4; // Nombre - 40%
          const col2Width = tableWidth * 0.3; // Identificación - 30%
          const col3Width = tableWidth * 0.3; // Posición - 30%
          
          // Encabezados de la tabla
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setFillColor(240, 240, 240); // Fondo gris claro para encabezados
          
          // Rectángulos de fondo para encabezados
          doc.rect(tableX, y - 2, col1Width, 6, 'F');
          doc.rect(tableX + col1Width, y - 2, col2Width, 6, 'F');
          doc.rect(tableX + col1Width + col2Width, y - 2, col3Width, 6, 'F');
          
          // Texto de encabezados
          doc.setTextColor(0, 0, 0);
          doc.text("Nombre", tableX + 2, y + 2);
          doc.text("Identificación", tableX + col1Width + 2, y + 2);
          doc.text("Posición en la estructura", tableX + col1Width + col2Width + 2, y + 2);
          y += 6;
          
          // Línea bajo encabezados
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(tableX, y, tableX + tableWidth, y);
          y += 2;
          
          // Filas de datos
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          
          relaciones.personas.forEach((persona: any, index: number) => {
            if (y > pageHeight - 20) {
              doc.addPage();
              y = 20;
            }
            
            const nombre = persona.nombre || "Sin nombre";
            const identificacionCompleta = persona.tipoIdentificacion 
              ? `(${persona.tipoIdentificacion}) ${persona.identificacion || "Sin identificación"}`
              : persona.identificacion || "Sin identificación";
            const posicion = persona.posicionEstructura && persona.posicionEstructura !== 'sin_posicion' 
              ? persona.posicionEstructura 
              : "Sin posición específica";
            
            // Fondo alternado para las filas
            if (index % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(tableX, y - 1, tableWidth, 5, 'F');
            }
            
            // Texto de la fila
            doc.setTextColor(0, 0, 0);
            
            // Truncar texto si es muy largo
            const maxNombreLength = 25;
            const maxIdLength = 25; // Aumentado para incluir tipo de identificación
            const maxPosicionLength = 20;
            
            const nombreDisplay = nombre.length > maxNombreLength ? nombre.substring(0, maxNombreLength) + "..." : nombre;
            const idDisplay = identificacionCompleta.length > maxIdLength ? identificacionCompleta.substring(0, maxIdLength) + "..." : identificacionCompleta;
            const posicionDisplay = posicion.length > maxPosicionLength ? posicion.substring(0, maxPosicionLength) + "..." : posicion;
            
            doc.text(nombreDisplay, tableX + 2, y + 2);
            doc.text(idDisplay, tableX + col1Width + 2, y + 2);
            doc.text(posicionDisplay, tableX + col1Width + col2Width + 2, y + 2);
            
            // Líneas verticales de separación
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(tableX + col1Width, y - 1, tableX + col1Width, y + 4);
            doc.line(tableX + col1Width + col2Width, y - 1, tableX + col1Width + col2Width, y + 4);
            
            y += 5;
          });
          
          // Línea final de la tabla
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(tableX, y, tableX + tableWidth, y);
          y += 8;
        }
        
        // Vehículos relacionados
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.text("Vehículos relacionados:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          relaciones.vehiculos.forEach((vehiculo: any) => {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const placa = vehiculo.placa || "Sin placa";
            const marca = vehiculo.marca || "Sin marca";
            const modelo = vehiculo.modelo || "Sin modelo";
            
            doc.text(`• ${placa}: ${marca} ${modelo}`, margin + 5, y); y += 5;
          });
          
          y += 5;
        }
        
        // Inmuebles relacionados
        if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.text("Inmuebles relacionados:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          relaciones.inmuebles.forEach((inmueble: any) => {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const tipo = inmueble.tipo || "Sin tipo";
            const direccion = inmueble.direccion || "Sin dirección";
            
            // Limitar la longitud de la dirección
            const textoDir = direccion.length > 50 ? direccion.substring(0, 50) + "..." : direccion;
            
            doc.text(`• ${tipo}: ${textoDir}`, margin + 5, y); y += 5;
          });
        }
      }

      
      // Pie de página en todas las páginas
      try {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          
          // Centrar el número de página
          const pageText = `Página ${i} de ${totalPages}`;
          doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
          
          // Texto confidencial a la izquierda
          doc.text("INFORME CONFIDENCIAL", margin, pageHeight - 10);
        }
      } catch (e) {
        console.error("Error al añadir pies de página:", e);
      }
      
      // Guardar el PDF
      try {
        // Limpiar el nombre para el archivo
        let nombre = selectedResult.nombre || "informe";
        nombre = nombre.replace(/[^a-zA-Z0-9]/g, "_");
        nombre = nombre.substring(0, 20); // Limitar longitud
        
        doc.save(`Informe_${nombre}.pdf`);
      } catch (e) {
        console.error("Error al guardar PDF:", e);
        alert("Ocurrió un error al guardar el PDF");
      }
    } catch (error) {
      console.error("Error general al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    }
  };
  
  // Función auxiliar para añadir texto con etiqueta
  const addTextRow = (doc: any, label: string, value: string, x: number, y: number): number => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    
    // Usar más espacio para etiquetas largas
    const offset = label.includes("Posición en la estructura") ? 55 : 
                   label.includes("Coordenadas") ? 35 : 30;
    
    doc.text(value, x + offset, y);
    return y + 5;
  };

  // Componente principal
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Estructuras</h1>
            
            {selectedResult && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={generatePDF}
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Exportar PDF</span>
              </Button>
            )}
          </div>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {!selectedResult ? (
            <>
              <Alert className="mb-6">
                <Building2Icon className="h-4 w-4" />
                <AlertTitle>Búsqueda de estructuras</AlertTitle>
                <AlertDescription>
                  Busque inmuebles y estructuras físicas registradas, o relacionadas con personas y vehículos en el sistema.
                </AlertDescription>
              </Alert>
              
              <div className="border rounded-md p-4 min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                <p className="mb-2">Use el buscador para encontrar estructuras</p>
                <p className="text-sm">Los detalles de la estructura se mostrarán aquí</p>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedResult.nombre}
                  <span className="ml-2 text-sm font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {selectedResult.tipo === 'persona' && 'Persona'}
                    {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                    {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                    {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                  </span>
                </h2>
              </div>
              
              <div className="space-y-8 print:space-y-4">
                {/* Bloque de Información Detallada */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-3">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        <span>Información Detallada</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-2">
                        {renderEntityDetails()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        <span>Observaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-1">
                        {renderObservaciones()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Bloque de Relaciones */}
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Link2 className="h-5 w-5" />
                      <span>Relaciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-1">
                      {renderRelaciones()}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Bloque de Ubicaciones */}
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      <span>Ubicaciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {locations.length > 0 ? (
                      <div className="space-y-6">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="h-[350px] md:h-[450px] w-full" ref={mapContainerRef}>
                            <LocationMap 
                              markers={locations} 
                              center={mapCenter}
                              zoom={15}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-md font-semibold mb-3">Detalles de ubicaciones</h3>
                          <LocationsTable locations={locations} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                        <MapPin className="h-12 w-12 mb-4 text-gray-400" />
                        <p className="mb-1 text-lg">No hay ubicaciones registradas</p>
                        <p className="text-sm text-center">No se encontraron coordenadas para esta entidad</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}