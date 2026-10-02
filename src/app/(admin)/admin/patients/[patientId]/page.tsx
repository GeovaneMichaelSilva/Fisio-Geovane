"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErrorState, PageHeader } from "@/components/admin/PageStates";
import { PatientForm } from "@/components/patients/PatientForm";
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

type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
};

type PatientDetail = {
	id: string;
	fullName: string;
	phone: string | null;
	cpf: string | null;
	birthDate: string | null;
	weightKg: string | null;
	heightCm: string | null;
	preferredServiceTypeId: string;
	preferredServiceTypeName: string;
	addressStreet: string | null;
	addressNumber: string | null;
	addressNeighborhood: string | null;
	addressCity: string | null;
	addressZip: string | null;
	notes: string | null;
	archivedAt: string | null;
	stats: {
		completedCount: number;
		pendingValueBrl: string;
	};
	sessions: Array<{
		id: string;
		scheduledDate: string;
		scheduledTime: string;
		status: string;
		valueBrl: string;
		paid: boolean;
		serviceTypeName: string;
	}>;
};

const STATUS_LABEL: Record<string, string> = {
	scheduled: "Agendado",
	completed: "Realizado",
	canceled: "Cancelado",
	no_show: "Faltou"
};

async function fetchPatient(id: string) {
	const res = await fetch(`/api/admin/patients/${id}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return json.data as PatientDetail;
}

async function fetchServiceTypes() {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data as ServiceType[];
}

function formatBrl(value: string | number) {
	const n = typeof value === "string" ? Number(value) : value;
	return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PatientDetailPage({
	params
}: {
	params: Promise<{ patientId: string }>;
}) {
	const { patientId } = use(params);
	const router = useRouter();
	const queryClient = useQueryClient();

	const patientQuery = useQuery({
		queryKey: ["patient", patientId],
		queryFn: () => fetchPatient(patientId)
	});

	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes
	});

	usePageTitle(patientQuery.data?.fullName || "Paciente");

	const saveMutation = useMutation({
		mutationFn: async (values: PatientFormParsed) => {
			const res = await fetch(`/api/admin/patients/${patientId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar.");
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
			queryClient.invalidateQueries({ queryKey: ["patients"] });
			toast.success("Paciente atualizado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const archiveMutation = useMutation({
		mutationFn: async (archived: boolean) => {
			const res = await fetch(`/api/admin/patients/${patientId}/archive`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ archived })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao arquivar.");
			return json.data as { archivedAt: string | null };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
			queryClient.invalidateQueries({ queryKey: ["patients"] });
			toast.success(
				data.archivedAt ? "Paciente arquivado." : "Paciente restaurado."
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const pdfMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/admin/patients/${patientId}/pdf`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao gerar PDF.");
			return json.data;
		},
		onSuccess: (data) => {
			downloadPatientHistoryPdf(data);
			toast.success("PDF gerado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const archived = Boolean(patientQuery.data?.archivedAt);

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

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-medium">
							{patientQuery.data?.fullName ?? "Paciente"}
						</h1>
						{archived ? <Badge variant="secondary">Arquivado</Badge> : null}
					</div>
					<p className="text-muted-foreground text-sm">
						Cadastro e histórico de atendimentos.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline">
						<Link href="/admin/patients">Voltar</Link>
					</Button>
					{!archived ? (
						<Button asChild>
							<Link href={`/admin/agenda?patientId=${patientId}`}>
								Agendar
							</Link>
						</Button>
					) : null}
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
									{archived
										? "O paciente voltará para a lista ativa e poderá ser agendado."
										: "Ele sairá da lista ativa e não poderá ser agendado até ser restaurado."}
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
				</div>
			</div>

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

			<Card>
				<CardHeader>
					<CardTitle>Dados do paciente</CardTitle>
					<CardDescription>
						Alterações ficam salvas imediatamente após confirmar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{patientQuery.isLoading || typesQuery.isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-2/3" />
						</div>
					) : patientQuery.data && typesQuery.data ? (
						<PatientForm
							key={patientQuery.data.id}
							defaultValues={patientToFormValues(patientQuery.data)}
							serviceTypes={typesQuery.data}
							pending={saveMutation.isPending}
							disabled={archived}
							onSubmit={(values) => saveMutation.mutate(values)}
						/>
					) : null}
					{archived ? (
						<p className="text-muted-foreground mt-3 text-sm">
							Paciente arquivado — restaure para editar o cadastro.
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Histórico de sessões</CardTitle>
					<CardDescription>
						Últimas sessões deste paciente (agenda ainda em construção).
					</CardDescription>
				</CardHeader>
				<CardContent>
					{patientQuery.isLoading ? (
						<Skeleton className="h-16 w-full" />
					) : !patientQuery.data?.sessions.length ? (
						<p className="text-muted-foreground text-sm">
							Nenhuma sessão registrada ainda.
						</p>
					) : (
						<ul className="divide-border divide-y">
							{patientQuery.data.sessions.map((s) => (
								<li
									key={s.id}
									className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
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
								</li>
							))}
						</ul>
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
		</div>
	);
}
