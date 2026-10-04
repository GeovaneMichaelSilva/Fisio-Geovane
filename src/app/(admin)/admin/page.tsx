"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
import {
	normalizeTime,
	startOfWeekMonday,
	STATUS_LABEL,
	toDateString
} from "@/lib/sessions/agenda";

import type { FC, ReactNode } from "react";

type AgendaSession = {
	id: string;
	patientName: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	status: string;
};

type FinanceKpis = {
	pendingTotal: string;
	pendingCount: number;
	completedCount: number;
};

const fetchToday = async () => {
	const today = toDateString(new Date());
	const res = await fetch(`/api/admin/sessions?from=${today}&to=${today}`);
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar agenda.");
	return json.data as AgendaSession[];
};

const fetchFinance = async () => {
	const res = await fetch("/api/admin/finance");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar financeiro.");
	return json.data.kpis as FinanceKpis;
};

const formatBrl = (value: string) =>
	Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});

const tiles = [
	{
		href: "/admin/agenda",
		title: "Agenda",
		description: "Horários, agendamentos e retornos"
	},
	{
		href: "/admin/patients",
		title: "Pacientes",
		description: "Dados pessoais e cadastros"
	},
	{
		href: "/admin/finance",
		title: "Financeiro",
		description: "Pagamentos, pendências e notas"
	},
	{
		href: "/admin/records",
		title: "Atendimentos",
		description: "Avaliações, evoluções e atividades"
	}
];

const AdminHomePage: FC = () => {
	usePageTitle("Início");

	const todayQuery = useQuery({
		queryKey: ["sessions-today"],
		queryFn: fetchToday
	});

	const financeQuery = useQuery({
		queryKey: ["finance-home"],
		queryFn: fetchFinance
	});

	const today = toDateString(new Date());
	const monday = startOfWeekMonday(new Date());
	const upcoming =
		todayQuery.data?.filter((s) => s.status === "scheduled").slice(0, 5) ?? [];

	let todayCardBody: ReactNode;
	if (todayQuery.isLoading) {
		todayCardBody = (
			<div className="space-y-2">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		);
	} else if (todayQuery.isError) {
		todayCardBody = (
			<ErrorState
				message={(todayQuery.error as Error).message}
				onRetry={() => todayQuery.refetch()}
			/>
		);
	} else if (upcoming.length === 0) {
		todayCardBody = (
			<EmptyState
				title="Nenhum horário agendado para hoje"
				description="Crie um agendamento ou avance para a semana."
				action={
					<div className="flex flex-wrap gap-2">
						<Button asChild size="sm">
							<Link href={`/admin/agenda?date=${today}`}>Agendar hoje</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link href={`/admin/agenda?date=${toDateString(monday)}`}>
								Ver semana
							</Link>
						</Button>
					</div>
				}
			/>
		);
	} else {
		todayCardBody = (
			<ul className="divide-border divide-y">
				{upcoming.map((s) => (
					<li
						key={s.id}
						className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div>
							<p className="font-medium">
								{normalizeTime(String(s.scheduledTime)).slice(0, 5)} ·{" "}
								{s.patientName}
							</p>
							<p className="text-muted-foreground text-sm">
								{s.serviceTypeName}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">
								{STATUS_LABEL[s.status] ?? s.status}
							</Badge>
							<Button asChild size="sm" variant="outline">
								<Link href={`/admin/sessions/${s.id}`}>Abrir</Link>
							</Button>
							{s.status === "scheduled" ? (
								<Button asChild size="sm">
									<Link href={`/admin/sessions/${s.id}?mode=clinical`}>
										INICIAR
									</Link>
								</Button>
							) : null}
						</div>
					</li>
				))}
			</ul>
		);
	}

	let financeCardBody: ReactNode;
	if (financeQuery.isLoading) {
		financeCardBody = <Skeleton className="h-16 w-full" />;
	} else if (financeQuery.isError) {
		financeCardBody = (
			<ErrorState
				message={(financeQuery.error as Error).message}
				onRetry={() => financeQuery.refetch()}
			/>
		);
	} else if (financeQuery.data) {
		financeCardBody = (
			<div className="space-y-4">
				<div>
					<p className="text-muted-foreground text-xs tracking-wide uppercase">
						A receber
					</p>
					<p className="text-2xl font-medium">
						{formatBrl(financeQuery.data.pendingTotal)}
					</p>
					<p className="text-muted-foreground text-sm">
						{financeQuery.data.pendingCount} sessão(ões) ·{" "}
						{financeQuery.data.completedCount} realizadas
					</p>
				</div>
				<Button asChild variant="secondary" className="w-full">
					<Link href="/admin/finance">Ver financeiro</Link>
				</Button>
			</div>
		);
	} else {
		financeCardBody = (
			<EmptyState
				title="Sem dados financeiros"
				description="Conclua atendimentos para ver pendências."
			/>
		);
	}

	const headerActions = (
		<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
			<Button asChild className="min-h-11 w-full sm:min-h-10 sm:w-auto">
				<Link href="/admin/agenda">Abrir agenda</Link>
			</Button>
			<Button
				asChild
				variant="secondary"
				className="min-h-11 w-full sm:min-h-10 sm:w-auto"
			>
				<Link href="/admin/patients/new">Novo paciente</Link>
			</Button>
		</div>
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Seu espaço de trabalho"
				description="Resumo do dia e atalhos para as áreas principais."
				actions={headerActions}
			/>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Hoje</CardTitle>
						<CardDescription>
							{new Date().toLocaleDateString("pt-BR", {
								weekday: "long",
								day: "2-digit",
								month: "long"
							})}
						</CardDescription>
					</CardHeader>
					<CardContent>{todayCardBody}</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Pendências</CardTitle>
						<CardDescription>Financeiro em aberto</CardDescription>
					</CardHeader>
					<CardContent>{financeCardBody}</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{tiles.map((tile) => (
					<Link
						key={tile.href}
						href={tile.href}
						className="focus-visible:ring-ring/70 rounded-xl focus-visible:ring-[3px] focus-visible:outline-hidden"
					>
						<Card className="hover:border-brand h-full transition-colors">
							<CardHeader>
								<CardTitle>{tile.title}</CardTitle>
								<CardDescription>{tile.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
};

export default AdminHomePage;
