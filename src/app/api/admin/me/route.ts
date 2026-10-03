import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";

/**
 * Dados do usuário autenticado na clínica atual.
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		const db = getDb();
		const [user] = await db
			.select({
				fullName: users.fullName,
				email: users.email
			})
			.from(users)
			.where(eq(users.id, ctx.userId))
			.limit(1);

		return NextResponse.json({
			data: {
				userId: ctx.userId,
				fullName: user?.fullName ?? null,
				email: user?.email ?? null,
				role: ctx.role,
				clinicId: ctx.clinic.id,
				clinicName: ctx.clinic.displayName
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar sessão." },
			{ status: 500 }
		);
	}
}
