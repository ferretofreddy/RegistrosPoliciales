import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/main-layout';

const UbicacionesVisualizador = () => {
  const [location, setLocation] = useLocation();
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  // Extraer parámetros de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    const id = params.get('id');
    const nombre = params.get('nombre');
    
    if (tipo && id) {
      setEntidadSeleccionada({
        tipo,
        id: parseInt(id),
        nombre: nombre || `${tipo} #${id}`
      });
    }
  }, [location]);

  // Consulta para obtener todas las ubicaciones de la entidad
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/ubicaciones-completas', entidadSeleccionada?.tipo, entidadSeleccionada?.id],
    queryFn: async () => {
      if (!entidadSeleccionada) return null;
      
      console.log(`[DEBUG] Consultando ubicaciones completas para ${entidadSeleccionada.tipo} ID ${entidadSeleccionada.id}`);
      
      try {
        const response = await fetch(`/api/ubicaciones-completas/${entidadSeleccionada.tipo}/${entidadSeleccionada.id}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener ubicaciones: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Datos de ubicaciones recibidos:', data);
        return data;
      } catch (err) {
        console.error('Error al obtener ubicaciones:', err);
        throw err;
      }
    },
    enabled: !!entidadSeleccionada,
  });

  // Inicializar mapa cuando el componente se monta
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && !mapInstance) {
      const map = window.L.map('mapa-visualizador').setView([8.74, -82.94], 12);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      setMapInstance(map);
    }
    
    return () => {
      // Limpiar mapa al desmontar
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Actualizar marcadores cuando cambian los datos
  useEffect(() => {
    if (!mapInstance || !data) return;
    
    // Limpiar marcadores existentes
    mapMarkers.forEach(marker => marker.remove());
    setMapMarkers([]);
    
    const newMarkers = [];
    const bounds = window.L.latLngBounds();
    let hasBounds = false;
    
    // Función para añadir un marcador al mapa
    const addMarker = (lat: number, lng: number, popupContent: string, tipo: string = '') => {
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
      const customIcon = window.L.icon({
        iconUrl: svgBase64,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
      
      // Crear marcador con el icono personalizado
      const marker = window.L.marker([lat, lng], {
        icon: customIcon
      }).addTo(mapInstance);
      
      // Añadir popup
      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 300
      });
      
      newMarkers.push(marker);
      return marker;
    };
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", data.ubicacionesDirectas);
      data.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          addMarker(
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
            'ubicacion'
          );
          
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", data.ubicacionesRelacionadas);
      data.ubicacionesRelacionadas.forEach((relacion: any) => {
        if (relacion.ubicacion && relacion.ubicacion.latitud && relacion.ubicacion.longitud) {
          const entidadRel = relacion.entidadRelacionada?.entidad;
          const tipoRel = relacion.entidadRelacionada?.tipo;
          
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
          if (relacion.entidadRelacionada?.relacionadoCon) {
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
          
          addMarker(
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
            tipoRel
          );
          
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    setMapMarkers(newMarkers);
    
    // Ajustar el mapa para mostrar todos los marcadores
    if (hasBounds) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapInstance, data]);

  const handleVolver = () => {
    setLocation('/ubicaciones');
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2"
                onClick={handleVolver}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <CardTitle>
                {entidadSeleccionada ? 
                  `Ubicaciones: ${entidadSeleccionada.nombre}` : 
                  'Visualizador de Ubicaciones'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-md">
                <p>Error al cargar ubicaciones: {error instanceof Error ? error.message : 'Error desconocido'}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={handleVolver}
                >
                  Volver
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-gray-600">Cargando ubicaciones...</p>
              </div>
            ) : (
              <div>
                {data ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        {data.ubicacionesDirectas?.length || 0} ubicaciones directas | 
                        {data.ubicacionesRelacionadas?.length || 0} ubicaciones relacionadas
                      </div>
                    </div>
                    
                    {/* Mapa grande */}
                    <div 
                      id="mapa-visualizador" 
                      className="w-full h-[600px] border rounded-md shadow-sm"
                    ></div>
                    
                    {/* Lista de ubicaciones */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Ubicaciones directas */}
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                          Ubicaciones Directas ({data.ubicacionesDirectas?.length || 0})
                        </h3>
                        
                        {data.ubicacionesDirectas?.length > 0 ? (
                          <div className="max-h-[300px] overflow-y-auto pr-2">
                            {data.ubicacionesDirectas.map((ubicacion: any) => (
                              <div 
                                key={`directa-${ubicacion.id}`} 
                                className="p-2 mb-2 border rounded-md hover:bg-gray-50"
                              >
                                <div className="font-medium">{ubicacion.tipo || 'Sin tipo'}</div>
                                <div className="text-sm text-gray-600">
                                  {ubicacion.observaciones || 'Sin observaciones'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(ubicacion.fecha).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">No se encontraron ubicaciones directas</div>
                        )}
                      </div>
                      
                      {/* Ubicaciones relacionadas */}
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                          Ubicaciones Relacionadas ({data.ubicacionesRelacionadas?.length || 0})
                        </h3>
                        
                        {data.ubicacionesRelacionadas?.length > 0 ? (
                          <div className="max-h-[300px] overflow-y-auto pr-2">
                            {data.ubicacionesRelacionadas.map((relacion: any, index: number) => (
                              <div 
                                key={`relacionada-${index}`} 
                                className="p-2 mb-2 border rounded-md hover:bg-gray-50"
                              >
                                <div className="font-medium">{relacion.ubicacion.tipo || 'Sin tipo'}</div>
                                <div className="text-sm text-gray-600">
                                  {relacion.ubicacion.observaciones || 'Sin observaciones'}
                                </div>
                                {relacion.entidadRelacionada && (
                                  <div className="text-xs bg-blue-50 p-1 rounded mt-1">
                                    Relacionada con: {relacion.entidadRelacionada.tipo} 
                                    {relacion.entidadRelacionada.entidad.nombre || 
                                      relacion.entidadRelacionada.entidad.placa || 
                                      relacion.entidadRelacionada.entidad.direccion || 
                                      `#${relacion.entidadRelacionada.entidad.id}`}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(relacion.ubicacion.fecha).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">No se encontraron ubicaciones relacionadas</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No hay datos disponibles para mostrar
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UbicacionesVisualizador;