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
  // Convertir URLs relativas a absolutas usando la misma base de la ventana actual
  // y asegurarnos de que sea compatible con HTTP y HTTPS
  let fullUrl = url;
  if (!url.startsWith('http')) {
    // Usar protocol-relative URL para ser compatible con ambos protocolos
    const protocol = window.location.protocol;
    const host = window.location.host;
    fullUrl = `${protocol}//${host}${url.startsWith('/') ? url : `/${url}`}`;
  }
  
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
    // Asegurarse de que la URL sea compatible con HTTP y HTTPS
    const url = queryKey[0] as string;
    let fullUrl = url;
    if (!url.startsWith('http')) {
      // Usar protocol-relative URL para ser compatible con ambos protocolos
      const protocol = window.location.protocol;
      const host = window.location.host;
      fullUrl = `${protocol}//${host}${url.startsWith('/') ? url : `/${url}`}`;
    }
    
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
      refetchOnWindowFocus: true,  // Actualizará al volver a enfocar la ventana
      staleTime: 30000,  // Los datos se consideran obsoletos después de 30 segundos
      retry: (failureCount, error: any) => {
        // No reintentar cuando el error es 401 o 403
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        
        // Comprobar si es un error de conexión
        const isConnectionError = error instanceof Error && 
          (error.message.includes('Error de conexión') || 
           error.message.includes('NetworkError') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('Network request failed'));
        
        // Para errores de conexión, reintentar hasta 5 veces
        if (isConnectionError) {
          console.log(`Reintentando solicitud fallida (${failureCount + 1}/5)...`);
          return failureCount < 5;
        }
        
        // Para otros errores, reintentar máximo 3 veces
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Backoff exponencial con máximo de 30s
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        
        // Comprobar si es un error de conexión
        const isConnectionError = error instanceof Error && 
          (error.message.includes('Error de conexión') || 
           error.message.includes('NetworkError') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('Network request failed'));
        
        // Para errores de conexión, reintentar hasta 3 veces
        if (isConnectionError) {
          console.log(`Reintentando mutación fallida (${failureCount + 1}/3)...`);
          return failureCount < 3;
        }
        
        // Para otros errores, solo reintentar una vez
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 15000), // Backoff exponencial con máximo de 15s
    },
  },
});
