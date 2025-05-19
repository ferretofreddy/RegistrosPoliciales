import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { User as UserIcon, Edit, Trash2, UserPlus } from "lucide-react";
import { User } from "@shared/schema";

export default function AdminPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: "",
    email: "",
    password: "",
    cedula: "",
    telefono: "",
    unidad: "",
    rol: "agente"
  });
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  // Mutation para crear un nuevo usuario
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsNewUserDialogOpen(false);
      setNewUser({
        nombre: "",
        email: "",
        password: "",
        cedula: "",
        telefono: "",
        unidad: "",
        rol: "agente"
      });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al crear el usuario",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar un usuario existente
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userData.id}`, userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente.",
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
  
  // Mutation para cambiar la contraseña de un usuario
  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}/password`, { password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña ha sido actualizada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al cambiar la contraseña",
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

  const handleCreateUser = () => {
    // Validar datos básicos
    if (!newUser.nombre || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Nombre, email y contraseña son obligatorios",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        nombre: editingUser.nombre,
        email: editingUser.email,
        cedula: editingUser.cedula,
        telefono: editingUser.telefono,
        unidad: editingUser.unidad,
        rol: editingUser.rol 
      });
    }
  };
  
  const handleChangePassword = () => {
    if (editingUser && newPassword) {
      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
      
      changePasswordMutation.mutate({ 
        id: editingUser.id, 
        password: newPassword 
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
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Gestión de Usuarios
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Listado de Usuarios</h3>
                    
                    {/* Diálogo para crear nuevos usuarios */}
                    <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
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
                            <Label htmlFor="new-name" className="text-right">
                              Nombre
                            </Label>
                            <Input 
                              id="new-name" 
                              className="col-span-3"
                              value={newUser.nombre}
                              onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-email" className="text-right">
                              Email
                            </Label>
                            <Input 
                              id="new-email" 
                              type="email" 
                              className="col-span-3"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-password" className="text-right">
                              Contraseña
                            </Label>
                            <Input 
                              id="new-password" 
                              type="password" 
                              className="col-span-3"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              placeholder="Mínimo 6 caracteres"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-cedula" className="text-right">
                              Cédula
                            </Label>
                            <Input 
                              id="new-cedula" 
                              className="col-span-3"
                              value={newUser.cedula}
                              onChange={(e) => setNewUser({...newUser, cedula: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-telefono" className="text-right">
                              Teléfono
                            </Label>
                            <Input 
                              id="new-telefono" 
                              className="col-span-3"
                              value={newUser.telefono}
                              onChange={(e) => setNewUser({...newUser, telefono: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-unidad" className="text-right">
                              Unidad
                            </Label>
                            <Input 
                              id="new-unidad" 
                              className="col-span-3"
                              value={newUser.unidad}
                              onChange={(e) => setNewUser({...newUser, unidad: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-rol" className="text-right">
                              Rol
                            </Label>
                            <Select 
                              value={newUser.rol}
                              onValueChange={(value) => setNewUser({...newUser, rol: value})}
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
                            onClick={handleCreateUser}
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending ? "Creando..." : "Guardar Usuario"}
                          </Button>
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
                              <TableCell className="space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} title="Editar usuario">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setNewPassword("");
                                    setIsPasswordDialogOpen(true);
                                  }}
                                  title="Cambiar contraseña"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user)} title="Eliminar usuario">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog for editing user */}
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
                  className="col-span-3" 
                  value={editingUser.nombre || ''}
                  onChange={(e) => setEditingUser({...editingUser, nombre: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  className="col-span-3" 
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cedula" className="text-right">
                  Cédula
                </Label>
                <Input 
                  id="edit-cedula" 
                  className="col-span-3" 
                  value={editingUser.cedula || ''}
                  onChange={(e) => setEditingUser({...editingUser, cedula: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-telefono" className="text-right">
                  Teléfono
                </Label>
                <Input 
                  id="edit-telefono" 
                  className="col-span-3" 
                  value={editingUser.telefono || ''}
                  onChange={(e) => setEditingUser({...editingUser, telefono: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unidad" className="text-right">
                  Unidad
                </Label>
                <Input 
                  id="edit-unidad" 
                  className="col-span-3" 
                  value={editingUser.unidad || ''}
                  onChange={(e) => setEditingUser({...editingUser, unidad: e.target.value})}
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
                  <SelectTrigger id="edit-rol" className="col-span-3">
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
                {updateUserMutation.isPending ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog for changing password */}
      {editingUser && (
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cambiar Contraseña</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2 mb-4">
                <h3 className="font-medium text-sm">Usuario: {editingUser.nombre}</h3>
                <p className="text-sm text-gray-500">Email: {editingUser.email}</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-password" className="text-right">
                    Nueva Contraseña
                  </Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    className="col-span-3" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !newPassword || newPassword.length < 6}
              >
                {changePasswordMutation.isPending ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}