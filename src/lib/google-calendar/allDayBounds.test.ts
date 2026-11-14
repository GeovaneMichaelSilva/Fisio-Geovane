import { describe, expect, it } from "vitest";

import {
	civilDateRangeToLocalDates,
	civilDateToLocalDate,
	parseCivilDate
} from "./allDayBounds";

describe("parseCivilDate", () => {
	it("aceita YYYY-MM-DD válido", () => {
		expect(parseCivilDate("2026-11-15")).toBe("2026-11-15");
	});

	it("rejeita data impossível", () => {
		expect(parseCivilDate("2026-02-31")).toBeNull();
	});
});

describe("civilDateToLocalDate", () => {
	it("cria meia-noite local no dia civil", () => {
		const d = civilDateToLocalDate("2026-11-15");
		expect(d?.getFullYear()).toBe(2026);
		expect(d?.getMonth()).toBe(10);
		expect(d?.getDate()).toBe(15);
		expect(d?.getHours()).toBe(0);
	});
});

describe("civilDateRangeToLocalDates", () => {
	it("end exclusivo no dia seguinte", () => {
		const range = civilDateRangeToLocalDates("2026-11-15", "2026-11-16");
		expect(range?.start.getDate()).toBe(15);
		expect(range?.end.getDate()).toBe(16);
	});
});
