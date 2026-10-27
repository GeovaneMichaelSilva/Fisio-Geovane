import { and, asc, eq, sql } from "drizzle-orm";

import { withTransaction } from "@/db/transaction";
import { paymentAllocations, payments, sessions } from "@/db/schema";
import { allocateFifo, assertPaymentWithinPending } from "@/lib/payments/allocate";
import {
	fromCents,
	remainingCents,
	toCents
} from "@/lib/payments/money";

type PaymentOrigin = "session" | "patient";

export type ApplyPaymentInput = {
	clinicId: string;
	patientId: string;
	amountBrl: number;
	paidAt: string;
	origin: PaymentOrigin;
	note?: string;
	createdBy: string | null;
	/** Se definido, aloca só nesta sessão (origem session). */
	sessionId?: string;
};

export type ApplyPaymentResult = {
	paymentId: string;
	amountBrl: string;
	allocations: Array<{ sessionId: string; amountBrl: string }>;
	pendingValueBrl: string;
};

type SessionMoneyRow = {
	id: string;
	valueBrl: string;
	amountPaidBrl: string;
	paid: boolean;
	paidAt: string | null;
};

const pendingSql = sql<string>`coalesce(sum(
	greatest(${sessions.valueBrl}::numeric - ${sessions.amountPaidBrl}::numeric, 0)
) filter (
	where ${sessions.status} = 'completed'
	and ${sessions.paid} = false
), 0)`;

/**
 * Registra baixa e aloca em sessões completed com saldo.
 * Transação via WebSocket (neon-http não suporta transaction).
 */
export const applyPayment = async (
	input: ApplyPaymentInput
): Promise<ApplyPaymentResult> => {
	return withTransaction(async (tx) => {
		const openWhere = and(
			eq(sessions.clinicId, input.clinicId),
			eq(sessions.patientId, input.patientId),
			eq(sessions.status, "completed"),
			eq(sessions.paid, false)
		);

		let targets: SessionMoneyRow[];

		if (input.sessionId) {
			const [row] = await tx
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
						eq(sessions.id, input.sessionId),
						eq(sessions.clinicId, input.clinicId),
						eq(sessions.patientId, input.patientId)
					)
				)
				.limit(1);

			if (!row) {
				throw new Error("SESSION_NOT_FOUND");
			}
			if (row.paid) {
				throw new Error("SESSION_ALREADY_PAID");
			}
			targets = [row];
		} else {
			targets = await tx
				.select({
					id: sessions.id,
					valueBrl: sessions.valueBrl,
					amountPaidBrl: sessions.amountPaidBrl,
					paid: sessions.paid,
					paidAt: sessions.paidAt
				})
				.from(sessions)
				.where(openWhere)
				.orderBy(asc(sessions.scheduledDate), asc(sessions.scheduledTime));
		}

		const allocatable = targets.map((s) => ({
			id: s.id,
			remainingCents: remainingCents({
				valueBrl: s.valueBrl,
				amountPaidBrl: s.amountPaidBrl,
				paid: s.paid
			})
		}));

		const pendingCents = allocatable.reduce(
			(sum, s) => sum + s.remainingCents,
			0
		);

		const amountCents = assertPaymentWithinPending(
			input.amountBrl,
			pendingCents
		);

		const plan = allocateFifo(allocatable, amountCents);
		if (plan.length === 0) {
			throw new Error("NO_PENDING_SESSIONS");
		}

		const amountBrl = fromCents(amountCents);

		const [payment] = await tx
			.insert(payments)
			.values({
				clinicId: input.clinicId,
				patientId: input.patientId,
				amountBrl,
				paidAt: input.paidAt,
				origin: input.origin,
				note: input.note ?? null,
				createdBy: input.createdBy
			})
			.returning({ id: payments.id });

		if (!payment) {
			throw new Error("PAYMENT_INSERT_FAILED");
		}

		for (const item of plan) {
			await tx.insert(paymentAllocations).values({
				paymentId: payment.id,
				sessionId: item.sessionId,
				amountBrl: item.amountBrl
			});

			const current = targets.find((t) => t.id === item.sessionId);
			if (!current) {
				throw new Error("SESSION_NOT_FOUND");
			}

			const nextPaidCents =
				toCents(current.amountPaidBrl) + item.amountCents;
			const valueCents = toCents(current.valueBrl);
			const fullyPaid = nextPaidCents >= valueCents;
			const nextAmount = fromCents(Math.min(nextPaidCents, valueCents));

			const updated = await tx
				.update(sessions)
				.set({
					amountPaidBrl: nextAmount,
					paid: fullyPaid,
					paidAt: fullyPaid ? input.paidAt : current.paidAt,
					updatedBy: input.createdBy,
					updatedAt: new Date()
				})
				.where(
					and(
						eq(sessions.id, item.sessionId),
						eq(sessions.paid, false),
						sql`(${sessions.amountPaidBrl}::numeric + ${item.amountBrl}::numeric) <= ${sessions.valueBrl}::numeric`
					)
				)
				.returning({ id: sessions.id });

			if (updated.length === 0) {
				throw new Error("CONCURRENT_PAYMENT_CONFLICT");
			}

			current.amountPaidBrl = nextAmount;
			current.paid = fullyPaid;
			if (fullyPaid) current.paidAt = input.paidAt;
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
			paymentId: payment.id,
			amountBrl,
			allocations: plan.map((p) => ({
				sessionId: p.sessionId,
				amountBrl: p.amountBrl
			})),
			pendingValueBrl: String(pendingRow?.pendingValueBrl ?? "0")
		};
	});
};

export const paymentErrorMessage = (code: string): string => {
	switch (code) {
		case "AMOUNT_INVALID":
			return "Informe um valor maior que zero.";
		case "AMOUNT_EXCEEDS_PENDING":
			return "O valor informado ultrapassa o saldo a receber.";
		case "AMOUNT_EXCEEDS_REFUNDABLE":
			return "O valor informado ultrapassa o que ainda pode ser estornado neste pagamento.";
		case "NO_PENDING_SESSIONS":
			return "Não há atendimentos com saldo pendente.";
		case "SESSION_NOT_FOUND":
			return "Atendimento não encontrado.";
		case "SESSION_ALREADY_PAID":
			return "Este atendimento já está quitado.";
		case "PAYMENT_NOT_FOUND":
			return "Pagamento não encontrado.";
		case "PAYMENT_HAS_NO_ALLOCATIONS":
			return "Este pagamento não tem alocações para estornar.";
		case "CONCURRENT_PAYMENT_CONFLICT":
			return "Outro pagamento alterou o saldo. Tente novamente.";
		case "CONCURRENT_REFUND_CONFLICT":
			return "Outro estorno alterou o saldo. Tente novamente.";
		default:
			return "Falha ao registrar pagamento.";
	}
};
