import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (roles && !roles.includes(user.rol)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes los permisos necesarios para acceder a esta página. Esta sección está disponible solo para {roles.join(', ')}.
            </p>
            <a href="/" className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 inline-block">
              Volver al inicio
            </a>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
