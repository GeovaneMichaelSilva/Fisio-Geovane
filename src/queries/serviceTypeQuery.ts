import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchApiData } from "@/lib/api/fetchJson";
import {
	type ServiceTypeFormParsed,
	type ServiceTypeFormValues
} from "@/lib/service-types/schema";

import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type ServiceType = {
	id: string;
	clinicId: string;
	name: string;
	slug: string;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
	isActive: boolean;
	sortOrder: number;
	googleCalendarId: string | null;
	createdAt: string;
	updatedAt: string;
};

export const serviceTypeQueryKeys = {
	root: () => ["service-types"] as const,
	list: () => [...serviceTypeQueryKeys.root(), "list"] as const
};

export const useServiceTypesQuery = (
	options?: Omit<UseQueryOptions<ServiceType[], Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: serviceTypeQueryKeys.list(),
		queryFn: () => fetchApiData<ServiceType[]>("/api/admin/service-types"),
		...options
	});
};

export const useSaveServiceTypeMutation = (
	options?: Omit<
		UseMutationOptions<
			ServiceType,
			Error,
			{ id: string | null; values: ServiceTypeFormParsed }
		>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};

	return useMutation({
		mutationKey: [...serviceTypeQueryKeys.root(), "save"],
		mutationFn: async ({ id, values }) => {
			if (id) {
				return fetchApiData<ServiceType>(`/api/admin/service-types/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(values)
				});
			}
			return fetchApiData<ServiceType>("/api/admin/service-types", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
		},
		onSuccess: async (saved, vars, onMutateResult, context) => {
			queryClient.setQueryData<ServiceType[]>(
				serviceTypeQueryKeys.list(),
				(old) => {
					if (!old) return [saved];
					const exists = old.some((row) => row.id === saved.id);
					if (exists) {
						return old.map((row) => (row.id === saved.id ? saved : row));
					}
					return [...old, saved].sort(
						(a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
					);
				}
			);
			await onSuccess?.(saved, vars, onMutateResult, context);
		},
		...rest
	});
};

export const useToggleServiceTypeMutation = (
	options?: Omit<
		UseMutationOptions<ServiceType, Error, ServiceType>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...rest } = options ?? {};

	return useMutation({
		...rest,
		mutationKey: [...serviceTypeQueryKeys.root(), "toggle"],
		mutationFn: (row) =>
			fetchApiData<ServiceType>(`/api/admin/service-types/${row.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: row.name,
					defaultDurationMinutes: row.defaultDurationMinutes,
					defaultValueBrl: Number(row.defaultValueBrl),
					isActive: !row.isActive,
					sortOrder: row.sortOrder
				} satisfies ServiceTypeFormValues)
			}),
		onMutate: async (row) => {
			await queryClient.cancelQueries({
				queryKey: serviceTypeQueryKeys.list()
			});
			const previous = queryClient.getQueryData<ServiceType[]>(
				serviceTypeQueryKeys.list()
			);
			queryClient.setQueryData<ServiceType[]>(
				serviceTypeQueryKeys.list(),
				(old) =>
					old?.map((item) =>
						item.id === row.id ? { ...item, isActive: !item.isActive } : item
					)
			);
			return { previous };
		},
		onError: async (err, vars, onMutateResult, context) => {
			if (onMutateResult?.previous) {
				queryClient.setQueryData(
					serviceTypeQueryKeys.list(),
					onMutateResult.previous
				);
			}
			await onError?.(err, vars, onMutateResult, context);
		},
		onSuccess: async (saved, vars, onMutateResult, context) => {
			queryClient.setQueryData<ServiceType[]>(
				serviceTypeQueryKeys.list(),
				(old) =>
					old?.map((item) => (item.id === saved.id ? saved : item)) ?? [saved]
			);
			await onSuccess?.(saved, vars, onMutateResult, context);
		}
	});
};
