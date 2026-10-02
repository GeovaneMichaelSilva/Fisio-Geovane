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
import { usePageTitle } from "@/hooks/usePageTitle";

type PatientListItem = {
	id: string;
	fullName: string;
	phone: string | null;
	preferredServiceTypeName: string;
	archivedAt: string | null;
};

async function fetchPatients(q: string, archived: boolean) {
	const params = new URLSearchParams();
	if (q) params.set("q", q);
	if (archived) params.set("archived", "1");
	const res = await fetch(`/api/admin/patients?${params}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao listar.");
	return json.data as PatientListItem[];
}

export default function PatientsPage() {
	usePageTitle("Pacientes");
	const [q, setQ] = useState("");
	const [search, setSearch] = useState("");
	const [showArchived, setShowArchived] = useState(false);

	const listQuery = useQuery({
		queryKey: ["patients", search, showArchived],
		queryFn: () => fetchPatients(search, showArchived)
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Pacientes"
				description="Cadastro, busca e arquivamento."
				actions={
					<Button asChild>
						<Link href="/admin/patients/new">Novo paciente</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Lista</CardTitle>
					<CardDescription>
						Busque por nome. Arquivados ficam fora da agenda.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form
						className="flex flex-col gap-3 sm:flex-row sm:items-end"
						onSubmit={(e) => {
							e.preventDefault();
							setSearch(q.trim());
						}}
					>
						<Input
							className="sm:flex-1"
							label={{ text: "Buscar" }}
							placeholder="Nome do paciente"
							value={q}
							onChange={(e) => setQ(e.target.value)}
						/>
						<div className="flex flex-wrap gap-2">
							<Button type="submit" variant="secondary">
								Buscar
							</Button>
							{search ? (
								<Button
									type="button"
									variant="ghost"
									onClick={() => {
										setQ("");
										setSearch("");
									}}
								>
									Limpar
								</Button>
							) : null}
							<Button
								type="button"
								variant={showArchived ? "default" : "outline"}
								onClick={() => setShowArchived((v) => !v)}
							>
								{showArchived ? "Ver ativos" : "Ver arquivados"}
							</Button>
						</div>
					</form>

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
									? "Nenhum paciente encontrado"
									: showArchived
										? "Nenhum paciente arquivado"
										: "Nenhum paciente cadastrado"
							}
							description={
								search
									? "Tente outro nome ou limpe a busca."
									: showArchived
										? "Pacientes arquivados aparecem aqui."
										: "Cadastre o primeiro paciente para agendar atendimentos."
							}
							action={
								!search && !showArchived ? (
									<Button asChild size="sm">
										<Link href="/admin/patients/new">Novo paciente</Link>
									</Button>
								) : null
							}
						/>
					) : (
						<ul className="divide-border divide-y">
							{listQuery.data?.map((p) => (
								<li
									key={p.id}
									className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium">{p.fullName}</p>
											{p.archivedAt ? (
												<Badge variant="secondary">Arquivado</Badge>
											) : null}
										</div>
										<p className="text-muted-foreground text-sm">
											{p.preferredServiceTypeName}
											{p.phone ? ` · ${p.phone}` : ""}
										</p>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button asChild variant="outline" size="sm">
											<Link href={`/admin/patients/${p.id}`}>Abrir</Link>
										</Button>
										{!p.archivedAt ? (
											<Button asChild variant="ghost" size="sm">
												<Link href={`/admin/agenda?patientId=${p.id}`}>
													Agendar
												</Link>
											</Button>
										) : null}
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
