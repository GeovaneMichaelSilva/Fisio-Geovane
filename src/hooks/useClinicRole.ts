"use client";

import { useQuery } from "@tanstack/react-query";

type MeData = {
	userId: string;
	role: "owner" | "staff";
	clinicId: string;
	clinicName: string;
};

async function fetchMe() {
	const res = await fetch("/api/admin/me");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar perfil.");
	return json.data as MeData;
}

/**
 * Papel do usuário na clínica atual.
 */
export function useClinicRole() {
	const query = useQuery({
		queryKey: ["me"],
		queryFn: fetchMe,
		staleTime: 5 * 60_000
	});

	return {
		role: query.data?.role,
		isOwner: query.data?.role === "owner",
		isStaff: query.data?.role === "staff",
		me: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch
	};
}
