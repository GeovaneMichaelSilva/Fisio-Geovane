import { NextResponse } from "next/server";

import { getOrCreateClinicContext } from "@/lib/clinic/context";

/**
 * Dados do usuário autenticado na clínica atual.
 */
export async function GET() {
	try {
		const ctx = await getOrCreateClinicContext();
		return NextResponse.json({
			data: {
				userId: ctx.userId,
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
