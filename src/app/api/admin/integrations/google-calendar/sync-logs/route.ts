import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { listCalendarSyncLogs } from "@/lib/google-calendar/sync-log";

/**
 * Histórico operacional do overlay (webhook / sync / watch).
 */
export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const { searchParams } = new URL(request.url);
		const limitRaw = Number(searchParams.get("limit") || "50");
		const limit = Number.isFinite(limitRaw) ? limitRaw : 50;

		const rows = await listCalendarSyncLogs(ctx.clinic.id, limit);

		return NextResponse.json({
			data: rows.map((r) => ({
				id: r.id,
				subscriptionId: r.subscriptionId,
				source: r.source,
				status: r.status,
				detail: r.detail,
				createdAt: r.createdAt.toISOString()
			}))
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar logs de sincronização." },
			{ status: 500 }
		);
	}
};
