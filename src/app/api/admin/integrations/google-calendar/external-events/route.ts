import { NextResponse } from "next/server";
import { and, eq, lt, gt, ne } from "drizzle-orm";

import { getDb } from "@/db";
import {
	externalCalendarEvents,
	googleCalendarSubscriptions
} from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { syncSubscriptionEvents } from "@/lib/google-calendar/inbound-sync";

const STALE_MS = 15 * 60_000;

/**
 * Eventos externos (overlay) no intervalo da agenda.
 * Query: from / to em ISO ou YYYY-MM-DD.
 * Se o último sync estiver velho, dispara catch-up best-effort (útil sem webhook).
 */
export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const { searchParams } = new URL(request.url);
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		if (!from || !to) {
			return NextResponse.json(
				{ error: "Parâmetros from e to são obrigatórios." },
				{ status: 400 }
			);
		}

		const rangeStart = new Date(
			from.includes("T") ? from : `${from}T00:00:00.000Z`
		);
		const rangeEnd = new Date(
			to.includes("T") ? to : `${to}T23:59:59.999Z`
		);

		if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
			return NextResponse.json({ error: "Intervalo inválido." }, { status: 400 });
		}

		const db = getDb();

		const subs = await db
			.select({
				id: googleCalendarSubscriptions.id,
				lastSyncedAt: googleCalendarSubscriptions.lastSyncedAt
			})
			.from(googleCalendarSubscriptions)
			.where(eq(googleCalendarSubscriptions.clinicId, ctx.clinic.id));

		const now = Date.now();
		await Promise.all(
			subs
				.filter(
					(s) =>
						!s.lastSyncedAt || now - s.lastSyncedAt.getTime() > STALE_MS
				)
				.map((s) =>
					syncSubscriptionEvents(s.id).catch((err) => {
						console.error("[google-calendar] catch-up failed", s.id, err);
					})
				)
		);

		const rows = await db
			.select({
				id: externalCalendarEvents.id,
				googleCalendarId: externalCalendarEvents.googleCalendarId,
				googleEventId: externalCalendarEvents.googleEventId,
				summary: externalCalendarEvents.summary,
				status: externalCalendarEvents.status,
				allDay: externalCalendarEvents.allDay,
				startAt: externalCalendarEvents.startAt,
				endAt: externalCalendarEvents.endAt,
				calendarLabel: googleCalendarSubscriptions.label
			})
			.from(externalCalendarEvents)
			.innerJoin(
				googleCalendarSubscriptions,
				eq(
					googleCalendarSubscriptions.id,
					externalCalendarEvents.subscriptionId
				)
			)
			.where(
				and(
					eq(externalCalendarEvents.clinicId, ctx.clinic.id),
					ne(externalCalendarEvents.status, "cancelled"),
					lt(externalCalendarEvents.startAt, rangeEnd),
					gt(externalCalendarEvents.endAt, rangeStart)
				)
			);

		return NextResponse.json({
			data: rows.map((r) => ({
				id: r.id,
				googleCalendarId: r.googleCalendarId,
				googleEventId: r.googleEventId,
				summary: r.summary || "(sem título)",
				status: r.status,
				allDay: r.allDay,
				startAt: r.startAt.toISOString(),
				endAt: r.endAt.toISOString(),
				calendarLabel: r.calendarLabel
			}))
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar eventos externos." },
			{ status: 500 }
		);
	}
};
