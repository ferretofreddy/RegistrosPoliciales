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
  
  const notifyFeatureRemoved = () => {
    toast({
      title: "Función eliminada",
      description: "La funcionalidad de exportación a PDF ha sido eliminada del sistema.",
      variant: "destructive",
    });
  };

  return (
    <Button onClick={notifyFeatureRemoved} variant="outline" disabled>
      <FileText className="mr-2 h-4 w-4" />
      Exportar a PDF (Deshabilitado)
    </Button>
  );
}