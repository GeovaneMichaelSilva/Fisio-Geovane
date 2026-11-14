import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleCalendarSyncLogs } from "@/db/schema";

import type { Db } from "@/db";

export type CalendarSyncLogSource =
	| "webhook"
	| "catch_up"
	| "subscribe"
	| "watch_renew"
	| "cron"
	| "handshake";

export type CalendarSyncLogStatus = "ok" | "error" | "ignored";

type AppendCalendarSyncLogInput = {
	clinicId: string;
	subscriptionId?: string | null;
	source: CalendarSyncLogSource;
	status: CalendarSyncLogStatus;
	detail?: string | null;
};

/**
 * Grava um run operacional do overlay. Falha de insert não deve quebrar o fluxo.
 */
export const appendCalendarSyncLog = async (
	input: AppendCalendarSyncLogInput,
	db: Db = getDb()
) => {
	try {
		await db.insert(googleCalendarSyncLogs).values({
			clinicId: input.clinicId,
			subscriptionId: input.subscriptionId ?? null,
			source: input.source,
			status: input.status,
			detail: input.detail ?? null
		});
	} catch (err) {
		console.error("[google-calendar] sync log insert failed", err);
	}
};

export const listCalendarSyncLogs = async (
	clinicId: string,
	limit = 50,
	db: Db = getDb()
) => {
	const safeLimit = Math.min(Math.max(limit, 1), 100);
	return db
		.select({
			id: googleCalendarSyncLogs.id,
			subscriptionId: googleCalendarSyncLogs.subscriptionId,
			source: googleCalendarSyncLogs.source,
			status: googleCalendarSyncLogs.status,
			detail: googleCalendarSyncLogs.detail,
			createdAt: googleCalendarSyncLogs.createdAt
		})
		.from(googleCalendarSyncLogs)
		.where(eq(googleCalendarSyncLogs.clinicId, clinicId))
		.orderBy(desc(googleCalendarSyncLogs.createdAt))
		.limit(safeLimit);
};
