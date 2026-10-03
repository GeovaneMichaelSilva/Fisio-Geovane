import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { changePasswordApiSchema } from "@/lib/auth/schema";
import { requireUserId } from "@/lib/clinic/context";

/**
 * Troca a senha do usuário autenticado (owner ou staff).
 */
export async function PUT(request: Request) {
	try {
		const userId = await requireUserId();
		const body = await request.json();
		const parsed = changePasswordApiSchema.safeParse(body);

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
		const [user] = await db
			.select({ id: users.id, passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return NextResponse.json(
				{ error: "Usuário não encontrado." },
				{ status: 404 }
			);
		}

		const ok = await compare(parsed.data.currentPassword, user.passwordHash);
		if (!ok) {
			return NextResponse.json(
				{ error: "Senha atual incorreta." },
				{ status: 400 }
			);
		}

		if (parsed.data.currentPassword === parsed.data.password) {
			return NextResponse.json(
				{ error: "A nova senha deve ser diferente da atual." },
				{ status: 400 }
			);
		}

		await db
			.update(users)
			.set({
				passwordHash: await hash(parsed.data.password, 12),
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));

		return NextResponse.json({ data: { updated: true } });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao alterar senha." },
			{ status: 500 }
		);
	}
}
