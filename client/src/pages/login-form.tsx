import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ onToggle }: { onToggle: () => void }) {
  const { user, loginMutation } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setApiError(null); // Limpiar cualquier error previo
    
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    }, {
      onSuccess: () => {
        // La redirección ocurrirá en el useEffect cuando el usuario se actualice
      },
      onError: (error: Error) => {
        // Capturar el mensaje de error
        const errorMessage = error.message;
        
        // Verificar si es el mensaje de ACCESO RESTRINGIDO
        if (errorMessage && errorMessage.includes("ACCESO RESTRINGIDO")) {
          setApiError(errorMessage);
        } else if (errorMessage && errorMessage.includes(": ")) {
          // Eliminar el código de status si está presente (ej. "401: Mensaje")
          const cleanMessage = errorMessage.split(": ").slice(1).join(": ");
          setApiError(cleanMessage);
        } else {
          setApiError(errorMessage || "Error de conexión. Intente más tarde.");
        }
      }
    });
  };

  // Estado para almacenar errores de la API
  const [apiError, setApiError] = useState<string | null>(null);

  // Limpiar el error cuando cambian los campos del formulario
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [form.watch('email'), form.watch('password')]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Mensaje de error de API (para usuario inactivo) */}
        {apiError && (
          <div className="p-3 border border-red-500 bg-red-50 rounded-md text-red-800 mb-4">
            {apiError}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Su contraseña"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-medium">
                  Recordarme
                </FormLabel>
              </FormItem>
            )}
          />
          <div className="text-sm">
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              ¿Olvidó su contraseña?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                O
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onToggle}
            >
              Registrarse
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}