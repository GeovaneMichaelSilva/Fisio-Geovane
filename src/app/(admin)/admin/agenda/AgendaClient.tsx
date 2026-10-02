"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageHeader } from "@/components/admin/PageStates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
			setComposerOpen(false);
			setPendingOverlap(false);
			setOverlapReason("");
			router.push(`/admin/sessions/${result.data.id}`);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const todayStr = toDateString(new Date());

	return (
		<div className="space-y-6">
			<PageHeader
				title="Agenda"
				description={`Semana ${formatWeekLabel(monday)}`}
				actions={
					<>
						<Button
							type="button"
							variant="outline"
							onClick={() => setWeekAnchor(addDays(monday, -7))}
						>
							Semana anterior
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => setWeekAnchor(startOfWeekMonday(new Date()))}
						>
							Hoje
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setWeekAnchor(addDays(monday, 7))}
						>
							Próxima semana
						</Button>
						<Button type="button" onClick={() => openComposer(todayStr)}>
							+ Agendar
						</Button>
					</>
				}
			/>

			{composerOpen ? (
				<Card>
					<CardHeader>
						<CardTitle>Novo agendamento</CardTitle>
						<CardDescription>
							Duração padrão 50 min (ou do tipo). Sobreposição exige override.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{!patientsQuery.isLoading &&
						(patientsQuery.data?.length ?? 0) === 0 ? (
							<div className="md:col-span-2">
								<EmptyState
									title="Cadastre um paciente antes de agendar"
									description="A agenda precisa de ao menos um paciente ativo."
									action={
										<Button asChild size="sm">
											<Link href="/admin/patients/new">Novo paciente</Link>
										</Button>
									}
								/>
							</div>
						) : null}
						<Label
							label={{ text: "Paciente", required: true }}
							htmlFor="agenda-patient"
						>
							<select
								id="agenda-patient"
								className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
								value={patientId}
								onChange={(e) => onPatientChange(e.target.value)}
							>
								<option value="">Selecione…</option>
								{(patientsQuery.data ?? []).map((p) => (
									<option key={p.id} value={p.id}>
										{p.fullName}
									</option>
								))}
							</select>
						</Label>
						<Label
							label={{ text: "Tipo", required: true }}
							htmlFor="agenda-type"
						>
							<select
								id="agenda-type"
								className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
								value={serviceTypeId}
								onChange={(e) => applyServiceType(e.target.value)}
							>
								<option value="">Selecione…</option>
								{(typesQuery.data ?? [])
									.filter((t) => t.isActive)
									.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name}
										</option>
									))}
							</select>
						</Label>
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
							min={5}
							max={480}
							value={durationMinutes}
							onChange={(e) => setDurationMinutes(Number(e.target.value))}
						/>
						<Input
							label={{ text: "Valor (R$)", required: true }}
							type="number"
							min={0}
							step="0.01"
							value={valueBrl}
							onChange={(e) => setValueBrl(Number(e.target.value))}
						/>

						{pendingOverlap ? (
							<div className="md:col-span-2 space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3">
								<p className="text-sm font-medium text-amber-900">
									Existe sobreposição de horário. Para salvar mesmo assim,
									informe o motivo.
								</p>
								<Input
									label={{ text: "Motivo do override", required: true }}
									value={overlapReason}
									onChange={(e) => setOverlapReason(e.target.value)}
								/>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										disabled={
											createMutation.isPending || !overlapReason.trim()
										}
										onClick={() => createMutation.mutate(true)}
									>
										Salvar mesmo assim
									</Button>
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											setPendingOverlap(false);
											setOverlapReason("");
										}}
									>
										Ajustar horário
									</Button>
								</div>
							</div>
						) : null}

						<div className="flex flex-wrap gap-2 md:col-span-2">
							{!pendingOverlap ? (
								<Button
									type="button"
									disabled={
										createMutation.isPending ||
										!patientId ||
										!serviceTypeId ||
										!selectedDay ||
										!scheduledTime
									}
									onClick={() => createMutation.mutate(false)}
								>
									{createMutation.isPending ? "Salvando…" : "Salvar agendamento"}
								</Button>
							) : null}
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setComposerOpen(false);
									setPendingOverlap(false);
								}}
							>
								Cancelar
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}

			{weekQuery.isLoading ? (
				<div className="grid gap-3 md:grid-cols-7">
					{Array.from({ length: 7 }).map((_, i) => (
						<Skeleton key={i} className="h-48 w-full" />
					))}
				</div>
			) : weekQuery.isError ? (
				<ErrorState
					message={(weekQuery.error as Error).message}
					onRetry={() => weekQuery.refetch()}
				/>
			) : (
				<div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
					<div className="grid min-w-[640px] gap-3 md:min-w-0 md:grid-cols-7">
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
										items.map((s) => (
											<div
												key={s.id}
												className="border-border hover:border-brand rounded-md border-l-brand border border-l-4 bg-white p-2 shadow-xs transition-colors"
											>
												<Link
													href={`/admin/sessions/${s.id}`}
													className="block"
												>
													<p className="text-xs font-medium">
														{normalizeTime(String(s.scheduledTime)).slice(
															0,
															5
														)}{" "}
														· {s.durationMinutes}min
													</p>
													<p className="truncate text-sm">{s.patientName}</p>
													<p className="text-muted-foreground truncate text-xs">
														{s.serviceTypeName}
													</p>
													<Badge
														variant={statusVariant(s.status)}
														className="mt-1"
													>
														{STATUS_LABEL[s.status] ?? s.status}
													</Badge>
												</Link>
												{s.status === "scheduled" ? (
													<Button
														asChild
														size="xs"
														className="mt-2 w-full"
													>
														<Link
															href={`/admin/sessions/${s.id}?mode=clinical`}
														>
															INICIAR
														</Link>
													</Button>
												) : null}
											</div>
										))
									)}
								</div>
							</section>
						);
					})}
					</div>
				</div>
			)}
		</div>
	);
}
