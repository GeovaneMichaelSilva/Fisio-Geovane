import { and, eq, ne, notInArray } from "drizzle-orm";

import { sessions } from "@/db/schema";
import { findOverlaps, normalizeTime, type SessionInterval } from "./agenda";

import type { Db } from "@/db";

/**
 * Busca conflitos de horário no mesmo dia da clínica.
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
): Promise<SessionInterval[]> {
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
			status: sessions.status
		})
		.from(sessions)
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

	return findOverlaps(candidate, existing);
}
