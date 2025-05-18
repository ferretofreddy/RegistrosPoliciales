import { useState, useEffect } from 'react';

/**
 * Custom hook para crear un valor con "debounce".
 * Útil para retrasar operaciones costosas como búsquedas en tiempo real.
 * 
 * @param value Valor inicial que quieres aplicar debounce
 * @param delay Tiempo de espera en milisegundos antes de actualizar el valor (por defecto: 500ms)
 * @returns El valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar el timer para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timer si el valor cambia (o el componente se desmonta)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}