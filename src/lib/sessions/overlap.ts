import { and, eq, gt, lt, ne, notInArray } from "drizzle-orm";

import { clinics, externalCalendarEvents, patients, sessions } from "@/db/schema";
import { findOverlaps, normalizeTime, type SessionInterval } from "./agenda";

import type { Db } from "@/db";

export type OverlapConflict = SessionInterval & {
	patientName: string;
	kind?: "session" | "external";
};

/**
 * Extrai data/hora de parede num fuso (YYYY-MM-DD / HH:mm:ss).
 */
export const wallClockInTimeZone = (date: Date, timeZone: string) => {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23"
	}).formatToParts(date);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "00";

	return {
		date: `${get("year")}-${get("month")}-${get("day")}`,
		time: `${get("hour")}:${get("minute")}:${get("second")}`
	};
};

const durationFromBounds = (startAt: Date, endAt: Date) => {
	return Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000));
};

/**
 * Busca conflitos de horário no mesmo dia (sessões + eventos externos overlay).
 */
export const getOverlappingSessions = async (
	db: Db,
	input: {
		clinicId: string;
		scheduledDate: string;
		scheduledTime: string;
		durationMinutes: number;
		excludeSessionId?: string;
	}
): Promise<OverlapConflict[]> => {
	const conditions = [
		eq(sessions.clinicId, input.clinicId),
		eq(sessions.scheduledDate, input.scheduledDate),
		notInArray(sessions.status, ["canceled", "no_show"])
	];

	if (input.excludeSessionId) {
		conditions.push(ne(sessions.id, input.excludeSessionId));
	}

	const rows = await db
		.select({
			id: sessions.id,
			scheduledDate: sessions.scheduledDate,
			scheduledTime: sessions.scheduledTime,
			durationMinutes: sessions.durationMinutes,
			status: sessions.status,
			patientName: patients.fullName
		})
		.from(sessions)
		.innerJoin(patients, eq(patients.id, sessions.patientId))
		.where(and(...conditions));

	const candidate: SessionInterval = {
		id: input.excludeSessionId,
		scheduledDate: input.scheduledDate,
		scheduledTime: normalizeTime(input.scheduledTime),
		durationMinutes: input.durationMinutes,
		status: "scheduled"
	};

	const existing: SessionInterval[] = rows.map((r) => ({
		id: r.id,
		scheduledDate: r.scheduledDate,
		scheduledTime: normalizeTime(String(r.scheduledTime)),
		durationMinutes: r.durationMinutes,
		status: r.status
	}));

	const overlapping = findOverlaps(candidate, existing);
	const byId = new Map(rows.map((r) => [r.id, r.patientName]));

	const sessionConflicts: OverlapConflict[] = overlapping.map((o) => ({
		...o,
		patientName: (o.id && byId.get(o.id)) || "Paciente",
		kind: "session" as const
	}));

	const [clinic] = await db
		.select({ timezone: clinics.timezone })
		.from(clinics)
		.where(eq(clinics.id, input.clinicId))
		.limit(1);

	const timeZone = clinic?.timezone || "America/Sao_Paulo";

	// Janela do dia no fuso da clínica (aproximação via Instant bounds amplos ±14h).
	const dayStartApprox = new Date(`${input.scheduledDate}T00:00:00.000Z`);
	dayStartApprox.setUTCHours(dayStartApprox.getUTCHours() - 14);
	const dayEndApprox = new Date(`${input.scheduledDate}T23:59:59.999Z`);
	dayEndApprox.setUTCHours(dayEndApprox.getUTCHours() + 14);

	const externalRows = await db
		.select({
			id: externalCalendarEvents.id,
			summary: externalCalendarEvents.summary,
			startAt: externalCalendarEvents.startAt,
			endAt: externalCalendarEvents.endAt,
			status: externalCalendarEvents.status
		})
		.from(externalCalendarEvents)
		.where(
			and(
				eq(externalCalendarEvents.clinicId, input.clinicId),
				ne(externalCalendarEvents.status, "cancelled"),
				lt(externalCalendarEvents.startAt, dayEndApprox),
				gt(externalCalendarEvents.endAt, dayStartApprox)
			)
		);

	const externalIntervals: OverlapConflict[] = [];
	for (const row of externalRows) {
		const start = wallClockInTimeZone(row.startAt, timeZone);
		const end = wallClockInTimeZone(row.endAt, timeZone);
		if (start.date !== input.scheduledDate && end.date !== input.scheduledDate) {
			// Evento multi-dia: ainda pode cobrir o dia alvo.
			if (start.date > input.scheduledDate || end.date < input.scheduledDate) {
				continue;
			}
		}

		let scheduledTime = start.time;
		let durationMinutes = durationFromBounds(row.startAt, row.endAt);

		if (start.date !== input.scheduledDate) {
			scheduledTime = "00:00:00";
			const endMinutes =
				end.date === input.scheduledDate
					? Number(end.time.slice(0, 2)) * 60 + Number(end.time.slice(3, 5))
					: 24 * 60;
			durationMinutes = endMinutes;
		} else if (end.date !== input.scheduledDate) {
			const startMinutes =
				Number(start.time.slice(0, 2)) * 60 + Number(start.time.slice(3, 5));
			durationMinutes = 24 * 60 - startMinutes;
		}

		externalIntervals.push({
			id: row.id,
			scheduledDate: input.scheduledDate,
			scheduledTime: normalizeTime(scheduledTime),
			durationMinutes,
			status: "scheduled",
			patientName: row.summary?.trim() || "Agenda externa",
			kind: "external"
		});
	}

	const externalOverlaps = findOverlaps(candidate, externalIntervals);
	const externalById = new Map(externalIntervals.map((e) => [e.id!, e]));

	const externalConflicts: OverlapConflict[] = externalOverlaps.map((o) => ({
		...o,
		patientName: (o.id && externalById.get(o.id)?.patientName) || "Agenda externa",
		kind: "external"
	}));

	return [...sessionConflicts, ...externalConflicts];
};
