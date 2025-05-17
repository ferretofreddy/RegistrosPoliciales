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
  }
  
  // Invalidar todas las consultas relevantes
  queryKeysToInvalidate.forEach(key => {
    console.log(`🔄 Invalidando consulta: ${key}`);
    queryClient.invalidateQueries({ queryKey: [key] });
    
    // También invalidar cualquier consulta que use esta clave como parte de un arreglo
    // (Para manejar consultas como ['/api/buscar', searchTerm] o ['/api/ubicaciones', searchTerm, filters])
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.length > 0 && queryKey[0] === key;
      }
    });
  });
  
  console.log("✅ Todas las consultas invalidadas correctamente");
}