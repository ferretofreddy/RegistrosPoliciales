import React from 'react';
import { Ubicacion } from "@shared/schema";
import MapaUbicaciones from '../mapa-ubicaciones';

interface DetalleMapaUbicacionesProps {
  ubicacionesDirectas: Ubicacion[];
  ubicacionesRelacionadas: {
    ubicacion: Ubicacion;
    entidadRelacionada: {
      tipo: string;
      entidad: any;
      relacionadoCon?: {
        tipo: string;
        entidad: any;
      };
    };
  }[];
}

export const DetalleMapaUbicaciones: React.FC<DetalleMapaUbicacionesProps> = ({ 
  ubicacionesDirectas, 
  ubicacionesRelacionadas 
}) => {
  const hayUbicaciones = 
    (ubicacionesDirectas && ubicacionesDirectas.length > 0) || 
    (ubicacionesRelacionadas && ubicacionesRelacionadas.length > 0);

  if (!hayUbicaciones) {
    return null;
  }

  return (
    <div className="space-y-6" id="ubicaciones-section">
      {/* Mapa de ubicaciones */}
      <div>
        <div className="bg-gray-50 px-4 py-3 border-t border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mapa de Ubicaciones</h3>
        </div>
        <div className="border border-gray-200 rounded-b-lg" style={{ height: "400px" }}>
          <MapaUbicaciones 
            ubicacionesDirectas={ubicacionesDirectas} 
            ubicacionesRelacionadas={ubicacionesRelacionadas}
          />
        </div>
      </div>

      {/* Tabla de ubicaciones */}
      <div>
        <div className="bg-gray-50 px-4 py-3 border-t border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ubicaciones Encontradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordenadas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relación</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ubicacionesDirectas && ubicacionesDirectas.map((ubicacion: Ubicacion) => (
                <tr key={`directa-${ubicacion.id}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ubicacion.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {ubicacion.fecha ? new Date(ubicacion.fecha).toLocaleString() : "No registrada"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Directa</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ubicacion.observaciones || ""}</td>
                </tr>
              ))}
              {ubicacionesRelacionadas && ubicacionesRelacionadas.map((item: any, index: number) => (
                <tr key={`relacionada-${index}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.ubicacion.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.ubicacion.latitud.toFixed(6)}, {item.ubicacion.longitud.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.ubicacion.fecha ? new Date(item.ubicacion.fecha).toLocaleString() : "No registrada"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.entidadRelacionada.relacionadoCon 
                      ? `${item.entidadRelacionada.tipo.toUpperCase()} → ${item.entidadRelacionada.relacionadoCon.tipo.toUpperCase()}`
                      : item.entidadRelacionada.tipo.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.ubicacion.observaciones || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetalleMapaUbicaciones;