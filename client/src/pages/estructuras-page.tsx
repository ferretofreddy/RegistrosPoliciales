import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Car, Home, MapPin, FileText, Download } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MapaTablaUbicaciones from "@/components/mapa-tabla-ubicaciones";
import ReactMarkdown from "react-markdown";

// Tipo para los resultados de búsqueda
type SearchResult = {
  tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion";
  id: number;
  nombre: string;
  descripcion: string;
};

export default function EstructurasPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [tiposFiltro, setTiposFiltro] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
    ubicaciones: true
  });
  const [resultadosBusqueda, setResultadosBusqueda] = useState<SearchResult[]>([]);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<SearchResult | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [observacionesPersona, setObservacionesPersona] = useState<any[]>([]);
  const [observacionesVehiculo, setObservacionesVehiculo] = useState<any[]>([]);
  const [observacionesInmueble, setObservacionesInmueble] = useState<any[]>([]);

  // Función que procesa y prepara los tipos para la búsqueda
  const getTiposSeleccionados = () => {
    const tipos = [];
    if (tiposFiltro.personas) tipos.push("personas");
    if (tiposFiltro.vehiculos) tipos.push("vehiculos");
    if (tiposFiltro.inmuebles) tipos.push("inmuebles");
    if (tiposFiltro.ubicaciones) tipos.push("ubicaciones");
    return tipos;
  };

  // Query para búsqueda
  const { data: searchResults, isLoading: searchLoading, refetch: searchRefetch } = useQuery<{
    personas?: Persona[];
    vehiculos?: Vehiculo[];
    inmuebles?: Inmueble[];
    ubicaciones?: Ubicacion[];
    ubicacionesRelacionadas?: any[];
  }>({
    queryKey: ["/api/buscar", searchTerm, getTiposSeleccionados()],
    enabled: false,
    queryFn: ({ queryKey }) => {
      if (!queryKey[1] || (queryKey[1] as string).trim() === "") {
        throw new Error("Se requiere un término de búsqueda");
      }
      return fetch(`/api/buscar?query=${encodeURIComponent(queryKey[1] as string)}&${(queryKey[2] as string[]).map(tipo => `tipos=${tipo}`).join("&")}`)
        .then(res => res.json());
    }
  });

  useEffect(() => {
    if (searchResults) {
      const resultados: SearchResult[] = [];
      
      // Procesar personas
      if (searchResults.personas && searchResults.personas.length > 0) {
        searchResults.personas.forEach(persona => {
          resultados.push({
            tipo: "persona",
            id: persona.id,
            nombre: persona.nombre,
            descripcion: `${persona.identificacion} | persona`
          });
        });
      }
      
      // Procesar vehículos
      if (searchResults.vehiculos && searchResults.vehiculos.length > 0) {
        searchResults.vehiculos.forEach(vehiculo => {
          resultados.push({
            tipo: "vehiculo",
            id: vehiculo.id,
            nombre: `${vehiculo.marca} ${vehiculo.modelo}`,
            descripcion: `${vehiculo.placa} | vehículo`
          });
        });
      }
      
      // Procesar inmuebles
      if (searchResults.inmuebles && searchResults.inmuebles.length > 0) {
        searchResults.inmuebles.forEach(inmueble => {
          resultados.push({
            tipo: "inmueble",
            id: inmueble.id,
            nombre: inmueble.tipo,
            descripcion: `${inmueble.direccion} | inmueble`
          });
        });
      }
      
      // Procesar ubicaciones
      if (searchResults.ubicaciones && searchResults.ubicaciones.length > 0) {
        searchResults.ubicaciones.forEach(ubicacion => {
          resultados.push({
            tipo: "ubicacion",
            id: ubicacion.id,
            nombre: ubicacion.tipo,
            descripcion: `(${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}) | ubicación`
          });
        });
      }
      
      setResultadosBusqueda(resultados);
    }
  }, [searchResults]);

  // Consulta para obtener las ubicaciones relacionadas
  const { data: ubicacionesData, isLoading: ubicacionesLoading, refetch: ubicacionesRefetch } = useQuery<{
    ubicacionesDirectas: Ubicacion[];
    ubicacionesRelacionadas: {
      ubicacion: Ubicacion;
      entidadRelacionada: {
        tipo: string;
        entidad: any;
        relacionadoCon?: {
          tipo: string;
          entidad: any;
        };
      };
    }[];
  }>({
    queryKey: ["/api/ubicaciones", searchTerm],
    enabled: false,
  });

  // Query para obtener detalles de la entidad seleccionada
  const { data: detalleData, isLoading: detalleLoading, refetch: detalleRefetch } = useQuery<any>({
    queryKey: ["/api/relaciones", entidadSeleccionada?.tipo, entidadSeleccionada?.id],
    enabled: !!entidadSeleccionada,
    queryFn: ({ queryKey }) => {
      if (!queryKey[1] || !queryKey[2]) {
        throw new Error("Tipo y ID de entidad requeridos");
      }
      return fetch(`/api/relaciones/${queryKey[1]}/${queryKey[2]}`)
        .then(res => {
          if (!res.ok) {
            throw new Error("Error al obtener detalles de la entidad");
          }
          return res.json();
        });
    }
  });

  // Función para filtrar y procesar datos de relaciones específicos para la entidad seleccionada
  function procesarDatosEntidad(seleccionada: SearchResult, datos: any) {
    if (!seleccionada || !datos) return datos;
    
    // Copia profunda para no modificar los datos originales
    const datosProcesados = JSON.parse(JSON.stringify(datos));
    
    // Filtrar personas para mostrar solo la seleccionada o relacionadas
    if (seleccionada.tipo === "persona" && datosProcesados.personas && datosProcesados.personas.length > 0) {
      // Asegurarnos que la primera persona en el array es la seleccionada
      const personaSeleccionada = datosProcesados.personas.find((p: any) => p.id === seleccionada.id);
      
      if (personaSeleccionada) {
        // Reorganizar el array para poner la persona seleccionada primero
        datosProcesados.personas = [
          personaSeleccionada,
          ...datosProcesados.personas.filter((p: any) => p.id !== seleccionada.id)
        ];
      }
    }
    
    // Filtrar vehículos para mostrar solo el seleccionado o relacionados
    if (seleccionada.tipo === "vehiculo" && datosProcesados.vehiculos && datosProcesados.vehiculos.length > 0) {
      const vehiculoSeleccionado = datosProcesados.vehiculos.find((v: any) => v.id === seleccionada.id);
      
      if (vehiculoSeleccionado) {
        datosProcesados.vehiculos = [
          vehiculoSeleccionado,
          ...datosProcesados.vehiculos.filter((v: any) => v.id !== seleccionada.id)
        ];
      }
    }
    
    // Filtrar inmuebles para mostrar solo el seleccionado o relacionados
    if (seleccionada.tipo === "inmueble" && datosProcesados.inmuebles && datosProcesados.inmuebles.length > 0) {
      const inmuebleSeleccionado = datosProcesados.inmuebles.find((i: any) => i.id === seleccionada.id);
      
      if (inmuebleSeleccionado) {
        datosProcesados.inmuebles = [
          inmuebleSeleccionado,
          ...datosProcesados.inmuebles.filter((i: any) => i.id !== seleccionada.id)
        ];
      }
    }
    
    return datosProcesados;
  }

  // Actualizar el contenido markdown cuando cambian los datos o las observaciones
  useEffect(() => {
    if (entidadSeleccionada && detalleData) {
      const observaciones = 
          entidadSeleccionada.tipo === "persona" ? observacionesPersona :
          entidadSeleccionada.tipo === "vehiculo" ? observacionesVehiculo :
          entidadSeleccionada.tipo === "inmueble" ? observacionesInmueble : [];
      
      // Procesar los datos para asegurar que se muestre la información correcta
      const datosProcesados = procesarDatosEntidad(entidadSeleccionada, detalleData);
      
      // Generar contenido Markdown con los datos procesados
      generarContenidoMarkdown(entidadSeleccionada, datosProcesados, observaciones);
      
      // Log para depuración extendida
      console.log("Datos detallados completos:", datosProcesados);
      
      // Verificar estructura de ubicaciones
      if (datosProcesados.ubicaciones) {
        console.log("Estructura de ubicaciones:", {
          tipo: entidadSeleccionada.tipo,
          id: entidadSeleccionada.id,
          tieneUbicaciones: datosProcesados.ubicaciones ? "Sí" : "No",
          tipoUbicaciones: typeof datosProcesados.ubicaciones,
          esArray: Array.isArray(datosProcesados.ubicaciones),
          propiedades: Object.keys(datosProcesados.ubicaciones)
        });
      }
    }
  }, [entidadSeleccionada, detalleData, observacionesPersona, observacionesVehiculo, observacionesInmueble]);

  // Generar el contenido Markdown basado en los datos
  const generarContenidoMarkdown = (entidad: SearchResult, data: any, observaciones: any[] = []) => {
    let md = `# ${entidad.nombre}\n\n`;
    
    // Información del registro
    md += "## Información del Registro\n\n";
    
    if (entidad.tipo === "persona" && data.personas && data.personas.length > 0) {
      // Buscar la persona correcta por ID
      const persona = data.personas.find(p => p.id === entidad.id) || data.personas[0];
      md += `**Nombre:** ${persona.nombre}  \n`;
      md += `**Identificación:** ${persona.identificacion}  \n`;
      
      if (persona.alias && persona.alias.length > 0) {
        md += `**Alias:** ${persona.alias.join(", ")}  \n`;
      }
      
      if (persona.telefonos && persona.telefonos.length > 0) {
        md += `**Teléfonos:** ${persona.telefonos.join(", ")}  \n`;
      }
      
      if (persona.domicilios && persona.domicilios.length > 0) {
        md += `**Domicilios:** ${persona.domicilios.join("; ")}  \n`;
      }
    } else if (entidad.tipo === "vehiculo" && data.vehiculos && data.vehiculos.length > 0) {
      // Buscar el vehículo correcto por ID
      const vehiculo = data.vehiculos.find(v => v.id === entidad.id) || data.vehiculos[0];
      md += `**Marca:** ${vehiculo.marca}  \n`;
      md += `**Modelo:** ${vehiculo.modelo}  \n`;
      md += `**Tipo:** ${vehiculo.tipo}  \n`;
      md += `**Placa:** ${vehiculo.placa}  \n`;
      md += `**Color:** ${vehiculo.color}  \n`;
    } else if (entidad.tipo === "inmueble" && data.inmuebles && data.inmuebles.length > 0) {
      // Buscar el inmueble correcto por ID
      const inmueble = data.inmuebles.find(i => i.id === entidad.id) || data.inmuebles[0];
      md += `**Tipo:** ${inmueble.tipo}  \n`;
      md += `**Dirección:** ${inmueble.direccion}  \n`;
      md += `**Propietario:** ${inmueble.propietario || "No registrado"}  \n`;
    } else if (entidad.tipo === "ubicacion" && data.ubicaciones && data.ubicaciones.ubicacionesDirectas && data.ubicaciones.ubicacionesDirectas.length > 0) {
      const ubicacion = data.ubicaciones.ubicacionesDirectas[0];
      md += `**Tipo:** ${ubicacion.tipo}  \n`;
      md += `**Coordenadas:** (${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)})  \n`;
      md += `**Fecha:** ${ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada"}  \n`;
      if (ubicacion.observaciones) {
        md += `**Observaciones:** ${ubicacion.observaciones}  \n`;
      }
    }
    
    md += "\n";
    
    // Observaciones relacionadas
    const tieneObservaciones = observaciones && observaciones.length > 0;
    
    if (tieneObservaciones) {
      md += "## Observaciones\n\n";
      
      observaciones.forEach((obs: any) => {
        md += `### ${new Date(obs.fecha).toLocaleString()}\n\n`;
        md += `${obs.detalle || obs.observacion || "Sin detalles"}\n\n`;
      });
    }
    
    // Entidades relacionadas
    md += "## Registros Relacionados\n\n";
    
    // Personas relacionadas (incluso del mismo tipo)
    if (data.personas && data.personas.length > 0) {
      // Filtramos la entidad actual si es persona
      const personasRelacionadas = entidad.tipo === "persona" 
        ? data.personas.filter(p => p.id !== parseInt(entidad.id.toString())) 
        : data.personas;
        
      if (personasRelacionadas.length > 0) {
        md += "### Personas\n\n";
        personasRelacionadas.forEach((persona: Persona) => {
          md += `- **${persona.nombre}** (${persona.identificacion})\n`;
        });
        md += "\n";
      }
    }
    
    // Vehículos relacionados (incluso del mismo tipo)
    if (data.vehiculos && data.vehiculos.length > 0) {
      // Filtramos la entidad actual si es vehículo
      const vehiculosRelacionados = entidad.tipo === "vehiculo"
        ? data.vehiculos.filter(v => v.id !== parseInt(entidad.id.toString()))
        : data.vehiculos;
        
      if (vehiculosRelacionados.length > 0) {
        md += "### Vehículos\n\n";
        vehiculosRelacionados.forEach((vehiculo: Vehiculo) => {
          md += `- **${vehiculo.marca} ${vehiculo.modelo}** (${vehiculo.placa})\n`;
        });
        md += "\n";
      }
    }
    
    // Inmuebles relacionados (incluso del mismo tipo)
    if (data.inmuebles && data.inmuebles.length > 0) {
      // Filtramos la entidad actual si es inmueble
      const inmueblesRelacionados = entidad.tipo === "inmueble"
        ? data.inmuebles.filter(i => i.id !== parseInt(entidad.id.toString()))
        : data.inmuebles;
        
      if (inmueblesRelacionados.length > 0) {
        md += "### Inmuebles\n\n";
        inmueblesRelacionados.forEach((inmueble: Inmueble) => {
          md += `- **${inmueble.tipo}** (${inmueble.direccion})\n`;
        });
        md += "\n";
      }
    }
    
    // Ubicaciones (si hay)
    if (data.ubicaciones) {
      md += "## Ubicaciones\n\n";
      
      if ((data.ubicaciones.ubicacionesDirectas && data.ubicaciones.ubicacionesDirectas.length > 0) ||
          (data.ubicaciones.ubicacionesRelacionadas && data.ubicaciones.ubicacionesRelacionadas.length > 0)) {
        
        md += "### Tabla de Ubicaciones\n\n";
        md += "| Tipo | Coordenadas | Fecha | Relación | Observaciones |\n";
        md += "|------|-------------|-------|----------|---------------|\n";
        
        // Ubicaciones directas
        if (data.ubicaciones.ubicacionesDirectas) {
          data.ubicaciones.ubicacionesDirectas.forEach((ubicacion: Ubicacion) => {
            md += `| ${ubicacion.tipo} | ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)} | ${ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada"} | Directa | ${ubicacion.observaciones || ""} |\n`;
          });
        }
        
        // Ubicaciones relacionadas
        if (data.ubicaciones.ubicacionesRelacionadas) {
          data.ubicaciones.ubicacionesRelacionadas.forEach((item: any) => {
            const relacion = item.entidadRelacionada.relacionadoCon 
              ? `${item.entidadRelacionada.tipo.toUpperCase()} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : item.entidadRelacionada.tipo.toUpperCase();
              
            md += `| ${item.ubicacion.tipo} | ${item.ubicacion.latitud.toFixed(6)}, ${item.ubicacion.longitud.toFixed(6)} | ${item.ubicacion.fecha ? new Date(item.ubicacion.fecha).toLocaleString() : "No registrada"} | ${relacion} | ${item.ubicacion.observaciones || ""} |\n`;
          });
        }
      } else {
        md += "No hay ubicaciones asociadas a este registro.\n\n";
      }
    }
    
    setMarkdownContent(md);
  };

  // Función para generar PDF con la información
  const generarPDF = () => {
    if (!entidadSeleccionada || !detalleData) return;
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter"
      });
      
      // Título
      doc.setFontSize(16);
      doc.text(`Informe: ${entidadSeleccionada.nombre}`, 14, 20);
      
      // Información básica
      doc.setFontSize(12);
      let yPos = 30;
      
      // Detalles según el tipo de entidad
      if (entidadSeleccionada.tipo === "persona" && detalleData.personas && detalleData.personas.length > 0) {
        // Buscar la persona correcta por ID
        const persona = detalleData.personas.find(p => p.id === entidadSeleccionada.id) || detalleData.personas[0];
        doc.text(`Nombre: ${persona.nombre}`, 14, yPos);
        doc.text(`Identificación: ${persona.identificacion}`, 14, yPos + 8);
        yPos += 16;
        
        if (persona.alias && persona.alias.length > 0) {
          doc.text(`Alias: ${persona.alias.join(", ")}`, 14, yPos);
          yPos += 8;
        }
        
        if (persona.telefonos && persona.telefonos.length > 0) {
          doc.text(`Teléfonos: ${persona.telefonos.join(", ")}`, 14, yPos);
          yPos += 8;
        }
        
        if (persona.domicilios && persona.domicilios.length > 0) {
          doc.text(`Domicilios: ${persona.domicilios.join("; ")}`, 14, yPos);
          yPos += 8;
        }
      } else if (entidadSeleccionada.tipo === "vehiculo" && detalleData.vehiculos && detalleData.vehiculos.length > 0) {
        // Buscar el vehículo correcto por ID
        const vehiculo = detalleData.vehiculos.find(v => v.id === entidadSeleccionada.id) || detalleData.vehiculos[0];
        doc.text(`Marca: ${vehiculo.marca}`, 14, yPos);
        doc.text(`Modelo: ${vehiculo.modelo}`, 14, yPos + 8);
        doc.text(`Tipo: ${vehiculo.tipo}`, 14, yPos + 16);
        doc.text(`Placa: ${vehiculo.placa}`, 14, yPos + 24);
        doc.text(`Color: ${vehiculo.color}`, 14, yPos + 32);
        yPos += 40;
      } else if (entidadSeleccionada.tipo === "inmueble" && detalleData.inmuebles && detalleData.inmuebles.length > 0) {
        // Buscar el inmueble correcto por ID
        const inmueble = detalleData.inmuebles.find(i => i.id === entidadSeleccionada.id) || detalleData.inmuebles[0];
        doc.text(`Tipo: ${inmueble.tipo}`, 14, yPos);
        doc.text(`Dirección: ${inmueble.direccion}`, 14, yPos + 8);
        doc.text(`Propietario: ${inmueble.propietario || "No registrado"}`, 14, yPos + 16);
        yPos += 24;
      }
      
      // Observaciones
      const observaciones = 
        entidadSeleccionada.tipo === "persona" ? observacionesPersona :
        entidadSeleccionada.tipo === "vehiculo" ? observacionesVehiculo :
        entidadSeleccionada.tipo === "inmueble" ? observacionesInmueble : [];
      
      if (observaciones && observaciones.length > 0) {
        yPos += 8;
        doc.setFontSize(14);
        doc.text("Observaciones", 14, yPos);
        doc.setFontSize(12);
        yPos += 8;
        
        observaciones.forEach((obs: any) => {
          const fecha = new Date(obs.fecha).toLocaleString();
          doc.text(`${fecha}:`, 14, yPos);
          yPos += 6;
          
          // Split long text into multiple lines
          const splitText = doc.splitTextToSize(obs.observacion, 180);
          doc.text(splitText, 14, yPos);
          yPos += splitText.length * 6 + 4;
        });
      }
      
      // Tabla de ubicaciones (si hay espacio, sino en una nueva página)
      if (detalleData.ubicaciones &&
          ((detalleData.ubicaciones.ubicacionesDirectas && detalleData.ubicaciones.ubicacionesDirectas.length > 0) ||
           (detalleData.ubicaciones.ubicacionesRelacionadas && detalleData.ubicaciones.ubicacionesRelacionadas.length > 0))) {
        
        // Si no queda suficiente espacio, crear una nueva página
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }
        
        doc.setFontSize(14);
        doc.text("Ubicaciones", 14, yPos);
        yPos += 10;
        
        const ubicacionesData: any[][] = [];
        
        // Ubicaciones directas
        if (detalleData.ubicaciones.ubicacionesDirectas) {
          detalleData.ubicaciones.ubicacionesDirectas.forEach((ubicacion: Ubicacion) => {
            ubicacionesData.push([
              ubicacion.tipo,
              `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}`,
              ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada",
              "Directa",
              ubicacion.observaciones || ""
            ]);
          });
        }
        
        // Ubicaciones relacionadas
        if (detalleData.ubicaciones.ubicacionesRelacionadas) {
          detalleData.ubicaciones.ubicacionesRelacionadas.forEach((item: any) => {
            const relacion = item.entidadRelacionada.relacionadoCon 
              ? `${item.entidadRelacionada.tipo.toUpperCase()} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
              : item.entidadRelacionada.tipo.toUpperCase();
              
            ubicacionesData.push([
              item.ubicacion.tipo,
              `${item.ubicacion.latitud.toFixed(6)}, ${item.ubicacion.longitud.toFixed(6)}`,
              item.ubicacion.fecha ? new Date(item.ubicacion.fecha).toLocaleString() : "No registrada",
              relacion,
              item.ubicacion.observaciones || ""
            ]);
          });
        }
        
        autoTable(doc, {
          head: [["Tipo", "Coordenadas", "Fecha", "Relación", "Observaciones"]],
          body: ubicacionesData,
          startY: yPos,
          margin: { top: 10 },
          styles: { overflow: 'linebreak' },
          headStyles: { fillColor: [142, 68, 173] },
        });
      }
      
      // Guardar el PDF
      const fileName = `informe_${entidadSeleccionada.tipo}_${entidadSeleccionada.id}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF generado",
        description: `El documento "${fileName}" ha sido generado y descargado correctamente.`,
      });
      
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el documento PDF.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Limpiar resultados anteriores
      setResultadosBusqueda([]);
      setEntidadSeleccionada(null);
      setMarkdownContent("");
      
      console.log("Realizando búsqueda con parámetros:", 
                  `query=${searchTerm}&tipos=${getTiposSeleccionados().join("&tipos=")}`);
      
      // Ejecutar las consultas
      searchRefetch().then(result => {
        if (result.data) {
          console.log("Resultados de búsqueda:", result.data);
          console.log("Búsqueda completada:", result.data);
        }
      }).catch(error => {
        console.error("Error en la búsqueda:", error);
        toast({
          title: "Error en la búsqueda",
          description: error.message || "Ocurrió un error al realizar la búsqueda.",
          variant: "destructive",
        });
      });
      
      ubicacionesRefetch();
    } else {
      toast({
        title: "Término de búsqueda requerido",
        description: "Por favor ingrese un término para realizar la búsqueda.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const seleccionarEntidad = async (resultado: SearchResult) => {
    // Limpiar estados anteriores
    setObservacionesPersona([]);
    setObservacionesVehiculo([]);
    setObservacionesInmueble([]);
    setEntidadSeleccionada(resultado);
    
    try {
      // Obtener observaciones según el tipo de entidad
      if (resultado.tipo === "persona") {
        const res = await fetch(`/api/personas/${resultado.id}/observaciones`);
        const data = await res.json();
        setObservacionesPersona(data);
        console.log("Observaciones de persona:", data);
      } else if (resultado.tipo === "vehiculo") {
        const res = await fetch(`/api/vehiculos/${resultado.id}/observaciones`);
        const data = await res.json();
        setObservacionesVehiculo(data);
        console.log("Observaciones de vehículo:", data);
      } else if (resultado.tipo === "inmueble") {
        const res = await fetch(`/api/inmuebles/${resultado.id}/observaciones`);
        const data = await res.json();
        setObservacionesInmueble(data);
        console.log("Observaciones de inmueble:", data);
      }
      
      // Refrescar la consulta de detalles
      await detalleRefetch();
      
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al obtener los detalles del registro seleccionado.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Estructura de Relaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Formulario de búsqueda */}
            <div className="mb-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow">
                    <Input
                      type="text"
                      placeholder="Buscar por nombre, identificación, placa, etc."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <div>
                    <Button onClick={handleSearch} className="w-full md:w-auto">
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-personas" 
                      checked={tiposFiltro.personas}
                      onCheckedChange={(checked) => 
                        setTiposFiltro({...tiposFiltro, personas: checked as boolean})
                      }
                    />
                    <Label htmlFor="filter-personas" className="flex items-center">
                      <User className="h-4 w-4 mr-1" /> Personas
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-vehiculos" 
                      checked={tiposFiltro.vehiculos}
                      onCheckedChange={(checked) => 
                        setTiposFiltro({...tiposFiltro, vehiculos: checked as boolean})
                      }
                    />
                    <Label htmlFor="filter-vehiculos" className="flex items-center">
                      <Car className="h-4 w-4 mr-1" /> Vehículos
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-inmuebles" 
                      checked={tiposFiltro.inmuebles}
                      onCheckedChange={(checked) => 
                        setTiposFiltro({...tiposFiltro, inmuebles: checked as boolean})
                      }
                    />
                    <Label htmlFor="filter-inmuebles" className="flex items-center">
                      <Home className="h-4 w-4 mr-1" /> Inmuebles
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-ubicaciones" 
                      checked={tiposFiltro.ubicaciones}
                      onCheckedChange={(checked) => 
                        setTiposFiltro({...tiposFiltro, ubicaciones: checked as boolean})
                      }
                    />
                    <Label htmlFor="filter-ubicaciones" className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" /> Ubicaciones
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de carga */}
            {(searchLoading || ubicacionesLoading || detalleLoading) && (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Cargando resultados...</p>
              </div>
            )}

            {/* Lista de resultados de búsqueda */}
            {!searchLoading && !detalleLoading && resultadosBusqueda.length > 0 && !entidadSeleccionada && (
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Resultados de búsqueda</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {resultadosBusqueda.map((resultado) => (
                    <div 
                      key={`${resultado.tipo}-${resultado.id}`}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => seleccionarEntidad(resultado)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {resultado.tipo === "persona" && <User className="h-5 w-5 text-blue-500" />}
                          {resultado.tipo === "vehiculo" && <Car className="h-5 w-5 text-green-500" />}
                          {resultado.tipo === "inmueble" && <Home className="h-5 w-5 text-yellow-500" />}
                          {resultado.tipo === "ubicacion" && <MapPin className="h-5 w-5 text-purple-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{resultado.nombre}</p>
                          <p className="text-sm text-gray-500">{resultado.descripcion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje de no resultados */}
            {!searchLoading && !detalleLoading && resultadosBusqueda.length === 0 && searchTerm && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-medium text-gray-700">No se encontraron resultados</h3>
                <p className="text-gray-500 mt-1">Intente con otros términos de búsqueda</p>
              </div>
            )}

            {/* Visualización de la información detallada en Markdown */}
            {entidadSeleccionada && markdownContent && (
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Información detallada
                  </h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEntidadSeleccionada(null)}>
                      Volver a resultados
                    </Button>
                    <Button variant="outline" size="sm" onClick={generarPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar a PDF
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Contenedor principal */}
                  <div className="flex flex-col space-y-6">
                    
                    {/* Contenido principal en Markdown */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h2 className="text-xl font-medium text-gray-900">Información Detallada</h2>
                      </div>
                      <div className="p-6">
                        <div className="prose prose-blue max-w-none">
                          <ReactMarkdown>
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mapa y Tabla de ubicaciones */}
                    <div id="ubicaciones-container" className="border rounded-lg overflow-hidden">
                      {detalleData && detalleData.ubicaciones && (
                        <>
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h2 className="text-xl font-medium text-gray-900">Mapa y Ubicaciones</h2>
                          </div>
                          <div className="p-4">
                            {entidadSeleccionada && detalleData ? (
                              <MapaTablaUbicaciones 
                                entidadSeleccionada={entidadSeleccionada}
                                detalleData={detalleData}
                              />
                            ) : (
                              <div className="text-center p-4">
                                <p className="text-gray-500">No hay ubicaciones registradas para esta entidad.</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mapa de ubicaciones general (si hay resultados de búsqueda que incluyen ubicaciones) */}
            {!entidadSeleccionada && ubicacionesData && 
             ubicacionesData.ubicacionesDirectas && ubicacionesData.ubicacionesRelacionadas &&
             (ubicacionesData.ubicacionesDirectas.length > 0 || ubicacionesData.ubicacionesRelacionadas.length > 0) && (
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Ubicaciones encontradas</h3>
                </div>
                <div className="p-4">
                  {/* Mapa */}
                  <div className="mb-4 h-96 border rounded">
                    <div style={{ height: '100%', width: '100%' }}>
                      {/* Importamos este componente nuevamente para esta vista */}
                      {React.createElement(
                        require('@/components/mapa-ubicaciones').default, 
                        { 
                          ubicacionesDirectas: ubicacionesData.ubicacionesDirectas, 
                          ubicacionesRelacionadas: ubicacionesData.ubicacionesRelacionadas
                        }
                      )}
                    </div>
                  </div>
                  
                  {/* Tabla de ubicaciones */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relación</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ubicacionesData.ubicacionesDirectas.map((ubicacion) => (
                          <tr key={`directa-${ubicacion.id}`}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ubicacion.tipo}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Directa</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{ubicacion.observaciones || ""}</td>
                          </tr>
                        ))}
                        {ubicacionesData.ubicacionesRelacionadas.map((item, index) => (
                          <tr key={`relacionada-${index}`}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.ubicacion.tipo}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.ubicacion.latitud.toFixed(6)}, {item.ubicacion.longitud.toFixed(6)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.ubicacion.fecha ? new Date(item.ubicacion.fecha).toLocaleString() : "No registrada"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.entidadRelacionada.relacionadoCon 
                                ? `${item.entidadRelacionada.tipo.toUpperCase()} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
                                : item.entidadRelacionada.tipo.toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.ubicacion.observaciones || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}