import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import RegistrosPage from "@/pages/registros-page";
import AdminPage from "@/pages/admin-page";
import ConfiguracionPage from "@/pages/configuracion-page";
import ConsultasPage from "@/pages/consultas-page";
import UbicacionesPage from "@/pages/ubicaciones-page";
import EstructurasPage from "@/pages/estructuras-page";
import MiPerfilPage from "@/pages/mi-perfil-page";
import ChatPage from "@/pages/chat-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={ConsultasPage} />
      <ProtectedRoute path="/consultas" component={ConsultasPage} />
      <ProtectedRoute path="/registros" component={RegistrosPage} roles={["admin", "investigador"]} />
      <ProtectedRoute path="/ubicaciones" component={UbicacionesPage} roles={["admin", "investigador"]} />
      <ProtectedRoute path="/relaciones" component={EstructurasPage} roles={["admin", "investigador"]} />
      <ProtectedRoute path="/admin" component={AdminPage} roles={["admin"]} />
      <ProtectedRoute path="/configuracion" component={ConfiguracionPage} roles={["admin"]} />
      <ProtectedRoute path="/mi-perfil" component={MiPerfilPage} />
      <ProtectedRoute path="/mensajeria" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
