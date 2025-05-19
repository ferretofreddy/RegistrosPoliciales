import { useState, useEffect } from "react";
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

export default function EstructurasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState("informacion");
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9281, -84.0907]);

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
              <p>{entityData.identificacion}</p>
            </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.personas.map((persona: any) => (
                  <TableRow key={persona.id}>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>{persona.identificacion}</TableCell>
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
  const generatePDF = () => {
    if (!selectedResult || !entity) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const textWidth = pageWidth - 2 * margin;
      
      // Encabezado del informe
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("INFORME DE ESTRUCTURA", pageWidth / 2, 20, { align: "center" });
      doc.text("SISTEMA DE INTELIGENCIA", pageWidth / 2, 30, { align: "center" });
      
      // Fecha de generación
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, 40);
      
      // Línea divisoria
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, 45, pageWidth - margin, 45);
      
      // Información del registro
      doc.setFontSize(14);
      doc.text("INFORMACIÓN GENERAL", margin, 55);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let y = 65;
      
      const entityData = entity as any;
      
      // Información específica según el tipo de entidad
      switch (selectedResult.tipo) {
        case "persona":
          doc.text(`Nombre: ${entityData.nombre}`, margin, y); y += 7;
          doc.text(`Identificación: ${entityData.identificacion}`, margin, y); y += 7;
          
          if (entityData.alias && entityData.alias.length > 0) {
            doc.text(`Alias: ${entityData.alias.join(", ")}`, margin, y); y += 7;
          }
          
          if (entityData.telefonos && entityData.telefonos.length > 0) {
            doc.text(`Teléfonos: ${entityData.telefonos.join(", ")}`, margin, y); y += 7;
          }
          
          if (entityData.domicilios && entityData.domicilios.length > 0) {
            doc.text(`Domicilios:`, margin, y); y += 7;
            entityData.domicilios.forEach((dom: string) => {
              doc.text(`- ${dom}`, margin + 5, y); y += 6;
            });
          }
          break;
          
        case "vehiculo":
          doc.text(`Placa: ${entityData.placa}`, margin, y); y += 7;
          doc.text(`Marca: ${entityData.marca}`, margin, y); y += 7;
          doc.text(`Modelo: ${entityData.modelo}`, margin, y); y += 7;
          doc.text(`Color: ${entityData.color}`, margin, y); y += 7;
          
          if (entityData.tipo) {
            doc.text(`Tipo: ${entityData.tipo}`, margin, y); y += 7;
          }
          
          if (entityData.observaciones) {
            doc.text(`Observaciones generales: ${entityData.observaciones}`, margin, y); y += 7;
          }
          break;
          
        case "inmueble":
          doc.text(`Tipo: ${entityData.tipo}`, margin, y); y += 7;
          doc.text(`Dirección: ${entityData.direccion}`, margin, y); y += 7;
          
          if (entityData.propietario) {
            doc.text(`Propietario: ${entityData.propietario}`, margin, y); y += 7;
          }
          
          if (entityData.observaciones) {
            doc.text(`Observaciones generales: ${entityData.observaciones}`, margin, y); y += 7;
          }
          break;
          
        case "ubicacion":
          if (entityData.tipo) {
            doc.text(`Tipo: ${entityData.tipo}`, margin, y); y += 7;
          }
          
          if (entityData.latitud && entityData.longitud) {
            doc.text(`Coordenadas: Lat: ${entityData.latitud.toFixed(6)}, Lng: ${entityData.longitud.toFixed(6)}`, margin, y); y += 7;
          }
          
          if (entityData.fecha) {
            doc.text(`Fecha: ${new Date(entityData.fecha).toLocaleDateString()}`, margin, y); y += 7;
          }
          
          if (entityData.observaciones) {
            doc.text(`Observaciones generales: ${entityData.observaciones}`, margin, y); y += 7;
          }
          break;
      }
      
      y += 10;
      
      // Observaciones
      if (observaciones && observaciones.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("OBSERVACIONES", margin, y); y += 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        // Tabla de observaciones
        const obsHeaders = [["Detalle", "Fecha", "Usuario"]];
        const obsData = observaciones.map((obs: any) => [
          obs.detalle, 
          obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A",
          obs.usuario || "Usuario del sistema"
        ]);
        
        // @ts-ignore - usando la extensión autotable
        doc.autoTable({
          head: obsHeaders,
          body: obsData,
          startY: y,
          margin: { left: margin, right: margin },
          headStyles: { fillColor: [50, 50, 120] }
        });
        
        y = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Nueva página si es necesario
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      // Relaciones
      const hasRelaciones = 
        relaciones.personas?.length > 0 || 
        relaciones.vehiculos?.length > 0 || 
        relaciones.inmuebles?.length > 0;
        
      if (hasRelaciones) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("RELACIONES", margin, y); y += 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        if (relaciones.personas && relaciones.personas.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Personas relacionadas", margin, y); y += 7;
          doc.setFont("helvetica", "normal");
          
          const persHeaders = [["Nombre", "Identificación"]];
          const persData = relaciones.personas.map((persona: any) => [
            persona.nombre, persona.identificacion
          ]);
          
          // @ts-ignore
          doc.autoTable({
            head: persHeaders,
            body: persData,
            startY: y,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [70, 130, 180] }
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
        
        // Nueva página si es necesario
        if (y > 250 && (relaciones.vehiculos?.length > 0 || relaciones.inmuebles?.length > 0)) {
          doc.addPage();
          y = 20;
        }
        
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Vehículos relacionados", margin, y); y += 7;
          doc.setFont("helvetica", "normal");
          
          const vehHeaders = [["Placa", "Marca", "Modelo"]];
          const vehData = relaciones.vehiculos.map((vehiculo: any) => [
            vehiculo.placa, vehiculo.marca, vehiculo.modelo
          ]);
          
          // @ts-ignore
          doc.autoTable({
            head: vehHeaders,
            body: vehData,
            startY: y,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [46, 139, 87] }
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
        
        // Nueva página si es necesario
        if (y > 250 && relaciones.inmuebles?.length > 0) {
          doc.addPage();
          y = 20;
        }
        
        if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Inmuebles relacionados", margin, y); y += 7;
          doc.setFont("helvetica", "normal");
          
          const inmHeaders = [["Tipo", "Dirección"]];
          const inmData = relaciones.inmuebles.map((inmueble: any) => [
            inmueble.tipo, inmueble.direccion
          ]);
          
          // @ts-ignore
          doc.autoTable({
            head: inmHeaders,
            body: inmData,
            startY: y,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [147, 112, 219] }
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }
      
      // Ubicaciones - solo si hay datos de ubicaciones
      if (locations.length > 0) {
        // Nueva página para las ubicaciones
        doc.addPage();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("UBICACIONES", margin, 20);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        // Tabla de ubicaciones
        const locHeaders = [["Tipo", "Coordenadas", "Descripción"]];
        const locData = locations.map(loc => [
          loc.title,
          `Lat: ${loc.lat.toFixed(6)}, Lng: ${loc.lng.toFixed(6)}`,
          loc.description
        ]);
        
        // @ts-ignore
        doc.autoTable({
          head: locHeaders,
          body: locData,
          startY: 30,
          margin: { left: margin, right: margin },
          headStyles: { fillColor: [220, 20, 60] }
        });
      }
      
      // Agregar nota de pie de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Informe generado el ${new Date().toLocaleString()} - Página ${i} de ${totalPages}`, pageWidth / 2, 287, { align: "center" });
      }
      
      // Guardar el PDF
      const entityName = selectedResult.nombre.replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Informe_${selectedResult.tipo}_${entityName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    }
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
                          <div className="h-[350px] md:h-[450px] w-full">
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