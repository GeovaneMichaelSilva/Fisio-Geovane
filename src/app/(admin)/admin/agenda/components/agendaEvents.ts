import {
	normalizeTime,
	parseDateString,
	toDateString
} from "@/lib/sessions/agenda";

import type { AgendaSession } from "./types";

export type AgendaCalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaSession;
};

export const sessionToEvent = (session: AgendaSession): AgendaCalendarEvent => {
	const time = normalizeTime(String(session.scheduledTime));
	const [h, m] = time.split(":").map(Number);
	const start = parseDateString(session.scheduledDate);
	start.setHours(h ?? 0, m ?? 0, 0, 0);
	const end = new Date(start.getTime() + session.durationMinutes * 60_000);
	return {
		id: session.id,
		// Fallback (a11y / views sem component custom): hora inicial + nome
		title: `${time.slice(0, 5)} · ${session.patientName}`,
		start,
		end,
		resource: session
	};
};

export const sessionsToEvents = (
	sessions: AgendaSession[]
): AgendaCalendarEvent[] => sessions.map(sessionToEvent);

export const formatTimeHHMM = (date: Date): string => {
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
};

export const durationBetweenMinutes = (start: Date, end: Date): number => {
	const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
	return Math.max(5, minutes);
};

export const toLocalDateString = (date: Date): string => toDateString(date);
