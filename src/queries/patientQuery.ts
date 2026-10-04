import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchApiData, fetchApiList } from "@/lib/api/fetchJson";
import type { PatientPdfInput } from "@/lib/pdf/patient-history";
import { type PatientFormParsed } from "@/lib/patients/schema";

import type { PaginationMeta } from "@/lib/pagination";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";

export type PatientListItem = {
	id: string;
	fullName: string;
	phone: string | null;
	cpf: string | null;
	preferredServiceTypeId: string;
	preferredServiceTypeName: string;
	archivedAt: string | null;
	updatedAt: string;
};

export type PatientDetail = {
	id: string;
	fullName: string;
	phone: string | null;
	cpf: string | null;
	birthDate: string | null;
	weightKg: string | null;
	heightCm: string | null;
	preferredServiceTypeId: string;
	preferredServiceTypeName: string;
	addressStreet: string | null;
	addressNumber: string | null;
	addressNeighborhood: string | null;
	addressCity: string | null;
	addressZip: string | null;
	notes: string | null;
	archivedAt: string | null;
	stats: {
		completedCount: number;
		pendingValueBrl: string;
	};
	sessions: Array<{
		id: string;
		scheduledDate: string;
		scheduledTime: string;
		status: string;
		valueBrl: string;
		paid: boolean;
		serviceTypeName: string;
	}>;
};

export type PatientListResult = {
	data: PatientListItem[];
	meta: PaginationMeta;
};

export const patientQueryKeys = {
	root: () => ["patients"] as const,
	lists: () => [...patientQueryKeys.root(), "list"] as const,
	list: (params: { q: string; archived: boolean; page: number }) =>
		[...patientQueryKeys.lists(), params] as const,
	options: (q: string) =>
		[...patientQueryKeys.root(), "options", { q }] as const,
	details: () => [...patientQueryKeys.root(), "detail"] as const,
	detail: (id: string) => [...patientQueryKeys.details(), id] as const
};

const patchPatientInLists = (
	queryClient: ReturnType<typeof useQueryClient>,
	patientId: string,
	patch: Partial<PatientListItem>
) => {
	queryClient.setQueriesData<PatientListResult>(
		{ queryKey: patientQueryKeys.lists() },
		(old) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.map((row) =>
					row.id === patientId ? { ...row, ...patch } : row
				)
			};
		}
	);
};

const removePatientFromLists = (
	queryClient: ReturnType<typeof useQueryClient>,
	patientId: string
) => {
	queryClient.setQueriesData<PatientListResult>(
		{ queryKey: patientQueryKeys.lists() },
		(old) => {
			if (!old) return old;
			const data = old.data.filter((row) => row.id !== patientId);
			if (data.length === old.data.length) return old;
			return {
				...old,
				data,
				meta: {
					...old.meta,
					total: Math.max(0, old.meta.total - 1)
				}
			};
		}
	);
};

export const usePatientsQuery = (
	params: { q: string; archived: boolean; page: number },
	options?: Omit<
		UseQueryOptions<PatientListResult, Error>,
		"queryKey" | "queryFn"
	>
) => {
	return useQuery({
		queryKey: patientQueryKeys.list(params),
		queryFn: async () => {
			const search = new URLSearchParams({
				page: String(params.page),
				pageSize: "20"
			});
			const term = params.q.trim();
			if (term) search.set("q", term);
			if (params.archived) search.set("archived", "1");
			return fetchApiList<PatientListItem[], PaginationMeta>(
				`/api/admin/patients?${search}`
			);
		},
		...options
	});
};

export const usePatientOptionsQuery = (
	q: string,
	options?: Omit<
		UseQueryOptions<PatientListItem[], Error>,
		"queryKey" | "queryFn"
	>
) => {
	return useQuery({
		queryKey: patientQueryKeys.options(q),
		queryFn: async () => {
			const search = new URLSearchParams({ page: "1", pageSize: "50" });
			if (q.trim()) search.set("q", q.trim());
			const result = await fetchApiList<PatientListItem[], PaginationMeta>(
				`/api/admin/patients?${search}`
			);
			return result.data;
		},
		...options
	});
};

export const usePatientQuery = (
	patientId: string,
	options?: Omit<UseQueryOptions<PatientDetail, Error>, "queryKey" | "queryFn">
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: patientQueryKeys.detail(patientId),
		queryFn: () =>
			fetchApiData<PatientDetail>(`/api/admin/patients/${patientId}`),
		enabled: Boolean(patientId) && (enabled ?? true),
		...rest
	});
};

export const useCreatePatientMutation = (
	options?: Omit<
		UseMutationOptions<{ id: string }, Error, PatientFormParsed>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};

	return useMutation({
		mutationKey: [...patientQueryKeys.root(), "create"],
		mutationFn: (values) =>
			fetchApiData<{ id: string }>("/api/admin/patients", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			}),
		onSuccess: async (created, vars, onMutateResult, context) => {
			// Lista paginada: invalidar para o novo item aparecer na ordem certa
			await queryClient.invalidateQueries({
				queryKey: patientQueryKeys.lists()
			});
			await queryClient.invalidateQueries({
				queryKey: [...patientQueryKeys.root(), "options"]
			});
			await onSuccess?.(created, vars, onMutateResult, context);
		},
		...rest
	});
};

export const useUpdatePatientMutation = (
	patientId: string,
	options?: Omit<
		UseMutationOptions<PatientDetail, Error, PatientFormParsed>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};

	return useMutation({
		mutationKey: [...patientQueryKeys.root(), "update", patientId],
		mutationFn: (values) =>
			fetchApiData<PatientDetail>(`/api/admin/patients/${patientId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			}),
		onSuccess: async (updated, vars, onMutateResult, context) => {
			const prev = queryClient.getQueryData<PatientDetail>(
				patientQueryKeys.detail(patientId)
			);
			const nextDetail: PatientDetail = {
				...(prev ?? ({} as PatientDetail)),
				...updated,
				preferredServiceTypeName:
					updated.preferredServiceTypeName ||
					prev?.preferredServiceTypeName ||
					"",
				stats: prev?.stats ?? { completedCount: 0, pendingValueBrl: "0" },
				sessions: prev?.sessions ?? []
			};
			queryClient.setQueryData(patientQueryKeys.detail(patientId), nextDetail);
			patchPatientInLists(queryClient, patientId, {
				fullName: nextDetail.fullName,
				phone: nextDetail.phone,
				cpf: nextDetail.cpf,
				preferredServiceTypeId: nextDetail.preferredServiceTypeId,
				preferredServiceTypeName: nextDetail.preferredServiceTypeName,
				archivedAt: nextDetail.archivedAt,
				updatedAt: (updated as { updatedAt?: string }).updatedAt
			});
			await queryClient.invalidateQueries({
				queryKey: [...patientQueryKeys.root(), "options"]
			});
			await onSuccess?.(updated, vars, onMutateResult, context);
		},
		...rest
	});
};

export const useArchivePatientMutation = (
	patientId: string,
	options?: Omit<
		UseMutationOptions<
			{ id: string; archivedAt: string | null },
			Error,
			boolean
		>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...rest } = options ?? {};

	return useMutation({
		...rest,
		mutationKey: [...patientQueryKeys.root(), "archive", patientId],
		mutationFn: (archived) =>
			fetchApiData<{ id: string; archivedAt: string | null }>(
				`/api/admin/patients/${patientId}/archive`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ archived })
				}
			),
		onMutate: async (archived) => {
			await queryClient.cancelQueries({
				queryKey: patientQueryKeys.detail(patientId)
			});
			const previous = queryClient.getQueryData<PatientDetail>(
				patientQueryKeys.detail(patientId)
			);
			if (previous) {
				queryClient.setQueryData<PatientDetail>(
					patientQueryKeys.detail(patientId),
					{
						...previous,
						archivedAt: archived ? new Date().toISOString() : null
					}
				);
			}
			// Sai da lista atual (ativo ↔ arquivado)
			removePatientFromLists(queryClient, patientId);
			return { previous };
		},
		onError: async (err, vars, onMutateResult, context) => {
			if (onMutateResult?.previous) {
				queryClient.setQueryData(
					patientQueryKeys.detail(patientId),
					onMutateResult.previous
				);
			}
			await queryClient.invalidateQueries({
				queryKey: patientQueryKeys.lists()
			});
			await onError?.(err, vars, onMutateResult, context);
		},
		onSuccess: async (data, archived, onMutateResult, context) => {
			const prev = queryClient.getQueryData<PatientDetail>(
				patientQueryKeys.detail(patientId)
			);
			if (prev) {
				queryClient.setQueryData<PatientDetail>(
					patientQueryKeys.detail(patientId),
					{ ...prev, archivedAt: data.archivedAt }
				);
			}
			await queryClient.invalidateQueries({
				queryKey: patientQueryKeys.lists()
			});
			await queryClient.invalidateQueries({
				queryKey: [...patientQueryKeys.root(), "options"]
			});
			await onSuccess?.(data, archived, onMutateResult, context);
		}
	});
};

export const usePatientPdfMutation = (
	patientId: string,
	options?: Omit<UseMutationOptions<PatientPdfInput, Error, void>, "mutationFn">
) => {
	const { onSuccess, ...rest } = options ?? {};
	return useMutation({
		mutationKey: [...patientQueryKeys.root(), "pdf", patientId],
		mutationFn: () =>
			fetchApiData<PatientPdfInput>(`/api/admin/patients/${patientId}/pdf`),
		onSuccess: async (data, vars, onMutateResult, context) => {
			await onSuccess?.(data, vars, onMutateResult, context);
		},
		...rest
	});
};
