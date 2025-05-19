import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Briefcase, UserCheck, CreditCard, Phone, Save, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/main-layout";

export default function MiPerfilPage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  
  // Estados para edición de perfil
  const [editing, setEditing] = useState(false);
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [unidad, setUnidad] = useState(user?.unidad || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Reinicia los valores del formulario cuando se cambie a modo edición
  const handleStartEditing = () => {
    setTelefono(user?.telefono || "");
    setUnidad(user?.unidad || "");
    setEditing(true);
  };
  
  // Función para actualizar perfil (teléfono y unidad)
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const res = await apiRequest("PATCH", `/api/user/update`, {
        telefono,
        unidad
      });
      
      if (res.ok) {
        await refetchUser();
        setEditing(false);
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada correctamente.",
          variant: "default",
        });
      } else {
        throw new Error("No se pudo actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar tu información.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    if (!user) return;
    
    // Validación de contraseñas
    setPasswordError("");
    
    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await apiRequest("POST", `/api/user/change-password`, {
        currentPassword,
        newPassword
      });
      
      if (res.ok) {
        // Reiniciar campos
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada correctamente.",
          variant: "default",
        });
      } else {
        const errorData = await res.json();
        setPasswordError(errorData.message || "No se pudo actualizar la contraseña");
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setPasswordError("Ocurrió un error al cambiar la contraseña");
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar la contraseña.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full md:w-1/3">
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle>Perfil de Usuario</CardTitle>
                <CardDescription>
                  Información básica de su cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-primary-700 flex items-center justify-center text-white text-2xl mb-4">
                  <span>
                  {user?.nombre
                    ? user.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)
                    : ""}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-1">{user?.nombre}</h3>
                <p className="text-gray-500 mb-2">{user?.email}</p>
                <Badge variant="outline" className="bg-primary-100 text-primary-800 hover:bg-primary-200 border-primary-200">
                  Rol: {user?.rol 
                    ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) 
                    : "Usuario"}
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full md:w-2/3">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Detalles de su perfil en el sistema
                  </CardDescription>
                </div>
                {!editing && (
                  <Button 
                    variant="outline" 
                    onClick={handleStartEditing}
                    className="text-sm"
                  >
                    Editar perfil
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 p-2">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="telefono" className="text-sm font-medium text-gray-500">
                          Teléfono
                        </Label>
                        <Input
                          id="telefono"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          className="mt-1"
                          placeholder="Ingrese su número de teléfono"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Briefcase className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="unidad" className="text-sm font-medium text-gray-500">
                          Unidad
                        </Label>
                        <Input
                          id="unidad"
                          value={unidad}
                          onChange={(e) => setUnidad(e.target.value)}
                          className="mt-1"
                          placeholder="Ingrese su unidad"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditing(false)}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Nombre completo</h4>
                        <p className="font-medium">{user?.nombre || "No disponible"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Cédula/Identificación</h4>
                        <p className="font-medium">{user?.cedula || "No disponible"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Mail className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Correo electrónico</h4>
                        <p className="font-medium">{user?.email || "No disponible"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <UserCheck className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Rol en el sistema</h4>
                        <p className="font-medium">
                          {user?.rol 
                            ? "Rol: " + user.rol.charAt(0).toUpperCase() + user.rol.slice(1) 
                            : "No disponible"}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Teléfono</h4>
                        <p className="font-medium">{user?.telefono || "No disponible"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Briefcase className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Unidad</h4>
                        <p className="font-medium">{user?.unidad || "No disponible"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Nueva sección para cambiar contraseña */}
        <div className="w-full">
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña de acceso al sistema
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingrese su contraseña actual" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingrese su nueva contraseña" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme su nueva contraseña" 
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? "Cambiando..." : "Cambiar contraseña"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}