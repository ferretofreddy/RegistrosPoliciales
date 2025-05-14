import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import "jspdf-autotable";

// Extensión de tipos para jsPDF con autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
    // Este archivo está obsoleto, use pdf-export-new.tsx en su lugar
    console.warn("PDF Export: Usando versión obsoleta");
    
    const { tipo, item } = data;
    
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
    
    // Tablas de información según el tipo de registro
    switch (tipo) {
      case "persona": {
        const persona = item as Persona;
        // Datos básicos
        const basicData = [
          ["Nombre", persona.nombre],
          ["Identificación", persona.identificacion],
          ["Observaciones", persona.observaciones || "Sin observaciones"],
        ];
        
        doc.autoTable({
          startY: y,
          head: [["Campo", "Valor"]],
          body: basicData,
          theme: "striped",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { top: 10 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
        
        // Múltiples valores (alias, teléfonos, domicilios)
        if (persona.alias && persona.alias.length > 0) {
          doc.setFontSize(14);
          doc.text("Alias conocidos", 14, y);
          y += 7;
          
          const aliasData = persona.alias.map(alias => [alias]);
          doc.autoTable({
            startY: y,
            head: [["Alias"]],
            body: aliasData,
            theme: "grid",
            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            margin: { top: 5 },
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
        
        if (persona.telefonos && persona.telefonos.length > 0) {
          doc.setFontSize(14);
          doc.text("Teléfonos registrados", 14, y);
          y += 7;
          
          const telefonosData = persona.telefonos.map(telefono => [telefono]);
          doc.autoTable({
            startY: y,
            head: [["Número de teléfono"]],
            body: telefonosData,
            theme: "grid",
            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            margin: { top: 5 },
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
        
        if (persona.domicilios && persona.domicilios.length > 0) {
          doc.setFontSize(14);
          doc.text("Domicilios conocidos", 14, y);
          y += 7;
          
          const domiciliosData = persona.domicilios.map(domicilio => [domicilio]);
          doc.autoTable({
            startY: y,
            head: [["Dirección"]],
            body: domiciliosData,
            theme: "grid",
            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            margin: { top: 5 },
          });
          
          y = (doc as any).lastAutoTable.finalY + 10;
        }
        break;
      }
      
      case "vehiculo": {
        const vehiculo = item as Vehiculo;
        const vehiculoData = [
          ["Marca", vehiculo.marca],
          ["Tipo", vehiculo.tipo],
          ["Placa", vehiculo.placa],
          ["Color", vehiculo.color],
          ["Modelo", vehiculo.modelo || "No especificado"],
          ["Observaciones", vehiculo.observaciones || "Sin observaciones"],
        ];
        
        doc.autoTable({
          startY: y,
          head: [["Campo", "Valor"]],
          body: vehiculoData,
          theme: "striped",
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          margin: { top: 10 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
        break;
      }
      
      case "inmueble": {
        const inmueble = item as Inmueble;
        const inmuebleData = [
          ["Tipo", inmueble.tipo],
          ["Propietario", inmueble.propietario],
          ["Dirección", inmueble.direccion],
          ["Observaciones", inmueble.observaciones || "Sin observaciones"],
        ];
        
        doc.autoTable({
          startY: y,
          head: [["Campo", "Valor"]],
          body: inmuebleData,
          theme: "striped",
          headStyles: { fillColor: [155, 89, 182], textColor: 255 },
          margin: { top: 10 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
        break;
      }
      
      case "ubicacion": {
        const ubicacion = item as Ubicacion;
        const ubicacionData = [
          ["Tipo", ubicacion.tipo],
          ["Latitud", ubicacion.latitud.toString()],
          ["Longitud", ubicacion.longitud.toString()],
          ["Fecha", new Date(ubicacion.fecha).toLocaleString()],
          ["Observaciones", ubicacion.observaciones || "Sin observaciones"],
        ];
        
        doc.autoTable({
          startY: y,
          head: [["Campo", "Valor"]],
          body: ubicacionData,
          theme: "striped",
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          margin: { top: 10 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
        break;
      }
    }
    
    // Información sobre relaciones
    if (relaciones) {
      // Sección de personas relacionadas
      if (relaciones.personas && relaciones.personas.length > 0) {
        // Verificar si hay suficiente espacio, sino añadir nueva página
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(16);
        doc.text("Personas relacionadas", 14, y);
        y += 10;
        
        const personasData = relaciones.personas.map(p => [
          p.nombre,
          p.identificacion,
          p.alias?.join(", ") || "Sin alias"
        ]);
        
        doc.autoTable({
          startY: y,
          head: [["Nombre", "Identificación", "Alias"]],
          body: personasData,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { top: 5 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Sección de vehículos relacionados
      if (relaciones.vehiculos && relaciones.vehiculos.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(16);
        doc.text("Vehículos relacionados", 14, y);
        y += 10;
        
        const vehiculosData = relaciones.vehiculos.map(v => [
          v.marca,
          v.placa,
          v.color,
          v.tipo
        ]);
        
        doc.autoTable({
          startY: y,
          head: [["Marca", "Placa", "Color", "Tipo"]],
          body: vehiculosData,
          theme: "grid",
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          margin: { top: 5 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Sección de inmuebles relacionados
      if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(16);
        doc.text("Inmuebles relacionados", 14, y);
        y += 10;
        
        const inmueblesData = relaciones.inmuebles.map(i => [
          i.tipo,
          i.propietario,
          i.direccion
        ]);
        
        doc.autoTable({
          startY: y,
          head: [["Tipo", "Propietario", "Dirección"]],
          body: inmueblesData,
          theme: "grid",
          headStyles: { fillColor: [155, 89, 182], textColor: 255 },
          margin: { top: 5 },
        });
        
        y = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Sección de ubicaciones relacionadas
      if (relaciones.ubicaciones && relaciones.ubicaciones.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(16);
        doc.text("Ubicaciones relacionadas", 14, y);
        y += 10;
        
        const ubicacionesData = relaciones.ubicaciones.map(u => [
          u.tipo,
          `${u.latitud}, ${u.longitud}`,
          new Date(u.fecha).toLocaleDateString()
        ]);
        
        doc.autoTable({
          startY: y,
          head: [["Tipo", "Coordenadas", "Fecha"]],
          body: ubicacionesData,
          theme: "grid",
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          margin: { top: 5 },
        });
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
        fileName = `persona_${(item as Persona).nombre.replace(/\s+/g, "_")}.pdf`;
        break;
      case "vehiculo":
        fileName = `vehiculo_${(item as Vehiculo).placa.replace(/\s+/g, "_")}.pdf`;
        break;
      case "inmueble":
        fileName = `inmueble_${(item as Inmueble).direccion.substring(0, 15).replace(/\s+/g, "_")}.pdf`;
        break;
      case "ubicacion":
        fileName = `ubicacion_${item.id}.pdf`;
        break;
    }
    
    // Guardar PDF
    doc.save(fileName);
  };

  return (
    <Button onClick={generatePdf} variant="secondary">
      <FileText className="mr-2 h-4 w-4" />
      Exportar a PDF
    </Button>
  );
}