import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MiPerfilPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Detalles de su cuenta y perfil en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="font-medium text-gray-500 min-w-32">Nombre:</span>
              <span>{user?.nombre || "No disponible"}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="font-medium text-gray-500 min-w-32">Correo electrónico:</span>
              <span>{user?.email || "No disponible"}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="font-medium text-gray-500 min-w-32">Rol:</span>
              <span>
                {user?.rol 
                  ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) 
                  : "No disponible"}
              </span>
            </div>
            
            {user?.telefono && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="font-medium text-gray-500 min-w-32">Teléfono:</span>
                <span>{user.telefono}</span>
              </div>
            )}
            
            {user?.unidad && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="font-medium text-gray-500 min-w-32">Unidad:</span>
                <span>{user.unidad}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}