import { z } from "zod";

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
	password: z
		.string()
		.min(8, "Senha com no mínimo 8 caracteres.")
		.max(128, "Máximo 128 caracteres."),
	role: z.enum(["staff", "owner"]).default("staff")
});

export type TeamMemberCreateInput = z.input<typeof teamMemberCreateSchema>;
export type TeamMemberCreateParsed = z.output<typeof teamMemberCreateSchema>;
