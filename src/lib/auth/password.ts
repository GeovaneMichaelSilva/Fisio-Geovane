import { z } from "zod";

/**
 * Requisitos alinhados ao hub-adseleto (reset/invite):
 * 8+ chars, maiúscula, minúscula, dígito e caractere especial.
 */
export const PASSWORD_REQUIREMENTS_HINT =
	"Mín. 8 caracteres, com maiúscula, minúscula, número e caractere especial.";

export type PasswordRule = {
	id: string;
	label: string;
	test: (password: string) => boolean;
};

/** Regras exibidas no checklist (mesma lógica do schema). */
export const PASSWORD_RULES: PasswordRule[] = [
	{
		id: "min-length",
		label: "Pelo menos 8 caracteres",
		test: (password) => password.length >= 8
	},
	{
		id: "uppercase",
		label: "Uma letra maiúscula",
		test: (password) => /[A-Z]/.test(password)
	},
	{
		id: "lowercase",
		label: "Uma letra minúscula",
		test: (password) => /[a-z]/.test(password)
	},
	{
		id: "digit",
		label: "Um número",
		test: (password) => /\d/.test(password)
	},
	{
		id: "special",
		label: "Um caractere especial",
		test: (password) => /[^A-Za-z0-9]/.test(password)
	}
];

export const evaluatePasswordRules = (password: string) =>
	PASSWORD_RULES.map((rule) => ({
		...rule,
		valid: rule.test(password)
	}));

export const passwordSchema = z
	.string()
	.min(8, "A senha deve ter pelo menos 8 caracteres.")
	.max(128, "Máximo 128 caracteres.")
	.regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula.")
	.regex(/[a-z]/, "Inclua pelo menos uma letra minúscula.")
	.regex(/\d/, "Inclua pelo menos um número.")
	.regex(/[^A-Za-z0-9]/, "Inclua pelo menos um caractere especial.");

export type PasswordValue = z.infer<typeof passwordSchema>;
