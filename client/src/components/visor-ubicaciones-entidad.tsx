import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import MapaUbicacionesMejorado from './mapa-ubicaciones-mejorado';

// Propiedades del componente
interface VisorUbicacionesEntidadProps {
  tipo: string;
  id: number;
  nombre?: string;
  className?: string;
}

const VisorUbicacionesEntidad = ({ tipo, id, nombre, className = '' }: VisorUbicacionesEntidadProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center ${className}`}
        onClick={handleOpenDialog}
      >
        <Eye className="h-4 w-4 mr-1" />
        Ver ubicaciones
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              Ubicaciones de {nombre || `${tipo} #${id}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 p-4 overflow-hidden">
            <MapaUbicacionesMejorado 
              entidad={{ tipo, id, nombre }} 
              onClose={handleCloseDialog} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisorUbicacionesEntidad;