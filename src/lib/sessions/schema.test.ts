import { describe, expect, it } from "vitest";

import { sessionCreateSchema } from "./schema";

const base = {
	patientId: "11111111-1111-4111-8111-111111111111",
	scheduledDate: "2026-10-06",
	scheduledTime: "09:00",
	durationMinutes: 50,
	serviceTypeId: "22222222-2222-4222-8222-222222222222"
};

describe("sessionCreateSchema", () => {
	it("aceita criação sem overlap", () => {
		expect(sessionCreateSchema.safeParse(base).success).toBe(true);
	});

	it("exige motivo quando allowOverlap é true", () => {
		expect(
			sessionCreateSchema.safeParse({
				...base,
				allowOverlap: true
			}).success
		).toBe(false);

		expect(
			sessionCreateSchema.safeParse({
				...base,
				allowOverlap: true,
				overlapReason: "Urgência clínica"
			}).success
		).toBe(true);
	});
});
