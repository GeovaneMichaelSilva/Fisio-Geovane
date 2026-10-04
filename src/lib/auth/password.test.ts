import { describe, expect, it } from "vitest";

import { passwordSchema } from "./password";

describe("passwordSchema", () => {
	it("aceita senha forte no padrão do hub", () => {
		expect(passwordSchema.safeParse("NovaSenha1!").success).toBe(true);
	});

	it("rejeita senha curta", () => {
		expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
	});

	it("exige maiúscula, minúscula, número e especial", () => {
		expect(passwordSchema.safeParse("novasenha1!").success).toBe(false);
		expect(passwordSchema.safeParse("NOVASENHA1!").success).toBe(false);
		expect(passwordSchema.safeParse("NovaSenha!").success).toBe(false);
		expect(passwordSchema.safeParse("NovaSenha1").success).toBe(false);
	});
});
