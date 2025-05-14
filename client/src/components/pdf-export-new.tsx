import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import "jspdf-autotable";

interface PdfExportProps {
  data: {
    tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion";
    item: Persona | Vehiculo | Inmueble | Ubicacion;
    relaciones?: {
      personas?: Persona[];
      vehiculos?: Vehiculo[];
      inmuebles?: Inmueble[];
      ubicaciones?: Ubicacion[];
    };
  };
}

export default function PdfExport({ data }: PdfExportProps) {
  const { toast } = useToast();
  
  const generatePdf = () => {
    try {
      // Crear documento PDF
      const doc = new jsPDF();
      const { tipo, item, relaciones } = data;
      
      // Configuración del documento
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      
      // Título del documento basado en el tipo de registro
      let title = "";
      switch (tipo) {
        case "persona":
          title = `Informe de Persona: ${(item as Persona).nombre}`;
          break;
        case "vehiculo":
          title = `Informe de Vehículo: ${(item as Vehiculo).marca} ${(item as Vehiculo).placa}`;
          break;
        case "inmueble":
          title = `Informe de Inmueble: ${(item as Inmueble).direccion}`;
          break;
        case "ubicacion":
          title = `Informe de Ubicación #${item.id}`;
          break;
      }
      
      doc.text(title, 14, 22);
      doc.setFontSize(12);
      doc.text(`Fecha del informe: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.setLineWidth(0.5);
      doc.line(14, 35, 196, 35);
      
      let y = 45;
      
      // Información detallada del registro
      doc.setFontSize(16);
      doc.text("Información General", 14, y);
      
      y += 10;
      
      // Detalles básicos de la entidad principal
      if (tipo === "persona") {
        const persona = item as Persona;
        doc.setFontSize(14);
        doc.text("Información de persona", 14, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text(`Nombre: ${persona.nombre}`, 14, y);
        y += 7;
        doc.text(`Identificación: ${persona.identificacion}`, 14, y);
        y += 7;
        
        if (persona.alias && persona.alias.length > 0) {
          doc.text(`Alias: ${persona.alias.join(", ")}`, 14, y);
          y += 7;
        }
        
        if (persona.telefonos && persona.telefonos.length > 0) {
          doc.text(`Teléfonos: ${persona.telefonos.join(", ")}`, 14, y);
          y += 7;
        }
        
        if (persona.domicilios && persona.domicilios.length > 0) {
          doc.text(`Domicilios: ${persona.domicilios.join(", ")}`, 14, y);
          y += 7;
        }
        
        if (persona.observaciones) {
          doc.text("Observaciones:", 14, y);
          y += 7;
          doc.text(persona.observaciones, 20, y);
          y += 10;
        }
      } 
      else if (tipo === "vehiculo") {
        const vehiculo = item as Vehiculo;
        doc.setFontSize(14);
        doc.text("Información de vehículo", 14, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text(`Marca: ${vehiculo.marca}`, 14, y);
        y += 7;
        doc.text(`Tipo: ${vehiculo.tipo}`, 14, y);
        y += 7;
        doc.text(`Placa: ${vehiculo.placa}`, 14, y);
        y += 7;
        doc.text(`Color: ${vehiculo.color}`, 14, y);
        y += 7;
        
        if (vehiculo.modelo) {
          doc.text(`Modelo: ${vehiculo.modelo}`, 14, y);
          y += 7;
        }
        
        if (vehiculo.observaciones) {
          doc.text("Observaciones:", 14, y);
          y += 7;
          doc.text(vehiculo.observaciones, 20, y);
          y += 10;
        }
      }
      else if (tipo === "inmueble") {
        const inmueble = item as Inmueble;
        doc.setFontSize(14);
        doc.text("Información de inmueble", 14, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text(`Tipo: ${inmueble.tipo}`, 14, y);
        y += 7;
        doc.text(`Propietario: ${inmueble.propietario}`, 14, y);
        y += 7;
        doc.text(`Dirección: ${inmueble.direccion}`, 14, y);
        y += 7;
        
        if (inmueble.observaciones) {
          doc.text("Observaciones:", 14, y);
          y += 7;
          doc.text(inmueble.observaciones, 20, y);
          y += 10;
        }
      }
      else if (tipo === "ubicacion") {
        const ubicacion = item as Ubicacion;
        doc.setFontSize(14);
        doc.text("Información de ubicación", 14, y);
        y += 10;
        
        doc.setFontSize(12);
        doc.text(`Tipo: ${ubicacion.tipo}`, 14, y);
        y += 7;
        doc.text(`Coordenadas: ${ubicacion.latitud}, ${ubicacion.longitud}`, 14, y);
        y += 7;
        doc.text(`Fecha: ${new Date(ubicacion.fecha).toLocaleDateString()}`, 14, y);
        y += 7;
        
        if (ubicacion.observaciones) {
          doc.text("Observaciones:", 14, y);
          y += 7;
          doc.text(ubicacion.observaciones, 20, y);
          y += 10;
        }
      }
      
      // Información sobre relaciones
      if (relaciones) {
        y += 10;
        doc.setFontSize(16);
        doc.text("Entidades Relacionadas", 14, y);
        y += 10;
        
        // Sección de personas relacionadas
        if (relaciones.personas && relaciones.personas.length > 0) {
          doc.setFontSize(14);
          doc.text("Personas", 14, y);
          y += 7;
          
          relaciones.personas.forEach(persona => {
            doc.setFontSize(12);
            doc.text(`- ${persona.nombre} (${persona.identificacion})`, 20, y);
            y += 7;
          });
          
          y += 5;
        }
        
        // Sección de vehículos relacionados
        if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(14);
          doc.text("Vehículos", 14, y);
          y += 7;
          
          relaciones.vehiculos.forEach(vehiculo => {
            doc.setFontSize(12);
            doc.text(`- ${vehiculo.marca} ${vehiculo.modelo || ""} (${vehiculo.placa})`, 20, y);
            y += 7;
          });
          
          y += 5;
        }
        
        // Sección de inmuebles relacionados
        if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(14);
          doc.text("Inmuebles", 14, y);
          y += 7;
          
          relaciones.inmuebles.forEach(inmueble => {
            doc.setFontSize(12);
            doc.text(`- ${inmueble.tipo}: ${inmueble.direccion}`, 20, y);
            y += 7;
          });
          
          y += 5;
        }
        
        // Sección de ubicaciones relacionadas
        if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(14);
          doc.text("Ubicaciones", 14, y);
          y += 7;
          
          relaciones.ubicaciones.forEach(ubicacion => {
            doc.setFontSize(12);
            doc.text(`- ${ubicacion.tipo || "Ubicación"}: ${ubicacion.latitud}, ${ubicacion.longitud}`, 20, y);
            y += 7;
          });
        }
        
        // Si no hay relaciones, mostrar mensaje
        if ((!relaciones.personas || relaciones.personas.length === 0) &&
            (!relaciones.vehiculos || relaciones.vehiculos.length === 0) &&
            (!relaciones.inmuebles || relaciones.inmuebles.length === 0) &&
            (!relaciones.ubicaciones || relaciones.ubicaciones.length === 0)) {
          doc.setFontSize(12);
          doc.text("No hay entidades relacionadas con este registro", 20, y);
        }
      }
      
      // Agregar pie de página
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} - Informe generado por Registros Policiales`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      // Generar nombre de archivo
      let fileName = "";
      switch (tipo) {
        case "persona":
          fileName = `persona_${(item as Persona).identificacion.replace(/[^\w]/g, "_")}.pdf`;
          break;
        case "vehiculo":
          fileName = `vehiculo_${(item as Vehiculo).placa.replace(/[^\w]/g, "_")}.pdf`;
          break;
        case "inmueble":
          fileName = `inmueble_${item.id}.pdf`;
          break;
        case "ubicacion":
          fileName = `ubicacion_${item.id}.pdf`;
          break;
      }
      
      // Guardar PDF
      doc.save(fileName);
      
      toast({
        title: "PDF generado",
        description: `El archivo ${fileName} se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: "No se pudo generar el archivo PDF. Inténtelo nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={generatePdf} variant="secondary">
      <FileText className="mr-2 h-4 w-4" />
      Exportar a PDF
    </Button>
  );
}