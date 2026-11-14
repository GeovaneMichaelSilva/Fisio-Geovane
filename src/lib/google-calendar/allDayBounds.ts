const CIVIL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valida e normaliza YYYY-MM-DD. */
export const parseCivilDate = (value: string): string | null => {
	const match = CIVIL_DATE_RE.exec(value.trim());
	if (!match) return null;
	const y = Number(match[1]);
	const m = Number(match[2]);
	const d = Number(match[3]);
	if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
	const probe = new Date(Date.UTC(y, m - 1, d));
	if (
		probe.getUTCFullYear() !== y ||
		probe.getUTCMonth() !== m - 1 ||
		probe.getUTCDate() !== d
	) {
		return null;
	}
	return `${match[1]}-${match[2]}-${match[3]}`;
};

/**
 * Converte YYYY-MM-DD em Date local à meia-noite (parede do browser/RBC).
 */
export const civilDateToLocalDate = (yyyyMmDd: string): Date | null => {
	const parsed = parseCivilDate(yyyyMmDd);
	if (!parsed) return null;
	const [y, m, d] = parsed.split("-").map(Number);
	return new Date(y!, m! - 1, d!, 0, 0, 0, 0);
};

/**
 * Intervalo all-day local; `endDate` é exclusivo (Google / RBC).
 */
export const civilDateRangeToLocalDates = (
	startDate: string,
	endDate: string
) => {
	const start = civilDateToLocalDate(startDate);
	const end = civilDateToLocalDate(endDate);
	if (!start || !end) return null;
	return { start, end };
};
