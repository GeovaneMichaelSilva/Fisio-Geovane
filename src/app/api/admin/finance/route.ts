import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { financeQuerySchema } from "@/lib/finance/schema";
import { paginationMeta, parsePagination } from "@/lib/pagination";

/**
 * KPIs financeiros + lista paginada de sessões realizadas.
 */
export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const { searchParams } = new URL(request.url);
		const parsed = financeQuerySchema.safeParse({
			from: searchParams.get("from") ?? undefined,
			to: searchParams.get("to") ?? undefined
		});

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Período inválido.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const { from, to } = parsed.data;
		const { page, pageSize } = parsePagination(searchParams);
		const db = getDb();

		const where = and(
			eq(sessions.clinicId, ctx.clinic.id),
			eq(sessions.status, "completed"),
			from ? gte(sessions.scheduledDate, from) : undefined,
			to ? lte(sessions.scheduledDate, to) : undefined
		);

		const [stats] = await db
			.select({
				completedCount: sql<number>`count(*)::int`,
				// Rede de segurança pré-backfill: se paid=true e amount_paid ainda 0, usa value_brl
				receivedTotal: sql<string>`coalesce(sum(
					case
						when ${sessions.paid} = true
							and ${sessions.amountPaidBrl}::numeric = 0
						then ${sessions.valueBrl}
						else ${sessions.amountPaidBrl}
					end
				), 0)`,
				pendingTotal: sql<string>`coalesce(sum(
					case
						when ${sessions.paid} = true then 0
						else greatest(
							${sessions.valueBrl}::numeric - ${sessions.amountPaidBrl}::numeric,
							0
						)
					end
				), 0)`,
				pendingCount: sql<number>`count(*) filter (where ${sessions.paid} = false)::int`
			})
			.from(sessions)
			.where(where);

		const total = stats?.completedCount ?? 0;
		const meta = paginationMeta(total, page, pageSize);

		const rows = await db
			.select({
				id: sessions.id,
				patientId: sessions.patientId,
				patientName: patients.fullName,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				serviceTypeName: serviceTypes.name,
				valueBrl: sessions.valueBrl,
				amountPaidBrl: sessions.amountPaidBrl,
				paid: sessions.paid,
				paidAt: sessions.paidAt,
				invoiceIssued: sessions.invoiceIssued
			})
			.from(sessions)
			.innerJoin(patients, eq(patients.id, sessions.patientId))
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(where)
			.orderBy(desc(sessions.scheduledDate), desc(sessions.scheduledTime))
			.limit(meta.pageSize)
			.offset(meta.offset);

		return NextResponse.json({
			data: {
				period: from && to ? { from, to } : null,
				kpis: {
					completedCount: stats?.completedCount ?? 0,
					receivedTotal: String(stats?.receivedTotal ?? "0"),
					pendingTotal: String(stats?.pendingTotal ?? "0"),
					pendingCount: stats?.pendingCount ?? 0
				},
				sessions: rows
			},
			meta
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
