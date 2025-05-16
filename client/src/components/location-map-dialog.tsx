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

// Importamos Leaflet directamente
let L;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

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
  
  // Ubicación predeterminada (Costa Rica)
  const defaultLat = initialLocation?.lat || 9.7489;
  const defaultLng = initialLocation?.lng || -83.7534;
  
  // ID único para el contenedor del mapa
  const mapId = "location-select-map";
  
  // Inicializar mapa cuando se abre el diálogo
  useEffect(() => {
    // Solo inicializar si el diálogo está abierto y no hay mapa ya inicializado
    if (!open || mapInitialized || !L) return;
    
    console.log("Iniciando inicialización del mapa...");
    
    // Dar tiempo para que el DOM se actualice antes de inicializar
    const timer = setTimeout(() => {
      try {
        console.log("Intentando inicializar mapa...");
        
        // Verificar que el elemento del mapa existe
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
          console.error("Elemento del mapa no encontrado:", mapId);
          return;
        }
        
        console.log("Elemento del mapa encontrado, inicializando...");
        
        // Corregir problema con iconos en Leaflet
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
        
        console.log("Creando mapa con coordenadas:", initialCoords);
        
        // Crear mapa
        const newMap = L.map(mapId).setView(initialCoords, 10);
        
        // Añadir capa del mapa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);
        
        // Crear marcador draggable
        const newMarker = L.marker(initialCoords, {
          draggable: true
        }).addTo(newMap);
        
        // Manejar evento de arrastrar el marcador
        newMarker.on('dragend', function() {
          const position = newMarker.getLatLng();
          setSelectedLocation({
            lat: position.lat,
            lng: position.lng
          });
          console.log("Marcador arrastrado a:", position);
        });
        
        // Manejar clic en el mapa
        newMap.on('click', function(e) {
          newMarker.setLatLng(e.latlng);
          setSelectedLocation({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
          console.log("Clic en el mapa en:", e.latlng);
        });
        
        // Guardar referencias
        setMap(newMap);
        setMarker(newMarker);
        setMapInitialized(true);
        
        // Forzar reajuste del mapa después de un breve retraso
        setTimeout(() => {
          newMap.invalidateSize();
          console.log("Tamaño del mapa invalidado para forzar renderizado correcto");
        }, 200);
        
        console.log("Mapa inicializado exitosamente");
        
      } catch (error) {
        console.error("Error al inicializar el mapa:", error);
        toast({
          title: "Error al cargar el mapa",
          description: "Ocurrió un error técnico. Por favor, inténtelo de nuevo.",
          variant: "destructive",
        });
      }
    }, 200);
    
    // Limpieza al desmontar
    return () => {
      clearTimeout(timer);
    };
  }, [open, mapInitialized, selectedLocation, defaultLat, defaultLng, toast]);
  
  // Limpiar mapa cuando se cierra el diálogo
  useEffect(() => {
    if (!open && map) {
      console.log("Diálogo cerrado, limpiando mapa");
      map.remove();
      setMap(null);
      setMarker(null);
      setMapInitialized(false);
    }
  }, [open, map]);
  
  // Actualizar mapa si cambia initialLocation
  useEffect(() => {
    if (map && marker && initialLocation && open) {
      console.log("Actualizando ubicación inicial en el mapa:", initialLocation);
      marker.setLatLng([initialLocation.lat, initialLocation.lng]);
      map.setView([initialLocation.lat, initialLocation.lng], 13);
      setSelectedLocation(initialLocation);
      map.invalidateSize();
    }
  }, [initialLocation, map, marker, open]);
  
  // Función para obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "No soportado",
        description: "Su navegador no soporta geolocalización.",
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
          description: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        console.error("Error al obtener ubicación:", error);
        
        let errorMessage = "No se pudo obtener su ubicación.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permisos de ubicación denegados.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener ubicación.";
            break;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  };
  
  // Confirmar la selección de ubicación
  const handleConfirm = () => {
    if (!selectedLocation) {
      toast({
        title: "Seleccione ubicación",
        description: "Por favor, seleccione una ubicación en el mapa primero.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Confirmando ubicación:", selectedLocation);
    
    try {
      onSelectLocation(selectedLocation.lat, selectedLocation.lng);
      onOpenChange(false);
      
      toast({
        title: "Ubicación seleccionada",
        description: `Coordenadas guardadas: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
      });
    } catch (error) {
      console.error("Error al confirmar ubicación:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la ubicación seleccionada.",
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
            Haga clic en el mapa para seleccionar una ubicación o arrastre el marcador.
          </DialogDescription>
        </DialogHeader>
        
        {/* Contenedor del mapa */}
        <div className="relative mb-4">
          <div 
            id={mapId} 
            className="h-[500px] rounded-md border border-border"
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
        
        {/* Mostrar coordenadas seleccionadas */}
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
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Usar esta ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}