import { Views, type View } from "react-big-calendar";

export const AGENDA_VIEW_STORAGE_KEY = "fisio.agenda.view";

const VALID_VIEWS = new Set<string>([Views.WEEK, Views.MONTH, Views.DAY]);

export const parseAgendaView = (raw: unknown): View | null => {
	if (typeof raw !== "string") return null;
	if (!VALID_VIEWS.has(raw)) return null;
	return raw as View;
};
