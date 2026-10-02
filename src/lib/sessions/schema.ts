import { z } from "zod";

export const sessionCreateSchema = z.object({
	patientId: z.string().uuid("Selecione o paciente."),
	scheduledDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
	scheduledTime: z
		.string()
		.regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido."),
	durationMinutes: z.number().int().min(5).max(480).default(50),
	serviceTypeId: z.string().uuid("Selecione o tipo."),
	valueBrl: z.number().min(0).max(999_999.99).optional(),
	allowOverlap: z.boolean().optional().default(false),
	overlapReason: z.string().trim().max(1000).optional()
});

export const sessionUpdateSchema = z.object({
	patientId: z.string().uuid().optional(),
	scheduledDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	scheduledTime: z
		.string()
		.regex(/^\d{2}:\d{2}(:\d{2})?$/)
		.optional(),
	durationMinutes: z.number().int().min(5).max(480).optional(),
	serviceTypeId: z.string().uuid().optional(),
	valueBrl: z.number().min(0).max(999_999.99).optional(),
	status: z.enum(["scheduled", "completed", "canceled", "no_show"]).optional(),
	assessment: z.string().max(20000).nullable().optional(),
	evolution: z.string().max(20000).nullable().optional(),
	activities: z.string().max(20000).nullable().optional(),
	paid: z.boolean().optional(),
	paidAt: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable()
		.optional(),
	invoiceIssued: z.boolean().optional(),
	reason: z.string().trim().min(1, "Motivo obrigatório.").max(1000),
	allowOverlap: z.boolean().optional().default(false),
	overlapReason: z.string().trim().max(1000).optional()
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
