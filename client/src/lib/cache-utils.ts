import { queryClient } from "./queryClient";

/**
 * Función centralizada para invalidar todas las consultas relevantes cuando
 * se crean, actualizan o eliminan registros en la aplicación.
 * 
 * @param specificQueryKey Clave específica de consulta a invalidar (opcional)
 */
export function invalidateAllQueries(specificQueryKey?: string) {
  console.log("🔄 Invalidando todas las consultas relevantes...");
  
  // Lista de todas las consultas principales que deben invalidarse cuando
  // cualquier dato cambia en la aplicación
  const queryKeysToInvalidate = [
    '/api/personas',
    '/api/vehiculos',
    '/api/inmuebles',
    '/api/ubicaciones',
    '/api/tipos-inmuebles',
    '/api/tipos-ubicaciones',
    '/api/buscar',
  ];
  
  // Si se proporciona una clave específica, invalidarla primero
  if (specificQueryKey) {
    console.log(`🎯 Invalidando consulta específica: ${specificQueryKey}`);
    queryClient.invalidateQueries({ queryKey: [specificQueryKey] });
    
    // Forzar un refetch inmediato
    queryClient.refetchQueries({ queryKey: [specificQueryKey] });
  }
  
  // Invalidar todas las consultas relevantes
  for (const key of queryKeysToInvalidate) {
    console.log(`🔄 Invalidando consulta: ${key}`);
    
    // Invalidar la consulta exacta y forzar refetch
    queryClient.invalidateQueries({ queryKey: [key] });
    queryClient.refetchQueries({ queryKey: [key] });
    
    // También invalidar cualquier consulta que use esta clave como parte de un arreglo
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.length > 0 && queryKey[0] === key;
      }
    });
  }
  
  // Forzar un refetch global después de un pequeño retraso para asegurar que todas las invalidaciones se apliquen
  setTimeout(() => {
    console.log("🔄 Forzando refetch global de todas las consultas activas");
    queryClient.refetchQueries();
  }, 300);
  
  console.log("✅ Todas las consultas invalidadas correctamente");
}

/**
 * Invalidar y refrescar inmediatamente una consulta específica
 */
export function refreshQuery(queryKey: string | string[]) {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  console.log(`🔄 Refrescando consulta: ${key.join('/')}`);
  
  // Primero invalidamos la caché
  queryClient.invalidateQueries({ queryKey: key });
  
  // Luego forzamos un refetch
  return queryClient.refetchQueries({ queryKey: key });
}