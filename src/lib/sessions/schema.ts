import { z } from "zod";

const dateString = z
	.string()
	.trim()
	.min(1, "Data obrigatória.")
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const timeString = z
	.string()
	.trim()
	.min(1, "Horário obrigatório.")
	.regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido.");

const durationMinutes = z.coerce
	.number({ error: "Informe a duração." })
	.int("Use minutos inteiros.")
	.min(5, "Mínimo 5 minutos.")
	.max(480, "Máximo 480 minutos.");

const valueBrl = z.coerce
	.number({ error: "Informe o valor." })
	.min(0, "Valor inválido.")
	.max(999_999.99, "Valor muito alto.");

const uuidField = (message: string) =>
	z
		.string()
		.trim()
		.min(1, message)
		.uuid(message);

/**
 * Criação de sessão (API + formulário da agenda).
 */
export const sessionCreateSchema = z
	.object({
		patientId: uuidField("Selecione o paciente."),
		scheduledDate: dateString,
		scheduledTime: timeString,
		durationMinutes: durationMinutes.default(50),
		serviceTypeId: uuidField("Selecione o tipo."),
		valueBrl: valueBrl.optional(),
		allowOverlap: z.boolean().optional().default(false),
		overlapReason: z
			.string()
			.trim()
			.max(1000, "Máximo 1000 caracteres.")
			.optional()
	})
	.superRefine((data, ctx) => {
		if (data.allowOverlap && !data.overlapReason?.trim()) {
			ctx.addIssue({
				code: "custom",
				message: "Informe o motivo do override de sobreposição.",
				path: ["overlapReason"]
			});
		}
	});

/**
 * Atualização parcial de sessão (API).
 */
export const sessionUpdateSchema = z
	.object({
		patientId: z.string().uuid("Paciente inválido.").optional(),
		scheduledDate: dateString.optional(),
		scheduledTime: timeString.optional(),
		durationMinutes: durationMinutes.optional(),
		serviceTypeId: z.string().uuid("Tipo inválido.").optional(),
		valueBrl: valueBrl.optional(),
		status: z
			.enum(["scheduled", "completed", "canceled", "no_show"], {
				error: "Status inválido."
			})
			.optional(),
		assessment: z
			.string()
			.max(20000, "Máximo 20000 caracteres.")
			.nullable()
			.optional(),
		evolution: z
			.string()
			.max(20000, "Máximo 20000 caracteres.")
			.nullable()
			.optional(),
		activities: z
			.string()
			.max(20000, "Máximo 20000 caracteres.")
			.nullable()
			.optional(),
		paid: z.boolean().optional(),
		paidAt: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
			.nullable()
			.optional(),
		invoiceIssued: z.boolean().optional(),
		reason: z
			.string()
			.trim()
			.min(1, "Motivo obrigatório.")
			.max(1000, "Máximo 1000 caracteres."),
		allowOverlap: z.boolean().optional().default(false),
		overlapReason: z
			.string()
			.trim()
			.max(1000, "Máximo 1000 caracteres.")
			.optional()
	})
	.superRefine((data, ctx) => {
		if (data.allowOverlap && !data.overlapReason?.trim()) {
			ctx.addIssue({
				code: "custom",
				message: "Informe o motivo do override de sobreposição.",
				path: ["overlapReason"]
			});
		}
		if (data.paid === true && !data.paidAt) {
			ctx.addIssue({
				code: "custom",
				message: "Informe a data de pagamento.",
				path: ["paidAt"]
			});
		}
		if (
			data.status === "completed" &&
			!(data.evolution && data.evolution.trim().length > 0)
		) {
			ctx.addIssue({
				code: "custom",
				message: "Evolução é obrigatória para marcar como realizado.",
				path: ["evolution"]
			});
		}
	});

/**
 * Formulário de edição de agendamento (aba Agenda da sessão).
 */
export const sessionScheduleFormSchema = z.object({
	patientId: uuidField("Selecione o paciente."),
	scheduledDate: dateString,
	scheduledTime: timeString,
	durationMinutes,
	serviceTypeId: uuidField("Selecione o tipo."),
	valueBrl,
	status: z.enum(["scheduled", "completed", "canceled", "no_show"], {
		error: "Status inválido."
	}),
	reason: z
		.string()
		.trim()
		.min(1, "Motivo obrigatório.")
		.max(1000, "Máximo 1000 caracteres.")
});

/**
 * Formulário clínico (rascunho ou conclusão).
 */
export const sessionClinicalFormSchema = z
	.object({
		assessment: z.string().max(20000, "Máximo 20000 caracteres."),
		evolution: z.string().max(20000, "Máximo 20000 caracteres."),
		activities: z.string().max(20000, "Máximo 20000 caracteres."),
		complete: z.boolean()
	})
	.superRefine((data, ctx) => {
		if (data.complete && !data.evolution.trim()) {
			ctx.addIssue({
				code: "custom",
				message: "Evolução é obrigatória para concluir o atendimento.",
				path: ["evolution"]
			});
		}
	});

/**
 * Formulário financeiro da sessão.
 */
export const sessionFinanceFormSchema = z
	.object({
		valueBrl,
		paid: z.boolean(),
		paidAt: z.string().trim(),
		invoiceIssued: z.boolean(),
		reason: z
			.string()
			.trim()
			.min(1, "Informe o motivo da alteração financeira.")
			.max(1000, "Máximo 1000 caracteres.")
	})
	.superRefine((data, ctx) => {
		if (data.paid) {
			if (!data.paidAt) {
				ctx.addIssue({
					code: "custom",
					message: "Informe a data de pagamento.",
					path: ["paidAt"]
				});
			} else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.paidAt)) {
				ctx.addIssue({
					code: "custom",
					message: "Data inválida.",
					path: ["paidAt"]
				});
			}
		}
	});

export type SessionCreateInput = z.input<typeof sessionCreateSchema>;
export type SessionCreateParsed = z.output<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.input<typeof sessionUpdateSchema>;
export type SessionUpdateParsed = z.output<typeof sessionUpdateSchema>;
export type SessionScheduleFormValues = z.input<typeof sessionScheduleFormSchema>;
export type SessionClinicalFormValues = z.input<typeof sessionClinicalFormSchema>;
export type SessionFinanceFormValues = z.input<typeof sessionFinanceFormSchema>;
