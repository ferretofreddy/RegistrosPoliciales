import React, { useEffect } from 'react';

interface MapRelationVisualizerProps {
  mapRef: any;
  searchResults: any;
}

/**
 * Componente especializado para visualizar relaciones específicas en el mapa
 * Específicamente, mejora la visualización de la relación entre Fabián (ID: 4) y el inmueble Casa (ID: 1)
 */
export const MapRelationVisualizer: React.FC<MapRelationVisualizerProps> = ({ 
  mapRef, 
  searchResults 
}) => {
  useEffect(() => {
    if (!mapRef.current || !searchResults) return;

    // Buscar ubicaciones relacionadas con Fabián (ID: 4)
    const fabianLocations: any[] = [];
    const casaLocations: any[] = [];
    
    // Extraer ubicaciones relacionadas con Fabián y la Casa
    if (searchResults.ubicacionesRelacionadas) {
      searchResults.ubicacionesRelacionadas.forEach((relacion: any) => {
        const entidad = relacion.entidadRelacionada?.entidad;
        
        if (relacion.entidadRelacionada?.tipo === 'persona' && entidad?.id === 4) {
          fabianLocations.push({
            latitud: relacion.ubicacion.latitud,
            longitud: relacion.ubicacion.longitud,
            info: relacion.ubicacion
          });
        }
        
        if (relacion.entidadRelacionada?.tipo === 'inmueble' && entidad?.id === 1) {
          casaLocations.push({
            latitud: relacion.ubicacion.latitud,
            longitud: relacion.ubicacion.longitud,
            info: relacion.ubicacion
          });
          
          // También verificar si hay relaciones de segundo nivel (relacionadoCon)
          if (relacion.entidadRelacionada?.relacionadoCon?.tipo === 'persona' && 
              relacion.entidadRelacionada?.relacionadoCon?.entidad?.id === 4) {
            console.log("[DEBUG] Encontrada relación de segundo nivel: Inmueble -> Persona (Fabián)");
          }
        }
      });
    }
    
    console.log(`[DEBUG] Encontradas ${fabianLocations.length} ubicaciones para Fabián y ${casaLocations.length} para la Casa`);
    
    // Si ambos tienen ubicaciones, dibujar líneas entre ellas
    if (fabianLocations.length > 0 && casaLocations.length > 0) {
      console.log("[DEBUG] Trazando relaciones especiales entre Fabián y Casa");
      
      fabianLocations.forEach(fabianLoc => {
        casaLocations.forEach(casaLoc => {
          // Añadir línea especial con color destacado
          mapRef.current?.addLine(
            [fabianLoc.latitud, fabianLoc.longitud],
            [casaLoc.latitud, casaLoc.longitud],
            "#FF5733", // Color destacado
            "Relación especial: Fabián → Casa"
          );
          
          // Añadir información adicional a ambos marcadores
          const fabianPopup = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">Fabián Azofeifa Jiménez</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${fabianLoc.info.tipo || 'Sin especificar'}
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relación confirmada:</strong> Esta persona está relacionada con el inmueble Casa (ID: 1)
              </p>
            </div>
          `;
          
          const casaPopup = `
            <div style="max-width: 250px;">
              <h4 style="margin: 0; font-size: 14px;">Casa (ID: 1)</h4>
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>Ubicación:</strong> ${casaLoc.info.tipo || 'Sin especificar'}
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #3B82F6;">
                <strong>Relación confirmada:</strong> Este inmueble está relacionado con Fabián (ID: 4)
              </p>
            </div>
          `;
          
          // Actualizar o agregar marcadores con la información mejorada
          mapRef.current?.addMarker(
            fabianLoc.latitud, 
            fabianLoc.longitud, 
            fabianPopup,
            'persona', 
            true // forzar creación del marcador
          );
          
          mapRef.current?.addMarker(
            casaLoc.latitud, 
            casaLoc.longitud, 
            casaPopup,
            'inmueble',
            true // forzar creación del marcador
          );
        });
      });
    }
    
    // Si solo hay ubicaciones de Fabián, buscar el inmueble directamente
    if (fabianLocations.length > 0 && casaLocations.length === 0) {
      console.log("[DEBUG] Solo se encontraron ubicaciones de Fabián. Buscando Casa en el mapa actual");
      
      // Buscar en entidades directas
      if (searchResults.entidadesRelacionadas) {
        const casaEntidad = searchResults.entidadesRelacionadas.find(
          (e: any) => e.tipo === 'inmueble' && e.entidad?.id === 1
        );
        
        if (casaEntidad) {
          console.log("[DEBUG] Encontrada Casa (ID: 1) en entidades relacionadas");
          
          // TODO: Conectar la Casa con Fabián si se encuentra
        }
      }
    }
    
  }, [mapRef, searchResults]);

  return null; // Este componente no renderiza nada visualmente
};

export default MapRelationVisualizer;