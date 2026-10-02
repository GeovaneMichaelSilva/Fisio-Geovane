import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";

/**
 * KPIs financeiros + lista de sessões realizadas.
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const [stats] = await db
			.select({
				completedCount: sql<number>`count(*)::int`,
				receivedTotal: sql<string>`coalesce(sum(${sessions.valueBrl}) filter (where ${sessions.paid} = true), 0)`,
				pendingTotal: sql<string>`coalesce(sum(${sessions.valueBrl}) filter (where ${sessions.paid} = false), 0)`,
				pendingCount: sql<number>`count(*) filter (where ${sessions.paid} = false)::int`
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.clinicId, ctx.clinic.id),
					eq(sessions.status, "completed")
				)
			);

		const rows = await db
			.select({
				id: sessions.id,
				patientId: sessions.patientId,
				patientName: patients.fullName,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				serviceTypeName: serviceTypes.name,
				valueBrl: sessions.valueBrl,
				paid: sessions.paid,
				paidAt: sessions.paidAt,
				invoiceIssued: sessions.invoiceIssued
			})
			.from(sessions)
			.innerJoin(patients, eq(patients.id, sessions.patientId))
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(
				and(
					eq(sessions.clinicId, ctx.clinic.id),
					eq(sessions.status, "completed")
				)
			)
			.orderBy(desc(sessions.scheduledDate), desc(sessions.scheduledTime))
			.limit(200);

		return NextResponse.json({
			data: {
				kpis: {
					completedCount: stats?.completedCount ?? 0,
					receivedTotal: String(stats?.receivedTotal ?? "0"),
					pendingTotal: String(stats?.pendingTotal ?? "0"),
					pendingCount: stats?.pendingCount ?? 0
				},
				sessions: rows
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar financeiro." },
			{ status: 500 }
		);
	}
}
