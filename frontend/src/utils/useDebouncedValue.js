import { useState, useEffect } from 'react';

/**
 * Değeri gecikmeli döndürür (arama/filtre API spam önleme).
 */
export function useDebouncedValue(value, delayMs = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
}
