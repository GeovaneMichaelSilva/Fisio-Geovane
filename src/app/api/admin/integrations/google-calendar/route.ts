import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar/oauth";

/**
 * Status da conexão Google Agenda da clínica.
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		const configured = isGoogleCalendarConfigured();

		if (!configured) {
			return NextResponse.json({
				data: {
					configured: false,
					connected: false,
					googleAccountEmail: null,
					connectedAt: null,
					calendarId: null
				}
			});
		}

		const db = getDb();
		const [conn] = await db
			.select({
				googleAccountEmail: googleCalendarConnections.googleAccountEmail,
				connectedAt: googleCalendarConnections.connectedAt,
				calendarId: googleCalendarConnections.calendarId
			})
			.from(googleCalendarConnections)
			.where(eq(googleCalendarConnections.clinicId, ctx.clinic.id))
			.limit(1);

		return NextResponse.json({
			data: {
				configured: true,
				connected: Boolean(conn),
				googleAccountEmail: conn?.googleAccountEmail ?? null,
				connectedAt: conn?.connectedAt?.toISOString() ?? null,
				calendarId: conn?.calendarId ?? null
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar status da integração." },
			{ status: 500 }
		);
	}
}

/**
 * Desconecta Google Agenda e revoga token (best-effort).
 */
export async function DELETE() {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const db = getDb();

		const [conn] = await db
			.select()
			.from(googleCalendarConnections)
			.where(eq(googleCalendarConnections.clinicId, ctx.clinic.id))
			.limit(1);

		if (!conn) {
			return NextResponse.json({ data: { disconnected: true } });
		}

		const { decryptSecret } = await import("@/lib/crypto/secrets");
		const { revokeGoogleToken } = await import("@/lib/google-calendar/oauth");

		try {
			const refresh = decryptSecret(conn.refreshTokenEncrypted);
			await revokeGoogleToken(refresh);
		} catch {
			// ignore revoke errors
		}

		await db
			.delete(googleCalendarConnections)
			.where(eq(googleCalendarConnections.id, conn.id));

		return NextResponse.json({ data: { disconnected: true } });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao desconectar Google Agenda." },
			{ status: 500 }
		);
	}
}
