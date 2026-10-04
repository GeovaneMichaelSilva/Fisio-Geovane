export type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
};

export type PatientOption = {
	id: string;
	fullName: string;
};

export type PreviousClinical = {
	id: string;
	scheduledDate: string;
	scheduledTime: string;
	status: string;
	assessment: string | null;
	evolution: string | null;
	activities: string | null;
	serviceTypeName: string;
};

export type SessionDetail = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	durationMinutes: number;
	serviceTypeId: string;
	serviceTypeName: string;
	status: "scheduled" | "completed" | "canceled" | "no_show";
	valueBrl: string;
	paid: boolean;
	paidAt: string | null;
	invoiceIssued: boolean;
	assessment: string | null;
	evolution: string | null;
	activities: string | null;
	googleEventId?: string | null;
	audits: Array<{ id: string; editedAt: string; reason: string }>;
	previousClinical: PreviousClinical[];
};

export type SessionMode = "schedule" | "clinical" | "finance";
