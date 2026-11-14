import {
	normalizeTime,
	parseDateString,
	toDateString
} from "@/lib/sessions/agenda";

import type {
	AgendaEventResource,
	AgendaExternalEvent,
	AgendaSession
} from "./types";

export type AgendaCalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: AgendaEventResource;
};

export type ExternalCalendarEventDto = {
	id: string;
	googleCalendarId: string;
	googleEventId: string;
	summary: string;
	status: string;
	allDay: boolean;
	startAt: string;
	endAt: string;
	calendarLabel: string;
};

export const sessionToEvent = (session: AgendaSession): AgendaCalendarEvent => {
	const time = normalizeTime(String(session.scheduledTime));
	const [h, m] = time.split(":").map(Number);
	const start = parseDateString(session.scheduledDate);
	start.setHours(h ?? 0, m ?? 0, 0, 0);
	const end = new Date(start.getTime() + session.durationMinutes * 60_000);
	return {
		id: session.id,
		title: `${time.slice(0, 5)} · ${session.patientName}`,
		start,
		end,
		resource: { ...session, kind: "session" }
	};
};

export const sessionsToEvents = (
	sessions: AgendaSession[]
): AgendaCalendarEvent[] => sessions.map(sessionToEvent);

export const externalDtoToEvent = (
	dto: ExternalCalendarEventDto
): AgendaCalendarEvent => {
	const start = new Date(dto.startAt);
	const end = new Date(dto.endAt);
	const durationMinutes = Math.max(
		5,
		Math.round((end.getTime() - start.getTime()) / 60_000)
	);
	const resource: AgendaExternalEvent = {
		kind: "external",
		id: dto.id,
		patientName: dto.summary || "(sem título)",
		serviceTypeName: dto.calendarLabel,
		scheduledDate: toDateString(start),
		scheduledTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00`,
		durationMinutes,
		status: "external",
		googleCalendarId: dto.googleCalendarId
	};

	return {
		id: `ext:${dto.id}`,
		title: `${dto.calendarLabel} · ${resource.patientName}`,
		start,
		end,
		resource
	};
};

export const externalsToEvents = (
	items: ExternalCalendarEventDto[]
): AgendaCalendarEvent[] => items.map(externalDtoToEvent);

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
