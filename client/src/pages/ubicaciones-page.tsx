import { useState, useEffect } from "react";
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
  const generarInformePDF = () => {
    if (!selectedResult || locations.length === 0) {
      toast({
        title: "No se puede generar el informe",
        description: "Selecciona una entidad con ubicaciones para generar el informe",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });

      // Configurar encabezado azul con título
      doc.setFillColor(59, 130, 246); // bg-blue-500
      doc.rect(0, 0, 210, 30, 'F');
      
      // Título en blanco
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INFORME DE UBICACIONES', 105, 20, { align: 'center' });

      // Información de la entidad
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      
      // Título específico según el tipo de entidad
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

      // Línea separadora
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 48, 190, 48);

      // Detalles de la entidad
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      let yPos = 58;

      // Información específica según el tipo de entidad
      switch (selectedResult.tipo) {
        case 'persona':
          doc.text(`Nombre: ${selectedResult.nombre || selectedResult.referencia || 'N/A'}`, 20, yPos);
          if (selectedResult.identificacion) {
            doc.text(`Identificación: ${selectedResult.identificacion}`, 20, yPos + 6);
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
          doc.text(`Tipo de inmueble: ${selectedResult.tipo_inmueble || selectedResult.referencia || 'N/A'}`, 20, yPos);
          doc.text(`Dirección: ${selectedResult.direccion || 'N/A'}`, 20, yPos + 6);
          yPos += 6;
          break;
        case 'ubicacion':
          doc.text(`Tipo de ubicación: ${selectedResult.tipo_ubicacion || selectedResult.referencia || 'N/A'}`, 20, yPos);
          if (selectedResult.observaciones) {
            doc.text(`Observaciones: ${selectedResult.observaciones}`, 20, yPos + 6);
            yPos += 6;
          }
          break;
      }

      doc.text(`Fecha de generación: ${fecha}`, 20, yPos + 12);
      doc.text(`Total de ubicaciones: ${locations.length}`, 20, yPos + 18);

      // Tabla de ubicaciones directas
      const ubicacionesDirectas = locations.filter(loc => loc.relation === 'direct');
      const ubicacionesRelacionadas = locations.filter(loc => loc.relation === 'related');

      yPos += 35;

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
          descripcion: loc.description.length > 40 ? loc.description.substring(0, 40) + '...' : loc.description,
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
            cellPadding: 3
          },
          columnStyles: {
            1: { cellWidth: 50 }, // Descripción más ancha
            2: { cellWidth: 25 }, // Latitud
            3: { cellWidth: 25 }  // Longitud
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Tabla de ubicaciones relacionadas
      if (ubicacionesRelacionadas.length > 0) {
        // Verificar si necesitamos una nueva página
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
          descripcion: loc.description.length > 40 ? loc.description.substring(0, 40) + '...' : loc.description,
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
            cellPadding: 3
          },
          columnStyles: {
            1: { cellWidth: 50 }, // Descripción más ancha
            2: { cellWidth: 25 }, // Latitud
            3: { cellWidth: 25 }  // Longitud
          }
        });
      }

      // Guardar el PDF
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
      if (!selectedResult || !entityData) return;
      
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        console.log("Procesando entidad:", selectedResult.tipo, entityData);
        console.log("Datos de relaciones:", relationData);
        
        // 1. Procesar según el tipo de entidad
        switch (selectedResult.tipo) {
          case "persona":
            // 1. Ubicaciones directas de la persona consultada (domicilios)
            if (relationData && relationData.ubicaciones) {
              console.log("Ubicaciones directas (domicilios) encontradas para persona:", relationData.ubicaciones);
              
              // Buscar ubicaciones directas (domicilios) de la persona
              const ubicacionesPersona = relationData.ubicaciones || [];
              
              for (const ubicacion of ubicacionesPersona) {
                // Estas son solo de tipo domicilio
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log(`Agregando domicilio de persona: ${ubicacion.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                  
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Domicilio",
                    description: ubicacion.observaciones || `Domicilio de ${selectedResult.nombre}`,
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
            
            // 1.1 Otras ubicaciones de la persona (avistamientos)
            if (relationData && relationData.otrasUbicaciones) {
              console.log("Otras ubicaciones (avistamientos) encontradas para persona:", relationData.otrasUbicaciones);
              
              // Buscar otras ubicaciones (avistamientos) de la persona
              const otrasUbicacionesPersona = relationData.otrasUbicaciones || [];
              
              for (const ubicacion of otrasUbicacionesPersona) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log(`Agregando avistamiento u otra ubicación de persona: ${ubicacion.tipo || "Avistamiento"} - lat: ${lat}, lng: ${lng}`);
                  
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Avistamiento",
                    description: ubicacion.observaciones || `${ubicacion.tipo || "Avistamiento"} de ${selectedResult.nombre}`,
                    type: "ubicacion",
                    relation: "related", // Estas son relacionadas, no directas
                    entityId: selectedResult.id
                  });
                  
                  if (!hasCenteredMap && ubicacionesEncontradas.length === 0) {
                    // Solo centramos en avistamientos si no hay domicilios
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }

            // 2. Personas relacionadas con la persona consultada
            if (relationData && relationData.personas && relationData.personas.length > 0) {
              console.log("Personas relacionadas:", relationData.personas);
              
              for (const personaRelacionada of relationData.personas) {
                try {
                  // Obtener datos específicos de la persona relacionada
                  const respuestaPersona = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
                  const datosPersona = await respuestaPersona.json();
                  
                  // Buscar domicilios de la persona relacionada
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.ubicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando domicilio de persona relacionada: ${ubicacionRelacionada.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Domicilio",
                          description: ubicacionRelacionada.observaciones || `Domicilio de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.nombre})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                  
                  // Buscar avistamientos u otras ubicaciones de la persona relacionada
                  if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.otrasUbicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando avistamiento de persona relacionada: ${ubicacionRelacionada.tipo || "Avistamiento"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Avistamiento",
                          description: ubicacionRelacionada.observaciones || `${ubicacionRelacionada.tipo || "Avistamiento"} de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.nombre})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de persona relacionada:", error);
                }
              }
            }
            
            // 3. Inmuebles relacionados con la persona consultada
            if (relationData && relationData.inmuebles && relationData.inmuebles.length > 0) {
              console.log("Inmuebles relacionados con persona:", relationData.inmuebles);
              
              for (const inmueble of relationData.inmuebles) {
                try {
                  // Obtener datos específicos del inmueble
                  const respuestaInmueble = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
                  const datosInmueble = await respuestaInmueble.json();
                  
                  if (datosInmueble.ubicaciones && datosInmueble.ubicaciones.length > 0) {
                    for (const ubicacionInmueble of datosInmueble.ubicaciones) {
                      const lat = parseFloat(String(ubicacionInmueble.latitud));
                      const lng = parseFloat(String(ubicacionInmueble.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando ubicación de inmueble relacionado: ${inmueble.tipo || "Inmueble"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionInmueble.id,
                          lat: lat,
                          lng: lng,
                          title: inmueble.tipo || "Inmueble",
                          description: `${inmueble.tipo || "Inmueble"} en ${inmueble.direccion || "dirección desconocida"} (relacionado con ${selectedResult.nombre})`,
                          type: "inmueble",
                          relation: "related",
                          entityId: inmueble.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones del inmueble:", error);
                }
              }
            }
            
            if (!ubicacionesEncontradas.length) {
              console.log("No se encontraron ubicaciones para esta persona");
            }
            break;
            
          case "inmueble":
            // 1. Ubicaciones directas del inmueble
            if (relationData && relationData.ubicaciones) {
              console.log("Ubicaciones directas encontradas para inmueble:", relationData.ubicaciones);
              
              const ubicacionesInmueble = relationData.ubicaciones || [];
              
              for (const ubicacion of ubicacionesInmueble) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log(`Agregando ubicación directa de inmueble: ${ubicacion.tipo || "Inmueble"} - lat: ${lat}, lng: ${lng}`);
                  
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Inmueble",
                    description: ubicacion.observaciones || `Ubicación de inmueble: ${selectedResult.direccion || selectedResult.nombre}`,
                    type: "inmueble",
                    relation: "direct",
                    entityId: selectedResult.id,
                    relationInfo: (() => {
                      let info = "Sin relaciones";
                      if (relationData) {
                        const relaciones = [];
                        
                        // Relaciones con personas
                        if (relationData.personas && relationData.personas.length > 0) {
                          relaciones.push(`Personas: ${relationData.personas.map(p => p.nombre).join(', ')}`);
                        }
                        
                        // Relaciones con vehículos
                        if (relationData.vehiculos && relationData.vehiculos.length > 0) {
                          relaciones.push(`Vehículos: ${relationData.vehiculos.map(v => `${v.marca} ${v.modelo} (${v.placa})`).join(', ')}`);
                        }
                        
                        // Relaciones con inmuebles
                        if (relationData.inmuebles && relationData.inmuebles.length > 0) {
                          relaciones.push(`Inmuebles: ${relationData.inmuebles.map(i => `${i.tipo} en ${i.direccion}`).join(', ')}`);
                        }
                        
                        // Relaciones con ubicaciones
                        if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
                          relaciones.push(`Ubicaciones: ${relationData.ubicaciones.map(u => u.tipo || "Sin tipo").join(', ')}`);
                        }
                        
                        if (relaciones.length > 0) {
                          info = `Relacionado con: ${relaciones.join(' | ')}`;
                        }
                      }
                      return info;
                    })()
                  });
                  
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            
            // 2. Personas relacionadas con este inmueble
            if (relationData && relationData.personas && relationData.personas.length > 0) {
              console.log("Personas relacionadas con inmueble:", relationData.personas);
              
              for (const personaRelacionada of relationData.personas) {
                try {
                  // Obtener datos específicos de las personas relacionadas
                  const respuestaPersona = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
                  const datosPersona = await respuestaPersona.json();
                  
                  // Buscar domicilios de la persona relacionada con inmueble
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.ubicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando domicilio de persona relacionada con inmueble: ${ubicacionRelacionada.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Domicilio",
                          description: ubicacionRelacionada.observaciones || `Domicilio de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.referencia || "Inmueble"} en ${selectedResult.direccion || "ubicación desconocida"})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                  
                  // Buscar avistamientos de la persona relacionada con inmueble
                  if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.otrasUbicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando avistamiento de persona relacionada con inmueble: ${ubicacionRelacionada.tipo || "Avistamiento"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Avistamiento",
                          description: ubicacionRelacionada.observaciones || `${ubicacionRelacionada.tipo || "Avistamiento"} de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.referencia || "Inmueble"} en ${selectedResult.direccion || "ubicación desconocida"})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de persona relacionada con inmueble:", error);
                }
              }
            }
            
            // 3. Inmuebles relacionados con este inmueble
            if (relationData && relationData.inmuebles && relationData.inmuebles.length > 0) {
              console.log("Inmuebles relacionados con este inmueble:", relationData.inmuebles);
              
              for (const inmuebleRelacionado of relationData.inmuebles) {
                try {
                  // Obtener datos específicos del inmueble relacionado
                  const respuestaInmueble = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
                  const datosInmueble = await respuestaInmueble.json();
                  
                  if (datosInmueble.ubicaciones && datosInmueble.ubicaciones.length > 0) {
                    for (const ubicacionInmueble of datosInmueble.ubicaciones) {
                      const lat = parseFloat(String(ubicacionInmueble.latitud));
                      const lng = parseFloat(String(ubicacionInmueble.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando ubicación de inmueble relacionado: ${inmuebleRelacionado.tipo || "Inmueble"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionInmueble.id,
                          lat: lat,
                          lng: lng,
                          title: inmuebleRelacionado.tipo || "Inmueble",
                          description: `${inmuebleRelacionado.tipo || "Inmueble"} en ${inmuebleRelacionado.direccion || "dirección desconocida"} (relacionado con ${selectedResult.referencia || "Inmueble"} en ${selectedResult.direccion || "ubicación desconocida"})`,
                          type: "inmueble",
                          relation: "related",
                          entityId: inmuebleRelacionado.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones del inmueble relacionado:", error);
                }
              }
            }
            
            // 4. Ubicaciones relacionadas directamente con este inmueble
            if (relationData && relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              console.log("Ubicaciones adicionales relacionadas con este inmueble:", relationData.ubicaciones);
              
              for (const ubicacion of relationData.ubicaciones) {
                // Solo procesar si no se ha agregado antes como ubicación directa
                const ubicacionYaProcesada = ubicacionesEncontradas.some(u => 
                  u.id === ubicacion.id && u.type === "inmueble" && u.relation === "direct"
                );
                
                if (!ubicacionYaProcesada) {
                  const lat = parseFloat(String(ubicacion.latitud));
                  const lng = parseFloat(String(ubicacion.longitud));
                  
                  if (!isNaN(lat) && !isNaN(lng)) {
                    console.log(`Agregando ubicación relacionada con inmueble: ${ubicacion.tipo || "Ubicación"} - lat: ${lat}, lng: ${lng}`);
                    
                    ubicacionesEncontradas.push({
                      id: ubicacion.id,
                      lat: lat,
                      lng: lng,
                      title: ubicacion.tipo || "Ubicación",
                      description: ubicacion.observaciones || `Ubicación relacionada con ${selectedResult.referencia || "Inmueble"} en ${selectedResult.direccion || "ubicación desconocida"}`,
                      type: "ubicacion",
                      relation: "related",
                      entityId: ubicacion.id
                    });
                  }
                }
              }
            }
            
            if (!ubicacionesEncontradas.length) {
              console.log("No se encontraron ubicaciones para este inmueble");
            }
            break;
            
          case "ubicacion":
            // 1. La ubicación tiene coordenadas propias
            const ubicacion = entityData as UbicacionEntity;
            if (ubicacion.latitud && ubicacion.longitud) {
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                console.log(`Agregando ubicación directa: id=${ubicacion.id} - lat: ${lat}, lng: ${lng}`);
                
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat: lat,
                  lng: lng,
                  title: ubicacion.tipo || "Ubicación",
                  description: ubicacion.observaciones || "Sin descripción",
                  type: "ubicacion",
                  relation: "direct",
                  entityId: ubicacion.id,
                  relationInfo: (() => {
                    let info = "Sin relaciones";
                    if (relationData) {
                      const relaciones = [];
                      
                      // Relaciones con personas
                      if (relationData.personas && relationData.personas.length > 0) {
                        relaciones.push(`Personas: ${relationData.personas.map(p => p.nombre).join(', ')}`);
                      }
                      
                      // Relaciones con vehículos
                      if (relationData.vehiculos && relationData.vehiculos.length > 0) {
                        relaciones.push(`Vehículos: ${relationData.vehiculos.map(v => `${v.marca} ${v.modelo} (${v.placa})`).join(', ')}`);
                      }
                      
                      // Relaciones con inmuebles
                      if (relationData.inmuebles && relationData.inmuebles.length > 0) {
                        relaciones.push(`Inmuebles: ${relationData.inmuebles.map(i => `${i.tipo} en ${i.direccion}`).join(', ')}`);
                      }
                      
                      // Relaciones con ubicaciones
                      if (relationData.ubicaciones && relationData.ubicaciones.length > 0) {
                        relaciones.push(`Ubicaciones: ${relationData.ubicaciones.map(u => u.tipo || "Sin tipo").join(', ')}`);
                      }
                      
                      if (relaciones.length > 0) {
                        info = `Relacionado con: ${relaciones.join(' | ')}`;
                      }
                    }
                    return info;
                  })()
                });
                
                setMapCenter([lat, lng]);
                hasCenteredMap = true;
              }
            }
            
            // 2. Personas relacionadas con esta ubicación
            if (relationData && relationData.personas && relationData.personas.length > 0) {
              console.log("Personas relacionadas con ubicación:", relationData.personas);
              
              for (const personaRelacionada of relationData.personas) {
                try {
                  // Obtener datos específicos de las personas relacionadas
                  const respuestaPersona = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
                  const datosPersona = await respuestaPersona.json();
                  
                  // Buscar domicilios de la persona relacionada con esta ubicación
                  // NOTA: Ahora todos son considerados como "related" incluso si son domicilios
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.ubicaciones) {
                      // No incluir la ubicación actual
                      if (ubicacionRelacionada.id === ubicacion.id) continue;
                      
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando domicilio de persona relacionada con ubicación: ${ubicacionRelacionada.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Domicilio",
                          description: ubicacionRelacionada.observaciones || `Domicilio de ${personaRelacionada.nombre} (persona relacionada con ${ubicacion.tipo || "Ubicación"})`,
                          type: "ubicacion",
                          relation: "related", // Siempre relacionadas cuando se ve desde la entidad Ubicación
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                  
                  // Buscar avistamientos u otras ubicaciones (no domicilios) de la persona relacionada
                  if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.otrasUbicaciones) {
                      // No incluir la ubicación actual
                      if (ubicacionRelacionada.id === ubicacion.id) continue;
                      
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando avistamiento de persona relacionada con ubicación: ${ubicacionRelacionada.tipo || "Avistamiento"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Avistamiento",
                          description: ubicacionRelacionada.observaciones || `${ubicacionRelacionada.tipo || "Avistamiento"} de ${personaRelacionada.nombre} (persona relacionada con ${ubicacion.tipo || "Ubicación"})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de persona relacionada con ubicación:", error);
                }
              }
            }
            
            // 3. Inmuebles relacionados con esta ubicación
            if (relationData && relationData.inmuebles && relationData.inmuebles.length > 0) {
              console.log("Inmuebles relacionados con ubicación:", relationData.inmuebles);
              
              for (const inmuebleRelacionado of relationData.inmuebles) {
                try {
                  // Obtener datos específicos del inmueble relacionado
                  const respuestaInmueble = await fetch(`/api/relaciones/inmueble/${inmuebleRelacionado.id}`);
                  const datosInmueble = await respuestaInmueble.json();
                  
                  if (datosInmueble.ubicaciones && datosInmueble.ubicaciones.length > 0) {
                    for (const ubicacionInmueble of datosInmueble.ubicaciones) {
                      // No incluir la ubicación actual
                      if (ubicacionInmueble.id === ubicacion.id) continue;
                      
                      const lat = parseFloat(String(ubicacionInmueble.latitud));
                      const lng = parseFloat(String(ubicacionInmueble.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando ubicación de inmueble relacionado: ${inmuebleRelacionado.tipo || "Inmueble"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionInmueble.id,
                          lat: lat,
                          lng: lng,
                          title: inmuebleRelacionado.tipo || "Inmueble",
                          description: `${inmuebleRelacionado.tipo || "Inmueble"} en ${inmuebleRelacionado.direccion || "dirección desconocida"} (relacionado con ${ubicacion.tipo || "Ubicación"})`,
                          type: "inmueble",
                          relation: "related", // Siempre related cuando se ve desde entidad Ubicación, incluso si es de tipo "inmueble"
                          entityId: inmuebleRelacionado.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones del inmueble relacionado:", error);
                }
              }
            }
            
            // 4. Vehículos relacionados con esta ubicación
            if (relationData && relationData.vehiculos && relationData.vehiculos.length > 0) {
              console.log("Vehículos relacionados con ubicación:", relationData.vehiculos);
              
              for (const vehiculoRelacionado of relationData.vehiculos) {
                try {
                  // Obtener datos específicos del vehículo relacionado
                  const respuestaVehiculo = await fetch(`/api/relaciones/vehiculo/${vehiculoRelacionado.id}`);
                  const datosVehiculo = await respuestaVehiculo.json();
                  
                  // Los vehículos no tienen ubicaciones directas, pero buscar personas relacionadas
                  if (datosVehiculo.personas && datosVehiculo.personas.length > 0) {
                    for (const personaRelacionada of datosVehiculo.personas) {
                      // Obtener datos específicos de las personas relacionadas con el vehículo
                      const respuestaPersona = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
                      const datosPersona = await respuestaPersona.json();
                      
                      // Procesando domicilios de la persona relacionada
                      if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                        for (const ubicacionPersona of datosPersona.ubicaciones) {
                          // No incluir la ubicación actual
                          if (ubicacionPersona.id === ubicacion.id) continue;
                          
                          const lat = parseFloat(String(ubicacionPersona.latitud));
                          const lng = parseFloat(String(ubicacionPersona.longitud));
                          
                          if (!isNaN(lat) && !isNaN(lng)) {
                            console.log(`Agregando domicilio de persona (${personaRelacionada.nombre}) relacionada con vehículo relacionado con ubicación: ${ubicacionPersona.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                            
                            ubicacionesEncontradas.push({
                              id: ubicacionPersona.id,
                              lat: lat,
                              lng: lng,
                              title: ubicacionPersona.tipo || "Domicilio",
                              description: ubicacionPersona.observaciones || 
                                `Domicilio de ${personaRelacionada.nombre} (propietario de ${vehiculoRelacionado.marca} ${vehiculoRelacionado.modelo} - Placa: ${vehiculoRelacionado.placa}, relacionado con ${ubicacion.tipo || "Ubicación"})`,
                              type: "ubicacion",
                              relation: "related",
                              entityId: personaRelacionada.id
                            });
                          }
                        }
                      }
                      
                      // Procesando avistamientos de la persona relacionada
                      if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                        for (const ubicacionPersona of datosPersona.otrasUbicaciones) {
                          // No incluir la ubicación actual
                          if (ubicacionPersona.id === ubicacion.id) continue;
                          
                          const lat = parseFloat(String(ubicacionPersona.latitud));
                          const lng = parseFloat(String(ubicacionPersona.longitud));
                          
                          if (!isNaN(lat) && !isNaN(lng)) {
                            console.log(`Agregando avistamiento de persona (${personaRelacionada.nombre}) relacionada con vehículo relacionado con ubicación: ${ubicacionPersona.tipo || "Avistamiento"} - lat: ${lat}, lng: ${lng}`);
                            
                            ubicacionesEncontradas.push({
                              id: ubicacionPersona.id,
                              lat: lat,
                              lng: lng,
                              title: ubicacionPersona.tipo || "Avistamiento",
                              description: ubicacionPersona.observaciones || 
                                `${ubicacionPersona.tipo || "Avistamiento"} de ${personaRelacionada.nombre} (propietario de ${vehiculoRelacionado.marca} ${vehiculoRelacionado.modelo} - Placa: ${vehiculoRelacionado.placa}, relacionado con ${ubicacion.tipo || "Ubicación"})`,
                              type: "ubicacion",
                              relation: "related",
                              entityId: personaRelacionada.id
                            });
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener relaciones del vehículo relacionado con ubicación:", error);
                }
              }
            }
            
            // 5. Ubicaciones relacionadas con esta ubicación
            if (relationData && relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              console.log("Ubicaciones relacionadas con esta ubicación:", relationData.ubicaciones);
              
              for (const ubicacionRelacionada of relationData.ubicaciones) {
                // No incluir la ubicación actual
                if (ubicacionRelacionada.id === ubicacion.id) continue;
                
                const lat = parseFloat(String(ubicacionRelacionada.latitud));
                const lng = parseFloat(String(ubicacionRelacionada.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log(`Agregando ubicación relacionada con esta ubicación: ${ubicacionRelacionada.tipo || "Ubicación"} - lat: ${lat}, lng: ${lng}`);
                  
                  ubicacionesEncontradas.push({
                    id: ubicacionRelacionada.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacionRelacionada.tipo || "Ubicación",
                    description: ubicacionRelacionada.observaciones || `Ubicación relacionada con ${ubicacion.tipo || "Ubicación"}`,
                    type: "ubicacion",
                    relation: "related",
                    entityId: ubicacionRelacionada.id
                  });
                }
              }
            }
            break;
            
          case "vehiculo":
            // Los vehículos pueden tener relaciones con personas, inmuebles y ubicaciones
            // Primero procesamos las personas relacionadas
            if (relationData && relationData.personas) {
              console.log("Personas relacionadas con vehículo:", relationData.personas);
              
              // Obtener personas relacionadas con el vehículo
              for (const persona of relationData.personas) {
                // Hacer una consulta adicional para obtener las ubicaciones de esta persona
                try {
                  const respuesta = await fetch(`/api/relaciones/persona/${persona.id}`);
                  const datosPersona = await respuesta.json();
                  
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    console.log(`Ubicaciones de persona ${persona.nombre}:`, datosPersona.ubicaciones);
                    
                    for (const ubicacionPropietario of datosPersona.ubicaciones) {
                      const lat = parseFloat(String(ubicacionPropietario.latitud));
                      const lng = parseFloat(String(ubicacionPropietario.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando ubicación de persona relacionada: ${ubicacionPropietario.tipo || "Domicilio"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionPropietario.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionPropietario.tipo || "Domicilio",
                          description: `Domicilio de ${persona.nombre} (persona relacionada con ${selectedResult.marca || ''} ${selectedResult.modelo || ''} - Placa: ${selectedResult.placa || 'Sin placa'})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: persona.id
                        });
                        
                        if (!hasCenteredMap) {
                          setMapCenter([lat, lng]);
                          hasCenteredMap = true;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de la persona:", error);
                }
              }
            }
            
            // Procesar inmuebles relacionados con el vehículo
            if (relationData && relationData.inmuebles && relationData.inmuebles.length > 0) {
              console.log("Inmuebles relacionados con vehículo:", relationData.inmuebles);
              
              for (const inmueble of relationData.inmuebles) {
                try {
                  // Obtener datos específicos del inmueble
                  const respuestaInmueble = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
                  const datosInmueble = await respuestaInmueble.json();
                  
                  if (datosInmueble.ubicaciones && datosInmueble.ubicaciones.length > 0) {
                    for (const ubicacionInmueble of datosInmueble.ubicaciones) {
                      const lat = parseFloat(String(ubicacionInmueble.latitud));
                      const lng = parseFloat(String(ubicacionInmueble.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Agregando ubicación de inmueble relacionado: ${inmueble.tipo || "Inmueble"} - lat: ${lat}, lng: ${lng}`);
                        
                        ubicacionesEncontradas.push({
                          id: ubicacionInmueble.id,
                          lat: lat,
                          lng: lng,
                          title: inmueble.tipo || "Inmueble",
                          description: `${inmueble.tipo || "Inmueble"} en ${inmueble.direccion || "dirección desconocida"} (relacionado con ${selectedResult.marca || ''} ${selectedResult.modelo || ''} - Placa: ${selectedResult.placa || 'Sin placa'})`,
                          type: "inmueble",
                          relation: "related",
                          entityId: inmueble.id
                        });
                        
                        if (!hasCenteredMap) {
                          setMapCenter([lat, lng]);
                          hasCenteredMap = true;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones del inmueble:", error);
                }
              }
            }
            
            // Procesar ubicaciones relacionadas directamente con el vehículo
            if (relationData && relationData.ubicaciones && relationData.ubicaciones.length > 0) {
              console.log("Ubicaciones relacionadas directamente con vehículo:", relationData.ubicaciones);
              
              for (const ubicacion of relationData.ubicaciones) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log(`Agregando ubicación directamente relacionada con vehículo: ${ubicacion.tipo || "Ubicación"} - lat: ${lat}, lng: ${lng}`);
                  
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Ubicación",
                    description: ubicacion.observaciones || `Ubicación relacionada con ${selectedResult.marca || ''} ${selectedResult.modelo || ''} - Placa: ${selectedResult.placa || 'Sin placa'}`,
                    type: "ubicacion",
                    relation: "related",
                    entityId: ubicacion.id
                  });
                  
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            
            if (!ubicacionesEncontradas.length) {
              console.log("No se encontraron ubicaciones para este vehículo");
            }
            break;
        }
        
        console.log("Ubicaciones encontradas:", ubicacionesEncontradas);
        setLocations(ubicacionesEncontradas);
        
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarUbicaciones();
  }, [selectedResult, entityData, relationData]);

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
                
                {/* Botón para generar informe PDF */}
                <Button
                  onClick={generarInformePDF}
                  disabled={!selectedResult || locations.length === 0 || isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileText className="h-4 w-4" />
                  Generar Informe PDF
                </Button>
              </div>
              
              {/* Cambiando el layout para ser más responsive */}
              <div className="flex flex-col space-y-4">
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      <span>Mapa de Ubicaciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="border rounded-md p-4 min-h-[250px] md:min-h-[300px] flex items-center justify-center text-gray-500">
                        <p>Cargando ubicaciones...</p>
                      </div>
                    ) : locations.length > 0 ? (
                      <div className="h-[300px] md:h-[400px] mb-6">
                        <LocationMap 
                          markers={locations} 
                          center={mapCenter}
                          zoom={15}
                        />
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 min-h-[250px] md:min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                        <MapPin className="h-8 w-8 md:h-12 md:w-12 mb-3 md:mb-4 text-gray-400" />
                        <p className="mb-1 md:mb-2 text-base md:text-lg">No se encontraron ubicaciones</p>
                        <p className="text-xs md:text-sm text-center max-w-xs md:max-w-md">
                          {selectedResult.tipo === 'vehiculo' 
                            ? 'Los vehículos no tienen ubicaciones directas. Se mostrarán los domicilios de personas relacionadas.'
                            : 'Esta entidad no tiene coordenadas registradas'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  {/* Tabla de ubicaciones directas */}
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        <span>Ubicaciones Directas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <p className="text-center py-4 text-gray-500">Cargando...</p>
                      ) : locations.filter(loc => loc.relation === 'direct').length > 0 ? (
                        <LocationsTable 
                          locations={locations.filter(loc => loc.relation === 'direct')}
                          onLocationClick={handleLocationClick}
                        />
                      ) : (
                        <p className="text-center py-4 text-gray-500">
                          {selectedResult.tipo === 'vehiculo' 
                            ? 'Los vehículos no tienen ubicaciones directas' 
                            : 'No se encontraron ubicaciones directas para esta entidad'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Tabla de ubicaciones relacionadas */}
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Search className="h-5 w-5" />
                        <span>Ubicaciones Relacionadas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <p className="text-center py-4 text-gray-500">Cargando...</p>
                      ) : locations.filter(loc => loc.relation === 'related').length > 0 ? (
                        <LocationsTable 
                          locations={locations.filter(loc => loc.relation === 'related')}
                          onLocationClick={handleLocationClick}
                        />
                      ) : (
                        <p className="text-center py-4 text-gray-500">
                          No se encontraron ubicaciones relacionadas
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg">Realice una búsqueda para ver ubicaciones</p>
              <p className="text-sm text-center max-w-md">
                Seleccione una persona, vehículo, inmueble o ubicación para ver sus coordenadas en el mapa
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}