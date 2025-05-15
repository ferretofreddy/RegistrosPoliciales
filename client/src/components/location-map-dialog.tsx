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
  
  // Cargar Leaflet si no está ya cargado
  useEffect(() => {
    if (!window.L && open) {
      console.log("Cargando Leaflet dinámicamente...");
      
      // Cargar CSS de Leaflet
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(linkElement);
      
      // Cargar JS de Leaflet
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      scriptElement.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      scriptElement.crossOrigin = "";
      document.body.appendChild(scriptElement);
      
      // Esperar a que se cargue el script
      scriptElement.onload = () => {
        console.log("Leaflet cargado correctamente");
        setLeafletLoaded(true);
        // Invalidar tamaño del mapa después de cargarlo
        if (map) {
          map.invalidateSize();
        }
      };
    } else if (window.L && !leafletLoaded) {
      // Si leaflet ya está disponible pero no lo habíamos marcado
      setLeafletLoaded(true);
    }
  }, [open, map, leafletLoaded]);
  
  // Inicializar el mapa
  useEffect(() => {
    if (!open || !mapRef.current || !leafletLoaded) return;
    
    // Si no está disponible Leaflet, salir (aunque leafletLoaded debería garantizar que está cargado)
    if (!window.L) {
      console.log("Esperando a que Leaflet se cargue...");
      return;
    }
    
    console.log("Inicializando mapa con Leaflet cargado...");
    
    // Si ya hay un mapa, limpiarlo
    if (map) {
      map.remove();
    }
    
    // Inicializar con coordenadas default
    const defaultLat = 9.748917;
    const defaultLng = -83.753428;
    
    const leaflet = window.L;
    if (!leaflet) {
      console.error("Leaflet not loaded");
      toast({
        title: "Error",
        description: "No se pudo cargar el mapa. Por favor, recargue la página.",
        variant: "destructive",
      });
      return;
    }
    
    // Crear el mapa
    const newMap = leaflet.map(mapRef.current).setView(
      initialLocation ? [initialLocation.lat, initialLocation.lng] : [defaultLat, defaultLng], 
      13
    );
    
    // Añadir capa de mapa base OpenStreetMap
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);
    
    // Añadir un marcador si ya hay una ubicación inicial
    let initialMarker = null;
    if (initialLocation) {
      initialMarker = leaflet.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true,
      }).addTo(newMap)
        .bindPopup('Ubicación seleccionada')
        .on('dragend', function(e: any) {
          const position = e.target.getLatLng();
          setSelectedLocation({
            lat: position.lat,
            lng: position.lng
          });
        });
    }
    
    // Añadir evento click al mapa
    newMap.on('click', function(e: any) {
      const { lat, lng } = e.latlng;
      
      // Si ya hay un marcador, actualizarlo
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else if (initialMarker) {
        initialMarker.setLatLng([lat, lng]);
      } else {
        // Crear un nuevo marcador
        const newMarker = leaflet.marker([lat, lng], {
          draggable: true,
        }).addTo(newMap)
          .bindPopup('Ubicación seleccionada')
          .on('dragend', function(e: any) {
            const position = e.target.getLatLng();
            setSelectedLocation({
              lat: position.lat,
              lng: position.lng
            });
          });
        
        setMarker(newMarker);
      }
      
      setSelectedLocation({
        lat: lat,
        lng: lng
      });
    });
    
    setMap(newMap);
    setMarker(initialMarker);
    
    // Actualizar el tamaño del mapa después de que el diálogo se muestre
    setTimeout(() => {
      newMap.invalidateSize();
    }, 100);
    
    return () => {
      if (newMap) {
        // Limpiar mapa al desmontar
        newMap.remove();
      }
    };
    
    // Incluimos leafletLoaded en las dependencias
  }, [open, initialLocation, leafletLoaded, map]);
  
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
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
          className="w-full h-[400px] rounded-md border border-border my-4"
        ></div>
        
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