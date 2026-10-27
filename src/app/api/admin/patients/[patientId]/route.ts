import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { withTransaction } from "@/db/transaction";
import { patients, serviceTypes, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { patientFormSchema } from "@/lib/patients/schema";

type Params = { params: Promise<{ patientId: string }> };

const deleteBodySchema = z.object({
	/** Confirmação: deve coincidir com o nome do paciente (trim, case-insensitive). */
	confirmName: z.string().trim().min(1, "Informe o nome do paciente.")
});

export const GET = async (_request: Request, { params }: Params) => {
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
				sessionCount: sql<number>`count(*)::int`,
				completedCount: sql<number>`count(*) filter (where ${sessions.status} = 'completed')::int`,
				pendingValueBrl: sql<string>`coalesce(sum(
					greatest(${sessions.valueBrl}::numeric - ${sessions.amountPaidBrl}::numeric, 0)
				) filter (
					where ${sessions.status} = 'completed' and ${sessions.paid} = false
				), 0)`
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
				amountPaidBrl: sessions.amountPaidBrl,
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
					sessionCount: stats?.sessionCount ?? 0,
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

export const PUT = async (request: Request, { params }: Params) => {
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
};

/**
 * Exclui paciente em definitivo (e sessões vinculadas).
 * Exige confirmName igual ao nome cadastrado.
 */
export const DELETE = async (request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const body = await request.json().catch(() => ({}));
		const parsed = deleteBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Confirme o nome do paciente para excluir.",
					issues: parsed.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const db = getDb();
		const [existing] = await db
			.select({
				id: patients.id,
				fullName: patients.fullName
			})
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

		const expected = existing.fullName.trim().toLowerCase();
		const got = parsed.data.confirmName.trim().toLowerCase();
		if (expected !== got) {
			return NextResponse.json(
				{ error: "O nome informado não confere com o cadastro." },
				{ status: 400 }
			);
		}

		const [sessionCountRow] = await db
			.select({
				count: sql<number>`count(*)::int`
			})
			.from(sessions)
			.where(eq(sessions.patientId, patientId));

		const sessionCount = sessionCountRow?.count ?? 0;

		await withTransaction(async (tx) => {
			// sessões não têm onDelete no patient
			if (sessionCount > 0) {
				await tx.delete(sessions).where(eq(sessions.patientId, patientId));
			}
			await tx.delete(patients).where(eq(patients.id, patientId));
		});

		return NextResponse.json({
			data: { id: patientId, deletedSessions: sessionCount }
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao excluir paciente." },
			{ status: 500 }
		);
	}
};
