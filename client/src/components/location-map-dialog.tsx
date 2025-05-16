import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  
  const { toast } = useToast();
  
  // Default location (Costa Rica)
  const defaultLat = initialLocation?.lat || 9.7489;
  const defaultLng = initialLocation?.lng || -83.7534;
  
  // ID único para el mapa dentro del diálogo
  const mapDialogId = "map-in-dialog";
  
  // Inicializar mapa cuando se abre el diálogo
  useEffect(() => {
    if (!open || mapInitialized) return;
    
    console.log("Dialog open, initializing map...");
    
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById(mapDialogId);
      if (!mapContainer) {
        console.error("Map container not found:", mapDialogId);
        return;
      }
      
      try {
        // Configurar íconos
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        // Coordenadas iniciales
        const initialCoords = selectedLocation 
          ? [selectedLocation.lat, selectedLocation.lng] 
          : [defaultLat, defaultLng];
        
        // Crear mapa
        const newMap = L.map(mapDialogId, {
          attributionControl: false,
          zoomControl: true
        }).setView(initialCoords, 10);
        
        // Añadir capa de mapa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);
        
        // Añadir marcador
        const newMarker = L.marker(initialCoords, {
          draggable: true
        }).addTo(newMap);
        
        // Evento de arrastrar marcador
        newMarker.on('dragend', function() {
          const position = newMarker.getLatLng();
          setSelectedLocation({
            lat: position.lat,
            lng: position.lng
          });
        });
        
        // Evento de clic en mapa
        newMap.on('click', function(e) {
          newMarker.setLatLng(e.latlng);
          setSelectedLocation({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        });
        
        setMap(newMap);
        setMarker(newMarker);
        setMapInitialized(true);
        
        // Forzar reajuste de tamaño
        setTimeout(() => {
          if (newMap) {
            newMap.invalidateSize();
          }
        }, 300);
        
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
    
  }, [open, mapInitialized, defaultLat, defaultLng, selectedLocation]);
  
  // Limpiar mapa al cerrar
  useEffect(() => {
    if (!open && map) {
      map.remove();
      setMap(null);
      setMarker(null);
      setMapInitialized(false);
    }
  }, [open, map]);
  
  // Actualizar mapa cuando cambia ubicación inicial
  useEffect(() => {
    if (map && marker && initialLocation && open) {
      marker.setLatLng([initialLocation.lat, initialLocation.lng]);
      map.setView([initialLocation.lat, initialLocation.lng], 13);
      setSelectedLocation(initialLocation);
      map.invalidateSize();
    }
  }, [initialLocation, map, marker, open]);
  
  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "No soportado",
        description: "La geolocalización no está disponible en su navegador",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Obteniendo ubicación",
      description: "Espere mientras obtenemos su ubicación actual...",
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (marker && map) {
          marker.setLatLng([latitude, longitude]);
          map.setView([latitude, longitude], 15);
        }
        
        setSelectedLocation({
          lat: latitude,
          lng: longitude
        });
        
        toast({
          title: "Ubicación obtenida",
          description: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        let message = "Error al obtener ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso denegado para obtener ubicación";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            message = "Tiempo de espera agotado al obtener ubicación";
            break;
        }
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };
  
  // Confirmar ubicación seleccionada
  const handleConfirm = () => {
    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "Por favor, seleccione una ubicación en el mapa",
        variant: "destructive",
      });
      return;
    }
    
    onSelectLocation(selectedLocation.lat, selectedLocation.lng);
    onOpenChange(false);
    
    toast({
      title: "Ubicación seleccionada",
      description: `Latitud: ${selectedLocation.lat.toFixed(6)}, Longitud: ${selectedLocation.lng.toFixed(6)}`,
    });
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
            Haga clic en el mapa para seleccionar una ubicación o arrastre el marcador.
          </DialogDescription>
        </DialogHeader>
        
        {/* Contenedor del mapa */}
        <div className="relative mb-4">
          <div 
            id={mapDialogId} 
            className="h-[500px] rounded-md border border-gray-300"
            style={{ width: "100%" }}
          />
          
          {!mapInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
              <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4" />
                <p className="text-sm">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Coordenadas seleccionadas */}
        {selectedLocation && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800 flex justify-between">
              <span><strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}</span>
              <span><strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}</span>
            </p>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 items-center">
          <Button 
            variant="outline" 
            onClick={getCurrentLocation}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Mi ubicación actual
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            Usar esta ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}