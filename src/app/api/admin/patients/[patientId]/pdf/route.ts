import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes, sessionAudits, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";

type Params = { params: Promise<{ patientId: string }> };

/**
 * Dados para exportação PDF do histórico clínico do paciente.
 */
export const GET = async (_request: Request, { params }: Params) => {
	try {
		const { patientId } = await params;
		const ctx = await getOrCreateClinicContext();
		const db = getDb();

		const [patient] = await db
			.select()
			.from(patients)
			.where(
				and(
					eq(patients.id, patientId),
					eq(patients.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!patient) {
			return NextResponse.json(
				{ error: "Paciente não encontrado." },
				{ status: 404 }
			);
		}

		const completed = await db
			.select({
				id: sessions.id,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				serviceTypeName: serviceTypes.name,
				status: sessions.status,
				valueBrl: sessions.valueBrl,
				paid: sessions.paid,
				assessment: sessions.assessment,
				evolution: sessions.evolution,
				activities: sessions.activities
			})
			.from(sessions)
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(
				and(
					eq(sessions.patientId, patientId),
					eq(sessions.clinicId, ctx.clinic.id),
					eq(sessions.status, "completed")
				)
			)
			.orderBy(desc(sessions.scheduledDate), desc(sessions.scheduledTime));

		const sessionIds = completed.map((s) => s.id);
		const lastAuditBySession = new Map<
			string,
			{ editedAt: Date; reason: string }
		>();

		if (sessionIds.length > 0) {
			const audits = await db
				.select({
					sessionId: sessionAudits.sessionId,
					editedAt: sessionAudits.editedAt,
					reason: sessionAudits.reason
				})
				.from(sessionAudits)
				.where(inArray(sessionAudits.sessionId, sessionIds))
				.orderBy(desc(sessionAudits.editedAt));

			for (const audit of audits) {
				if (!lastAuditBySession.has(audit.sessionId)) {
					lastAuditBySession.set(audit.sessionId, {
						editedAt: audit.editedAt,
						reason: audit.reason
					});
				}
			}
		}

		const withAudits = completed.map((session) => {
			const lastAudit = lastAuditBySession.get(session.id);
			return {
				...session,
				lastAudit: lastAudit
					? {
							editedAt: lastAudit.editedAt.toISOString(),
							reason: lastAudit.reason
						}
					: null
			};
		});

		return NextResponse.json({
			data: {
				clinic: {
					displayName: ctx.clinic.displayName,
					professionLabel: ctx.clinic.professionLabel,
					licenseNumber: ctx.clinic.licenseNumber
				},
				patient: {
					fullName: patient.fullName,
					phone: patient.phone,
					cpf: patient.cpf
				},
				sessions: withAudits
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao montar dados do PDF." },
			{ status: 500 }
		);
	}
}
