import { toast } from "sonner";

import type {
	AgendaSession,
	Clinic,
	GoogleStatus,
	GoogleSyncResult,
	PatientOption,
	ServiceType
} from "./types";

export const fetchWeek = async (from: string, to: string) => {
	const res = await fetch(`/api/admin/sessions?from=${from}&to=${to}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar agenda.");
	return json.data as AgendaSession[];
};

export const fetchPatients = async (q: string) => {
	const params = new URLSearchParams({ pageSize: "50" });
	if (q.trim()) params.set("q", q.trim());
	const res = await fetch(`/api/admin/patients?${params}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar pacientes.");
	return json.data as PatientOption[];
};

export const fetchServiceTypes = async () => {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data as ServiceType[];
};

export const fetchClinic = async () => {
	const res = await fetch("/api/admin/clinic");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar clínica.");
	return json.data as Clinic;
};

export const fetchGoogleStatus = async () => {
	const res = await fetch("/api/admin/integrations/google-calendar");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar Google.");
	return json.data as GoogleStatus;
};

export const notifyGoogleSync = (googleSync?: GoogleSyncResult) => {
	if (!googleSync) return;
	if (googleSync.status === "error") {
		toast.warning(
			`Agendamento salvo, mas o Google Agenda falhou: ${googleSync.message}`
		);
	}
};

export type RescheduleSessionInput = {
	sessionId: string;
	scheduledDate: string;
	scheduledTime: string;
	durationMinutes: number;
	allowOverlap?: boolean;
	overlapReason?: string;
};

export const rescheduleSession = async (input: RescheduleSessionInput) => {
	const res = await fetch(`/api/admin/sessions/${input.sessionId}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			scheduledDate: input.scheduledDate,
			scheduledTime: input.scheduledTime,
			durationMinutes: input.durationMinutes,
			allowOverlap: input.allowOverlap ?? false,
			overlapReason: input.overlapReason
		})
	});
	const json = await res.json();
	if (res.status === 409 && json.error === "overlap") {
		return {
			overlap: true as const,
			conflicts: (json.conflicts ?? []) as Array<{
				id: string;
				patientName?: string;
				scheduledTime: string;
				durationMinutes: number;
				status?: string;
			}>
		};
	}
	if (!res.ok) {
		throw new Error(json.error || json.message || "Falha ao remarcar.");
	}
	return {
		overlap: false as const,
		googleSync: json.googleSync as GoogleSyncResult | undefined
	};
};

export const statusVariant = (status: string) => {
	if (status === "completed") return "default" as const;
	if (status === "canceled" || status === "no_show") return "secondary" as const;
	return "outline" as const;
};
