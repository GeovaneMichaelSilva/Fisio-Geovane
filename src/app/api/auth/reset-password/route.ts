import { NextResponse } from "next/server";
import { z } from "zod";

import { resetPasswordWithToken } from "@/lib/auth/password-reset";

const bodySchema = z.object({
	token: z.string().min(1),
	password: z.string().min(8)
});

export async function POST(request: Request) {
	try {
		const json = await request.json();
		const parsed = bodySchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos. Senha com no mínimo 8 caracteres." },
				{ status: 400 }
			);
		}

		const result = await resetPasswordWithToken(
			parsed.data.token,
			parsed.data.password
		);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[reset-password]", error);
		return NextResponse.json(
			{ error: "Não foi possível atualizar a senha." },
			{ status: 500 }
		);
	}
}
