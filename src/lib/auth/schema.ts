import { z } from "zod";

export const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "E-mail obrigatório.")
		.email("E-mail inválido."),
	password: z.string().min(1, "Senha obrigatória.")
});

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "E-mail obrigatório.")
		.email("E-mail inválido.")
});

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1, "Link inválido. Solicite uma nova recuperação."),
		password: z
			.string()
			.min(8, "A senha deve ter pelo menos 8 caracteres.")
			.max(128, "Máximo 128 caracteres."),
		confirmPassword: z.string().min(1, "Confirme a senha.")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"]
	});

/** Payload enviado à API de reset (sem confirm). */
export const resetPasswordApiSchema = z.object({
	token: z.string().min(1),
	password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128)
});

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
