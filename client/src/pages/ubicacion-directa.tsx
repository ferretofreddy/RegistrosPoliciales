import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function UbicacionDirecta() {
  const { toast } = useToast();
  const [latitud, setLatitud] = useState<number | "">("");
  const [longitud, setLongitud] = useState<number | "">("");
  const [tipo, setTipo] = useState<string>("Otro");
  const [observaciones, setObservaciones] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = () => {
    setIsLoading(true);
    setResult(null);
    
    // Validaciones básicas
    if (!latitud || !longitud) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Las coordenadas de latitud y longitud son obligatorias"
      });
      setIsLoading(false);
      return;
    }

    // Datos para enviar
    const data = {
      latitud: Number(latitud),
      longitud: Number(longitud),
      tipo,
      observaciones
    };

    console.log("Enviando datos:", data);

    // Usar XMLHttpRequest para evitar interferencias
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/bypass-ubicacion", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    
    xhr.onload = function() {
      setIsLoading(false);
      try {
        const responseText = xhr.responseText;
        console.log("Respuesta recibida:", responseText);
        
        const response = JSON.parse(responseText);
        console.log("Respuesta parseada:", response);
        
        if (response.success) {
          toast({
            title: "Ubicación guardada",
            description: `Se ha registrado la ubicación ${response.data.id} correctamente`
          });
          
          setResult(response.data);
        } else {
          toast({
            variant: "destructive",
            title: "Error al guardar",
            description: response.error || "Error desconocido"
          });
        }
      } catch (e) {
        console.error("Error al procesar respuesta:", e, xhr.responseText);
        toast({
          variant: "destructive",
          title: "Error de respuesta",
          description: "La respuesta del servidor no pudo ser procesada"
        });
      }
    };
    
    xhr.onerror = function() {
      setIsLoading(false);
      console.error("Error de red");
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor"
      });
    };
    
    xhr.send(JSON.stringify(data));
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Registro Directo de Ubicación</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Ubicación</CardTitle>
            <CardDescription>
              Ingresa las coordenadas y detalles de la ubicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitud">Latitud</Label>
                <Input
                  id="latitud"
                  type="number"
                  step="0.0000001"
                  placeholder="Ej: 8.6392449"
                  value={latitud}
                  onChange={(e) => setLatitud(e.target.value ? parseFloat(e.target.value) : "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitud">Longitud</Label>
                <Input
                  id="longitud"
                  type="number"
                  step="0.0000001"
                  placeholder="Ej: -82.9457379"
                  value={longitud}
                  onChange={(e) => setLongitud(e.target.value ? parseFloat(e.target.value) : "")}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Ubicación</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecciona el tipo de ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Domicilio">Domicilio</SelectItem>
                  <SelectItem value="Trabajo">Trabajo</SelectItem>
                  <SelectItem value="Avistamiento">Avistamiento</SelectItem>
                  <SelectItem value="Inmueble">Inmueble</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Detalles adicionales sobre la ubicación..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar Ubicación"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              Los datos de la ubicación registrada aparecerán aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-2">
                <div className="p-4 border rounded-md">
                  <p><strong>ID:</strong> {result.id}</p>
                  <p><strong>Coordenadas:</strong> {result.latitud}, {result.longitud}</p>
                  <p><strong>Tipo:</strong> {result.tipo}</p>
                  <p><strong>Fecha:</strong> {new Date(result.fecha).toLocaleString()}</p>
                  {result.observaciones && (
                    <p><strong>Observaciones:</strong> {result.observaciones}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ubicación guardada correctamente en la base de datos.
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {isLoading
                  ? "Procesando solicitud..."
                  : "No hay datos para mostrar. Completa el formulario y haz clic en 'Guardar Ubicación'."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}