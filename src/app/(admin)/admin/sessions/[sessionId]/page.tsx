"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/Textarea";
import { usePageTitle } from "@/hooks/usePageTitle";
import { normalizeTime, STATUS_LABEL } from "@/lib/sessions/agenda";

type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
};

type PatientOption = {
	id: string;
	fullName: string;
};

type PreviousClinical = {
	id: string;
	scheduledDate: string;
	scheduledTime: string;
	status: string;
	assessment: string | null;
	evolution: string | null;
	activities: string | null;
	serviceTypeName: string;
};

type SessionDetail = {
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
	audits: Array<{ id: string; editedAt: string; reason: string }>;
	previousClinical: PreviousClinical[];
};

async function fetchSession(id: string) {
	const res = await fetch(`/api/admin/sessions/${id}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar sessão.");
	return json.data as SessionDetail;
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

function SessionDetailInner({ sessionId }: { sessionId: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const clinicalRef = useRef<HTMLDivElement>(null);

	const modeParam = searchParams.get("mode");
	const [mode, setMode] = useState<"schedule" | "clinical">(
		modeParam === "clinical" ? "clinical" : "schedule"
	);

	const sessionQuery = useQuery({
		queryKey: ["session", sessionId],
		queryFn: () => fetchSession(sessionId)
	});
	const patientsQuery = useQuery({
		queryKey: ["patients", "", false],
		queryFn: fetchPatients
	});
	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes
	});

	usePageTitle(
		sessionQuery.data
			? `${sessionQuery.data.patientName} · sessão`
			: "Sessão"
	);

	const [patientId, setPatientId] = useState<string | null>(null);
	const [scheduledDate, setScheduledDate] = useState<string | null>(null);
	const [scheduledTime, setScheduledTime] = useState<string | null>(null);
	const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
	const [serviceTypeId, setServiceTypeId] = useState<string | null>(null);
	const [valueBrl, setValueBrl] = useState<number | null>(null);
	const [status, setStatus] = useState<SessionDetail["status"] | null>(null);
	const [reason, setReason] = useState("");
	const [overlapReason, setOverlapReason] = useState("");
	const [pendingOverlap, setPendingOverlap] = useState(false);

	const [assessment, setAssessment] = useState<string | null>(null);
	const [evolution, setEvolution] = useState<string | null>(null);
	const [activities, setActivities] = useState<string | null>(null);

	const s = sessionQuery.data;
	const formPatientId = patientId ?? s?.patientId ?? "";
	const formDate = scheduledDate ?? s?.scheduledDate ?? "";
	const formTime =
		scheduledTime ??
		(s ? normalizeTime(String(s.scheduledTime)).slice(0, 5) : "");
	const formDuration = durationMinutes ?? s?.durationMinutes ?? 50;
	const formServiceTypeId = serviceTypeId ?? s?.serviceTypeId ?? "";
	const formValue = valueBrl ?? (s ? Number(s.valueBrl) : 0);
	const formStatus = status ?? s?.status ?? "scheduled";
	const formAssessment = assessment ?? s?.assessment ?? "";
	const formEvolution = evolution ?? s?.evolution ?? "";
	const formActivities = activities ?? s?.activities ?? "";

	useEffect(() => {
		if (modeParam === "clinical") {
			setMode("clinical");
		}
	}, [modeParam]);

	useEffect(() => {
		if (mode !== "clinical") return;
		const t = window.setTimeout(() => {
			clinicalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
		return () => window.clearTimeout(t);
	}, [mode, sessionQuery.isSuccess]);

	function goClinical() {
		setMode("clinical");
		router.replace(`/admin/sessions/${sessionId}?mode=clinical`, {
			scroll: false
		});
	}

	const saveScheduleMutation = useMutation({
		mutationFn: async (allowOverlap: boolean) => {
			const res = await fetch(`/api/admin/sessions/${sessionId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					patientId: formPatientId,
					scheduledDate: formDate,
					scheduledTime: formTime,
					durationMinutes: formDuration,
					serviceTypeId: formServiceTypeId,
					valueBrl: formValue,
					status: formStatus,
					reason,
					allowOverlap,
					overlapReason: allowOverlap ? overlapReason : undefined
				})
			});
			const json = await res.json();
			if (res.status === 409 && json.error === "overlap") {
				return { overlap: true as const };
			}
			if (!res.ok) throw new Error(json.error || "Falha ao salvar.");
			return { overlap: false as const };
		},
		onSuccess: (result) => {
			if (result.overlap) {
				setPendingOverlap(true);
				toast.message("Há sobreposição. Confirme o override.");
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
			queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
			queryClient.invalidateQueries({ queryKey: ["records"] });
			toast.success("Agendamento atualizado.");
			setReason("");
			setPendingOverlap(false);
			setOverlapReason("");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const saveClinicalMutation = useMutation({
		mutationFn: async (complete: boolean) => {
			if (complete && !formEvolution.trim()) {
				throw new Error("Evolução é obrigatória para concluir o atendimento.");
			}
			const res = await fetch(`/api/admin/sessions/${sessionId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					assessment: formAssessment || null,
					evolution: formEvolution || null,
					activities: formActivities || null,
					status: complete ? "completed" : undefined,
					reason: complete
						? "Conclusão do atendimento"
						: "Registro clínico"
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar clínico.");
			return { complete };
		},
		onSuccess: ({ complete }) => {
			queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
			queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
			queryClient.invalidateQueries({ queryKey: ["records"] });
			queryClient.invalidateQueries({ queryKey: ["patient"] });
			toast.success(
				complete ? "Atendimento concluído." : "Registro clínico salvo."
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const canStart = s?.status === "scheduled";
	const clinicalLocked = s?.status === "canceled" || s?.status === "no_show";

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-medium">
							{s?.patientName ?? "Sessão"}
						</h1>
						{s ? (
							<Badge variant="outline">
								{STATUS_LABEL[s.status] ?? s.status}
							</Badge>
						) : null}
					</div>
					<p className="text-muted-foreground text-sm">
						{s
							? `${s.scheduledDate} · ${normalizeTime(String(s.scheduledTime)).slice(0, 5)} · ${s.serviceTypeName}`
							: "Carregando…"}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline">
						<Link href="/admin/agenda">Agenda</Link>
					</Button>
					{s ? (
						<Button asChild variant="secondary">
							<Link href={`/admin/patients/${s.patientId}`}>Paciente</Link>
						</Button>
					) : null}
					{canStart ? (
						<Button type="button" onClick={goClinical}>
							INICIAR
						</Button>
					) : null}
					{s ? (
						<Button asChild variant="ghost">
							<Link href={`/admin/agenda?patientId=${s.patientId}`}>
								Agendar retorno
							</Link>
						</Button>
					) : null}
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant={mode === "schedule" ? "default" : "outline"}
					onClick={() => {
						setMode("schedule");
						router.replace(`/admin/sessions/${sessionId}`, { scroll: false });
					}}
				>
					Agendamento
				</Button>
				<Button
					type="button"
					size="sm"
					variant={mode === "clinical" ? "default" : "outline"}
					onClick={goClinical}
				>
					Clínico
				</Button>
			</div>

			{mode === "schedule" ? (
				<Card>
					<CardHeader>
						<CardTitle>Dados do agendamento</CardTitle>
						<CardDescription>
							Edição exige motivo. Cancelado/Faltou não geram conflito de
							horário.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{sessionQuery.isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : sessionQuery.isError ? (
							<p className="text-destructive text-sm" role="alert">
								{(sessionQuery.error as Error).message}
							</p>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								<Label label={{ text: "Paciente", required: true }}>
									<select
										className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
										value={formPatientId}
										onChange={(e) => setPatientId(e.target.value)}
									>
										{(
											patientsQuery.data ?? [
												{ id: formPatientId, fullName: s!.patientName }
											]
										).map((p) => (
											<option key={p.id} value={p.id}>
												{p.fullName}
											</option>
										))}
									</select>
								</Label>
								<Label label={{ text: "Tipo", required: true }}>
									<select
										className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
										value={formServiceTypeId}
										onChange={(e) => {
											setServiceTypeId(e.target.value);
											const t = typesQuery.data?.find(
												(x) => x.id === e.target.value
											);
											if (t) {
												setDurationMinutes(t.defaultDurationMinutes);
												setValueBrl(Number(t.defaultValueBrl));
											}
										}}
									>
										{(typesQuery.data ?? []).map((t) => (
											<option key={t.id} value={t.id}>
												{t.name}
											</option>
										))}
									</select>
								</Label>
								<Input
									label={{ text: "Data", required: true }}
									type="date"
									value={formDate}
									onChange={(e) => setScheduledDate(e.target.value)}
								/>
								<Input
									label={{ text: "Horário", required: true }}
									type="time"
									value={formTime}
									onChange={(e) => setScheduledTime(e.target.value)}
								/>
								<Input
									label={{ text: "Duração (min)", required: true }}
									type="number"
									min={5}
									max={480}
									value={formDuration}
									onChange={(e) => setDurationMinutes(Number(e.target.value))}
								/>
								<Input
									label={{ text: "Valor (R$)", required: true }}
									type="number"
									min={0}
									step="0.01"
									value={formValue}
									onChange={(e) => setValueBrl(Number(e.target.value))}
								/>
								<Label label={{ text: "Status", required: true }}>
									<select
										className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
										value={formStatus}
										onChange={(e) =>
											setStatus(e.target.value as SessionDetail["status"])
										}
									>
										<option value="scheduled">Agendado</option>
										<option value="canceled">Cancelado</option>
										<option value="no_show">Faltou</option>
										<option value="completed" disabled>
											Realizado (via clínico)
										</option>
									</select>
								</Label>
								<div className="md:col-span-2">
									<Textarea
										label={{ text: "Motivo da edição", required: true }}
										rows={2}
										value={reason}
										onChange={(e) => setReason(e.target.value)}
									/>
								</div>

								{pendingOverlap ? (
									<div className="md:col-span-2 space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3">
										<p className="text-sm font-medium text-amber-900">
											Sobreposição detectada. Informe o motivo do override.
										</p>
										<Input
											label={{ text: "Motivo do override", required: true }}
											value={overlapReason}
											onChange={(e) => setOverlapReason(e.target.value)}
										/>
										<Button
											type="button"
											disabled={
												saveScheduleMutation.isPending ||
												!overlapReason.trim()
											}
											onClick={() => saveScheduleMutation.mutate(true)}
										>
											Salvar mesmo assim
										</Button>
									</div>
								) : null}

								<div className="flex flex-wrap gap-2 md:col-span-2">
									{!pendingOverlap ? (
										<Button
											type="button"
											disabled={
												saveScheduleMutation.isPending || !reason.trim()
											}
											onClick={() => saveScheduleMutation.mutate(false)}
										>
											{saveScheduleMutation.isPending
												? "Salvando…"
												: "Salvar"}
										</Button>
									) : null}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<>
					<Card ref={clinicalRef} id="clinical">
						<CardHeader>
							<CardTitle>Registro clínico</CardTitle>
							<CardDescription>
								Texto livre. Para concluir, a evolução é obrigatória.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{sessionQuery.isLoading ? (
								<div className="space-y-3">
									<Skeleton className="h-24 w-full" />
									<Skeleton className="h-24 w-full" />
								</div>
							) : (
								<>
									<Textarea
										label={{ text: "Avaliação" }}
										rows={5}
										disabled={clinicalLocked}
										value={formAssessment}
										onChange={(e) => setAssessment(e.target.value)}
									/>
									<Textarea
										label={{ text: "Evolução", required: true }}
										rows={5}
										disabled={clinicalLocked}
										value={formEvolution}
										onChange={(e) => setEvolution(e.target.value)}
										helperText="Obrigatória para marcar como realizado."
									/>
									<Textarea
										label={{ text: "Atividades / condutas" }}
										rows={4}
										disabled={clinicalLocked}
										value={formActivities}
										onChange={(e) => setActivities(e.target.value)}
									/>
									{clinicalLocked ? (
										<p className="text-muted-foreground text-sm">
											Sessão cancelada ou com falta — registro clínico
											bloqueado.
										</p>
									) : (
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="secondary"
												disabled={saveClinicalMutation.isPending}
												onClick={() => saveClinicalMutation.mutate(false)}
											>
												Salvar rascunho
											</Button>
											{s?.status !== "completed" ? (
												<Button
													type="button"
													disabled={
														saveClinicalMutation.isPending ||
														!formEvolution.trim()
													}
													onClick={() => {
														const ok = window.confirm(
															"Concluir atendimento? Status passará para Realizado."
														);
														if (ok) saveClinicalMutation.mutate(true);
													}}
												>
													Concluir atendimento
												</Button>
											) : (
												<Button
													type="button"
													disabled={saveClinicalMutation.isPending}
													onClick={() => saveClinicalMutation.mutate(false)}
												>
													Salvar alterações
												</Button>
											)}
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Histórico clínico anterior</CardTitle>
							<CardDescription>
								Últimos registros deste paciente (outras sessões).
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!s?.previousClinical?.length ? (
								<p className="text-muted-foreground text-sm">
									Nenhum histórico anterior.
								</p>
							) : (
								<ul className="space-y-4">
									{s.previousClinical.map((prev) => (
										<li
											key={prev.id}
											className="border-border rounded-md border p-3"
										>
											<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
												<p className="text-sm font-medium">
													{prev.scheduledDate} ·{" "}
													{normalizeTime(String(prev.scheduledTime)).slice(
														0,
														5
													)}{" "}
													· {prev.serviceTypeName}
												</p>
												<div className="flex items-center gap-2">
													<Badge variant="secondary">
														{STATUS_LABEL[prev.status] ?? prev.status}
													</Badge>
													<Button asChild variant="ghost" size="sm">
														<Link
															href={`/admin/sessions/${prev.id}?mode=clinical`}
														>
															Abrir
														</Link>
													</Button>
												</div>
											</div>
											{prev.evolution ? (
												<p className="text-sm whitespace-pre-wrap">
													<span className="text-muted-foreground">
														Evolução:{" "}
													</span>
													{prev.evolution}
												</p>
											) : (
												<p className="text-muted-foreground text-sm">
													Sem evolução registrada.
												</p>
											)}
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Auditoria recente</CardTitle>
					<CardDescription>Append-only — sem exclusão.</CardDescription>
				</CardHeader>
				<CardContent>
					{!s?.audits.length ? (
						<p className="text-muted-foreground text-sm">
							Nenhuma edição registrada ainda.
						</p>
					) : (
						<ul className="divide-border divide-y">
							{s.audits.map((a) => (
								<li key={a.id} className="py-2 text-sm">
									<p className="font-medium">{a.reason}</p>
									<p className="text-muted-foreground text-xs">
										{new Date(a.editedAt).toLocaleString("pt-BR")}
									</p>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function SessionDetailPage({
	params
}: {
	params: Promise<{ sessionId: string }>;
}) {
	const { sessionId } = use(params);

	return (
		<Suspense
			fallback={
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-48 w-full" />
				</div>
			}
		>
			<SessionDetailInner sessionId={sessionId} />
		</Suspense>
	);
}
