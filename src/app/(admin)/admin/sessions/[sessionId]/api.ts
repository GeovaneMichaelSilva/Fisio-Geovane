import type { PatientOption, ServiceType, SessionDetail } from "./types";

export const fetchSession = async (id: string) => {
	const res = await fetch(`/api/admin/sessions/${id}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar sessão.");
	return json.data as SessionDetail;
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
