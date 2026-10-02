import { z } from "zod";

export const serviceTypeFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Nome obrigatório.")
		.max(80, "Máximo 80 caracteres."),
	defaultDurationMinutes: z.coerce
		.number({ error: "Informe a duração." })
		.int("Use um número inteiro.")
		.min(5, "Mínimo 5 minutos.")
		.max(480, "Máximo 480 minutos."),
	defaultValueBrl: z.coerce
		.number({ error: "Informe o valor." })
		.min(0, "Valor inválido.")
		.max(999_999.99, "Valor muito alto."),
	isActive: z.boolean(),
	sortOrder: z.coerce
		.number()
		.int()
		.min(0)
		.max(9999)
		.optional()
});

export const serviceTypeCreateSchema = serviceTypeFormSchema;

export const serviceTypeUpdateSchema = serviceTypeFormSchema.partial();

export type ServiceTypeFormValues = z.input<typeof serviceTypeFormSchema>;
export type ServiceTypeFormParsed = z.output<typeof serviceTypeFormSchema>;
