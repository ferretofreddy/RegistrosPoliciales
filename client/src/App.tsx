import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ConsultaPage from "@/pages/consulta-page";
import RegistrosPage from "@/pages/registros-page";
import UbicacionesPage from "@/pages/ubicaciones-page";
import EstructurasPage from "@/pages/estructuras-page";
import AdminPage from "@/pages/admin-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={ConsultaPage} />
      <ProtectedRoute path="/consulta" component={ConsultaPage} />
      <ProtectedRoute path="/registros" component={RegistrosPage} roles={["admin", "investigador"]} />
      <ProtectedRoute path="/ubicaciones" component={UbicacionesPage} />
      <ProtectedRoute path="/estructuras" component={EstructurasPage} />
      <ProtectedRoute path="/admin" component={AdminPage} roles={["admin"]} />
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
