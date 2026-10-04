import { z } from "zod";

import { emptyToNull } from "@/lib/zod/optional";

const dateParam = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((v) => emptyToNull(v))
	.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
		message: "Data inválida (use YYYY-MM-DD)."
	});

/**
 * Query string do financeiro: período opcional por data da sessão.
 * Aceita null/undefined/"" (ausente).
 */
export const financeQuerySchema = z
	.object({
		from: dateParam,
		to: dateParam
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

export type FinanceQuery = {
	from: string | null;
	to: string | null;
};
