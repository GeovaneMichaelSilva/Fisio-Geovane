import { sessionAudits } from "@/db/schema";

import type { Db } from "@/db";

/**
 * Grava auditoria append-only da sessão.
 */
export const writeSessionAudit = async (
	db: Db,
	input: {
		clinicId: string;
		sessionId: string;
		editedBy: string;
		reason: string;
		beforeState: unknown;
		afterState: unknown;
	}
) => {
	await db.insert(sessionAudits).values({
		clinicId: input.clinicId,
		sessionId: input.sessionId,
		editedBy: input.editedBy,
		reason: input.reason,
		beforeState: input.beforeState as Record<string, unknown>,
		afterState: input.afterState as Record<string, unknown>
	});
}
