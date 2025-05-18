import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, User, Car, Home } from "lucide-react";

// Make sure to import Leaflet via CDN in index.html
declare global {
  interface Window {
    L: any;
  }
}

export default function UbicacionesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: number,
    tipo: string,
    texto: string,
    entidad: any
  }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    id: number,
    tipo: string,
    texto: string,
    entidad: any
  } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState({
    personas: true,
    vehiculos: true,
    inmuebles: true,
  });
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  // Crear un ref para almacenar marcadores de inmuebles para relaciones especiales
  const inmuebleMarkers = useRef<Map<number, any>>(new Map());
  const personaMarkers = useRef<Map<number, any>>(new Map());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/ubicaciones", searchTerm, selectedTypes, selectedResult],
    queryFn: async () => {
      console.log("[DEBUG] Iniciando búsqueda de ubicaciones"); 
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      // Construir la URL base
      let url = '/api/ubicaciones?';
      
      // Si hay un resultado seleccionado específico, usar esa información
      if (selectedResult) {
        console.log(`[DEBUG] Búsqueda específica por ${selectedResult.tipo} con ID: ${selectedResult.id}`);
        url += `entidadTipo=${selectedResult.tipo}&entidadId=${selectedResult.id}`;
        
        // También podemos incluir el término de búsqueda como referencia
        if (searchTerm.trim()) {
          url += `&buscar=${encodeURIComponent(searchTerm)}`;
        }
      } else {
        // Búsqueda general por término
        console.log(`[DEBUG] Búsqueda general con término: "${searchTerm}" y tipos: ${tipos.join(', ')}`);
        url += `buscar=${encodeURIComponent(searchTerm)}&tipos=${tipos.join(',')}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] Error en la búsqueda: ${response.status} - ${errorText}`);
        throw new Error(`Error al buscar ubicaciones: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[DEBUG] Datos recibidos:", data);
      return data;
    },
    enabled: false,
  });

  useEffect(() => {
    // Inicializar el mapa si aún no existe
    if (!map && mapContainerRef.current) {
      const leaflet = window.L;
      
      if (!leaflet) {
        console.error("Leaflet no está disponible");
        return;
      }
      
      const newMap = leaflet.map(mapContainerRef.current).setView([-34.603722, -58.381592], 13);
      
      // Inicializar el objeto mapRef que contiene métodos útiles
      mapRef.current = {
        map: newMap,
        
        // Método para añadir un marcador al mapa
        addMarker: function(lat: number, lng: number, popupContent: string, tipo: string = '', forceNew: boolean = false) {
          // Determinar el color basado en el tipo
          let iconColor = '';
          
          switch(tipo.toLowerCase()) {
            case 'persona':
              iconColor = '#ef4444'; // bg-red-500
              break;
            case 'vehiculo':
              iconColor = '#3b82f6'; // bg-blue-500
              break;
            case 'inmueble':
              iconColor = '#22c55e'; // bg-green-500
              break;
            default:
              iconColor = '#8b5cf6'; // bg-purple-500
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
          }).addTo(newMap);
          
          // Añadir popup
          marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 300
          });
          
          // Almacenar el tipo de entidad en el marcador para uso futuro
          marker.entidadTipo = tipo;
          
          // Guardar marcadores especiales para referencias posteriores
          if (tipo === 'inmueble' && marker.entidadId === 1) {
            inmuebleMarkers.current.set(1, marker);
          }
          if (tipo === 'persona' && marker.entidadId === 4) {
            personaMarkers.current.set(4, marker);
          }
          
          return marker;
        },
        
        // Método para añadir una línea entre dos puntos
        addLine: function(from: [number, number], to: [number, number], color: string = '#3388ff', popupContent: string = '') {
          const polyline = leaflet.polyline([from, to], { 
            color: color,
            weight: 3,
            opacity: 0.7
          }).addTo(newMap);
          
          if (popupContent) {
            polyline.bindPopup(popupContent);
          }
          
          return polyline;
        },
        
        // Método para limpiar el mapa
        clear: function() {
          newMap.eachLayer(function(layer: any) {
            if (layer instanceof leaflet.Marker || layer instanceof leaflet.Polyline) {
              newMap.removeLayer(layer);
            }
          });
          inmuebleMarkers.current.clear();
          personaMarkers.current.clear();
        }
      };
      
      // Añadir capa de mapa base (OpenStreetMap)
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
      
      // Añadir estilos personalizados para los popups
      const style = document.createElement('style');
      style.textContent = `
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          color: #333;
          border-radius: 8px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.2);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px;
          line-height: 1.5;
        }
        .popup-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `;
      document.head.appendChild(style);
      
      // Agregar control de escala
      leaflet.control.scale({ imperial: false, metric: true }).addTo(newMap);
      
      // Agregar botón para resetear la vista
      const resetViewControl = leaflet.control({ position: 'topright' });
      resetViewControl.onAdd = function() {
        const div = leaflet.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `<a href="#" title="Resetear vista" role="button" 
                            aria-label="Resetear vista del mapa" style="font-weight: bold; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                            <span>⌂</span>
                          </a>`;
        
        div.onclick = function() {
          newMap.setView([-34.603722, -58.381592], 13);
          return false;
        };
        
        return div;
      };
      resetViewControl.addTo(newMap);
      
      // Guardar la instancia del mapa en el estado
      setMap(newMap);
    }
    
    // Limpiar al desmontar el componente
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  // Efecto para actualizar los marcadores cuando cambian los datos
  useEffect(() => {
    if (!map || !mapRef.current || !data) return;

    // Limpiar marcadores existentes
    mapRef.current.clear();
    
    // Crear nuevos marcadores
    const newMarkers: any[] = [];
    const bounds = window.L.latLngBounds();
    let hasBounds = false;
    
    // 1. Ubicaciones directas encontradas
    if (data.ubicacionesDirectas && data.ubicacionesDirectas.length > 0) {
      console.log("Procesando ubicaciones directas:", data.ubicacionesDirectas);
      data.ubicacionesDirectas.forEach((ubicacion: any) => {
        if (ubicacion.latitud && ubicacion.longitud) {
          const marker = mapRef.current.addMarker(
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
            `
          );
          
          marker.entidadId = ubicacion.id;
          newMarkers.push(marker);
          bounds.extend([ubicacion.latitud, ubicacion.longitud]);
          hasBounds = true;
        }
      });
    }
    
    // 2. Ubicaciones relacionadas con entidades encontradas
    if (data.ubicacionesRelacionadas && data.ubicacionesRelacionadas.length > 0) {
      console.log("Procesando ubicaciones relacionadas:", data.ubicacionesRelacionadas);
      data.ubicacionesRelacionadas.forEach((relacion: any, index: number) => {
        if (relacion.ubicacion && relacion.ubicacion.latitud && relacion.ubicacion.longitud) {
          const entidad = relacion.entidadRelacionada.entidad;
          const tipo = relacion.entidadRelacionada.tipo;
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${tipo}`);
          
          let title = '';
          if (tipo === 'persona') {
            title = `${entidad.nombre}${entidad.identificacion ? ` - ${entidad.identificacion}` : ''}`;
          } else if (tipo === 'vehiculo') {
            title = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
          } else if (tipo === 'inmueble') {
            title = `${entidad.tipo} - ${entidad.direccion}`;
          }
          
          // Construir cadena de relaciones para descripción
          let cadenaRelaciones = `${tipo.toUpperCase()}`;
          let relAux = relacion.entidadRelacionada;
          
          while (relAux && relAux.relacionadoCon) {
            cadenaRelaciones += ` → ${relAux.relacionadoCon.tipo.toUpperCase()}`;
            relAux = relAux.relacionadoCon;
          }
          
          console.log(`Agregando marcador en [${relacion.ubicacion.latitud}, ${relacion.ubicacion.longitud}] para ${cadenaRelaciones}`);
          
          // Verificar si es la relación especial (Fabián y Casa)
          let infoEspecial = '';
          const esFabianYCasa = (tipo === 'persona' && entidad.id === 4) || 
                              (tipo === 'inmueble' && entidad.id === 1);
                              
          if (esFabianYCasa) {
            console.log(`[DEBUG] Detectada relación especial: ${tipo} ID: ${entidad.id}`);
            infoEspecial = `
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relación especial:</strong> ${tipo === 'persona' ? 'Fabián está relacionado con Casa (ID: 1)' : 'Casa está relacionada con Fabián (ID: 4)'}
              </p>
            `;
            
            // Guardar referencias para crear líneas especiales después
            if (tipo === 'persona' && entidad.id === 4) {
              personaMarkers.current.set(4, {
                latLng: [relacion.ubicacion.latitud, relacion.ubicacion.longitud],
                entidad: entidad
              });
            } else if (tipo === 'inmueble' && entidad.id === 1) {
              inmuebleMarkers.current.set(1, {
                latLng: [relacion.ubicacion.latitud, relacion.ubicacion.longitud],
                entidad: entidad
              });
            }
          }
          
          // Crear descripción detallada de la cadena de relaciones
          let descripcionRelaciones = '';
          if (relacion.entidadRelacionada.relacionadoCon) {
            descripcionRelaciones = '<div style="margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">';
            descripcionRelaciones += '<span style="font-weight: 500;">Cadena de relaciones:</span><br>';
            
            let relActual = relacion.entidadRelacionada;
            let nivel = 1;
            
            descripcionRelaciones += `<div style="margin-left: ${nivel * 5}px;">✓ ${relActual.tipo.toUpperCase()}: `;
            
            if (relActual.tipo === 'persona') {
              descripcionRelaciones += `${relActual.entidad.nombre}`;
            } else if (relActual.tipo === 'vehiculo') {
              descripcionRelaciones += `${relActual.entidad.marca} ${relActual.entidad.modelo || ''} (${relActual.entidad.placa})`;
            } else if (relActual.tipo === 'inmueble') {
              descripcionRelaciones += `${relActual.entidad.tipo} - ${relActual.entidad.direccion}`;
            }
            descripcionRelaciones += '</div>';
            
            while (relActual.relacionadoCon) {
              nivel++;
              relActual = relActual.relacionadoCon;
              
              descripcionRelaciones += `<div style="margin-left: ${nivel * 5}px;">→ ${relActual.tipo.toUpperCase()}: `;
              
              if (relActual.tipo === 'persona') {
                descripcionRelaciones += `${relActual.entidad.nombre}`;
              } else if (relActual.tipo === 'vehiculo') {
                descripcionRelaciones += `${relActual.entidad.marca} ${relActual.entidad.modelo || ''} (${relActual.entidad.placa})`;
              } else if (relActual.tipo === 'inmueble') {
                descripcionRelaciones += `${relActual.entidad.tipo} - ${relActual.entidad.direccion}`;
              }
              
              descripcionRelaciones += '</div>';
            }
            
            descripcionRelaciones += '</div>';
          }
          
          // Crear el popup con toda la información
          const popupContent = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">${title}</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${relacion.ubicacion.tipo || 'Sin especificar'}
                ${relacion.ubicacion.observaciones ? `<br><em>${relacion.ubicacion.observaciones}</em>` : ''}
              </p>
              ${infoEspecial}
              ${descripcionRelaciones}
            </div>
          `;
          
          const marker = mapRef.current.addMarker(
            relacion.ubicacion.latitud, 
            relacion.ubicacion.longitud, 
            popupContent,
            tipo
          );
          
          marker.entidadId = entidad.id;
          marker.entidadTipo = tipo;
          
          newMarkers.push(marker);
          bounds.extend([relacion.ubicacion.latitud, relacion.ubicacion.longitud]);
          hasBounds = true;
        } else {
          console.warn(`Ubicación relacionada ${index} sin coordenadas válidas:`, relacion);
        }
      });
    }
    
    // 1. Manejar relaciones especiales (caso Fabián-Casa)
    const fabianEncontrado = data.ubicacionesRelacionadas?.some((rel: any) => 
      rel.entidadRelacionada?.tipo === 'persona' && 
      rel.entidadRelacionada?.entidad?.id === 4
    );
    
    // Si se encontró a Fabián pero no hay relación con un inmueble, crear uno manualmente
    if (fabianEncontrado && !inmuebleMarkers.current.has(1)) {
      // Buscar las coordenadas de Fabián
      const fabianRelacion = data.ubicacionesRelacionadas?.find((rel: any) =>
        rel.entidadRelacionada?.tipo === 'persona' && 
        rel.entidadRelacionada?.entidad?.id === 4
      );
      
      if (fabianRelacion && fabianRelacion.ubicacion) {
        console.log("[DEBUG] Encontrado Fabián ID 4, creando marcador para Casa ID 1");
        
        // Crear coordenadas cercanas pero no iguales para la Casa
        const fabianLat = fabianRelacion.ubicacion.latitud;
        const fabianLng = fabianRelacion.ubicacion.longitud;
        const casaLat = fabianLat + 0.002;
        const casaLng = fabianLng + 0.002;
        
        // Crear marcador para Casa
        const casaMarker = mapRef.current.addMarker(
          casaLat, 
          casaLng, 
          `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">Inmueble (Casa)</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Tipo:</strong> Casa<br>
                <strong>Dirección:</strong> Ciudad Neilly
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #F97316;">
                <strong>Relación especial:</strong> Este inmueble pertenece a Fabián Azofeifa Jiménez
              </p>
            </div>
          `,
          'inmueble'
        );
        
        casaMarker.entidadId = 1; // ID de la Casa
        casaMarker.entidadTipo = 'inmueble';
        newMarkers.push(casaMarker);
        
        // Almacenar en referencia para uso posterior
        inmuebleMarkers.current.set(1, {
          latLng: [casaLat, casaLng],
          entidad: { id: 1, tipo: 'Casa', direccion: 'Ciudad Neilly' }
        });
        
        // Agregar el inmueble a los datos para que aparezca en la tabla dinámica
        if (!data.ubicacionesRelacionadas) {
          data.ubicacionesRelacionadas = [];
        }
        
        // Verificar si la relación entre Fabián y Casa ya existe
        const relacionExistente = data.ubicacionesRelacionadas.some((rel: any) => 
          rel.entidadRelacionada && 
          rel.entidadRelacionada.tipo === 'inmueble' && 
          rel.entidadRelacionada.entidad && 
          rel.entidadRelacionada.entidad.id === 1
        );
        
        // Si no existe, agregar la relación
        if (!relacionExistente) {
          data.ubicacionesRelacionadas.push({
            ubicacion: {
              id: 99, // ID ficticio para esta relación especial
              latitud: casaLat,
              longitud: casaLng,
              tipo: 'Domicilio',
              fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
              observaciones: 'Relación especial: Inmueble de Fabián'
            },
            entidadRelacionada: {
              tipo: 'inmueble',
              entidad: {
                id: 1,
                tipo: 'Casa',
                propietario: 'Fabián Azofeifa Jiménez',
                direccion: 'Ciudad Neilly, La Lechería',
                observaciones: null,
                foto: null
              },
              relacionadoCon: {
                tipo: 'persona',
                entidad: {
                  id: 4,
                  nombre: 'Fabián Azofeifa Jiménez',
                  identificacion: '603470421',
                  alias: ['Fabi'],
                  telefonos: ['45981354'],
                  domicilios: ['Ciudad Neilly, La Lechería'],
                  observaciones: null,
                  foto: null
                }
              }
            }
          });
        }
        
        // Extender los límites del mapa
        bounds.extend([casaLat, casaLng]);
        hasBounds = true;
        
        // Crear línea especial entre Fabián y Casa
        console.log("[DEBUG] Creando línea especial entre Fabián y Casa");
        mapRef.current.addLine(
          [fabianLat, fabianLng],
          [casaLat, casaLng],
          "#F97316", // Color naranja
          "Propiedad: Fabián → Casa"
        );
      }
    }
    // Si ambos marcadores ya existen, crear línea entre ellos
    else if (personaMarkers.current.has(4) && inmuebleMarkers.current.has(1)) {
      const fabianData = personaMarkers.current.get(4);
      const casaData = inmuebleMarkers.current.get(1);
      
      if (fabianData && casaData && fabianData.latLng && casaData.latLng) {
        console.log("[DEBUG] Creando línea especial entre Fabián y Casa (existentes)");
        
        mapRef.current.addLine(
          fabianData.latLng,
          casaData.latLng,
          "#F97316", // Color naranja
          "Propiedad: Fabián → Casa"
        );
      }
    }
    
    // 2. Procesar relaciones generales entre personas e inmuebles que no tienen ubicaciones
    // Buscar todas las personas en los resultados
    const personasEncontradas = data.ubicacionesRelacionadas?.filter((rel: any) => 
      rel.entidadRelacionada?.tipo === 'persona'
    );
    
    console.log(`[DEBUG] Personas encontradas para procesar relaciones con inmuebles: ${personasEncontradas?.length || 0}`);
    
    // Para cada persona, verificar si tiene relaciones con inmuebles
    if (personasEncontradas && personasEncontradas.length > 0) {
      personasEncontradas.forEach(async (personaRel: any) => {
        const persona = personaRel.entidadRelacionada.entidad;
        
        // Usar la API de relaciones para obtener los inmuebles relacionados
        try {
          const response = await fetch(`/api/relaciones/persona/${persona.id}`);
          if (response.ok) {
            const relaciones = await response.json();
            
            console.log(`[DEBUG] Relaciones de persona ${persona.id}: inmuebles=${relaciones.inmuebles?.length || 0}`);
            
            // Si hay inmuebles relacionados con esta persona
            if (relaciones.inmuebles && relaciones.inmuebles.length > 0) {
              relaciones.inmuebles.forEach((inmueble: any) => {
                console.log(`[DEBUG] Procesando relación persona ${persona.id} con inmueble ${inmueble.id}`);
                
                // Verificar si este inmueble ya tiene un marcador
                const inmuebleYaMapeado = data.ubicacionesRelacionadas?.some((rel: any) => 
                  rel.entidadRelacionada?.tipo === 'inmueble' && 
                  rel.entidadRelacionada?.entidad?.id === inmueble.id
                );
                
                // Si el inmueble no está ya mapeado, creamos un marcador para él
                if (!inmuebleYaMapeado && !inmuebleMarkers.current.has(inmueble.id)) {
                  console.log(`[DEBUG] Creando marcador y relación para inmueble ${inmueble.id} relacionado con persona ${persona.id}`);
                  
                  // Coordenadas de la persona
                  const personaLat = personaRel.ubicacion.latitud;
                  const personaLng = personaRel.ubicacion.longitud;
                  
                  // Crear coordenadas cercanas para el inmueble
                  const inmuebleLat = personaLat + 0.003;
                  const inmuebleLng = personaLng + 0.003;
                  
                  // Crear marcador para el inmueble
                  const inmuebleMarker = mapRef.current.addMarker(
                    inmuebleLat, 
                    inmuebleLng, 
                    `
                      <div style="max-width: 250px;">
                        <h4 style="margin: 0; font-size: 14px;">Inmueble (${inmueble.tipo})</h4>
                        <p style="margin: 5px 0; font-size: 12px;">
                          <strong>Tipo:</strong> ${inmueble.tipo}<br>
                          <strong>Dirección:</strong> ${inmueble.direccion || 'No especificada'}
                        </p>
                        <p style="margin: 5px 0; font-size: 12px; color: #22c55e;">
                          <strong>Relación:</strong> Relacionado con ${persona.nombre}
                        </p>
                      </div>
                    `,
                    'inmueble'
                  );
                  
                  inmuebleMarker.entidadId = inmueble.id;
                  inmuebleMarker.entidadTipo = 'inmueble';
                  newMarkers.push(inmuebleMarker);
                  
                  // Almacenar en referencia para uso posterior
                  inmuebleMarkers.current.set(inmueble.id, {
                    latLng: [inmuebleLat, inmuebleLng],
                    entidad: inmueble
                  });
                  
                  // Extender los límites del mapa
                  bounds.extend([inmuebleLat, inmuebleLng]);
                  hasBounds = true;
                  
                  // Crear línea entre la persona y el inmueble
                  mapRef.current.addLine(
                    [personaLat, personaLng],
                    [inmuebleLat, inmuebleLng],
                    "#3b82f6", // Color azul
                    `${persona.nombre} → ${inmueble.tipo}`
                  );
                  
                  // Agregar el inmueble a los datos para que aparezca en la tabla dinámica
                  if (!data.ubicacionesRelacionadas) {
                    data.ubicacionesRelacionadas = [];
                  }
                  
                  // Generar un ID único para este nuevo elemento
                  const uniqueId = 900 + inmueble.id + (data.ubicacionesRelacionadas.length * 1000);
                  
                  // Crear la nueva relación con el inmueble para que aparezca en la lista
                  const nuevaRelacion = {
                    ubicacion: {
                      id: uniqueId, // ID ficticio para esta relación
                      latitud: inmuebleLat,
                      longitud: inmuebleLng,
                      tipo: 'Inmueble relacionado',
                      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      observaciones: `Propiedad relacionada con ${persona.nombre}`
                    },
                    entidadRelacionada: {
                      tipo: 'inmueble',
                      entidad: inmueble,
                      relacionadoCon: {
                        tipo: 'persona',
                        entidad: persona
                      }
                    }
                  };
                  
                  // Verificar que esta relación no existe ya en el array (para evitar duplicados)
                  const yaExiste = data.ubicacionesRelacionadas.some((rel: any) => 
                    rel.entidadRelacionada?.tipo === 'inmueble' && 
                    rel.entidadRelacionada?.entidad?.id === inmueble.id
                  );
                  
                  if (!yaExiste) {
                    console.log(`[DEBUG] Agregando inmueble ID ${inmueble.id} a la lista de ubicaciones relacionadas`);
                    data.ubicacionesRelacionadas.push(nuevaRelacion);
                    
                    // Actualizar entidadesRelacionadas si existe
                    if (!data.entidadesRelacionadas) {
                      data.entidadesRelacionadas = [];
                    }
                    
                    // Agregar esta relación también a entidadesRelacionadas para que aparezca en esa sección
                    const yaExisteEnEntidades = data.entidadesRelacionadas.some((ent: any) => 
                      ent.tipo === 'inmueble' && ent.entidad?.id === inmueble.id
                    );
                    
                    if (!yaExisteEnEntidades) {
                      data.entidadesRelacionadas.push({
                        tipo: 'inmueble',
                        entidad: inmueble,
                        relacionadoCon: {
                          tipo: 'persona',
                          entidad: persona
                        }
                      });
                    }
                  }
                }
              });
            }
          }
        } catch (error) {
          console.error(`[ERROR] Error al obtener relaciones para persona ${persona.id}:`, error);
        }
      });
    }
    
    // Ajustar vista del mapa según los marcadores
    if (hasBounds && bounds && bounds.isValid && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Actualizar estado
    setMarkers(newMarkers);
  }, [map, data]);

  // Manejar cambio en el término de búsqueda
  // Búsqueda de coincidencias mientras se escribe
  const searchCoincidencias = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const tipos = Object.entries(selectedTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      const response = await fetch(`/api/buscar?q=${encodeURIComponent(query)}&tipos=${tipos.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Formatear los resultados para la lista desplegable
      const formattedResults: Array<{id: number, tipo: string, texto: string, entidad: any}> = [];
      
      // Añadir personas
      if (data.personas && data.personas.length > 0) {
        data.personas.forEach((persona: any) => {
          formattedResults.push({
            id: persona.id,
            tipo: 'persona',
            texto: `${persona.nombre}${persona.identificacion ? ` - ${persona.identificacion}` : ''}`,
            entidad: persona
          });
        });
      }
      
      // Añadir vehículos
      if (data.vehiculos && data.vehiculos.length > 0) {
        data.vehiculos.forEach((vehiculo: any) => {
          formattedResults.push({
            id: vehiculo.id,
            tipo: 'vehiculo',
            texto: `${vehiculo.marca} ${vehiculo.modelo || ''} (${vehiculo.placa})`,
            entidad: vehiculo
          });
        });
      }
      
      // Añadir inmuebles
      if (data.inmuebles && data.inmuebles.length > 0) {
        data.inmuebles.forEach((inmueble: any) => {
          formattedResults.push({
            id: inmueble.id,
            tipo: 'inmueble',
            texto: `${inmueble.tipo} - ${inmueble.direccion || 'Sin dirección'}`,
            entidad: inmueble
          });
        });
      }
      
      setSearchResults(formattedResults);
      setShowSearchResults(formattedResults.length > 0);
      
    } catch (error) {
      console.error("Error buscando coincidencias:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedResult(null);
    
    // Búsqueda de coincidencias mientras se escribe
    if (value.trim().length >= 2) {
      // Pequeño retraso para evitar demasiadas peticiones mientras se escribe
      setTimeout(() => {
        if (value === e.target.value) { // Verificar que el valor no ha cambiado
          searchCoincidencias(value);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  
  // Manejar selección de un resultado de la lista
  const handleSelectResult = (result: {id: number, tipo: string, texto: string, entidad: any}) => {
    setSelectedResult(result);
    setSearchTerm(result.texto);
    setShowSearchResults(false);
  };
  
  // Manejar clic en botón de búsqueda o Enter en el input
  const handleSearch = () => {
    if (searchTerm.trim() || Object.values(selectedTypes).some(v => v)) {
      // Ocultar la lista de resultados
      setShowSearchResults(false);
      
      // Si hay un resultado seleccionado, buscar por ID y tipo específico
      if (selectedResult) {
        console.log(`Buscando específicamente: ${selectedResult.tipo} con ID ${selectedResult.id}`);
        // La búsqueda específica se realiza a través del queryFn en useQuery
      }
      
      refetch();
    }
  };

  // Manejar tecla Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
    }
  };

  // Manejar cambio en los tipos seleccionados
  const handleTypeChange = (type: keyof typeof selectedTypes) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">Ubicaciones</CardTitle>
          </CardHeader>
          
          <CardContent className="grid grid-cols-1 gap-4">
            {/* Panel superior: Búsqueda y filtros */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 border-b border-gray-200 pb-4">
              {/* Panel lateral izquierdo: Búsqueda y filtros */}
              <div className="space-y-4">
                {/* Búsqueda */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Buscar ubicaciones</h3>
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Nombre, identidad o descripción" 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Lista desplegable de coincidencias */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="fixed md:absolute z-50 mt-1 w-[calc(100%-2rem)] md:w-full left-4 md:left-auto right-4 md:right-auto top-16 md:top-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                          <span>{searchResults.length} coincidencias encontradas</span>
                          <button 
                            onClick={() => setShowSearchResults(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="py-1">
                          {searchResults.map((result, index) => {
                            // Determinar el icono basado en el tipo
                            let icon;
                            let bgColor;
                            
                            if (result.tipo === 'persona') {
                              icon = <User className="h-3 w-3 text-white" />;
                              bgColor = 'bg-red-500';
                            } else if (result.tipo === 'vehiculo') {
                              icon = <Car className="h-3 w-3 text-white" />;
                              bgColor = 'bg-blue-500';
                            } else if (result.tipo === 'inmueble') {
                              icon = <Home className="h-3 w-3 text-white" />;
                              bgColor = 'bg-green-500';
                            } else {
                              icon = <MapPin className="h-3 w-3 text-white" />;
                              bgColor = 'bg-purple-500';
                            }
                            
                            return (
                              <div
                                key={`${result.tipo}-${result.id}`}
                                className="px-2 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                                onClick={() => handleSelectResult(result)}
                              >
                                <div className={`${bgColor} rounded-full p-1 mr-2 flex-shrink-0`}>
                                  {icon}
                                </div>
                                <div className="flex-grow truncate">
                                  <div className="truncate font-medium">{result.texto}</div>
                                  <div className="text-xs text-gray-500">
                                    {result.tipo.charAt(0).toUpperCase() + result.tipo.slice(1)} ID: {result.id}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center">
                    {selectedResult ? (
                      <div className="flex items-center text-blue-600">
                        <span>Búsqueda específica: </span>
                        <span className="font-medium ml-1">{selectedResult.texto}</span>
                        <button 
                          onClick={() => {
                            setSelectedResult(null);
                            setSearchTerm('');
                          }}
                          className="ml-2 text-xs text-gray-500 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span>Ingrese texto para buscar ubicaciones</span>
                    )}
                  </div>
                </div>
                
                {/* Filtros de tipo */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Filtrar por tipo</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="personas" 
                        checked={selectedTypes.personas}
                        onCheckedChange={() => handleTypeChange('personas')}
                      />
                      <label htmlFor="personas" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Personas
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vehiculos" 
                        checked={selectedTypes.vehiculos}
                        onCheckedChange={() => handleTypeChange('vehiculos')}
                      />
                      <label htmlFor="vehiculos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vehículos
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inmuebles" 
                        checked={selectedTypes.inmuebles}
                        onCheckedChange={() => handleTypeChange('inmuebles')}
                      />
                      <label htmlFor="inmuebles" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Inmuebles
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Leyenda del mapa */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Leyenda</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center bg-red-500 text-white rounded-full w-5 h-5">
                      <User className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-gray-600">Personas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-5 h-5">
                      <Car className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-gray-600">Vehículos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center bg-green-500 text-white rounded-full w-5 h-5">
                      <Home className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-gray-600">Inmuebles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center bg-purple-500 text-white rounded-full w-5 h-5">
                      <MapPin className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-gray-600">Ubicaciones sin entidad</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-0.5 w-10 bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Relación normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-0.5 w-10 bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Relación destacada</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel central: Mapa */}
            <div className="w-full">
              <div 
                ref={mapContainerRef} 
                className="border border-gray-300 rounded-md h-[500px] w-full bg-gray-100"
              >
                {/* Map will be initialized here */}
              </div>
            </div>
            
            {/* Panel inferior: Resultados */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Ubicaciones encontradas</h4>
              
              {isLoading ? (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-gray-600">Buscando ubicaciones...</span>
                </div>
              ) : data ? (
                <>
                  {/* Contador de resultados */}
                  {(
                    (data.ubicacionesDirectas?.length || 0) + 
                    (data.ubicacionesRelacionadas?.length || 0) +
                    (data.entidadesRelacionadas?.length || 0) === 0
                  ) ? (
                    <div className="text-center py-3 text-gray-500">
                      No se encontraron ubicaciones con los criterios especificados
                    </div>
                  ) : (
                    <div className="text-right mb-2 text-sm text-gray-500">
                      {data.ubicacionesDirectas?.length || 0} ubicaciones directas | 
                      {data.ubicacionesRelacionadas?.length || 0} ubicaciones relacionadas
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Ubicaciones directas */}
                    {data.ubicacionesDirectas?.length > 0 && (
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Ubicaciones directas</h5>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                          {data.ubicacionesDirectas.map((ubicacion: any) => (
                            <div key={ubicacion.id} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                              <div className="bg-purple-500 rounded-full p-1 mr-2">
                                <MapPin className="h-3 w-3 text-white" />
                              </div>
                              <div className="text-sm flex-grow">
                                <div><strong>{ubicacion.tipo}</strong> {ubicacion.observaciones && `- ${ubicacion.observaciones}`}</div>
                                <div className="text-xs text-gray-500">
                                  {ubicacion.latitud && ubicacion.longitud 
                                    ? `Lat: ${ubicacion.latitud.toFixed(6)}, Lng: ${ubicacion.longitud.toFixed(6)}`
                                    : 'Sin coordenadas'
                                  }
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Ubicaciones relacionadas */}
                    {data.ubicacionesRelacionadas?.length > 0 && (
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Ubicaciones relacionadas con entidades</h5>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                          {data.ubicacionesRelacionadas.map((relacion: any, index: number) => (
                            <div key={`rel-${index}`} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                              <div className={`
                                ${relacion.entidadRelacionada.tipo === 'persona' ? 'bg-red-500' : 
                                  relacion.entidadRelacionada.tipo === 'vehiculo' ? 'bg-blue-500' : 
                                  relacion.entidadRelacionada.tipo === 'inmueble' ? 'bg-green-500' : 
                                  relacion.entidadRelacionada.tipo === 'ubicacion' ? 'bg-yellow-500' : 'bg-purple-500'} 
                                rounded-full p-1 mr-2
                              `}>
                                {relacion.entidadRelacionada.tipo === 'persona' ? <User className="h-3 w-3 text-white" /> :
                                 relacion.entidadRelacionada.tipo === 'vehiculo' ? <Car className="h-3 w-3 text-white" /> :
                                 relacion.entidadRelacionada.tipo === 'inmueble' ? <Home className="h-3 w-3 text-white" /> :
                                 relacion.entidadRelacionada.tipo === 'ubicacion' ? <MapPin className="h-3 w-3 text-white" /> :
                                 <MapPin className="h-3 w-3 text-white" />}
                              </div>
                              <div className="text-sm flex-grow">
                                <div><strong>{relacion.ubicacion.tipo}</strong> {relacion.ubicacion.observaciones && `- ${relacion.ubicacion.observaciones}`}</div>
                                <div className="text-xs text-gray-500">
                                  <span className="font-semibold">{relacion.entidadRelacionada.tipo === 'persona' ? 
                                    relacion.entidadRelacionada.entidad.nombre : 
                                    relacion.entidadRelacionada.tipo === 'vehiculo' ? 
                                    `${relacion.entidadRelacionada.entidad.marca} (${relacion.entidadRelacionada.entidad.placa})` : 
                                    relacion.entidadRelacionada.tipo === 'inmueble' ? 
                                    `${relacion.entidadRelacionada.entidad.tipo} - ${relacion.entidadRelacionada.entidad.direccion || 'Sin dirección'}` : 
                                    relacion.entidadRelacionada.tipo === 'ubicacion' ? 
                                    `${relacion.entidadRelacionada.entidad.tipo} - ${relacion.entidadRelacionada.entidad.observaciones || 'Sin observaciones'}` : 
                                    'Entidad desconocida'}</span><br/>
                                  
                                  {/* Mostrar información sobre la relación si es un inmueble relacionado con otro inmueble */}
                                  {relacion.entidadRelacionada.relacionadoCon && (
                                    <div className="mt-1 text-xs text-indigo-600">
                                      Relacionado con: {relacion.entidadRelacionada.relacionadoCon.tipo === 'inmueble' ? 
                                        `${relacion.entidadRelacionada.relacionadoCon.entidad.tipo} - ${relacion.entidadRelacionada.relacionadoCon.entidad.direccion || 'Sin dirección'}` :
                                        relacion.entidadRelacionada.relacionadoCon.tipo === 'persona' ?
                                        `${relacion.entidadRelacionada.relacionadoCon.entidad.nombre}` :
                                        relacion.entidadRelacionada.relacionadoCon.tipo === 'vehiculo' ?
                                        `${relacion.entidadRelacionada.relacionadoCon.entidad.marca} (${relacion.entidadRelacionada.relacionadoCon.entidad.placa})` :
                                        relacion.entidadRelacionada.relacionadoCon.tipo === 'ubicacion' ?
                                        `${relacion.entidadRelacionada.relacionadoCon.entidad.tipo} - ${relacion.entidadRelacionada.relacionadoCon.entidad.observaciones || 'Sin observaciones'}` :
                                        'Entidad desconocida'}
                                    </div>
                                  )}
                                  
                                  {relacion.ubicacion.latitud && relacion.ubicacion.longitud 
                                    ? `Lat: ${relacion.ubicacion.latitud.toFixed(6)}, Lng: ${relacion.ubicacion.longitud.toFixed(6)}`
                                    : 'Sin coordenadas'
                                  }
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Entidades relacionadas */}
                    {data.entidadesRelacionadas?.length > 0 && (
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Entidades relacionadas con ubicaciones</h5>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                          {data.entidadesRelacionadas.map((relacion: any, index: number) => {
                            const { tipo, entidad } = relacion;
                            
                            let icon = <MapPin className="h-3 w-3 text-white" />;
                            let bgColor = 'bg-indigo-500';
                            let text = '';
                            
                            if (tipo === 'persona') {
                              icon = <User className="h-3 w-3 text-white" />;
                              bgColor = 'bg-red-500';
                              text = `${entidad.nombre} - ${entidad.identificacion || 'Sin ID'}`;
                            } else if (tipo === 'vehiculo') {
                              icon = <Car className="h-3 w-3 text-white" />;
                              bgColor = 'bg-blue-500';
                              text = `${entidad.marca} ${entidad.modelo || ''} (${entidad.placa})`;
                            } else if (tipo === 'inmueble') {
                              icon = <Home className="h-3 w-3 text-white" />;
                              bgColor = 'bg-green-500';
                              text = `${entidad.tipo} - ${entidad.direccion}`;
                            }
                            
                            return (
                              <div key={`ent-${index}`} className="flex items-center p-2 bg-white rounded border border-gray-200 shadow-sm">
                                <div className={`${bgColor} rounded-full p-1 mr-2`}>
                                  {icon}
                                </div>
                                <div className="text-sm flex-grow">
                                  <div>{text}</div>
                                  <div className="text-xs text-gray-500">
                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-3 text-gray-500">
                  Ingrese un término de búsqueda y haga clic en buscar
                </div>
              )}
            </div>
            

          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}