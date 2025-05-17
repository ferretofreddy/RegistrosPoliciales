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
  // Estados
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    initialLocation || null
  );
  
  const { toast } = useToast();
  
  // Default location (Costa Rica - San José)
  const defaultLat = initialLocation?.lat || 9.9281;
  const defaultLng = initialLocation?.lng || -84.0907;
  
  // ID único para el mapa dentro del diálogo
  const mapDialogId = "map-in-dialog";

  // Función para inicializar el mapa cuando el diálogo está abierto
  useEffect(() => {
    // Solo inicializar si el diálogo está abierto, el mapa no está inicializado y Leaflet está disponible
    if (open && !mapInitialized && typeof window !== 'undefined' && window.L) {
      console.log("Dialog open, initializing map...");
      
      // Pequeño retraso para asegurar que el DOM esté completamente renderizado
      const initMapTimeout = setTimeout(() => {
        try {
          console.log("Attempting to initialize map in dialog");
          const leaflet = window.L;
          const mapElement = document.getElementById(mapDialogId);
          
          if (mapElement) {
            console.log("Map element found, creating map");
            
            // Coordenadas iniciales
            const initialCoords = selectedLocation 
              ? [selectedLocation.lat, selectedLocation.lng] 
              : [defaultLat, defaultLng];
              
            console.log("Using coordinates:", initialCoords);
            
            // Crear el mapa
            const newMap = leaflet.map(mapDialogId).setView(initialCoords, 13);
            
            // Agregar capa del mapa (OpenStreetMap)
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(newMap);
            
            // Crear marcador
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
            
            // Evento dragend del marcador
            newMarker.on('dragend', function() {
              const position = newMarker.getLatLng();
              console.log("Marker dragged to:", position);
              setSelectedLocation({
                lat: position.lat,
                lng: position.lng
              });
            });
            
            // Evento click en el mapa
            newMap.on('click', function(e: any) {
              console.log("Map clicked at:", e.latlng);
              newMarker.setLatLng(e.latlng);
              setSelectedLocation({
                lat: e.latlng.lat,
                lng: e.latlng.lng
              });
            });
            
            // Guardar referencias
            setMap(newMap);
            setMarker(newMarker);
            setMapInitialized(true);
            
            // MUY IMPORTANTE: invalidar el tamaño para que el mapa se renderice correctamente
            // en un diálogo que estaba oculto
            setTimeout(() => {
              console.log("Invalidating map size");
              newMap.invalidateSize();
            }, 300);
            
            console.log("Map initialized successfully");
          } else {
            console.error("Map element not found:", mapDialogId);
          }
        } catch (error) {
          console.error("Error initializing map:", error);
          toast({
            title: "Error al inicializar el mapa",
            description: "Ocurrió un error al cargar el mapa: " + (error instanceof Error ? error.message : String(error)),
            variant: "destructive",
          });
        }
      }, 500); // Esperar 500ms para que el DOM esté listo
      
      // Limpiar timeout si el componente se desmonta
      return () => clearTimeout(initMapTimeout);
    }
  }, [open, mapInitialized]);

  // Limpiar el mapa cuando se cierra el diálogo
  useEffect(() => {
    if (!open && map) {
      console.log("Dialog closed, cleaning up map");
      map.remove();
      setMap(null);
      setMarker(null);
      setMapInitialized(false);
    }
  }, [open, map]);

  // Actualizar el mapa si cambia la ubicación inicial
  useEffect(() => {
    if (map && marker && initialLocation && open) {
      console.log("Updating map with new initial location:", initialLocation);
      marker.setLatLng([initialLocation.lat, initialLocation.lng]);
      map.setView([initialLocation.lat, initialLocation.lng], 13);
      setSelectedLocation(initialLocation);
      map.invalidateSize();
    }
  }, [initialLocation, map, marker, open]);

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
      console.log("Confirmando ubicación:", selectedLocation);
      try {
        // Llamar a la función de callback con las coordenadas
        onSelectLocation(selectedLocation.lat, selectedLocation.lng);
        console.log("Callback de selección ejecutado correctamente");
        
        // Cerrar el diálogo
        onOpenChange(false);
        
        // Mostrar confirmación al usuario
        toast({
          title: "Ubicación seleccionada",
          description: `Latitud: ${selectedLocation.lat.toFixed(6)}, Longitud: ${selectedLocation.lng.toFixed(6)}`,
        });
      } catch (error) {
        console.error("Error al confirmar ubicación:", error);
        toast({
          title: "Error al guardar coordenadas",
          description: "No se pudieron guardar las coordenadas en el formulario.",
          variant: "destructive",
        });
      }
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
        
        {/* Contenedor del mapa */}
        <div className="relative">
          <div 
            id={mapDialogId} 
            className="leaflet-container h-[500px] rounded-md border border-border"
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
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-800 flex justify-between">
              <span><strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}</span>
              <span><strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}</span>
            </p>
          </div>
        )}
        
        <DialogFooter className="mt-5 pt-3 border-t flex flex-col sm:flex-row gap-3 items-center justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
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