import { NextResponse } from "next/server";

import { resetPasswordApiSchema } from "@/lib/auth/schema";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
	try {
		const json = await request.json();
		const parsed = resetPasswordApiSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos. Senha com no mínimo 8 caracteres.",
					issues: parsed.error.flatten().fieldErrors
				},
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
