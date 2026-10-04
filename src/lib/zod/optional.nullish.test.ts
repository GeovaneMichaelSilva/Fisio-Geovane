import { describe, expect, it } from "vitest";

import { clinicUpdateSchema } from "@/lib/clinic/schema";
import { financeQuerySchema } from "@/lib/finance/schema";
import { patientFormSchema } from "@/lib/patients/schema";
import {
	sessionCreateSchema,
	sessionUpdateSchema
} from "@/lib/sessions/schema";

describe("optional null inputs across API schemas", () => {
	it("clinic: licenseNumber aceita null", () => {
		const r = clinicUpdateSchema.safeParse({
			displayName: "Clínica",
			professionLabel: "Fisioterapeuta",
			licenseNumber: null,
			timezone: "America/Sao_Paulo",
			defaultSessionDurationMinutes: 50
		});
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.licenseNumber).toBeNull();
	});

	it("patient: opcionais aceitam null", () => {
		const r = patientFormSchema.safeParse({
			fullName: "Roan",
			phone: null,
			cpf: null,
			birthDate: null,
			weightKg: null,
			heightCm: null,
			preferredServiceTypeId: "1dfaa3d1-0791-437f-8614-853542afadbc",
			addressStreet: null,
			addressNumber: null,
			addressNeighborhood: null,
			addressCity: null,
			addressZip: null,
			notes: null
		});
		expect(r.success).toBe(true);
	});

	it("session create: overlapReason null quando sem override", () => {
		const r = sessionCreateSchema.safeParse({
			patientId: "11111111-1111-4111-8111-111111111111",
			scheduledDate: "2026-10-06",
			scheduledTime: "09:00",
			durationMinutes: 50,
			serviceTypeId: "22222222-2222-4222-8222-222222222222",
			allowOverlap: false,
			overlapReason: null
		});
		expect(r.success).toBe(true);
	});

	it("session update: clinical null limpa; omitido não vira null", () => {
		const withNull = sessionUpdateSchema.safeParse({
			reason: "Ajuste",
			assessment: null,
			evolution: null,
			activities: null,
			paid: false,
			paidAt: null
		});
		expect(withNull.success).toBe(true);
		if (withNull.success) {
			expect(withNull.data.assessment).toBeNull();
			expect(withNull.data.paidAt).toBeNull();
		}

		const omitted = sessionUpdateSchema.safeParse({
			reason: "Só motivo"
		});
		expect(omitted.success).toBe(true);
		if (omitted.success) {
			expect(omitted.data.assessment).toBeUndefined();
			expect(omitted.data.paidAt).toBeUndefined();
			expect(omitted.data.evolution).toBeUndefined();
		}
	});

	it("finance query: from/to null", () => {
		const r = financeQuerySchema.safeParse({ from: null, to: null });
		expect(r.success).toBe(true);
	});
});
