import { describe, expect, it } from "vitest";

import { digitsOnlyCpf, formatCpf, isValidCpf } from "./cpf";

describe("digitsOnlyCpf", () => {
	it("remove pontuação", () => {
		expect(digitsOnlyCpf("529.982.247-25")).toBe("52998224725");
	});
});

describe("isValidCpf", () => {
	it("aceita vazio / null / undefined como não informado", () => {
		expect(isValidCpf("")).toBe(true);
		expect(isValidCpf(null)).toBe(true);
		expect(isValidCpf(undefined)).toBe(true);
	});

	it("aceita CPF válido com e sem máscara", () => {
		expect(isValidCpf("529.982.247-25")).toBe(true);
		expect(isValidCpf("52998224725")).toBe(true);
	});

	it("rejeita tamanho incorreto", () => {
		expect(isValidCpf("123")).toBe(false);
		expect(isValidCpf("529982247251")).toBe(false);
	});

	it("rejeita sequências repetidas", () => {
		expect(isValidCpf("11111111111")).toBe(false);
		expect(isValidCpf("000.000.000-00")).toBe(false);
	});

	it("rejeita dígitos verificadores inválidos", () => {
		expect(isValidCpf("529.982.247-26")).toBe(false);
		expect(isValidCpf("12345678901")).toBe(false);
	});
});

describe("formatCpf", () => {
	it("formata com 11 dígitos", () => {
		expect(formatCpf("52998224725")).toBe("529.982.247-25");
	});

	it("devolve só dígitos se incompleto", () => {
		expect(formatCpf("529982")).toBe("529982");
	});
});
