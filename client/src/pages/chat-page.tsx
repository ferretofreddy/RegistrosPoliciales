import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Plus, Clock, Check, CheckCheck, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Conversacion {
  conversacion: {
    id: number;
    usuario1Id: number;
    usuario2Id: number;
    fechaUltimoMensaje: string;
  };
  otroUsuario: Usuario;
  ultimoMensaje?: {
    id: number;
    contenido: string;
    fechaEnvio: string;
    remitenteId: number;
    leido: boolean;
  };
}

interface Mensaje {
  id: number;
  conversacionId: number;
  remitenteId: number;
  contenido: string;
  fechaEnvio: string;
  leido: boolean;
  editado: boolean;
  eliminado: boolean;
  tipoMensaje: string;
}

export default function ChatPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState<number | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [showNuevaConversacion, setShowNuevaConversacion] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [busquedaConversaciones, setBusquedaConversaciones] = useState("");
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Consulta para obtener conversaciones
  const conversaciones = useQuery({
    queryKey: ["/api/chat/conversaciones"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/conversaciones");
      return await response.json();
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  // Consulta para obtener mensajes de la conversación seleccionada
  const mensajes = useQuery({
    queryKey: ["/api/chat/conversaciones", conversacionSeleccionada, "mensajes"],
    queryFn: async () => {
      if (!conversacionSeleccionada) return [];
      const response = await apiRequest("GET", `/api/chat/conversaciones/${conversacionSeleccionada}/mensajes`);
      return await response.json();
    },
    enabled: !!conversacionSeleccionada,
    refetchInterval: 2000, // Actualizar cada 2 segundos cuando hay una conversación seleccionada
  });

  // Consulta para obtener usuarios disponibles
  const usuariosDisponibles = useQuery({
    queryKey: ["/api/chat/usuarios-disponibles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/usuarios-disponibles");
      return await response.json();
    },
  });

  // Mutación para enviar mensaje
  const enviarMensajeMutation = useMutation({
    mutationFn: async (data: { conversacionId: number; contenido: string }) => {
      const response = await apiRequest("POST", "/api/chat/mensajes", data);
      return await response.json();
    },
    onSuccess: () => {
      setNuevoMensaje("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversaciones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversaciones", conversacionSeleccionada, "mensajes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  // Mutación para crear nueva conversación
  const nuevaConversacionMutation = useMutation({
    mutationFn: async (otroUsuarioId: number) => {
      const response = await apiRequest("POST", "/api/chat/conversaciones", { otroUsuarioId });
      return await response.json();
    },
    onSuccess: (data) => {
      setConversacionSeleccionada(data.id);
      setShowNuevaConversacion(false);
      setUsuarioSeleccionado("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversaciones"] });
      toast({
        title: "Conversación iniciada",
        description: "Puedes comenzar a enviar mensajes",
      });
    },
  });

  // Hacer scroll automático al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes.data]);

  // Enviar mensaje
  const handleEnviarMensaje = () => {
    if (!nuevoMensaje.trim() || !conversacionSeleccionada) return;

    enviarMensajeMutation.mutate({
      conversacionId: conversacionSeleccionada,
      contenido: nuevoMensaje.trim(),
    });
  };

  // Iniciar nueva conversación
  const handleNuevaConversacion = () => {
    if (!usuarioSeleccionado) return;
    nuevaConversacionMutation.mutate(Number(usuarioSeleccionado));
  };

  // Formatear fecha para mostrar en mensajes
  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const esHoy = fecha.toDateString() === ahora.toDateString();
    
    if (esHoy) {
      return format(fecha, "HH:mm", { locale: es });
    } else {
      return format(fecha, "dd/MM HH:mm", { locale: es });
    }
  };

  // Obtener iniciales para avatar
  const getIniciales = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = conversaciones.data?.filter((conv: Conversacion) =>
    conv.otroUsuario.nombre.toLowerCase().includes(busquedaConversaciones.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Lista de conversaciones */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
          {/* Header de conversaciones */}
          <div className="p-4 border-b bg-white">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Mensajes</h2>
              <Dialog open={showNuevaConversacion} onOpenChange={setShowNuevaConversacion}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Conversación</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={usuarioSeleccionado} onValueChange={setUsuarioSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuariosDisponibles.data?.map((usuario: Usuario) => (
                          <SelectItem key={usuario.id} value={String(usuario.id)}>
                            {usuario.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleNuevaConversacion}
                      disabled={!usuarioSeleccionado || nuevaConversacionMutation.isPending}
                      className="w-full"
                    >
                      Iniciar Conversación
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversaciones..."
                value={busquedaConversaciones}
                onChange={(e) => setBusquedaConversaciones(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversaciones.isLoading ? (
              <div className="p-4 text-center text-gray-500">Cargando conversaciones...</div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p>No tienes conversaciones</p>
              </div>
            ) : (
              conversacionesFiltradas.map((conv: Conversacion) => (
                <div
                  key={conv.conversacion.id}
                  onClick={() => setConversacionSeleccionada(conv.conversacion.id)}
                  className={`p-4 cursor-pointer border-b hover:bg-white transition-colors ${
                    conversacionSeleccionada === conv.conversacion.id ? "bg-white border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getIniciales(conv.otroUsuario.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm truncate">{conv.otroUsuario.nombre}</h3>
                        <span className="text-xs text-gray-500">
                          {conv.ultimoMensaje && formatearFecha(conv.ultimoMensaje.fechaEnvio)}
                        </span>
                      </div>
                      {conv.ultimoMensaje && (
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conv.ultimoMensaje.remitenteId === user?.id ? "Tú: " : ""}
                            {conv.ultimoMensaje.contenido}
                          </p>
                          {conv.ultimoMensaje.remitenteId === user?.id && (
                            <div className="ml-2">
                              {conv.ultimoMensaje.leido ? (
                                <CheckCheck className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Check className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área de chat */}
        <div className="flex-1 flex flex-col">
          {conversacionSeleccionada ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b bg-white">
                {conversaciones.data && (
                  (() => {
                    const conv = conversaciones.data.find((c: Conversacion) => c.conversacion.id === conversacionSeleccionada);
                    return conv ? (
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-500 text-white">
                            {getIniciales(conv.otroUsuario.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{conv.otroUsuario.nombre}</h3>
                          <p className="text-sm text-gray-500">{conv.otroUsuario.email}</p>
                        </div>
                      </div>
                    ) : null;
                  })()
                )}
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {mensajes.isLoading ? (
                  <div className="text-center text-gray-500">Cargando mensajes...</div>
                ) : (
                  mensajes.data?.map((mensaje: Mensaje) => (
                    <div
                      key={mensaje.id}
                      className={`flex ${mensaje.remitenteId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          mensaje.remitenteId === user?.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{mensaje.contenido}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className={`text-xs ${mensaje.remitenteId === user?.id ? "text-blue-100" : "text-gray-500"}`}>
                            {formatearFecha(mensaje.fechaEnvio)}
                          </span>
                          {mensaje.remitenteId === user?.id && (
                            mensaje.leido ? (
                              <CheckCheck className="h-3 w-3 text-blue-100" />
                            ) : (
                              <Check className="h-3 w-3 text-blue-200" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input para enviar mensaje */}
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleEnviarMensaje()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleEnviarMensaje}
                    disabled={!nuevoMensaje.trim() || enviarMensajeMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Selecciona una conversación para comenzar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}