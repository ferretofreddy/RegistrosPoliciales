import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import RegistrosPage from "@/pages/registros-page";
import AdminPage from "@/pages/admin-page";
import ConfiguracionPage from "@/pages/configuracion-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={RegistrosPage} />
      <ProtectedRoute path="/registros" component={RegistrosPage} roles={["admin", "investigador"]} />
      <ProtectedRoute path="/admin" component={AdminPage} roles={["admin"]} />
      <ProtectedRoute path="/configuracion" component={ConfiguracionPage} roles={["admin"]} />
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
