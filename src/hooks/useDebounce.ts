import { useEffect, useState } from "react";

/**
 * Retorna `value` com atraso (debounce).
 * Útil para buscas automáticas sem botão.
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(id);
	}, [value, delay]);

	return debounced;
}
