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
import { normalizeTime } from "@/lib/sessions/agenda";
import { useRecordsQuery } from "@/queries/recordsQuery";

import type { FC, ReactNode } from "react";

const formatBrl = (value: string) =>
	Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});

const formatDatePt = (value: string) => {
	const [y, m, d] = value.split("-");
	if (!y || !m || !d) return value;
	return `${d}/${m}/${y}`;
};

const RecordsPage: FC = () => {
	usePageTitle("Atendimentos");
	const [q, setQ] = useState("");
	const search = useDebounce(q, 300).trim();
	const [page, setPage] = useState(1);

	useEffect(() => {
		setPage(1);
	}, [search]);

	const listQuery = useRecordsQuery({ q: search, page });

	const rows = listQuery.data?.data ?? [];
	const meta = listQuery.data?.meta;

	let listBody: ReactNode;
	if (listQuery.isLoading) {
		listBody = <ListSkeleton />;
	} else if (listQuery.isError) {
		listBody = (
			<ErrorState
				message={(listQuery.error as Error).message}
				onRetry={() => listQuery.refetch()}
			/>
		);
	} else if (rows.length === 0) {
		listBody = (
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
		);
	} else {
		listBody = (
			<div className="space-y-4">
				<AdminList>
					{rows.map((row) => (
						<AdminListItem key={row.id}>
							<div className="min-w-0 space-y-1">
								<p className="font-medium">{row.patientName}</p>
								<p className="text-muted-foreground text-sm">
									{formatDatePt(row.scheduledDate)} ·{" "}
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
							<Button
								asChild
								variant="outline"
								size="sm"
								className="min-h-11 sm:min-h-9"
							>
								<Link href={`/admin/sessions/${row.id}?mode=clinical`}>
									Abrir
								</Link>
							</Button>
						</AdminListItem>
					))}
				</AdminList>
				{meta ? (
					<PaginationControls
						page={meta.page}
						totalPages={meta.totalPages}
						total={meta.total}
						pageSize={meta.pageSize}
						pending={listQuery.isFetching}
						onPageChange={setPage}
					/>
				) : null}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Atendimentos"
				description="Sessões realizadas — a busca roda ao digitar."
				actions={
					<Button
						asChild
						variant="outline"
						className="min-h-11 sm:min-h-10"
					>
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
					{listBody}
				</CardContent>
			</Card>
		</div>
	);
};

export default RecordsPage;
