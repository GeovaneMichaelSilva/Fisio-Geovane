import { NextResponse } from "next/server";
import { and, asc, eq, ilike, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { patientFormSchema } from "@/lib/patients/schema";

export async function GET(request: Request) {
	try {
		const ctx = await getOrCreateClinicContext();
		const { searchParams } = new URL(request.url);
		const q = (searchParams.get("q") ?? "").trim();
		const archived = searchParams.get("archived") === "1";

		const db = getDb();
		const conditions = [
			eq(patients.clinicId, ctx.clinic.id),
			archived ? isNotNull(patients.archivedAt) : isNull(patients.archivedAt)
		];

		if (q) {
			conditions.push(ilike(patients.fullName, `%${q}%`));
		}

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
			.where(and(...conditions))
			.orderBy(asc(patients.fullName))
			.limit(200);

		return NextResponse.json({ data: rows });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar pacientes." },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
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
