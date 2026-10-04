import { z } from "zod";

import { isValidCpf } from "@/lib/patients/cpf";

/** Mantém só dígitos. */
export const digitsOnly = (value: string | null | undefined): string => {
	return (value ?? "").replace(/\D/g, "");
};

/** String vazia / só espaços → null. */
export const emptyToNull = (value: string | null | undefined): string | null => {
	const t = (value ?? "").trim();
	return t === "" ? null : t;
};

/** Campo texto opcional: aceita string | null | undefined (form e API). */
const optionalText = (max: number) =>
	z
		.union([z.string(), z.null(), z.undefined()])
		.transform((v) => emptyToNull(v))
		.refine((v) => v === null || v.length <= max, {
			message: `Máximo ${max} caracteres.`
		});

const optionalDigits = (len: number, label: string) =>
	z
		.union([z.string(), z.null(), z.undefined()])
		.transform((v) => digitsOnly(v))
		.refine((v) => v === "" || v.length === len, {
			message: `${label} deve ter ${len} dígitos.`
		})
		.transform((v) => (v === "" ? null : v));

const optionalNumber = (min: number, max: number, label: string) =>
	z
		.union([z.number(), z.nan(), z.null(), z.undefined()])
		.transform((v) =>
			v === null || v === undefined || Number.isNaN(v) ? null : v
		)
		.refine((v) => v === null || (v >= min && v <= max), {
			message: `${label} inválido.`
		});

export const patientFormSchema = z.object({
	fullName: z
		.union([z.string(), z.null(), z.undefined()])
		.transform((v) => (v ?? "").trim())
		.refine((v) => v.length >= 1, { message: "Nome obrigatório." })
		.refine((v) => v.length <= 160, { message: "Máximo 160 caracteres." }),
	phone: optionalText(32),
	// CPF: vazio → null; se preenchido, valida 11 dígitos + DV
	cpf: z
		.union([z.string(), z.null(), z.undefined()])
		.transform((v) => digitsOnly(v ?? ""))
		.refine((v) => v === "" || v.length === 11, {
			message: "CPF deve ter 11 dígitos."
		})
		.refine((v) => v === "" || isValidCpf(v), {
			message: "CPF inválido."
		})
		.transform((v) => (v === "" ? null : v)),
	birthDate: z
		.union([z.string(), z.null(), z.undefined()])
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
	addressStreet: optionalText(160),
	addressNumber: optionalText(32),
	addressNeighborhood: optionalText(80),
	addressCity: optionalText(80),
	addressZip: optionalDigits(8, "CEP"),
	notes: optionalText(4000)
});

export type PatientFormValues = z.input<typeof patientFormSchema>;
export type PatientFormParsed = z.output<typeof patientFormSchema>;

export const patientToFormValues = (patient: {
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
}): PatientFormValues => {
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
};
