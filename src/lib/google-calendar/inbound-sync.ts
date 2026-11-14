import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import {
	externalCalendarEvents,
	googleCalendarSubscriptions,
	sessions
} from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { getValidAccessToken } from "@/lib/google-calendar/client";
import {
	createChannelToken,
	startCalendarWatch,
	stopCalendarWatch
} from "@/lib/google-calendar/watch";

import type { Db } from "@/db";
import type { Tx } from "@/db/transaction";

type GoogleEventItem = {
	id?: string;
	status?: string;
	summary?: string;
	etag?: string;
	start?: { dateTime?: string; date?: string };
	end?: { dateTime?: string; date?: string };
};

type EventsListResponse = {
	items?: GoogleEventItem[];
	nextPageToken?: string;
	nextSyncToken?: string;
	error?: { message?: string; code?: number };
};

const FULL_SYNC_PAST_DAYS = 7;
const FULL_SYNC_FUTURE_DAYS = 90;

const parseEventBounds = (
	item: GoogleEventItem
): { startAt: Date; endAt: Date; allDay: boolean } | null => {
	const startRaw = item.start?.dateTime || item.start?.date;
	const endRaw = item.end?.dateTime || item.end?.date;
	if (!startRaw || !endRaw) return null;

	const allDay = Boolean(item.start?.date && !item.start?.dateTime);
	const startAt = new Date(allDay ? `${startRaw}T00:00:00.000Z` : startRaw);
	const endAt = new Date(allDay ? `${endRaw}T00:00:00.000Z` : endRaw);
	if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
		return null;
	}
	return { startAt, endAt, allDay };
};

const fetchEventsPage = async (input: {
	accessToken: string;
	calendarId: string;
	syncToken?: string | null;
	pageToken?: string;
	timeMin?: string;
	timeMax?: string;
}) => {
	const params = new URLSearchParams({
		singleEvents: "true",
		showDeleted: "true",
		maxResults: "250"
	});

	if (input.syncToken) {
		params.set("syncToken", input.syncToken);
	} else {
		if (input.timeMin) params.set("timeMin", input.timeMin);
		if (input.timeMax) params.set("timeMax", input.timeMax);
		// NÃO usar orderBy no full sync: o Google omite nextSyncToken com orderBy.
	}
	if (input.pageToken) params.set("pageToken", input.pageToken);

	const encoded = encodeURIComponent(input.calendarId);
	const res = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encoded}/events?${params}`,
		{ headers: { Authorization: `Bearer ${input.accessToken}` } }
	);
	const json = (await res.json()) as EventsListResponse;

	if (res.status === 410) {
		const err = new Error("SYNC_TOKEN_INVALID") as Error & { code: number };
		err.code = 410;
		throw err;
	}
	if (!res.ok) {
		throw new Error(json.error?.message || `Google events.list HTTP ${res.status}`);
	}
	return json;
};

const collectEvents = async (input: {
	accessToken: string;
	calendarId: string;
	syncToken?: string | null;
	full?: boolean;
}) => {
	const items: GoogleEventItem[] = [];
	let pageToken: string | undefined;
	let nextSyncToken: string | undefined;

	const now = Date.now();
	const timeMin = new Date(
		now - FULL_SYNC_PAST_DAYS * 24 * 60 * 60 * 1000
	).toISOString();
	const timeMax = new Date(
		now + FULL_SYNC_FUTURE_DAYS * 24 * 60 * 60 * 1000
	).toISOString();

	const runPages = async (opts: {
		syncToken?: string | null;
		timeMin?: string;
		timeMax?: string;
	}) => {
		const pageItems: GoogleEventItem[] = [];
		let token: string | undefined;
		let cursor: string | undefined;
		do {
			const page = await fetchEventsPage({
				accessToken: input.accessToken,
				calendarId: input.calendarId,
				syncToken: opts.syncToken,
				pageToken: cursor,
				timeMin: opts.timeMin,
				timeMax: opts.timeMax
			});
			pageItems.push(...(page.items ?? []));
			cursor = page.nextPageToken;
			if (page.nextSyncToken) token = page.nextSyncToken;
		} while (cursor);
		return { pageItems, token };
	};

	const needsFull = input.full || !input.syncToken;
	if (!needsFull) {
		const incremental = await runPages({ syncToken: input.syncToken });
		return {
			items: incremental.pageItems,
			nextSyncToken: incremental.token
		};
	}

	// Full sync com janela (sem orderBy — senão o Google omite nextSyncToken).
	let full = await runPages({ timeMin, timeMax });

	// Fallback raro: alguns calendários só devolvem syncToken sem timeMin/timeMax.
	if (!full.token) {
		const unfiltered = await runPages({});
		full = {
			pageItems: unfiltered.pageItems.filter((item) => {
				const start =
					item.start?.dateTime ||
					(item.start?.date ? `${item.start.date}T00:00:00.000Z` : null);
				if (!start) return false;
				const t = Date.parse(start);
				if (Number.isNaN(t)) return false;
				return t >= Date.parse(timeMin) && t <= Date.parse(timeMax);
			}),
			token: unfiltered.token
		};
	}

	return { items: full.pageItems, nextSyncToken: full.token };
};

const ownSessionEventIds = async (
	db: Db | Tx,
	clinicId: string,
	eventIds: string[]
) => {
	if (eventIds.length === 0) return new Set<string>();
	const rows = await db
		.select({ googleEventId: sessions.googleEventId })
		.from(sessions)
		.where(
			and(
				eq(sessions.clinicId, clinicId),
				inArray(sessions.googleEventId, eventIds)
			)
		);
	return new Set(
		rows
			.map((r) => r.googleEventId)
			.filter((id): id is string => Boolean(id))
	);
};

/**
 * Aplica diff/full sync de uma subscription. Só avança syncToken no commit.
 */
export const syncSubscriptionEvents = async (
	subscriptionId: string,
	options: { forceFull?: boolean } = {}
) => {
	const db = getDb();
	const [sub] = await db
		.select()
		.from(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.id, subscriptionId))
		.limit(1);

	if (!sub) return { status: "missing" as const };

	const auth = await getValidAccessToken(sub.clinicId, db);
	if (!auth) return { status: "no_connection" as const };

	let forceFull = Boolean(options.forceFull) || !sub.syncToken;
	let collected: { items: GoogleEventItem[]; nextSyncToken?: string };

	try {
		collected = await collectEvents({
			accessToken: auth.accessToken,
			calendarId: sub.googleCalendarId,
			syncToken: sub.syncToken,
			full: forceFull
		});
	} catch (err) {
		const code = (err as Error & { code?: number }).code;
		if (code === 410 && !forceFull) {
			forceFull = true;
			collected = await collectEvents({
				accessToken: auth.accessToken,
				calendarId: sub.googleCalendarId,
				full: true
			});
		} else {
			throw err;
		}
	}

	const eventIds = collected.items
		.map((i) => i.id)
		.filter((id): id is string => Boolean(id));
	const owned = await ownSessionEventIds(db, sub.clinicId, eventIds);

	await withTransaction(async (tx) => {
		const toDelete: string[] = [];

		for (const item of collected.items) {
			if (!item.id) continue;
			if (owned.has(item.id)) continue;

			const status = item.status || "confirmed";
			if (status === "cancelled") {
				toDelete.push(item.id);
				continue;
			}

			const bounds = parseEventBounds(item);
			if (!bounds) continue;

			await tx
				.insert(externalCalendarEvents)
				.values({
					clinicId: sub.clinicId,
					subscriptionId: sub.id,
					googleCalendarId: sub.googleCalendarId,
					googleEventId: item.id,
					summary: item.summary ?? null,
					status,
					allDay: bounds.allDay,
					startAt: bounds.startAt,
					endAt: bounds.endAt,
					etag: item.etag ?? null,
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: [
						externalCalendarEvents.clinicId,
						externalCalendarEvents.googleCalendarId,
						externalCalendarEvents.googleEventId
					],
					set: {
						summary: item.summary ?? null,
						status,
						allDay: bounds.allDay,
						startAt: bounds.startAt,
						endAt: bounds.endAt,
						etag: item.etag ?? null,
						updatedAt: new Date(),
						subscriptionId: sub.id
					}
				});
		}

		if (toDelete.length > 0) {
			await tx
				.delete(externalCalendarEvents)
				.where(
					and(
						eq(externalCalendarEvents.clinicId, sub.clinicId),
						eq(externalCalendarEvents.googleCalendarId, sub.googleCalendarId),
						inArray(externalCalendarEvents.googleEventId, toDelete)
					)
				);
		}

		// Full sync: remove eventos locais da janela que não vieram mais.
		if (forceFull) {
			const keepIds = collected.items
				.filter((i) => i.id && i.status !== "cancelled" && !owned.has(i.id!))
				.map((i) => i.id!);

			const now = Date.now();
			const windowStart = new Date(
				now - FULL_SYNC_PAST_DAYS * 24 * 60 * 60 * 1000
			);
			const windowEnd = new Date(
				now + FULL_SYNC_FUTURE_DAYS * 24 * 60 * 60 * 1000
			);

			const windowCond = and(
				eq(externalCalendarEvents.clinicId, sub.clinicId),
				eq(externalCalendarEvents.googleCalendarId, sub.googleCalendarId),
				sql`${externalCalendarEvents.startAt} < ${windowEnd}`,
				sql`${externalCalendarEvents.endAt} > ${windowStart}`
			);

			if (keepIds.length === 0) {
				await tx.delete(externalCalendarEvents).where(windowCond);
			} else {
				await tx
					.delete(externalCalendarEvents)
					.where(
						and(
							windowCond,
							notInArray(externalCalendarEvents.googleEventId, keepIds)
						)
					);
			}
		}

		const syncToken = collected.nextSyncToken ?? sub.syncToken;
		if (!syncToken) {
			throw new Error(
				"Google não retornou nextSyncToken. Tente salvar de novo; se persistir, remova filtros inválidos na listagem."
			);
		}

		await tx
			.update(googleCalendarSubscriptions)
			.set({
				syncToken,
				lastSyncedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(googleCalendarSubscriptions.id, sub.id));
	});

	return { status: "synced" as const, full: forceFull, count: collected.items.length };
};

/**
 * Garante watch ativo para a subscription (cria ou renova).
 */
export const ensureSubscriptionWatch = async (subscriptionId: string) => {
	const db = getDb();
	const [sub] = await db
		.select()
		.from(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.id, subscriptionId))
		.limit(1);
	if (!sub) return;

	const auth = await getValidAccessToken(sub.clinicId, db);
	if (!auth) return;

	if (sub.watchChannelId && sub.watchResourceId) {
		await stopCalendarWatch({
			accessToken: auth.accessToken,
			channelId: sub.watchChannelId,
			resourceId: sub.watchResourceId
		});
	}

	const channelId = randomUUID();
	const channelToken = sub.channelToken || createChannelToken();
	const watch = await startCalendarWatch({
		accessToken: auth.accessToken,
		calendarId: sub.googleCalendarId,
		channelId,
		channelToken
	});

	await db
		.update(googleCalendarSubscriptions)
		.set({
			channelToken,
			watchChannelId: watch.channelId,
			watchResourceId: watch.resourceId,
			watchExpiration: watch.expiration,
			updatedAt: new Date()
		})
		.where(eq(googleCalendarSubscriptions.id, sub.id));
};

/**
 * Para watch e limpa eventos de uma subscription.
 */
export const teardownSubscription = async (
	subscriptionId: string,
	db: Db = getDb()
) => {
	const [sub] = await db
		.select()
		.from(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.id, subscriptionId))
		.limit(1);
	if (!sub) return;

	const auth = await getValidAccessToken(sub.clinicId, db).catch(() => null);
	if (auth && sub.watchChannelId && sub.watchResourceId) {
		await stopCalendarWatch({
			accessToken: auth.accessToken,
			channelId: sub.watchChannelId,
			resourceId: sub.watchResourceId
		});
	}

	await db
		.delete(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.id, subscriptionId));
};

/**
 * Remove todas as subscriptions da clínica (ex.: disconnect).
 */
export const teardownClinicSubscriptions = async (
	clinicId: string,
	db: Db = getDb()
) => {
	const rows = await db
		.select({ id: googleCalendarSubscriptions.id })
		.from(googleCalendarSubscriptions)
		.where(eq(googleCalendarSubscriptions.clinicId, clinicId));

	for (const row of rows) {
		await teardownSubscription(row.id, db);
	}
};

/**
 * Renova watches próximos de expirar e recupera sync quebrado.
 */
export const renewAllCalendarWatches = async () => {
	const db = getDb();
	const rows = await db.select().from(googleCalendarSubscriptions);
	const soon = Date.now() + 2 * 24 * 60 * 60 * 1000;
	let renewed = 0;
	let resynced = 0;
	let errors = 0;

	for (const row of rows) {
		try {
			const expired =
				!row.watchExpiration || row.watchExpiration.getTime() < Date.now();
			const expiringSoon =
				row.watchExpiration && row.watchExpiration.getTime() < soon;

			if (expired || !row.syncToken) {
				await syncSubscriptionEvents(row.id, { forceFull: true });
				resynced += 1;
			}

			if (expired || expiringSoon || !row.watchChannelId) {
				await ensureSubscriptionWatch(row.id);
				renewed += 1;
			}
		} catch (err) {
			errors += 1;
			console.error("[google-calendar] renew failed", row.id, err);
		}
	}

	return { total: rows.length, renewed, resynced, errors };
};
