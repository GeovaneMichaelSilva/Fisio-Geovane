import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



import { fetchApiData } from "@/lib/api/fetchJson";
import { financeQueryKeys } from "@/queries/financeQuery";
import { patientQueryKeys } from "@/queries/patientQuery";
import { recordsQueryKeys } from "@/queries/recordsQuery";



import type {

	SessionCreateParsed,

	SessionUpdateParsed

} from "@/lib/sessions/schema";

import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";



export type AgendaSession = {

	id: string;

	patientId: string;

	patientName: string;

	scheduledDate: string;

	scheduledTime: string;

	durationMinutes: number;

	serviceTypeId: string;

	serviceTypeName: string;

	status: string;

	valueBrl: string;

	googleEventId?: string | null;

};



export type SessionDetail = {

	id: string;

	patientId: string;

	patientName: string;

	scheduledDate: string;

	scheduledTime: string;

	durationMinutes: number;

	serviceTypeId: string;

	serviceTypeName: string;

	status: "scheduled" | "completed" | "canceled" | "no_show";

	valueBrl: string;

	paid: boolean;

	paidAt: string | null;

	invoiceIssued: boolean;

	assessment: string | null;

	evolution: string | null;

	activities: string | null;

	googleEventId?: string | null;

	audits: Array<{ id: string; editedAt: string; reason: string }>;

	previousClinical: Array<{

		id: string;

		scheduledDate: string;

		scheduledTime: string;

		status: string;

		assessment: string | null;

		evolution: string | null;

		activities: string | null;

		serviceTypeName: string;

	}>;

};



export type GoogleSyncResult =

	| { status: "skipped" }

	| { status: "synced"; action: "create" | "update" | "delete" }

	| { status: "error"; message: string };



export type SessionMutationResult = SessionDetail & {

	googleSync?: GoogleSyncResult;

};



export type OverlapConflict = {

	id: string;

	patientName?: string;

	scheduledTime: string;

	durationMinutes: number;

	status?: string;

};



export type SessionWriteResult =

	| { kind: "overlap"; conflicts: OverlapConflict[] }

	| {

			kind: "ok";

			data: SessionMutationResult;

			googleSync?: GoogleSyncResult;

	  };



export const sessionQueryKeys = {

	root: () => ["sessions"] as const,

	ranges: () => [...sessionQueryKeys.root(), "range"] as const,

	range: (from: string, to: string) =>

		[...sessionQueryKeys.ranges(), { from, to }] as const,

	today: (date: string) =>

		[...sessionQueryKeys.root(), "today", date] as const,

	details: () => [...sessionQueryKeys.root(), "detail"] as const,

	detail: (id: string) => [...sessionQueryKeys.details(), id] as const

};



const parseSessionWriteResponse = async (

	res: Response

): Promise<SessionWriteResult> => {

	const json = (await res.json().catch(() => ({}))) as {

		data?: SessionMutationResult;

		error?: string;

		message?: string;

		conflicts?: OverlapConflict[];

		googleSync?: GoogleSyncResult;

	};



	if (res.status === 409 && json.error === "overlap") {

		return {

			kind: "overlap",

			conflicts: (json.conflicts ?? []) as OverlapConflict[]

		};

	}



	if (!res.ok) {

		throw new Error(json.error || json.message || "Falha na requisição.");

	}



	return {

		kind: "ok",

		data: json.data as SessionMutationResult,

		googleSync: json.googleSync

	};

};



export const postSession = async (

	body: SessionCreateParsed

): Promise<SessionWriteResult> => {

	const res = await fetch("/api/admin/sessions", {

		method: "POST",

		headers: { "Content-Type": "application/json" },

		body: JSON.stringify(body)

	});

	return parseSessionWriteResponse(res);

};



export const putSession = async (

	sessionId: string,

	body: SessionUpdateParsed

): Promise<SessionWriteResult> => {

	const res = await fetch(`/api/admin/sessions/${sessionId}`, {

		method: "PUT",

		headers: { "Content-Type": "application/json" },

		body: JSON.stringify(body)

	});

	return parseSessionWriteResponse(res);

};



const invalidateSessionCollections = async (

	queryClient: ReturnType<typeof useQueryClient>

) => {

	await Promise.all([

		queryClient.invalidateQueries({ queryKey: sessionQueryKeys.ranges() }),

		queryClient.invalidateQueries({

			queryKey: [...sessionQueryKeys.root(), "today"]

		}),

		queryClient.invalidateQueries({ queryKey: recordsQueryKeys.root() }),

		queryClient.invalidateQueries({ queryKey: financeQueryKeys.root() }),

		queryClient.invalidateQueries({ queryKey: patientQueryKeys.details() })

	]);

};



const applySessionWriteSuccess = (

	queryClient: ReturnType<typeof useQueryClient>,

	sessionId: string | undefined,

	result: Extract<SessionWriteResult, { kind: "ok" }>

) => {

	const updated = result.data;

	const id = sessionId ?? updated.id;

	if (id) {

		const prev = queryClient.getQueryData<SessionDetail>(

			sessionQueryKeys.detail(id)

		);

		queryClient.setQueryData(sessionQueryKeys.detail(id), {

			...prev,

			...updated,

			audits: updated.audits ?? prev?.audits ?? [],

			previousClinical:

				updated.previousClinical ?? prev?.previousClinical ?? []

		});

	}

};



export const useSessionsRangeQuery = (

	from: string,

	to: string,

	options?: Omit<

		UseQueryOptions<AgendaSession[], Error>,

		"queryKey" | "queryFn"

	>

) => {

	return useQuery({

		queryKey: sessionQueryKeys.range(from, to),

		queryFn: () =>

			fetchApiData<AgendaSession[]>(

				`/api/admin/sessions?from=${from}&to=${to}`

			),

		enabled: Boolean(from && to),

		...options

	});

};



export const useSessionsTodayQuery = (

	date: string,

	options?: Omit<

		UseQueryOptions<AgendaSession[], Error>,

		"queryKey" | "queryFn"

	>

) => {

	return useQuery({

		queryKey: sessionQueryKeys.today(date),

		queryFn: () =>

			fetchApiData<AgendaSession[]>(

				`/api/admin/sessions?from=${date}&to=${date}`

			),

		...options

	});

};



export const useSessionQuery = (

	sessionId: string,

	options?: Omit<

		UseQueryOptions<SessionDetail, Error>,

		"queryKey" | "queryFn"

	>

) => {

	const { enabled, ...rest } = options ?? {};

	return useQuery({

		queryKey: sessionQueryKeys.detail(sessionId),

		queryFn: () =>

			fetchApiData<SessionDetail>(`/api/admin/sessions/${sessionId}`),

		enabled: Boolean(sessionId) && (enabled ?? true),

		...rest

	});

};



export const useCreateSessionMutation = (

	options?: Omit<

		UseMutationOptions<SessionWriteResult, Error, SessionCreateParsed>,

		"mutationFn"

	>

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};



	return useMutation({

		mutationKey: [...sessionQueryKeys.root(), "create"],

		mutationFn: (values) => postSession(values),

		onSuccess: async (result, vars, onMutateResult, context) => {

			if (result.kind === "ok") {

				applySessionWriteSuccess(queryClient, result.data.id, result);

				await invalidateSessionCollections(queryClient);

			}

			await onSuccess?.(result, vars, onMutateResult, context);

		},

		...rest

	});

};



export const useUpdateSessionMutation = (

	sessionId: string,

	options?: Omit<

		UseMutationOptions<SessionWriteResult, Error, SessionUpdateParsed>,

		"mutationFn"

	>

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};



	return useMutation({

		mutationKey: [...sessionQueryKeys.root(), "update", sessionId],

		mutationFn: (values) => putSession(sessionId, values),

		onSuccess: async (result, vars, onMutateResult, context) => {

			if (result.kind === "ok") {

				applySessionWriteSuccess(queryClient, sessionId, result);

				await invalidateSessionCollections(queryClient);

			}

			await onSuccess?.(result, vars, onMutateResult, context);

		},

		...rest

	});

};


