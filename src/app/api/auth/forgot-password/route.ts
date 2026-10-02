import { NextResponse } from "next/server";

import { forgotPasswordSchema } from "@/lib/auth/schema";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
	try {
		const json = await request.json();
		const parsed = forgotPasswordSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "E-mail inválido.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const result = await requestPasswordReset(parsed.data.email);

		return NextResponse.json({
			ok: true,
			...(process.env.NODE_ENV === "development" && result.devResetUrl
				? { devResetUrl: result.devResetUrl }
				: {})
		});
	} catch (error) {
		console.error("[forgot-password]", error);
		return NextResponse.json(
			{ error: "Não foi possível processar o pedido." },
			{ status: 500 }
		);
	}
}
