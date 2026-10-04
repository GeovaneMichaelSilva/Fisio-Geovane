import { NextResponse } from "next/server";
import { and, asc, count, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { paginationMeta, parsePagination } from "@/lib/pagination";
import { digitsOnly, patientFormSchema } from "@/lib/patients/schema";

export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const { searchParams } = new URL(request.url);
		const q = (searchParams.get("q") ?? "").trim();
		const archived = searchParams.get("archived") === "1";
		const { page, pageSize } = parsePagination(searchParams);

		const db = getDb();
		const conditions = [
			eq(patients.clinicId, ctx.clinic.id),
			archived ? isNotNull(patients.archivedAt) : isNull(patients.archivedAt)
		];

		if (q) {
			const digits = digitsOnly(q);
			const search = or(
				ilike(patients.fullName, `%${q}%`),
				ilike(patients.phone, `%${q}%`),
				digits
					? sql`regexp_replace(coalesce(${patients.cpf}, ''), '\\D', '', 'g') like ${`%${digits}%`}`
					: undefined
			);
			if (search) conditions.push(search);
		}

		const where = and(...conditions);

		const [totalRow] = await db
			.select({ value: count() })
			.from(patients)
			.where(where);

		const total = totalRow?.value ?? 0;
		const meta = paginationMeta(total, page, pageSize);

		const rows = await db
			.select({
				id: patients.id,
				fullName: patients.fullName,
				phone: patients.phone,
				cpf: patients.cpf,
				preferredServiceTypeId: patients.preferredServiceTypeId,
				preferredServiceTypeName: serviceTypes.name,
				archivedAt: patients.archivedAt,
				updatedAt: patients.updatedAt
			})
			.from(patients)
			.innerJoin(
				serviceTypes,
				eq(serviceTypes.id, patients.preferredServiceTypeId)
			)
			.where(where)
			.orderBy(asc(patients.fullName))
			.limit(meta.pageSize)
			.offset(meta.offset);

		return NextResponse.json({ data: rows, meta });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar pacientes." },
			{ status: 500 }
		);
	}
}

export const POST = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = patientFormSchema.safeParse(body);

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
		const [typeOk] = await db
			.select({ id: serviceTypes.id })
			.from(serviceTypes)
			.where(
				and(
					eq(serviceTypes.id, parsed.data.preferredServiceTypeId),
					eq(serviceTypes.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!typeOk) {
			return NextResponse.json(
				{ error: "Tipo de atendimento inválido." },
				{ status: 400 }
			);
		}

		try {
			const [created] = await db
				.insert(patients)
				.values({
					clinicId: ctx.clinic.id,
					fullName: parsed.data.fullName,
					phone: parsed.data.phone,
					cpf: parsed.data.cpf,
					birthDate: parsed.data.birthDate,
					weightKg:
						parsed.data.weightKg === null
							? null
							: parsed.data.weightKg.toFixed(2),
					heightCm:
						parsed.data.heightCm === null
							? null
							: parsed.data.heightCm.toFixed(2),
					preferredServiceTypeId: parsed.data.preferredServiceTypeId,
					addressStreet: parsed.data.addressStreet,
					addressNumber: parsed.data.addressNumber,
					addressNeighborhood: parsed.data.addressNeighborhood,
					addressCity: parsed.data.addressCity,
					addressZip: parsed.data.addressZip,
					notes: parsed.data.notes,
					createdBy: ctx.userId
				})
				.returning();

			return NextResponse.json({ data: created }, { status: 201 });
		} catch (e) {
			const msg = e instanceof Error ? e.message : "";
			if (msg.includes("patients_clinic_cpf_uidx")) {
				return NextResponse.json(
					{ error: "Já existe um paciente ativo com este CPF." },
					{ status: 409 }
				);
			}
			throw e;
		}
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao criar paciente." },
			{ status: 500 }
		);
	}
}
