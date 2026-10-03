import { describe, expect, it } from "vitest";

import { resolveTargetCalendarId } from "./calendars";

describe("resolveTargetCalendarId", () => {
	it("prioriza agenda do tipo", () => {
		expect(
			resolveTargetCalendarId({
				serviceTypeCalendarId: "cal-domiciliar",
				connectionDefaultCalendarId: "primary"
			})
		).toBe("cal-domiciliar");
	});

	it("usa padrão da conexão quando tipo não tem mapa", () => {
		expect(
			resolveTargetCalendarId({
				serviceTypeCalendarId: null,
				connectionDefaultCalendarId: "cal-default"
			})
		).toBe("cal-default");
	});

	it("cai em primary como último recurso", () => {
		expect(
			resolveTargetCalendarId({
				serviceTypeCalendarId: "  ",
				connectionDefaultCalendarId: null
			})
		).toBe("primary");
	});
});
