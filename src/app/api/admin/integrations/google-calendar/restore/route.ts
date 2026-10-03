import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { restoreClinicSessionsToGoogle } from "@/lib/google-calendar/sync";

/**
 * Recria no Google os agendamentos ativos da clínica.
 * Usado após reconectar ou sob demanda.
 */
export async function POST() {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const result = await restoreClinicSessionsToGoogle(ctx.clinic.id);
		return NextResponse.json({ data: result });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao restaurar agendamentos no Google." },
			{ status: 500 }
		);
	}
}
