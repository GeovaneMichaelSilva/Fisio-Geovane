import { z } from "zod";

import {
	emptyToNull,
	optionalDatePatch,
	optionalTextMax,
	optionalTextPatch
} from "@/lib/zod/optional";

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
	z.string().trim().min(1, message).uuid(message);

/** Motivo de override em create: ausente/null → null */
const overlapReasonCreate = optionalTextMax(1000);

/** Motivo de override em update: omitido ≠ limpar */
const overlapReasonPatch = optionalTextPatch(1000);

/** Texto clínico em PATCH (omitido = não altera). */
const clinicalTextPatch = optionalTextPatch(20000);

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
		overlapReason: overlapReasonCreate
	})
	.superRefine((data, ctx) => {
		if (data.allowOverlap && !data.overlapReason) {
			ctx.addIssue({
				code: "custom",
				message: "Informe o motivo do override de sobreposição.",
				path: ["overlapReason"]
			});
		}
	});

/**
 * Atualização parcial de sessão (API).
 * Campos omitidos não são alterados; `null` / `""` limpam nullable.
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
		assessment: clinicalTextPatch,
		evolution: clinicalTextPatch,
		activities: clinicalTextPatch,
		paid: z.boolean().optional(),
		paidAt: optionalDatePatch("Data de pagamento"),
		invoiceIssued: z.boolean().optional(),
		reason: z
			.string()
			.trim()
			.min(1, "Motivo obrigatório.")
			.max(1000, "Máximo 1000 caracteres."),
		allowOverlap: z.boolean().optional().default(false),
		overlapReason: overlapReasonPatch
	})
	.superRefine((data, ctx) => {
		if (data.allowOverlap && !data.overlapReason) {
			ctx.addIssue({
				code: "custom",
				message: "Informe o motivo do override de sobreposição.",
				path: ["overlapReason"]
			});
		}
		if (data.paid === true && data.paidAt !== undefined && !data.paidAt) {
			ctx.addIssue({
				code: "custom",
				message: "Informe a data de pagamento.",
				path: ["paidAt"]
			});
		}
		if (
			data.status === "completed" &&
			data.evolution !== undefined &&
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
		assessment: z
			.union([z.string(), z.null(), z.undefined()])
			.transform((v) => v ?? ""),
		evolution: z
			.union([z.string(), z.null(), z.undefined()])
			.transform((v) => v ?? ""),
		activities: z
			.union([z.string(), z.null(), z.undefined()])
			.transform((v) => v ?? ""),
		complete: z.boolean()
	})
	.superRefine((data, ctx) => {
		if (data.assessment.length > 20000) {
			ctx.addIssue({
				code: "custom",
				message: "Máximo 20000 caracteres.",
				path: ["assessment"]
			});
		}
		if (data.evolution.length > 20000) {
			ctx.addIssue({
				code: "custom",
				message: "Máximo 20000 caracteres.",
				path: ["evolution"]
			});
		}
		if (data.activities.length > 20000) {
			ctx.addIssue({
				code: "custom",
				message: "Máximo 20000 caracteres.",
				path: ["activities"]
			});
		}
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
		paidAt: z
			.union([z.string(), z.null(), z.undefined()])
			.transform((v) => emptyToNull(v) ?? ""),
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
