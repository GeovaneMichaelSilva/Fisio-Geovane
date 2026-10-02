import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { serviceTypes } from "@/db/schema";
import {
	ensureDefaultServiceTypes,
	getOrCreateClinicContext
} from "@/lib/clinic/context";
import { slugify } from "@/lib/clinic/slug";

const createSchema = z.object({
	name: z.string().trim().min(1, "Nome obrigatório.").max(80),
	defaultDurationMinutes: z.coerce.number().int().min(5).max(480).default(50),
	defaultValueBrl: z.coerce.number().min(0).max(999_999.99),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).max(9999).optional()
});

export async function GET() {
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

export async function POST(request: Request) {
	try {
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = createSchema.safeParse(body);

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
