import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import {
	patients,
	serviceTypes,
	sessionAudits,
	sessions
} from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { normalizeTime } from "@/lib/sessions/agenda";
import { writeSessionAudit } from "@/lib/sessions/audit";
import { getOverlappingSessions } from "@/lib/sessions/overlap";
import { sessionUpdateSchema } from "@/lib/sessions/schema";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Params) {
	try {
		const { sessionId } = await params;
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const [row] = await db
			.select({
				session: sessions,
				patientName: patients.fullName,
				serviceTypeName: serviceTypes.name
			})
			.from(sessions)
			.innerJoin(patients, eq(patients.id, sessions.patientId))
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(
				and(
					eq(sessions.id, sessionId),
					eq(sessions.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!row) {
			return NextResponse.json(
				{ error: "Sessão não encontrada." },
				{ status: 404 }
			);
		}

		const audits = await db
			.select({
				id: sessionAudits.id,
				editedAt: sessionAudits.editedAt,
				reason: sessionAudits.reason
			})
			.from(sessionAudits)
			.where(eq(sessionAudits.sessionId, sessionId))
			.orderBy(desc(sessionAudits.editedAt))
			.limit(20);

		const previousClinical = await db
			.select({
				id: sessions.id,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				status: sessions.status,
				assessment: sessions.assessment,
				evolution: sessions.evolution,
				activities: sessions.activities,
				serviceTypeName: serviceTypes.name
			})
			.from(sessions)
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(
				and(
					eq(sessions.clinicId, ctx.clinic.id),
					eq(sessions.patientId, row.session.patientId),
					ne(sessions.id, sessionId)
				)
			)
			.orderBy(desc(sessions.scheduledDate), desc(sessions.scheduledTime))
			.limit(10);

		return NextResponse.json({
			data: {
				...row.session,
				patientName: row.patientName,
				serviceTypeName: row.serviceTypeName,
				audits,
				previousClinical
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao carregar sessão." },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request, { params }: Params) {
	try {
		const { sessionId } = await params;
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = sessionUpdateSchema.safeParse(body);

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

		const [current] = await db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.id, sessionId),
					eq(sessions.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!current) {
			return NextResponse.json(
				{ error: "Sessão não encontrada." },
				{ status: 404 }
			);
		}

		const nextPatientId = data.patientId ?? current.patientId;
		const nextDate = data.scheduledDate ?? current.scheduledDate;
		const nextTime = data.scheduledTime
			? normalizeTime(data.scheduledTime)
			: normalizeTime(String(current.scheduledTime));
		const nextDuration = data.durationMinutes ?? current.durationMinutes;
		const nextServiceTypeId = data.serviceTypeId ?? current.serviceTypeId;
		const nextStatus = data.status ?? current.status;
		const nextValue =
			data.valueBrl !== undefined
				? data.valueBrl.toFixed(2)
				: current.valueBrl;
		const nextPaid = data.paid ?? current.paid;
		const nextPaidAt =
			data.paidAt !== undefined ? data.paidAt : current.paidAt;
		const nextInvoice = data.invoiceIssued ?? current.invoiceIssued;
		const nextAssessment =
			data.assessment !== undefined ? data.assessment : current.assessment;
		const nextEvolution =
			data.evolution !== undefined ? data.evolution : current.evolution;
		const nextActivities =
			data.activities !== undefined ? data.activities : current.activities;

		if (nextPaid && !nextPaidAt) {
			return NextResponse.json(
				{ error: "Informe a data de pagamento." },
				{ status: 400 }
			);
		}

		if (
			nextStatus === "completed" &&
			!(nextEvolution && nextEvolution.trim().length > 0)
		) {
			return NextResponse.json(
				{ error: "Evolução é obrigatória para marcar como realizado." },
				{ status: 400 }
			);
		}

		if (data.patientId) {
			const [patient] = await db
				.select({ id: patients.id, archivedAt: patients.archivedAt })
				.from(patients)
				.where(
					and(
						eq(patients.id, data.patientId),
						eq(patients.clinicId, ctx.clinic.id)
					)
				)
				.limit(1);
			if (!patient) {
				return NextResponse.json(
					{ error: "Paciente inválido." },
					{ status: 400 }
				);
			}
			if (patient.archivedAt) {
				return NextResponse.json(
					{ error: "Não é possível vincular sessão a paciente arquivado." },
					{ status: 400 }
				);
			}
		}

		if (data.serviceTypeId) {
			const [st] = await db
				.select({ id: serviceTypes.id })
				.from(serviceTypes)
				.where(
					and(
						eq(serviceTypes.id, data.serviceTypeId),
						eq(serviceTypes.clinicId, ctx.clinic.id)
					)
				)
				.limit(1);
			if (!st) {
				return NextResponse.json(
					{ error: "Tipo de atendimento inválido." },
					{ status: 400 }
				);
			}
		}

		const scheduleChanged =
			nextDate !== current.scheduledDate ||
			nextTime !== normalizeTime(String(current.scheduledTime)) ||
			nextDuration !== current.durationMinutes;

		if (scheduleChanged && !["canceled", "no_show"].includes(nextStatus)) {
			const overlaps = await getOverlappingSessions(db, {
				clinicId: ctx.clinic.id,
				scheduledDate: nextDate,
				scheduledTime: nextTime,
				durationMinutes: nextDuration,
				excludeSessionId: sessionId
			});

			if (overlaps.length > 0 && !data.allowOverlap) {
				return NextResponse.json(
					{
						error: "overlap",
						message: "Existe sobreposição de horário.",
						conflicts: overlaps
					},
					{ status: 409 }
				);
			}

			if (overlaps.length > 0 && data.allowOverlap) {
				const reason = data.overlapReason?.trim();
				if (!reason) {
					return NextResponse.json(
						{ error: "Informe o motivo do override de sobreposição." },
						{ status: 400 }
					);
				}
			}
		}

		const [updated] = await db
			.update(sessions)
			.set({
				patientId: nextPatientId,
				scheduledDate: nextDate,
				scheduledTime: nextTime,
				durationMinutes: nextDuration,
				serviceTypeId: nextServiceTypeId,
				status: nextStatus,
				valueBrl: nextValue,
				paid: nextPaid,
				paidAt: nextPaid ? nextPaidAt : null,
				invoiceIssued: nextInvoice,
				assessment: nextAssessment,
				evolution: nextEvolution,
				activities: nextActivities,
				updatedBy: ctx.userId,
				updatedAt: new Date()
			})
			.where(eq(sessions.id, sessionId))
			.returning();

		let auditReason = data.reason;
		if (data.allowOverlap && data.overlapReason?.trim()) {
			auditReason = `${data.reason} | Override overlap: ${data.overlapReason.trim()}`;
		}

		await writeSessionAudit(db, {
			clinicId: ctx.clinic.id,
			sessionId,
			editedBy: ctx.userId,
			reason: auditReason,
			beforeState: current,
			afterState: updated
		});

		const scheduleOrStatusChanged =
			scheduleChanged ||
			nextStatus !== current.status ||
			nextPatientId !== current.patientId ||
			nextServiceTypeId !== current.serviceTypeId;

		let googleSync: Awaited<
			ReturnType<
				typeof import("@/lib/google-calendar/sync").syncSessionToGoogleCalendar
			>
		> = { status: "skipped" };

		if (scheduleOrStatusChanged) {
			const { syncSessionToGoogleCalendar } = await import(
				"@/lib/google-calendar/sync"
			);
			googleSync = await syncSessionToGoogleCalendar(
				sessionId,
				ctx.clinic.id,
				db
			);
		}

		return NextResponse.json({ data: updated, googleSync });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao atualizar sessão." },
			{ status: 500 }
		);
	}
}
