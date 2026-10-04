import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { clinicMembers, clinics, serviceTypes, users } from "@/db/schema";

import { DEFAULT_CLINIC, DEFAULT_SERVICE_TYPES } from "./defaults";

import type { Db } from "@/db";

export type ClinicContext = {
	userId: string;
	role: "owner" | "staff";
	clinic: typeof clinics.$inferSelect;
};

/**
 * Exige sessão autenticada; lança Response 401 se ausente.
 */
export const requireUserId = async (): Promise<string> => {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) {
		throw new Response(JSON.stringify({ error: "Não autenticado." }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
	}
	return userId;
}

/**
 * Resolve a clínica do usuário via membership.
 * - Com membership: usa a clínica.
 * - Sem membership, mas é ownerUserId: backfill membership.
 * - Sem membership e staff: 403 (precisa ser convidado).
 * - Sem membership e owner sem clínica: cria clínica (bootstrap do primeiro acesso).
 */
export const getOrCreateClinicContext = async (
	db: Db = getDb()
): Promise<ClinicContext> => {
	const userId = await requireUserId();

	const [membership] = await db
		.select({
			role: clinicMembers.role,
			clinic: clinics
		})
		.from(clinicMembers)
		.innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
		.where(eq(clinicMembers.userId, userId))
		.limit(1);

	if (membership) {
		return {
			userId,
			role: membership.role,
			clinic: membership.clinic
		};
	}

	const [owned] = await db
		.select()
		.from(clinics)
		.where(eq(clinics.ownerUserId, userId))
		.limit(1);

	if (owned) {
		await db
			.insert(clinicMembers)
			.values({ clinicId: owned.id, userId, role: "owner" })
			.onConflictDoNothing();

		await ensureDefaultServiceTypes(db, owned.id);

		return { userId, role: "owner", clinic: owned };
	}

	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (user?.role === "staff") {
		throw new Response(
			JSON.stringify({
				error:
					"Você ainda não faz parte de uma clínica. Peça ao responsável para adicioná-lo na equipe."
			}),
			{
				status: 403,
				headers: { "Content-Type": "application/json" }
			}
		);
	}

	const [clinic] = await db
		.insert(clinics)
		.values({
			ownerUserId: userId,
			displayName: DEFAULT_CLINIC.displayName,
			professionLabel: DEFAULT_CLINIC.professionLabel,
			licenseNumber: DEFAULT_CLINIC.licenseNumber,
			timezone: DEFAULT_CLINIC.timezone,
			defaultSessionDurationMinutes:
				DEFAULT_CLINIC.defaultSessionDurationMinutes
		})
		.returning();

	await db.insert(clinicMembers).values({
		clinicId: clinic.id,
		userId,
		role: "owner"
	});

	await ensureDefaultServiceTypes(db, clinic.id);

	return { userId, role: "owner", clinic };
}

/**
 * Insere os 3 tipos seed se a clínica ainda não tiver nenhum.
 */
export const ensureDefaultServiceTypes = async (db: Db, clinicId: string) => {
	const existing = await db
		.select({ id: serviceTypes.id })
		.from(serviceTypes)
		.where(eq(serviceTypes.clinicId, clinicId))
		.limit(1);

	if (existing.length > 0) return;

	await db.insert(serviceTypes).values(
		DEFAULT_SERVICE_TYPES.map((t) => ({
			clinicId,
			name: t.name,
			slug: t.slug,
			defaultDurationMinutes: t.defaultDurationMinutes,
			defaultValueBrl: t.defaultValueBrl,
			sortOrder: t.sortOrder,
			isActive: true
		}))
	);
}

/**
 * Garante membership na clínica informada (ou lança 403).
 */
export const assertClinicAccess = async (
	clinicId: string,
	userId: string,
	db: Db = getDb()
) => {
	const [row] = await db
		.select({ role: clinicMembers.role })
		.from(clinicMembers)
		.where(
			and(
				eq(clinicMembers.clinicId, clinicId),
				eq(clinicMembers.userId, userId)
			)
		)
		.limit(1);

	if (!row) {
		throw new Response(JSON.stringify({ error: "Sem acesso à clínica." }), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
	}

	return row.role;
}
