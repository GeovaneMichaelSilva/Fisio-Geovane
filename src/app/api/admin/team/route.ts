import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { clinicMembers, users } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { teamMemberCreateSchema } from "@/lib/team/schema";

/**
 * Lista membros da clínica.
 */
export const GET = async () => {
	try {
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const rows = await db
			.select({
				userId: users.id,
				fullName: users.fullName,
				email: users.email,
				role: clinicMembers.role,
				createdAt: users.createdAt
			})
			.from(clinicMembers)
			.innerJoin(users, eq(users.id, clinicMembers.userId))
			.where(eq(clinicMembers.clinicId, ctx.clinic.id))
			.orderBy(asc(clinicMembers.role), asc(users.fullName));

		return NextResponse.json({
			data: rows.map((r) => ({
				...r,
				createdAt: r.createdAt.toISOString(),
				isSelf: r.userId === ctx.userId
			}))
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar equipe." },
			{ status: 500 }
		);
	}
}

/**
 * Adiciona membro (cria usuário se necessário) — só owner.
 */
export const POST = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		const body = await request.json();
		const parsed = teamMemberCreateSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const data = parsed.data;
		const db = getDb();

		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.email, data.email))
			.limit(1);

		let userId: string;

		if (existingUser) {
			const [already] = await db
				.select({ userId: clinicMembers.userId })
				.from(clinicMembers)
				.where(
					and(
						eq(clinicMembers.clinicId, ctx.clinic.id),
						eq(clinicMembers.userId, existingUser.id)
					)
				)
				.limit(1);

			if (already) {
				return NextResponse.json(
					{ error: "Este e-mail já faz parte da equipe." },
					{ status: 409 }
				);
			}

			const [otherClinic] = await db
				.select({ clinicId: clinicMembers.clinicId })
				.from(clinicMembers)
				.where(eq(clinicMembers.userId, existingUser.id))
				.limit(1);

			if (otherClinic) {
				return NextResponse.json(
					{
						error:
							"Este e-mail já está vinculado a outra clínica. Use outro e-mail."
					},
					{ status: 409 }
				);
			}

			userId = existingUser.id;
			await db
				.update(users)
				.set({
					fullName: data.fullName,
					role: data.role,
					passwordHash: await hash(data.password, 12),
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));
		} else {
			const [created] = await db
				.insert(users)
				.values({
					email: data.email,
					fullName: data.fullName,
					passwordHash: await hash(data.password, 12),
					role: data.role
				})
				.returning({ id: users.id });
			userId = created.id;
		}

		await db.insert(clinicMembers).values({
			clinicId: ctx.clinic.id,
			userId,
			role: data.role
		});

		const [member] = await db
			.select({
				userId: users.id,
				fullName: users.fullName,
				email: users.email,
				role: clinicMembers.role,
				createdAt: users.createdAt
			})
			.from(clinicMembers)
			.innerJoin(users, eq(users.id, clinicMembers.userId))
			.where(
				and(
					eq(clinicMembers.clinicId, ctx.clinic.id),
					eq(clinicMembers.userId, userId)
				)
			)
			.limit(1);

		return NextResponse.json(
			{
				data: {
					...member,
					createdAt: member.createdAt.toISOString(),
					isSelf: false
				}
			},
			{ status: 201 }
		);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao adicionar membro." },
			{ status: 500 }
		);
	}
}
