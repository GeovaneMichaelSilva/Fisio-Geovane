import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchApiData } from "@/lib/api/fetchJson";

import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type MeData = {
	userId: string;
	fullName: string | null;
	email: string | null;
	role: "owner" | "staff";
	clinicId: string;
	clinicName: string;
};

export const meQueryKeys = {
	root: () => ["me"] as const
};

export const useMeQuery = (
	options?: Omit<UseQueryOptions<MeData, Error>, "queryKey" | "queryFn">
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: meQueryKeys.root(),
		queryFn: () => fetchApiData<MeData>("/api/admin/me"),
		staleTime: 5 * 60_000,
		enabled: enabled ?? true,
		...rest
	});
};

type ChangePasswordVars = {
	currentPassword: string;
	password: string;
};

export const useChangePasswordMutation = (
	options?: Omit<
		UseMutationOptions<{ ok: true }, Error, ChangePasswordVars>,
		"mutationFn"
	>
) => {
	const { onSuccess, ...rest } = options ?? {};
	return useMutation({
		mutationKey: [...meQueryKeys.root(), "changePassword"],
		mutationFn: async (vars) => {
			await fetchApiData<{ ok: true }>("/api/admin/me/password", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(vars)
			});
			return { ok: true as const };
		},
		onSuccess: async (data, vars, onMutateResult, context) => {
			await onSuccess?.(data, vars, onMutateResult, context);
		},
		...rest
	});
};
