import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, Send, Trash2, Mail, User, Eye, MessageSquarePlus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Esquema para el formulario de nuevo mensaje
const nuevoMensajeSchema = z.object({
  destinatarioId: z.string().min(1, "Seleccione un destinatario"),
  asunto: z.string().min(1, "El asunto es requerido"),
  contenido: z.string().min(1, "El contenido es requerido")
});

type NuevoMensajeFormValues = z.infer<typeof nuevoMensajeSchema>;

// Tipos de datos para los mensajes
interface Mensaje {
  id: number;
  remiteId: number;
  destinatarioId: number;
  asunto: string;
  contenido: string;
  fechaEnvio: string; // formato ISO
  leido: boolean;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export default function MensajeriaPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("recibidos");
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<Mensaje | null>(null);
  const [showNuevoMensaje, setShowNuevoMensaje] = useState(false);

  // Consultas para obtener mensajes
  const mensajesRecibidos = useQuery({
    queryKey: ["/api/mensajes/recibidos"],
    queryFn: () => apiRequest<Mensaje[]>("/api/mensajes/recibidos"),
  });

  const mensajesEnviados = useQuery({
    queryKey: ["/api/mensajes/enviados"],
    queryFn: () => apiRequest<Mensaje[]>("/api/mensajes/enviados"),
  });

  // Consulta para obtener usuarios
  const usuarios = useQuery({
    queryKey: ["/api/usuarios-mensajeria"],
    queryFn: () => apiRequest<Usuario[]>("/api/usuarios-mensajeria"),
  });

  // Mutación para enviar un nuevo mensaje
  const enviarMensajeMutation = useMutation({
    mutationFn: (data: NuevoMensajeFormValues) => {
      return apiRequest<Mensaje>("/api/mensajes", {
        method: "POST",
        data: {
          ...data,
          destinatarioId: parseInt(data.destinatarioId)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensajes/enviados"] });
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se ha enviado correctamente",
      });
      setShowNuevoMensaje(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error al enviar mensaje:", error);
      toast({
        title: "Error al enviar mensaje",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  });

  // Mutación para eliminar un mensaje
  const eliminarMensajeMutation = useMutation({
    mutationFn: (mensajeId: number) => {
      return apiRequest<{ message: string }>(`/api/mensajes/${mensajeId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensajes/recibidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mensajes/enviados"] });
      setMensajeSeleccionado(null);
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error("Error al eliminar mensaje:", error);
      toast({
        title: "Error al eliminar mensaje",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      });
    }
  });

  // Mutación para marcar un mensaje como leído
  const marcarComoLeidoMutation = useMutation({
    mutationFn: (mensajeId: number) => {
      return apiRequest<Mensaje>(`/api/mensajes/${mensajeId}`, {
        method: "GET"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensajes/recibidos"] });
    }
  });

  // Formulario para nuevo mensaje
  const form = useForm<NuevoMensajeFormValues>({
    resolver: zodResolver(nuevoMensajeSchema),
    defaultValues: {
      destinatarioId: "",
      asunto: "",
      contenido: ""
    }
  });
  
  // Función para manejar la selección de un mensaje
  const handleSelectMensaje = (mensaje: Mensaje) => {
    setMensajeSeleccionado(mensaje);
    // Si el mensaje no está leído y el usuario es el destinatario, marcarlo como leído
    if (!mensaje.leido && mensaje.destinatarioId === user?.id) {
      marcarComoLeidoMutation.mutate(mensaje.id);
    }
  };

  // Función para manejar la eliminación de un mensaje
  const handleEliminarMensaje = () => {
    if (mensajeSeleccionado) {
      eliminarMensajeMutation.mutate(mensajeSeleccionado.id);
    }
  };

  // Función para encontrar el nombre de un usuario por su ID
  const getNombreUsuario = (usuarioId: number) => {
    if (!usuarios.data) return "Usuario";
    const usuario = usuarios.data.find(u => u.id === usuarioId);
    return usuario ? usuario.nombre : "Usuario";
  };

  // Formatear fecha
  const formatearFecha = (fechaIso: string) => {
    return format(new Date(fechaIso), "dd/MM/yyyy HH:mm", { locale: es });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mensajería Interna</h1>
          <Button onClick={() => setShowNuevoMensaje(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Nuevo Mensaje
          </Button>
        </div>

        <Tabs defaultValue="recibidos" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="recibidos" className="flex items-center">
              <Inbox className="mr-2 h-4 w-4" />
              <span>Recibidos</span>
              {mensajesRecibidos.data && mensajesRecibidos.data.filter(m => !m.leido).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {mensajesRecibidos.data.filter(m => !m.leido).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enviados" className="flex items-center">
              <Send className="mr-2 h-4 w-4" />
              <span>Enviados</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-[1fr_2fr] gap-4">
            {/* Lista de mensajes */}
            <div className="border rounded-lg overflow-hidden">
              <TabsContent value="recibidos" className="m-0">
                {mensajesRecibidos.isLoading ? (
                  <div className="p-4 text-center">Cargando mensajes...</div>
                ) : mensajesRecibidos.data?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Mail className="mx-auto h-8 w-8 mb-2" />
                    <p>No tienes mensajes recibidos</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {mensajesRecibidos.data?.map((mensaje) => (
                      <li 
                        key={mensaje.id}
                        onClick={() => handleSelectMensaje(mensaje)}
                        className={`p-3 cursor-pointer hover:bg-gray-100 ${
                          mensajeSeleccionado?.id === mensaje.id ? "bg-gray-100" : ""
                        } ${!mensaje.leido ? "font-semibold" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">De: {getNombreUsuario(mensaje.remiteId)}</p>
                            <p className={`text-sm ${!mensaje.leido ? "font-semibold" : ""}`}>{mensaje.asunto}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatearFecha(mensaje.fechaEnvio)}
                            {!mensaje.leido && <Badge variant="destructive" className="ml-2">Nuevo</Badge>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="enviados" className="m-0">
                {mensajesEnviados.isLoading ? (
                  <div className="p-4 text-center">Cargando mensajes...</div>
                ) : mensajesEnviados.data?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Send className="mx-auto h-8 w-8 mb-2" />
                    <p>No tienes mensajes enviados</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {mensajesEnviados.data?.map((mensaje) => (
                      <li 
                        key={mensaje.id}
                        onClick={() => handleSelectMensaje(mensaje)}
                        className={`p-3 cursor-pointer hover:bg-gray-100 ${
                          mensajeSeleccionado?.id === mensaje.id ? "bg-gray-100" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">Para: {getNombreUsuario(mensaje.destinatarioId)}</p>
                            <p className="text-sm">{mensaje.asunto}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatearFecha(mensaje.fechaEnvio)}
                            {mensaje.leido && <Badge variant="outline" className="ml-2">Leído</Badge>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </div>

            {/* Detalle del mensaje */}
            <div>
              {mensajeSeleccionado ? (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{mensajeSeleccionado.asunto}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleEliminarMensaje} 
                        disabled={eliminarMensajeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {activeTab === "recibidos" 
                          ? `De: ${getNombreUsuario(mensajeSeleccionado.remiteId)}` 
                          : `Para: ${getNombreUsuario(mensajeSeleccionado.destinatarioId)}`
                        }
                      </div>
                      <div>{formatearFecha(mensajeSeleccionado.fechaEnvio)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="whitespace-pre-line">{mensajeSeleccionado.contenido}</div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg p-8 text-gray-500">
                  <div className="text-center">
                    <Eye className="mx-auto h-12 w-12 mb-4" />
                    <p>Selecciona un mensaje para ver su contenido</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>

        {/* Modal para nuevo mensaje */}
        <Dialog open={showNuevoMensaje} onOpenChange={setShowNuevoMensaje}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Mensaje</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => enviarMensajeMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="destinatarioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Para</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar destinatario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usuarios.data?.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id.toString()}>
                              {usuario.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="asunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Asunto del mensaje" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contenido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Escribe tu mensaje aquí..." 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setShowNuevoMensaje(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={enviarMensajeMutation.isPending}
                  >
                    {enviarMensajeMutation.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}