"use client";

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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { downloadPatientHistoryPdf } from "@/lib/pdf/patient-history";
import {
	patientToFormValues,
	type PatientFormParsed
} from "@/lib/patients/schema";
import {
	useArchivePatientMutation,
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

const formatBrl = (value: string | number) => {
	const n = typeof value === "string" ? Number(value) : value;
	return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

	const typesQuery = useServiceTypesQuery({ enabled: isEditing });

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

	const archiveMutation = useArchivePatientMutation(patientId, {
		onSuccess: (data) => {
			toast.success(
				data.archivedAt ? "Paciente arquivado." : "Paciente restaurado."
			);
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

	const archived = Boolean(patientQuery.data?.archivedAt);
	const archiveDialogDescription = archived
		? "O paciente voltará para a lista ativa e poderá ser agendado."
		: "Ele sairá da lista ativa e não poderá ser agendado até ser restaurado.";

	if (patientQuery.isError) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Paciente"
					description="Não foi possível carregar o cadastro."
					actions={
						<Button asChild variant="outline">
							<Link href="/admin/patients">Voltar</Link>
						</Button>
					}
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
		<div className="flex flex-wrap gap-2">
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
					<Button asChild variant="outline">
						<Link href="/admin/patients">Voltar</Link>
					</Button>
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
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								color="destructive"
								disabled={archiveMutation.isPending}
							>
								{archived ? "Restaurar" : "Arquivar"}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									{archived ? "Restaurar paciente?" : "Arquivar paciente?"}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{archiveDialogDescription}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => archiveMutation.mutate(!archived)}
								>
									{archived ? "Restaurar" : "Arquivar"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}
		</div>
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-medium">
							{patientQuery.data?.fullName ?? "Paciente"}
						</h1>
						{archived && <Badge variant="secondary">Arquivado</Badge>}
						{isEditing && <Badge variant="outline">Editando</Badge>}
					</div>
					<p className="text-muted-foreground text-sm">
						{isEditing
							? "Modo edição — altere os dados e salve. Campos com * são obrigatórios."
							: "Visualização do cadastro e histórico de atendimentos."}
					</p>
				</div>
				{headerActions}
			</div>

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
							<CardDescription>Realizados sem pagamento</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-medium">
								{patientQuery.data
									? formatBrl(patientQuery.data.stats.pendingValueBrl)
									: "—"}
							</p>
						</CardContent>
					</Card>
				</div>
			)}

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
												{s.paid ? " · pago" : ""}
											</p>
										</div>
										<Button asChild variant="outline" size="sm">
											<Link href={`/admin/sessions/${s.id}`}>Abrir</Link>
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
		</div>
	);
};

export default PatientDetailClient;
