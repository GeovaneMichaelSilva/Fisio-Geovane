import { fromCents, toCents } from "@/lib/payments/money";

export type AllocatableSession = {
	id: string;
	remainingCents: number;
};

export type AllocationPlanItem = {
	sessionId: string;
	amountCents: number;
	amountBrl: string;
};

/**
 * Distribui `amountCents` nas sessões em ordem (FIFO: quem chama ordena).
 * Determinístico: consome a lista na ordem recebida.
 */
export const allocateFifo = (
	sessions: AllocatableSession[],
	amountCents: number
): AllocationPlanItem[] => {
	let left = Math.round(amountCents);
	if (left <= 0) return [];

	const plan: AllocationPlanItem[] = [];

	for (const session of sessions) {
		if (left <= 0) break;
		const room = Math.max(0, Math.round(session.remainingCents));
		if (room <= 0) continue;
		const take = Math.min(room, left);
		plan.push({
			sessionId: session.id,
			amountCents: take,
			amountBrl: fromCents(take)
		});
		left -= take;
	}

	if (left > 0) {
		throw new Error("AMOUNT_EXCEEDS_PENDING");
	}

	return plan;
};

/**
 * Valida valor de baixa em BRL contra saldo pendente total (centavos).
 */
export const assertPaymentWithinPending = (
	amountBrl: number,
	pendingCents: number
): number => {
	const amountCents = toCents(amountBrl);
	if (amountCents <= 0) {
		throw new Error("AMOUNT_INVALID");
	}
	if (amountCents > pendingCents) {
		throw new Error("AMOUNT_EXCEEDS_PENDING");
	}
	return amountCents;
};

export type RefundableAllocation = {
	sessionId: string;
	/** Quanto desta alocação ainda não foi estornado (centavos). */
	remainingCents: number;
};

/**
 * Desfaz `amountCents` nas alocações em ordem inversa (LIFO):
 * o último atendimento que recebeu a baixa é o primeiro a devolver.
 * Quem chama passa as alocações na ordem original (FIFO); a função inverte.
 */
export const deallocateLifo = (
	allocations: RefundableAllocation[],
	amountCents: number
): AllocationPlanItem[] => {
	let left = Math.round(amountCents);
	if (left <= 0) return [];

	const plan: AllocationPlanItem[] = [];

	for (let i = allocations.length - 1; i >= 0; i -= 1) {
		if (left <= 0) break;
		const allocation = allocations[i];
		if (!allocation) continue;
		const room = Math.max(0, Math.round(allocation.remainingCents));
		if (room <= 0) continue;
		const take = Math.min(room, left);
		plan.push({
			sessionId: allocation.sessionId,
			amountCents: take,
			amountBrl: fromCents(take)
		});
		left -= take;
	}

	if (left > 0) {
		throw new Error("AMOUNT_EXCEEDS_REFUNDABLE");
	}

	return plan;
};

/**
 * Valida valor de estorno em BRL contra o saldo ainda estornável do pagamento.
 */
export const assertRefundWithinRefundable = (
	amountBrl: number,
	refundableCents: number
): number => {
	const amountCents = toCents(amountBrl);
	if (amountCents <= 0) {
		throw new Error("AMOUNT_INVALID");
	}
	if (amountCents > refundableCents) {
		throw new Error("AMOUNT_EXCEEDS_REFUNDABLE");
	}
	return amountCents;
};

export type RefundablePayment = {
	id: string;
	refundableCents: number;
};

export type PaymentRefundSlice = {
	paymentId: string;
	amountCents: number;
	amountBrl: string;
};

/**
 * Parte o valor do estorno entre baixas (já ordenadas da mais recente → antiga).
 */
export const splitRefundAcrossPayments = (
	paymentsNewestFirst: RefundablePayment[],
	amountCents: number
): PaymentRefundSlice[] => {
	let left = Math.round(amountCents);
	if (left <= 0) return [];

	const plan: PaymentRefundSlice[] = [];

	for (const payment of paymentsNewestFirst) {
		if (left <= 0) break;
		const room = Math.max(0, Math.round(payment.refundableCents));
		if (room <= 0) continue;
		const take = Math.min(room, left);
		plan.push({
			paymentId: payment.id,
			amountCents: take,
			amountBrl: fromCents(take)
		});
		left -= take;
	}

	if (left > 0) {
		throw new Error("AMOUNT_EXCEEDS_REFUNDABLE");
	}

	return plan;
};
