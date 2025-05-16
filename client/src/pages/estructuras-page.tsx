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
    } else if (entidad.tipo === "ubicacion" && data.ubicaciones) {
      // Manejar los diferentes formatos de ubicaciones
      let ubicacionesArray = Array.isArray(data.ubicaciones) ? data.ubicaciones : [];
      
      // Si data.ubicaciones es un objeto con ubicacionesDirectas, usar eso
      if (!Array.isArray(data.ubicaciones) && data.ubicaciones.ubicacionesDirectas) {
        ubicacionesArray = data.ubicaciones.ubicacionesDirectas;
      }
      
      // Buscar la ubicación correcta por ID
      const ubicacion = ubicacionesArray.find((u: any) => u.id === entidad.id);
      
      // Si no encontramos la ubicación con el ID exacto, usar la primera (pero loguear advertencia)
      if (!ubicacion && ubicacionesArray.length > 0) {
        console.warn(`No se encontró ubicación con ID=${entidad.id}, usando primera ubicación en datos:`, ubicacionesArray[0]);
      }
      
      // Usar ubicación encontrada por ID o la primera como fallback
      const ubicacionData = ubicacion || (ubicacionesArray.length > 0 ? ubicacionesArray[0] : null);
      
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
    
    // Observaciones
    if (observaciones && observaciones.length > 0) {
      md += "## Observaciones\n\n";
      observaciones.forEach(obs => {
        md += `### ${new Date(obs.fecha).toLocaleString()} | ${obs.usuario || "Sistema"}\n\n`;
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

  // Función para filtrar y procesar datos específicos para la entidad seleccionada
  const procesarDatosEntidad = useCallback((seleccionada: SearchResult, datos: any) => {
    if (!seleccionada || !datos) return datos;
    
    // Copia profunda para no modificar los datos originales
    const datosProcesados = JSON.parse(JSON.stringify(datos));
    
    // Para cada tipo de entidad, asegurarse que la entidad correcta esté en primer lugar
    if (seleccionada.tipo === "persona" && datosProcesados.personas && datosProcesados.personas.length > 0) {
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
  }, [entidadSeleccionada, detalleData, observacionesPersona, observacionesVehiculo, observacionesInmueble, procesarDatosEntidad, generarContenidoMarkdown]);

  // Realizar búsqueda
  const realizarBusqueda = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error de búsqueda",
        description: "Por favor, ingrese un término de búsqueda",
        variant: "destructive",
      });
      return;
    }
    
    setResultadosBusqueda([]);
    setEntidadSeleccionada(null);
    setMarkdownContent("");
    
    // Refrescar las búsquedas
    searchRefetch();
    
    // Buscar ubicaciones si el filtro está activo
    if (tiposFiltro.ubicaciones) {
      ubicacionesRefetch();
    }
  };

  // Seleccionar entidad para mostrar detalles
  const seleccionarEntidad = async (resultado: SearchResult) => {
    // Limpiar observaciones previas
    setObservacionesPersona([]);
    setObservacionesVehiculo([]);
    setObservacionesInmueble([]);
    
    // Cargar observaciones según el tipo de entidad
    if (resultado.tipo === "persona") {
      fetch(`/api/personas/${resultado.id}/observaciones`)
        .then(res => res.json())
        .then(data => setObservacionesPersona(data))
        .catch(err => console.error("Error al cargar observaciones de persona:", err));
    } else if (resultado.tipo === "vehiculo") {
      fetch(`/api/vehiculos/${resultado.id}/observaciones`)
        .then(res => res.json())
        .then(data => setObservacionesVehiculo(data))
        .catch(err => console.error("Error al cargar observaciones de vehículo:", err));
    } else if (resultado.tipo === "inmueble") {
      fetch(`/api/inmuebles/${resultado.id}/observaciones`)
        .then(res => res.json())
        .then(data => setObservacionesInmueble(data))
        .catch(err => console.error("Error al cargar observaciones de inmueble:", err));
    }
    
    // Actualizar entidad seleccionada (esto debe desencadenar la carga de sus relaciones)
    setEntidadSeleccionada(resultado);
    
    // Refetch detalleData
    detalleRefetch();
    
    // Mostrar toast de carga
    toast({
      title: "Cargando detalles",
      description: `Obteniendo información detallada para ${resultado.nombre}`,
    });
  };

  // Generar PDF
  const generarPDF = () => {
    try {
      if (!entidadSeleccionada) {
        toast({
          title: "Error",
          description: "No hay información seleccionada para exportar a PDF",
          variant: "destructive",
        });
        return;
      }
      
      // Crear el documento PDF
      const pdf = new jsPDF();
      
      // Configurar el título
      pdf.setFontSize(16);
      pdf.text(`Informe: ${entidadSeleccionada.nombre}`, 20, 20);
      
      // Convertir el contenido de markdown a texto plano básico
      const plainText = markdownContent
        .replace(/^# (.*)$/gm, '') // Quitar título principal (ya lo añadimos arriba)
        .replace(/^## (.*)$/gm, '\n$1\n') // Convertir encabezados nivel 2 en texto con subrayado
        .replace(/^### (.*)$/gm, '\n$1:') // Convertir encabezados nivel 3 en texto con dos puntos
        .replace(/^\*\*(.+?)\*\*:/gm, '$1:') // Convertir texto en negrita seguido de dos puntos
        .replace(/\*\*(.+?)\*\*/g, '$1') // Quitar resto de marcas de negrita
        .trim();
      
      // Añadir el texto
      pdf.setFontSize(12);
      
      // Usar autotable para crear una tabla sencilla con el contenido
      autoTable(pdf, {
        body: [
          [{ content: plainText, styles: { cellPadding: 5 } }],
        ],
        theme: 'plain',
        styles: { overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: { 0: { cellWidth: 170 } },
      });
      
      // Guardar el PDF
      pdf.save(`informe_${entidadSeleccionada.tipo}_${entidadSeleccionada.id}.pdf`);
      
      toast({
        title: "PDF generado",
        description: "El informe ha sido descargado correctamente",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Búsqueda de registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3">
                <div className="flex flex-col gap-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Buscar por nombre, identificación, placa, dirección..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && realizarBusqueda()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={realizarBusqueda} 
                      disabled={searchLoading} 
                      className="w-[140px]"
                    >
                      {searchLoading ? "Buscando..." : <><Search className="mr-2 h-4 w-4" /> Buscar</>}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="personas" 
                        checked={tiposFiltro.personas} 
                        onCheckedChange={(checked) => 
                          setTiposFiltro({...tiposFiltro, personas: !!checked})
                        } 
                      />
                      <Label htmlFor="personas" className="flex items-center text-sm">
                        <User className="mr-1 h-4 w-4" /> Personas
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vehiculos" 
                        checked={tiposFiltro.vehiculos} 
                        onCheckedChange={(checked) => 
                          setTiposFiltro({...tiposFiltro, vehiculos: !!checked})
                        } 
                      />
                      <Label htmlFor="vehiculos" className="flex items-center text-sm">
                        <Car className="mr-1 h-4 w-4" /> Vehículos
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inmuebles" 
                        checked={tiposFiltro.inmuebles} 
                        onCheckedChange={(checked) => 
                          setTiposFiltro({...tiposFiltro, inmuebles: !!checked})
                        } 
                      />
                      <Label htmlFor="inmuebles" className="flex items-center text-sm">
                        <Home className="mr-1 h-4 w-4" /> Inmuebles
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ubicaciones" 
                        checked={tiposFiltro.ubicaciones} 
                        onCheckedChange={(checked) => 
                          setTiposFiltro({...tiposFiltro, ubicaciones: !!checked})
                        } 
                      />
                      <Label htmlFor="ubicaciones" className="flex items-center text-sm">
                        <MapPin className="mr-1 h-4 w-4" /> Ubicaciones
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
          {/* Panel de resultados */}
          <Card className="h-[calc(100vh-248px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Resultados ({resultadosBusqueda.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
                </div>
              ) : resultadosBusqueda.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay resultados para mostrar</p>
                  <p className="text-xs">Intente una búsqueda diferente o utilice otros filtros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resultadosBusqueda.map((resultado) => (
                    <div 
                      key={`${resultado.tipo}-${resultado.id}`}
                      className={`p-3 rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-50 flex items-center ${
                        entidadSeleccionada?.id === resultado.id && entidadSeleccionada?.tipo === resultado.tipo
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                      onClick={() => seleccionarEntidad(resultado)}
                    >
                      {resultado.tipo === "persona" ? (
                        <User className="h-5 w-5 mr-2 text-blue-500" />
                      ) : resultado.tipo === "vehiculo" ? (
                        <Car className="h-5 w-5 mr-2 text-green-500" />
                      ) : resultado.tipo === "inmueble" ? (
                        <Home className="h-5 w-5 mr-2 text-amber-500" />
                      ) : (
                        <MapPin className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{resultado.nombre}</div>
                        <div className="text-xs text-gray-500">{resultado.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Panel de detalles */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 flex flex-row justify-between items-center">
                <CardTitle>Detalles</CardTitle>
                {entidadSeleccionada && (
                  <Button size="sm" variant="outline" onClick={generarPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar a PDF
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {detalleLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
                  </div>
                ) : !entidadSeleccionada ? (
                  <div className="text-center py-6 text-gray-500">
                    <div className="flex justify-center space-x-3 mb-3">
                      <User className="h-8 w-8 text-gray-400" />
                      <Car className="h-8 w-8 text-gray-400" />
                      <Home className="h-8 w-8 text-gray-400" />
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm">Seleccione un resultado para ver detalles</p>
                  </div>
                ) : (
                  <div className="prose max-w-none prose-blue">
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mapa de ubicaciones */}
            {entidadSeleccionada && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Ubicaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}