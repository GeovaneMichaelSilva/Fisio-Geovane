import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { listBackupRuns } from "@/lib/google-drive/backup";

/**
 * Histórico de execuções de backup (manual ou cron).
 */
export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const { searchParams } = new URL(request.url);
		const limitRaw = Number(searchParams.get("limit") || "50");
		const limit = Number.isFinite(limitRaw) ? limitRaw : 50;

		const rows = await listBackupRuns(ctx.clinic.id, limit);

		return NextResponse.json({
			data: rows.map((r) => ({
				id: r.id,
				status: r.status,
				trigger: r.trigger,
				fileName: r.fileName,
				bytes: r.bytes,
				errorMessage: r.errorMessage,
				deletedOldFiles: r.deletedOldFiles,
				createdAt: r.createdAt.toISOString()
			}))
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar histórico de backup." },
			{ status: 500 }
		);
	}
};
