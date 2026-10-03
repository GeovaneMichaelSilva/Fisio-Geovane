import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { serviceTypes } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { slugify } from "@/lib/clinic/slug";
import { serviceTypeUpdateSchema } from "@/lib/service-types/schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
	try {
		const { id } = await params;
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const body = await request.json();
		const parsed = serviceTypeUpdateSchema.safeParse(body);

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
		const [current] = await db
			.select()
			.from(serviceTypes)
			.where(
				and(
					eq(serviceTypes.id, id),
					eq(serviceTypes.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!current) {
			return NextResponse.json(
				{ error: "Tipo não encontrado." },
				{ status: 404 }
			);
		}

		const patch: Partial<typeof serviceTypes.$inferInsert> = {
			updatedAt: new Date()
		};

		if (parsed.data.name !== undefined) {
			patch.name = parsed.data.name;
			const baseSlug = slugify(parsed.data.name) || current.slug;
			if (baseSlug !== current.slug) {
				const siblings = await db
					.select({ slug: serviceTypes.slug, id: serviceTypes.id })
					.from(serviceTypes)
					.where(eq(serviceTypes.clinicId, ctx.clinic.id));

				const taken = new Set(
					siblings.filter((s) => s.id !== id).map((s) => s.slug)
				);
				let slug = baseSlug;
				let attempt = 1;
				while (taken.has(slug) && attempt < 50) {
					attempt += 1;
					slug = `${baseSlug}-${attempt}`;
				}
				patch.slug = slug;
			}
		}
		if (parsed.data.defaultDurationMinutes !== undefined) {
			patch.defaultDurationMinutes = parsed.data.defaultDurationMinutes;
		}
		if (parsed.data.defaultValueBrl !== undefined) {
			patch.defaultValueBrl = parsed.data.defaultValueBrl.toFixed(2);
		}
		if (parsed.data.isActive !== undefined) {
			patch.isActive = parsed.data.isActive;
		}
		if (parsed.data.sortOrder !== undefined) {
			patch.sortOrder = parsed.data.sortOrder;
		}

		const [updated] = await db
			.update(serviceTypes)
			.set(patch)
			.where(eq(serviceTypes.id, id))
			.returning();

		return NextResponse.json({ data: updated });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao atualizar tipo." },
			{ status: 500 }
		);
	}
}
