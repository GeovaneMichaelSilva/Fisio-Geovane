"use client";

import { useCallback, useEffect, useState } from "react";

type UseLocalStorageStateOptions<T> = {
	key: string;
	initialValue: T;
	/** Valida o valor lido do storage; se falhar, usa initialValue. */
	parse?: (raw: unknown) => T | null;
};

/**
 * Estado React sincronizado com localStorage (client-only).
 * Sem migrations — preferências de UI simples.
 */
export const useLocalStorageState = <T>(
	options: UseLocalStorageStateOptions<T>
) => {
	const { key, initialValue, parse } = options;
	const [value, setValueState] = useState<T>(initialValue);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(key);
			if (raw == null) {
				setLoaded(true);
				return;
			}
			const parsedJson: unknown = JSON.parse(raw);
			const next = parse ? parse(parsedJson) : (parsedJson as T);
			if (next != null) {
				setValueState(next);
			}
		} catch {
			// ignora storage corrompido
		} finally {
			setLoaded(true);
		}
	}, [key, parse]);

	const setValue = useCallback(
		(next: T | ((prev: T) => T)) => {
			setValueState((prev) => {
				const resolved =
					typeof next === "function" ? (next as (p: T) => T)(prev) : next;
				try {
					window.localStorage.setItem(key, JSON.stringify(resolved));
				} catch {
					// quota / private mode
				}
				return resolved;
			});
		},
		[key]
	);

	return { value, setValue, loaded };
};
