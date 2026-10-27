import { useQuery } from "@tanstack/react-query";

import type { PaginationMeta } from "@/lib/pagination";
import type { UseQueryOptions } from "@tanstack/react-query";

export type FinanceSession = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	valueBrl: string;
	amountPaidBrl: string;
	paid: boolean;
	paidAt: string | null;
	invoiceIssued: boolean;
};

export type FinanceKpis = {
	receivedTotal: string;
	pendingTotal: string;
	completedCount: number;
	pendingCount: number;
};

export type FinanceListPayload = {
	period: { from: string; to: string } | null;
	kpis: FinanceKpis;
	sessions: FinanceSession[];
};

export type FinanceResult = {
	data: FinanceListPayload;
	meta: PaginationMeta;
};

export const financeQueryKeys = {
	root: () => ["finance"] as const,
	list: (params: {
		from: string | null;
		to: string | null;
		page: number;
	}) => [...financeQueryKeys.root(), "list", params] as const,
	home: () => [...financeQueryKeys.root(), "home"] as const
};

export const useFinanceQuery = (
	params: { from: string | null; to: string | null; page: number },
	options?: Omit<UseQueryOptions<FinanceResult, Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: financeQueryKeys.list(params),
		queryFn: async () => {
			const search = new URLSearchParams({
				page: String(params.page),
				pageSize: "20"
			});
			if (params.from) search.set("from", params.from);
			if (params.to) search.set("to", params.to);
			const res = await fetch(`/api/admin/finance?${search}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao carregar financeiro.");
			return {
				data: json.data,
				meta: json.meta
			} as FinanceResult;
		},
		...options
	});
};

export const useFinanceHomeQuery = (
	options?: Omit<UseQueryOptions<FinanceKpis, Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: financeQueryKeys.home(),
		queryFn: async () => {
			const search = new URLSearchParams({
				page: "1",
				pageSize: "1"
			});
			const res = await fetch(`/api/admin/finance?${search}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao carregar financeiro.");
			return json.data.kpis as FinanceKpis;
		},
		...options
	});
};
