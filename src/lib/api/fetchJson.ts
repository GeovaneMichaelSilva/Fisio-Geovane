/**
 * Fetch JSON tipado para Route Handlers do admin.
 * Lança Error com message da API em falha.
 */
export const fetchJson = async <T>(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<T> => {
	const res = await fetch(input, init);
	const json = (await res.json().catch(() => ({}))) as {
		data?: T;
		error?: string;
		meta?: unknown;
	};

	if (!res.ok) {
		throw new Error(json.error || "Falha na requisição.");
	}

	return json as T;
};

/**
 * Convenção das APIs admin: `{ data, meta? }`.
 */
export const fetchApiData = async <T>(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<T> => {
	const res = await fetch(input, init);
	const json = (await res.json().catch(() => ({}))) as {
		data?: T;
		error?: string;
	};

	if (!res.ok) {
		throw new Error(json.error || "Falha na requisição.");
	}

	return (json.data ?? json) as T;
};

/** DELETE / ações sem corpo útil. */
export const fetchApiOk = async (
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<void> => {
	const res = await fetch(input, init);
	if (res.status === 204) return;
	const json = (await res.json().catch(() => ({}))) as { error?: string };
	if (!res.ok) {
		throw new Error(json.error || "Falha na requisição.");
	}
};

export const fetchApiList = async <TData, TMeta = unknown>(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<{ data: TData; meta: TMeta }> => {
	const res = await fetch(input, init);
	const json = (await res.json().catch(() => ({}))) as {
		data?: TData;
		meta?: TMeta;
		error?: string;
	};

	if (!res.ok) {
		throw new Error(json.error || "Falha na requisição.");
	}

	return {
		data: json.data as TData,
		meta: json.meta as TMeta
	};
};
