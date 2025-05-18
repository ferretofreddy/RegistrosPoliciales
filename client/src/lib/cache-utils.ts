import { queryClient } from "./queryClient";

/**
 * Función centralizada para invalidar todas las consultas relevantes cuando
 * se crean, actualizan o eliminan registros en la aplicación.
 * 
 * Esta función garantiza que todos los selectores y listas desplegables
 * de la aplicación muestren los datos más recientes inmediatamente después
 * de guardar un registro en cualquier formulario.
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
    queryClient.refetchQueries({ queryKey: [specificQueryKey], exact: false });
  }
  
  // Invalidar todas las consultas relevantes inmediatamente
  const promises = [];
  
  for (const key of queryKeysToInvalidate) {
    console.log(`🔄 Invalidando consulta: ${key}`);
    
    // Invalidar la consulta exacta
    queryClient.invalidateQueries({ queryKey: [key] });
    
    // Añadir la promesa de refetch a la lista
    promises.push(queryClient.refetchQueries({ queryKey: [key], exact: false }));
    
    // También invalidar cualquier consulta que use esta clave como parte de un arreglo
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.length > 0 && queryKey[0] === key;
      }
    });
  }
  
  // Forzar un refetch global inmediato
  promises.push(queryClient.refetchQueries());
  
  // Esperar a que todas las operaciones de refetch se completen
  Promise.all(promises)
    .then(() => console.log("✅ Todas las consultas han sido actualizadas correctamente"))
    .catch(error => console.error("❌ Error al actualizar consultas:", error));
  
  console.log("✅ Proceso de invalidación de consultas iniciado correctamente");
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