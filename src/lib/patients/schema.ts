import { z } from "zod";

import { isValidCpf } from "@/lib/patients/cpf";

/** Mantém só dígitos. */
export function digitsOnly(value: string | null | undefined): string {
	return (value ?? "").replace(/\D/g, "");
}

/** String vazia / só espaços → null. */
export function emptyToNull(value: string | null | undefined): string | null {
	const t = (value ?? "").trim();
	return t === "" ? null : t;
}

const optionalDigits = (len: number, label: string) =>
	z
		.string()
		.trim()
		.transform((v) => digitsOnly(v))
		.refine((v) => v === "" || v.length === len, {
			message: `${label} deve ter ${len} dígitos.`
		})
		.transform((v) => (v === "" ? null : v));

const optionalNumber = (min: number, max: number, label: string) =>
	z
		.union([z.number(), z.nan(), z.null(), z.undefined()])
		.transform((v) => (v === null || v === undefined || Number.isNaN(v) ? null : v))
		.refine((v) => v === null || (v >= min && v <= max), {
			message: `${label} inválido.`
		});

export const patientFormSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(1, "Nome obrigatório.")
		.max(160, "Máximo 160 caracteres."),
	phone: z
		.string()
		.trim()
		.max(32, "Máximo 32 caracteres.")
		.transform((v) => emptyToNull(v)),
	cpf: z
		.string()
		.trim()
		.transform((v) => digitsOnly(v))
		.refine((v) => v === "" || v.length === 11, {
			message: "CPF deve ter 11 dígitos."
		})
		.refine((v) => isValidCpf(v), {
			message: "CPF inválido."
		})
		.transform((v) => (v === "" ? null : v)),
	birthDate: z
		.string()
		.trim()
		.transform((v) => emptyToNull(v))
		.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
			message: "Data inválida."
		}),
	weightKg: optionalNumber(1, 500, "Peso"),
	heightCm: optionalNumber(30, 250, "Altura"),
	preferredServiceTypeId: z
		.string()
		.trim()
		.min(1, "Selecione o tipo preferencial.")
		.uuid("Selecione o tipo preferencial."),
	addressStreet: z
		.string()
		.trim()
		.max(160, "Máximo 160 caracteres.")
		.transform((v) => emptyToNull(v)),
	addressNumber: z
		.string()
		.trim()
		.max(32, "Máximo 32 caracteres.")
		.transform((v) => emptyToNull(v)),
	addressNeighborhood: z
		.string()
		.trim()
		.max(80, "Máximo 80 caracteres.")
		.transform((v) => emptyToNull(v)),
	addressCity: z
		.string()
		.trim()
		.max(80, "Máximo 80 caracteres.")
		.transform((v) => emptyToNull(v)),
	addressZip: optionalDigits(8, "CEP"),
	notes: z
		.string()
		.trim()
		.max(4000, "Máximo 4000 caracteres.")
		.transform((v) => emptyToNull(v))
});

export type PatientFormValues = z.input<typeof patientFormSchema>;
export type PatientFormParsed = z.output<typeof patientFormSchema>;

export function patientToFormValues(patient: {
	fullName: string;
	phone: string | null;
	cpf: string | null;
	birthDate: string | null;
	weightKg: string | null;
	heightCm: string | null;
	preferredServiceTypeId: string;
	addressStreet: string | null;
	addressNumber: string | null;
	addressNeighborhood: string | null;
	addressCity: string | null;
	addressZip: string | null;
	notes: string | null;
}): PatientFormValues {
	return {
		fullName: patient.fullName,
		phone: patient.phone ?? "",
		cpf: patient.cpf ?? "",
		birthDate: patient.birthDate ?? "",
		weightKg: patient.weightKg ? Number(patient.weightKg) : null,
		heightCm: patient.heightCm ? Number(patient.heightCm) : null,
		preferredServiceTypeId: patient.preferredServiceTypeId,
		addressStreet: patient.addressStreet ?? "",
		addressNumber: patient.addressNumber ?? "",
		addressNeighborhood: patient.addressNeighborhood ?? "",
		addressCity: patient.addressCity ?? "",
		addressZip: patient.addressZip ?? "",
		notes: patient.notes ?? ""
	};
}
