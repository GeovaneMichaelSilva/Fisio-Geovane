/**
 * Remove caracteres não numéricos do CPF.
 */
export function digitsOnlyCpf(value: string): string {
	return value.replace(/\D/g, "");
}

/**
 * Valida CPF brasileiro (11 dígitos + dígitos verificadores).
 * Aceita vazio como “não informado”.
 */
export function isValidCpf(value: string | null | undefined): boolean {
	const cpf = digitsOnlyCpf(value ?? "");
	if (cpf.length === 0) return true;
	if (cpf.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(cpf)) return false;

	const calcDigit = (base: string, factor: number) => {
		let sum = 0;
		for (let i = 0; i < base.length; i += 1) {
			sum += Number(base[i]) * (factor - i);
		}
		const mod = (sum * 10) % 11;
		return mod === 10 ? 0 : mod;
	};

	const d1 = calcDigit(cpf.slice(0, 9), 10);
	const d2 = calcDigit(cpf.slice(0, 10), 11);
	return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

/**
 * Formata CPF como 000.000.000-00 (só se tiver 11 dígitos).
 */
export function formatCpf(value: string | null | undefined): string {
	const cpf = digitsOnlyCpf(value ?? "");
	if (cpf.length !== 11) return cpf;
	return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}
