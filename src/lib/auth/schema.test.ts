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
	it("exige senhas iguais e diferentes da atual", () => {
		expect(
			changePasswordSchema.safeParse({
				currentPassword: "antiga123",
				password: "nova12345",
				confirmPassword: "nova12345"
			}).success
		).toBe(true);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: "igual1234",
				password: "igual1234",
				confirmPassword: "igual1234"
			}).success
		).toBe(false);

		expect(
			changePasswordSchema.safeParse({
				currentPassword: "antiga123",
				password: "nova12345",
				confirmPassword: "outra"
			}).success
		).toBe(false);
	});
});
