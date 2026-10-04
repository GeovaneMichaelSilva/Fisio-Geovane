import { z } from "zod";

import { passwordSchema } from "@/lib/auth/password";

export const teamMemberCreateSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(1, "Nome obrigatório.")
		.max(120, "Máximo 120 caracteres."),
	email: z
		.string()
		.trim()
		.min(1, "E-mail obrigatório.")
		.email("E-mail inválido.")
		.transform((v) => v.toLowerCase()),
	password: passwordSchema,
	role: z.enum(["staff", "owner"]).default("staff")
});

export type TeamMemberCreateInput = z.input<typeof teamMemberCreateSchema>;
export type TeamMemberCreateParsed = z.output<typeof teamMemberCreateSchema>;
