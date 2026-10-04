"use client";

import Link from "next/link";

import { AdminList, AdminListItem } from "@/components/admin/AdminList";
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
import { useFinanceHomeQuery } from "@/queries/financeQuery";
import { useSessionsTodayQuery } from "@/queries/sessionQuery";

import type { FC } from "react";

const formatBrl = (value: string) =>
	Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});

const AdminHomePage: FC = () => {
	usePageTitle("Início");

	const today = toDateString(new Date());
	const todayQuery = useSessionsTodayQuery(today);
	const financeQuery = useFinanceHomeQuery();
	const monday = startOfWeekMonday(new Date());
	const upcoming =
		todayQuery.data?.filter((s) => s.status === "scheduled").slice(0, 5) ?? [];

	const todayReady = !todayQuery.isLoading && !todayQuery.isError;
	const todayEmpty = todayReady && upcoming.length === 0;
	const financeReady =
		!financeQuery.isLoading && !financeQuery.isError && financeQuery.data;

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
				description="Resumo do dia: próximos horários e pendências financeiras."
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
					<CardContent>
						{todayQuery.isLoading && (
							<div className="space-y-2">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						)}
						{todayQuery.isError && (
							<ErrorState
								message={(todayQuery.error as Error).message}
								onRetry={() => todayQuery.refetch()}
							/>
						)}
						{todayEmpty && (
							<EmptyState
								title="Nenhum horário agendado para hoje"
								description="Crie um agendamento ou avance para a semana."
								action={
									<div className="flex flex-wrap gap-2">
										<Button asChild size="sm">
											<Link href={`/admin/agenda?date=${today}`}>
												Agendar hoje
											</Link>
										</Button>
										<Button asChild size="sm" variant="outline">
											<Link href={`/admin/agenda?date=${toDateString(monday)}`}>
												Ver semana
											</Link>
										</Button>
									</div>
								}
							/>
						)}
						{todayReady && upcoming.length > 0 && (
							<AdminList>
								{upcoming.map((s) => (
									<AdminListItem key={s.id}>
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
												<Link href={`/admin/sessions/${s.id}`}>Ver</Link>
											</Button>
											{s.status === "scheduled" && (
												<Button asChild size="sm">
													<Link href={`/admin/sessions/${s.id}?mode=clinical`}>
														INICIAR
													</Link>
												</Button>
											)}
										</div>
									</AdminListItem>
								))}
							</AdminList>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Pendências</CardTitle>
						<CardDescription>Financeiro em aberto</CardDescription>
					</CardHeader>
					<CardContent>
						{financeQuery.isLoading && <Skeleton className="h-16 w-full" />}
						{financeQuery.isError && (
							<ErrorState
								message={(financeQuery.error as Error).message}
								onRetry={() => financeQuery.refetch()}
							/>
						)}
						{!financeQuery.isLoading &&
							!financeQuery.isError &&
							!financeQuery.data && (
								<EmptyState
									title="Sem dados financeiros"
									description="Conclua atendimentos para ver pendências."
								/>
							)}
						{financeReady && (
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
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AdminHomePage;
