import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { dateFnsLocalizer } from "react-big-calendar";

const locales = {
	"pt-BR": ptBR
};

/**
 * Localizer pt-BR com semana começando na segunda.
 */
export const agendaLocalizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
	getDay,
	locales
});

export const agendaMessages = {
	date: "Data",
	time: "Hora",
	event: "Atendimento",
	allDay: "Dia inteiro",
	week: "Semana",
	work_week: "Dias úteis",
	day: "Dia",
	month: "Mês",
	previous: "Anterior",
	next: "Próximo",
	yesterday: "Ontem",
	tomorrow: "Amanhã",
	today: "Hoje",
	agenda: "Lista",
	noEventsInRange: "Sem atendimentos neste período.",
	showMore: (total: number) => `+${total} mais`
};
