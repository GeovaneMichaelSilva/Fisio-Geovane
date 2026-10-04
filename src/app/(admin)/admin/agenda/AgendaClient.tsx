"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import OverlapConfirmDialog, {
	type OverlapConflict
} from "@/components/admin/OverlapConfirmDialog";
import ErrorState from "@/components/admin/ErrorState";
import PageHeader from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	addDays,
	formatWeekLabel,
	parseDateString,
	startOfWeekMonday,
	toDateString
} from "@/lib/sessions/agenda";
import {
	sessionCreateSchema,
	type SessionCreateInput,
	type SessionCreateParsed
} from "@/lib/sessions/schema";

import AgendaComposerDialog from "./components/AgendaComposerDialog";
import AgendaHeaderActions from "./components/AgendaHeaderActions";
import AgendaWeekBoard from "./components/AgendaWeekBoard";
import {
	fetchClinic,
	fetchGoogleStatus,
	fetchPatients,
	fetchServiceTypes,
	fetchWeek,
	notifyGoogleSync
} from "./components/agendaApi";

import type { AgendaSession, GoogleSyncResult } from "./components/types";
import type { FC, ReactNode } from "react";

const AgendaClient: FC = () => {
	usePageTitle("Agenda");
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const initialPatientId = searchParams.get("patientId") ?? "";
	const initialDate = searchParams.get("date") ?? "";
	const todayStr = toDateString(new Date());

	const [weekAnchor, setWeekAnchor] = useState(() =>
		startOfWeekMonday(initialDate ? parseDateString(initialDate) : new Date())
	);
	const [composerOpen, setComposerOpen] = useState(
		Boolean(initialPatientId || initialDate)
	);
	const [selectedDay, setSelectedDay] = useState(initialDate || todayStr);
	const [overlapReason, setOverlapReason] = useState("");
	const [pendingOverlap, setPendingOverlap] = useState(false);
	const [overlapConflicts, setOverlapConflicts] = useState<OverlapConflict[]>(
		[]
	);
	const [patientFilter, setPatientFilter] = useState("");
	const [debouncedPatientQ, setDebouncedPatientQ] = useState("");

	const form = useForm<SessionCreateInput, unknown, SessionCreateParsed>({
		resolver: zodResolver(sessionCreateSchema),
		defaultValues: {
			patientId: initialPatientId,
			scheduledDate: initialDate || todayStr,
			scheduledTime: "09:00",
			durationMinutes: 50,
			serviceTypeId: "",
			valueBrl: 220,
			allowOverlap: false,
			overlapReason: undefined
		},
		mode: "onSubmit"
	});

	const monday = weekAnchor;
	const from = toDateString(monday);
	const to = toDateString(addDays(monday, 6));
	const days = useMemo(
		() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
		[monday]
	);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedPatientQ(patientFilter), 250);
		return () => clearTimeout(t);
	}, [patientFilter]);

	const weekQuery = useQuery({
		queryKey: ["sessions-week", from, to],
		queryFn: () => fetchWeek(from, to)
	});

	const patientsQuery = useQuery({
		queryKey: ["patients-options", debouncedPatientQ],
		queryFn: () => fetchPatients(debouncedPatientQ),
		enabled: composerOpen
	});

	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes
	});

	const clinicQuery = useQuery({
		queryKey: ["clinic"],
		queryFn: fetchClinic
	});

	const googleQuery = useQuery({
		queryKey: ["google-calendar-status"],
		queryFn: fetchGoogleStatus,
		staleTime: 60_000
	});

	const sessionsByDay = useMemo(() => {
		const map = new Map<string, AgendaSession[]>();
		for (const day of days) map.set(toDateString(day), []);
		for (const s of weekQuery.data ?? []) {
			const list = map.get(s.scheduledDate) ?? [];
			list.push(s);
			map.set(s.scheduledDate, list);
		}
		return map;
	}, [days, weekQuery.data]);

	const applyServiceType = (typeId: string) => {
		form.setValue("serviceTypeId", typeId, { shouldValidate: true });
		const t = typesQuery.data?.find((x) => x.id === typeId);
		if (t) {
			form.setValue("durationMinutes", t.defaultDurationMinutes, {
				shouldValidate: true
			});
			form.setValue("valueBrl", Number(t.defaultValueBrl), {
				shouldValidate: true
			});
		}
	};

	const openComposer = (dateStr: string) => {
		setSelectedDay(dateStr);
		setComposerOpen(true);
		setPendingOverlap(false);
		setOverlapReason("");
		setOverlapConflicts([]);
		setPatientFilter("");

		const current = form.getValues();
		let serviceTypeId = current.serviceTypeId;
		let durationMinutes = current.durationMinutes;
		let valueBrl = current.valueBrl;

		if (!serviceTypeId && typesQuery.data) {
			const active = typesQuery.data.find((t) => t.isActive);
			if (active) {
				serviceTypeId = active.id;
				durationMinutes = active.defaultDurationMinutes;
				valueBrl = Number(active.defaultValueBrl);
			}
		}
		if (
			(!durationMinutes || Number.isNaN(Number(durationMinutes))) &&
			clinicQuery.data
		) {
			durationMinutes = clinicQuery.data.defaultSessionDurationMinutes;
		}

		form.reset({
			patientId: current.patientId || initialPatientId,
			scheduledDate: dateStr,
			scheduledTime: current.scheduledTime || "09:00",
			durationMinutes: Number(durationMinutes) || 50,
			serviceTypeId: serviceTypeId || "",
			valueBrl: Number(valueBrl) || 220,
			allowOverlap: false,
			overlapReason: undefined
		});
	};

	const closeComposer = () => {
		setComposerOpen(false);
		setPendingOverlap(false);
		setOverlapReason("");
		setOverlapConflicts([]);
		setPatientFilter("");
		form.clearErrors();
	};

	const onPatientChange = (id: string) => {
		form.setValue("patientId", id, { shouldValidate: true });
		const p = patientsQuery.data?.find((x) => x.id === id);
		if (p?.preferredServiceTypeId) {
			applyServiceType(p.preferredServiceTypeId);
		}
	};

	useEffect(() => {
		const sub = form.watch((values, { name }) => {
			if (name === "scheduledDate" && values.scheduledDate) {
				setSelectedDay(values.scheduledDate);
			}
		});
		return () => sub.unsubscribe();
	}, [form]);

	const createMutation = useMutation({
		mutationFn: async (payload: SessionCreateParsed) => {
			const res = await fetch("/api/admin/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const json = await res.json();
			if (res.status === 409 && json.error === "overlap") {
				return {
					overlap: true as const,
					conflicts: (json.conflicts ?? []) as OverlapConflict[]
				};
			}
			if (!res.ok) {
				throw new Error(json.error || json.message || "Falha ao agendar.");
			}
			return {
				overlap: false as const,
				data: json.data as { id: string },
				googleSync: json.googleSync as GoogleSyncResult | undefined
			};
		},
		onSuccess: (result) => {
			if (result.overlap) {
				setOverlapConflicts(result.conflicts);
				setPendingOverlap(true);
				toast.message("Há sobreposição de horário. Confirme o override.");
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
			notifyGoogleSync(result.googleSync);
			toast.success("Agendamento criado.", {
				action: {
					label: "Abrir",
					onClick: () => {
						window.location.href = `/admin/sessions/${result.data.id}`;
					}
				}
			});
			closeComposer();
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const submitCreate = (allowOverlap: boolean, reason?: string) => {
		form.setValue("allowOverlap", allowOverlap);
		if (allowOverlap) {
			form.setValue("overlapReason", reason?.trim() || "");
		}
		void form.handleSubmit((values) => {
			createMutation.mutate({
				...values,
				allowOverlap,
				overlapReason: allowOverlap ? reason?.trim() : undefined
			});
		})();
	};

	const selectedPatientId = form.watch("patientId");
	const patientOptions = useMemo(() => {
		const list = patientsQuery.data ?? [];
		if (selectedPatientId && !list.some((p) => p.id === selectedPatientId)) {
			return [
				{
					id: selectedPatientId,
					fullName: "Paciente selecionado",
					preferredServiceTypeId: ""
				},
				...list
			];
		}
		return list;
	}, [patientsQuery.data, selectedPatientId]);

	let weekContent: ReactNode = (
		<div className="space-y-3">
			<div className="flex gap-2 md:hidden">
				{Array.from({ length: 7 }).map((_, i) => (
					<Skeleton key={i} className="h-14 flex-1" />
				))}
			</div>
			<Skeleton className="h-48 w-full md:hidden" />
			<div className="hidden gap-3 md:grid md:grid-cols-7">
				{Array.from({ length: 7 }).map((_, i) => (
					<Skeleton key={i} className="h-48 w-full" />
				))}
			</div>
		</div>
	);

	if (weekQuery.isError) {
		weekContent = (
			<ErrorState
				message={(weekQuery.error as Error).message}
				onRetry={() => weekQuery.refetch()}
			/>
		);
	} else if (!weekQuery.isLoading) {
		weekContent = (
			<AgendaWeekBoard
				days={days}
				todayStr={todayStr}
				selectedDay={selectedDay}
				sessionsByDay={sessionsByDay}
				onSelectDay={setSelectedDay}
				onOpenComposer={openComposer}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Agenda"
				description={`Semana ${formatWeekLabel(monday)}`}
				actions={
					<AgendaHeaderActions
						monday={monday}
						googleStatus={googleQuery.data}
						onWeekAnchorChange={setWeekAnchor}
						onSelectedDayChange={setSelectedDay}
						onSchedule={() => openComposer(selectedDay || todayStr)}
					/>
				}
			/>

			<AgendaComposerDialog
				open={composerOpen}
				googleConnected={Boolean(googleQuery.data?.connected)}
				patientFilter={patientFilter}
				debouncedPatientQ={debouncedPatientQ}
				patientsLoading={patientsQuery.isLoading}
				patientsFetching={patientsQuery.isFetching}
				patientOptions={patientOptions}
				serviceTypes={typesQuery.data ?? []}
				form={form}
				pending={createMutation.isPending}
				onOpenChange={(open) => {
					if (!open) closeComposer();
					else setComposerOpen(true);
				}}
				onClose={closeComposer}
				onPatientFilterChange={setPatientFilter}
				onPatientChange={onPatientChange}
				onServiceTypeChange={applyServiceType}
				onSubmit={(values) => createMutation.mutate(values)}
			/>

			<OverlapConfirmDialog
				open={pendingOverlap}
				reason={overlapReason}
				pending={createMutation.isPending}
				conflicts={overlapConflicts}
				onReasonChange={setOverlapReason}
				onConfirm={() => {
					if (!overlapReason.trim()) {
						toast.error("Informe o motivo do override.");
						return;
					}
					submitCreate(true, overlapReason);
				}}
				onCancel={() => {
					setPendingOverlap(false);
					setOverlapReason("");
					setOverlapConflicts([]);
				}}
			/>

			{weekContent}
		</div>
	);
};

export default AgendaClient;
