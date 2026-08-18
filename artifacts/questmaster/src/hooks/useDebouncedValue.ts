import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`.
 * Used by the compendium search field so filtering/fetching does not run on
 * every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
