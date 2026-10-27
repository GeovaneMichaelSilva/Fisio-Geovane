import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { withTransaction } from "@/db/transaction";
import {
	paymentAllocations,
	paymentRefundAllocations,
	paymentRefunds,
	payments,
	sessions
} from "@/db/schema";
import {
	assertRefundWithinRefundable,
	deallocateLifo,
	splitRefundAcrossPayments
} from "@/lib/payments/allocate";
import { fromCents, toCents } from "@/lib/payments/money";

import type { Tx } from "@/db/transaction";

export type ApplyRefundInput = {
	clinicId: string;
	patientId: string;
	paymentId: string;
	amountBrl: number;
	note?: string;
	createdBy: string | null;
};

export type ApplyRefundResult = {
	refundId: string;
	paymentId: string;
	amountBrl: string;
	refundedAmountBrl: string;
	refundableAmountBrl: string;
	allocations: Array<{ sessionId: string; amountBrl: string }>;
	pendingValueBrl: string;
};

export type ApplyPatientRefundInput = {
	clinicId: string;
	patientId: string;
	amountBrl: number;
	note?: string;
	createdBy: string | null;
};

export type ApplyPatientRefundResult = {
	amountBrl: string;
	pendingValueBrl: string;
	refunds: Array<{
		refundId: string;
		paymentId: string;
		amountBrl: string;
		allocations: Array<{ sessionId: string; amountBrl: string }>;
	}>;
};

const pendingSql = sql<string>`coalesce(sum(
	greatest(${sessions.valueBrl}::numeric - ${sessions.amountPaidBrl}::numeric, 0)
) filter (
	where ${sessions.status} = 'completed'
	and ${sessions.paid} = false
), 0)`;

type SessionMoneyRow = {
	id: string;
	valueBrl: string;
	amountPaidBrl: string;
	paid: boolean;
	paidAt: string | null;
};

/**
 * Estorna um valor contra uma baixa específica (LIFO nas alocações dela).
 */
const refundOnePayment = async (
	tx: Tx,
	input: {
		clinicId: string;
		patientId: string;
		paymentId: string;
		amountCents: number;
		note?: string;
		createdBy: string | null;
	}
): Promise<{
	refundId: string;
	paymentId: string;
	amountBrl: string;
	refundedAmountBrl: string;
	refundableAmountBrl: string;
	allocations: Array<{ sessionId: string; amountBrl: string }>;
}> => {
	const [payment] = await tx
		.select({
			id: payments.id,
			amountBrl: payments.amountBrl,
			patientId: payments.patientId,
			clinicId: payments.clinicId
		})
		.from(payments)
		.where(
			and(
				eq(payments.id, input.paymentId),
				eq(payments.clinicId, input.clinicId),
				eq(payments.patientId, input.patientId)
			)
		)
		.limit(1);

	if (!payment) {
		throw new Error("PAYMENT_NOT_FOUND");
	}

	const [refundedRow] = await tx
		.select({
			refundedBrl: sql<string>`coalesce(sum(${paymentRefunds.amountBrl}::numeric), 0)`
		})
		.from(paymentRefunds)
		.where(eq(paymentRefunds.paymentId, payment.id));

	const paymentCents = toCents(payment.amountBrl);
	const refundedCents = toCents(refundedRow?.refundedBrl ?? "0");
	const refundableCents = Math.max(0, paymentCents - refundedCents);

	if (input.amountCents > refundableCents) {
		throw new Error("AMOUNT_EXCEEDS_REFUNDABLE");
	}
	if (input.amountCents <= 0) {
		throw new Error("AMOUNT_INVALID");
	}

	const allocationRows = await tx
		.select({
			id: paymentAllocations.id,
			sessionId: paymentAllocations.sessionId,
			amountBrl: paymentAllocations.amountBrl
		})
		.from(paymentAllocations)
		.where(eq(paymentAllocations.paymentId, payment.id))
		.orderBy(asc(paymentAllocations.createdAt), asc(paymentAllocations.id));

	if (allocationRows.length === 0) {
		throw new Error("PAYMENT_HAS_NO_ALLOCATIONS");
	}

	const priorRefunds = await tx
		.select({
			id: paymentRefunds.id,
			amountBrl: paymentRefunds.amountBrl
		})
		.from(paymentRefunds)
		.where(eq(paymentRefunds.paymentId, payment.id))
		.orderBy(asc(paymentRefunds.createdAt), asc(paymentRefunds.id));

	const refundableAllocations = allocationRows.map((row) => ({
		sessionId: row.sessionId,
		remainingCents: toCents(row.amountBrl)
	}));

	for (const prior of priorRefunds) {
		const priorPlan = deallocateLifo(
			refundableAllocations,
			toCents(prior.amountBrl)
		);
		for (const item of priorPlan) {
			for (let i = refundableAllocations.length - 1; i >= 0; i -= 1) {
				const slot = refundableAllocations[i];
				if (!slot || slot.sessionId !== item.sessionId) continue;
				if (slot.remainingCents < item.amountCents) {
					throw new Error("AMOUNT_EXCEEDS_REFUNDABLE");
				}
				slot.remainingCents -= item.amountCents;
				break;
			}
		}
	}

	const plan = deallocateLifo(refundableAllocations, input.amountCents);
	if (plan.length === 0) {
		throw new Error("AMOUNT_INVALID");
	}

	const amountBrl = fromCents(input.amountCents);

	const [refund] = await tx
		.insert(paymentRefunds)
		.values({
			paymentId: payment.id,
			clinicId: input.clinicId,
			patientId: input.patientId,
			amountBrl,
			note: input.note ?? null,
			createdBy: input.createdBy
		})
		.returning({ id: paymentRefunds.id });

	if (!refund) {
		throw new Error("REFUND_INSERT_FAILED");
	}

	const sessionIds = [...new Set(plan.map((p) => p.sessionId))];
	const sessionRows = await tx
		.select({
			id: sessions.id,
			valueBrl: sessions.valueBrl,
			amountPaidBrl: sessions.amountPaidBrl,
			paid: sessions.paid,
			paidAt: sessions.paidAt
		})
		.from(sessions)
		.where(
			and(
				eq(sessions.clinicId, input.clinicId),
				eq(sessions.patientId, input.patientId),
				inArray(sessions.id, sessionIds)
			)
		);

	const sessionsById = new Map<string, SessionMoneyRow>(
		sessionRows.map((s) => [s.id, s])
	);

	for (const item of plan) {
		await tx.insert(paymentRefundAllocations).values({
			refundId: refund.id,
			sessionId: item.sessionId,
			amountBrl: item.amountBrl
		});

		const current = sessionsById.get(item.sessionId);
		if (!current) {
			throw new Error("SESSION_NOT_FOUND");
		}

		const nextPaidCents = Math.max(
			0,
			toCents(current.amountPaidBrl) - item.amountCents
		);
		const valueCents = toCents(current.valueBrl);
		const fullyPaid = nextPaidCents >= valueCents;
		const nextAmount = fromCents(nextPaidCents);

		const updated = await tx
			.update(sessions)
			.set({
				amountPaidBrl: nextAmount,
				paid: fullyPaid,
				paidAt: fullyPaid ? (current.paidAt ?? null) : null,
				updatedBy: input.createdBy,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(sessions.id, item.sessionId),
					sql`${sessions.amountPaidBrl}::numeric >= ${item.amountBrl}::numeric`
				)
			)
			.returning({ id: sessions.id });

		if (updated.length === 0) {
			throw new Error("CONCURRENT_REFUND_CONFLICT");
		}

		current.amountPaidBrl = nextAmount;
		current.paid = fullyPaid;
		if (!fullyPaid) current.paidAt = null;
	}

	const nextRefundedCents = refundedCents + input.amountCents;
	const nextRefundableCents = Math.max(0, paymentCents - nextRefundedCents);

	return {
		refundId: refund.id,
		paymentId: payment.id,
		amountBrl,
		refundedAmountBrl: fromCents(nextRefundedCents),
		refundableAmountBrl: fromCents(nextRefundableCents),
		allocations: plan.map((p) => ({
			sessionId: p.sessionId,
			amountBrl: p.amountBrl
		}))
	};
};

/**
 * Estorna (total ou parcial) uma baixa específica.
 */
export const applyRefund = async (
	input: ApplyRefundInput
): Promise<ApplyRefundResult> => {
	const amountCents = toCents(input.amountBrl);
	if (amountCents <= 0) {
		throw new Error("AMOUNT_INVALID");
	}

	return withTransaction(async (tx) => {
		const result = await refundOnePayment(tx, {
			clinicId: input.clinicId,
			patientId: input.patientId,
			paymentId: input.paymentId,
			amountCents,
			note: input.note,
			createdBy: input.createdBy
		});

		const [pendingRow] = await tx
			.select({ pendingValueBrl: pendingSql })
			.from(sessions)
			.where(
				and(
					eq(sessions.clinicId, input.clinicId),
					eq(sessions.patientId, input.patientId)
				)
			);

		return {
			...result,
			pendingValueBrl: String(pendingRow?.pendingValueBrl ?? "0")
		};
	});
};

/**
 * Estorno na ficha do paciente: só o valor; LIFO nas baixas mais recentes.
 */
export const applyPatientRefund = async (
	input: ApplyPatientRefundInput
): Promise<ApplyPatientRefundResult> => {
	return withTransaction(async (tx) => {
		const paymentRows = await tx
			.select({
				id: payments.id,
				amountBrl: payments.amountBrl
			})
			.from(payments)
			.where(
				and(
					eq(payments.clinicId, input.clinicId),
					eq(payments.patientId, input.patientId)
				)
			)
			.orderBy(desc(payments.createdAt), desc(payments.id));

		if (paymentRows.length === 0) {
			throw new Error("NO_REFUNDABLE_PAYMENTS");
		}

		const paymentIds = paymentRows.map((p) => p.id);
		const refundSums = await tx
			.select({
				paymentId: paymentRefunds.paymentId,
				refundedBrl: sql<string>`coalesce(sum(${paymentRefunds.amountBrl}::numeric), 0)`
			})
			.from(paymentRefunds)
			.where(inArray(paymentRefunds.paymentId, paymentIds))
			.groupBy(paymentRefunds.paymentId);

		const refundedByPayment = new Map(
			refundSums.map((r) => [r.paymentId, toCents(r.refundedBrl)])
		);

		const refundableList = paymentRows.map((p) => {
			const refundableCents = Math.max(
				0,
				toCents(p.amountBrl) - (refundedByPayment.get(p.id) ?? 0)
			);
			return { id: p.id, refundableCents };
		});

		const totalRefundable = refundableList.reduce(
			(sum, p) => sum + p.refundableCents,
			0
		);

		const amountCents = assertRefundWithinRefundable(
			input.amountBrl,
			totalRefundable
		);

		const slices = splitRefundAcrossPayments(refundableList, amountCents);
		if (slices.length === 0) {
			throw new Error("NO_REFUNDABLE_PAYMENTS");
		}

		const refunds: ApplyPatientRefundResult["refunds"] = [];

		for (const slice of slices) {
			const result = await refundOnePayment(tx, {
				clinicId: input.clinicId,
				patientId: input.patientId,
				paymentId: slice.paymentId,
				amountCents: slice.amountCents,
				note: input.note,
				createdBy: input.createdBy
			});
			refunds.push({
				refundId: result.refundId,
				paymentId: result.paymentId,
				amountBrl: result.amountBrl,
				allocations: result.allocations
			});
		}

		const [pendingRow] = await tx
			.select({ pendingValueBrl: pendingSql })
			.from(sessions)
			.where(
				and(
					eq(sessions.clinicId, input.clinicId),
					eq(sessions.patientId, input.patientId)
				)
			);

		return {
			amountBrl: fromCents(amountCents),
			pendingValueBrl: String(pendingRow?.pendingValueBrl ?? "0"),
			refunds
		};
	});
};

export const refundErrorMessage = (code: string): string => {
	switch (code) {
		case "AMOUNT_INVALID":
			return "Informe um valor maior que zero.";
		case "AMOUNT_EXCEEDS_REFUNDABLE":
			return "O valor informado ultrapassa o que ainda pode ser estornado.";
		case "NO_REFUNDABLE_PAYMENTS":
			return "Não há pagamentos com saldo para estornar.";
		case "PAYMENT_NOT_FOUND":
			return "Pagamento não encontrado.";
		case "PAYMENT_HAS_NO_ALLOCATIONS":
			return "Este pagamento não tem alocações para estornar.";
		case "SESSION_NOT_FOUND":
			return "Atendimento não encontrado.";
		case "CONCURRENT_REFUND_CONFLICT":
			return "Outro estorno alterou o saldo. Tente novamente.";
		default:
			return "Falha ao registrar estorno.";
	}
};
