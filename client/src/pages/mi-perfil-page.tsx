import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Briefcase, UserCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MiPerfilPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
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
                {user?.rol 
                  ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) 
                  : "Usuario"}
              </Badge>
              {user?.activo && (
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                  Activo
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Detalles de su perfil en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) 
                        : "No disponible"}
                    </p>
                  </div>
                </div>
                
                {user?.unidad && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <Briefcase className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500">Unidad</h4>
                        <p className="font-medium">{user.unidad}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}