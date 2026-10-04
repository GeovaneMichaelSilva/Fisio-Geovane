import { z } from "zod";

import { passwordSchema } from "./password";

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
		password: passwordSchema,
		confirmPassword: z.string().min(1, "Confirme a senha.")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"]
	});

/** Payload enviado à API de reset (sem confirm). */
export const resetPasswordApiSchema = z.object({
	token: z.string().min(1),
	password: passwordSchema
});

/** Troca de senha autenticada (conta logada). */
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Informe a senha atual."),
		password: passwordSchema,
		confirmPassword: z.string().min(1, "Confirme a nova senha.")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem.",
		path: ["confirmPassword"]
	})
	.refine((data) => data.currentPassword !== data.password, {
		message: "A nova senha deve ser diferente da atual.",
		path: ["password"]
	});

/** Payload da API de troca de senha (sem confirm). */
export const changePasswordApiSchema = z.object({
	currentPassword: z.string().min(1, "Informe a senha atual."),
	password: passwordSchema
});

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordParsed = z.output<typeof changePasswordSchema>;

export { passwordSchema, PASSWORD_REQUIREMENTS_HINT } from "./password";
