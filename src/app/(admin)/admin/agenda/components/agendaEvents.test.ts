import { describe, expect, it } from "vitest";

import { externalDtoToEvent } from "./agendaEvents";

describe("externalDtoToEvent all-day", () => {
	it("usa startDate/endDate civis (sem deslocar para sábado)", () => {
		const event = externalDtoToEvent({
			id: "1",
			googleCalendarId: "cal",
			googleEventId: "g1",
			summary: "VVVVVVVVVV",
			status: "confirmed",
			allDay: true,
			startDate: "2026-11-15",
			endDate: "2026-11-16",
			startAt: null,
			endAt: null,
			calendarLabel: "Adseleto"
		});

		expect(event?.allDay).toBe(true);
		expect(event?.start.getFullYear()).toBe(2026);
		expect(event?.start.getMonth()).toBe(10);
		expect(event?.start.getDate()).toBe(15);
		expect(event?.start.getHours()).toBe(0);
		expect(event?.end.getDate()).toBe(16);
		expect(event?.resource.scheduledDate).toBe("2026-11-15");
	});
});
