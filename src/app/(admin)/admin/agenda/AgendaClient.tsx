"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OverlapConfirmDialog } from "@/components/admin/OverlapConfirmDialog";
import { EmptyState, ErrorState, PageHeader } from "@/components/admin/PageStates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	addDays,
	formatWeekLabel,
	normalizeTime,
	parseDateString,
	startOfWeekMonday,
	STATUS_LABEL,
	toDateString,
	WEEKDAY_LABELS
} from "@/lib/sessions/agenda";
import { cn } from "@/utils";

type AgendaSession = {
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
};

type PatientOption = {
	id: string;
	fullName: string;
	preferredServiceTypeId: string;
};

type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
};

type Clinic = {
	defaultSessionDurationMinutes: number;
};

async function fetchWeek(from: string, to: string) {
	const res = await fetch(`/api/admin/sessions?from=${from}&to=${to}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar agenda.");
	return json.data as AgendaSession[];
}

async function fetchPatients() {
	const res = await fetch("/api/admin/patients");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar pacientes.");
	return json.data as PatientOption[];
}

async function fetchServiceTypes() {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data as ServiceType[];
}

async function fetchClinic() {
	const res = await fetch("/api/admin/clinic");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar clínica.");
	return json.data as Clinic;
}

function statusVariant(status: string) {
	if (status === "completed") return "default" as const;
	if (status === "canceled" || status === "no_show") return "secondary" as const;
	return "outline" as const;
}

function SessionCard({ s }: { s: AgendaSession }) {
	return (
		<div className="border-border hover:border-brand rounded-md border-l-brand border border-l-4 bg-white p-3 shadow-xs transition-colors">
			<Link href={`/admin/sessions/${s.id}`} className="block">
				<p className="text-xs font-medium">
					{normalizeTime(String(s.scheduledTime)).slice(0, 5)} ·{" "}
					{s.durationMinutes}min
				</p>
				<p className="truncate text-sm font-medium">{s.patientName}</p>
				<p className="text-muted-foreground truncate text-xs">
					{s.serviceTypeName}
				</p>
				<Badge variant={statusVariant(s.status)} className="mt-1">
					{STATUS_LABEL[s.status] ?? s.status}
				</Badge>
			</Link>
			{s.status === "scheduled" ? (
				<Button asChild size="sm" className="mt-2 min-h-11 w-full sm:min-h-9">
					<Link href={`/admin/sessions/${s.id}?mode=clinical`}>INICIAR</Link>
				</Button>
			) : null}
		</div>
	);
}

export default function AgendaClient() {
	usePageTitle("Agenda");
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const initialPatientId = searchParams.get("patientId") ?? "";
	const initialDate = searchParams.get("date") ?? "";

	const [weekAnchor, setWeekAnchor] = useState(() =>
		startOfWeekMonday(
			initialDate ? parseDateString(initialDate) : new Date()
		)
	);
	const [composerOpen, setComposerOpen] = useState(
		Boolean(initialPatientId || initialDate)
	);
	const [selectedDay, setSelectedDay] = useState(
		initialDate || toDateString(new Date())
	);

	const [patientId, setPatientId] = useState(initialPatientId);
	const [scheduledTime, setScheduledTime] = useState("09:00");
	const [durationMinutes, setDurationMinutes] = useState(50);
	const [serviceTypeId, setServiceTypeId] = useState("");
	const [valueBrl, setValueBrl] = useState(220);
	const [overlapReason, setOverlapReason] = useState("");
	const [pendingOverlap, setPendingOverlap] = useState(false);

	const monday = weekAnchor;
	const from = toDateString(monday);
	const to = toDateString(addDays(monday, 6));
	const days = useMemo(
		() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
		[monday]
	);

	const weekQuery = useQuery({
		queryKey: ["sessions-week", from, to],
		queryFn: () => fetchWeek(from, to)
	});

	const patientsQuery = useQuery({
		queryKey: ["patients", "", false],
		queryFn: fetchPatients
	});

	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes
	});

	const clinicQuery = useQuery({
		queryKey: ["clinic"],
		queryFn: fetchClinic
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

	const mobileDaySessions = sessionsByDay.get(selectedDay) ?? [];
	const todayStr = toDateString(new Date());

	function applyServiceType(typeId: string) {
		setServiceTypeId(typeId);
		const t = typesQuery.data?.find((x) => x.id === typeId);
		if (t) {
			setDurationMinutes(t.defaultDurationMinutes);
			setValueBrl(Number(t.defaultValueBrl));
		}
	}

	function openComposer(dateStr: string) {
		setSelectedDay(dateStr);
		setComposerOpen(true);
		setPendingOverlap(false);
		setOverlapReason("");
		if (!serviceTypeId && typesQuery.data) {
			const active = typesQuery.data.find((t) => t.isActive);
			if (active) applyServiceType(active.id);
		}
		if (!durationMinutes && clinicQuery.data) {
			setDurationMinutes(clinicQuery.data.defaultSessionDurationMinutes);
		}
	}

	function closeComposer() {
		setComposerOpen(false);
		setPendingOverlap(false);
		setOverlapReason("");
	}

	function onPatientChange(id: string) {
		setPatientId(id);
		const p = patientsQuery.data?.find((x) => x.id === id);
		if (p?.preferredServiceTypeId) {
			applyServiceType(p.preferredServiceTypeId);
		}
	}

	const createMutation = useMutation({
		mutationFn: async (allowOverlap: boolean) => {
			const res = await fetch("/api/admin/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					patientId,
					scheduledDate: selectedDay,
					scheduledTime,
					durationMinutes,
					serviceTypeId,
					valueBrl,
					allowOverlap,
					overlapReason: allowOverlap ? overlapReason : undefined
				})
			});
			const json = await res.json();
			if (res.status === 409 && json.error === "overlap") {
				return { overlap: true as const, conflicts: json.conflicts };
			}
			if (!res.ok) throw new Error(json.error || json.message || "Falha ao agendar.");
			return { overlap: false as const, data: json.data as { id: string } };
		},
		onSuccess: (result) => {
			if (result.overlap) {
				setPendingOverlap(true);
				toast.message("Há sobreposição de horário. Confirme o override.");
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
			toast.success("Agendamento criado.");
			closeComposer();
			router.push(`/admin/sessions/${result.data.id}`);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const canSave =
		Boolean(patientId && serviceTypeId && selectedDay && scheduledTime) &&
		!createMutation.isPending;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Agenda"
				description={`Semana ${formatWeekLabel(monday)}`}
				actions={
					<>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="min-h-11 sm:min-h-9"
								onClick={() => setWeekAnchor(addDays(monday, -7))}
							>
								Anterior
							</Button>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								className="min-h-11 sm:min-h-9"
								onClick={() => {
									const now = new Date();
									setWeekAnchor(startOfWeekMonday(now));
									setSelectedDay(toDateString(now));
								}}
							>
								Hoje
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="min-h-11 sm:min-h-9"
								onClick={() => setWeekAnchor(addDays(monday, 7))}
							>
								Próxima
							</Button>
						</div>
						<Button
							type="button"
							className="min-h-11 w-full sm:min-h-10 sm:w-auto"
							onClick={() => openComposer(selectedDay || todayStr)}
						>
							+ Agendar
						</Button>
					</>
				}
			/>

			<Dialog
				open={composerOpen}
				onOpenChange={(open) => {
					if (!open) closeComposer();
					else setComposerOpen(true);
				}}
			>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Novo agendamento</DialogTitle>
						<DialogDescription>
							Duração padrão do tipo. Sobreposição exige override.
						</DialogDescription>
					</DialogHeader>

					{!patientsQuery.isLoading &&
					(patientsQuery.data?.length ?? 0) === 0 ? (
						<EmptyState
							title="Cadastre um paciente antes de agendar"
							description="A agenda precisa de ao menos um paciente ativo."
							action={
								<Button asChild size="sm">
									<Link href="/admin/patients/new">Novo paciente</Link>
								</Button>
							}
						/>
					) : (
						<div className="grid gap-4 sm:grid-cols-2">
							<Select
								className="sm:col-span-2"
								label={{ text: "Paciente", required: true }}
								value={patientId}
								onChange={(e) => onPatientChange(e.target.value)}
								placeholder="Selecione…"
								options={(patientsQuery.data ?? []).map((p) => ({
									value: p.id,
									label: p.fullName
								}))}
							/>
							<Select
								className="sm:col-span-2"
								label={{ text: "Tipo", required: true }}
								value={serviceTypeId}
								onChange={(e) => applyServiceType(e.target.value)}
								placeholder="Selecione…"
								options={(typesQuery.data ?? [])
									.filter((t) => t.isActive)
									.map((t) => ({
										value: t.id,
										label: t.name
									}))}
							/>
							<Input
								label={{ text: "Data", required: true }}
								type="date"
								value={selectedDay}
								onChange={(e) => setSelectedDay(e.target.value)}
							/>
							<Input
								label={{ text: "Horário", required: true }}
								type="time"
								value={scheduledTime}
								onChange={(e) => setScheduledTime(e.target.value)}
							/>
							<Input
								label={{ text: "Duração (min)", required: true }}
								type="number"
								inputMode="numeric"
								min={5}
								max={480}
								value={durationMinutes}
								onChange={(e) => setDurationMinutes(Number(e.target.value))}
							/>
							<Input
								label={{ text: "Valor (R$)", required: true }}
								type="number"
								inputMode="decimal"
								min={0}
								step="0.01"
								value={valueBrl}
								onChange={(e) => setValueBrl(Number(e.target.value))}
							/>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button type="button" variant="ghost" onClick={closeComposer}>
							Cancelar
						</Button>
						<Button
							type="button"
							className="min-h-11 sm:min-h-10"
							disabled={!canSave}
							onClick={() => createMutation.mutate(false)}
						>
							{createMutation.isPending ? "Salvando…" : "Salvar agendamento"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<OverlapConfirmDialog
				open={pendingOverlap}
				reason={overlapReason}
				pending={createMutation.isPending}
				onReasonChange={setOverlapReason}
				onConfirm={() => createMutation.mutate(true)}
				onCancel={() => {
					setPendingOverlap(false);
					setOverlapReason("");
				}}
			/>

			{weekQuery.isLoading ? (
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
			) : weekQuery.isError ? (
				<ErrorState
					message={(weekQuery.error as Error).message}
					onRetry={() => weekQuery.refetch()}
				/>
			) : (
				<>
					{/* Mobile: seletor de dia + lista */}
					<div className="space-y-4 md:hidden">
						<div className="grid grid-cols-7 gap-1">
							{days.map((day, index) => {
								const dateStr = toDateString(day);
								const count = sessionsByDay.get(dateStr)?.length ?? 0;
								const isSelected = dateStr === selectedDay;
								const isToday = dateStr === todayStr;

								return (
									<button
										key={dateStr}
										type="button"
										onClick={() => setSelectedDay(dateStr)}
										className={cn(
											"flex min-h-14 flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-center transition-colors",
											isSelected
												? "border-brand bg-brand/10 text-foreground"
												: "border-border bg-card",
											isToday && !isSelected && "border-brand/50"
										)}
									>
										<span className="text-muted-foreground text-[10px] uppercase">
											{WEEKDAY_LABELS[index].slice(0, 3)}
										</span>
										<span className="text-sm font-medium">
											{day.getDate()}
										</span>
										{count > 0 ? (
											<span className="bg-brand mt-0.5 size-1.5 rounded-full" />
										) : (
											<span className="mt-0.5 size-1.5" />
										)}
									</button>
								);
							})}
						</div>

						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium">
								{parseDateString(selectedDay).toLocaleDateString("pt-BR", {
									weekday: "long",
									day: "2-digit",
									month: "long"
								})}
							</p>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="min-h-11"
								onClick={() => openComposer(selectedDay)}
							>
								+ Neste dia
							</Button>
						</div>

						{mobileDaySessions.length === 0 ? (
							<EmptyState
								title="Sem horários neste dia"
								description="Toque em + Neste dia para agendar."
							/>
						) : (
							<ul className="space-y-2">
								{mobileDaySessions.map((s) => (
									<li key={s.id}>
										<SessionCard s={s} />
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Desktop: grade semanal */}
					<div className="hidden gap-3 md:grid md:grid-cols-7">
						{days.map((day, index) => {
							const dateStr = toDateString(day);
							const items = sessionsByDay.get(dateStr) ?? [];
							const isToday = dateStr === todayStr;

							return (
								<section
									key={dateStr}
									className={cn(
										"border-border bg-card flex min-h-48 flex-col rounded-xl border",
										isToday && "border-brand border-2"
									)}
								>
									<button
										type="button"
										className="hover:bg-accent/40 border-border border-b px-2 py-2 text-left"
										onClick={() => openComposer(dateStr)}
									>
										<p className="text-muted-foreground text-xs tracking-wide uppercase">
											{WEEKDAY_LABELS[index]}
										</p>
										<p className="text-sm font-medium">
											{day.toLocaleDateString("pt-BR", {
												day: "2-digit",
												month: "2-digit"
											})}
										</p>
									</button>
									<div className="flex flex-1 flex-col gap-2 p-2">
										{items.length === 0 ? (
											<p className="text-muted-foreground px-1 text-xs">
												Sem horários
											</p>
										) : (
											items.map((s) => <SessionCard key={s.id} s={s} />)
										)}
									</div>
								</section>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
