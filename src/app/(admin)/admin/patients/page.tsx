"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AdminList, AdminListItem } from "@/components/admin/AdminList";
import { ListSkeleton } from "@/components/admin/LoadingStates";
import PaginationControls from "@/components/admin/PaginationControls";
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
import { usePatientsQuery } from "@/queries/patientQuery";

import type { FC } from "react";

const emptyListCopy = (search: string, showArchived: boolean) => {
	if (search) {
		return {
			title: "Nenhum paciente encontrado",
			description: "Tente outro nome, telefone ou CPF."
		};
	}
	if (showArchived) {
		return {
			title: "Nenhum paciente arquivado",
			description: "Pacientes arquivados aparecem aqui."
		};
	}
	return {
		title: "Nenhum paciente cadastrado",
		description: "Cadastre o primeiro paciente para agendar atendimentos."
	};
};

const PatientsPage: FC = () => {
	usePageTitle("Pacientes");
	const [q, setQ] = useState("");
	const search = useDebounce(q, 300).trim();
	const [showArchived, setShowArchived] = useState(false);
	const [page, setPage] = useState(1);

	useEffect(() => {
		setPage(1);
	}, [search, showArchived]);

	const listQuery = usePatientsQuery({
		q: search,
		archived: showArchived,
		page
	});

	const rows = listQuery.data?.data ?? [];
	const meta = listQuery.data?.meta;
	const listReady = !listQuery.isLoading && !listQuery.isError;
	const listEmpty = listReady && rows.length === 0;
	const emptyCopy = emptyListCopy(search, showArchived);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Pacientes"
				description="Cadastro, busca e arquivamento."
				actions={
					<Button asChild className="min-h-11 w-full sm:min-h-10 sm:w-auto">
						<Link href="/admin/patients/new">Novo paciente</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Lista</CardTitle>
					<CardDescription>
						A busca roda automaticamente ao digitar. Arquivados ficam fora da
						agenda.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<Input
							className="sm:flex-1"
							label={{ text: "Buscar" }}
							placeholder="Nome, telefone ou CPF"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							autoComplete="off"
						/>
						<Button
							type="button"
							className="min-h-11 sm:min-h-10"
							variant={showArchived ? "default" : "outline"}
							onClick={() => setShowArchived((v) => !v)}
						>
							{showArchived ? "Ver ativos" : "Ver arquivados"}
						</Button>
					</div>
					{listQuery.isLoading && <ListSkeleton />}
					{listQuery.isError && (
						<ErrorState
							message={(listQuery.error as Error).message}
							onRetry={() => listQuery.refetch()}
						/>
					)}
					{listEmpty && (
						<EmptyState
							title={emptyCopy.title}
							description={emptyCopy.description}
							action={
								!search && !showArchived ? (
									<Button asChild size="sm">
										<Link href="/admin/patients/new">Novo paciente</Link>
									</Button>
								) : null
							}
						/>
					)}
					{listReady && rows.length > 0 && (
						<div className="space-y-4">
							<AdminList>
								{rows.map((p) => (
									<AdminListItem key={p.id}>
										<div className="min-w-0 space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium">{p.fullName}</p>
												{p.archivedAt && (
													<Badge variant="secondary">Arquivado</Badge>
												)}
											</div>
											<p className="text-muted-foreground text-sm">
												{p.preferredServiceTypeName}
												{p.phone ? ` · ${p.phone}` : ""}
											</p>
										</div>
										<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
											<Button
												asChild
												variant="outline"
												size="sm"
												className="min-h-11 sm:min-h-9"
											>
												<Link href={`/admin/patients/${p.id}`}>Ver</Link>
											</Button>
											{!p.archivedAt && (
												<Button
													asChild
													variant="ghost"
													size="sm"
													className="min-h-11 sm:min-h-9"
												>
													<Link href={`/admin/agenda?patientId=${p.id}`}>
														Agendar
													</Link>
												</Button>
											)}
										</div>
									</AdminListItem>
								))}
							</AdminList>
							{meta && (
								<PaginationControls
									page={meta.page}
									totalPages={meta.totalPages}
									total={meta.total}
									pageSize={meta.pageSize}
									pending={listQuery.isFetching}
									onPageChange={setPage}
								/>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default PatientsPage;
