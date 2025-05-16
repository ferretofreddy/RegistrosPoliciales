import React, { useEffect, useRef, useState } from 'react';
import { Ubicacion } from "@shared/schema";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configurar marcadores personalizados para Leaflet
// Definir íconos personalizados para evitar problemas con los íconos por defecto
const iconoAzul = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconoRojo = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapaTablaUbicacionesProps {
  entidadSeleccionada: {
    tipo: string;
    id: number;
    nombre: string;
    descripcion: string;
  } | null;
  detalleData: any;
}

export default function MapaTablaUbicaciones({ 
  entidadSeleccionada,
  detalleData
}: MapaTablaUbicacionesProps) {
  // Estados para ubicaciones
  const [ubicacionesDirectas, setUbicacionesDirectas] = useState<any[]>([]);
  const [ubicacionesRelacionadas, setUbicacionesRelacionadas] = useState<any[]>([]);
  const [mapaError, setMapaError] = useState<string | null>(null);
  
  // Referencias para el mapa y marcadores
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef(false);
  
  // Procesamiento inicial de datos
  useEffect(() => {
    console.log("Procesando datos de ubicaciones para:", entidadSeleccionada);
    console.log("Detalle data recibida:", detalleData);
    
    if (!detalleData) return;
    
    try {
      // Extraer ubicaciones directas
      let directas: any[] = [];
      
      // Manejar los diferentes formatos posibles de datos
      if (Array.isArray(detalleData.ubicaciones)) {
        directas = [...detalleData.ubicaciones];
        console.log("Ubicaciones directas obtenidas del array:", directas.length);
      } else if (detalleData.ubicaciones && detalleData.ubicaciones.ubicacionesDirectas) {
        directas = [...detalleData.ubicaciones.ubicacionesDirectas];
        console.log("Ubicaciones directas obtenidas del objeto:", directas.length);
      }
      
      // Caso especial: si la entidad seleccionada es una persona, intentar obtener su domicilio
      if (entidadSeleccionada?.tipo === "persona") {
        const personaId = entidadSeleccionada.id;
        console.log(`Buscando domicilio específico para persona ID: ${personaId}`);
        
        // Buscar en ubicaciones relacionadas por API
        fetch(`/api/relaciones/persona/${personaId}`)
          .then(res => res.json())
          .then(relacionesData => {
            console.log(`Relaciones obtenidas para persona ${personaId}:`, relacionesData);
            
            // Si hay ubicaciones en las relaciones
            if (relacionesData.ubicaciones && Array.isArray(relacionesData.ubicaciones)) {
              // Obtener detalles de cada ubicación
              const promesasUbicaciones = relacionesData.ubicaciones.map((ubicacion: any) => {
                // Verificar si tenemos un objeto o un ID
                const ubicacionId = typeof ubicacion === 'object' ? ubicacion.id : ubicacion;
                console.log(`Obteniendo detalles para ubicación ${ubicacionId}`);
                return fetch(`/api/ubicaciones/${ubicacionId}`).then(r => r.json());
              });
              
              Promise.all(promesasUbicaciones)
                .then(ubicacionesDetalles => {
                  console.log("Detalles de ubicaciones relacionadas obtenidos:", ubicacionesDetalles);
                  
                  // Filtrar ubicaciones válidas (con coordenadas)
                  const ubicacionesValidas = ubicacionesDetalles.filter(
                    (ubi: any) => typeof ubi.latitud === 'number' && typeof ubi.longitud === 'number'
                  );
                  
                  if (ubicacionesValidas.length > 0) {
                    // Actualizar ubicaciones relacionadas
                    setUbicacionesDirectas(prev => {
                      // Combinar evitando duplicados por ID
                      const idsActuales = new Set(prev.map(u => u.id));
                      const nuevasUbicaciones = ubicacionesValidas.filter(u => !idsActuales.has(u.id));
                      return [...prev, ...nuevasUbicaciones];
                    });
                  }
                })
                .catch(err => console.error("Error al obtener detalles de ubicaciones:", err));
            }
          })
          .catch(err => console.error(`Error al obtener relaciones para persona ${personaId}:`, err));
      }
      
      // Actualizar ubicaciones directas
      setUbicacionesDirectas(directas);
      
      // Procesar ubicaciones relacionadas
      let relacionadas: any[] = [];
      
      if (detalleData.ubicacionesRelacionadas && Array.isArray(detalleData.ubicacionesRelacionadas)) {
        relacionadas = [...detalleData.ubicacionesRelacionadas];
        console.log("Ubicaciones relacionadas encontradas:", relacionadas.length);
      }
      
      // Actualizar el estado de ubicaciones relacionadas
      setUbicacionesRelacionadas(relacionadas);
      
    } catch (error) {
      console.error("Error al procesar datos de ubicaciones:", error);
      setMapaError("Error al procesar datos de ubicaciones");
    }
    
  }, [entidadSeleccionada, detalleData]);
  
  // Inicializar y actualizar el mapa cuando cambien las ubicaciones
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const renderMap = () => {
      console.log("Intentando renderizar mapa con:", {
        directas: ubicacionesDirectas.length,
        relacionadas: ubicacionesRelacionadas.length
      });
      
      // Validar que el contenedor del mapa existe y tiene dimensiones
      if (!mapContainerRef.current) {
        console.error("El contenedor del mapa no existe");
        setMapaError("Error: Contenedor del mapa no disponible");
        return;
      }
      
      try {
        // Limpiar el mapa anterior si existe
        if (mapRef.current) {
          console.log("Eliminando mapa anterior");
          mapRef.current.remove();
          mapRef.current = null;
        }
        
        // Si no hay ubicaciones, no renderizar el mapa
        if (ubicacionesDirectas.length === 0 && ubicacionesRelacionadas.length === 0) {
          console.log("No hay ubicaciones para mostrar en el mapa");
          return;
        }
        
        // Crear un nuevo mapa
        console.log("Creando nuevo mapa en el contenedor");
        const map = L.map(mapContainerRef.current, {
          attributionControl: false, // Quitar atribución para evitar problemas de renderizado
          zoomControl: true
        });
        
        // Añadir capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Guardar referencia del mapa
        mapRef.current = map;
        
        // Preparar bounds para ajustar la vista
        const bounds = L.latLngBounds([]);
        let hayMarcadores = false;
        
        // Añadir marcadores para ubicaciones directas
        ubicacionesDirectas.forEach((ubicacion, index) => {
          if (typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number') {
            hayMarcadores = true;
            
            // Usar icono azul para ubicaciones directas
            const icon = iconoAzul;
            
            // Crear marcador
            const position: [number, number] = [ubicacion.latitud, ubicacion.longitud];
            console.log(`Añadiendo marcador directo en: [${position}]`);
            
            try {
              const marker = L.marker(position, { icon }).addTo(map);
              
              // Información para el popup
              marker.bindPopup(`
                <div>
                  <strong>${ubicacion.tipo || "Ubicación"}</strong><br>
                  ${ubicacion.fecha ? `Fecha: ${new Date(ubicacion.fecha).toLocaleString()}<br>` : ''}
                  Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}<br>
                  ${ubicacion.observaciones ? `Observaciones: ${ubicacion.observaciones}` : ''}
                </div>
              `);
              
              // Añadir posición al bounds
              bounds.extend(position);
            } catch (error) {
              console.error(`Error al crear marcador en ${position}:`, error);
            }
          } else {
            console.warn("Ubicación sin coordenadas válidas:", ubicacion);
          }
        });
        
        // Añadir marcadores para ubicaciones relacionadas
        ubicacionesRelacionadas.forEach((item, index) => {
          // Verificar estructura: puede ser directamente una ubicación o contener una propiedad "ubicacion"
          const ubicacion = item.ubicacion ? item.ubicacion : item;
          
          if (ubicacion && typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number') {
            hayMarcadores = true;
            
            // Usar icono rojo para ubicaciones relacionadas
            const icon = iconoRojo;
            
            // Crear marcador
            const position: [number, number] = [ubicacion.latitud, ubicacion.longitud];
            console.log(`Añadiendo marcador relacionado en: [${position}]`);
            
            try {
              const marker = L.marker(position, { icon }).addTo(map);
              
              // Preparar información para el popup
              let entidadInfo = '';
              if (item.entidadRelacionada) {
                const entidad = item.entidadRelacionada;
                entidadInfo = `<br><strong>Relacionada con:</strong> ${entidad.tipo} - ${entidad.entidad?.nombre || 'Desconocido'}`;
              }
              
              // Añadir popup
              marker.bindPopup(`
                <div>
                  <strong>${ubicacion.tipo || "Ubicación"} (Relacionada)</strong><br>
                  ${ubicacion.fecha ? `Fecha: ${new Date(ubicacion.fecha).toLocaleString()}<br>` : ''}
                  Coordenadas: ${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}
                  ${entidadInfo}
                  ${ubicacion.observaciones ? `<br>Observaciones: ${ubicacion.observaciones}` : ''}
                </div>
              `);
              
              // Añadir posición al bounds
              bounds.extend(position);
            } catch (error) {
              console.error(`Error al crear marcador en ${position}:`, error);
            }
          } else {
            console.warn("Ubicación relacionada sin coordenadas válidas:", ubicacion);
          }
        });
        
        // Ajustar la vista del mapa
        if (hayMarcadores) {
          console.log("Ajustando vista del mapa con los marcadores");
          
          // Intentar que la vista contenga todos los marcadores
          try {
            // Si hay más de un marcador, ajustar a todos
            if (bounds.isValid()) {
              map.fitBounds(bounds, { 
                padding: [30, 30],
                maxZoom: 15
              });
              console.log("Vista del mapa ajustada a todos los marcadores");
            } else {
              // Si no hay bounds válidos, poner una vista por defecto (Costa Rica)
              map.setView([9.748917, -83.753428], 7);
              console.warn("No se pudo ajustar la vista, usando vista por defecto");
            }
          } catch (error) {
            console.error("Error al ajustar la vista del mapa:", error);
            // Vista de respaldo
            map.setView([9.748917, -83.753428], 7);
          }
        } else {
          // Vista por defecto si no hay marcadores
          map.setView([9.748917, -83.753428], 7);
          console.log("No hay marcadores, usando vista por defecto");
        }
        
        // Invalidar tamaño del mapa para forzar actualización
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            console.log("Tamaño del mapa actualizado");
          }
        }, 100);
        
        // Marcar como inicializado
        mapInitializedRef.current = true;
        setMapaError(null);
        
      } catch (error) {
        console.error("Error crítico al renderizar el mapa:", error);
        setMapaError(`Error al renderizar mapa: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    // Dar tiempo para que el DOM se actualice antes de renderizar el mapa
    timer = setTimeout(renderMap, 500);
    
    // Limpieza al desmontar
    return () => {
      clearTimeout(timer);
      
      // Limpiar el mapa si existe
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ubicacionesDirectas, ubicacionesRelacionadas]);

  // Determinar si hay ubicaciones para mostrar
  const hayUbicaciones = ubicacionesDirectas.length > 0 || ubicacionesRelacionadas.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Mapa de ubicaciones */}
      <div className="border rounded-lg overflow-hidden">
        <div className="h-[400px] relative" ref={mapContainerRef}>
          {!hayUbicaciones && !mapaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">No hay ubicaciones disponibles para mostrar</p>
            </div>
          )}
          {mapaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <p className="text-red-500">{mapaError}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabla de ubicaciones */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Ubicaciones directas */}
            {ubicacionesDirectas.map((ubicacion, index) => (
              <tr key={`directa-${index}-${ubicacion.id}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ubicacion.tipo || "No especificado"}
                  {ubicacion.esDomicilio && <span className="ml-1 text-xs text-blue-500">(Domicilio)</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number' 
                    ? `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` 
                    : "Coordenadas no disponibles"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No especificada"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{ubicacion.observaciones || "Sin observaciones"}</td>
              </tr>
            ))}
            
            {/* Separador para ubicaciones relacionadas si hay ambos tipos */}
            {ubicacionesDirectas.length > 0 && ubicacionesRelacionadas.length > 0 && (
              <tr className="bg-gray-100">
                <td colSpan={4} className="px-6 py-2 text-sm font-medium text-gray-500">Ubicaciones relacionadas</td>
              </tr>
            )}
            
            {/* Ubicaciones relacionadas */}
            {ubicacionesRelacionadas.map((item, index) => {
              // Verificar estructura: puede ser directamente una ubicación o contener una propiedad "ubicacion"
              const ubicacion = item.ubicacion ? item.ubicacion : item;
              
              return ubicacion ? (
                <tr key={`relacionada-${index}-${ubicacion.id}`} className="hover:bg-gray-50 bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ubicacion.tipo || "No especificado"} 
                    {item.entidadRelacionada && (
                      <span className="ml-1 text-xs text-gray-500">
                        (Rel: {item.entidadRelacionada.tipo} - {item.entidadRelacionada.entidad?.nombre || 'Desconocido'})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof ubicacion.latitud === 'number' && typeof ubicacion.longitud === 'number' 
                      ? `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` 
                      : "Coordenadas no disponibles"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No especificada"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ubicacion.observaciones || "Sin observaciones"}</td>
                </tr>
              ) : null;
            })}
            
            {/* Mensaje si no hay ubicaciones */}
            {!hayUbicaciones && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay ubicaciones disponibles para esta entidad
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}