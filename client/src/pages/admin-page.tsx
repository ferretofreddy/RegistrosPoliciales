import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User as UserIcon, Edit, Trash2, UserPlus, FileText, Settings } from "lucide-react";
import { User } from "@shared/schema";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number; rol: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userData.id}`, { rol: userData.rol });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      toast({
        title: "Usuario actualizado",
        description: "El rol del usuario ha sido actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`¿Está seguro que desea eliminar al usuario ${user.nombre}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        rol: editingUser.rol 
      });
    }
  };

  const getRoleBadgeVariant = (rol: string) => {
    switch (rol) {
      case "admin":
        return "destructive";
      case "investigador":
        return "blue";
      default:
        return "outline";
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Administración del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="usuarios" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border-b border-gray-200 w-full rounded-none bg-white px-6">
                <TabsTrigger value="usuarios" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Gestión de Usuarios
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <FileText className="mr-2 h-4 w-4" />
                  Logs de Actividad
                </TabsTrigger>
                <TabsTrigger value="configuracion" className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent py-4 px-6 text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="usuarios">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">Usuarios del Sistema</h2>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Nuevo Usuario
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Nombre
                              </Label>
                              <Input id="name" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              <Input id="email" type="email" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rol" className="text-right">
                                Rol
                              </Label>
                              <Select defaultValue="agente">
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="investigador">Investigador</SelectItem>
                                  <SelectItem value="agente">Agente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Guardar Usuario</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {isLoading ? (
                      <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-2 text-gray-500">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Rol</TableHead>
                              <TableHead>Unidad</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users?.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.id}</TableCell>
                                <TableCell>{user.nombre}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant={getRoleBadgeVariant(user.rol)}>
                                    {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{user.unidad}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {!users?.length && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                  No hay usuarios registrados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="logs">
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Logs de Actividad</h2>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Detalles</TableHead>
                            <TableHead>IP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>2023-05-12 10:30:22</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>Crear</TableCell>
                            <TableCell>Creación de persona: Juan Pérez</TableCell>
                            <TableCell>192.168.1.1</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>2023-05-12 09:45:13</TableCell>
                            <TableCell>investigador@example.com</TableCell>
                            <TableCell>Buscar</TableCell>
                            <TableCell>Búsqueda de vehículos: ABC-123</TableCell>
                            <TableCell>192.168.1.2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>2023-05-12 09:22:41</TableCell>
                            <TableCell>agente@example.com</TableCell>
                            <TableCell>Ver</TableCell>
                            <TableCell>Visualización de detalle de propiedad ID: 145</TableCell>
                            <TableCell>192.168.1.3</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="configuracion">
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-gray-900">Configuración del Sistema</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Configuración General</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="system-name">Nombre del Sistema</Label>
                              <Input id="system-name" defaultValue="Registros Policiales" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="department">Departamento</Label>
                              <Input id="department" defaultValue="Policía Nacional" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="retention-period">Período de Retención de Logs (días)</Label>
                              <Input id="retention-period" type="number" defaultValue="90" />
                            </div>
                            <Button className="w-full mt-2">Guardar Configuración</Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="password-policy">Política de Contraseñas</Label>
                              <Select defaultValue="strong">
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar política" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Básica (min. 6 caracteres)</SelectItem>
                                  <SelectItem value="medium">Media (min. 8 caracteres, incluir números)</SelectItem>
                                  <SelectItem value="strong">Fuerte (min. 10 caracteres, números y símbolos)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                              <Input id="session-timeout" type="number" defaultValue="30" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="failed-attempts">Intentos Fallidos Antes de Bloqueo</Label>
                              <Input id="failed-attempts" type="number" defaultValue="5" />
                            </div>
                            <Button className="w-full mt-2">Guardar Configuración</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog for editing user role */}
      {editingUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.nombre}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  value={editingUser.email}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-rol" className="text-right">
                  Rol
                </Label>
                <Select 
                  value={editingUser.rol} 
                  onValueChange={(value) => setEditingUser({...editingUser, rol: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="investigador">Investigador</SelectItem>
                    <SelectItem value="agente">Agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}