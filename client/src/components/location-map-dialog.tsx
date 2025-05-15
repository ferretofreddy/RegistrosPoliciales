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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowRight, Navigation } from "lucide-react";
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
  
  // Estado para el formulario
  const [latInput, setLatInput] = useState<string>(initialLocation?.lat.toString() || defaultLat.toString());
  const [lngInput, setLngInput] = useState<string>(initialLocation?.lng.toString() || defaultLng.toString());
  
  // Estado para la ubicación seleccionada
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number}>({
    lat: initialLocation?.lat || defaultLat, 
    lng: initialLocation?.lng || defaultLng
  });
  
  const { toast } = useToast();
  
  // Actualiza el estado cuando cambian las props
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setLatInput(initialLocation.lat.toString());
      setLngInput(initialLocation.lng.toString());
    }
  }, [initialLocation]);
  
  // Construir URL para el iframe de OpenStreetMap
  const getOsmUrl = () => {
    const lat = selectedLocation.lat || defaultLat;
    const lng = selectedLocation.lng || defaultLng;
    
    // URL for iframe that shows marker
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02}%2C${lat-0.02}%2C${lng+0.02}%2C${lat+0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
  };
  
  // Actualizar coordenadas al cambiar los inputs
  const updateCoordinates = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedLocation({ lat, lng });
    } else {
      toast({
        title: "Formato incorrecto",
        description: "Por favor ingrese números válidos para latitud y longitud",
        variant: "destructive",
      });
    }
  };
  
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
  
  // Para seleccionar una ubicación, el usuario tendrá que usar el mapa completo en una pestaña nueva
  const handleOpenFullMap = () => {
    const lat = selectedLocation.lat || defaultLat;
    const lng = selectedLocation.lng || defaultLng;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, '_blank');
  };
  
  // Obtener ubicación actual del navegador si está disponible
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          setLatInput(latitude.toString());
          setLngInput(longitude.toString());
          toast({
            title: "Ubicación actual detectada",
            description: `Latitud: ${latitude.toFixed(6)}, Longitud: ${longitude.toFixed(6)}`,
          });
        },
        (error) => {
          toast({
            title: "Error al obtener ubicación",
            description: `No se pudo obtener la ubicación actual: ${error.message}`,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocalización no soportada",
        description: "Su navegador no admite geolocalización",
        variant: "destructive",
      });
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
            Visualiza el mapa e ingresa las coordenadas manualmente o usa tu ubicación actual.
          </DialogDescription>
        </DialogHeader>
        
        {/* Vista previa del mapa (con iframe) */}
        <div className="w-full h-[350px] rounded-md border border-border my-4 bg-gray-100 overflow-hidden">
          <iframe 
            title="OpenStreetMap" 
            width="100%" 
            height="100%" 
            src={getOsmUrl()}
            style={{ border: "none" }}
            allowFullScreen
          />
        </div>
        
        {/* Entrada manual de coordenadas */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitud</Label>
            <div className="flex gap-2">
              <Input 
                id="latitude" 
                value={latInput} 
                onChange={(e) => setLatInput(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitud</Label>
            <div className="flex gap-2">
              <Input 
                id="longitude" 
                value={lngInput} 
                onChange={(e) => setLngInput(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex flex-wrap gap-2 mb-4 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGetCurrentLocation} type="button">
              <Navigation className="h-4 w-4 mr-2" />
              Usar mi ubicación actual
            </Button>
            <Button variant="outline" onClick={handleOpenFullMap} type="button">
              <MapPin className="h-4 w-4 mr-2" />
              Abrir mapa interactivo
            </Button>
          </div>
          <Button variant="secondary" onClick={updateCoordinates} type="button">
            <ArrowRight className="h-4 w-4 mr-2" />
            Actualizar mapa
          </Button>
        </div>
        
        {/* Coordenadas seleccionadas */}
        <div className="mt-2 text-sm border-t pt-4 border-border">
          <p><strong>Coordenadas seleccionadas:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}