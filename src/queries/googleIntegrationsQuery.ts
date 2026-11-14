import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



import { fetchApiData } from "@/lib/api/fetchJson";

import { sessionQueryKeys } from "@/queries/sessionQuery";

import { serviceTypeQueryKeys } from "@/queries/serviceTypeQuery";



import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";



export type GoogleCalendarStatus = {

	configured: boolean;

	connected: boolean;

	googleAccountEmail: string | null;

	connectedAt: string | null;

	calendarId: string | null;

};



export type GoogleCalendarOption = {

	id: string;

	summary: string;

	primary: boolean;

	accessRole?: string;

};

export type GoogleCalendarSubscription = {
	id: string;
	googleCalendarId: string;
	label: string;
	lastSyncedAt: string | null;
	watchExpiration: string | null;
};

export type ExternalCalendarEventDto = {
	id: string;
	googleCalendarId: string;
	googleEventId: string;
	summary: string;
	status: string;
	allDay: boolean;
	startDate: string | null;
	endDate: string | null;
	startAt: string | null;
	endAt: string | null;
	calendarLabel: string;
};



export type GoogleDriveStatus = {

	configured: boolean;

	connected: boolean;

	googleAccountEmail: string | null;

	connectedAt: string | null;

	retentionDays: number;

	lastRun: {

		status: "success" | "error";

		trigger: string;

		fileName: string | null;

		bytes: number | null;

		errorMessage: string | null;

		deletedOldFiles: number;

		createdAt: string;

	} | null;

};



export type CalendarRestoreResult = {

	total: number;

	synced: number;

	errors: number;

	skipped: number;

};



export type DriveBackupResult = {

	fileName?: string;

	bytes?: number;

	deletedOldFiles: number;

};



export const googleCalendarQueryKeys = {

	root: () => ["google-calendar"] as const,

	status: () => [...googleCalendarQueryKeys.root(), "status"] as const,

	calendars: () => [...googleCalendarQueryKeys.root(), "calendars"] as const,

	subscriptions: () =>
		[...googleCalendarQueryKeys.root(), "subscriptions"] as const,

	externalEvents: (from: string, to: string) =>
		[...googleCalendarQueryKeys.root(), "external-events", from, to] as const,

	syncLogs: () => [...googleCalendarQueryKeys.root(), "sync-logs"] as const

};

export type GoogleCalendarSyncLog = {
	id: string;
	subscriptionId: string | null;
	source: string;
	status: "ok" | "error" | "ignored";
	detail: string | null;
	createdAt: string;
};



export const googleDriveQueryKeys = {

	root: () => ["google-drive"] as const,

	status: () => [...googleDriveQueryKeys.root(), "status"] as const,

	runs: () => [...googleDriveQueryKeys.root(), "runs"] as const

};

export type GoogleDriveBackupRun = {
	id: string;
	status: "success" | "error";
	trigger: string;
	fileName: string | null;
	bytes: number | null;
	errorMessage: string | null;
	deletedOldFiles: number;
	createdAt: string;
};



export const useGoogleCalendarStatusQuery = (

	options?: Omit<

		UseQueryOptions<GoogleCalendarStatus, Error>,

		"queryKey" | "queryFn"

	>

) => {

	return useQuery({

		queryKey: googleCalendarQueryKeys.status(),

		queryFn: () =>

			fetchApiData<GoogleCalendarStatus>(

				"/api/admin/integrations/google-calendar"

			),

		...options

	});

};



export const useGoogleCalendarsQuery = (

	options?: Omit<

		UseQueryOptions<GoogleCalendarOption[], Error>,

		"queryKey" | "queryFn"

	>

) => {

	const { enabled, ...rest } = options ?? {};

	return useQuery({

		queryKey: googleCalendarQueryKeys.calendars(),

		queryFn: () =>

			fetchApiData<GoogleCalendarOption[]>(

				"/api/admin/integrations/google-calendar/calendars"

			),

		enabled: enabled ?? true,

		...rest

	});

};



export const useGoogleDriveStatusQuery = (

	options?: Omit<

		UseQueryOptions<GoogleDriveStatus, Error>,

		"queryKey" | "queryFn"

	>

) => {

	return useQuery({

		queryKey: googleDriveQueryKeys.status(),

		queryFn: () =>

			fetchApiData<GoogleDriveStatus>("/api/admin/integrations/google-drive"),

		...options

	});

};

export const useGoogleDriveBackupRunsQuery = (
	options?: Omit<
		UseQueryOptions<GoogleDriveBackupRun[], Error>,
		"queryKey" | "queryFn"
	>
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: googleDriveQueryKeys.runs(),
		queryFn: () =>
			fetchApiData<GoogleDriveBackupRun[]>(
				"/api/admin/integrations/google-drive/runs?limit=50"
			),
		enabled: enabled ?? true,
		staleTime: 10_000,
		...rest
	});
};



export const useDisconnectGoogleCalendarMutation = (

	options?: Omit<UseMutationOptions<unknown, Error, void>, "mutationFn">

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleCalendarQueryKeys.root(), "disconnect"],

		mutationFn: () =>

			fetchApiData("/api/admin/integrations/google-calendar", {

				method: "DELETE"

			}),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: googleCalendarQueryKeys.root()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};



export const useDisconnectGoogleDriveMutation = (

	options?: Omit<UseMutationOptions<unknown, Error, void>, "mutationFn">

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleDriveQueryKeys.root(), "disconnect"],

		mutationFn: () =>

			fetchApiData("/api/admin/integrations/google-drive", {

				method: "DELETE"

			}),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: googleDriveQueryKeys.root()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};



export const useRunGoogleDriveBackupMutation = (

	options?: Omit<

		UseMutationOptions<DriveBackupResult, Error, void>,

		"mutationFn"

	>

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleDriveQueryKeys.root(), "run"],

		mutationFn: () =>

			fetchApiData<DriveBackupResult>(

				"/api/admin/integrations/google-drive/run",

				{ method: "POST" }

			),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: googleDriveQueryKeys.root()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};



export const useRestoreGoogleCalendarMutation = (

	options?: Omit<

		UseMutationOptions<CalendarRestoreResult, Error, void>,

		"mutationFn"

	>

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleCalendarQueryKeys.root(), "restore"],

		mutationFn: () =>

			fetchApiData<CalendarRestoreResult>(

				"/api/admin/integrations/google-calendar/restore",

				{ method: "POST" }

			),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: sessionQueryKeys.ranges()

			});

			await queryClient.invalidateQueries({

				queryKey: googleCalendarQueryKeys.root()

			});

			await queryClient.invalidateQueries({

				queryKey: serviceTypeQueryKeys.list()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};



export const usePatchGoogleCalendarDefaultMutation = (

	options?: Omit<UseMutationOptions<unknown, Error, string>, "mutationFn">

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleCalendarQueryKeys.root(), "defaultCalendar"],

		mutationFn: (calendarId) =>

			fetchApiData("/api/admin/integrations/google-calendar", {

				method: "PATCH",

				headers: { "Content-Type": "application/json" },

				body: JSON.stringify({ calendarId })

			}),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: googleCalendarQueryKeys.status()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};



export const useSaveGoogleCalendarMappingsMutation = (

	options?: Omit<

		UseMutationOptions<

			unknown,

			Error,

			Array<{ serviceTypeId: string; googleCalendarId: string | null }>

		>,

		"mutationFn"

	>

) => {

	const queryClient = useQueryClient();

	const { onSuccess, ...rest } = options ?? {};

	return useMutation({

		mutationKey: [...googleCalendarQueryKeys.root(), "mappings"],

		mutationFn: (mappings) =>

			fetchApiData("/api/admin/integrations/google-calendar/mappings", {

				method: "PUT",

				headers: { "Content-Type": "application/json" },

				body: JSON.stringify({ mappings })

			}),

		onSuccess: async (data, vars, onMutateResult, context) => {

			await queryClient.invalidateQueries({

				queryKey: serviceTypeQueryKeys.list()

			});

			await onSuccess?.(data, vars, onMutateResult, context);

		},

		...rest

	});

};

export const useGoogleCalendarSubscriptionsQuery = (
	options?: Omit<
		UseQueryOptions<GoogleCalendarSubscription[], Error>,
		"queryKey" | "queryFn"
	>
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: googleCalendarQueryKeys.subscriptions(),
		queryFn: () =>
			fetchApiData<GoogleCalendarSubscription[]>(
				"/api/admin/integrations/google-calendar/subscriptions"
			),
		enabled: enabled ?? true,
		...rest
	});
};

export const useSaveGoogleCalendarSubscriptionsMutation = (
	options?: Omit<
		UseMutationOptions<
			unknown,
			Error,
			Array<{ googleCalendarId: string; label: string }>
		>,
		"mutationFn"
	>
) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...rest } = options ?? {};
	return useMutation({
		mutationKey: [...googleCalendarQueryKeys.root(), "save-subscriptions"],
		mutationFn: (calendars) =>
			fetchApiData("/api/admin/integrations/google-calendar/subscriptions", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ calendars })
			}),
		onSuccess: async (data, vars, onMutateResult, context) => {
			await queryClient.invalidateQueries({
				queryKey: googleCalendarQueryKeys.root()
			});
			await onSuccess?.(data, vars, onMutateResult, context);
		},
		...rest
	});
};

export const useExternalCalendarEventsQuery = (
	from: string,
	to: string,
	options?: Omit<
		UseQueryOptions<ExternalCalendarEventDto[], Error>,
		"queryKey" | "queryFn"
	>
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: googleCalendarQueryKeys.externalEvents(from, to),
		queryFn: () =>
			fetchApiData<ExternalCalendarEventDto[]>(
				`/api/admin/integrations/google-calendar/external-events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
			),
		enabled: enabled ?? Boolean(from && to),
		staleTime: 30_000,
		...rest
	});
};

export const useGoogleCalendarSyncLogsQuery = (
	options?: Omit<
		UseQueryOptions<GoogleCalendarSyncLog[], Error>,
		"queryKey" | "queryFn"
	>
) => {
	const { enabled, ...rest } = options ?? {};
	return useQuery({
		queryKey: googleCalendarQueryKeys.syncLogs(),
		queryFn: () =>
			fetchApiData<GoogleCalendarSyncLog[]>(
				"/api/admin/integrations/google-calendar/sync-logs?limit=50"
			),
		enabled: enabled ?? true,
		staleTime: 10_000,
		...rest
	});
};

