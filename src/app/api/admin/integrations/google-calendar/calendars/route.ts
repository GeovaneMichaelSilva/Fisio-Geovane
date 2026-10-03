import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { listGoogleCalendars } from "@/lib/google-calendar/calendars";
import { getValidAccessToken } from "@/lib/google-calendar/client";

/**
 * Lista agendas Google da conta conectada (com permissão de escrita).
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const auth = await getValidAccessToken(ctx.clinic.id);
		if (!auth) {
			return NextResponse.json(
				{ error: "Google Agenda não conectada." },
				{ status: 400 }
			);
		}

		const calendars = await listGoogleCalendars(auth.accessToken);
		return NextResponse.json({ data: calendars });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{
				error:
					err instanceof Error
						? err.message
						: "Falha ao listar agendas Google."
			},
			{ status: 500 }
		);
	}
}
