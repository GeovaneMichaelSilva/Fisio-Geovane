"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ListSkeleton } from "@/components/admin/LoadingStates";
import {
	EmptyState,
	ErrorState,
	PageHeader
} from "@/components/admin/PageStates";
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
import { normalizeTime } from "@/lib/sessions/agenda";

type FinanceSession = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	valueBrl: string;
	paid: boolean;
	paidAt: string | null;
	invoiceIssued: boolean;
};

type FinanceData = {
	kpis: {
		completedCount: number;
		receivedTotal: string;
		pendingTotal: string;
		pendingCount: number;
	};
	sessions: FinanceSession[];
};

async function fetchFinance() {
	const res = await fetch("/api/admin/finance");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return json.data as FinanceData;
}

function formatBrl(value: string | number) {
	return Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
}

export default function FinancePage() {
	usePageTitle("Financeiro");

	const query = useQuery({
		queryKey: ["finance"],
		queryFn: fetchFinance
	});

	const kpis = query.data?.kpis;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Financeiro"
				description="Recebimentos e pendências dos atendimentos realizados."
				actions={
					<Button asChild variant="outline">
						<Link href="/admin/finance/expenses">Despesas</Link>
					</Button>
				}
			/>

			{query.isLoading ? (
				<div className="grid gap-4 sm:grid-cols-3">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : query.isError ? (
				<ErrorState
					message={(query.error as Error).message}
					onRetry={() => query.refetch()}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Recebido</CardTitle>
							<CardDescription>Sessões pagas</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-medium">
								{formatBrl(kpis?.receivedTotal ?? 0)}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>A receber</CardTitle>
							<CardDescription>
								{kpis?.pendingCount ?? 0} pendente(s)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-medium">
								{formatBrl(kpis?.pendingTotal ?? 0)}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Realizados</CardTitle>
							<CardDescription>Total de sessões</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-medium">
								{kpis?.completedCount ?? 0}
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Sessões</CardTitle>
					<CardDescription>
						Abra para marcar pago, data de pagamento e NFS-e.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{query.isLoading ? (
						<ListSkeleton rows={2} rowClassName="h-12 w-full" />
					) : query.isError ? null : !query.data?.sessions.length ? (
						<EmptyState
							title="Nenhuma sessão realizada"
							description="Conclua atendimentos na agenda para acompanhar pagamentos."
							action={
								<Button asChild size="sm">
									<Link href="/admin/agenda">Abrir agenda</Link>
								</Button>
							}
						/>
					) : (
						<ul className="divide-border divide-y">
							{query.data.sessions.map((row) => (
								<li
									key={row.id}
									className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0 space-y-1">
										<p className="font-medium">{row.patientName}</p>
										<p className="text-muted-foreground text-sm">
											{row.scheduledDate} ·{" "}
											{normalizeTime(String(row.scheduledTime)).slice(0, 5)} ·{" "}
											{row.serviceTypeName} · {formatBrl(row.valueBrl)}
										</p>
										<div className="flex flex-wrap gap-2">
											{row.paid ? (
												<Badge>
													Pago
													{row.paidAt ? ` · ${row.paidAt}` : ""}
												</Badge>
											) : (
												<Badge variant="secondary">Em aberto</Badge>
											)}
											{row.invoiceIssued ? (
												<Badge variant="outline">NFS-e</Badge>
											) : null}
										</div>
									</div>
									<Button asChild variant="outline" size="sm">
										<Link href={`/admin/sessions/${row.id}?mode=finance`}>
											Abrir
										</Link>
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
