import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { patients } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { paymentRefundSchema } from "@/lib/payments/schema";
import {
	applyPatientRefund,
	refundErrorMessage
} from "@/lib/payments/refund";

type Params = { params: Promise<{ patientId: string }> };

/**
 * Estorno por valor na ficha do paciente (LIFO nas baixas mais recentes).
 */
export const POST = async (request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = paymentRefundSchema.safeParse(body);

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
			const result = await applyPatientRefund({
				clinicId: ctx.clinic.id,
				patientId,
				amountBrl: parsed.data.amountBrl,
				note: parsed.data.note,
				createdBy: ctx.userId
			});
			return NextResponse.json(
				{
					data: {
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
				"AMOUNT_EXCEEDS_REFUNDABLE",
				"NO_REFUNDABLE_PAYMENTS",
				"PAYMENT_NOT_FOUND",
				"PAYMENT_HAS_NO_ALLOCATIONS",
				"SESSION_NOT_FOUND",
				"CONCURRENT_REFUND_CONFLICT"
			];
			if (known.includes(code)) {
				return NextResponse.json(
					{ error: refundErrorMessage(code) },
					{ status: code === "CONCURRENT_REFUND_CONFLICT" ? 409 : 400 }
				);
			}
			throw e;
		}
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao registrar estorno." },
			{ status: 500 }
		);
	}
};
