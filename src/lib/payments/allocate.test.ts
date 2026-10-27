import { describe, expect, it } from "vitest";

import {
	allocateFifo,
	assertPaymentWithinPending,
	assertRefundWithinRefundable,
	deallocateLifo,
	splitRefundAcrossPayments
} from "./allocate";
import {
	effectiveAmountPaidCents,
	fromCents,
	remainingCents,
	sessionPaymentStatus,
	toCents
} from "./money";

describe("toCents / fromCents", () => {
	it("arredonda centavos corretamente", () => {
		expect(toCents("10.10")).toBe(1010);
		expect(toCents(70)).toBe(7000);
		expect(fromCents(7000)).toBe("70.00");
		expect(fromCents(1)).toBe("0.01");
	});
});

describe("legacy paid safety net", () => {
	it("trata paid=true como quitado mesmo com amount_paid=0", () => {
		expect(
			remainingCents({ valueBrl: "100", amountPaidBrl: "0", paid: true })
		).toBe(0);
		expect(
			effectiveAmountPaidCents({
				valueBrl: "100",
				amountPaidBrl: "0",
				paid: true
			})
		).toBe(10000);
		expect(
			sessionPaymentStatus({
				valueBrl: "100",
				amountPaidBrl: "0",
				paid: true
			})
		).toBe("paid");
	});

	it("reconhece parcial", () => {
		expect(
			sessionPaymentStatus({
				valueBrl: "100",
				amountPaidBrl: "30",
				paid: false
			})
		).toBe("partial");
		expect(
			remainingCents({ valueBrl: "100", amountPaidBrl: "30", paid: false })
		).toBe(7000);
	});
});

describe("allocateFifo", () => {
	it("quita sessões antigas primeiro", () => {
		const plan = allocateFifo(
			[
				{ id: "a", remainingCents: 5000 },
				{ id: "b", remainingCents: 10000 },
				{ id: "c", remainingCents: 8000 }
			],
			7000
		);
		expect(plan).toEqual([
			{ sessionId: "a", amountCents: 5000, amountBrl: "50.00" },
			{ sessionId: "b", amountCents: 2000, amountBrl: "20.00" }
		]);
	});

	it("rejeita valor acima do pendente", () => {
		expect(() =>
			allocateFifo([{ id: "a", remainingCents: 1000 }], 1001)
		).toThrow("AMOUNT_EXCEEDS_PENDING");
	});

	it("assertPaymentWithinPending valida limites", () => {
		expect(assertPaymentWithinPending(50, 5000)).toBe(5000);
		expect(() => assertPaymentWithinPending(0, 100)).toThrow("AMOUNT_INVALID");
		expect(() => assertPaymentWithinPending(60, 5000)).toThrow(
			"AMOUNT_EXCEEDS_PENDING"
		);
	});
});

describe("deallocateLifo", () => {
	it("desfaz a alocação mais recente primeiro", () => {
		const plan = deallocateLifo(
			[
				{ sessionId: "a", remainingCents: 5000 },
				{ sessionId: "b", remainingCents: 10000 },
				{ sessionId: "c", remainingCents: 8000 }
			],
			9000
		);
		expect(plan).toEqual([
			{ sessionId: "c", amountCents: 8000, amountBrl: "80.00" },
			{ sessionId: "b", amountCents: 1000, amountBrl: "10.00" }
		]);
	});

	it("estorna o pagamento inteiro", () => {
		const plan = deallocateLifo(
			[
				{ sessionId: "a", remainingCents: 5000 },
				{ sessionId: "b", remainingCents: 2000 }
			],
			7000
		);
		expect(plan).toEqual([
			{ sessionId: "b", amountCents: 2000, amountBrl: "20.00" },
			{ sessionId: "a", amountCents: 5000, amountBrl: "50.00" }
		]);
	});

	it("rejeita valor acima do estornável", () => {
		expect(() =>
			deallocateLifo([{ sessionId: "a", remainingCents: 1000 }], 1001)
		).toThrow("AMOUNT_EXCEEDS_REFUNDABLE");
	});

	it("assertRefundWithinRefundable valida limites", () => {
		expect(assertRefundWithinRefundable(30, 3000)).toBe(3000);
		expect(() => assertRefundWithinRefundable(0, 100)).toThrow("AMOUNT_INVALID");
		expect(() => assertRefundWithinRefundable(40, 3000)).toThrow(
			"AMOUNT_EXCEEDS_REFUNDABLE"
		);
	});
});

describe("splitRefundAcrossPayments", () => {
	it("consome baixas da mais recente para a mais antiga", () => {
		const plan = splitRefundAcrossPayments(
			[
				{ id: "p3", refundableCents: 1000 },
				{ id: "p2", refundableCents: 1000 },
				{ id: "p1", refundableCents: 1000 }
			],
			2500
		);
		expect(plan).toEqual([
			{ paymentId: "p3", amountCents: 1000, amountBrl: "10.00" },
			{ paymentId: "p2", amountCents: 1000, amountBrl: "10.00" },
			{ paymentId: "p1", amountCents: 500, amountBrl: "5.00" }
		]);
	});

	it("rejeita acima do total estornável", () => {
		expect(() =>
			splitRefundAcrossPayments([{ id: "p1", refundableCents: 1000 }], 1001)
		).toThrow("AMOUNT_EXCEEDS_REFUNDABLE");
	});
});
