import { z } from "zod";

const moneyAmount = z.coerce
	.number({ error: "Informe o valor recebido." })
	.positive("Informe um valor maior que zero.")
	.max(999_999.99, "Valor muito alto.");

const paidAtDate = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

/**
 * Baixa na ficha do paciente (alocação FIFO automática).
 */
const optionalNote = z
	.string()
	.max(1000, "Máximo 1000 caracteres.")
	.optional()
	.transform((v) => {
		const t = (v ?? "").trim();
		return t.length ? t : undefined;
	});

export const patientPaymentSchema = z.object({
	amountBrl: moneyAmount,
	paidAt: paidAtDate,
	note: optionalNote
});

/**
 * Baixa vinculada a um atendimento específico.
 */
export const sessionPaymentSchema = z.object({
	amountBrl: moneyAmount,
	paidAt: paidAtDate,
	note: optionalNote,
	invoiceIssued: z.boolean().optional()
});

/**
 * Estorno total ou parcial de uma baixa já registrada.
 */
export const paymentRefundSchema = z.object({
	amountBrl: moneyAmount,
	note: optionalNote
});

export type PatientPaymentInput = z.input<typeof patientPaymentSchema>;
export type SessionPaymentInput = z.input<typeof sessionPaymentSchema>;
export type PaymentRefundInput = z.input<typeof paymentRefundSchema>;
