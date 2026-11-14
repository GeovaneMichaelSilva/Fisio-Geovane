import { civilDateRangeToLocalDates } from "@/lib/google-calendar/allDayBounds";
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
	allDay?: boolean;
	resource: AgendaEventResource;
};

export type ExternalCalendarEventDto = {
	id: string;
	googleCalendarId: string;
	googleEventId: string;
	summary: string;
	status: string;
	allDay: boolean;
	startDate: string | null;
	endDate: string | null;
	startAt: string | null;
	endAt: string | null;
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
		allDay: false,
		resource: { ...session, kind: "session" }
	};
};

export const sessionsToEvents = (
	sessions: AgendaSession[]
): AgendaCalendarEvent[] => sessions.map(sessionToEvent);

export const externalDtoToEvent = (
	dto: ExternalCalendarEventDto
): AgendaCalendarEvent | null => {
	if (dto.allDay) {
		if (!dto.startDate || !dto.endDate) return null;
		const range = civilDateRangeToLocalDates(dto.startDate, dto.endDate);
		if (!range) return null;
		const { start, end } = range;
		const durationMinutes = Math.max(
			24 * 60,
			Math.round((end.getTime() - start.getTime()) / 60_000)
		);
		const resource: AgendaExternalEvent = {
			kind: "external",
			id: dto.id,
			patientName: dto.summary || "(sem título)",
			serviceTypeName: dto.calendarLabel,
			scheduledDate: dto.startDate,
			scheduledTime: "00:00:00",
			durationMinutes,
			status: "external",
			googleCalendarId: dto.googleCalendarId,
			allDay: true
		};

		return {
			id: `ext:${dto.id}`,
			title: `${dto.calendarLabel} · ${resource.patientName}`,
			start,
			end,
			allDay: true,
			resource
		};
	}

	if (!dto.startAt || !dto.endAt) return null;
	const start = new Date(dto.startAt);
	const end = new Date(dto.endAt);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return null;
	}

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
		googleCalendarId: dto.googleCalendarId,
		allDay: false
	};

	return {
		id: `ext:${dto.id}`,
		title: `${dto.calendarLabel} · ${resource.patientName}`,
		start,
		end,
		allDay: false,
		resource
	};
};

export const externalsToEvents = (
	items: ExternalCalendarEventDto[]
): AgendaCalendarEvent[] =>
	items
		.map(externalDtoToEvent)
		.filter((e): e is AgendaCalendarEvent => e != null);

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
