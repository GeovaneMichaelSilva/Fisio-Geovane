import { NextResponse } from "next/server";

import { resetPasswordApiSchema } from "@/lib/auth/schema";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export const POST = async (request: Request) => {
	try {
		const json = await request.json();
		const parsed = resetPasswordApiSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error:
						"Dados inválidos. A senha precisa ter 8+ caracteres, maiúscula, minúscula, número e caractere especial.",
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
