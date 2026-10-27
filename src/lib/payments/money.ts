/**
 * Helpers monetários em centavos (inteiros) para evitar erro de ponto flutuante.
 */

export const toCents = (value: number | string): number => {
	const n = typeof value === "string" ? Number(value) : value;
	if (!Number.isFinite(n)) return 0;
	return Math.round(n * 100);
};

/**
 * Converte centavos para string numeric(10,2).
 */
export const fromCents = (cents: number): string => {
	const safe = Math.max(0, Math.round(cents));
	return (safe / 100).toFixed(2);
};

/**
 * Formata BRL a partir de number ou string numeric.
 */
export const formatBrl = (value: string | number): string => {
	const n = typeof value === "string" ? Number(value) : value;
	return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
};

/**
 * Valor já pago efetivo.
 * Rede de segurança: se `paid=true` (dados legados antes do backfill),
 * considera quitado mesmo com amount_paid ainda zerado.
 */
export const effectiveAmountPaidCents = (input: {
	valueBrl: string | number;
	amountPaidBrl: string | number;
	paid: boolean;
}): number => {
	const value = toCents(input.valueBrl);
	if (input.paid) return value;
	return Math.min(value, Math.max(0, toCents(input.amountPaidBrl)));
};

/**
 * Saldo pendente da sessão em centavos.
 */
export const remainingCents = (input: {
	valueBrl: string | number;
	amountPaidBrl: string | number;
	paid: boolean;
}): number => {
	const value = toCents(input.valueBrl);
	return Math.max(0, value - effectiveAmountPaidCents(input));
};

/**
 * Status de pagamento da sessão.
 */
export const sessionPaymentStatus = (input: {
	valueBrl: string | number;
	amountPaidBrl: string | number;
	paid: boolean;
}): "paid" | "partial" | "open" => {
	if (input.paid) return "paid";
	const remaining = remainingCents(input);
	const paidCents = effectiveAmountPaidCents(input);
	if (remaining === 0 && toCents(input.valueBrl) > 0) return "paid";
	if (paidCents > 0 && remaining > 0) return "partial";
	return "open";
};

export const SESSION_PAYMENT_STATUS_LABEL: Record<
	"paid" | "partial" | "open",
	string
> = {
	paid: "Pago",
	partial: "Parcial",
	open: "Em aberto"
};
