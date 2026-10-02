"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OverlapConfirmDialog } from "@/components/admin/OverlapConfirmDialog";
import { ErrorState } from "@/components/admin/PageStates";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "@/components/ui/AlertDialog";
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
import { Select } from "@/components/ui/Select";
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
	const [mode, setMode] = useState<"schedule" | "clinical" | "finance">(
		modeParam === "clinical"
			? "clinical"
			: modeParam === "finance"
				? "finance"
				: "schedule"
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
	const [paid, setPaid] = useState<boolean | null>(null);
	const [paidAt, setPaidAt] = useState<string | null>(null);
	const [invoiceIssued, setInvoiceIssued] = useState<boolean | null>(null);
	const [financeReason, setFinanceReason] = useState("");
	const [financeValue, setFinanceValue] = useState<number | null>(null);

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
	const formPaid = paid ?? s?.paid ?? false;
	const formPaidAt = paidAt ?? s?.paidAt ?? "";
	const formInvoice = invoiceIssued ?? s?.invoiceIssued ?? false;
	const formFinanceValue = financeValue ?? (s ? Number(s.valueBrl) : 0);

	useEffect(() => {
		if (modeParam === "clinical") setMode("clinical");
		if (modeParam === "finance") setMode("finance");
	}, [modeParam]);

	useEffect(() => {
		if (mode !== "clinical") return;
		const t = window.setTimeout(() => {
			clinicalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
		return () => window.clearTimeout(t);
	}, [mode, sessionQuery.isSuccess]);

	function setModeUrl(next: "schedule" | "clinical" | "finance") {
		setMode(next);
		const qs = next === "schedule" ? "" : `?mode=${next}`;
		router.replace(`/admin/sessions/${sessionId}${qs}`, { scroll: false });
	}

	function goClinical() {
		setModeUrl("clinical");
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
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			queryClient.invalidateQueries({ queryKey: ["patient"] });
			toast.success(
				complete ? "Atendimento concluído." : "Registro clínico salvo."
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const saveFinanceMutation = useMutation({
		mutationFn: async () => {
			if (formPaid && !formPaidAt) {
				throw new Error("Informe a data de pagamento.");
			}
			if (!financeReason.trim()) {
				throw new Error("Informe o motivo da alteração financeira.");
			}
			const res = await fetch(`/api/admin/sessions/${sessionId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					valueBrl: formFinanceValue,
					paid: formPaid,
					paidAt: formPaid ? formPaidAt : null,
					invoiceIssued: formInvoice,
					reason: financeReason.trim()
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar pagamento.");
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			queryClient.invalidateQueries({ queryKey: ["records"] });
			queryClient.invalidateQueries({ queryKey: ["patient"] });
			toast.success("Dados financeiros salvos.");
			setFinanceReason("");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const canStart = s?.status === "scheduled";
	const clinicalLocked = s?.status === "canceled" || s?.status === "no_show";

	if (sessionQuery.isError) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h1 className="text-2xl font-medium">Sessão</h1>
						<p className="text-muted-foreground text-sm">
							Não foi possível carregar este atendimento.
						</p>
					</div>
					<Button asChild variant="outline">
						<Link href="/admin/agenda">Voltar à agenda</Link>
					</Button>
				</div>
				<ErrorState
					message={(sessionQuery.error as Error).message}
					onRetry={() => sessionQuery.refetch()}
				/>
			</div>
		);
	}

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
						<Button
							type="button"
							variant="secondary"
							onClick={async () => {
								try {
									const res = await fetch(
										`/api/admin/patients/${s.patientId}/pdf`
									);
									const json = await res.json();
									if (!res.ok) throw new Error(json.error || "Falha no PDF.");
									const { downloadPatientHistoryPdf } = await import(
										"@/lib/pdf/patient-history"
									);
									downloadPatientHistoryPdf(json.data);
									toast.success("PDF gerado.");
								} catch (err) {
									toast.error(
										err instanceof Error ? err.message : "Falha no PDF."
									);
								}
							}}
						>
							Exportar PDF
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

			<div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-9"
					variant={mode === "schedule" ? "default" : "outline"}
					onClick={() => setModeUrl("schedule")}
				>
					Agenda
				</Button>
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-9"
					variant={mode === "clinical" ? "default" : "outline"}
					onClick={goClinical}
				>
					Clínico
				</Button>
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-9"
					variant={mode === "finance" ? "default" : "outline"}
					onClick={() => setModeUrl("finance")}
				>
					Financeiro
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
						) : (
							<div className="grid gap-4 sm:grid-cols-2">
								<Select
									label={{ text: "Paciente", required: true }}
									value={formPatientId}
									onChange={(e) => setPatientId(e.target.value)}
									options={(
										patientsQuery.data ?? [
											{ id: formPatientId, fullName: s!.patientName }
										]
									).map((p) => ({
										value: p.id,
										label: p.fullName
									}))}
								/>
								<Select
									label={{ text: "Tipo", required: true }}
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
									options={(typesQuery.data ?? []).map((t) => ({
										value: t.id,
										label: t.name
									}))}
								/>
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
									inputMode="numeric"
									min={5}
									max={480}
									value={formDuration}
									onChange={(e) => setDurationMinutes(Number(e.target.value))}
								/>
								<Input
									label={{ text: "Valor (R$)", required: true }}
									type="number"
									inputMode="decimal"
									min={0}
									step="0.01"
									value={formValue}
									onChange={(e) => setValueBrl(Number(e.target.value))}
								/>
								<Select
									label={{ text: "Status", required: true }}
									value={formStatus}
									onChange={(e) =>
										setStatus(e.target.value as SessionDetail["status"])
									}
									options={[
										{ value: "scheduled", label: "Agendado" },
										{ value: "canceled", label: "Cancelado" },
										{ value: "no_show", label: "Faltou" },
										{
											value: "completed",
											label: "Realizado (via clínico)",
											disabled: formStatus !== "completed"
										}
									]}
								/>
								<div className="sm:col-span-2">
									<Textarea
										label={{ text: "Motivo da edição", required: true }}
										rows={2}
										value={reason}
										onChange={(e) => setReason(e.target.value)}
									/>
								</div>

								<div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t px-4 py-3 sm:static sm:bottom-0 sm:col-span-2 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 md:bottom-0">
									<Button
										type="button"
										className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
										disabled={
											saveScheduleMutation.isPending || !reason.trim()
										}
										onClick={() => saveScheduleMutation.mutate(false)}
									>
										{saveScheduleMutation.isPending
											? "Salvando…"
											: "Salvar"}
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			) : mode === "clinical" ? (
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
										<div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t px-4 py-3 sm:static sm:bottom-0 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
											<Button
												type="button"
												variant="secondary"
												className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
												disabled={saveClinicalMutation.isPending}
												onClick={() => saveClinicalMutation.mutate(false)}
											>
												Salvar rascunho
											</Button>
											{s?.status !== "completed" ? (
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															type="button"
															className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
															disabled={
																saveClinicalMutation.isPending ||
																!formEvolution.trim()
															}
														>
															Concluir atendimento
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Concluir atendimento?
															</AlertDialogTitle>
															<AlertDialogDescription>
																O status passará para Realizado. A evolução
																já preenchida será salva.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancelar</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	saveClinicalMutation.mutate(true)
																}
															>
																Concluir
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
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
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Pagamento</CardTitle>
						<CardDescription>
							Valor, pago, data de pagamento e flag de NFS-e. Motivo obrigatório.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid max-w-xl gap-4">
						{sessionQuery.isLoading ? (
							<Skeleton className="h-24 w-full" />
						) : (
							<>
								<Input
									label={{ text: "Valor (R$)", required: true }}
									type="number"
									min={0}
									step="0.01"
									value={formFinanceValue}
									onChange={(e) => setFinanceValue(Number(e.target.value))}
								/>
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										className="border-input size-4 rounded"
										checked={formPaid}
										onChange={(e) => {
											setPaid(e.target.checked);
											if (e.target.checked && !formPaidAt) {
												setPaidAt(new Date().toISOString().slice(0, 10));
											}
										}}
									/>
									Pago
								</label>
								{formPaid ? (
									<Input
										label={{ text: "Data do pagamento", required: true }}
										type="date"
										value={formPaidAt}
										onChange={(e) => setPaidAt(e.target.value)}
									/>
								) : null}
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										className="border-input size-4 rounded"
										checked={formInvoice}
										onChange={(e) => setInvoiceIssued(e.target.checked)}
									/>
									NFS-e emitida
								</label>
								<Textarea
									label={{ text: "Motivo da alteração", required: true }}
									rows={2}
									value={financeReason}
									onChange={(e) => setFinanceReason(e.target.value)}
								/>
								<div>
									<Button
										type="button"
										disabled={
											saveFinanceMutation.isPending || !financeReason.trim()
										}
										onClick={() => saveFinanceMutation.mutate()}
									>
										{saveFinanceMutation.isPending
											? "Salvando…"
											: "Salvar pagamento"}
									</Button>
								</div>
							</>
						)}
					</CardContent>
				</Card>
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

			<OverlapConfirmDialog
				open={pendingOverlap}
				reason={overlapReason}
				pending={saveScheduleMutation.isPending}
				onReasonChange={setOverlapReason}
				onConfirm={() => saveScheduleMutation.mutate(true)}
				onCancel={() => {
					setPendingOverlap(false);
					setOverlapReason("");
				}}
			/>
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
