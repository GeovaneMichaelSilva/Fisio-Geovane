import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { clinicMembers, clinics, users } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";

type Params = { params: Promise<{ userId: string }> };

/**
 * Remove membro da clínica — só owner.
 */
export const DELETE = async (_request: Request, { params }: Params) => {
	try {
		const { userId } = await params;
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);

		if (userId === ctx.userId) {
			return NextResponse.json(
				{ error: "Você não pode remover a si mesmo." },
				{ status: 400 }
			);
		}

		const db = getDb();

		const [target] = await db
			.select({
				userId: clinicMembers.userId,
				role: clinicMembers.role
			})
			.from(clinicMembers)
			.where(
				and(
					eq(clinicMembers.clinicId, ctx.clinic.id),
					eq(clinicMembers.userId, userId)
				)
			)
			.limit(1);

		if (!target) {
			return NextResponse.json(
				{ error: "Membro não encontrado." },
				{ status: 404 }
			);
		}

		if (target.role === "owner") {
			const owners = await db
				.select({ userId: clinicMembers.userId })
				.from(clinicMembers)
				.where(
					and(
						eq(clinicMembers.clinicId, ctx.clinic.id),
						eq(clinicMembers.role, "owner"),
						ne(clinicMembers.userId, userId)
					)
				);

			if (owners.length === 0) {
				return NextResponse.json(
					{ error: "Não é possível remover o único responsável." },
					{ status: 400 }
				);
			}

			if (ctx.clinic.ownerUserId === userId) {
				await db
					.update(clinics)
					.set({
						ownerUserId: owners[0].userId,
						updatedAt: new Date()
					})
					.where(eq(clinics.id, ctx.clinic.id));
			}
		}

		await db
			.delete(clinicMembers)
			.where(
				and(
					eq(clinicMembers.clinicId, ctx.clinic.id),
					eq(clinicMembers.userId, userId)
				)
			);

		return NextResponse.json({ data: { removed: true } });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao remover membro." },
			{ status: 500 }
		);
	}
}
