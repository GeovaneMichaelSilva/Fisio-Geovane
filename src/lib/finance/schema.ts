import { z } from "zod";

const dateParam = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD).");

/**
 * Query string do financeiro: período opcional por data da sessão.
 */
export const financeQuerySchema = z
	.object({
		from: dateParam.optional(),
		to: dateParam.optional()
	})
	.superRefine((data, ctx) => {
		if (data.from && data.to && data.from > data.to) {
			ctx.addIssue({
				code: "custom",
				message: "A data inicial não pode ser depois da final.",
				path: ["from"]
			});
		}
		if ((data.from && !data.to) || (!data.from && data.to)) {
			ctx.addIssue({
				code: "custom",
				message: "Informe from e to juntos.",
				path: ["from"]
			});
		}
	});

export type FinanceQuery = z.infer<typeof financeQuerySchema>;
