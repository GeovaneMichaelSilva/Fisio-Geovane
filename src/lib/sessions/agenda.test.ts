import { describe, expect, it } from "vitest";

import {
	buildMonthGrid,
	findOverlaps,
	formatMonthLabel,
	intervalsOverlap,
	normalizeTime,
	startOfMonth,
	startOfWeekMonday,
	startOfWeekSunday,
	toDateString,
	type SessionInterval
} from "./agenda";

function session(
	partial: Partial<SessionInterval> & Pick<SessionInterval, "scheduledTime">
): SessionInterval {
	return {
		id: partial.id,
		scheduledDate: partial.scheduledDate ?? "2026-10-06",
		scheduledTime: partial.scheduledTime,
		durationMinutes: partial.durationMinutes ?? 50,
		status: partial.status ?? "scheduled"
	};
}

describe("normalizeTime", () => {
	it("normaliza HH:MM para HH:MM:SS", () => {
		expect(normalizeTime("9:05")).toBe("09:05:00");
		expect(normalizeTime("09:05")).toBe("09:05:00");
	});
});

describe("startOfWeekSunday", () => {
	it("volta para domingo da semana", () => {
		// 2026-10-07 é quarta → domingo 04/10
		const sunday = startOfWeekSunday(new Date(2026, 9, 7));
		expect(toDateString(sunday)).toBe("2026-10-04");
	});

	it("domingo é o próprio início da semana", () => {
		const sunday = startOfWeekSunday(new Date(2026, 9, 11)); // domingo
		expect(toDateString(sunday)).toBe("2026-10-11");
	});
});

describe("startOfWeekMonday", () => {
	it("volta para segunda da semana", () => {
		const monday = startOfWeekMonday(new Date(2026, 9, 7));
		expect(toDateString(monday)).toBe("2026-10-05");
	});
});

describe("month helpers", () => {
	it("startOfMonth volta para o dia 1", () => {
		expect(toDateString(startOfMonth(new Date(2026, 9, 15)))).toBe(
			"2026-10-01"
		);
	});

	it("buildMonthGrid começa no domingo da semana do dia 1", () => {
		// Out/2026 começa na quinta → grade inicia em 27/09 (domingo)
		const grid = buildMonthGrid(new Date(2026, 9, 1));
		expect(grid).toHaveLength(42);
		expect(toDateString(grid[0]!)).toBe("2026-09-27");
		expect(toDateString(grid[41]!)).toBe("2026-11-07");
	});

	it("formatMonthLabel capitaliza o mês", () => {
		expect(formatMonthLabel(new Date(2026, 9, 1))).toMatch(/^Outubro/);
	});
});

describe("intervalsOverlap", () => {
	it("detecta sobreposição parcial", () => {
		expect(
			intervalsOverlap(
				session({ scheduledTime: "09:00" }),
				session({ scheduledTime: "09:30" })
			)
		).toBe(true);
	});

	it("não conflita quando um termina exatamente quando o outro começa", () => {
		expect(
			intervalsOverlap(
				session({ scheduledTime: "09:00", durationMinutes: 50 }),
				session({ scheduledTime: "09:50", durationMinutes: 50 })
			)
		).toBe(false);
	});

	it("ignora cancelado e falta", () => {
		expect(
			intervalsOverlap(
				session({ scheduledTime: "09:00" }),
				session({ scheduledTime: "09:00", status: "canceled" })
			)
		).toBe(false);
		expect(
			intervalsOverlap(
				session({ scheduledTime: "09:00" }),
				session({ scheduledTime: "09:00", status: "no_show" })
			)
		).toBe(false);
	});

	it("não conflita em datas diferentes", () => {
		expect(
			intervalsOverlap(
				session({ scheduledDate: "2026-10-06", scheduledTime: "09:00" }),
				session({ scheduledDate: "2026-10-07", scheduledTime: "09:00" })
			)
		).toBe(false);
	});
});

describe("findOverlaps", () => {
	it("exclui a própria sessão pelo id", () => {
		const existing = [
			session({ id: "a", scheduledTime: "09:00" }),
			session({ id: "b", scheduledTime: "10:00" })
		];
		const overlaps = findOverlaps(
			session({ id: "a", scheduledTime: "09:10" }),
			existing
		);
		expect(overlaps.map((o) => o.id)).toEqual([]);
	});

	it("retorna conflitos com outras sessões", () => {
		const existing = [
			session({ id: "a", scheduledTime: "09:00" }),
			session({ id: "b", scheduledTime: "11:00" })
		];
		const overlaps = findOverlaps(
			session({ id: "new", scheduledTime: "09:20" }),
			existing
		);
		expect(overlaps.map((o) => o.id)).toEqual(["a"]);
	});
});
