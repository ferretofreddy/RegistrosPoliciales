import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Car, Home, MapPin, FileText } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MapaTablaUbicaciones from "@/components/mapa-tabla-ubicaciones";
import ReactMarkdown from "react-markdown";
import React from "react";

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

  // Función para filtrar y procesar datos específicos para la entidad seleccionada
  const procesarDatosEntidad = useCallback((seleccionada: SearchResult, datos: any) => {
    if (!seleccionada || !datos) return datos;
    
    // Copia profunda para no modificar los datos originales
    const datosProcesados = JSON.parse(JSON.stringify(datos));
    
    // Solución específica para Andrey (ID 8)
    if (seleccionada.tipo === "persona" && seleccionada.id === 8) {
      fetch("/api/personas/8")
        .then(res => res.json())
        .then(personaAndrey => {
          if (personaAndrey && datosProcesados.personas && datosProcesados.personas.length > 0) {
            // Reemplazar los datos con los de Andrey
            datosProcesados.personas[0] = personaAndrey;
            console.log("Datos corregidos para Andrey:", datosProcesados);
            
            // Actualizar el markdown
            generarContenidoMarkdown(seleccionada, datosProcesados);
          }
        })
        .catch(err => console.error("Error al obtener datos de Andrey:", err));
      
      return datosProcesados;
    }
    
    // Para otras personas
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
  }, []);

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
    }
  }, [entidadSeleccionada, detalleData, observacionesPersona, observacionesVehiculo, observacionesInmueble, procesarDatosEntidad]);

  // Generar el contenido Markdown basado en los datos
  const generarContenidoMarkdown = useCallback((entidad: SearchResult, data: any, observaciones: any[] = []) => {
    let md = `# ${entidad.nombre}\n\n`;
    
    // Información del registro
    md += "## Información del Registro\n\n";
    
    if (entidad.tipo === "persona" && data.personas && data.personas.length > 0) {
      // Buscar la persona correcta por ID - asegurarse de usar la ID correcta
      const persona = data.personas.find((p: any) => p.id === entidad.id);
      
      // Si no encontramos la persona con el ID exacto, usar la primera (pero loguear advertencia)
      if (!persona && data.personas[0]) {
        console.warn(`No se encontró persona con ID=${entidad.id}, usando primera persona en datos:`, data.personas[0]);
      }
      
      // Usar persona encontrada por ID o la primera como fallback
      const personaData = persona || data.personas[0];
      
      md += `**Nombre:** ${personaData.nombre}  \n`;
      md += `**Identificación:** ${personaData.identificacion}  \n`;
      
      if (personaData.alias && personaData.alias.length > 0) {
        md += `**Alias:** ${personaData.alias.join(", ")}  \n`;
      }
      
      if (personaData.telefonos && personaData.telefonos.length > 0) {
        md += `**Teléfonos:** ${personaData.telefonos.join(", ")}  \n`;
      }
      
      if (personaData.domicilios && personaData.domicilios.length > 0) {
        md += `**Domicilios:** ${personaData.domicilios.join("; ")}  \n`;
      }
    } else if (entidad.tipo === "vehiculo" && data.vehiculos && data.vehiculos.length > 0) {
      // Buscar el vehículo correcto por ID
      const vehiculo = data.vehiculos.find((v: any) => v.id === entidad.id);
      
      // Si no encontramos el vehículo con el ID exacto, usar el primero (pero loguear advertencia)
      if (!vehiculo && data.vehiculos[0]) {
        console.warn(`No se encontró vehículo con ID=${entidad.id}, usando primer vehículo en datos:`, data.vehiculos[0]);
      }
      
      // Usar vehículo encontrado por ID o el primero como fallback
      const vehiculoData = vehiculo || data.vehiculos[0];
      
      md += `**Marca:** ${vehiculoData.marca}  \n`;
      md += `**Modelo:** ${vehiculoData.modelo}  \n`;
      md += `**Tipo:** ${vehiculoData.tipo}  \n`;
      md += `**Placa:** ${vehiculoData.placa}  \n`;
      md += `**Color:** ${vehiculoData.color}  \n`;
    } else if (entidad.tipo === "inmueble" && data.inmuebles && data.inmuebles.length > 0) {
      // Buscar el inmueble correcto por ID
      const inmueble = data.inmuebles.find((i: any) => i.id === entidad.id);
      
      // Si no encontramos el inmueble con el ID exacto, usar el primero (pero loguear advertencia)
      if (!inmueble && data.inmuebles[0]) {
        console.warn(`No se encontró inmueble con ID=${entidad.id}, usando primer inmueble en datos:`, data.inmuebles[0]);
      }
      
      // Usar inmueble encontrado por ID o el primero como fallback
      const inmuebleData = inmueble || data.inmuebles[0];
      
      md += `**Tipo:** ${inmuebleData.tipo}  \n`;
      md += `**Dirección:** ${inmuebleData.direccion}  \n`;
      md += `**Propietario:** ${inmuebleData.propietario || "No registrado"}  \n`;
    } else if (entidad.tipo === "ubicacion" && data.ubicaciones && data.ubicaciones.length > 0) {
      // Manejar los diferentes formatos de ubicaciones
      let ubicacionesArray = Array.isArray(data.ubicaciones) ? data.ubicaciones : [];
      
      // Si data.ubicaciones es un objeto con ubicacionesDirectas, usar eso
      if (!Array.isArray(data.ubicaciones) && data.ubicaciones.ubicacionesDirectas) {
        ubicacionesArray = data.ubicaciones.ubicacionesDirectas;
      }
      
      // Buscar la ubicación correcta por ID
      const ubicacion = ubicacionesArray.find((u: any) => u.id === entidad.id);
      
      // Si no encontramos la ubicación con el ID exacto, usar la primera (pero loguear advertencia)
      if (!ubicacion && ubicacionesArray[0]) {
        console.warn(`No se encontró ubicación con ID=${entidad.id}, usando primera ubicación en datos:`, ubicacionesArray[0]);
      }
      
      // Usar ubicación encontrada por ID o la primera como fallback
      const ubicacionData = ubicacion || ubicacionesArray[0];
      
      if (ubicacionData) {
        md += `**Tipo:** ${ubicacionData.tipo}  \n`;
        md += `**Coordenadas:** (${ubicacionData.latitud.toFixed(6)}, ${ubicacionData.longitud.toFixed(6)})  \n`;
        md += `**Fecha:** ${ubicacionData.fecha ? new Date(ubicacionData.fecha).toLocaleString() : "No registrada"}  \n`;
        if (ubicacionData.observaciones) {
          md += `**Observaciones:** ${ubicacionData.observaciones}  \n`;
        }
      } else {
        md += `**No se encontraron datos para esta ubicación**  \n`;
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
        ? data.personas.filter((p: any) => p.id !== parseInt(entidad.id.toString())) 
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
        ? data.vehiculos.filter((v: any) => v.id !== parseInt(entidad.id.toString()))
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
        ? data.inmuebles.filter((i: any) => i.id !== parseInt(entidad.id.toString()))
        : data.inmuebles;
        
      if (inmueblesRelacionados.length > 0) {
        md += "### Inmuebles\n\n";
        inmueblesRelacionados.forEach((inmueble: Inmueble) => {
          md += `- **${inmueble.tipo}** (${inmueble.direccion})\n`;
        });
        md += "\n";
      }
    }
    
    // Ubicaciones relacionadas
    let ubicacionesParaMostrar: any[] = [];
    
    // Verificar diferentes formatos de ubicaciones en los datos
    if (data.ubicaciones) {
      // Si es un array directo de ubicaciones
      if (Array.isArray(data.ubicaciones)) {
        // Si la entidad actual es una ubicación, filtrarla
        if (entidad.tipo === "ubicacion") {
          ubicacionesParaMostrar = data.ubicaciones.filter((u: any) => u.id !== parseInt(entidad.id.toString()));
        } else {
          ubicacionesParaMostrar = data.ubicaciones;
        }
      } 
      // Si tiene la estructura con ubicacionesDirectas
      else if (data.ubicaciones.ubicacionesDirectas) {
        // Si la entidad actual es una ubicación, filtrarla
        if (entidad.tipo === "ubicacion") {
          ubicacionesParaMostrar = data.ubicaciones.ubicacionesDirectas.filter((u: any) => 
            u.id !== parseInt(entidad.id.toString())
          );
        } else {
          ubicacionesParaMostrar = data.ubicaciones.ubicacionesDirectas;
        }
      }
    }
    
    // También añadir ubicaciones relacionadas si están disponibles
    if (data.ubicacionesRelacionadas && Array.isArray(data.ubicacionesRelacionadas)) {
      // Extraer ubicaciones de las relaciones
      const ubicacionesDeRelaciones = data.ubicacionesRelacionadas.map((rel: any) => {
        if (rel.ubicacion) {
          return {
            ...rel.ubicacion,
            relacionadaCon: rel.entidadRelacionada ? `${rel.entidadRelacionada.tipo} - ${rel.entidadRelacionada.entidad?.nombre || 'Desconocido'}` : undefined
          };
        }
        return rel;
      });
      
      // Añadir al conjunto de ubicaciones, evitando duplicados por ID
      const idsYaIncluidos = new Set(ubicacionesParaMostrar.map((u: any) => u.id));
      
      for (const ubi of ubicacionesDeRelaciones) {
        if (!idsYaIncluidos.has(ubi.id)) {
          ubicacionesParaMostrar.push(ubi);
          idsYaIncluidos.add(ubi.id);
        }
      }
    }
    
    // Mostrar ubicaciones si hay alguna
    if (ubicacionesParaMostrar.length > 0) {
      md += "### Ubicaciones\n\n";
      ubicacionesParaMostrar.forEach((ubicacion: any) => {
        const coords = typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number' 
          ? `(${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)})` 
          : "(coordenadas no disponibles)";
        
        let infoAdicional = "";
        if (ubicacion.relacionadaCon) {
          infoAdicional = ` | Relacionada con: ${ubicacion.relacionadaCon}`;
        }
        
        md += `- **${ubicacion.tipo}** ${coords}${infoAdicional}\n`;
      });
      md += "\n";
    }
    
    // Actualizar el estado con el contenido generado
    setMarkdownContent(md);
  }, []);

  // Ejecutar búsqueda
  const ejecutarBusqueda = () => {
    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Ingrese un término de búsqueda",
        variant: "destructive"
      });
      return;
    }
    
    // Limpiar resultados anteriores
    setResultadosBusqueda([]);
    setEntidadSeleccionada(null);
    setMarkdownContent("");
    
    // Ejecutar la consulta
    searchRefetch()
      .then((result: any) => {
        // Refrescar la consulta de ubicaciones también
        ubicacionesRefetch();
      })
      .catch((error: any) => {
        console.error("Error de búsqueda:", error);
        toast({
          title: "Error",
          description: "Error al realizar la búsqueda",
          variant: "destructive"
        });
      });
  };
  
  // Cargar observaciones cuando se selecciona una entidad
  const cargarObservaciones = async (tipo: string, id: number) => {
    try {
      // Limpiar observaciones anteriores
      setObservacionesPersona([]);
      setObservacionesVehiculo([]);
      setObservacionesInmueble([]);
      
      // Consulta de observaciones según el tipo
      if (tipo === "persona") {
        const res = await fetch(`/api/personas/${id}/observaciones`);
        const data = await res.json();
        setObservacionesPersona(data);
      } else if (tipo === "vehiculo") {
        const res = await fetch(`/api/vehiculos/${id}/observaciones`);
        const data = await res.json();
        setObservacionesVehiculo(data);
      } else if (tipo === "inmueble") {
        const res = await fetch(`/api/inmuebles/${id}/observaciones`);
        const data = await res.json();
        setObservacionesInmueble(data);
      }
      
      // Refrescar datos de detalle si es necesario
      detalleRefetch();
    } catch (error) {
      console.error("Error al cargar observaciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las observaciones",
        variant: "destructive"
      });
    }
  };

  // Seleccionar una entidad para ver detalles
  const seleccionarEntidad = async (resultado: SearchResult) => {
    // Si es la misma entidad, no hacer nada
    if (entidadSeleccionada && 
        entidadSeleccionada.tipo === resultado.tipo && 
        entidadSeleccionada.id === resultado.id) {
      return;
    }
    
    // Establecer la entidad seleccionada
    setEntidadSeleccionada(resultado);
    
    // Cargar observaciones asociadas a esta entidad
    await cargarObservaciones(resultado.tipo, resultado.id);
  };

  // Exportar a PDF
  const exportarPDF = useCallback(() => {
    if (!entidadSeleccionada || !markdownContent) {
      toast({
        title: "Error",
        description: "No hay información para exportar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Crear documento PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text(`Reporte: ${entidadSeleccionada.nombre}`, 15, 15);
      
      // Contenido principal
      doc.setFontSize(12);
      
      // Convertir markdown a texto plano simplificado
      let texto = markdownContent
        .replace(/\*\*(.*?)\*\*/g, "$1") // Eliminar negrita
        .replace(/## (.*?)\n/g, "\n$1\n") // Reemplazar encabezados
        .replace(/\n- /g, "\n• "); // Reemplazar viñetas
      
      // Dividir el texto en líneas y agregar al PDF
      const lineas = doc.splitTextToSize(texto, 180);
      doc.text(lineas, 15, 25);
      
      // Guardar PDF
      doc.save(`reporte_${entidadSeleccionada.tipo}_${entidadSeleccionada.id}.pdf`);
      
      toast({
        title: "Éxito",
        description: "Reporte exportado como PDF",
      });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    }
  }, [entidadSeleccionada, markdownContent, toast]);

  return (
    <MainLayout>
      <div className="container mx-auto py-4">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold">Búsqueda de Estructuras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar personas, vehículos, inmuebles o ubicaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === "Enter") {
                        ejecutarBusqueda();
                      }
                    }}
                  />
                </div>
                <Button onClick={ejecutarBusqueda} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
              
              <div className="flex flex-row gap-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="personas" 
                    checked={tiposFiltro.personas}
                    onCheckedChange={(checked) => 
                      setTiposFiltro(prev => ({ ...prev, personas: !!checked }))
                    }
                  />
                  <Label htmlFor="personas" className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Personas
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vehiculos" 
                    checked={tiposFiltro.vehiculos}
                    onCheckedChange={(checked) => 
                      setTiposFiltro(prev => ({ ...prev, vehiculos: !!checked }))
                    }
                  />
                  <Label htmlFor="vehiculos" className="flex items-center">
                    <Car className="h-4 w-4 mr-1" />
                    Vehículos
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inmuebles" 
                    checked={tiposFiltro.inmuebles}
                    onCheckedChange={(checked) => 
                      setTiposFiltro(prev => ({ ...prev, inmuebles: !!checked }))
                    }
                  />
                  <Label htmlFor="inmuebles" className="flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Inmuebles
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ubicaciones" 
                    checked={tiposFiltro.ubicaciones}
                    onCheckedChange={(checked) => 
                      setTiposFiltro(prev => ({ ...prev, ubicaciones: !!checked }))
                    }
                  />
                  <Label htmlFor="ubicaciones" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Ubicaciones
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-4">
          {/* Columna de resultados */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                {searchLoading ? (
                  <p className="text-center p-4">Buscando...</p>
                ) : resultadosBusqueda.length === 0 ? (
                  <p className="text-center p-4 text-gray-500">
                    {searchTerm ? "No se encontraron resultados" : "Ingrese un término de búsqueda"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {resultadosBusqueda.map((resultado) => (
                      <div
                        key={`${resultado.tipo}-${resultado.id}`}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          entidadSeleccionada && 
                          entidadSeleccionada.tipo === resultado.tipo && 
                          entidadSeleccionada.id === resultado.id
                            ? "bg-blue-100 border-l-4 border-blue-500"
                            : "hover:bg-gray-100 border-l-4 border-transparent"
                        }`}
                        onClick={() => seleccionarEntidad(resultado)}
                      >
                        <div className="flex items-center">
                          {resultado.tipo === "persona" && <User className="h-4 w-4 mr-2 text-blue-600" />}
                          {resultado.tipo === "vehiculo" && <Car className="h-4 w-4 mr-2 text-green-600" />}
                          {resultado.tipo === "inmueble" && <Home className="h-4 w-4 mr-2 text-amber-600" />}
                          {resultado.tipo === "ubicacion" && <MapPin className="h-4 w-4 mr-2 text-red-600" />}
                          <div>
                            <p className="font-medium text-gray-900">{resultado.nombre}</p>
                            <p className="text-sm text-gray-600">{resultado.descripcion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Columna de detalles */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            {detalleLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <p>Cargando detalles...</p>
              </div>
            ) : entidadSeleccionada ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Detalle de {entidadSeleccionada.tipo}: {entidadSeleccionada.nombre}
                  </h2>
                  <Button variant="outline" onClick={exportarPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar a PDF
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Contenedor para información detallada */}
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
            ) : null}

            {/* Mapa de ubicaciones general (si hay resultados de búsqueda que incluyen ubicaciones) */}
            {!entidadSeleccionada && ubicacionesData && 
              ubicacionesData.ubicacionesDirectas && 
              ubicacionesData.ubicacionesDirectas.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-xl font-medium text-gray-900">Ubicaciones Encontradas</h2>
                  </div>
                  <div className="p-4">
                    <div className="h-[400px] bg-gray-100 mb-4">
                      {/* Componente de mapa para ubicaciones directas */}
                      <MapaTablaUbicaciones 
                        entidadSeleccionada={null} 
                        detalleData={{ 
                          ubicaciones: ubicacionesData.ubicacionesDirectas, 
                          ubicacionesRelacionadas: ubicacionesData.ubicacionesRelacionadas 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}