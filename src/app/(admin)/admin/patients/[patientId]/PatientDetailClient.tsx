"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AdminList, AdminListItem } from "@/components/admin/AdminList";
import { ErrorState, PageHeader } from "@/components/admin/PageStates";
import PatientForm from "@/components/patients/PatientForm";
import PatientSummary from "@/components/patients/PatientSummary";
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
import { buttonVariants } from "@/components/ui/Button/variants";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { usePageTitle } from "@/hooks/usePageTitle";
import { downloadPatientHistoryPdf } from "@/lib/pdf/patient-history";
import {
	patientToFormValues,
	type PatientFormParsed
} from "@/lib/patients/schema";
import {
	formatBrl,
	sessionPaymentStatus,
	SESSION_PAYMENT_STATUS_LABEL
} from "@/lib/payments/money";
import {
	patientPaymentSchema,
	paymentRefundSchema
} from "@/lib/payments/schema";
import { zodFieldErrors } from "@/lib/zod-utils";
import {
	useArchivePatientMutation,
	useDeletePatientMutation,
	usePatientPaymentMutation,
	usePatientPaymentRefundMutation,
	usePatientPaymentsQuery,
	usePatientPdfMutation,
	usePatientQuery,
	useUpdatePatientMutation
} from "@/queries/patientQuery";
import { useServiceTypesQuery } from "@/queries/serviceTypeQuery";

import type { FC } from "react";

type PatientDetailClientProps = {
	patientId: string;
};

const STATUS_LABEL: Record<string, string> = {
	scheduled: "Agendado",
	completed: "Realizado",
	canceled: "Cancelado",
	no_show: "Faltou"
};

const PatientDetailClient: FC<PatientDetailClientProps> = (props) => {
	const { patientId } = props;
	const router = useRouter();
	const searchParams = useSearchParams();

	const isEditing = searchParams.get("mode") === "edit";

	const setMode = (mode: "view" | "edit") => {
		const url =
			mode === "edit"
				? `/admin/patients/${patientId}?mode=edit`
				: `/admin/patients/${patientId}`;
		router.replace(url);
	};

	const patientQuery = usePatientQuery(patientId);
	const paymentsQuery = usePatientPaymentsQuery(patientId, {
		enabled: !isEditing
	});

	const typesQuery = useServiceTypesQuery({ enabled: isEditing });

	const [paymentOpen, setPaymentOpen] = useState(false);
	const [paymentAmount, setPaymentAmount] = useState("");
	const [paymentPaidAt, setPaymentPaidAt] = useState(
		() => new Date().toISOString().slice(0, 10)
	);
	const [paymentNote, setPaymentNote] = useState("");
	const [paymentErrors, setPaymentErrors] = useState<
		Record<string, string | undefined>
	>({});

	const [refundOpen, setRefundOpen] = useState(false);
	const [refundAmount, setRefundAmount] = useState("");
	const [refundNote, setRefundNote] = useState("");
	const [refundErrors, setRefundErrors] = useState<
		Record<string, string | undefined>
	>({});

	const pendingValue = Number(
		patientQuery.data?.stats.pendingValueBrl ?? 0
	);
	const totalRefundable = Number(
		paymentsQuery.data?.totalRefundableBrl ?? 0
	);
	const ledgerEntries = paymentsQuery.data?.entries ?? [];

	usePageTitle(
		isEditing
			? `Editar · ${patientQuery.data?.fullName || "Paciente"}`
			: patientQuery.data?.fullName || "Paciente"
	);

	const saveMutation = useUpdatePatientMutation(patientId, {
		onSuccess: () => {
			toast.success("Paciente atualizado.");
			setMode("view");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const [deleteConfirmName, setDeleteConfirmName] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);

	const archiveMutation = useArchivePatientMutation(patientId, {
		onSuccess: (data) => {
			toast.success(
				data.archivedAt ? "Paciente arquivado." : "Paciente restaurado."
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const deleteMutation = useDeletePatientMutation(patientId, {
		onSuccess: (data) => {
			const extra =
				data.deletedSessions > 0
					? ` ${data.deletedSessions} atendimento(s) também foram excluídos.`
					: "";
			toast.success(`Paciente excluído.${extra}`);
			router.replace("/admin/patients");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const pdfMutation = usePatientPdfMutation(patientId, {
		onSuccess: (data) => {
			downloadPatientHistoryPdf(data);
			toast.success("PDF gerado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const paymentMutation = usePatientPaymentMutation(patientId, {
		onSuccess: (data) => {
			toast.success(
				`Pagamento de ${formatBrl(data.amountBrl)} registrado.`
			);
			setPaymentOpen(false);
			setPaymentAmount("");
			setPaymentNote("");
			setPaymentPaidAt(new Date().toISOString().slice(0, 10));
			setPaymentErrors({});
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const refundMutation = usePatientPaymentRefundMutation(patientId, {
		onSuccess: (data) => {
			toast.success(`Estorno de ${formatBrl(data.amountBrl)} registrado.`);
			setRefundOpen(false);
			setRefundAmount("");
			setRefundNote("");
			setRefundErrors({});
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const openRefund = () => {
		if (totalRefundable <= 0) return;
		setRefundAmount(
			totalRefundable % 1 === 0
				? String(totalRefundable)
				: totalRefundable.toFixed(2)
		);
		setRefundNote("");
		setRefundErrors({});
		setRefundOpen(true);
	};

	const submitPatientPayment = () => {
		const parsed = patientPaymentSchema.safeParse({
			amountBrl: paymentAmount,
			paidAt: paymentPaidAt,
			note: paymentNote || undefined
		});
		if (!parsed.success) {
			setPaymentErrors(zodFieldErrors(parsed.error));
			toast.error("Corrija os campos destacados.");
			return;
		}
		if (parsed.data.amountBrl > pendingValue + 0.001) {
			setPaymentErrors({
				amountBrl: "Valor maior que o saldo a receber."
			});
			toast.error("Valor maior que o saldo a receber.");
			return;
		}
		setPaymentErrors({});
		paymentMutation.mutate(parsed.data);
	};

	const submitRefund = () => {
		const parsed = paymentRefundSchema.safeParse({
			amountBrl: refundAmount,
			note: refundNote || undefined
		});
		if (!parsed.success) {
			setRefundErrors(zodFieldErrors(parsed.error));
			toast.error("Corrija os campos destacados.");
			return;
		}
		if (parsed.data.amountBrl > totalRefundable + 0.001) {
			setRefundErrors({
				amountBrl: "Valor maior que o total que ainda pode ser estornado."
			});
			toast.error("Valor maior que o total que ainda pode ser estornado.");
			return;
		}
		setRefundErrors({});
		refundMutation.mutate(parsed.data);
	};

	const archived = Boolean(patientQuery.data?.archivedAt);
	const patientName = patientQuery.data?.fullName ?? "";
	const sessionCount = patientQuery.data?.stats.sessionCount ?? 0;
	const deleteNameMatches =
		deleteConfirmName.trim().toLowerCase() === patientName.trim().toLowerCase();
	const archiveDialogDescription = archived
		? "O paciente voltará para a lista ativa e poderá ser agendado."
		: "Ele sairá da lista ativa e não poderá ser agendado até ser restaurado.";

	if (patientQuery.isError) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Paciente"
					description="Não foi possível carregar o cadastro."
					backHref="/admin/patients"
					backLabel="Voltar para pacientes"
				/>
				<ErrorState
					message={(patientQuery.error as Error).message}
					onRetry={() => patientQuery.refetch()}
				/>
			</div>
		);
	}

	const patientLoaded = !patientQuery.isLoading && patientQuery.data;
	const editFormReady =
		isEditing &&
		patientLoaded &&
		!archived &&
		!typesQuery.isLoading &&
		typesQuery.data;

	const headerActions = (
		<>
			{isEditing && (
				<Button
					type="button"
					variant="outline"
					onClick={() => setMode("view")}
					disabled={saveMutation.isPending}
				>
					Cancelar
				</Button>
			)}
			{!isEditing && (
				<>
					{!archived && (
						<Button type="button" onClick={() => setMode("edit")}>
							Editar
						</Button>
					)}
					{!archived && (
						<Button asChild variant="secondary">
							<Link href={`/admin/agenda?patientId=${patientId}`}>
								Agendar
							</Link>
						</Button>
					)}
					<Button
						type="button"
						variant="secondary"
						disabled={pdfMutation.isPending}
						onClick={() => pdfMutation.mutate()}
					>
						{pdfMutation.isPending ? "Gerando PDF…" : "Exportar PDF"}
					</Button>
					{archived ? (
						<Button
							type="button"
							variant="outline"
							disabled={archiveMutation.isPending}
							onClick={() => archiveMutation.mutate(false)}
						>
							Restaurar
						</Button>
					) : (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									disabled={archiveMutation.isPending}
								>
									Arquivar
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Arquivar paciente?</AlertDialogTitle>
									<AlertDialogDescription>
										{archiveDialogDescription}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => archiveMutation.mutate(true)}
									>
										Arquivar
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
					<AlertDialog
						open={deleteOpen}
						onOpenChange={(open) => {
							setDeleteOpen(open);
							if (!open) setDeleteConfirmName("");
						}}
					>
						<AlertDialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								color="destructive"
								disabled={deleteMutation.isPending}
							>
								Excluir
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Excluir paciente em definitivo?</AlertDialogTitle>
								<AlertDialogDescription asChild>
									<div className="text-muted-foreground space-y-2 text-sm">
										<p>
											Esta ação não pode ser desfeita. O cadastro de{" "}
											<span className="text-foreground font-medium">
												{patientName || "este paciente"}
											</span>{" "}
											será apagado.
										</p>
										{sessionCount > 0 && (
											<p>
												Também serão excluídos{" "}
												<span className="text-foreground font-medium">
													{sessionCount} atendimento(s)
												</span>{" "}
												vinculados (histórico clínico e financeiro).
											</p>
										)}
										<p>
											Para confirmar, digite o nome completo do paciente:
										</p>
									</div>
								</AlertDialogDescription>
							</AlertDialogHeader>
							<Input
								label={{ text: "Nome do paciente", required: true }}
								value={deleteConfirmName}
								onChange={(e) => setDeleteConfirmName(e.target.value)}
								placeholder={patientName || "Nome completo"}
								autoComplete="off"
							/>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={deleteMutation.isPending}>
									Cancelar
								</AlertDialogCancel>
								<AlertDialogAction
									disabled={!deleteNameMatches || deleteMutation.isPending}
									className={buttonVariants({
										variant: "default",
										color: "destructive"
									})}
									onClick={(e) => {
										e.preventDefault();
										if (!deleteNameMatches) return;
										deleteMutation.mutate({ confirmName: deleteConfirmName });
									}}
								>
									{deleteMutation.isPending
										? "Excluindo…"
										: "Excluir definitivamente"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</>
	);

	const titleNode = (
		<span className="inline-flex flex-wrap items-center gap-2">
			{patientQuery.data?.fullName ?? "Paciente"}
			{archived && <Badge variant="secondary">Arquivado</Badge>}
			{isEditing && <Badge variant="outline">Editando</Badge>}
		</span>
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={titleNode}
				description={
					isEditing
						? "Modo edição — altere os dados e salve. Campos com * são obrigatórios."
						: "Visualização do cadastro e histórico de atendimentos."
				}
				backHref="/admin/patients"
				backLabel="Voltar para pacientes"
				actions={headerActions}
			/>

			{!isEditing && (
				<div className="grid gap-4 sm:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Realizados</CardTitle>
							<CardDescription>Sessões concluídas</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-medium">
								{patientQuery.data?.stats.completedCount ?? "—"}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>A receber</CardTitle>
							<CardDescription>
								Saldo pendente dos atendimentos realizados
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-2xl font-medium">
								{patientQuery.data
									? formatBrl(patientQuery.data.stats.pendingValueBrl)
									: "—"}
							</p>
							{(pendingValue > 0 || totalRefundable > 0) && (
								<div className="flex flex-wrap gap-2">
									{pendingValue > 0 ? (
										<Button
											type="button"
											size="sm"
											onClick={() => setPaymentOpen(true)}
										>
											Registrar pagamento
										</Button>
									) : null}
									{totalRefundable > 0 ? (
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => openRefund()}
										>
											Estornar
										</Button>
									) : null}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			<Dialog
				open={paymentOpen}
				onOpenChange={(open) => {
					setPaymentOpen(open);
					if (!open) setPaymentErrors({});
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Registrar pagamento</DialogTitle>
						<DialogDescription>
							O valor será distribuído automaticamente nos atendimentos
							pendentes (do mais antigo para o mais recente). Saldo atual:{" "}
							{formatBrl(pendingValue)}.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<Input
							label={{ text: "Valor recebido", required: true }}
							type="number"
							min={0.01}
							step="0.01"
							max={pendingValue}
							value={paymentAmount}
							error={paymentErrors.amountBrl}
							onChange={(e) => setPaymentAmount(e.target.value)}
							placeholder={String(pendingValue)}
						/>
						<Input
							label={{ text: "Data do pagamento", required: true }}
							type="date"
							value={paymentPaidAt}
							error={paymentErrors.paidAt}
							onChange={(e) => setPaymentPaidAt(e.target.value)}
						/>
						<Textarea
							label={{ text: "Observação (opcional)" }}
							rows={2}
							value={paymentNote}
							error={paymentErrors.note}
							onChange={(e) => setPaymentNote(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setPaymentOpen(false)}
							disabled={paymentMutation.isPending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							disabled={paymentMutation.isPending}
							onClick={() => submitPatientPayment()}
						>
							{paymentMutation.isPending ? "Registrando…" : "Confirmar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={refundOpen}
				onOpenChange={(open) => {
					setRefundOpen(open);
					if (!open) setRefundErrors({});
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Estornar pagamento</DialogTitle>
						<DialogDescription>
							O valor volta ao saldo a receber e é desfeito automaticamente
							nas baixas mais recentes. Máximo: {formatBrl(totalRefundable)}.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<Input
							label={{ text: "Valor do estorno", required: true }}
							type="number"
							min={0.01}
							step="0.01"
							max={totalRefundable || undefined}
							value={refundAmount}
							error={refundErrors.amountBrl}
							onChange={(e) => setRefundAmount(e.target.value)}
							placeholder={
								totalRefundable ? String(totalRefundable) : undefined
							}
						/>
						<Textarea
							label={{ text: "Motivo / observação (opcional)" }}
							rows={2}
							value={refundNote}
							error={refundErrors.note}
							onChange={(e) => setRefundNote(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setRefundOpen(false)}
							disabled={refundMutation.isPending}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							color="destructive"
							disabled={refundMutation.isPending || totalRefundable <= 0}
							onClick={() => submitRefund()}
						>
							{refundMutation.isPending ? "Estornando…" : "Confirmar estorno"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Card>
				<CardHeader>
					<CardTitle>
						{isEditing ? "Formulário de edição" : "Dados do paciente"}
					</CardTitle>
					<CardDescription>
						{isEditing
							? "Revise com cuidado antes de salvar."
							: "Informações do cadastro (somente leitura)."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{patientQuery.isLoading && (
						<div className="space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-2/3" />
						</div>
					)}
					{patientLoaded && !isEditing && (
						<PatientSummary patient={patientQuery.data} />
					)}
					{patientLoaded && isEditing && archived && (
						<p className="text-muted-foreground text-sm">
							Paciente arquivado — restaure para editar o cadastro.
						</p>
					)}
					{patientLoaded &&
						isEditing &&
						!archived &&
						typesQuery.isLoading && (
							<div className="space-y-3">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-2/3" />
							</div>
						)}
					{patientLoaded &&
						isEditing &&
						!archived &&
						!typesQuery.isLoading &&
						!typesQuery.data && (
							<p className="text-destructive text-sm" role="alert">
								Não foi possível carregar os tipos de atendimento.
							</p>
						)}
					{editFormReady && (
						<PatientForm
							key={`${patientQuery.data!.id}-edit`}
							defaultValues={patientToFormValues(patientQuery.data!)}
							serviceTypes={typesQuery.data!}
							submitLabel="Salvar alterações"
							pending={saveMutation.isPending}
							onSubmit={(values) => saveMutation.mutate(values)}
							onCancel={() => setMode("view")}
						/>
					)}
				</CardContent>
			</Card>

			{!isEditing && (
				<Card>
					<CardHeader>
						<CardTitle>Histórico de sessões</CardTitle>
						<CardDescription>Últimas sessões deste paciente.</CardDescription>
					</CardHeader>
					<CardContent>
						{patientQuery.isLoading && (
							<Skeleton className="h-16 w-full" />
						)}
						{patientLoaded && !patientQuery.data.sessions.length && (
							<p className="text-muted-foreground text-sm">
								Nenhuma sessão registrada ainda.
							</p>
						)}
						{patientLoaded && patientQuery.data.sessions.length > 0 && (
							<AdminList>
								{patientQuery.data.sessions.map((s) => (
									<AdminListItem key={s.id}>
										<div>
											<p className="font-medium">
												{s.scheduledDate} · {s.scheduledTime.slice(0, 5)}
											</p>
											<p className="text-muted-foreground text-sm">
												{s.serviceTypeName} ·{" "}
												{STATUS_LABEL[s.status] ?? s.status} ·{" "}
												{formatBrl(s.valueBrl)}
												{s.status === "completed"
													? ` · ${SESSION_PAYMENT_STATUS_LABEL[sessionPaymentStatus({ valueBrl: s.valueBrl, amountPaidBrl: s.amountPaidBrl ?? "0", paid: s.paid })]}`
													: ""}
											</p>
										</div>
										<Button asChild variant="outline" size="sm">
											<Link
												href={
													s.status === "completed" && !s.paid
														? `/admin/sessions/${s.id}?mode=finance`
														: `/admin/sessions/${s.id}`
												}
											>
												Ver
											</Link>
										</Button>
									</AdminListItem>
								))}
							</AdminList>
						)}
						<div className="mt-4">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => router.push("/admin/agenda")}
							>
								Ir para agenda
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{!isEditing && (
				<Card>
					<CardHeader>
						<CardTitle>Histórico financeiro</CardTitle>
						<CardDescription>
							Recebimentos e estornos deste paciente.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{paymentsQuery.isLoading && (
							<Skeleton className="h-16 w-full" />
						)}
						{paymentsQuery.isError && (
							<p className="text-destructive text-sm" role="alert">
								{(paymentsQuery.error as Error).message}
							</p>
						)}
						{!paymentsQuery.isLoading &&
							!paymentsQuery.isError &&
							ledgerEntries.length === 0 && (
								<p className="text-muted-foreground text-sm">
									Nenhum movimento registrado ainda.
								</p>
							)}
						{ledgerEntries.length > 0 && (
							<AdminList>
								{ledgerEntries.map((entry) => (
									<AdminListItem key={`${entry.kind}-${entry.id}`}>
										<div className="min-w-0 flex-1">
											<p className="font-medium">
												{entry.kind === "received" ? "Recebido" : "Estornado"}{" "}
												· {formatBrl(entry.amountBrl)}
											</p>
											<p className="text-muted-foreground text-sm">
												{entry.date}
											</p>
										</div>
									</AdminListItem>
								))}
							</AdminList>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default PatientDetailClient;
