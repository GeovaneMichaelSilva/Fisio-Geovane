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
