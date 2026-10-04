"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import OverlapConfirmDialog, {
	type OverlapConflict
} from "@/components/admin/OverlapConfirmDialog";
import { ErrorState, PageHeader } from "@/components/admin/PageStates";
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
import {
	sessionClinicalFormSchema,
	sessionFinanceFormSchema,
	sessionScheduleFormSchema
} from "@/lib/sessions/schema";
import { zodFieldErrors } from "@/lib/zod-utils";

import SessionAuditCard from "./components/SessionAuditCard";
import { usePatientOptionsQuery } from "@/queries/patientQuery";
import {
	useSessionQuery,
	useUpdateSessionMutation
} from "@/queries/sessionQuery";
import { useServiceTypesQuery } from "@/queries/serviceTypeQuery";

import type { FC, ReactNode } from "react";
import type { SessionDetail, SessionMode } from "./types";

type SessionDetailClientProps = {
	sessionId: string;
};

const SessionDetailClient: FC<SessionDetailClientProps> = (props) => {
	const { sessionId } = props;
	const router = useRouter();
	const searchParams = useSearchParams();
	const modeParam = searchParams.get("mode");
	const [mode, setMode] = useState<SessionMode>(
		modeParam === "clinical"
			? "clinical"
			: modeParam === "finance"
				? "finance"
				: "schedule"
	);

	const sessionQuery = useSessionQuery(sessionId);
	const updateMutation = useUpdateSessionMutation(sessionId);
	const [patientFilter, setPatientFilter] = useState("");
	const [debouncedPatientQ, setDebouncedPatientQ] = useState("");

	useEffect(() => {
		const t = setTimeout(() => setDebouncedPatientQ(patientFilter), 250);
		return () => clearTimeout(t);
	}, [patientFilter]);

	const patientsQuery = usePatientOptionsQuery(debouncedPatientQ);
	const typesQuery = useServiceTypesQuery();

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
	const [overlapConflicts, setOverlapConflicts] = useState<OverlapConflict[]>(
		[]
	);
	const [scheduleErrors, setScheduleErrors] = useState<
		Record<string, string | undefined>
	>({});
	const [clinicalErrors, setClinicalErrors] = useState<
		Record<string, string | undefined>
	>({});
	const [financeErrors, setFinanceErrors] = useState<
		Record<string, string | undefined>
	>({});

	const [assessment, setAssessment] = useState<string | null>(null);
	const [evolution, setEvolution] = useState<string | null>(null);
	const [activities, setActivities] = useState<string | null>(null);
	const [paid, setPaid] = useState<boolean | null>(null);
	const [paidAt, setPaidAt] = useState<string | null>(null);
	const [invoiceIssued, setInvoiceIssued] = useState<boolean | null>(null);
	const [financeReason, setFinanceReason] = useState("");
	const [financeValue, setFinanceValue] = useState<number | null>(null);
	const [pdfPending, setPdfPending] = useState(false);

	const s = sessionQuery.data;
	const formPatientId = patientId ?? s?.patientId ?? "";

	const patientSelectOptions = useMemo(() => {
		const list = patientsQuery.data ?? [];
		const currentName = s?.patientName;
		if (
			formPatientId &&
			currentName &&
			!list.some((p) => p.id === formPatientId)
		) {
			return [{ id: formPatientId, fullName: currentName }, ...list];
		}
		if (list.length > 0) return list;
		if (formPatientId && currentName) {
			return [{ id: formPatientId, fullName: currentName }];
		}
		return [];
	}, [patientsQuery.data, formPatientId, s?.patientName]);
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

	const setModeUrl = (next: SessionMode) => {
		setMode(next);
		const qs = next === "schedule" ? "" : `?mode=${next}`;
		router.replace(`/admin/sessions/${sessionId}${qs}`, { scroll: false });
	};

	const goClinical = () => {
		setModeUrl("clinical");
	};

	const validateSchedule = () => {
		const parsed = sessionScheduleFormSchema.safeParse({
			patientId: formPatientId,
			scheduledDate: formDate,
			scheduledTime: formTime,
			durationMinutes: formDuration,
			serviceTypeId: formServiceTypeId,
			valueBrl: formValue,
			status: formStatus,
			reason
		});
		if (!parsed.success) {
			setScheduleErrors(zodFieldErrors(parsed.error));
			return null;
		}
		setScheduleErrors({});
		return parsed.data;
	};

	const saveSchedule = (allowOverlap: boolean) => {
		const data = validateSchedule();
		if (!data) {
			toast.error("Corrija os campos destacados.");
			return;
		}
		if (allowOverlap && !overlapReason.trim()) {
			toast.error("Informe o motivo do override de sobreposição.");
			return;
		}
		updateMutation.mutate(
			{
				...data,
				allowOverlap,
				overlapReason: allowOverlap ? overlapReason : undefined
			},
			{
				onSuccess: (result) => {
					if (result.kind === "overlap") {
						setOverlapConflicts(result.conflicts);
						setPendingOverlap(true);
						toast.message("Há sobreposição. Confirme o override.");
						return;
					}
					if (result.googleSync?.status === "error") {
						toast.warning(
							`Salvo, mas Google Agenda falhou: ${result.googleSync.message}`
						);
					} else {
						toast.success("Agendamento atualizado.");
					}
					setReason("");
					setPendingOverlap(false);
					setOverlapReason("");
					setOverlapConflicts([]);
					setScheduleErrors({});
				},
				onError: (err: Error) => toast.error(err.message)
			}
		);
	};

	const saveClinical = (complete: boolean) => {
		const parsed = sessionClinicalFormSchema.safeParse({
			assessment: formAssessment,
			evolution: formEvolution,
			activities: formActivities,
			complete
		});
		if (!parsed.success) {
			setClinicalErrors(zodFieldErrors(parsed.error));
			toast.error("Corrija os campos destacados.");
			return;
		}
		setClinicalErrors({});
		updateMutation.mutate(
			{
				assessment: parsed.data.assessment || null,
				evolution: parsed.data.evolution || null,
				activities: parsed.data.activities || null,
				status: complete ? "completed" : undefined,
				reason: complete ? "Conclusão do atendimento" : "Registro clínico",
				allowOverlap: false
			},
			{
				onSuccess: (result) => {
					if (result.kind === "overlap") return;
					toast.success(
						complete ? "Atendimento concluído." : "Registro clínico salvo."
					);
					if (result.googleSync?.status === "error") {
						toast.warning(`Google Agenda: ${result.googleSync.message}`);
					}
				},
				onError: (err: Error) => toast.error(err.message)
			}
		);
	};

	const saveFinance = () => {
		const parsed = sessionFinanceFormSchema.safeParse({
			valueBrl: formFinanceValue,
			paid: formPaid,
			paidAt: formPaidAt,
			invoiceIssued: formInvoice,
			reason: financeReason
		});
		if (!parsed.success) {
			setFinanceErrors(zodFieldErrors(parsed.error));
			toast.error("Corrija os campos destacados.");
			return;
		}
		setFinanceErrors({});
		updateMutation.mutate(
			{
				valueBrl: parsed.data.valueBrl,
				paid: parsed.data.paid,
				paidAt: parsed.data.paid ? parsed.data.paidAt : null,
				invoiceIssued: parsed.data.invoiceIssued,
				reason: parsed.data.reason,
				allowOverlap: false
			},
			{
				onSuccess: (result) => {
					if (result.kind === "overlap") return;
					toast.success("Dados financeiros salvos.");
					setFinanceReason("");
					setFinanceErrors({});
				},
				onError: (err: Error) => toast.error(err.message)
			}
		);
	};

	const canStart = s?.status === "scheduled";
	const clinicalLocked = s?.status === "canceled" || s?.status === "no_show";

	if (sessionQuery.isError) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Sessão"
					description="Não foi possível carregar este atendimento."
					backHref="/admin/agenda"
					backLabel="Voltar para a agenda"
				/>
				<ErrorState
					message={(sessionQuery.error as Error).message}
					onRetry={() => sessionQuery.refetch()}
				/>
			</div>
		);
	}

	const sessionTitle = (
		<span className="inline-flex flex-wrap items-center gap-2">
			{s?.patientName ?? "Sessão"}
			{s && (
				<Badge variant="outline">
					{STATUS_LABEL[s.status] ?? s.status}
				</Badge>
			)}
			{s?.googleEventId && (
				<Badge variant="secondary">No Google Agenda</Badge>
			)}
		</span>
	);

	// Ordem: ação principal → próximo passo → navegação → utilitário
	const sessionActions = (
		<>
			{canStart && (
				<Button type="button" onClick={goClinical}>
					INICIAR
				</Button>
			)}
			{s && (
				<Button asChild variant="secondary">
					<Link href={`/admin/agenda?patientId=${s.patientId}`}>
						Agendar retorno
					</Link>
				</Button>
			)}
			{s && (
				<Button asChild variant="outline">
					<Link href={`/admin/patients/${s.patientId}`}>Paciente</Link>
				</Button>
			)}
			{s && (
				<Button
					type="button"
					variant="ghost"
					disabled={pdfPending}
					onClick={async () => {
						setPdfPending(true);
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
						} finally {
							setPdfPending(false);
						}
					}}
				>
					{pdfPending ? "Gerando PDF…" : "Exportar PDF"}
				</Button>
			)}
		</>
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={sessionTitle}
				description={
					s
						? `${s.scheduledDate} · ${normalizeTime(String(s.scheduledTime)).slice(0, 5)} · ${s.serviceTypeName}`
						: "Carregando…"
				}
				backHref="/admin/agenda"
				backLabel="Voltar para a agenda"
				actions={sessionActions}
			/>

			<div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
				<Button
					type="button"
					size="sm"
					className="min-h-11 sm:min-h-9"
					variant={mode === "schedule" ? "default" : "outline"}
					onClick={() => setModeUrl("schedule")}
				>
					Agendamento
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
								<div className="space-y-2 sm:col-span-2">
									<Input
										label={{ text: "Buscar paciente" }}
										placeholder="Nome, telefone ou CPF…"
										value={patientFilter}
										onChange={(e) => setPatientFilter(e.target.value)}
									/>
									<Select
										label={{ text: "Paciente", required: true }}
										value={formPatientId}
										error={scheduleErrors.patientId}
										onChange={(e) => setPatientId(e.target.value)}
										placeholder={
											patientsQuery.isFetching ? "Buscando…" : "Selecione…"
										}
										options={patientSelectOptions.map((p) => ({
											value: p.id,
											label: p.fullName
										}))}
									/>
								</div>
								<Select
									label={{ text: "Tipo", required: true }}
									value={formServiceTypeId}
									error={scheduleErrors.serviceTypeId}
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
									error={scheduleErrors.scheduledDate}
									onChange={(e) => setScheduledDate(e.target.value)}
								/>
								<Input
									label={{ text: "Horário", required: true }}
									type="time"
									value={formTime}
									error={scheduleErrors.scheduledTime}
									onChange={(e) => setScheduledTime(e.target.value)}
								/>
								<Input
									label={{ text: "Duração (min)", required: true }}
									type="number"
									inputMode="numeric"
									min={5}
									max={480}
									value={formDuration}
									error={scheduleErrors.durationMinutes}
									onChange={(e) => setDurationMinutes(Number(e.target.value))}
								/>
								<Input
									label={{ text: "Valor (R$)", required: true }}
									type="number"
									inputMode="decimal"
									min={0}
									step="0.01"
									value={formValue}
									error={scheduleErrors.valueBrl}
									onChange={(e) => setValueBrl(Number(e.target.value))}
								/>
								<Select
									label={{ text: "Status", required: true }}
									value={formStatus}
									error={scheduleErrors.status}
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
										error={scheduleErrors.reason}
										onChange={(e) => setReason(e.target.value)}
									/>
								</div>

								<div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t px-4 py-3 sm:static sm:bottom-0 sm:col-span-2 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 md:bottom-0">
									<Button
										type="button"
										className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
										disabled={updateMutation.isPending}
										onClick={() => saveSchedule(false)}
									>
										{updateMutation.isPending
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
					<Card>
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
										error={clinicalErrors.assessment}
										onChange={(e) => setAssessment(e.target.value)}
									/>
									<Textarea
										label={{ text: "Evolução", required: true }}
										rows={5}
										disabled={clinicalLocked}
										value={formEvolution}
										error={clinicalErrors.evolution}
										onChange={(e) => setEvolution(e.target.value)}
										helperText="Obrigatória para marcar como realizado."
									/>
									<Textarea
										label={{ text: "Atividades / condutas" }}
										rows={4}
										disabled={clinicalLocked}
										value={formActivities}
										error={clinicalErrors.activities}
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
												disabled={updateMutation.isPending}
												onClick={() => saveClinical(false)}
											>
												Salvar rascunho
											</Button>
											{s?.status !== "completed" ? (
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															type="button"
															className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
															disabled={updateMutation.isPending}
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
																onClick={() => saveClinical(true)}
															>
																Concluir
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											) : (
												<Button
													type="button"
													disabled={updateMutation.isPending}
													onClick={() => saveClinical(false)}
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
															Ver
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
									error={financeErrors.valueBrl}
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
										error={financeErrors.paidAt}
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
									error={financeErrors.reason}
									onChange={(e) => setFinanceReason(e.target.value)}
								/>
								<div>
									<Button
										type="button"
										disabled={updateMutation.isPending}
										onClick={() => saveFinance()}
									>
										{updateMutation.isPending
											? "Salvando…"
											: "Salvar pagamento"}
									</Button>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}

			<SessionAuditCard session={s} />

			<OverlapConfirmDialog
				open={pendingOverlap}
				reason={overlapReason}
				pending={updateMutation.isPending}
				conflicts={overlapConflicts}
				onReasonChange={setOverlapReason}
				onConfirm={() => saveSchedule(true)}
				onCancel={() => {
					setPendingOverlap(false);
					setOverlapReason("");
					setOverlapConflicts([]);
				}}
			/>
		</div>
	);
};

export default SessionDetailClient;
