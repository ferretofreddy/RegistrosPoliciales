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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  cedula: z.string().min(5, { message: "Cédula inválida" }),
  // Los campos telefono, unidad y rol ya no son obligatorios en el registro
  telefono: z.string().optional(),
  unidad: z.string().optional(),
  rol: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const { user, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nombre: "",
      cedula: "",
      // Valores por defecto para campos opcionales
      telefono: "",
      unidad: "",
      rol: "agente", // Por defecto asignamos rol de agente
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    // Eliminamos confirmPassword y proporcionamos valores por defecto para campos opcionales
    const { confirmPassword, ...formData } = data;
    
    // Creamos objeto con valores por defecto para los campos opcionales
    const userData = {
      ...formData,
      telefono: formData.telefono || "",  // Si es undefined, usar string vacío
      unidad: formData.unidad || "",      // Si es undefined, usar string vacío
      rol: "agente",                      // Siempre asignar rol "agente" por defecto
      activo: "false"                     // Usuarios registrados empiezan inactivos
    };
    
    registerMutation.mutate(userData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre y apellidos" 
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
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Número de identificación" 
                    value={field.value} 
                    onChange={e => field.onChange(e.target.value)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {/* 
          Los campos de teléfono y unidad se han eliminado del formulario de registro
          y serán administrados por el usuario desde su perfil
        */}

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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Repita su contraseña" 
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 
          El campo de rol ha sido eliminado del formulario de registro
          y será administrado exclusivamente por los administradores 
        */}
        
        <div className="mt-1 text-xs text-gray-500 p-2 bg-gray-50 rounded-md">
          <p className="font-medium">Nota importante:</p>
          <p>Al registrarse, su cuenta estará inactiva hasta que un administrador la active.</p>
          <p>Por defecto, se le asignará el rol de "Agente".</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </span>
          ) : (
            "Registrarse"
          )}
        </Button>

        <div className="mt-4 text-center text-sm">
          <p className="text-gray-600">
            ¿Ya tiene una cuenta?{" "}
            <a
              href="#"
              className="font-medium text-primary-600 hover:text-primary-500"
              onClick={(e) => {
                e.preventDefault();
                onToggle();
              }}
            >
              Iniciar Sesión
            </a>
          </p>
        </div>
      </form>
    </Form>
  );
}