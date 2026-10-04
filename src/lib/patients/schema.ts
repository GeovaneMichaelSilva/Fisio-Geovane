import { z } from "zod";

import { isValidCpf } from "@/lib/patients/cpf";
import {
	digitsOnly,
	emptyToNull,
	optionalDate,
	optionalDigits,
	optionalNumber,
	optionalTextMax
} from "@/lib/zod/optional";

export { digitsOnly, emptyToNull };

export const patientFormSchema = z.object({
	fullName: z
		.union([z.string(), z.null(), z.undefined()])
		.transform((v) => (v ?? "").trim())
		.refine((v) => v.length >= 1, { message: "Nome obrigatório." })
		.refine((v) => v.length <= 160, { message: "Máximo 160 caracteres." }),
	phone: optionalTextMax(32),
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
	birthDate: optionalDate(),
	weightKg: optionalNumber(1, 500, "Peso"),
	heightCm: optionalNumber(30, 250, "Altura"),
	preferredServiceTypeId: z
		.string()
		.trim()
		.min(1, "Selecione o tipo preferencial.")
		.uuid("Selecione o tipo preferencial."),
	addressStreet: optionalTextMax(160),
	addressNumber: optionalTextMax(32),
	addressNeighborhood: optionalTextMax(80),
	addressCity: optionalTextMax(80),
	addressZip: optionalDigits(8, "CEP"),
	notes: optionalTextMax(4000)
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
