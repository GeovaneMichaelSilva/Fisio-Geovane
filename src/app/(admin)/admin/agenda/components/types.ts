export type AgendaSession = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	durationMinutes: number;
	serviceTypeId: string;
	serviceTypeName: string;
	status: string;
	valueBrl: string;
	googleEventId?: string | null;
	kind?: "session";
};

/** Evento de agenda externa (overlay Google) — não é sessão clínica. */
export type AgendaExternalEvent = {
	kind: "external";
	id: string;
	patientName: string;
	serviceTypeName: string;
	scheduledDate: string;
	scheduledTime: string;
	durationMinutes: number;
	status: "external";
	googleCalendarId: string;
	allDay?: boolean;
};

export type AgendaEventResource = AgendaSession | AgendaExternalEvent;

export const isExternalAgendaEvent = (
	resource: AgendaEventResource
): resource is AgendaExternalEvent => {
	return resource.kind === "external";
};

export type PatientOption = {
	id: string;
	fullName: string;
	preferredServiceTypeId: string;
};

export type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
};

export type Clinic = {
	defaultSessionDurationMinutes: number;
};

export type GoogleStatus = {
	configured: boolean;
	connected: boolean;
};

export type GoogleSyncResult =
	| { status: "skipped" }
	| { status: "synced"; action: "create" | "update" | "delete" }
	| { status: "error"; message: string };
