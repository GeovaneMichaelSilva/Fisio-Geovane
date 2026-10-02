import type { ZodError } from "zod";

/**
 * Extrai a primeira mensagem de erro por campo (útil em forms controlados).
 */
export function zodFieldErrors(
	error: ZodError
): Record<string, string | undefined> {
	const flat = error.flatten().fieldErrors as Record<
		string,
		string[] | undefined
	>;
	const out: Record<string, string | undefined> = {};
	for (const [key, messages] of Object.entries(flat)) {
		out[key] = Array.isArray(messages) ? messages[0] : undefined;
	}
	return out;
}
