import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { serviceTypes } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { getValidAccessToken } from "@/lib/google-calendar/client";

const mappingsSchema = z.object({
	mappings: z.array(
		z.object({
			serviceTypeId: z.string().uuid(),
			googleCalendarId: z.string().trim().min(1).max(256).nullable()
		})
	)
});

/**
 * Atualiza o mapa Tipo de atendimento → agenda Google.
 * `null` = usar agenda padrão da conexão.
 */
export async function PUT(request: Request) {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const auth = await getValidAccessToken(ctx.clinic.id);
		if (!auth) {
			return NextResponse.json(
				{ error: "Google Agenda não conectada." },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const parsed = mappingsSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
		}

		const db = getDb();
		const ids = parsed.data.mappings.map((m) => m.serviceTypeId);
		if (ids.length === 0) {
			return NextResponse.json({ data: { updated: 0 } });
		}

		const owned = await db
			.select({ id: serviceTypes.id })
			.from(serviceTypes)
			.where(
				and(
					eq(serviceTypes.clinicId, ctx.clinic.id),
					inArray(serviceTypes.id, ids)
				)
			);
		const ownedSet = new Set(owned.map((r) => r.id));

		let updated = 0;
		for (const mapping of parsed.data.mappings) {
			if (!ownedSet.has(mapping.serviceTypeId)) continue;
			await db
				.update(serviceTypes)
				.set({
					googleCalendarId: mapping.googleCalendarId,
					updatedAt: new Date()
				})
				.where(
					and(
						eq(serviceTypes.id, mapping.serviceTypeId),
						eq(serviceTypes.clinicId, ctx.clinic.id)
					)
				);
			updated += 1;
		}

		return NextResponse.json({ data: { updated } });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao salvar mapeamento de agendas." },
			{ status: 500 }
		);
	}
}
