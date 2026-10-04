import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { patients } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";

type Params = { params: Promise<{ patientId: string }> };

const bodySchema = z.object({
	archived: z.boolean()
});

/**
 * Arquiva ou restaura paciente (sem hard-delete).
 */
export const POST = async (request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const parsed = bodySchema.safeParse(await request.json());

		if (!parsed.success) {
			return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
		}

		const db = getDb();
		const [existing] = await db
			.select({ id: patients.id })
			.from(patients)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!existing) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		const [updated] = await db
			.update(patients)
			.set({
				archivedAt: parsed.data.archived ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(patients.id, patientId))
			.returning();

		return NextResponse.json({ data: updated });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao atualizar arquivamento." },
			{ status: 500 }
		);
	}
}
