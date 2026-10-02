import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { clinics } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";

const updateClinicSchema = z.object({
	displayName: z.string().trim().min(1, "Nome obrigatório.").max(120),
	professionLabel: z.string().trim().min(1).max(80),
	licenseNumber: z
		.string()
		.trim()
		.max(40)
		.transform((v) => (v === "" ? null : v)),
	timezone: z.string().trim().min(1).max(64),
	defaultSessionDurationMinutes: z.coerce.number().int().min(5).max(480)
});

export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		return NextResponse.json({ data: ctx.clinic });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar clínica." },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = updateClinicSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const db = getDb();
		const [updated] = await db
			.update(clinics)
			.set({
				displayName: parsed.data.displayName,
				professionLabel: parsed.data.professionLabel,
				licenseNumber: parsed.data.licenseNumber,
				timezone: parsed.data.timezone,
				defaultSessionDurationMinutes:
					parsed.data.defaultSessionDurationMinutes,
				updatedAt: new Date()
			})
			.where(eq(clinics.id, ctx.clinic.id))
			.returning();

		return NextResponse.json({ data: updated });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao salvar clínica." },
			{ status: 500 }
		);
	}
}
