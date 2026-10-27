import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, paymentRefunds, payments } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import {
	applyPayment,
	paymentErrorMessage
} from "@/lib/payments/apply";
import { fromCents, toCents } from "@/lib/payments/money";
import { patientPaymentSchema } from "@/lib/payments/schema";

type Params = { params: Promise<{ patientId: string }> };

type LedgerEntry = {
	id: string;
	kind: "received" | "refunded";
	amountBrl: string;
	date: string;
	createdAt: string;
};

/**
 * Extrato simples: recebimentos e estornos (data + valor).
 * Alocações por atendimento ficam só no motor interno, não no histórico.
 */
export const GET = async (_request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const [patient] = await db
			.select({ id: patients.id })
			.from(patients)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!patient) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		const paymentRows = await db
			.select({
				id: payments.id,
				amountBrl: payments.amountBrl,
				paidAt: payments.paidAt,
				createdAt: payments.createdAt
			})
			.from(payments)
			.where(
				and(
					eq(payments.patientId, patientId),
					eq(payments.clinicId, ctx.clinic.id)
				)
			)
			.orderBy(desc(payments.createdAt))
			.limit(100);

		const paymentIds = paymentRows.map((r) => r.id);

		const refundRows =
			paymentIds.length === 0
				? []
				: await db
						.select({
							id: paymentRefunds.id,
							paymentId: paymentRefunds.paymentId,
							amountBrl: paymentRefunds.amountBrl,
							createdAt: paymentRefunds.createdAt
						})
						.from(paymentRefunds)
						.where(inArray(paymentRefunds.paymentId, paymentIds))
						.orderBy(desc(paymentRefunds.createdAt));

		const refundedByPayment = new Map<string, number>();
		for (const r of refundRows) {
			refundedByPayment.set(
				r.paymentId,
				(refundedByPayment.get(r.paymentId) ?? 0) + toCents(r.amountBrl)
			);
		}

		let totalRefundableCents = 0;
		for (const p of paymentRows) {
			const refundable = Math.max(
				0,
				toCents(p.amountBrl) - (refundedByPayment.get(p.id) ?? 0)
			);
			totalRefundableCents += refundable;
		}

		const toIso = (v: Date | string) =>
			v instanceof Date ? v.toISOString() : String(v);

		const toDateOnly = (v: Date | string) => toIso(v).slice(0, 10);

		const entries: LedgerEntry[] = [
			...paymentRows.map((p) => ({
				id: p.id,
				kind: "received" as const,
				amountBrl: p.amountBrl,
				date: p.paidAt,
				createdAt: toIso(p.createdAt)
			})),
			...refundRows.map((r) => ({
				id: r.id,
				kind: "refunded" as const,
				amountBrl: r.amountBrl,
				date: toDateOnly(r.createdAt),
				createdAt: toIso(r.createdAt)
			}))
		].sort((a, b) => {
			const byCreated = b.createdAt.localeCompare(a.createdAt);
			if (byCreated !== 0) return byCreated;
			return b.date.localeCompare(a.date);
		});

		return NextResponse.json({
			data: {
				entries,
				totalRefundableBrl: fromCents(totalRefundableCents)
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar histórico de pagamentos." },
			{ status: 500 }
		);
	}
};

/**
 * Baixa na ficha do paciente — aloca FIFO nos atendimentos pendentes.
 */
export const POST = async (request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = patientPaymentSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const db = getDb();
		const [patient] = await db
			.select({ id: patients.id })
			.from(patients)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!patient) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		try {
			const result = await applyPayment({
				clinicId: ctx.clinic.id,
				patientId,
				amountBrl: parsed.data.amountBrl,
				paidAt: parsed.data.paidAt,
				origin: "patient",
				note: parsed.data.note,
				createdBy: ctx.userId
			});
			return NextResponse.json(
				{
					data: {
						paymentId: result.paymentId,
						amountBrl: result.amountBrl,
						pendingValueBrl: result.pendingValueBrl
					}
				},
				{ status: 201 }
			);
		} catch (e) {
			const code = e instanceof Error ? e.message : "";
			const known = [
				"AMOUNT_INVALID",
				"AMOUNT_EXCEEDS_PENDING",
				"NO_PENDING_SESSIONS",
				"CONCURRENT_PAYMENT_CONFLICT"
			];
			if (known.includes(code)) {
				return NextResponse.json(
					{ error: paymentErrorMessage(code) },
					{ status: code === "CONCURRENT_PAYMENT_CONFLICT" ? 409 : 400 }
				);
			}
			throw e;
		}
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao registrar pagamento." },
			{ status: 500 }
		);
	}
};
