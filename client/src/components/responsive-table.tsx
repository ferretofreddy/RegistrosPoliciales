import { useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Info, Eye, Edit, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (item: any) => React.ReactNode;
  showOnMobile?: boolean;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  caption?: string;
  onViewDetails?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

export default function ResponsiveTable({
  data,
  columns,
  caption,
  onViewDetails,
  onEdit,
  onDelete
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = (item: any) => {
    if (onViewDetails) {
      onViewDetails(item);
    } else {
      setSelectedItem(item);
      setDetailsOpen(true);
    }
  };

  const renderMobileView = () => {
    const visibleColumns = isMobile 
      ? columns.filter(col => col.showOnMobile !== false)
      : columns;

    return (
      <Table className="responsive-table">
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, rowIndex) => (
            <TableRow key={rowIndex}>
              {visibleColumns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.cell ? column.cell(item) : item[column.accessorKey]}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex space-x-2 table-actions">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden visible"
                      onClick={() => handleViewDetails(item)}
                    >
                      <Info className="h-4 w-4 text-primary-600" />
                    </Button>
                  )}
                  
                  {onViewDetails && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Eye className="h-4 w-4 text-secondary-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalles</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {onEdit && (user?.rol === "admin" || user?.rol === "investigador") && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onEdit(item)}
                          >
                            <Edit className="h-4 w-4 text-secondary-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {onDelete && user?.rol === "admin" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Simple details dialog for when no onViewDetails handler is provided
  const renderDetailsDialog = () => {
    if (!selectedItem) return null;

    return (
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalles</DialogTitle>
            <DialogDescription>
              Información completa del registro
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map((column, index) => (
                <div key={index}>
                  <p className="text-sm font-semibold text-gray-500">{column.header}</p>
                  <p>
                    {column.cell 
                      ? column.cell(selectedItem) 
                      : selectedItem[column.accessorKey] || "No disponible"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      {renderMobileView()}
      {renderDetailsDialog()}
    </>
  );
}