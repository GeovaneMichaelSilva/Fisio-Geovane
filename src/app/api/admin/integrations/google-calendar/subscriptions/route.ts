import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { googleCalendarSubscriptions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { listGoogleCalendars } from "@/lib/google-calendar/calendars";
import { getValidAccessToken } from "@/lib/google-calendar/client";
import {
	ensureSubscriptionWatch,
	syncSubscriptionEvents,
	teardownSubscription
} from "@/lib/google-calendar/inbound-sync";
import { createChannelToken } from "@/lib/google-calendar/watch";

const putSchema = z.object({
	calendars: z.array(
		z.object({
			googleCalendarId: z.string().trim().min(1).max(256),
			label: z.string().trim().min(1).max(200)
		})
	)
});

/**
 * Lista agendas observadas (somente leitura / overlay).
 */
export const GET = async () => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const db = getDb();

		const rows = await db
			.select({
				id: googleCalendarSubscriptions.id,
				googleCalendarId: googleCalendarSubscriptions.googleCalendarId,
				label: googleCalendarSubscriptions.label,
				lastSyncedAt: googleCalendarSubscriptions.lastSyncedAt,
				watchExpiration: googleCalendarSubscriptions.watchExpiration,
				watchAddress: googleCalendarSubscriptions.watchAddress
			})
			.from(googleCalendarSubscriptions)
			.where(eq(googleCalendarSubscriptions.clinicId, ctx.clinic.id));

		return NextResponse.json({
			data: rows.map((r) => ({
				...r,
				lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
				watchExpiration: r.watchExpiration?.toISOString() ?? null,
				watchAddress: r.watchAddress ?? null
			}))
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar agendas observadas." },
			{ status: 500 }
		);
	}
};

/**
 * Substitui o conjunto de agendas observadas: sync inicial + watch.
 */
export const PUT = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const body = await request.json();
		const parsed = putSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
		}

		const auth = await getValidAccessToken(ctx.clinic.id);
		if (!auth) {
			return NextResponse.json(
				{ error: "Google Agenda não conectada." },
				{ status: 400 }
			);
		}

		const available = await listGoogleCalendars(auth.accessToken, {
			minAccessRole: "reader"
		});
		const byId = new Map(available.map((c) => [c.id, c]));

		for (const cal of parsed.data.calendars) {
			if (!byId.has(cal.googleCalendarId)) {
				return NextResponse.json(
					{
						error: `Agenda não encontrada na conta Google: ${cal.googleCalendarId}`
					},
					{ status: 400 }
				);
			}
		}

		const db = getDb();
		const existing = await db
			.select()
			.from(googleCalendarSubscriptions)
			.where(eq(googleCalendarSubscriptions.clinicId, ctx.clinic.id));

		const desiredIds = new Set(
			parsed.data.calendars.map((c) => c.googleCalendarId)
		);

		for (const row of existing) {
			if (!desiredIds.has(row.googleCalendarId)) {
				await teardownSubscription(row.id, db);
			}
		}

		const remaining = await db
			.select()
			.from(googleCalendarSubscriptions)
			.where(eq(googleCalendarSubscriptions.clinicId, ctx.clinic.id));
		const remainingByCal = new Map(
			remaining.map((r) => [r.googleCalendarId, r])
		);

		const results: Array<{ googleCalendarId: string; id: string }> = [];

		for (const cal of parsed.data.calendars) {
			const current = remainingByCal.get(cal.googleCalendarId);
			let subscriptionId: string;

			if (current) {
				await db
					.update(googleCalendarSubscriptions)
					.set({
						label: cal.label,
						updatedAt: new Date()
					})
					.where(eq(googleCalendarSubscriptions.id, current.id));
				subscriptionId = current.id;

				// Se a 1ª tentativa falhou depois do INSERT (sem syncToken), completa agora.
				if (!current.syncToken || !current.lastSyncedAt) {
					await syncSubscriptionEvents(subscriptionId, {
						forceFull: true,
						source: "subscribe"
					});
					try {
						await ensureSubscriptionWatch(subscriptionId, {
							source: "subscribe"
						});
					} catch (err) {
						console.error(
							"[google-calendar] watch failed",
							subscriptionId,
							err
						);
					}
				}
			} else {
				const [created] = await db
					.insert(googleCalendarSubscriptions)
					.values({
						clinicId: ctx.clinic.id,
						googleCalendarId: cal.googleCalendarId,
						label: cal.label,
						channelToken: createChannelToken()
					})
					.returning({ id: googleCalendarSubscriptions.id });

				subscriptionId = created.id;

				try {
					await syncSubscriptionEvents(subscriptionId, {
						forceFull: true,
						source: "subscribe"
					});
					try {
						await ensureSubscriptionWatch(subscriptionId, {
							source: "subscribe"
						});
					} catch (err) {
						console.error(
							"[google-calendar] watch failed",
							subscriptionId,
							err
						);
					}
				} catch (err) {
					await teardownSubscription(subscriptionId, db);
					throw err;
				}
			}

			results.push({
				googleCalendarId: cal.googleCalendarId,
				id: subscriptionId
			});
		}

		return NextResponse.json({ data: results });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{
				error:
					err instanceof Error
						? err.message
						: "Falha ao salvar agendas observadas."
			},
			{ status: 500 }
		);
	}
};
