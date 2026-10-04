import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { serviceTypes } from "@/db/schema";
import {
	ensureDefaultServiceTypes,
	getOrCreateClinicContext
} from "@/lib/clinic/context";
import { requireOwner } from "@/lib/clinic/rbac";
import { slugify } from "@/lib/clinic/slug";
import { serviceTypeCreateSchema } from "@/lib/service-types/schema";

export const GET = async () => {
	try {
		const ctx = await getOrCreateClinicContext();
		const db = getDb();
		await ensureDefaultServiceTypes(db, ctx.clinic.id);

		const rows = await db
			.select()
			.from(serviceTypes)
			.where(eq(serviceTypes.clinicId, ctx.clinic.id))
			.orderBy(asc(serviceTypes.sortOrder), asc(serviceTypes.name));

		return NextResponse.json({ data: rows });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar tipos." },
			{ status: 500 }
		);
	}
}

export const POST = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		requireOwner(ctx);
		const body = await request.json();
		const parsed = serviceTypeCreateSchema.safeParse(body);

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
		const existing = await db
			.select({
				slug: serviceTypes.slug,
				sortOrder: serviceTypes.sortOrder
			})
			.from(serviceTypes)
			.where(eq(serviceTypes.clinicId, ctx.clinic.id));

		const baseSlug = slugify(parsed.data.name) || "tipo";
		let slug = baseSlug;
		let attempt = 1;
		const taken = new Set(existing.map((r) => r.slug));
		while (taken.has(slug) && attempt < 50) {
			attempt += 1;
			slug = `${baseSlug}-${attempt}`;
		}

		const nextSort =
			parsed.data.sortOrder ??
			(existing.length > 0
				? Math.max(...existing.map((r) => r.sortOrder)) + 1
				: 1);

		const [created] = await db
			.insert(serviceTypes)
			.values({
				clinicId: ctx.clinic.id,
				name: parsed.data.name,
				slug,
				defaultDurationMinutes: parsed.data.defaultDurationMinutes,
				defaultValueBrl: parsed.data.defaultValueBrl.toFixed(2),
				isActive: parsed.data.isActive,
				sortOrder: nextSort
			})
			.returning();

		return NextResponse.json({ data: created }, { status: 201 });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao criar tipo." },
			{ status: 500 }
		);
	}
}
