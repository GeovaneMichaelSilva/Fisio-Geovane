import { z } from "zod";

/** Mantém só dígitos. */
export const digitsOnly = (value: string | null | undefined): string => {
	return (value ?? "").replace(/\D/g, "");
};

/** String vazia / só espaços → null. */
export const emptyToNull = (
	value: string | null | undefined
): string | null => {
	const t = (value ?? "").trim();
	return t === "" ? null : t;
};

/**
 * Texto opcional (create / form completo): aceita string | null | undefined | "".
 * Saída: `string | null`. Chave omitida é aceita.
 */
export const optionalTextMax = (max: number) =>
	z.preprocess(
		(v) => emptyToNull(v as string | null | undefined),
		z
			.string()
			.max(max, { message: `Máximo ${max} caracteres.` })
			.nullable()
	);

/**
 * Texto opcional em PATCH: chave omitida → undefined; null/"" → null.
 */
export const optionalTextPatch = (max: number) =>
	z.preprocess(
		(v) => {
			if (v === undefined) return undefined;
			return emptyToNull(v as string | null);
		},
		z
			.string()
			.max(max, { message: `Máximo ${max} caracteres.` })
			.nullable()
			.optional()
	);

/** Dígitos opcionais (CEP/CPF-like): vazio → null. */
export const optionalDigits = (len: number, label: string) =>
	z.preprocess(
		(v) => {
			const digits = digitsOnly(v as string | null | undefined);
			return digits === "" ? null : digits;
		},
		z
			.string()
			.length(len, { message: `${label} deve ter ${len} dígitos.` })
			.nullable()
	);

/** Número opcional (aceita null/NaN/undefined). */
export const optionalNumber = (min: number, max: number, label: string) =>
	z.preprocess(
		(v) => {
			if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) {
				return null;
			}
			return v;
		},
		z
			.number()
			.min(min, { message: `${label} inválido.` })
			.max(max, { message: `${label} inválido.` })
			.nullable()
	);

/**
 * Data YYYY-MM-DD (create / form): vazio/null/undefined → null.
 */
export const optionalDate = (label = "Data") =>
	z.preprocess(
		(v) => emptyToNull(v as string | null | undefined),
		z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, { message: `${label} inválida.` })
			.nullable()
	);

/**
 * Data YYYY-MM-DD em PATCH: omitida → undefined; ""/null → null.
 */
export const optionalDatePatch = (label = "Data") =>
	z.preprocess(
		(v) => {
			if (v === undefined) return undefined;
			return emptyToNull(v as string | null);
		},
		z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, { message: `${label} inválida.` })
			.nullable()
			.optional()
	);
