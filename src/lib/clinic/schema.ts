import { z } from "zod";

export const clinicUpdateSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Nome obrigatório.")
		.max(120, "Máximo 120 caracteres."),
	professionLabel: z
		.string()
		.trim()
		.min(1, "Profissão obrigatória.")
		.max(80, "Máximo 80 caracteres."),
	licenseNumber: z
		.string()
		.trim()
		.max(40, "Máximo 40 caracteres.")
		.transform((v) => (v === "" ? null : v)),
	timezone: z
		.string()
		.trim()
		.min(1, "Fuso horário obrigatório.")
		.max(64, "Máximo 64 caracteres."),
	defaultSessionDurationMinutes: z.coerce
		.number({ error: "Informe a duração." })
		.int("Use um número inteiro.")
		.min(5, "Mínimo 5 minutos.")
		.max(480, "Máximo 480 minutos.")
});

export type ClinicUpdateInput = z.input<typeof clinicUpdateSchema>;
export type ClinicUpdateParsed = z.output<typeof clinicUpdateSchema>;
