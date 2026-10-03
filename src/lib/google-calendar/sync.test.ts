import { describe, expect, it } from "vitest";

import { addMinutesWallClock } from "./sync";

describe("addMinutesWallClock", () => {
	it("soma duração no mesmo dia", () => {
		expect(addMinutesWallClock("2026-10-06", "09:00", 50)).toEqual({
			date: "2026-10-06",
			time: "09:50:00"
		});
	});

	it("cruza meia-noite", () => {
		expect(addMinutesWallClock("2026-10-06", "23:40", 50)).toEqual({
			date: "2026-10-07",
			time: "00:30:00"
		});
	});
});
