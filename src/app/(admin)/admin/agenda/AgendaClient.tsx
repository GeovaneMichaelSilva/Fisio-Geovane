"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Views, type View } from "react-big-calendar";

import OverlapConfirmDialog, {
	type OverlapConflict
} from "@/components/admin/OverlapConfirmDialog";
import ErrorState from "@/components/admin/ErrorState";
import PageHeader from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	addDays,
	buildMonthGrid,
	formatMonthLabel,
	formatWeekLabel,
	parseDateString,
	startOfMonth,
	startOfWeekMonday,
	toDateString
} from "@/lib/sessions/agenda";
import {
	sessionCreateSchema,
	type SessionCreateInput,
	type SessionCreateParsed
} from "@/lib/sessions/schema";

import AgendaCalendar from "./components/AgendaCalendar";
import AgendaComposerDialog from "./components/AgendaComposerDialog";
import AgendaHeaderActions from "./components/AgendaHeaderActions";
import AgendaToolbar from "./components/AgendaToolbar";
import RescheduleMoveDialog, {
	type PendingMove
} from "./components/RescheduleMoveDialog";
import { useClinicQuery } from "@/queries/clinicQuery";
import { useGoogleCalendarStatusQuery } from "@/queries/googleIntegrationsQuery";
import { usePatientOptionsQuery } from "@/queries/patientQuery";
import {
	useCreateSessionMutation,
	useSessionsRangeQuery,
	useUpdateSessionMutation
} from "@/queries/sessionQuery";
import { useServiceTypesQuery } from "@/queries/serviceTypeQuery";

import { notifyGoogleSync } from "./components/agendaApi";
import { sessionsToEvents } from "./components/agendaEvents";
import type { FC, ReactNode } from "react";

const AgendaClient: FC = () => {
	usePageTitle("Agenda");
	const searchParams = useSearchParams();

	const initialPatientId = searchParams.get("patientId") ?? "";
	const initialDate = searchParams.get("date") ?? "";
	const todayStr = toDateString(new Date());
	const initialAnchor = initialDate ? parseDateString(initialDate) : new Date();

	const [view, setView] = useState<View>(Views.WEEK);
	const [date, setDate] = useState(initialAnchor);
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
	const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
	const [moveOverlapOpen, setMoveOverlapOpen] = useState(false);
	const [moveOverlapReason, setMoveOverlapReason] = useState("");
	const [moveOverlapConflicts, setMoveOverlapConflicts] = useState<
		OverlapConflict[]
	>([]);

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
		mode: "all"
	});

	const range = useMemo(() => {
		if (view === Views.MONTH) {
			const grid = buildMonthGrid(startOfMonth(date));
			return {
				from: toDateString(grid[0]!),
				to: toDateString(grid[41]!)
			};
		}
		if (view === Views.DAY) {
			const day = toDateString(date);
			return { from: day, to: day };
		}
		const monday = startOfWeekMonday(date);
		return {
			from: toDateString(monday),
			to: toDateString(addDays(monday, 6))
		};
	}, [view, date]);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedPatientQ(patientFilter), 250);
		return () => clearTimeout(t);
	}, [patientFilter]);

	const rangeQuery = useSessionsRangeQuery(range.from, range.to);

	const patientsQuery = usePatientOptionsQuery(debouncedPatientQ, {
		enabled: composerOpen
	});

	const typesQuery = useServiceTypesQuery();

	const clinicQuery = useClinicQuery();

	const googleQuery = useGoogleCalendarStatusQuery({
		staleTime: 60_000
	});

	const moveSessionId = pendingMove?.session.id ?? "";
	const moveMutation = useUpdateSessionMutation(moveSessionId);

	const events = useMemo(
		() => sessionsToEvents(rangeQuery.data ?? []),
		[rangeQuery.data]
	);

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

	const openComposer = (
		dateStr: string,
		timeStr?: string,
		durationMinutesArg?: number
	) => {
		setSelectedDay(dateStr);
		setDate(parseDateString(dateStr));
		setComposerOpen(true);
		setPendingOverlap(false);
		setOverlapReason("");
		setOverlapConflicts([]);
		setPatientFilter("");

		const current = form.getValues();
		let serviceTypeId = current.serviceTypeId;
		let durationMinutes = durationMinutesArg ?? current.durationMinutes;
		let valueBrl = current.valueBrl;

		if (!serviceTypeId && typesQuery.data) {
			const active = typesQuery.data.find((t) => t.isActive);
			if (active) {
				serviceTypeId = active.id;
				if (!durationMinutesArg) {
					durationMinutes = active.defaultDurationMinutes;
				}
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
			scheduledTime: timeStr || current.scheduledTime || "09:00",
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

	const createMutation = useCreateSessionMutation({
		onSuccess: (result) => {
			if (result.kind === "overlap") {
				setOverlapConflicts(result.conflicts);
				setPendingOverlap(true);
				toast.message("Há sobreposição de horário. Confirme o override.");
				return;
			}
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

	const confirmMove = (allowOverlap: boolean, overlapReasonValue?: string) => {
		if (!pendingMove) return;
		moveMutation.mutate(
			{
				scheduledDate: pendingMove.toDate,
				scheduledTime: pendingMove.toTime,
				durationMinutes: pendingMove.durationMinutes,
				allowOverlap,
				overlapReason: allowOverlap ? overlapReasonValue?.trim() : undefined,
				reason: "Remarcado na agenda (calendário)."
			},
			{
				onSuccess: (result) => {
					if (result.kind === "overlap") {
						setMoveOverlapConflicts(result.conflicts);
						setMoveOverlapOpen(true);
						toast.message(
							"Há sobreposição no horário de destino. Confirme o override."
						);
						return;
					}
					notifyGoogleSync(result.googleSync);
					toast.success("Atendimento remarcado.");
					setPendingMove(null);
					setMoveOverlapOpen(false);
					setMoveOverlapReason("");
					setMoveOverlapConflicts([]);
				},
				onError: (err: Error) => toast.error(err.message)
			}
		);
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

	let headerDescription = `Semana ${formatWeekLabel(startOfWeekMonday(date))}`;
	if (view === Views.MONTH) {
		headerDescription = formatMonthLabel(startOfMonth(date));
	} else if (view === Views.DAY) {
		headerDescription = date.toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "2-digit",
			month: "long"
		});
	}

	let boardContent: ReactNode = <Skeleton className="h-[min(72vh,820px)] w-full rounded-xl" />;

	if (rangeQuery.isError) {
		boardContent = (
			<ErrorState
				message={(rangeQuery.error as Error).message}
				onRetry={() => rangeQuery.refetch()}
			/>
		);
	} else if (!rangeQuery.isLoading) {
		boardContent = (
			<AgendaCalendar
				date={date}
				view={view}
				events={events}
				onNavigate={(next) => {
					setDate(next);
					setSelectedDay(toDateString(next));
				}}
				onView={setView}
				onSelectSlot={({ date: slotDate, time, durationMinutes }) => {
					const allDayLike = durationMinutes >= 12 * 60;
					openComposer(
						slotDate,
						allDayLike ? "09:00" : time,
						allDayLike ? undefined : durationMinutes
					);
				}}
				onRequestReschedule={(target) => {
					setPendingMove(target);
					setMoveOverlapOpen(false);
					setMoveOverlapReason("");
					setMoveOverlapConflicts([]);
				}}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Agenda"
				description={headerDescription}
				actions={
					<AgendaHeaderActions
						googleStatus={googleQuery.data}
						onSchedule={() => openComposer(selectedDay || todayStr)}
					/>
				}
			/>

			<AgendaToolbar
				view={view}
				date={date}
				onViewChange={setView}
				onDateChange={(next) => {
					setDate(next);
					setSelectedDay(toDateString(next));
				}}
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

			<RescheduleMoveDialog
				pending={pendingMove}
				suppressed={moveOverlapOpen}
				saving={moveMutation.isPending && !moveOverlapOpen}
				onConfirm={() => confirmMove(false)}
				onCancel={() => {
					if (moveMutation.isPending) return;
					setPendingMove(null);
				}}
			/>

			<OverlapConfirmDialog
				open={moveOverlapOpen}
				reason={moveOverlapReason}
				pending={moveMutation.isPending}
				conflicts={moveOverlapConflicts}
				onReasonChange={setMoveOverlapReason}
				onConfirm={() => {
					if (!moveOverlapReason.trim()) {
						toast.error("Informe o motivo do override.");
						return;
					}
					confirmMove(true, moveOverlapReason);
				}}
				onCancel={() => {
					setMoveOverlapOpen(false);
					setMoveOverlapReason("");
					setMoveOverlapConflicts([]);
					setPendingMove(null);
				}}
			/>

			{boardContent}
		</div>
	);
};

export default AgendaClient;
