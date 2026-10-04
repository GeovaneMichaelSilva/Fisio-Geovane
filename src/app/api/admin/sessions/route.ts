import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, ilike, isNull, lte } from "drizzle-orm";

import { getDb } from "@/db";
import { patients, serviceTypes, sessions } from "@/db/schema";
import { getOrCreateClinicContext } from "@/lib/clinic/context";
import { paginationMeta, parsePagination } from "@/lib/pagination";
import { normalizeTime } from "@/lib/sessions/agenda";
import { writeSessionAudit } from "@/lib/sessions/audit";
import { getOverlappingSessions } from "@/lib/sessions/overlap";
import { sessionCreateSchema } from "@/lib/sessions/schema";

export const GET = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const { searchParams } = new URL(request.url);
		const from = searchParams.get("from");
		const to = searchParams.get("to");
		const status = searchParams.get("status");
		const q = (searchParams.get("q") ?? "").trim();
		const weekRange = Boolean(from && to);

		const db = getDb();
		const conditions = [eq(sessions.clinicId, ctx.clinic.id)];

		if (status) {
			if (!["scheduled", "completed", "canceled", "no_show"].includes(status)) {
				return NextResponse.json({ error: "Status inválido." }, { status: 400 });
			}
			conditions.push(
				eq(
					sessions.status,
					status as "scheduled" | "completed" | "canceled" | "no_show"
				)
			);
		}

		if (from && to) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
				return NextResponse.json(
					{ error: "from/to devem ser YYYY-MM-DD." },
					{ status: 400 }
				);
			}
			conditions.push(gte(sessions.scheduledDate, from));
			conditions.push(lte(sessions.scheduledDate, to));
		} else if (!status) {
			return NextResponse.json(
				{ error: "Informe from/to ou status." },
				{ status: 400 }
			);
		}

		if (q) {
			conditions.push(ilike(patients.fullName, `%${q}%`));
		}

		const where = and(...conditions);
		const orderBy =
			status === "completed"
				? [desc(sessions.scheduledDate), desc(sessions.scheduledTime)]
				: [asc(sessions.scheduledDate), asc(sessions.scheduledTime)];

		// Agenda semanal: devolve o intervalo inteiro (sem paginar).
		if (weekRange) {
			const rows = await db
				.select({
					id: sessions.id,
					patientId: sessions.patientId,
					patientName: patients.fullName,
					scheduledDate: sessions.scheduledDate,
					scheduledTime: sessions.scheduledTime,
					durationMinutes: sessions.durationMinutes,
					serviceTypeId: sessions.serviceTypeId,
					serviceTypeName: serviceTypes.name,
					status: sessions.status,
					valueBrl: sessions.valueBrl,
					paid: sessions.paid,
					invoiceIssued: sessions.invoiceIssued,
					evolution: sessions.evolution,
					googleEventId: sessions.googleEventId
				})
				.from(sessions)
				.innerJoin(patients, eq(patients.id, sessions.patientId))
				.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
				.where(where)
				.orderBy(...orderBy)
				.limit(500);

			return NextResponse.json({ data: rows });
		}

		const { page, pageSize } = parsePagination(searchParams);
		const [totalRow] = await db
			.select({ value: count() })
			.from(sessions)
			.innerJoin(patients, eq(patients.id, sessions.patientId))
			.where(where);
		const total = totalRow?.value ?? 0;
		const meta = paginationMeta(total, page, pageSize);

		const rows = await db
			.select({
				id: sessions.id,
				patientId: sessions.patientId,
				patientName: patients.fullName,
				scheduledDate: sessions.scheduledDate,
				scheduledTime: sessions.scheduledTime,
				durationMinutes: sessions.durationMinutes,
				serviceTypeId: sessions.serviceTypeId,
				serviceTypeName: serviceTypes.name,
				status: sessions.status,
				valueBrl: sessions.valueBrl,
				paid: sessions.paid,
				invoiceIssued: sessions.invoiceIssued,
				evolution: sessions.evolution,
				googleEventId: sessions.googleEventId
			})
			.from(sessions)
			.innerJoin(patients, eq(patients.id, sessions.patientId))
			.innerJoin(serviceTypes, eq(serviceTypes.id, sessions.serviceTypeId))
			.where(where)
			.orderBy(...orderBy)
			.limit(meta.pageSize)
			.offset(meta.offset);

		return NextResponse.json({ data: rows, meta });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao listar sessões." },
			{ status: 500 }
		);
	}
}

export const POST = async (request: Request) => {
	try {
		const ctx = await getOrCreateClinicContext();
		const body = await request.json();
		const parsed = sessionCreateSchema.safeParse(body);

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

		const [patient] = await db
			.select({
				id: patients.id,
				preferredServiceTypeId: patients.preferredServiceTypeId,
				archivedAt: patients.archivedAt
			})
			.from(patients)
			.where(
				and(
					eq(patients.id, data.patientId),
					eq(patients.clinicId, ctx.clinic.id),
					isNull(patients.archivedAt)
				)
			)
			.limit(1);

		if (!patient) {
			return NextResponse.json(
				{ error: "Paciente não encontrado ou arquivado." },
				{ status: 400 }
			);
		}

		const [serviceType] = await db
			.select()
			.from(serviceTypes)
			.where(
				and(
					eq(serviceTypes.id, data.serviceTypeId),
					eq(serviceTypes.clinicId, ctx.clinic.id)
				)
			)
			.limit(1);

		if (!serviceType) {
			return NextResponse.json(
				{ error: "Tipo de atendimento inválido." },
				{ status: 400 }
			);
		}

		const overlaps = await getOverlappingSessions(db, {
			clinicId: ctx.clinic.id,
			scheduledDate: data.scheduledDate,
			scheduledTime: data.scheduledTime,
			durationMinutes: data.durationMinutes
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

		const valueBrl =
			data.valueBrl !== undefined
				? data.valueBrl.toFixed(2)
				: serviceType.defaultValueBrl;

		const [created] = await db
			.insert(sessions)
			.values({
				clinicId: ctx.clinic.id,
				patientId: data.patientId,
				scheduledDate: data.scheduledDate,
				scheduledTime: normalizeTime(data.scheduledTime),
				durationMinutes: data.durationMinutes,
				serviceTypeId: data.serviceTypeId,
				status: "scheduled",
				valueBrl,
				createdBy: ctx.userId,
				updatedBy: ctx.userId
			})
			.returning();

		if (overlaps.length > 0 && data.allowOverlap) {
			await writeSessionAudit(db, {
				clinicId: ctx.clinic.id,
				sessionId: created.id,
				editedBy: ctx.userId,
				reason: `Override de sobreposição: ${data.overlapReason!.trim()}`,
				beforeState: { conflicts: overlaps },
				afterState: created
			});
		}

		const { syncSessionToGoogleCalendar } = await import(
			"@/lib/google-calendar/sync"
		);
		const googleSync = await syncSessionToGoogleCalendar(
			created.id,
			ctx.clinic.id,
			db
		);

		return NextResponse.json({ data: created, googleSync }, { status: 201 });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error(err);
		return NextResponse.json(
			{ error: "Falha ao criar sessão." },
			{ status: 500 }
		);
	}
}
