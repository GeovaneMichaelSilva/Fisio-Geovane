import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import {
	applyPayment,
	paymentErrorMessage
} from "@/lib/payments/apply";
import { sessionPaymentSchema } from "@/lib/payments/schema";

type Params = { params: Promise<{ sessionId: string }> };

/**
 * Baixa parcial/total vinculada a um atendimento.
 */
export const POST = async (request: Request, { params }: Params) => {
	try {
		const { sessionId } = await params;
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = sessionPaymentSchema.safeParse(body);

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
		const [session] = await db
			.select({
				id: sessions.id,
				patientId: sessions.patientId,
				status: sessions.status
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.id, sessionId),
					eq(sessions.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!session) {
			return NextResponse.json(
				{ error: "Sessão não encontrada." },
				{ status: 404 }
			);
		}

		if (session.status !== "completed") {
			return NextResponse.json(
				{ error: "Só é possível baixar atendimento realizado." },
				{ status: 400 }
			);
		}

		try {
			const result = await applyPayment({
				clinicId: ctx.clinic.id,
				patientId: session.patientId,
				sessionId,
				amountBrl: parsed.data.amountBrl,
				paidAt: parsed.data.paidAt,
				origin: "session",
				note: parsed.data.note,
				createdBy: ctx.userId
			});

			if (parsed.data.invoiceIssued !== undefined) {
				await db
					.update(sessions)
					.set({
						invoiceIssued: parsed.data.invoiceIssued,
						updatedBy: ctx.userId,
						updatedAt: new Date()
					})
					.where(eq(sessions.id, sessionId));
			}

			return NextResponse.json({ data: result }, { status: 201 });
		} catch (e) {
			const code = e instanceof Error ? e.message : "";
			const known = [
				"AMOUNT_INVALID",
				"AMOUNT_EXCEEDS_PENDING",
				"NO_PENDING_SESSIONS",
				"SESSION_NOT_FOUND",
				"SESSION_ALREADY_PAID",
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
