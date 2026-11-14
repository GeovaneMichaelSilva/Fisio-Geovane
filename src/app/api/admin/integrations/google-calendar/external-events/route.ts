import { NextResponse } from "next/server";
import { and, eq, gt, lt, ne, or, sql } from "drizzle-orm";

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
 * Query: from / to em YYYY-MM-DD (ou ISO).
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

		const fromDate = from.includes("T") ? from.slice(0, 10) : from;
		const toDate = to.includes("T") ? to.slice(0, 10) : to;
		const rangeStart = new Date(`${fromDate}T00:00:00.000Z`);
		const rangeEnd = new Date(`${toDate}T23:59:59.999Z`);

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
				startDate: externalCalendarEvents.startDate,
				endDate: externalCalendarEvents.endDate,
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
					or(
						and(
							eq(externalCalendarEvents.allDay, false),
							lt(externalCalendarEvents.startAt, rangeEnd),
							sql`${externalCalendarEvents.endAt} > ${rangeStart}`
						),
						and(
							eq(externalCalendarEvents.allDay, true),
							lt(externalCalendarEvents.startDate, toDate),
							gt(externalCalendarEvents.endDate, fromDate)
						)
					)
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
				startDate: r.startDate,
				endDate: r.endDate,
				startAt: r.startAt?.toISOString() ?? null,
				endAt: r.endAt?.toISOString() ?? null,
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
