import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Asegurarnos de que la URL sea relativa y compatible con HTTPS
  const fullUrl = url.startsWith('http') ? url : url;
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Error de red en solicitud ${method} a ${fullUrl}:`, error);
    throw new Error(`Error de conexión: La solicitud al servidor falló. Por favor, verifica tu conexión a internet y vuelve a intentarlo.`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Asegurarse de que la URL sea compatible con HTTPS
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : url;
    
    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Error de red en solicitud GET a ${fullUrl}:`, error);
      throw new Error(`Error de conexión: La solicitud al servidor falló. Por favor, verifica tu conexión a internet y vuelve a intentarlo.`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error: any) => {
        // No reintentar cuando el error es 401 o 403
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Reintentar máximo 3 veces para otros errores
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
