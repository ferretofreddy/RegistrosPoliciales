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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation } from "lucide-react";
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
  initialLocation,
  title = "Seleccionar ubicación",
}: LocationMapDialogProps) {
  // Referencias y estados
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    initialLocation || null
  );
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  const { toast } = useToast();
  
  // Default location (Costa Rica)
  const defaultLat = initialLocation?.lat || 9.748917;
  const defaultLng = initialLocation?.lng || -83.753428;

  // Inicializar mapa después de montar el componente - usando useEffect en lugar de useState
  useEffect(() => {
    // Solo inicializar si el diálogo está abierto y no se ha inicializado aún
    if (open && !isMapInitialized && window.L) {
      console.log("Inicializando mapa en el diálogo...");
      
      // Pequeño timeout para asegurarnos que el DOM está listo
      setTimeout(() => {
        try {
          const leaflet = window.L;
          // Crear un ID único para el mapa en este diálogo
          const mapId = "location-map-dialog";
          const mapElement = document.getElementById(mapId);
          
          if (mapElement) {
            console.log("Elemento del mapa encontrado, inicializando...");
            
            // Usar las coordenadas iniciales o predeterminadas
            const initialCoords = selectedLocation 
              ? [selectedLocation.lat, selectedLocation.lng] 
              : [defaultLat, defaultLng];
            
            console.log("Creando mapa con coordenadas:", initialCoords);
            
            // Crear el mapa y configurarlo
            const newMap = leaflet.map(mapId).setView(initialCoords, 13);
            
            // Agregar la capa de mapa (OpenStreetMap)
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(newMap);
            
            // Crear un marcador en la posición inicial con icono personalizado
            const newMarker = leaflet.marker(initialCoords, {
              draggable: true,
              icon: leaflet.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                shadowSize: [41, 41]
              })
            }).addTo(newMap);
            
            // Al arrastrar el marcador, actualizar la ubicación seleccionada
            newMarker.on('dragend', function() {
              const position = newMarker.getLatLng();
              console.log("Marcador arrastrado a:", position);
              setSelectedLocation({ 
                lat: position.lat, 
                lng: position.lng 
              });
            });
            
            // Al hacer clic en el mapa, mover el marcador y actualizar la ubicación
            newMap.on('click', function(e: any) {
              console.log("Clic en el mapa:", e.latlng);
              newMarker.setLatLng(e.latlng);
              setSelectedLocation({ 
                lat: e.latlng.lat, 
                lng: e.latlng.lng 
              });
            });
            
            // Guardar referencias
            setMap(newMap);
            setMarker(newMarker);
            setIsMapInitialized(true);
            
            // Importante: invalidar el tamaño después que el diálogo se muestre completamente
            setTimeout(() => {
              console.log("Invalidando tamaño del mapa");
              newMap.invalidateSize();
            }, 300);
            
            console.log("Mapa inicializado correctamente");
          } else {
            console.error("Elemento del mapa no encontrado:", mapId);
          }
        } catch (error) {
          console.error("Error al inicializar el mapa:", error);
          toast({
            title: "Error",
            description: "No se pudo inicializar el mapa: " + (error as Error).message,
            variant: "destructive",
          });
        }
      }, 500); // Damos tiempo para que el DOM se actualice completamente
    }
    
    // Limpiar el mapa cuando se cierra el diálogo
    return () => {
      if (map) {
        console.log("Limpiando mapa");
        map.remove();
        setMap(null);
        setMarker(null);
        setIsMapInitialized(false);
      }
    };
  }, [open, selectedLocation, defaultLat, defaultLng, isMapInitialized]);

  // Actualizar el mapa si cambia la ubicación inicial
  useEffect(() => {
    if (map && marker && initialLocation) {
      marker.setLatLng([initialLocation.lat, initialLocation.lng]);
      map.setView([initialLocation.lat, initialLocation.lng], 13);
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation, map, marker]);

  // Función para obtener la ubicación actual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Obteniendo ubicación",
        description: "Por favor espere mientras obtenemos su ubicación actual...",
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Actualizar ubicación seleccionada
          setSelectedLocation({ lat: latitude, lng: longitude });
          
          // Si el mapa y marcador están disponibles, actualizarlos
          if (map && marker) {
            marker.setLatLng([latitude, longitude]);
            map.setView([latitude, longitude], 15);
            
            // Opcional: mostrar un popup temporal
            marker.bindPopup("<b>¡Su ubicación actual!</b>").openPopup();
            setTimeout(() => marker.closePopup(), 3000);
          }
          
          toast({
            title: "Ubicación obtenida",
            description: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
          });
        },
        (error) => {
          let errorMsg = "Error desconocido";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Permiso denegado para acceder a la ubicación";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "La información de ubicación no está disponible";
              break;
            case error.TIMEOUT:
              errorMsg = "La solicitud de ubicación ha expirado";
              break;
          }
          
          toast({
            title: "Error de geolocalización",
            description: errorMsg,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Geolocalización no soportada",
        description: "Su navegador no soporta la geolocalización",
        variant: "destructive",
      });
    }
  };

  // Confirmar la selección de ubicación
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
            Haz clic en el mapa para seleccionar una ubicación o arrastra el marcador.
          </DialogDescription>
        </DialogHeader>
        
        {/* Contenedor del mapa - Usamos el mismo patrón que en ubicacion-form.tsx */}
        <div className="relative">
          <div 
            id="location-map-dialog"
            ref={mapContainerRef} 
            className="leaflet-container h-[450px] rounded-md border border-border bg-gray-100"
          />
          
          {!isMapInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
              <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4" />
                <p className="text-sm">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Acciones para el mapa */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={getCurrentLocation} type="button">
            <Navigation className="h-4 w-4 mr-2" />
            Usar mi ubicación actual
          </Button>
        </div>
        
        {/* Coordenadas seleccionadas */}
        {selectedLocation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800 flex justify-between">
              <span><strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}</span>
              <span><strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}</span>
            </p>
          </div>
        )}
        
        <DialogFooter className="mt-4 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLocation}>
            Confirmar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}