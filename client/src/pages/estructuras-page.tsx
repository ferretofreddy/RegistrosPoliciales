import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import SearchComponent from "@/components/search-component";
import EntityDetails from "@/components/entity-details";
import LocationMap from "@/components/location-map";
import LocationsTable, { LocationData } from "@/components/locations-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Search, Download, FileDown, Printer } from "lucide-react";
import { SearchResult } from "@/components/search-component";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Coordenadas por defecto para el mapa
const DEFAULT_CENTER: [number, number] = [9.9281, -84.0907]; // Costa Rica
const DEFAULT_ZOOM = 7;

// Interfaces para respuestas de API
interface RelacionesResponse {
  personas?: any[];
  vehiculos?: any[];
  inmuebles?: any[];
  ubicaciones?: any[];
  otrasUbicaciones?: any[];
  [key: string]: any;
}

export default function EstructurasPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener datos de la entidad seleccionada
  const { data: entityData } = useQuery<any>({
    queryKey: [selectedResult ? `api/${selectedResult.tipo === "ubicacion" ? "ubicaciones" : selectedResult.tipo + "s"}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Obtener relaciones para buscar ubicaciones
  const { data: relationData } = useQuery<RelacionesResponse>({
    queryKey: [selectedResult ? `api/relaciones/${selectedResult.tipo}/${selectedResult.id}` : null],
    enabled: !!selectedResult
  });

  // Manejar la selección de un resultado de búsqueda
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    console.log("Resultado seleccionado:", result);
    setLocations([]);
  };

  // Manejar clic en una ubicación de la tabla
  const handleLocationClick = (location: LocationData) => {
    setMapCenter([location.lat, location.lng]);
  };

  // Procesar ubicaciones cuando tengamos datos
  useEffect(() => {
    const cargarUbicaciones = async () => {
      if (!selectedResult || !entityData) return;
      
      setIsLoading(true);
      const ubicacionesEncontradas: LocationData[] = [];
      let hasCenteredMap = false;

      try {
        console.log("Procesando entidad:", selectedResult.tipo, entityData);
        console.log("Datos de relaciones:", relationData);
        
        // 1. Procesar según el tipo de entidad
        switch (selectedResult.tipo) {
          case "persona":
            // 1. Ubicaciones directas de la persona consultada (domicilios)
            if (relationData && relationData.ubicaciones) {
              const ubicacionesPersona = relationData.ubicaciones || [];
              
              for (const ubicacion of ubicacionesPersona) {
                // Estas son solo de tipo domicilio
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Domicilio",
                    description: ubicacion.observaciones || `Domicilio de ${selectedResult.nombre}`,
                    type: "ubicacion",
                    relation: "direct",
                    entityId: selectedResult.id
                  });
                  
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            
            // 1.1 Otras ubicaciones de la persona (avistamientos)
            if (relationData && relationData.otrasUbicaciones) {
              const otrasUbicacionesPersona = relationData.otrasUbicaciones || [];
              
              for (const ubicacion of otrasUbicacionesPersona) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Avistamiento",
                    description: ubicacion.observaciones || `${ubicacion.tipo || "Avistamiento"} de ${selectedResult.nombre}`,
                    type: "ubicacion",
                    relation: "related", // Estas son relacionadas, no directas
                    entityId: selectedResult.id
                  });
                  
                  if (!hasCenteredMap && ubicacionesEncontradas.length === 0) {
                    // Solo centramos en avistamientos si no hay domicilios
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }

            // 2. Personas relacionadas con la persona consultada
            if (relationData && relationData.personas && relationData.personas.length > 0) {
              for (const personaRelacionada of relationData.personas) {
                try {
                  // Obtener datos específicos de la persona relacionada
                  const respuestaPersona = await fetch(`/api/relaciones/persona/${personaRelacionada.id}`);
                  const datosPersona = await respuestaPersona.json();
                  
                  // Buscar domicilios de la persona relacionada
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.ubicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Domicilio",
                          description: ubicacionRelacionada.observaciones || `Domicilio de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.nombre})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                  
                  // Buscar avistamientos u otras ubicaciones de la persona relacionada
                  if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                    for (const ubicacionRelacionada of datosPersona.otrasUbicaciones) {
                      const lat = parseFloat(String(ubicacionRelacionada.latitud));
                      const lng = parseFloat(String(ubicacionRelacionada.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacionRelacionada.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacionRelacionada.tipo || "Avistamiento",
                          description: ubicacionRelacionada.observaciones || `${ubicacionRelacionada.tipo || "Avistamiento"} de ${personaRelacionada.nombre} (persona relacionada con ${selectedResult.nombre})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: personaRelacionada.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de persona relacionada:", error);
                }
              }
            }
            
            // 3. Inmuebles relacionados con la persona consultada
            if (relationData && relationData.inmuebles && relationData.inmuebles.length > 0) {
              for (const inmueble of relationData.inmuebles) {
                try {
                  // Obtener datos específicos del inmueble
                  const respuestaInmueble = await fetch(`/api/relaciones/inmueble/${inmueble.id}`);
                  const datosInmueble = await respuestaInmueble.json();
                  
                  if (datosInmueble.ubicaciones && datosInmueble.ubicaciones.length > 0) {
                    for (const ubicacionInmueble of datosInmueble.ubicaciones) {
                      const lat = parseFloat(String(ubicacionInmueble.latitud));
                      const lng = parseFloat(String(ubicacionInmueble.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacionInmueble.id,
                          lat: lat,
                          lng: lng,
                          title: inmueble.tipo || "Inmueble",
                          description: `${inmueble.tipo || "Inmueble"} en ${inmueble.direccion || "dirección desconocida"} (relacionado con ${selectedResult.nombre})`,
                          type: "inmueble",
                          relation: "related",
                          entityId: inmueble.id
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones del inmueble:", error);
                }
              }
            }
            break;
            
          case "inmueble":
            // 1. Ubicaciones directas del inmueble
            if (relationData && relationData.ubicaciones) {
              const ubicacionesInmueble = relationData.ubicaciones || [];
              
              for (const ubicacion of ubicacionesInmueble) {
                const lat = parseFloat(String(ubicacion.latitud));
                const lng = parseFloat(String(ubicacion.longitud));
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  ubicacionesEncontradas.push({
                    id: ubicacion.id,
                    lat: lat,
                    lng: lng,
                    title: ubicacion.tipo || "Inmueble",
                    description: ubicacion.observaciones || `Ubicación de inmueble: ${selectedResult.direccion || selectedResult.nombre}`,
                    type: "inmueble",
                    relation: "direct",
                    entityId: selectedResult.id
                  });
                  
                  if (!hasCenteredMap) {
                    setMapCenter([lat, lng]);
                    hasCenteredMap = true;
                  }
                }
              }
            }
            break;
            
          case "ubicacion":
            // Para las ubicaciones, incluimos la propia ubicación
            if (entityData) {
              const ubicacion = entityData;
              const lat = parseFloat(String(ubicacion.latitud));
              const lng = parseFloat(String(ubicacion.longitud));
              
              if (!isNaN(lat) && !isNaN(lng)) {
                ubicacionesEncontradas.push({
                  id: ubicacion.id,
                  lat: lat,
                  lng: lng,
                  title: ubicacion.tipo || "Ubicación",
                  description: ubicacion.observaciones || "Ubicación",
                  type: "ubicacion",
                  relation: "direct",
                  entityId: selectedResult.id
                });
                
                if (!hasCenteredMap) {
                  setMapCenter([lat, lng]);
                  hasCenteredMap = true;
                }
              }
            }
            break;
            
          case "vehiculo":
            // Los vehículos no tienen ubicaciones directas, solo relaciones
            // Procesamos ubicaciones a través de personas relacionadas
            if (relationData && relationData.personas && relationData.personas.length > 0) {
              for (const persona of relationData.personas) {
                try {
                  const respuesta = await fetch(`/api/relaciones/persona/${persona.id}`);
                  const datosPersona = await respuesta.json();
                  
                  // Domicilios de la persona
                  if (datosPersona.ubicaciones && datosPersona.ubicaciones.length > 0) {
                    for (const ubicacion of datosPersona.ubicaciones) {
                      const lat = parseFloat(String(ubicacion.latitud));
                      const lng = parseFloat(String(ubicacion.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacion.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacion.tipo || "Domicilio",
                          description: `Domicilio de ${persona.nombre} (relacionado con vehículo ${selectedResult.marca} ${selectedResult.modelo})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: persona.id
                        });
                        
                        if (!hasCenteredMap) {
                          setMapCenter([lat, lng]);
                          hasCenteredMap = true;
                        }
                      }
                    }
                  }
                  
                  // Otras ubicaciones de la persona
                  if (datosPersona.otrasUbicaciones && datosPersona.otrasUbicaciones.length > 0) {
                    for (const ubicacion of datosPersona.otrasUbicaciones) {
                      const lat = parseFloat(String(ubicacion.latitud));
                      const lng = parseFloat(String(ubicacion.longitud));
                      
                      if (!isNaN(lat) && !isNaN(lng)) {
                        ubicacionesEncontradas.push({
                          id: ubicacion.id,
                          lat: lat,
                          lng: lng,
                          title: ubicacion.tipo || "Avistamiento",
                          description: `${ubicacion.tipo || "Avistamiento"} de ${persona.nombre} (relacionado con vehículo ${selectedResult.marca} ${selectedResult.modelo})`,
                          type: "ubicacion",
                          relation: "related",
                          entityId: persona.id
                        });
                        
                        if (!hasCenteredMap && ubicacionesEncontradas.length === 0) {
                          setMapCenter([lat, lng]);
                          hasCenteredMap = true;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error al obtener ubicaciones de la persona relacionada con vehículo:", error);
                }
              }
            }
            break;
        }
        
        // Eliminar duplicados por ID
        const uniqueLocations = Array.from(new Map(ubicacionesEncontradas.map(item => [item.id, item])).values());
        setLocations(uniqueLocations);
        
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarUbicaciones();
  }, [selectedResult, entityData, relationData]);

  // Función para exportar a PDF
  const exportToPDF = () => {
    if (!selectedResult) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter' // Tamaño carta: 216 x 279 mm
    });
    
    // Título del reporte
    doc.setFontSize(16);
    doc.text('Informe Estructural', 105, 15, { align: 'center' });
    
    // Información de la entidad
    doc.setFontSize(12);
    let entityTitle = '';
    switch (selectedResult.tipo) {
      case 'persona':
        entityTitle = `Persona: ${selectedResult.nombre}`;
        break;
      case 'vehiculo':
        entityTitle = `Vehículo: ${selectedResult.marca} ${selectedResult.modelo} (${selectedResult.placa})`;
        break;
      case 'inmueble':
        entityTitle = `Inmueble: ${selectedResult.tipo} en ${selectedResult.direccion}`;
        break;
      case 'ubicacion':
        entityTitle = `Ubicación: ${selectedResult.tipo || 'Sin tipo'}`;
        break;
    }
    doc.text(entityTitle, 105, 25, { align: 'center' });
    doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });

    // Información detallada
    doc.setFontSize(11);
    doc.text('Información Detallada', 20, 45);
    
    // Aquí incluiríamos más detalles específicos dependiendo del tipo de entidad
    // Como tabla de información básica
    const entityInfo: any = [];
    switch (selectedResult.tipo) {
      case 'persona':
        if (entityData) {
          entityInfo.push(['Nombre', entityData.nombre || 'N/A']);
          entityInfo.push(['Identificación', entityData.identificacion || 'N/A']);
          if (entityData.alias && entityData.alias.length > 0) {
            entityInfo.push(['Alias', entityData.alias.join(', ') || 'N/A']);
          }
          if (entityData.telefonos && entityData.telefonos.length > 0) {
            entityInfo.push(['Teléfonos', entityData.telefonos.join(', ') || 'N/A']);
          }
        }
        break;
      case 'vehiculo':
        if (entityData) {
          entityInfo.push(['Marca', entityData.marca || 'N/A']);
          entityInfo.push(['Modelo', entityData.modelo || 'N/A']);
          entityInfo.push(['Placa', entityData.placa || 'N/A']);
          entityInfo.push(['Color', entityData.color || 'N/A']);
          entityInfo.push(['Tipo', entityData.tipo || 'N/A']);
        }
        break;
      case 'inmueble':
        if (entityData) {
          entityInfo.push(['Tipo', entityData.tipo || 'N/A']);
          entityInfo.push(['Dirección', entityData.direccion || 'N/A']);
          entityInfo.push(['Propietario', entityData.propietario || 'N/A']);
        }
        break;
      case 'ubicacion':
        if (entityData) {
          entityInfo.push(['Tipo', entityData.tipo || 'N/A']);
          entityInfo.push(['Latitud', entityData.latitud || 'N/A']);
          entityInfo.push(['Longitud', entityData.longitud || 'N/A']);
          entityInfo.push(['Fecha', entityData.fecha ? new Date(entityData.fecha).toLocaleDateString() : 'N/A']);
        }
        break;
    }
    
    if (entityInfo.length > 0) {
      autoTable(doc, {
        startY: 50,
        head: [['Atributo', 'Valor']],
        body: entityInfo,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        margin: { left: 20 }
      });
    }

    // Información de ubicaciones
    if (locations.length > 0) {
      let lastPosition = (doc as any).lastAutoTable?.finalY || 50;
      lastPosition += 15; // Espacio después de la tabla anterior
      
      // Título para la sección de ubicaciones
      doc.setFontSize(11);
      doc.text('Ubicaciones', 20, lastPosition);
      
      const locationData = locations.map(loc => [
        loc.title,
        `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
        loc.description,
        loc.relation === 'direct' ? 'Directa' : 'Relacionada'
      ]);
      
      autoTable(doc, {
        startY: lastPosition + 5,
        head: [['Tipo', 'Coordenadas', 'Descripción', 'Relación']],
        body: locationData,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 80 },
          3: { cellWidth: 25 }
        },
        margin: { left: 20 }
      });
    }
    
    // Guardar el PDF
    doc.save(`informe_${selectedResult.tipo}_${selectedResult.id}.pdf`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Estructuras</h1>
            {selectedResult && (
              <Button 
                onClick={exportToPDF} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Exportar a PDF
              </Button>
            )}
          </div>
          
          <div className="mb-6">
            <SearchComponent onResultSelect={handleResultSelect} />
          </div>
          
          {selectedResult ? (
            <div className="space-y-8 paper-format">
              {/* Detalles de la entidad */}
              <section>
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-bold">Detalles del registro</h2>
                  <Separator className="flex-1 mx-4" />
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded bg-primary-100 text-primary-800 text-sm font-medium">
                      {selectedResult.tipo === 'persona' && 'Persona'}
                      {selectedResult.tipo === 'vehiculo' && 'Vehículo'}
                      {selectedResult.tipo === 'inmueble' && 'Inmueble'}
                      {selectedResult.tipo === 'ubicacion' && 'Ubicación'}
                    </div>
                  </div>
                </div>
                
                <EntityDetails 
                  entityId={selectedResult.id} 
                  entityType={selectedResult.tipo} 
                />
              </section>

              {/* Mapa y Ubicaciones */}
              <section>
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-bold">Mapa y Ubicaciones</h2>
                  <Separator className="flex-1 mx-4" />
                </div>
                
                <div className="flex flex-col space-y-4">
                  {/* Mapa */}
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        <span>Mapa de Ubicaciones</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="border rounded-md p-4 min-h-[250px] md:min-h-[300px] flex items-center justify-center text-gray-500">
                          <p>Cargando ubicaciones...</p>
                        </div>
                      ) : locations.length > 0 ? (
                        <div className="h-[300px] md:h-[400px] mb-6">
                          <LocationMap 
                            markers={locations} 
                            center={mapCenter}
                            zoom={15}
                          />
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 min-h-[250px] md:min-h-[300px] flex flex-col items-center justify-center text-gray-500">
                          <MapPin className="h-8 w-8 md:h-12 md:w-12 mb-3 md:mb-4 text-gray-400" />
                          <p className="mb-1 md:mb-2 text-base md:text-lg">No se encontraron ubicaciones</p>
                          <p className="text-xs md:text-sm text-center max-w-xs md:max-w-md">
                            {selectedResult.tipo === 'vehiculo' 
                              ? 'Los vehículos no tienen ubicaciones directas. Se mostrarán los domicilios de personas relacionadas.'
                              : 'Esta entidad no tiene coordenadas registradas'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Tablas de ubicaciones */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Tabla de ubicaciones directas */}
                    <Card className="w-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MapPin className="h-5 w-5" />
                          <span>Ubicaciones Directas</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <p className="text-center py-4 text-gray-500">Cargando...</p>
                        ) : locations.filter(loc => loc.relation === 'direct').length > 0 ? (
                          <LocationsTable 
                            locations={locations.filter(loc => loc.relation === 'direct')}
                            onLocationClick={handleLocationClick}
                          />
                        ) : (
                          <p className="text-center py-4 text-gray-500">
                            {selectedResult.tipo === 'vehiculo' 
                              ? 'Los vehículos no tienen ubicaciones directas' 
                              : 'No se encontraron ubicaciones directas para esta entidad'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Tabla de ubicaciones relacionadas */}
                    <Card className="w-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Search className="h-5 w-5" />
                          <span>Ubicaciones Relacionadas</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <p className="text-center py-4 text-gray-500">Cargando...</p>
                        ) : locations.filter(loc => loc.relation === 'related').length > 0 ? (
                          <LocationsTable 
                            locations={locations.filter(loc => loc.relation === 'related')}
                            onLocationClick={handleLocationClick}
                          />
                        ) : (
                          <p className="text-center py-4 text-gray-500">No se encontraron ubicaciones relacionadas</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="border rounded-md p-8 min-h-[300px] flex flex-col items-center justify-center text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-400" />
              <p className="mb-2 text-lg">Realice una búsqueda para ver el informe estructural</p>
              <p className="text-sm text-center max-w-md">
                El informe mostrará información detallada, observaciones, relaciones y ubicaciones en un formato exportable a PDF
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}