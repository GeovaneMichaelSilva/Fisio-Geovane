"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageTitle } from "@/hooks/usePageTitle";
import { normalizeTime } from "@/lib/sessions/agenda";

type RecordItem = {
	id: string;
	patientId: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	valueBrl: string;
	paid: boolean;
	invoiceIssued: boolean;
	evolution: string | null;
};

async function fetchRecords(q: string) {
	const params = new URLSearchParams({ status: "completed" });
	const term = q.trim();
	if (term) params.set("q", term);
	const res = await fetch(`/api/admin/sessions?${params}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao listar atendimentos.");
	return json.data as RecordItem[];
}

function formatBrl(value: string) {
	return Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
}

export default function RecordsPage() {
	usePageTitle("Atendimentos");
	const [q, setQ] = useState("");
	const search = useDebounce(q, 300).trim();

	const listQuery = useQuery({
		queryKey: ["records", search],
		queryFn: () => fetchRecords(search)
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Atendimentos"
				description="Sessões realizadas — a busca roda ao digitar."
				actions={
					<Button asChild variant="outline">
						<Link href="/admin/agenda">Ir para agenda</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Realizados</CardTitle>
					<CardDescription>
						Abra o detalhe para ver avaliação, evolução e atividades.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						label={{ text: "Buscar paciente" }}
						placeholder="Nome"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						autoComplete="off"
					/>

					{listQuery.isLoading ? (
						<ListSkeleton />
					) : listQuery.isError ? (
						<ErrorState
							message={(listQuery.error as Error).message}
							onRetry={() => listQuery.refetch()}
						/>
					) : listQuery.data?.length === 0 ? (
						<EmptyState
							title={
								search
									? "Nenhum atendimento encontrado"
									: "Nenhum atendimento realizado"
							}
							description={
								search
									? "Tente outro nome."
									: "Conclua uma sessão na agenda para aparecer aqui."
							}
							action={
								!search ? (
									<Button asChild size="sm">
										<Link href="/admin/agenda">Abrir agenda</Link>
									</Button>
								) : null
							}
						/>
					) : (
						<ul className="divide-border divide-y">
							{listQuery.data?.map((row) => (
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
												<Badge>Pago</Badge>
											) : (
												<Badge variant="secondary">Em aberto</Badge>
											)}
											{row.invoiceIssued ? (
												<Badge variant="outline">NFS-e</Badge>
											) : null}
										</div>
									</div>
									<Button asChild variant="outline" size="sm">
										<Link href={`/admin/sessions/${row.id}?mode=clinical`}>
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
