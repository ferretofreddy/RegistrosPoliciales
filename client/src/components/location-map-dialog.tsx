import React, { useEffect, useRef, useState } from 'react';
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

declare global {
  interface Window {
    L: any;
  }
}

export default function LocationMapDialog({
  open,
  onOpenChange,
  onSelectLocation,
  initialLocation = null,
  title = "Seleccionar ubicación en el mapa"
}: LocationMapDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(initialLocation);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(!!window.L);
  const { toast } = useToast();
  
  // Verificar si Leaflet está disponible (debería estarlo ya que se carga en el HTML)
  useEffect(() => {
    if (open) {
      console.log("Verificando disponibilidad de Leaflet...");
      
      if (window.L) {
        console.log("Leaflet disponible:", window.L);
        setLeafletLoaded(true);
        
        // Invalidar tamaño del mapa después de verificar
        setTimeout(() => {
          if (map) {
            console.log("Invalidando tamaño del mapa");
            map.invalidateSize();
          }
        }, 100);
      } else {
        console.error("ERROR: Leaflet no está disponible");
        toast({
          title: "Error",
          description: "No se pudo cargar el mapa. Por favor, recargue la página.",
          variant: "destructive",
        });
      }
    }
  }, [open, map]);
  
  // Inicializar el mapa
  useEffect(() => {
    if (!open || !mapRef.current) return;
    
    // Verificar disponibilidad de Leaflet
    if (!window.L) {
      console.error("LEAFLET NO DISPONIBLE");
      return;
    }
    
    console.log("INICIALIZANDO MAPA CON LEAFLET CARGADO:", window.L);
    console.log("Referencia al div:", mapRef.current);
    
    try {
      // Si ya hay un mapa, limpiarlo
      if (map) {
        console.log("Limpiando mapa anterior");
        map.remove();
      }
      
      // Inicializar con coordenadas default
      const defaultLat = 9.748917;
      const defaultLng = -83.753428;
      
      // Crear el mapa de forma simple para depurar
      console.log("Creando nuevo mapa");
      
      // Usar un timeout para dar tiempo al DOM a que se actualice
      setTimeout(() => {
        try {
          const newMap = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
          
          // Añadir capa de mapa base OpenStreetMap
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(newMap);
          
          // Añadir evento click al mapa simplificado
          newMap.on('click', function(e: any) {
            const { lat, lng } = e.latlng;
            console.log("Mapa clickeado en:", lat, lng);
            setSelectedLocation({lat, lng});
            
            // Crear un marcador simple
            if (marker) marker.remove();
            const newMarker = window.L.marker([lat, lng]).addTo(newMap);
            setMarker(newMarker);
          });
          
          setMap(newMap);
          console.log("Mapa creado y guardado en estado");
          
          // Invalidar tamaño después de un breve retraso
          setTimeout(() => {
            newMap.invalidateSize();
            console.log("Tamaño del mapa invalidado");
          }, 300);
        } catch (err) {
          console.error("Error al crear el mapa:", err);
          toast({
            title: "Error",
            description: "No se pudo inicializar el mapa: " + (err as Error).message,
            variant: "destructive",
          });
        }
      }, 300);
    } catch (err) {
      console.error("Error general del mapa:", err);
      toast({
        title: "Error",
        description: "Error al configurar el mapa: " + (err as Error).message,
        variant: "destructive",
      });
    }
    
    return () => {
      if (map) {
        console.log("Limpiando mapa al desmontar");
        map.remove();
      }
    };
  }, [open, map, toast]);
  
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
        description: "Por favor, selecciona una ubicación en el mapa",
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
            Haz clic en el mapa para seleccionar una ubicación, o arrastra el marcador para ajustar.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-md border border-red-500 my-4 bg-gray-100"
          style={{ position: 'relative', zIndex: 999 }}
        >
          {!map && (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4" />
                <p>Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-sm text-muted-foreground">
          {selectedLocation ? (
            <p>Ubicación seleccionada: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          ) : (
            <p>Ninguna ubicación seleccionada</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedLocation}>Confirmar ubicación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}