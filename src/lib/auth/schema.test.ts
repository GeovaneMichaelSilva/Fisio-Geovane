import { describe, expect, it } from "vitest";

import { changePasswordSchema, loginSchema } from "./schema";

describe("loginSchema", () => {
	it("exige e-mail e senha", () => {
		expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(
			false
		);
		expect(
			loginSchema.safeParse({
				email: "a@b.com",
				password: "x"
			}).success
		).toBe(true);
	});
});

describe("changePasswordSchema", () => {
	it("exige senhas iguais, fortes e diferentes da atual", () => {
		expect(
			changePasswordSchema.safeParse({
				currentPassword: "Antiga1!",
				password: "NovaSenha1!",
				confirmPassword: "NovaSenha1!"
			}).success
		).toBe(true);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: "Igual123!",
				password: "Igual123!",
				confirmPassword: "Igual123!"
			}).success
		).toBe(false);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: "Antiga1!",
				password: "NovaSenha1!",
				confirmPassword: "OutraSenha1!"
			}).success
		).toBe(false);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: "Antiga1!",
				password: "fraca123",
				confirmPassword: "fraca123"
			}).success
		).toBe(false);
	});
});
