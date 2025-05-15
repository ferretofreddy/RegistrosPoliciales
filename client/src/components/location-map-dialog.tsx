import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLocation?: {lat: number, lng: number} | null;
  title?: string;
}

export default function LocationMapDialog({
  open,
  onOpenChange,
  onSelectLocation,
  initialLocation,
  title = "Seleccionar ubicación",
}: LocationMapDialogProps) {
  // Default location (Costa Rica)
  const defaultLat = initialLocation?.lat || 9.748917;
  const defaultLng = initialLocation?.lng || -83.753428;
  
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    initialLocation || null
  );
  
  const { toast } = useToast();
  
  // Actualiza el estado cuando cambian las props
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);
  
  // Construir URL para el iframe de OpenStreetMap
  const getOsmUrl = () => {
    const zoom = 13;
    const lat = selectedLocation?.lat || defaultLat;
    const lng = selectedLocation?.lng || defaultLng;
    
    // URL for iframe that allows clicking and shows marker
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02}%2C${lat-0.02}%2C${lng+0.02}%2C${lat+0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
  };
  
  // Función para manejar la selección de ubicación desde el iframe
  const handleMessage = (event: MessageEvent) => {
    // Validación básica del mensaje (pueden agregar más seguridad si es necesario)
    if (event.data && event.data.type === "map-click") {
      const { lat, lng } = event.data;
      setSelectedLocation({ lat, lng });
    }
  };
  
  // Agregar y remover el listener de mensaje
  useEffect(() => {
    if (open) {
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [open]);
  
  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation.lat, selectedLocation.lng);
      onOpenChange(false);
      toast({
        title: "Ubicación seleccionada",
        description: `Latitud: ${selectedLocation.lat.toFixed(6)}, Longitud: ${selectedLocation.lng.toFixed(6)}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor, selecciona una ubicación",
        variant: "destructive",
      });
    }
  };
  
  // Para seleccionar una ubicación, el usuario tendrá que usar la URL completa en una pestaña nueva
  const handleOpenFullMap = () => {
    const lat = selectedLocation?.lat || defaultLat;
    const lng = selectedLocation?.lng || defaultLng;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, '_blank');
  };
  
  // Cuando el usuario vuelve después de seleccionar en el mapa externo
  const handleSelectCoordinates = () => {
    const latStr = prompt("Ingrese la latitud (ejemplo: 9.748917):", selectedLocation?.lat.toString() || defaultLat.toString());
    const lngStr = prompt("Ingrese la longitud (ejemplo: -83.753428):", selectedLocation?.lng.toString() || defaultLng.toString());
    
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({ lat, lng });
      } else {
        toast({
          title: "Formato incorrecto",
          description: "Por favor ingrese números válidos para latitud y longitud",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col" 
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Visualiza el mapa e ingresa las coordenadas manualmente o abre el mapa completo.
          </DialogDescription>
        </DialogHeader>
        
        {/* Vista previa del mapa (no interactiva) */}
        <div className="w-full h-[400px] rounded-md border border-border my-4 bg-gray-100 overflow-hidden">
          <iframe 
            title="OpenStreetMap" 
            width="100%" 
            height="100%" 
            src={getOsmUrl()}
            style={{ border: "none" }}
            allowFullScreen
          />
        </div>
        
        {/* Acciones adicionales */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={handleOpenFullMap} type="button">
            <MapPin className="h-4 w-4 mr-2" />
            Abrir mapa completo
          </Button>
          <Button variant="outline" onClick={handleSelectCoordinates} type="button">
            Ingresar coordenadas manualmente
          </Button>
        </div>
        
        <div className="mt-2 text-sm text-muted-foreground">
          {selectedLocation ? (
            <p>Ubicación seleccionada: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          ) : (
            <p>No se ha seleccionado ninguna ubicación.</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            Confirmar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}