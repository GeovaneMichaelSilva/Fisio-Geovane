import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { patientFormSchema } from "@/lib/patients/schema";

type Params = { params: Promise<{ patientId: string }> };

export async function GET(_request: Request, { params }: Params) {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const [row] = await db
			.select({
				patient: patients,
				preferredServiceTypeName: serviceTypes.name
			})
			.from(patients)
			.innerJoin(
				serviceTypes,
				eq(serviceTypes.id, patients.preferredServiceTypeId)
			)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!row) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		const [stats] = await db
			.select({
				completedCount: sql<number>`count(*) filter (where ${sessions.status} = 'completed')::int`,
				pendingValueBrl: sql<string>`coalesce(sum(${sessions.valueBrl}) filter (where ${sessions.status} = 'completed' and ${sessions.paid} = false), 0)`
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.patientId, patientId),
					eq(sessions.clinicId, ctx.clinic.id)
				)
			);

		const sessionRows = await db
			.select({
				id: sessions.id,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				status: sessions.status,
				valueBrl: sessions.valueBrl,
				paid: sessions.paid,
				serviceTypeName: serviceTypes.name
			})
			.from(sessions)
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(
				and(
					eq(sessions.patientId, patientId),
					eq(sessions.clinicId, ctx.clinic.id)
				)
			)
			.orderBy(desc(sessions.scheduledDate), desc(sessions.scheduledTime))
			.limit(50);

		return NextResponse.json({
			data: {
				...row.patient,
				preferredServiceTypeName: row.preferredServiceTypeName,
				stats: {
					completedCount: stats?.completedCount ?? 0,
					pendingValueBrl: String(stats?.pendingValueBrl ?? "0")
				},
				sessions: sessionRows
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar paciente." },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request, { params }: Params) {
	try {
		const { patientId } = await params;
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
		const [existing] = await db
			.select({ id: patients.id, archivedAt: patients.archivedAt })
			.from(patients)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!existing) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		if (existing.archivedAt) {
			return NextResponse.json(
				{ error: "Paciente arquivado. Restaure antes de editar." },
				{ status: 400 }
			);
		}

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
			const [updated] = await db
				.update(patients)
				.set({
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
					updatedAt: new Date()
				})
				.where(eq(patients.id, patientId))
				.returning();

			return NextResponse.json({ data: updated });
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
			{ error: "Falha ao salvar paciente." },
			{ status: 500 }
		);
	}
}
