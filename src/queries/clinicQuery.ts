import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchApiData } from "@/lib/api/fetchJson";
import { type ClinicUpdateParsed } from "@/lib/clinic/schema";

import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type Clinic = {
	id: string;
	ownerUserId: string;
	displayName: string;
	professionLabel: string;
	licenseNumber: string | null;
	timezone: string;
	defaultSessionDurationMinutes: number;
	createdAt: string;
	updatedAt: string;
};

export const clinicQueryKeys = {
	root: () => ["clinic"] as const
};

export const useClinicQuery = (
	options?: Omit<UseQueryOptions<Clinic, Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: clinicQueryKeys.root(),
		queryFn: () => fetchApiData<Clinic>("/api/admin/clinic"),
		...options
	});
};

export const useUpdateClinicMutation = (
	options?: Omit<
		UseMutationOptions<Clinic, Error, ClinicUpdateParsed>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};

	return useMutation({
		mutationKey: [...clinicQueryKeys.root(), "update"],
		mutationFn: (values) =>
			fetchApiData<Clinic>("/api/admin/clinic", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			}),
		onSuccess: async (updated, vars, onMutateResult, context) => {
			queryClient.setQueryData(clinicQueryKeys.root(), updated);
			await onSuccess?.(updated, vars, onMutateResult, context);
		},
		...rest
	});
};
