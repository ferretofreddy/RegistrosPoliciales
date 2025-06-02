import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent, { SearchResult, EntityType } from "@/components/search-component";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2Icon, 
  DownloadIcon, 
  User, 
  Calendar, 
  Link2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

export default function EstructurasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
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

  // Actualizar los estados cuando llegan los datos
  useEffect(() => {
    if (observacionesData) {
      setObservaciones(observacionesData as any[]);
    }
  }, [observacionesData]);

  useEffect(() => {
    if (relacionesData) {
      setRelaciones({
        personas: (relacionesData as any)?.personas || [],
        vehiculos: (relacionesData as any)?.vehiculos || [],
        inmuebles: (relacionesData as any)?.inmuebles || []
      });
    }
  }, [relacionesData]);

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Nombre:</h3>
              <p className="text-sm sm:text-base">{entityData.nombre}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Identificación:</h3>
              <p className="text-sm sm:text-base">
                {entityData.tipoIdentificacion && (
                  <span className="text-gray-600 mr-2">({entityData.tipoIdentificacion})</span>
                )}
                {entityData.identificacion}
              </p>
            </div>
            {entityData.posicionEstructura && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Posición en la Estructura:</h3>
                <Badge variant="secondary" className="font-medium text-xs sm:text-sm w-fit">{entityData.posicionEstructura}</Badge>
              </div>
            )}
            {entityData.alias && entityData.alias.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Alias:</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {entityData.alias.map((alias: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs sm:text-sm">{alias}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entityData.telefonos && entityData.telefonos.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Teléfonos:</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {entityData.telefonos.map((telefono: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs sm:text-sm">{telefono}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entityData.domicilios && entityData.domicilios.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Domicilios:</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {entityData.domicilios.map((domicilio: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs sm:text-sm">{domicilio}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "vehiculo":
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Placa:</h3>
              <p className="text-sm sm:text-base">{entityData.placa}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Marca:</h3>
              <p className="text-sm sm:text-base">{entityData.marca}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Modelo:</h3>
              <p className="text-sm sm:text-base">{entityData.modelo}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Color:</h3>
              <p className="text-sm sm:text-base">{entityData.color}</p>
            </div>
            {entityData.tipo && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Tipo:</h3>
                <p className="text-sm sm:text-base">{entityData.tipo}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Observaciones generales:</h3>
                <p className="text-sm sm:text-base break-words">{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "inmueble":
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Tipo:</h3>
              <p className="text-sm sm:text-base">{entityData.tipo}</p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-sm sm:text-base">Dirección:</h3>
              <p className="text-sm sm:text-base break-words">{entityData.direccion}</p>
            </div>
            {entityData.propietario && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Propietario:</h3>
                <p className="text-sm sm:text-base">{entityData.propietario}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Observaciones generales:</h3>
                <p className="text-sm sm:text-base break-words">{entityData.observaciones}</p>
              </div>
            )}
          </div>
        );
      case "ubicacion":
        return (
          <div className="space-y-3">
            {entityData.tipo && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Tipo:</h3>
                <p className="text-sm sm:text-base">{entityData.tipo}</p>
              </div>
            )}
            {entityData.latitud && entityData.longitud && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Coordenadas:</h3>
                <p className="text-sm sm:text-base font-mono">Lat: {entityData.latitud.toFixed(6)}, Lng: {entityData.longitud.toFixed(6)}</p>
              </div>
            )}
            {entityData.fecha && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Fecha:</h3>
                <p className="text-sm sm:text-base">{new Date(entityData.fecha).toLocaleDateString()}</p>
              </div>
            )}
            {entityData.observaciones && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Observaciones generales:</h3>
                <p className="text-sm sm:text-base break-words">{entityData.observaciones}</p>
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
      <div className="space-y-3">
        {observaciones.map((obs: any, index: number) => (
          <div key={index} className="bg-gray-50 p-3 rounded border">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-700">
                {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'}
              </span>
              <span className="text-xs text-gray-500">{obs.usuario || 'Sistema'}</span>
            </div>
            <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
              {obs.detalle || 'Sin detalle'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Función para manejar clics en ítems relacionados
  const handleRelatedItemClick = (item: { id: number; tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion"; nombre?: string; referencia?: string }) => {
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

  // Componente para mostrar observaciones de una entidad relacionada
  const RelatedEntityObservations = ({ entityId, entityType }: { entityId: number; entityType: string }) => {
    const { data: observacionesRelacionadas, isLoading } = useQuery({
      queryKey: [`/api/${entityType}s/${entityId}/observaciones`],
      enabled: !!entityId
    });

    if (isLoading) {
      return (
        <div className="mt-2 pl-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
      );
    }

    if (!observacionesRelacionadas || observacionesRelacionadas.length === 0) {
      return (
        <div className="mt-2 pl-4 text-sm text-gray-500 italic">
          Sin observaciones registradas
        </div>
      );
    }

    return (
      <div className="mt-2 pl-4 border-l-2 border-gray-200">
        <h5 className="text-xs font-semibold text-gray-600 mb-2">Observaciones:</h5>
        <div className="space-y-2">
          {observacionesRelacionadas.map((obs: any, index: number) => (
            <div key={index} className="bg-gray-50 p-2 rounded text-xs">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-700">
                  {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'}
                </span>
                <span className="text-gray-500">{obs.usuario || 'Sistema'}</span>
              </div>
              <p className="text-gray-800 leading-relaxed">
                {obs.detalle || 'Sin detalle'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar tabla de relaciones
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
      (relaciones.personas && relaciones.personas.length > 0) || 
      (relaciones.vehiculos && relaciones.vehiculos.length > 0) || 
      (relaciones.inmuebles && relaciones.inmuebles.length > 0);

    if (!hasRelaciones) {
      return <p className="text-gray-500">No hay relaciones registradas para esta entidad.</p>;
    }

    return (
      <div className="space-y-6">
        {/* Personas relacionadas */}
        {relaciones.personas && relaciones.personas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Personas relacionadas</h3>
            <div className="space-y-4">
              {relaciones.personas.map((persona: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleRelatedItemClick({
                      id: persona.id,
                      tipo: 'persona',
                      nombre: persona.nombre,
                      referencia: persona.identificacion
                    })}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600 hover:text-blue-800">
                          {persona.nombre}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {persona.tipoIdentificacion && (
                            <span className="mr-2">({persona.tipoIdentificacion})</span>
                          )}
                          {persona.identificacion}
                        </p>
                        {persona.posicionEstructura && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {persona.posicionEstructura}
                          </Badge>
                        )}
                      </div>
                      <Link2 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <RelatedEntityObservations entityId={persona.id} entityType="persona" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehículos relacionados */}
        {relaciones.vehiculos && relaciones.vehiculos.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Vehículos relacionados</h3>
            <div className="space-y-4">
              {relaciones.vehiculos.map((vehiculo: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleRelatedItemClick({
                      id: vehiculo.id,
                      tipo: 'vehiculo',
                      nombre: `${vehiculo.marca} ${vehiculo.modelo}`,
                      referencia: vehiculo.placa
                    })}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600 hover:text-blue-800">
                          {vehiculo.marca} {vehiculo.modelo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Placa: {vehiculo.placa} | Color: {vehiculo.color}
                        </p>
                        {vehiculo.tipo && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {vehiculo.tipo}
                          </Badge>
                        )}
                      </div>
                      <Link2 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <RelatedEntityObservations entityId={vehiculo.id} entityType="vehiculo" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inmuebles relacionados */}
        {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Inmuebles relacionados</h3>
            <div className="space-y-4">
              {relaciones.inmuebles.map((inmueble: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleRelatedItemClick({
                      id: inmueble.id,
                      tipo: 'inmueble',
                      nombre: inmueble.direccion,
                      referencia: inmueble.tipo
                    })}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600 hover:text-blue-800">
                          {inmueble.direccion}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Tipo: {inmueble.tipo}
                        </p>
                        {inmueble.propietario && (
                          <p className="text-sm text-gray-600">
                            Propietario: {inmueble.propietario}
                          </p>
                        )}
                      </div>
                      <Link2 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <RelatedEntityObservations entityId={inmueble.id} entityType="inmueble" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función para generar PDF con formato profesional
  const generatePDF = () => {
    if (!selectedResult || !entity) {
      console.error("No hay datos para generar el PDF");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = 20;

    // Encabezado profesional con fondo
    doc.setFillColor(25, 25, 112); // Azul oscuro
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Título principal en blanco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE ESTRUCTURAS CRIMINALES", pageWidth / 2, 15, { align: "center" });
    
    // Subtítulo con tipo y nombre de entidad
    if (selectedResult) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${selectedResult.tipo.toUpperCase()}: ${selectedResult.nombre}`, pageWidth / 2, 25, { align: "center" });
    }
    
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
    
    yPosition = 65;

    // Sección de información de la entidad principal
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 25, 112);
    doc.text(`ENTIDAD PRINCIPAL: ${selectedResult.tipo.toUpperCase()}`, margin, yPosition);
    yPosition += 15;
    
    // Información específica según el tipo de entidad
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const entityData = entity as any;
    
    if (selectedResult.tipo === "persona") {
      doc.text(`• Nombre: ${entityData.nombre}`, margin + 5, yPosition);
      yPosition += 8;
      doc.text(`• Identificación: ${entityData.identificacion}`, margin + 5, yPosition);
      yPosition += 8;
      if (entityData.tipoIdentificacion) {
        doc.text(`• Tipo de Identificación: ${entityData.tipoIdentificacion}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.posicionEstructura) {
        doc.text(`• Posición en la Estructura: ${entityData.posicionEstructura}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.alias && entityData.alias.length > 0) {
        doc.text(`• Alias: ${entityData.alias.join(', ')}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.telefonos && entityData.telefonos.length > 0) {
        doc.text(`• Teléfonos: ${entityData.telefonos.join(', ')}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.domicilios && entityData.domicilios.length > 0) {
        doc.text(`• Domicilios:`, margin + 5, yPosition);
        yPosition += 5;
        entityData.domicilios.forEach((domicilio: string) => {
          const domicilioLines = doc.splitTextToSize(`  - ${domicilio}`, pageWidth - 40);
          doc.text(domicilioLines, margin + 10, yPosition);
          yPosition += domicilioLines.length * 4 + 2;
        });
      }
    } else if (selectedResult.tipo === "vehiculo") {
      doc.text(`• Placa: ${entityData.placa}`, margin + 5, yPosition);
      yPosition += 8;
      doc.text(`• Marca: ${entityData.marca}`, margin + 5, yPosition);
      yPosition += 8;
      doc.text(`• Modelo: ${entityData.modelo}`, margin + 5, yPosition);
      yPosition += 8;
      doc.text(`• Color: ${entityData.color}`, margin + 5, yPosition);
      yPosition += 8;
      if (entityData.tipo) {
        doc.text(`• Tipo: ${entityData.tipo}`, margin + 5, yPosition);
        yPosition += 8;
      }
    } else if (selectedResult.tipo === "inmueble") {
      doc.text(`• Tipo: ${entityData.tipo}`, margin + 5, yPosition);
      yPosition += 8;
      doc.text(`• Dirección:`, margin + 5, yPosition);
      yPosition += 5;
      const direccionLines = doc.splitTextToSize(`  ${entityData.direccion}`, pageWidth - 40);
      doc.text(direccionLines, margin + 10, yPosition);
      yPosition += direccionLines.length * 4 + 5;
      if (entityData.propietario) {
        doc.text(`• Propietario: ${entityData.propietario}`, margin + 5, yPosition);
        yPosition += 8;
      }
    } else if (selectedResult.tipo === "ubicacion") {
      if (entityData.tipo) {
        doc.text(`• Tipo: ${entityData.tipo}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.latitud && entityData.longitud) {
        doc.text(`• Coordenadas: Lat: ${entityData.latitud.toFixed(6)}, Lng: ${entityData.longitud.toFixed(6)}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (entityData.fecha) {
        doc.text(`• Fecha: ${new Date(entityData.fecha).toLocaleDateString()}`, margin + 5, yPosition);
        yPosition += 8;
      }
    }
    
    yPosition += 15;

    // Sección de observaciones
    if (observaciones && observaciones.length > 0) {
      if (yPosition + 30 > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 112);
      doc.text("OBSERVACIONES", margin, yPosition);
      yPosition += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      observaciones.forEach((obs, index) => {
        if (yPosition + 25 > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }

        // Crear una caja para cada observación
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        const boxHeight = 20;
        doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), boxHeight);
        
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'}`, margin + 3, yPosition + 2);
        doc.setFont("helvetica", "normal");
        doc.text(`Usuario: ${obs.usuario || 'Sistema'}`, pageWidth - 60, yPosition + 2);
        
        const observacionLines = doc.splitTextToSize(obs.detalle || 'Sin detalle', pageWidth - 30);
        doc.text(observacionLines, margin + 3, yPosition + 8);
        yPosition += boxHeight + 5;
      });

      yPosition += 10;
    }

    // Sección de relaciones
    const hasRelaciones = 
      (relaciones.personas && relaciones.personas.length > 0) || 
      (relaciones.vehiculos && relaciones.vehiculos.length > 0) || 
      (relaciones.inmuebles && relaciones.inmuebles.length > 0);

    if (hasRelaciones) {
      if (yPosition + 30 > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 112);
      doc.text("RELACIONES EN LA ESTRUCTURA", margin, yPosition);
      yPosition += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      // Personas relacionadas
      if (relaciones.personas && relaciones.personas.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 53, 69);
        doc.text("PERSONAS RELACIONADAS:", margin, yPosition);
        yPosition += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        relaciones.personas.forEach((persona, index) => {
          if (yPosition + 15 > pageHeight) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${index + 1}. ${persona.nombre}`, margin + 5, yPosition);
          yPosition += 5;
          doc.text(`   Identificación: ${persona.identificacion}`, margin + 10, yPosition);
          yPosition += 5;
          if (persona.posicionEstructura) {
            doc.text(`   Posición en Estructura: ${persona.posicionEstructura}`, margin + 10, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Vehículos relacionados
      if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 53, 69);
        doc.text("VEHÍCULOS RELACIONADOS:", margin, yPosition);
        yPosition += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        relaciones.vehiculos.forEach((vehiculo, index) => {
          if (yPosition + 15 > pageHeight) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${index + 1}. ${vehiculo.marca} ${vehiculo.modelo}`, margin + 5, yPosition);
          yPosition += 5;
          doc.text(`   Placa: ${vehiculo.placa} | Color: ${vehiculo.color}`, margin + 10, yPosition);
          yPosition += 5;
          if (vehiculo.tipo) {
            doc.text(`   Tipo: ${vehiculo.tipo}`, margin + 10, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Inmuebles relacionados
      if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 53, 69);
        doc.text("INMUEBLES RELACIONADOS:", margin, yPosition);
        yPosition += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        relaciones.inmuebles.forEach((inmueble, index) => {
          if (yPosition + 20 > pageHeight) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`${index + 1}. Tipo: ${inmueble.tipo}`, margin + 5, yPosition);
          yPosition += 5;
          const direccionLines = doc.splitTextToSize(`   Dirección: ${inmueble.direccion}`, pageWidth - 50);
          doc.text(direccionLines, margin + 10, yPosition);
          yPosition += direccionLines.length * 4 + 5;
          if (inmueble.propietario) {
            doc.text(`   Propietario: ${inmueble.propietario}`, margin + 10, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        });
      }
    }

    // Pie de página profesional
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      // Línea superior del pie
      doc.setDrawColor(25, 25, 112);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Número de página centrado
      const pageText = `Página ${i} de ${totalPages}`;
      doc.text(pageText, pageWidth / 2, pageHeight - 12, { align: "center" });
      
      // Texto confidencial a la izquierda
      doc.text("DOCUMENTO CONFIDENCIAL - SISTEMA DE ESTRUCTURAS CRIMINALES", margin, pageHeight - 12);
      
      // Fecha a la derecha
      doc.text(`${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 12, { align: "right" });
    }

    // Guardar el PDF con nombre descriptivo
    let nombre = selectedResult?.nombre || "estructura";
    nombre = nombre.replace(/[^a-zA-Z0-9]/g, "_");
    nombre = nombre.substring(0, 20);
    
    const fileName = `Informe_Estructura_${nombre}_${selectedResult.tipo}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2Icon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Estructuras</h1>
          </div>
          {selectedResult && (
            <Button onClick={generatePDF} className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Generar PDF
            </Button>
          )}
        </div>

        <SearchComponent 
          onResultSelect={handleResultSelect}
        />

        {selectedResult && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Columna izquierda - Información principal */}
            <div className="space-y-6">
              {/* Detalles de la entidad */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Información Principal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderEntityDetails()}
                </CardContent>
              </Card>

              {/* Observaciones */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderObservaciones()}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha - Relaciones */}
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Link2 className="h-5 w-5" />
                    Relaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderRelaciones()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!selectedResult && (
          <div className="text-center py-12">
            <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Busca una entidad para ver su estructura
            </h3>
            <p className="text-gray-500">
              Utiliza el buscador para encontrar personas, vehículos, inmuebles o ubicaciones
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}