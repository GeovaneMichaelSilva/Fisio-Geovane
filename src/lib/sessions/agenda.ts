/**
 * Utilitários de agenda: semana e sobreposição de horários.
 */

export type SessionInterval = {
	id?: string;
	scheduledDate: string; // YYYY-MM-DD
	scheduledTime: string; // HH:MM or HH:MM:SS
	durationMinutes: number;
	status: string;
};

/** Segunda-feira da semana que contém `date` (local). */
export const startOfWeekMonday = (date: Date): Date => {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = d.getDay(); // 0=dom
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	return d;
}

export const addDays = (date: Date, days: number): Date => {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export const toDateString = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export const parseDateString = (value: string): Date => {
	const [y, m, d] = value.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export const formatWeekLabel = (monday: Date): string => {
	const sunday = addDays(monday, 6);
	const fmt = (d: Date) =>
		d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
	return `${fmt(monday)} – ${fmt(sunday)}`;
};

/** Primeiro dia do mês (local). */
export const startOfMonth = (date: Date): Date => {
	return new Date(date.getFullYear(), date.getMonth(), 1);
};

/** Rótulo do mês (ex.: “outubro de 2026”). */
export const formatMonthLabel = (date: Date): string => {
	const label = date.toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric"
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
};

/**
 * Grade do mês (6 semanas × 7 dias), começando na segunda da semana do dia 1.
 */
export const buildMonthGrid = (monthAnchor: Date): Date[] => {
	const first = startOfMonth(monthAnchor);
	const gridStart = startOfWeekMonday(first);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

/** Avança/retrocede N meses a partir do 1º dia do mês de referência. */
export const addMonths = (date: Date, months: number): Date => {
	const d = startOfMonth(date);
	d.setMonth(d.getMonth() + months);
	return d;
};

export const timeToMinutes = (time: string): number => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

export const minutesToTime = (total: number): string => {
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const normalizeTime = (time: string): string => {
	const parts = time.split(":");
	const h = parts[0]?.padStart(2, "0") ?? "00";
	const m = parts[1]?.padStart(2, "0") ?? "00";
	const s = parts[2]?.padStart(2, "0") ?? "00";
	return `${h}:${m}:${s}`;
}

const NON_CONFLICTING = new Set(["canceled", "no_show"]);

export const intervalsOverlap = (a: SessionInterval, b: SessionInterval): boolean => {
	if (a.scheduledDate !== b.scheduledDate) return false;
	if (NON_CONFLICTING.has(a.status) || NON_CONFLICTING.has(b.status)) {
		return false;
	}
	const aStart = timeToMinutes(a.scheduledTime);
	const aEnd = aStart + a.durationMinutes;
	const bStart = timeToMinutes(b.scheduledTime);
	const bEnd = bStart + b.durationMinutes;
	return aStart < bEnd && bStart < aEnd;
}

/**
 * Retorna sessões do mesmo dia que conflitam com o intervalo proposto.
 */
export const findOverlaps = (
	candidate: SessionInterval,
	existing: SessionInterval[]
): SessionInterval[] => {
	return existing.filter((row) => {
		if (candidate.id && row.id === candidate.id) return false;
		return intervalsOverlap(candidate, row);
	});
}

export const WEEKDAY_LABELS = [
	"Segunda",
	"Terça",
	"Quarta",
	"Quinta",
	"Sexta",
	"Sábado",
	"Domingo"
] as const;

export const STATUS_LABEL: Record<string, string> = {
	scheduled: "Agendado",
	completed: "Realizado",
	canceled: "Cancelado",
	no_show: "Faltou"
};
