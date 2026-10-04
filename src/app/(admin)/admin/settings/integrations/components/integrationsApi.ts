export type GoogleStatus = {
	configured: boolean;
	connected: boolean;
	googleAccountEmail: string | null;
	connectedAt: string | null;
	calendarId: string | null;
};

export type DriveStatus = {
	configured: boolean;
	connected: boolean;
	googleAccountEmail: string | null;
	connectedAt: string | null;
	retentionDays: number;
	lastRun: {
		status: "success" | "error";
		trigger: string;
		fileName: string | null;
		bytes: number | null;
		errorMessage: string | null;
		deletedOldFiles: number;
		createdAt: string;
	} | null;
};

export type GoogleCalendar = {
	id: string;
	summary: string;
	primary: boolean;
};

export type IntegrationServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	googleCalendarId: string | null;
};

export const fetchGoogleStatus = async (): Promise<GoogleStatus> => {
	const res = await fetch("/api/admin/integrations/google-calendar");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar status.");
	return json.data;
};

export const fetchDriveStatus = async (): Promise<DriveStatus> => {
	const res = await fetch("/api/admin/integrations/google-drive");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar status Drive.");
	return json.data;
};

export const fetchCalendars = async (): Promise<GoogleCalendar[]> => {
	const res = await fetch("/api/admin/integrations/google-calendar/calendars");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao listar agendas.");
	return json.data;
};

export const fetchIntegrationServiceTypes = async (): Promise<
	IntegrationServiceType[]
> => {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data;
};

export const runCalendarRestore = async () => {
	const res = await fetch("/api/admin/integrations/google-calendar/restore", {
		method: "POST"
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao restaurar.");
	return json.data as {
		total: number;
		synced: number;
		errors: number;
		skipped: number;
	};
};
