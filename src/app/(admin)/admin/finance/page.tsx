"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { normalizeTime } from "@/lib/sessions/agenda";

import type { PaginationMeta } from "@/lib/pagination";
import type { FC, ReactNode } from "react";

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
	period: { from: string; to: string } | null;
	kpis: {
		completedCount: number;
		receivedTotal: string;
		pendingTotal: string;
		pendingCount: number;
	};
	sessions: FinanceSession[];
};

type PeriodPreset = "this_month" | "last_month" | "this_year" | "all" | "custom";

const pad2 = (n: number) => String(n).padStart(2, "0");

const monthRange = (year: number, monthIndex: number) => {
	const from = `${year}-${pad2(monthIndex + 1)}-01`;
	const lastDay = new Date(year, monthIndex + 1, 0).getDate();
	const to = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;
	return { from, to };
};

const resolvePeriod = (
	preset: PeriodPreset,
	customFrom: string,
	customTo: string
): { from?: string; to?: string } => {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();

	if (preset === "all") return {};
	if (preset === "this_month") return monthRange(y, m);
	if (preset === "last_month") {
		const d = new Date(y, m - 1, 1);
		return monthRange(d.getFullYear(), d.getMonth());
	}
	if (preset === "this_year") {
		return { from: `${y}-01-01`, to: `${y}-12-31` };
	}
	if (customFrom && customTo) return { from: customFrom, to: customTo };
	return monthRange(y, m);
};

const fetchFinance = async (
	from: string | undefined,
	to: string | undefined,
	page: number
) => {
	const params = new URLSearchParams({
		page: String(page),
		pageSize: "20"
	});
	if (from && to) {
		params.set("from", from);
		params.set("to", to);
	}
	const res = await fetch(`/api/admin/finance?${params}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return {
		data: json.data as FinanceData,
		meta: json.meta as PaginationMeta
	};
};

const formatDatePt = (value: string) => {
	const [y, m, d] = value.split("-");
	if (!y || !m || !d) return value;
	return `${d}/${m}/${y}`;
};

const formatBrl = (value: string | number) =>
	Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});

const PRESETS: Array<{ id: PeriodPreset; label: string }> = [
	{ id: "this_month", label: "Este mês" },
	{ id: "last_month", label: "Mês passado" },
	{ id: "this_year", label: "Este ano" },
	{ id: "all", label: "Tudo" },
	{ id: "custom", label: "Personalizado" }
];

const FinancePage: FC = () => {
	usePageTitle("Financeiro");

	const now = new Date();
	const defaultMonth = monthRange(now.getFullYear(), now.getMonth());

	const [preset, setPreset] = useState<PeriodPreset>("this_month");
	const [customFrom, setCustomFrom] = useState(defaultMonth.from);
	const [customTo, setCustomTo] = useState(defaultMonth.to);
	const [page, setPage] = useState(1);

	const period = useMemo(
		() => resolvePeriod(preset, customFrom, customTo),
		[preset, customFrom, customTo]
	);

	useEffect(() => {
		setPage(1);
	}, [preset, customFrom, customTo]);

	const customInvalid =
		preset === "custom" &&
		(!customFrom || !customTo || customFrom > customTo);

	const query = useQuery({
		queryKey: ["finance", period.from ?? null, period.to ?? null, page],
		queryFn: () => fetchFinance(period.from, period.to, page),
		enabled: !customInvalid
	});

	const kpis = query.data?.data.kpis;
	const sessions = query.data?.data.sessions ?? [];
	const meta = query.data?.meta;
	const periodLabel =
		period.from && period.to
			? `${formatDatePt(period.from)} – ${formatDatePt(period.to)}`
			: "Todo o período";

	let kpiSection: ReactNode;
	if (query.isLoading) {
		kpiSection = (
			<div className="grid gap-4 sm:grid-cols-3">
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
			</div>
		);
	} else if (query.isError) {
		kpiSection = (
			<ErrorState
				message={(query.error as Error).message}
				onRetry={() => query.refetch()}
			/>
		);
	} else {
		kpiSection = (
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Recebido</CardTitle>
						<CardDescription>Sessões pagas no período</CardDescription>
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
						<CardDescription>Sessões no período</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-medium">{kpis?.completedCount ?? 0}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	let sessionsBody: ReactNode;
	if (customInvalid) {
		sessionsBody = (
			<EmptyState
				title="Período inválido"
				description="Ajuste as datas personalizadas para carregar."
			/>
		);
	} else if (query.isLoading) {
		sessionsBody = <ListSkeleton rows={2} rowClassName="h-12 w-full" />;
	} else if (query.isError) {
		sessionsBody = null;
	} else if (sessions.length === 0) {
		sessionsBody = (
			<EmptyState
				title="Nenhuma sessão no período"
				description="Conclua atendimentos na agenda ou amplie o filtro."
				action={
					<div className="flex flex-wrap gap-2">
						<Button asChild size="sm">
							<Link href="/admin/agenda">Abrir agenda</Link>
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => setPreset("all")}
						>
							Ver tudo
						</Button>
					</div>
				}
			/>
		);
	} else {
		sessionsBody = (
			<div className="space-y-4">
				<AdminList>
					{sessions.map((row) => (
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
										<Badge>
											Pago
											{row.paidAt ? ` · ${formatDatePt(row.paidAt)}` : ""}
										</Badge>
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
								<Link href={`/admin/sessions/${row.id}?mode=finance`}>
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
						pending={query.isFetching}
						onPageChange={setPage}
					/>
				) : null}
			</div>
		);
	}

	const customPeriodFields =
		preset === "custom" ? (
			<div className="grid gap-4 sm:grid-cols-2">
				<Input
					label={{ text: "De", required: true }}
					type="date"
					value={customFrom}
					max={customTo || undefined}
					onChange={(e) => setCustomFrom(e.target.value)}
					error={
						customInvalid && customFrom > customTo
							? "Data inicial depois da final."
							: undefined
					}
				/>
				<Input
					label={{ text: "Até", required: true }}
					type="date"
					value={customTo}
					min={customFrom || undefined}
					onChange={(e) => setCustomTo(e.target.value)}
				/>
			</div>
		) : null;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Financeiro"
				description="Recebimentos e pendências dos atendimentos realizados."
			/>

			<Card>
				<CardHeader>
					<CardTitle>Período</CardTitle>
					<CardDescription>
						KPIs e lista filtrados pela data da sessão. {periodLabel}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{PRESETS.map((p) => (
							<Button
								key={p.id}
								type="button"
								size="sm"
								className="min-h-11 sm:min-h-9"
								variant={preset === p.id ? "default" : "outline"}
								onClick={() => {
									setPreset(p.id);
									setPage(1);
								}}
							>
								{p.label}
							</Button>
						))}
					</div>
					{customPeriodFields}
				</CardContent>
			</Card>

			{kpiSection}

			<Card>
				<CardHeader>
					<CardTitle>Sessões</CardTitle>
					<CardDescription>
						Abra para marcar pago, data de pagamento e NFS-e.
					</CardDescription>
				</CardHeader>
				<CardContent>{sessionsBody}</CardContent>
			</Card>
		</div>
	);
};

export default FinancePage;
