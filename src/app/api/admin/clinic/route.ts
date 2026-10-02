import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { clinics } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { clinicUpdateSchema } from "@/lib/clinic/schema";

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
		const parsed = clinicUpdateSchema.safeParse(body);

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
