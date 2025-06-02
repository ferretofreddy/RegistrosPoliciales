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
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {observaciones.map((obs: any, index: number) => (
              <TableRow key={index}>
                <TableCell>
                  {obs.fecha ? new Date(obs.fecha).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>{obs.usuario || 'Sistema'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {obs.detalle || 'Sin detalle'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Posición</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.personas.map((persona: any, index: number) => (
                  <TableRow 
                    key={index} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRelatedItemClick({
                      id: persona.id,
                      tipo: 'persona',
                      nombre: persona.nombre,
                      referencia: persona.identificacion
                    })}
                  >
                    <TableCell className="text-blue-600 hover:text-blue-800">
                      {persona.nombre}
                    </TableCell>
                    <TableCell>
                      {persona.tipoIdentificacion && (
                        <span className="text-gray-600 mr-2">({persona.tipoIdentificacion})</span>
                      )}
                      {persona.identificacion}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {persona.posicionEstructura || 'Sin posición específica'}
                      </Badge>
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
            <h3 className="font-semibold mb-3">Vehículos relacionados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Color</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.vehiculos.map((vehiculo: any, index: number) => (
                  <TableRow 
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRelatedItemClick({
                      id: vehiculo.id,
                      tipo: 'vehiculo',
                      nombre: `${vehiculo.marca} ${vehiculo.modelo}`,
                      referencia: vehiculo.placa
                    })}
                  >
                    <TableCell className="text-blue-600 hover:text-blue-800">
                      {vehiculo.placa}
                    </TableCell>
                    <TableCell>{vehiculo.marca}</TableCell>
                    <TableCell>{vehiculo.modelo}</TableCell>
                    <TableCell>{vehiculo.color}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Inmuebles relacionados */}
        {relaciones.inmuebles && relaciones.inmuebles.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Inmuebles relacionados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Propietario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relaciones.inmuebles.map((inmueble: any, index: number) => (
                  <TableRow 
                    key={index}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRelatedItemClick({
                      id: inmueble.id,
                      tipo: 'inmueble',
                      nombre: inmueble.tipo,
                      referencia: inmueble.direccion
                    })}
                  >
                    <TableCell className="text-blue-600 hover:text-blue-800">
                      {inmueble.tipo}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{inmueble.direccion}</TableCell>
                    <TableCell>{inmueble.propietario || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  // Función para generar PDF
  const generatePDF = async () => {
    if (!selectedResult || !entity) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 30;

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(25, 25, 112);
      doc.text("INFORME DE ESTRUCTURAS", pageWidth / 2, y, { align: "center" });
      y += 20;

      // Información principal
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${selectedResult.tipo.toUpperCase()}: ${selectedResult.nombre}`, margin, y);
      y += 15;

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
          doc.text("Personas relacionadas:", margin, y); y += 5;
          doc.setFont("helvetica", "normal");
          
          relaciones.personas.forEach((persona: any) => {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
            }
            
            const nombre = persona.nombre || "Sin nombre";
            const identificacion = persona.identificacion || "Sin identificación";
            const posicion = persona.posicionEstructura || "Sin posición específica";
            
            doc.text(`• ${nombre} (${identificacion}) - ${posicion}`, margin + 5, y); y += 5;
          });
          y += 5;
        }
        
        // Vehículos relacionados
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
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
            
            doc.text(`• ${tipo}: ${direccion}`, margin + 5, y); y += 5;
          });
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