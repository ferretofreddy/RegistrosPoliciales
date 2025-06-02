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
        personas: relacionesData?.personas || [],
        vehiculos: relacionesData?.vehiculos || [],
        inmuebles: relacionesData?.inmuebles || []
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
                      </div>
                      <Badge variant="secondary">
                        {persona.posicionEstructura || 'Sin posición específica'}
                      </Badge>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Placa:</span>
                        <p className="font-medium text-blue-600 hover:text-blue-800">
                          {vehiculo.placa}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Marca:</span>
                        <p className="text-sm">{vehiculo.marca}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Modelo:</span>
                        <p className="text-sm">{vehiculo.modelo}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Color:</span>
                        <p className="text-sm">{vehiculo.color}</p>
                      </div>
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
                      nombre: inmueble.tipo,
                      referencia: inmueble.direccion
                    })}
                  >
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Tipo:</span>
                        <p className="font-medium text-blue-600 hover:text-blue-800">
                          {inmueble.tipo}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Dirección:</span>
                        <p className="text-sm break-words">{inmueble.direccion}</p>
                      </div>
                      {inmueble.propietario && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Propietario:</span>
                          <p className="text-sm">{inmueble.propietario}</p>
                        </div>
                      )}
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

  // Función auxiliar para obtener observaciones de una entidad
  const fetchEntityObservations = async (entityId: number, entityType: string) => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/observaciones`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error(`Error obteniendo observaciones de ${entityType}:`, error);
      return [];
    }
  };

  // Función para generar PDF
  const generatePDF = async () => {
    if (!selectedResult || !entity) return;

    try {
      const doc = new jsPDF();
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
      doc.text("INFORME DE ESTRUCTURAS", pageWidth / 2, 15, { align: "center" });
      
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
      
      let y = 65;

      // Función auxiliar para agregar texto de una línea
      const addTextRow = (doc: any, label: string, value: string, x: number, currentY: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${label} ${value}`, x, currentY);
        return currentY + 5;
      };

      // Función auxiliar para texto de múltiples líneas
      const addMultiLineText = (doc: any, label: string, text: string, x: number, currentY: number) => {
        if (!text || text.trim() === '') return currentY;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        doc.text(`${label}`, x, currentY);
        currentY += 5;
        
        const availableWidth = pageWidth - (2 * margin) - 5;
        const lines = doc.splitTextToSize(text, availableWidth);
        
        lines.forEach((line: string) => {
          doc.text(line, x + 5, currentY);
          currentY += 5;
        });
        
        return currentY + 2;
      };

      // Información según tipo de entidad
      const entityData = entity as any;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      switch (selectedResult.tipo) {
        case "persona":
          y = addTextRow(doc, "Nombre:", entityData.nombre || "N/A", margin, y);
          const identificacionTexto = entityData.tipoIdentificacion 
            ? `(${entityData.tipoIdentificacion}) ${entityData.identificacion || "N/A"}`
            : entityData.identificacion || "N/A";
          y = addTextRow(doc, "Identificación:", identificacionTexto, margin, y);
          
          if (entityData.posicionEstructura) {
            y = addTextRow(doc, "Posición en la estructura:", entityData.posicionEstructura, margin, y);
          }
          
          if (entityData.alias && entityData.alias.length > 0) {
            y = addTextRow(doc, "Alias:", entityData.alias.join(", "), margin, y);
          }
          
          if (entityData.telefonos && entityData.telefonos.length > 0) {
            y = addTextRow(doc, "Teléfonos:", entityData.telefonos.join(", "), margin, y);
          }
          
          if (entityData.domicilios && entityData.domicilios.length > 0) {
            y = addMultiLineText(doc, "Domicilios:", entityData.domicilios.join("; "), margin, y);
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
            y = addMultiLineText(doc, "Observaciones:", entityData.observaciones, margin, y);
          }
          break;

        case "inmueble":
          y = addTextRow(doc, "Tipo:", entityData.tipo || "N/A", margin, y);
          y = addMultiLineText(doc, "Dirección:", entityData.direccion || "N/A", margin, y);
          if (entityData.propietario) {
            y = addTextRow(doc, "Propietario:", entityData.propietario, margin, y);
          }
          if (entityData.observaciones) {
            y = addMultiLineText(doc, "Observaciones:", entityData.observaciones, margin, y);
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
            y = addMultiLineText(doc, "Observaciones:", entityData.observaciones, margin, y);
          }
          break;
      }

      // Observaciones
      if (observaciones && observaciones.length > 0) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("OBSERVACIONES", margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        observaciones.forEach((obs: any, index: number) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }
          
          const detalle = obs.detalle || "Sin detalle";
          const fecha = obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A";
          const usuario = obs.usuario || "Sistema";
          
          doc.setFont("helvetica", "bold");
          doc.text(`Observación #${index+1}:`, margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          y = addMultiLineText(doc, "Detalle:", detalle, margin, y);
          doc.text(`Fecha: ${fecha} - Usuario: ${usuario}`, margin + 5, y); y += 8;
        });
      }

      // Relaciones
      const hasRelaciones = 
        relaciones.personas?.length > 0 || 
        relaciones.vehiculos?.length > 0 || 
        relaciones.inmuebles?.length > 0;
        
      if (hasRelaciones) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELACIONES", margin, y);
        y += 8;
        
        // Personas relacionadas
        if (relaciones.personas && relaciones.personas.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text("Personas relacionadas:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          for (const persona of relaciones.personas) {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const nombre = persona.nombre || "Sin nombre";
            const identificacion = persona.identificacion || "Sin identificación";
            const posicion = persona.posicionEstructura || "Sin posición específica";
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`• ${nombre} (${identificacion}) - ${posicion}`, margin + 5, y); y += 5;
            
            // Obtener y agregar observaciones de la persona
            const observacionesPersona = await fetchEntityObservations(persona.id, 'persona');
            if (observacionesPersona && observacionesPersona.length > 0) {
              observacionesPersona.forEach((obs: any, index: number) => {
                if (y > pageHeight - 30) {
                  doc.addPage();
                  y = 20;
                }
                
                const detalle = obs.detalle || "Sin detalle";
                const fecha = obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A";
                const usuario = obs.usuario || "Sistema";
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`Observación #${index+1}:`, margin, y); y += 5;
                doc.setFont("helvetica", "normal");
                
                y = addMultiLineText(doc, "Detalle:", detalle, margin, y);
                doc.text(`Fecha: ${fecha} - Usuario: ${usuario}`, margin + 5, y); y += 6;
              });
              y += 2;
            } else {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(9);
              doc.text("Sin observaciones registradas", margin, y); y += 6;
            }
            
            doc.setFontSize(10);
            y += 3;
          }
          y += 5;
        }
        
        // Vehículos relacionados
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text("Vehículos relacionados:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          for (const vehiculo of relaciones.vehiculos) {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const placa = vehiculo.placa || "Sin placa";
            const marca = vehiculo.marca || "Sin marca";
            const modelo = vehiculo.modelo || "Sin modelo";
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`• ${placa}: ${marca} ${modelo}`, margin + 5, y); y += 5;
            
            // Obtener y agregar observaciones del vehículo
            const observacionesVehiculo = await fetchEntityObservations(vehiculo.id, 'vehiculo');
            if (observacionesVehiculo && observacionesVehiculo.length > 0) {
              observacionesVehiculo.forEach((obs: any, index: number) => {
                if (y > pageHeight - 30) {
                  doc.addPage();
                  y = 20;
                }
                
                const detalle = obs.detalle || "Sin detalle";
                const fecha = obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A";
                const usuario = obs.usuario || "Sistema";
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`Observación #${index+1}:`, margin, y); y += 5;
                doc.setFont("helvetica", "normal");
                
                y = addMultiLineText(doc, "Detalle:", detalle, margin, y);
                doc.text(`Fecha: ${fecha} - Usuario: ${usuario}`, margin + 5, y); y += 6;
              });
              y += 2;
            } else {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(9);
              doc.text("Sin observaciones registradas", margin, y); y += 6;
            }
            
            doc.setFontSize(10);
            y += 3;
          }
          y += 5;
        }
        
        // Inmuebles relacionados
        if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text("Inmuebles relacionados:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          for (const inmueble of relaciones.inmuebles) {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const tipo = inmueble.tipo || "Sin tipo";
            const direccion = inmueble.direccion || "Sin dirección";
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`• ${tipo}: ${direccion}`, margin + 5, y); y += 5;
            
            // Obtener y agregar observaciones del inmueble
            const observacionesInmueble = await fetchEntityObservations(inmueble.id, 'inmueble');
            if (observacionesInmueble && observacionesInmueble.length > 0) {
              observacionesInmueble.forEach((obs: any, index: number) => {
                if (y > pageHeight - 30) {
                  doc.addPage();
                  y = 20;
                }
                
                const detalle = obs.detalle || "Sin detalle";
                const fecha = obs.fecha ? new Date(obs.fecha).toLocaleDateString() : "N/A";
                const usuario = obs.usuario || "Sistema";
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`Observación #${index+1}:`, margin, y); y += 5;
                doc.setFont("helvetica", "normal");
                
                y = addMultiLineText(doc, "Detalle:", detalle, margin, y);
                doc.text(`Fecha: ${fecha} - Usuario: ${usuario}`, margin + 5, y); y += 6;
              });
              y += 2;
            } else {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(9);
              doc.text("Sin observaciones registradas", margin, y); y += 6;
            }
            
            doc.setFontSize(10);
            y += 3;
          }
          y += 5;
        }
      }

      // Pie de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        const pageText = `Página ${i} de ${totalPages}`;
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("INFORME CONFIDENCIAL", margin, pageHeight - 10);
      }

      // Guardar PDF
      let nombre = selectedResult.nombre || "informe";
      nombre = nombre.replace(/[^a-zA-Z0-9]/g, "_");
      nombre = nombre.substring(0, 20);
      
      doc.save(`Informe_${nombre}.pdf`);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    }
  };

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
                {/* Bloque de Información Detallada - Ancho completo */}
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
                
                {/* Bloque de Observaciones - Ancho completo */}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}