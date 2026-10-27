import { useQuery } from "@tanstack/react-query";

import { fetchApiList } from "@/lib/api/fetchJson";

import type { PaginationMeta } from "@/lib/pagination";
import type { UseQueryOptions } from "@tanstack/react-query";

export type RecordItem = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	valueBrl: string;
	amountPaidBrl: string;
	paid: boolean;
	invoiceIssued: boolean;
};

export type RecordsResult = {
	data: RecordItem[];
	meta: PaginationMeta;
};

export const recordsQueryKeys = {
	root: () => ["records"] as const,
	list: (params: { q: string; page: number }) =>
		[...recordsQueryKeys.root(), "list", params] as const
};

export const useRecordsQuery = (
	params: { q: string; page: number },
	options?: Omit<UseQueryOptions<RecordsResult, Error>, "queryKey" | "queryFn">
) => {
	return useQuery({
		queryKey: recordsQueryKeys.list(params),
		queryFn: async () => {
			const search = new URLSearchParams({
				page: String(params.page),
				pageSize: "20",
				status: "completed"
			});
			if (params.q.trim()) search.set("q", params.q.trim());
			return fetchApiList<RecordItem[], PaginationMeta>(
				`/api/admin/sessions?${search}`
			);
		},
		...options
	});
};
