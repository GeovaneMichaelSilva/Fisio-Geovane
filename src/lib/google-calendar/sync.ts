import { and, eq, gte, or } from "drizzle-orm";

import { getDb } from "@/db";
import {
	clinics,
	patients,
	serviceTypes,
	sessions
} from "@/db/schema";
import { resolveTargetCalendarId } from "@/lib/google-calendar/calendars";
import { getValidAccessToken } from "@/lib/google-calendar/client";
import { normalizeTime, toDateString } from "@/lib/sessions/agenda";

import type { Db } from "@/db";

type SessionForSync = {
	id: string;
	clinicId: string;
	patientId: string;
	serviceTypeId: string;
	scheduledDate: string;
	scheduledTime: string;
	durationMinutes: number;
	status: string;
	googleEventId: string | null;
	googleCalendarId: string | null;
};

const pad2 = (n: number) => {
	return String(n).padStart(2, "0");
}

/**
 * Soma minutos a data/hora local abstrata (sem TZ do servidor).
 * Retorna `{ date, time }` em YYYY-MM-DD / HH:mm:ss.
 */
export const addMinutesWallClock = (
	date: string,
	time: string,
	minutes: number
) => {
	const normalized = normalizeTime(time);
	const [y, mo, d] = date.split("-").map(Number);
	const [hh, mm, ss] = normalized.split(":").map(Number);
	const startMs = Date.UTC(y, mo - 1, d, hh, mm, ss || 0);
	const end = new Date(startMs + minutes * 60_000);
	return {
		date: `${end.getUTCFullYear()}-${pad2(end.getUTCMonth() + 1)}-${pad2(end.getUTCDate())}`,
		time: `${pad2(end.getUTCHours())}:${pad2(end.getUTCMinutes())}:${pad2(end.getUTCSeconds())}`
	};
}

const toGoogleDateTime = (date: string, time: string) => {
	const t = normalizeTime(time);
	return `${date}T${t.length === 5 ? `${t}:00` : t}`;
}

const STATUS_LABEL: Record<string, string> = {
	scheduled: "Agendado",
	completed: "Realizado",
	canceled: "Cancelado",
	no_show: "Faltou"
};

const calendarFetch = async (
	accessToken: string,
	path: string,
	init?: RequestInit
) => {
	const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			...(init?.headers ?? {})
		}
	});
	if (res.status === 204) return null;
	const json = await res.json().catch(() => ({}));
	if (!res.ok) {
		const message =
			(json as { error?: { message?: string } }).error?.message ||
			`Google Calendar HTTP ${res.status}`;
		const err = new Error(message) as Error & { status?: number };
		err.status = res.status;
		throw err;
	}
	return json as { id?: string };
}

const loadSyncContext = async (session: SessionForSync, db: Db) => {
	const [row] = await db
		.select({
			patientName: patients.fullName,
			serviceTypeName: serviceTypes.name,
			serviceTypeCalendarId: serviceTypes.googleCalendarId,
			timezone: clinics.timezone,
			clinicName: clinics.displayName
		})
		.from(sessions)
		.innerJoin(patients, eq(patients.id, sessions.patientId))
		.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
		.innerJoin(clinics, eq(clinics.id, sessions.clinicId))
		.where(
			and(eq(sessions.id, session.id), eq(sessions.clinicId, session.clinicId))
		)
		.limit(1);

	if (!row) throw new Error("Sessão não encontrada para sync.");
	return row;
}

const buildEventBody = (
	session: SessionForSync,
	ctx: Awaited<ReturnType<typeof loadSyncContext>>,
	appUrl: string
) => {
	const start = toGoogleDateTime(
		session.scheduledDate,
		String(session.scheduledTime)
	);
	const endWall = addMinutesWallClock(
		session.scheduledDate,
		String(session.scheduledTime),
		session.durationMinutes
	);
	const end = toGoogleDateTime(endWall.date, endWall.time);
	const statusLabel = STATUS_LABEL[session.status] ?? session.status;
	const summary = `${ctx.patientName} · ${ctx.serviceTypeName}`;

	return {
		summary,
		description: [
			`Status: ${statusLabel}`,
			`Clínica: ${ctx.clinicName}`,
			`Abrir no sistema: ${appUrl}/admin/sessions/${session.id}`
		].join("\n"),
		start: { dateTime: start, timeZone: ctx.timezone },
		end: { dateTime: end, timeZone: ctx.timezone },
		reminders: {
			useDefault: false,
			overrides: [{ method: "popup", minutes: 30 }]
		}
	};
}

export type GoogleSyncResult =
	| { status: "skipped" }
	| { status: "synced"; action: "create" | "update" | "delete" | "move" }
	| { status: "error"; message: string };

/**
 * Remove vínculos Google das sessões da clínica (após desconectar / trocar conta).
 */
export const clearClinicGoogleEventLinks = async (
	clinicId: string,
	db: Db = getDb()
) => {
	await db
		.update(sessions)
		.set({
			googleEventId: null,
			googleCalendarId: null,
			updatedAt: new Date()
		})
		.where(eq(sessions.clinicId, clinicId));
}

/**
 * Espelha a sessão no Google Agenda. Não lança — retorna status para a UI.
 */
export const syncSessionToGoogleCalendar = async (
	sessionId: string,
	clinicId: string,
	db: Db = getDb()
): Promise<GoogleSyncResult> => {
	try {
		const auth = await getValidAccessToken(clinicId, db);
		if (!auth) return { status: "skipped" };

		const [session] = await db
			.select()
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), eq(sessions.clinicId, clinicId)))
			.limit(1);

		if (!session) return { status: "skipped" };

		const appUrl =
			process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
			"http://localhost:3000";

		const ctx = await loadSyncContext(session, db);
		const targetCalendarId = resolveTargetCalendarId({
			serviceTypeCalendarId: ctx.serviceTypeCalendarId,
			connectionDefaultCalendarId: auth.calendarId
		});
		const encodedTarget = encodeURIComponent(targetCalendarId);
		const storedCalendarId = session.googleCalendarId || auth.calendarId;

		if (session.status === "canceled" || session.status === "no_show") {
			if (session.googleEventId) {
				const encodedStored = encodeURIComponent(storedCalendarId);
				await calendarFetch(
					auth.accessToken,
					`/calendars/${encodedStored}/events/${encodeURIComponent(session.googleEventId)}`,
					{ method: "DELETE" }
				).catch(() => null);
				await db
					.update(sessions)
					.set({
						googleEventId: null,
						googleCalendarId: null,
						updatedAt: new Date()
					})
					.where(eq(sessions.id, session.id));
				return { status: "synced", action: "delete" };
			}
			return { status: "skipped" };
		}

		const body = buildEventBody(session, ctx, appUrl);

		// Evento já existe na agenda certa → atualiza.
		if (
			session.googleEventId &&
			storedCalendarId === targetCalendarId
		) {
			try {
				await calendarFetch(
					auth.accessToken,
					`/calendars/${encodedTarget}/events/${encodeURIComponent(session.googleEventId)}`,
					{ method: "PUT", body: JSON.stringify(body) }
				);
				return { status: "synced", action: "update" };
			} catch (err) {
				const status = (err as Error & { status?: number }).status;
				// Evento sumiu (desconectou / outra conta) → recria.
				if (status !== 404) throw err;
			}
		}

		// Mudou de agenda: remove o antigo (best-effort) e cria no destino.
		if (session.googleEventId && storedCalendarId !== targetCalendarId) {
			await calendarFetch(
				auth.accessToken,
				`/calendars/${encodeURIComponent(storedCalendarId)}/events/${encodeURIComponent(session.googleEventId)}`,
				{ method: "DELETE" }
			).catch(() => null);
		}

		const created = await calendarFetch(
			auth.accessToken,
			`/calendars/${encodedTarget}/events`,
			{ method: "POST", body: JSON.stringify(body) }
		);

		if (created?.id) {
			await db
				.update(sessions)
				.set({
					googleEventId: created.id,
					googleCalendarId: targetCalendarId,
					updatedAt: new Date()
				})
				.where(eq(sessions.id, session.id));
			return {
				status: "synced",
				action:
					session.googleEventId && storedCalendarId !== targetCalendarId
						? "move"
						: "create"
			};
		}

		return { status: "error", message: "Google não retornou ID do evento." };
	} catch (err) {
		console.error("[google-calendar] sync failed", sessionId, err);
		return {
			status: "error",
			message:
				err instanceof Error ? err.message : "Falha ao sincronizar com Google."
		};
	}
}

export type GoogleRestoreResult = {
	total: number;
	synced: number;
	errors: number;
	skipped: number;
};

/**
 * Recria/atualiza no Google os agendamentos ativos da clínica
 * (agendados + realizados a partir de hoje).
 */
export const restoreClinicSessionsToGoogle = async (
	clinicId: string,
	db: Db = getDb()
): Promise<GoogleRestoreResult> => {
	const auth = await getValidAccessToken(clinicId, db);
	if (!auth) {
		return { total: 0, synced: 0, errors: 0, skipped: 0 };
	}

	const today = toDateString(new Date());
	const rows = await db
		.select({ id: sessions.id })
		.from(sessions)
		.where(
			and(
				eq(sessions.clinicId, clinicId),
				or(
					eq(sessions.status, "scheduled"),
					and(eq(sessions.status, "completed"), gte(sessions.scheduledDate, today))
				)
			)
		)
		.limit(500);

	const result: GoogleRestoreResult = {
		total: rows.length,
		synced: 0,
		errors: 0,
		skipped: 0
	};

	for (const row of rows) {
		const sync = await syncSessionToGoogleCalendar(row.id, clinicId, db);
		if (sync.status === "synced") result.synced += 1;
		else if (sync.status === "error") result.errors += 1;
		else result.skipped += 1;
	}

	return result;
}

/**
 * Limpa mapeamentos Tipo → agenda (útil ao trocar de conta Google).
 */
export const clearServiceTypeCalendarMappings = async (
	clinicId: string,
	db: Db = getDb()
) => {
	await db
		.update(serviceTypes)
		.set({ googleCalendarId: null, updatedAt: new Date() })
		.where(eq(serviceTypes.clinicId, clinicId));
}
