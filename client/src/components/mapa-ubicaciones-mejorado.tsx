import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Tipo para la entidad seleccionada
interface EntidadSeleccionada {
  tipo: string;
  id: number;
  nombre?: string;
}

// Props del componente
interface MapaUbicacionesMejoradoProps {
  entidad: EntidadSeleccionada;
  onClose?: () => void;
}

const MapaUbicacionesMejorado = ({ entidad, onClose }: MapaUbicacionesMejoradoProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<any>(null);

  useEffect(() => {
    // Cargar los datos de ubicaciones
    const cargarUbicaciones = async () => {
      setLoading(true);
      setError(null);

      try {
        // Usamos la API específica para mostrar todas las ubicaciones de esta entidad
        const response = await fetch(`/api/ubicaciones-completas/${entidad.tipo}/${entidad.id}`);
        
        if (!response.ok) {
          throw new Error(`Error al cargar ubicaciones: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[MAPA] Datos recibidos:", data);
        setDatos(data);
        
        // Inicializar el mapa después de cargar los datos
        inicializarMapa(data);
      } catch (err) {
        console.error("Error al cargar ubicaciones:", err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    cargarUbicaciones();

    // Limpiar al desmontar
    return () => {
      if (mapRef.current && mapRef.current.map) {
        mapRef.current.map.remove();
      }
    };
  }, [entidad.id, entidad.tipo]);

  // Función para inicializar el mapa con los datos
  const inicializarMapa = (data: any) => {
    if (!mapContainerRef.current) return;
    
    const leaflet = window.L;
    if (!leaflet) {
      console.error("Leaflet no está disponible");
      setError("No se pudo cargar el mapa. Recargue la página e intente nuevamente.");
      return;
    }

    // Crear el mapa
    const map = leaflet.map(mapContainerRef.current).setView([8.74, -82.94], 12);
    
    // Añadir capa de mapa base
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Inicializar el objeto mapRef
    mapRef.current = {
      map,
      markers: [],
      
      // Método para añadir un marcador al mapa
      addMarker: function(lat: number, lng: number, popupContent: string, tipo: string = '', entidadId: number = 0) {
        // Color según tipo
        let iconColor = '';
        switch(tipo.toLowerCase()) {
          case 'persona':
            iconColor = '#ef4444'; // rojo
            break;
          case 'vehiculo':
            iconColor = '#3b82f6'; // azul
            break;
          case 'inmueble':
            iconColor = '#22c55e'; // verde
            break;
          default:
            iconColor = '#8b5cf6'; // morado
        }
        
        // Crear marcador con icono SVG personalizado
        const svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${iconColor}" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            ${tipo.toLowerCase() === 'persona' ? 
              '<circle cx="12" cy="8" r="5"/><path d="M20 21v-2a7 7 0 0 0-14 0v2"/>' : 
              tipo.toLowerCase() === 'vehiculo' ? 
              '<path d="M7 17m0 1a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1z"/><path d="M14 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M6 12l-2 4h16l-2 -4"/><path d="M6 12m0 -2v2h12v-2z"/>' : 
              tipo.toLowerCase() === 'inmueble' ? 
              '<path d="M3 21h18M5 21V7l7-4 7 4v14M13 10h4M13 14h4M13 18h4" />' : 
              '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'
            }
          </svg>
        `;
        
        // Convertir SVG a Data URL
        const svgBase64 = 'data:image/svg+xml;base64,' + btoa(svgIcon);
        
        // Crear un icono personalizado
        const customIcon = leaflet.icon({
          iconUrl: svgBase64,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });
        
        // Crear marcador con el icono personalizado
        const marker = leaflet.marker([lat, lng], {
          icon: customIcon
        }).addTo(map);
        
        // Añadir popup
        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300
        });
        
        this.markers.push(marker);
        return marker;
      },
      
      // Limpiar todos los marcadores
      clear: function() {
        this.markers.forEach((marker: any) => marker.remove());
        this.markers = [];
      }
    };
    
    // Iniciar procesamiento de datos
    const bounds = leaflet.latLngBounds();
    let hasBounds = false;
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", data.ubicacionesDirectas);
      data.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          mapRef.current.addMarker(
            ubicacion.latitud, 
            ubicacion.longitud, 
            `
              <div style="max-width: 250px;">
                <h4 style="margin: 0; font-size: 14px;">Ubicación Directa</h4>
                <p style="margin: 5px 0; font-size: 12px;">
                  <strong>${ubicacion.tipo || 'Sin tipo'}</strong><br>
                  ${ubicacion.observaciones ? `<em>${ubicacion.observaciones}</em>` : 'Sin observaciones'}
                </p>
                <p style="margin: 2px 0; font-size: 10px; color: #666;">
                  Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}
                </p>
              </div>
            `,
            'ubicacion',
            ubicacion.id
          );
          
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades encontradas
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", data.ubicacionesRelacionadas);
      data.ubicacionesRelacionadas.forEach((relacion: any) => {
        if (relacion.ubicacion && relacion.ubicacion.latitud && relacion.ubicacion.longitud) {
          const entidadRel = relacion.entidadRelacionada.entidad;
          const tipoRel = relacion.entidadRelacionada.tipo;
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${tipoRel}`);
          
          let title = '';
          if (tipoRel === 'persona') {
            title = `${entidadRel.nombre}${entidadRel.identificacion ? ` - ${entidadRel.identificacion}` : ''}`;
          } else if (tipoRel === 'vehiculo') {
            title = `${entidadRel.marca} ${entidadRel.modelo || ''} (${entidadRel.placa})`;
          } else if (tipoRel === 'inmueble') {
            title = `${entidadRel.tipo} - ${entidadRel.direccion}`;
          }
          
          // Información sobre relaciones
          let infoRelaciones = '';
          if (relacion.entidadRelacionada.relacionadoCon) {
            const relacionadoCon = relacion.entidadRelacionada.relacionadoCon;
            const tipoRelacionado = relacionadoCon.tipo;
            const nombreRelacionado = relacionadoCon.entidad.nombre || 
                                     (tipoRelacionado === 'vehiculo' ? relacionadoCon.entidad.placa : '') ||
                                     (tipoRelacionado === 'inmueble' ? relacionadoCon.entidad.direccion : '') ||
                                     `ID: ${relacionadoCon.entidad.id}`;
            
            infoRelaciones = `
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relacionado con:</strong> ${nombreRelacionado} (${tipoRelacionado})
              </p>
            `;
          }
          
          mapRef.current.addMarker(
            relacion.ubicacion.latitud,
            relacion.ubicacion.longitud,
            `
              <div style="max-width: 250px;">
                <h4 style="margin: 0; font-size: 14px;">Ubicación Relacionada</h4>
                <p style="margin: 5px 0; font-size: 12px;">
                  <strong>${relacion.ubicacion.tipo || 'Sin tipo'}</strong><br>
                  ${relacion.ubicacion.observaciones ? `<em>${relacion.ubicacion.observaciones}</em>` : 'Sin observaciones'}
                </p>
                ${infoRelaciones}
                <div style="margin: 5px 0; font-size: 12px;">
                  <strong>${tipoRel.charAt(0).toUpperCase() + tipoRel.slice(1)}:</strong> ${title}
                </div>
                <p style="margin: 2px 0; font-size: 10px; color: #666;">
                  Coordenadas: ${relacion.ubicacion.latitud.toFixed(6)}, ${relacion.ubicacion.longitud.toFixed(6)}
                </p>
              </div>
            `,
            tipoRel,
            entidadRel.id
          );
          
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // Ajustar el mapa para mostrar todos los marcadores
    if (hasBounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2 p-2 bg-slate-100 rounded">
        <h3 className="text-lg font-semibold">
          Ubicaciones: {entidad.nombre || `${entidad.tipo} #${entidad.id}`}
        </h3>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
      
      {error && (
        <div className="p-4 mb-2 bg-red-50 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando mapa...</span>
        </div>
      ) : (
        <>
          <div className="flex-1 border rounded-md overflow-hidden" ref={mapContainerRef}></div>
          
          {datos && (
            <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
              <p>
                <strong>Ubicaciones directas:</strong> {datos.ubicacionesDirectas?.length || 0} |
                <strong> Ubicaciones relacionadas:</strong> {datos.ubicacionesRelacionadas?.length || 0}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapaUbicacionesMejorado;