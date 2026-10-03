import { and, eq, ne, notInArray } from "drizzle-orm";

import { patients, sessions } from "@/db/schema";
import { findOverlaps, normalizeTime, type SessionInterval } from "./agenda";

import type { Db } from "@/db";

export type OverlapConflict = SessionInterval & {
	patientName: string;
};

/**
 * Busca conflitos de horário no mesmo dia da clínica (com nome do paciente).
 */
export async function getOverlappingSessions(
	db: Db,
	input: {
		clinicId: string;
		scheduledDate: string;
		scheduledTime: string;
		durationMinutes: number;
		excludeSessionId?: string;
	}
): Promise<OverlapConflict[]> {
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

	return overlapping.map((o) => ({
		...o,
		patientName: (o.id && byId.get(o.id)) || "Paciente"
	}));
}
