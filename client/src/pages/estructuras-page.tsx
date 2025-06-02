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
import { useToast } from "@/hooks/use-toast";

export default function EstructurasPage() {
  const { toast } = useToast();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [relaciones, setRelaciones] = useState<{
    personas: any[];
    vehiculos: any[];
    inmuebles: any[];
    ubicaciones: any[];
  }>({
    personas: [],
    vehiculos: [],
    inmuebles: [],
    ubicaciones: []
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
      setObservaciones(Array.isArray(observacionesData) ? observacionesData : []);
    }
  }, [observacionesData]);

  useEffect(() => {
    if (relacionesData) {
      setRelaciones({
        personas: Array.isArray((relacionesData as any)?.personas) ? (relacionesData as any).personas : [],
        vehiculos: Array.isArray((relacionesData as any)?.vehiculos) ? (relacionesData as any).vehiculos : [],
        inmuebles: Array.isArray((relacionesData as any)?.inmuebles) ? (relacionesData as any).inmuebles : [],
        ubicaciones: Array.isArray((relacionesData as any)?.ubicaciones) ? (relacionesData as any).ubicaciones : []
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
            {entityData.alias && Array.isArray(entityData.alias) && entityData.alias.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Alias:</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {entityData.alias.map((alias: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs sm:text-sm">{alias}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entityData.telefonos && Array.isArray(entityData.telefonos) && entityData.telefonos.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Teléfonos:</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {entityData.telefonos.map((telefono: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs sm:text-sm">{telefono}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entityData.domicilios && Array.isArray(entityData.domicilios) && entityData.domicilios.length > 0 && (
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
    // Crear el endpoint correcto según el tipo de entidad
    const getObservacionesEndpoint = (type: string, id: number) => {
      switch (type) {
        case 'ubicacion':
          return `/api/ubicaciones/${id}/observaciones`;
        case 'persona':
          return `/api/personas/${id}/observaciones`;
        case 'vehiculo':
          return `/api/vehiculos/${id}/observaciones`;
        case 'inmueble':
          return `/api/inmuebles/${id}/observaciones`;
        default:
          return `/api/${type}s/${id}/observaciones`;
      }
    };

    const { data: observacionesRelacionadas, isLoading } = useQuery({
      queryKey: [getObservacionesEndpoint(entityType, entityId)],
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

    if (!observacionesRelacionadas || !Array.isArray(observacionesRelacionadas) || observacionesRelacionadas.length === 0) {
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
      (relaciones.inmuebles && relaciones.inmuebles.length > 0) ||
      (relaciones.ubicaciones && relaciones.ubicaciones.length > 0);

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

        {/* Ubicaciones relacionadas */}
        {relaciones.ubicaciones && relaciones.ubicaciones.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Ubicaciones relacionadas</h3>
            <div className="space-y-4">
              {relaciones.ubicaciones.filter((ubicacion: any) => 
                ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
              ).map((ubicacion: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleRelatedItemClick({
                      id: ubicacion.id,
                      tipo: 'ubicacion',
                      nombre: ubicacion.tipo || 'Ubicación',
                      referencia: ubicacion.observaciones || 'Sin observaciones'
                    })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-blue-600 hover:text-blue-800">
                          {ubicacion.tipo || 'Ubicación'}
                        </h4>
                        {ubicacion.latitud && ubicacion.longitud && (
                          <p className="text-xs text-gray-600 font-mono mt-1">
                            Lat: {ubicacion.latitud.toFixed(6)}, Lng: {ubicacion.longitud.toFixed(6)}
                          </p>
                        )}
                        {ubicacion.fecha && (
                          <p className="text-xs text-gray-600 mt-1">
                            Fecha: {new Date(ubicacion.fecha).toLocaleDateString()}
                          </p>
                        )}
                        {ubicacion.observaciones && (
                          <p className="text-xs text-gray-600 mt-1">
                            {ubicacion.observaciones}
                          </p>
                        )}
                      </div>
                      <Link2 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <RelatedEntityObservations entityId={ubicacion.id} entityType="ubicacion" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función para generar PDF exactamente como el documento de referencia
  const generatePDF = async () => {
    if (!selectedResult || !entity) {
      toast({
        title: "Error",
        description: "No hay datos para generar el PDF",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const textWidth = pageWidth - (margin * 2);
      
      // Encabezado profesional con fondo (igual que ubicaciones)
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
      
      // Sección de información de la entidad
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 112);
      
      let yPos = 75;
      
      if (selectedResult) {
        doc.text(`ENTIDAD: ${selectedResult.tipo.toUpperCase()}`, margin, 65);
        
        // Información específica según el tipo de entidad
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        
        const entityData = entity as any;
        
        if (selectedResult.tipo === "persona") {
          // Nombre con manejo de texto largo respetando márgenes
          const nombreLines = doc.splitTextToSize(`• Nombre: ${entityData.nombre}`, textWidth - 5);
          doc.text(nombreLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += nombreLines.length * 6 + 2;
          
          // Identificación con manejo de texto largo respetando márgenes
          const identLines = doc.splitTextToSize(`• Identificación: (${entityData.tipoIdentificacion || 'No especificado'}) ${entityData.identificacion}`, textWidth - 5);
          doc.text(identLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += identLines.length * 6 + 2;
          
          if (entityData.posicionEstructura) {
            const posicionLines = doc.splitTextToSize(`• Posición en la estructura: ${entityData.posicionEstructura}`, textWidth - 5);
            doc.text(posicionLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += posicionLines.length * 6 + 2;
          }
          if (entityData.alias && Array.isArray(entityData.alias) && entityData.alias.length > 0) {
            const aliasLines = doc.splitTextToSize(`• Alias: ${entityData.alias.join(', ')}`, textWidth - 5);
            doc.text(aliasLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += aliasLines.length * 6 + 2;
          }
          if (entityData.telefonos && Array.isArray(entityData.telefonos) && entityData.telefonos.length > 0) {
            const telefonosLines = doc.splitTextToSize(`• Teléfonos: ${entityData.telefonos.join(', ')}`, textWidth - 5);
            doc.text(telefonosLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += telefonosLines.length * 6 + 2;
          }
          if (entityData.domicilios && Array.isArray(entityData.domicilios) && entityData.domicilios.length > 0) {
            doc.text('• Domicilios:', margin + 5, yPos);
            yPos += 8;
            entityData.domicilios.forEach((domicilio: string) => {
              const domicilioLines = doc.splitTextToSize(`    ${domicilio}`, textWidth - 15);
              doc.text(domicilioLines, margin + 10, yPos, { align: 'justify', maxWidth: textWidth - 15 });
              yPos += domicilioLines.length * 5 + 3;
            });
          }
        } else if (selectedResult.tipo === "vehiculo") {
          const placaLines = doc.splitTextToSize(`• Placa: ${entityData.placa}`, textWidth - 5);
          doc.text(placaLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += placaLines.length * 6 + 2;
          
          const vehiculoLines = doc.splitTextToSize(`• Vehículo: ${entityData.marca} ${entityData.modelo}`, textWidth - 5);
          doc.text(vehiculoLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += vehiculoLines.length * 6 + 2;
          
          const colorLines = doc.splitTextToSize(`• Color: ${entityData.color}`, textWidth - 5);
          doc.text(colorLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += colorLines.length * 6 + 2;
          
          if (entityData.tipo) {
            const tipoLines = doc.splitTextToSize(`• Tipo: ${entityData.tipo}`, textWidth - 5);
            doc.text(tipoLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += tipoLines.length * 6 + 2;
          }
        } else if (selectedResult.tipo === "inmueble") {
          const tipoLines = doc.splitTextToSize(`• Tipo: ${entityData.tipo}`, textWidth - 5);
          doc.text(tipoLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += tipoLines.length * 6 + 2;
          
          const direccionLines = doc.splitTextToSize(`• Dirección: ${entityData.direccion}`, textWidth - 5);
          doc.text(direccionLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
          yPos += direccionLines.length * 6 + 2;
          
          if (entityData.propietario) {
            const propietarioLines = doc.splitTextToSize(`• Propietario: ${entityData.propietario}`, textWidth - 5);
            doc.text(propietarioLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += propietarioLines.length * 6 + 2;
          }
        } else if (selectedResult.tipo === "ubicacion") {
          const ubicacionLines = doc.splitTextToSize(`• Ubicación: ${entityData.tipo || "Ubicación"}`, textWidth - 5);
          doc.text(ubicacionLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += ubicacionLines.length * 6 + 2;
          
          if (entityData.latitud && entityData.longitud) {
            const coordenadasLines = doc.splitTextToSize(`• Coordenadas: ${entityData.latitud.toFixed(6)}, ${entityData.longitud.toFixed(6)}`, textWidth - 5);
            doc.text(coordenadasLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += coordenadasLines.length * 6 + 2;
          }
          if (entityData.fecha) {
            const fechaLines = doc.splitTextToSize(`• Fecha: ${new Date(entityData.fecha).toLocaleDateString()}`, textWidth - 5);
            doc.text(fechaLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += fechaLines.length * 6 + 2;
          }
        }
        
        yPos += 15;
      }

      // Observaciones de la entidad principal con formato profesional
      if (observaciones && observaciones.length > 0) {
        if (yPos + 40 > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(25, 25, 112);
        doc.text("OBSERVACIONES", margin, yPos);
        yPos += 15;

        observaciones.forEach((obs, index) => {
          if (yPos + 35 > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Observación #${index + 1}:`, margin, yPos);
          yPos += 8;
          
          doc.setFont("helvetica", "normal");
          doc.text("Detalle:", margin, yPos);
          yPos += 5;
          
          const detalleLines = doc.splitTextToSize(`   ${obs.detalle || 'Sin detalle'}`, textWidth - 5);
          doc.text(detalleLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
          yPos += detalleLines.length * 4 + 3;
          
          const fechaUserLines = doc.splitTextToSize(`   Fecha: ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'} - Usuario: ${obs.usuario || 'Sistema'}`, textWidth - 5);
          doc.text(fechaUserLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
          yPos += 15;
        });
        
        yPos += 10;
      }

      // Relaciones con formato profesional
      const hasRelaciones = 
        (relaciones.personas && relaciones.personas.length > 0) || 
        (relaciones.vehiculos && relaciones.vehiculos.length > 0) || 
        (relaciones.inmuebles && relaciones.inmuebles.length > 0) ||
        (relaciones.ubicaciones && relaciones.ubicaciones.length > 0);

      if (hasRelaciones) {
        if (yPos + 40 > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(25, 25, 112);
        doc.text("RELACIONES", margin, yPos);
        yPos += 15;

        // Personas relacionadas - formato profesional
        if (relaciones.personas && relaciones.personas.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(220, 53, 69);
          doc.text("PERSONAS RELACIONADAS:", margin, yPos);
          yPos += 10;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);

          for (const persona of relaciones.personas) {
            if (yPos + 25 > pageHeight - 30) {
              doc.addPage();
              yPos = 30;
            }

            const personaLines = doc.splitTextToSize(`   • ${persona.nombre} (${persona.identificacion})${persona.posicionEstructura ? ' - ' + persona.posicionEstructura : ''}`, textWidth - 5);
            doc.text(personaLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += personaLines.length * 5 + 3;
            
            // Obtener observaciones de esta persona
            try {
              const response = await fetch(`/api/personas/${persona.id}/observaciones`);
              const obsPersona = await response.json();
              
              if (obsPersona && Array.isArray(obsPersona) && obsPersona.length > 0) {
                obsPersona.forEach((obs: any, obsIndex: number) => {
                  if (yPos + 20 > pageHeight - 30) {
                    doc.addPage();
                    yPos = 20;
                  }
                  
                  doc.setFont("helvetica", "bold");
                  doc.text(`Observación #${obsIndex + 1}:`, margin, yPos);
                  yPos += 5;
                  
                  doc.setFont("helvetica", "normal");
                  doc.text("Detalle:", margin, yPos);
                  yPos += 4;
                  
                  const obsLines = doc.splitTextToSize(`   ${obs.detalle || 'Sin detalle'}`, textWidth - 5);
                  doc.text(obsLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
                  yPos += obsLines.length * 4 + 3;
                  
                  const fechaUserRelLines = doc.splitTextToSize(`   Fecha: ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'} - Usuario: ${obs.usuario || 'Sistema'}`, textWidth - 5);
                  doc.text(fechaUserRelLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
                  yPos += fechaUserRelLines.length * 4 + 6;
                });
              }
            } catch (error) {
              console.error(`Error obteniendo observaciones de persona ${persona.id}:`, error);
            }
            
            yPos += 8;
          }
        }

        // Vehículos relacionados - formato profesional
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(155, 89, 182);
          doc.text("VEHÍCULOS RELACIONADOS:", margin, yPos);
          yPos += 10;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);

          for (const vehiculo of relaciones.vehiculos) {
            if (yPos + 25 > pageHeight - 30) {
              doc.addPage();
              yPos = 30;
            }

            const vehiculoLines = doc.splitTextToSize(`   • ${vehiculo.placa}: ${vehiculo.marca} ${vehiculo.modelo}`, textWidth - 5);
            doc.text(vehiculoLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
            yPos += vehiculoLines.length * 5 + 3;
            
            // Obtener observaciones de este vehículo
            try {
              const response = await fetch(`/api/vehiculos/${vehiculo.id}/observaciones`);
              const obsVehiculo = await response.json();
              
              if (obsVehiculo && Array.isArray(obsVehiculo) && obsVehiculo.length > 0) {
                obsVehiculo.forEach((obs: any, obsIndex: number) => {
                  if (yPos + 20 > pageHeight - 30) {
                    doc.addPage();
                    yPos = 20;
                  }
                  
                  doc.setFont("helvetica", "bold");
                  doc.text(`Observación #${obsIndex + 1}:`, margin, yPos);
                  yPos += 5;
                  
                  doc.setFont("helvetica", "normal");
                  doc.text("Detalle:", margin, yPos);
                  yPos += 4;
                  
                  const obsLines = doc.splitTextToSize(`   ${obs.detalle || 'Sin detalle'}`, textWidth - 5);
                  doc.text(obsLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
                  yPos += obsLines.length * 4 + 3;
                  
                  const fechaUserVehLines = doc.splitTextToSize(`   Fecha: ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'} - Usuario: ${obs.usuario || 'Sistema'}`, textWidth - 5);
                  doc.text(fechaUserVehLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
                  yPos += fechaUserVehLines.length * 4 + 6;
                });
              }
            } catch (error) {
              console.error(`Error obteniendo observaciones de vehículo ${vehiculo.id}:`, error);
            }
            
            yPos += 8;
          }
        }

        // Inmuebles relacionados - formato profesional
        if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(46, 125, 50);
          doc.text("INMUEBLES RELACIONADOS:", margin, yPos);
          yPos += 10;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);

          for (const inmueble of relaciones.inmuebles) {
            if (yPos + 25 > pageHeight - 30) {
              doc.addPage();
              yPos = 30;
            }

            const inmuebleLines = doc.splitTextToSize(`   • ${inmueble.tipo}: ${inmueble.direccion}`, textWidth - 5);
            doc.text(inmuebleLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
            yPos += inmuebleLines.length * 5 + 3;
            
            // Obtener observaciones de este inmueble
            try {
              const response = await fetch(`/api/inmuebles/${inmueble.id}/observaciones`);
              const obsInmueble = await response.json();
              
              if (obsInmueble && Array.isArray(obsInmueble) && obsInmueble.length > 0) {
                obsInmueble.forEach((obs: any, obsIndex: number) => {
                  if (yPos + 20 > pageHeight - 30) {
                    doc.addPage();
                    yPos = 20;
                  }
                  
                  doc.setFont("helvetica", "bold");
                  doc.text(`Observación #${obsIndex + 1}:`, margin, yPos);
                  yPos += 5;
                  
                  doc.setFont("helvetica", "normal");
                  doc.text("Detalle:", margin, yPos);
                  yPos += 4;
                  
                  const obsLines = doc.splitTextToSize(`   ${obs.detalle || 'Sin detalle'}`, textWidth - 5);
                  doc.text(obsLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
                  yPos += obsLines.length * 4 + 3;
                  
                  const fechaUserInmLines = doc.splitTextToSize(`   Fecha: ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'} - Usuario: ${obs.usuario || 'Sistema'}`, textWidth - 5);
                  doc.text(fechaUserInmLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
                  yPos += fechaUserInmLines.length * 4 + 6;
                });
              }
            } catch (error) {
              console.error(`Error obteniendo observaciones de inmueble ${inmueble.id}:`, error);
            }
            
            yPos += 8;
          }
        }

        // Ubicaciones relacionadas - formato profesional
        if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
          const ubicacionesFiltradas = relaciones.ubicaciones.filter((ubicacion: any) => 
            ubicacion.tipo !== "Domicilio" && ubicacion.tipo !== "Inmueble"
          );
          
          if (ubicacionesFiltradas.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(46, 125, 50);
            doc.text("UBICACIONES RELACIONADAS:", margin, yPos);
            yPos += 10;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            for (const ubicacion of ubicacionesFiltradas) {
              if (yPos + 25 > pageHeight - 30) {
                doc.addPage();
                yPos = 30;
              }

              // Título de ubicación con sangría
              const ubicacionLines = doc.splitTextToSize(`• ${ubicacion.tipo || 'Ubicación'}`, textWidth - 15);
              doc.text(ubicacionLines, margin + 10, yPos, { align: 'left', maxWidth: textWidth - 15 });
              yPos += ubicacionLines.length * 5 + 3;

              if (ubicacion.latitud && ubicacion.longitud) {
                const coordenadasLines = doc.splitTextToSize(`Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}`, textWidth - 25);
                doc.text(coordenadasLines, margin + 20, yPos, { align: 'justify', maxWidth: textWidth - 25 });
                yPos += coordenadasLines.length * 5 + 2;
              }

              if (ubicacion.fecha) {
                const fechaLines = doc.splitTextToSize(`Fecha: ${new Date(ubicacion.fecha).toLocaleDateString()}`, textWidth - 25);
                doc.text(fechaLines, margin + 20, yPos, { align: 'justify', maxWidth: textWidth - 25 });
                yPos += fechaLines.length * 5 + 2;
              }
              
              // Obtener observaciones de esta ubicación
              try {
                const response = await fetch(`/api/ubicaciones/${ubicacion.id}/observaciones`);
                const obsUbicacion = await response.json();
                
                if (obsUbicacion && Array.isArray(obsUbicacion) && obsUbicacion.length > 0) {
                  obsUbicacion.forEach((obs: any, obsIndex: number) => {
                    if (yPos + 20 > pageHeight - 30) {
                      doc.addPage();
                      yPos = 20;
                    }
                    
                    doc.setFont("helvetica", "bold");
                    doc.text(`Observación #${obsIndex + 1}:`, margin, yPos);
                    yPos += 5;
                    
                    doc.setFont("helvetica", "normal");
                    doc.text("Detalle:", margin, yPos);
                    yPos += 4;
                    
                    const obsLines = doc.splitTextToSize(`   ${obs.detalle || 'Sin detalle'}`, textWidth - 5);
                    doc.text(obsLines, margin + 5, yPos, { align: 'justify', maxWidth: textWidth - 5 });
                    yPos += obsLines.length * 4 + 3;
                    
                    const fechaUserUbicLines = doc.splitTextToSize(`   Fecha: ${obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'S/F'} - Usuario: ${obs.usuario || 'Sistema'}`, textWidth - 5);
                    doc.text(fechaUserUbicLines, margin + 5, yPos, { maxWidth: textWidth - 5 });
                    yPos += fechaUserUbicLines.length * 4 + 6;
                  });
                }
              } catch (error) {
                console.error(`Error obteniendo observaciones de ubicación ${ubicacion.id}:`, error);
              }
              
              yPos += 8;
            }
          }
        }
      }

      // Pie de página profesional como en ubicaciones
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Centrar el número de página
        const pageText = `Página ${i} de ${totalPages}`;
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
        
        // Texto confidencial a la izquierda
        doc.text("INFORME CONFIDENCIAL - ESTRUCTURAS", margin, pageHeight - 10);
      }

      // Guardar el PDF
      let nombre = selectedResult?.nombre || "estructura";
      nombre = nombre.replace(/[^a-zA-Z0-9]/g, "_");
      nombre = nombre.substring(0, 20);
      
      const fileName = `Informe_Estructura_${nombre}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF generado exitosamente",
        description: `Se ha descargado el archivo ${fileName}`,
      });
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el PDF. Intente nuevamente.",
        variant: "destructive",
      });
    }
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