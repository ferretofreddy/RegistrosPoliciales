import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { MapIcon } from 'lucide-react';

interface BotonVerUbicacionesCompletasProps {
  entidad: {
    tipo: string;
    id: number;
    nombre?: string;
  };
  className?: string;
}

/**
 * Botón para ver todas las ubicaciones relacionadas con una entidad.
 * Al hacer clic, redirige a una página dedicada con un mapa completo.
 */
const BotonVerUbicacionesCompletas = ({ entidad, className = '' }: BotonVerUbicacionesCompletasProps) => {
  const [_, setLocation] = useLocation();

  const handleVerUbicaciones = () => {
    // Crear URL con parámetros para la nueva página
    const params = new URLSearchParams();
    params.set('tipo', entidad.tipo);
    params.set('id', entidad.id.toString());
    if (entidad.nombre) {
      params.set('nombre', entidad.nombre);
    }
    
    setLocation(`/ubicaciones-visor?${params.toString()}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`flex items-center ${className}`}
      onClick={handleVerUbicaciones}
    >
      <MapIcon className="h-4 w-4 mr-1" />
      Ver ubicaciones completas
    </Button>
  );
};

export default BotonVerUbicacionesCompletas;