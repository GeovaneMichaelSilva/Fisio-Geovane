import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchApiData, fetchApiOk } from "@/lib/api/fetchJson";
import { type TeamMemberCreateParsed } from "@/lib/team/schema";

import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type TeamMember = {
	userId: string;
	fullName: string;
	email: string;
	role: "owner" | "staff";
	createdAt: string;
	isSelf: boolean;
};

export const teamQueryKeys = {
	root: () => ["team"] as const,
	list: () => [...teamQueryKeys.root(), "list"] as const
};

export const useTeamQuery = (
	options?: Omit<UseQueryOptions<TeamMember[], Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: teamQueryKeys.list(),
		queryFn: () => fetchApiData<TeamMember[]>("/api/admin/team"),
		...options
	});
};

export const useCreateTeamMemberMutation = (
	options?: Omit<
		UseMutationOptions<TeamMember, Error, TeamMemberCreateParsed>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};

	return useMutation({
		mutationKey: [...teamQueryKeys.root(), "create"],
		mutationFn: (values) =>
			fetchApiData<TeamMember>("/api/admin/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			}),
		onSuccess: async (created, vars, onMutateResult, context) => {
			queryClient.setQueryData<TeamMember[]>(teamQueryKeys.list(), (old) => {
				if (!old) return [created];
				if (old.some((m) => m.userId === created.userId)) {
					return old.map((m) => (m.userId === created.userId ? created : m));
				}
				return [...old, created];
			});
			await onSuccess?.(created, vars, onMutateResult, context);
		},
		...rest
	});
};

export const useRemoveTeamMemberMutation = (
	options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">
) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...rest } = options ?? {};

	return useMutation({
		...rest,
		mutationKey: [...teamQueryKeys.root(), "remove"],
		mutationFn: async (userId) => {
			await fetchApiOk(`/api/admin/team/${userId}`, { method: "DELETE" });
		},
		onMutate: async (userId) => {
			await queryClient.cancelQueries({ queryKey: teamQueryKeys.list() });
			const previous = queryClient.getQueryData<TeamMember[]>(
				teamQueryKeys.list()
			);
			queryClient.setQueryData<TeamMember[]>(teamQueryKeys.list(), (old) =>
				old?.filter((m) => m.userId !== userId)
			);
			return { previous };
		},
		onError: async (err, vars, onMutateResult, context) => {
			if (onMutateResult?.previous) {
				queryClient.setQueryData(teamQueryKeys.list(), onMutateResult.previous);
			}
			await onError?.(err, vars, onMutateResult, context);
		},
		onSuccess: async (data, userId, onMutateResult, context) => {
			queryClient.setQueryData<TeamMember[]>(teamQueryKeys.list(), (old) =>
				old?.filter((m) => m.userId !== userId)
			);
			await onSuccess?.(data, userId, onMutateResult, context);
		}
	});
};
