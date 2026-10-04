"use client";

import { useMeQuery } from "@/queries/meQuery";

export type { MeData } from "@/queries/meQuery";

/**
 * Papel do usuário na clínica atual.
 */
export const useClinicRole = () => {
	const query = useMeQuery();

	return {
		role: query.data?.role,
		isOwner: query.data?.role === "owner",
		isStaff: query.data?.role === "staff",
		me: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch
	};
};
