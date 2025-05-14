import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
    toast({
      title: "Función no disponible",
      description: "La exportación a PDF no está disponible en este momento.",
      variant: "destructive",
    });
  };

  return (
    <Button onClick={generatePdf} variant="secondary">
      <FileText className="mr-2 h-4 w-4" />
      Exportar a PDF
    </Button>
  );
}