import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Menu, X, User, Settings, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Cerrar menú móvil cuando cambia el tamaño de la ventana
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const userInitials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-700 shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {/* La página de consultas es accesible para todos los usuarios */}
                  <Link
                    href="/consultas"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location === "/consultas" || location === "/"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                  >
                    Consultas
                  </Link>
                  
                  {(user?.rol === "admin" || user?.rol === "investigador") && (
                    <>
                      <Link
                        href="/registros"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          location === "/registros"
                            ? "bg-primary-900 text-white"
                            : "text-gray-300 hover:bg-primary-600 hover:text-white"
                        }`}
                      >
                        Registros
                      </Link>
                      <Link
                        href="/ubicaciones"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          location === "/ubicaciones"
                            ? "bg-primary-900 text-white"
                            : "text-gray-300 hover:bg-primary-600 hover:text-white"
                        }`}
                      >
                        Ubicaciones
                      </Link>
                      <Link
                        href="/estructuras"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          location === "/estructuras"
                            ? "bg-primary-900 text-white"
                            : "text-gray-300 hover:bg-primary-600 hover:text-white"
                        }`}
                      >
                        Estructuras
                      </Link>
                    </>
                  )}
                  
                  {user?.rol === "admin" && (
                    <>
                      <Link
                        href="/admin"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          location === "/admin"
                            ? "bg-primary-900 text-white"
                            : "text-gray-300 hover:bg-primary-600 hover:text-white"
                        }`}
                      >
                        Administración
                      </Link>
                      <Link
                        href="/configuracion"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          location === "/configuracion"
                            ? "bg-primary-900 text-white"
                            : "text-gray-300 hover:bg-primary-600 hover:text-white"
                        }`}
                      >
                        Configuración
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <DropdownMenu>
                  <DropdownMenuTrigger className="max-w-xs bg-primary-600 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-800 focus:ring-white">
                    <span className="sr-only">Abrir menú de usuario</span>
                    <div className="h-8 w-8 rounded-full bg-primary-900 flex items-center justify-center text-white">
                      <span>{userInitials}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/mi-perfil">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-primary-600 inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-800 focus:ring-white"
              >
                <span className="sr-only">Abrir menú principal</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* La página de consultas es accesible para todos los usuarios */}
              <Link
                href="/consultas"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location === "/consultas" || location === "/"
                    ? "bg-primary-900 text-white"
                    : "text-gray-300 hover:bg-primary-600 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Consultas
              </Link>
              
              {(user?.rol === "admin" || user?.rol === "investigador") && (
                <>
                  <Link
                    href="/registros"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location === "/registros"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registros
                  </Link>
                  
                  <Link
                    href="/ubicaciones"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location === "/ubicaciones"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ubicaciones
                  </Link>
                  
                  <Link
                    href="/estructuras"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location === "/estructuras"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Estructuras
                  </Link>
                </>
              )}
              
              {user?.rol === "admin" && (
                <>
                  <Link
                    href="/admin"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location === "/admin"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administración
                  </Link>
                  <Link
                    href="/configuracion"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location === "/configuracion"
                        ? "bg-primary-900 text-white"
                        : "text-gray-300 hover:bg-primary-600 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Configuración
                  </Link>
                </>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-primary-800">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-900 flex items-center justify-center text-white">
                    <span>{userInitials}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {user?.nombre || 'Usuario'}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-300 mt-1">
                    {user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Usuario'}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  href="/mi-perfil"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <a
                  href="#"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-primary-600"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Cerrar Sesión
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 py-6">
        {children}
      </main>
    </div>
  );
}
