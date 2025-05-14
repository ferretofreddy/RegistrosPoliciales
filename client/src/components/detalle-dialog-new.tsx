import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Home, User, MapPin } from "lucide-react";
import { Persona, Vehiculo, Inmueble, Ubicacion } from "@shared/schema";
import PdfExport from "@/components/pdf-export";
import { useQuery } from "@tanstack/react-query";

interface DetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "persona" | "vehiculo" | "inmueble" | "ubicacion";
  dato: Persona | Vehiculo | Inmueble | Ubicacion | null;
}

export default function DetalleDialog({
  open,
  onOpenChange,
  tipo,
  dato,
}: DetalleDialogProps) {
  // Si no hay datos o el diálogo no está abierto, no renderizamos nada
  if (!dato || !open) return null;

  // Valores por defecto
  let icon = <User className="h-6 w-6 text-gray-500" />;
  let color = "bg-gray-100";
  let titulo = "Detalles";
  let contenido: React.ReactNode = <p>No hay datos disponibles</p>;

  // Procesamos el contenido según el tipo de dato
  if (tipo === "persona") {
    const persona = dato as Persona;
    icon = <User className="h-6 w-6 text-blue-500" />;
    color = "bg-blue-100";
    titulo = persona.nombre || "Persona";
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Identificación</p>
            <p>{persona.identificacion || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Teléfonos</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.telefonos && persona.telefonos.length > 0 ? (
                persona.telefonos.map((telefono, index) => (
                  <Badge key={index} variant="outline">{telefono}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin teléfonos</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Domicilios</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.domicilios && persona.domicilios.length > 0 ? (
                persona.domicilios.map((domicilio, index) => (
                  <Badge key={index} variant="outline">{domicilio}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin domicilios</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Alias</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.alias && persona.alias.length > 0 ? (
                persona.alias.map((alias, index) => (
                  <Badge key={index} variant="outline">{alias}</Badge>
                ))
              ) : (
                <span className="text-gray-500">Sin alias</span>
              )}
            </div>
          </div>
        </div>
        {persona.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{persona.observaciones}</p>
          </div>
        )}
      </>
    );
  } 
  else if (tipo === "vehiculo") {
    const vehiculo = dato as Vehiculo;
    icon = <Car className="h-6 w-6 text-green-500" />;
    color = "bg-green-100";
    titulo = `${vehiculo.marca || ""} ${vehiculo.placa || ""}`;
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{vehiculo.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Color</p>
            <p>{vehiculo.color || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Modelo</p>
            <p>{vehiculo.modelo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Placa</p>
            <p>{vehiculo.placa || "No disponible"}</p>
          </div>
        </div>
        {vehiculo.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{vehiculo.observaciones}</p>
          </div>
        )}
      </>
    );
  }
  else if (tipo === "inmueble") {
    const inmueble = dato as Inmueble;
    icon = <Home className="h-6 w-6 text-purple-500" />;
    color = "bg-purple-100";
    titulo = inmueble.direccion || "Inmueble";
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{inmueble.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Propietario</p>
            <p>{inmueble.propietario || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Dirección</p>
            <p>{inmueble.direccion || "No disponible"}</p>
          </div>
        </div>
        {inmueble.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{inmueble.observaciones}</p>
          </div>
        )}
      </>
    );
  }
  else if (tipo === "ubicacion") {
    const ubicacion = dato as Ubicacion;
    icon = <MapPin className="h-6 w-6 text-amber-500" />;
    color = "bg-amber-100";
    titulo = `Ubicación ${ubicacion.tipo || ""}`;
    contenido = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Tipo</p>
            <p>{ubicacion.tipo || "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Fecha</p>
            <p>{ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No disponible"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Coordenadas</p>
            <p>Lat: {ubicacion.latitud}, Long: {ubicacion.longitud}</p>
          </div>
        </div>
        {ubicacion.observaciones && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{ubicacion.observaciones}</p>
          </div>
        )}
      </>
    );
  }

  // Obtener relaciones del elemento seleccionado
  const { data: relaciones } = useQuery({
    queryKey: [`/api/relaciones/${tipo}/${dato?.id}`],
    queryFn: async () => {
      if (!dato) return null;
      const res = await fetch(`/api/relaciones/${tipo}/${dato.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!dato?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className={`rounded-full p-2 ${color} w-fit mb-2`}>
            {icon}
          </div>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Información detallada
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{contenido}</div>
        <DialogFooter className="flex justify-between">
          <PdfExport 
            data={{
              tipo, 
              item: dato,
              relaciones: relaciones || undefined
            }} 
          />
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}