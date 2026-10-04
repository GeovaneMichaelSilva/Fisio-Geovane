import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { runClinicDriveBackup } from "@/lib/google-drive/backup";

/**
 * Dispara backup manual da clínica no Google Drive.
 */
export async function POST() {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const result = await runClinicDriveBackup(ctx.clinic.id, "manual");
		if (result.status === "error") {
			return NextResponse.json(
				{ error: result.errorMessage || "Falha no backup.", data: result },
				{ status: 502 }
			);
		}

		return NextResponse.json({ data: result });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao executar backup." },
			{ status: 500 }
		);
	}
}
