"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { EmptyState, ErrorState } from "@/components/admin/PageStates";
import { SettingsNav } from "@/components/admin/SettingsNav";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";

type GoogleStatus = {
	configured: boolean;
	connected: boolean;
	googleAccountEmail: string | null;
	connectedAt: string | null;
	calendarId: string | null;
};

type DriveStatus = {
	configured: boolean;
	connected: boolean;
	googleAccountEmail: string | null;
	connectedAt: string | null;
	retentionDays: number;
	lastRun: {
		status: "success" | "error";
		trigger: string;
		fileName: string | null;
		bytes: number | null;
		errorMessage: string | null;
		deletedOldFiles: number;
		createdAt: string;
	} | null;
};

type GoogleCalendar = {
	id: string;
	summary: string;
	primary: boolean;
};

type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	googleCalendarId: string | null;
};

async function fetchGoogleStatus(): Promise<GoogleStatus> {
	const res = await fetch("/api/admin/integrations/google-calendar");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar status.");
	return json.data;
}

async function fetchDriveStatus(): Promise<DriveStatus> {
	const res = await fetch("/api/admin/integrations/google-drive");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar status Drive.");
	return json.data;
}

async function fetchCalendars(): Promise<GoogleCalendar[]> {
	const res = await fetch("/api/admin/integrations/google-calendar/calendars");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao listar agendas.");
	return json.data;
}

async function fetchServiceTypes(): Promise<ServiceType[]> {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data;
}

async function runRestore() {
	const res = await fetch("/api/admin/integrations/google-calendar/restore", {
		method: "POST"
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao restaurar.");
	return json.data as {
		total: number;
		synced: number;
		errors: number;
		skipped: number;
	};
}

function IntegrationsInner() {
	usePageTitle("Integrações");
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { isOwner, isLoading: roleLoading } = useClinicRole();
	const [typeMaps, setTypeMaps] = useState<Record<string, string>>({});

	const statusQuery = useQuery({
		queryKey: ["google-calendar-status"],
		queryFn: fetchGoogleStatus,
		enabled: isOwner
	});

	const driveStatusQuery = useQuery({
		queryKey: ["google-drive-status"],
		queryFn: fetchDriveStatus,
		enabled: isOwner
	});

	const calendarsQuery = useQuery({
		queryKey: ["google-calendars"],
		queryFn: fetchCalendars,
		enabled: Boolean(isOwner && statusQuery.data?.connected)
	});

	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes,
		enabled: Boolean(isOwner && statusQuery.data?.connected)
	});

	useEffect(() => {
		if (!typesQuery.data) return;
		const next: Record<string, string> = {};
		for (const t of typesQuery.data) {
			next[t.id] = t.googleCalendarId ?? "";
		}
		setTypeMaps(next);
	}, [typesQuery.data]);

	const restoreMutation = useMutation({
		mutationFn: runRestore,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["sessions-week"] });
			toast.success(
				`Google: ${data.synced} de ${data.total} agendamentos sincronizados.` +
					(data.errors > 0 ? ` (${data.errors} falha(s))` : "")
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	useEffect(() => {
		const google = searchParams.get("google");
		const drive = searchParams.get("drive");
		if (!google && !drive) return;

		if (google === "connected") {
			toast.success("Google Agenda conectada.");
			queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
			queryClient.invalidateQueries({ queryKey: ["google-calendars"] });
			queryClient.invalidateQueries({ queryKey: ["service-types"] });
			if (searchParams.get("restore") === "1") {
				toast.message("Restaurando agendamentos no Google…");
				restoreMutation.mutate();
			}
		} else if (google === "error") {
			toast.error(
				searchParams.get("message") || "Falha ao conectar Google Agenda."
			);
		}

		if (drive === "connected") {
			toast.success("Google Drive conectado para backups.");
			queryClient.invalidateQueries({ queryKey: ["google-drive-status"] });
		} else if (drive === "error") {
			toast.error(
				searchParams.get("message") || "Falha ao conectar Google Drive."
			);
		}

		window.history.replaceState({}, "", "/admin/settings/integrations");
		// eslint-disable-next-line react-hooks/exhaustive-deps -- só no retorno OAuth
	}, [searchParams, queryClient]);

	const disconnectMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/integrations/google-calendar", {
				method: "DELETE"
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao desconectar.");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
			queryClient.invalidateQueries({ queryKey: ["google-calendars"] });
			toast.success("Google Agenda desconectada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const disconnectDriveMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/integrations/google-drive", {
				method: "DELETE"
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao desconectar Drive.");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["google-drive-status"] });
			toast.success("Google Drive desconectado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const runBackupMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/integrations/google-drive/run", {
				method: "POST"
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha no backup.");
			return json.data as {
				fileName?: string;
				bytes?: number;
				deletedOldFiles: number;
			};
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["google-drive-status"] });
			toast.success(
				`Backup enviado${data.fileName ? `: ${data.fileName}` : "."}` +
					(data.deletedOldFiles > 0
						? ` (${data.deletedOldFiles} antigo(s) removido(s))`
						: "")
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const defaultCalendarMutation = useMutation({
		mutationFn: async (calendarId: string) => {
			const res = await fetch("/api/admin/integrations/google-calendar", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ calendarId })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar.");
			return json.data as { calendarId: string };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
			toast.success("Agenda padrão atualizada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const mappingsMutation = useMutation({
		mutationFn: async () => {
			const mappings = Object.entries(typeMaps).map(
				([serviceTypeId, googleCalendarId]) => ({
					serviceTypeId,
					googleCalendarId: googleCalendarId || null
				})
			);
			const res = await fetch(
				"/api/admin/integrations/google-calendar/mappings",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ mappings })
				}
			);
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar mapeamento.");
			return json.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["service-types"] });
			toast.success("Mapeamento Tipo → agenda salvo.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const status = statusQuery.data;
	const driveStatus = driveStatusQuery.data;
	const calendarOptions = useMemo(() => {
		const list = calendarsQuery.data ?? [];
		return [
			{ value: "", label: "Agenda padrão da conexão" },
			...list.map((c) => ({
				value: c.id,
				label: c.primary ? `${c.summary} (principal)` : c.summary
			}))
		];
	}, [calendarsQuery.data]);

	const defaultOptions = useMemo(() => {
		const list = calendarsQuery.data ?? [];
		if (list.length === 0) {
			return [{ value: "primary", label: "Principal (primary)" }];
		}
		return list.map((c) => ({
			value: c.id,
			label: c.primary ? `${c.summary} (principal)` : c.summary
		}));
	}, [calendarsQuery.data]);

	if (!roleLoading && !isOwner) {
		return (
			<div className="space-y-6">
				<div className="space-y-3">
					<div>
						<h1 className="text-2xl font-medium">Integrações</h1>
						<p className="text-muted-foreground text-sm">
							Conexões externas da clínica.
						</p>
					</div>
					<SettingsNav />
				</div>
				<EmptyState
					title="Acesso restrito"
					description="Apenas o responsável pode gerenciar integrações (Agenda e Drive)."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<div>
					<h1 className="text-2xl font-medium">Integrações</h1>
					<p className="text-muted-foreground text-sm">
						Conexões externas da clínica.
					</p>
				</div>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<CardTitle>Google Agenda</CardTitle>
						{status?.connected ? (
							<Badge>Conectado</Badge>
						) : (
							<Badge variant="secondary">Não conectado</Badge>
						)}
					</div>
					<CardDescription>
						Novos agendamentos e alterações são espelhados nas agendas Google
						conforme o Tipo de atendimento. Ao reconectar, o sistema restaura os
						agendamentos ativos.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{statusQuery.isLoading ? (
						<FormSkeleton />
					) : statusQuery.isError ? (
						<ErrorState
							message={(statusQuery.error as Error).message}
							onRetry={() => statusQuery.refetch()}
						/>
					) : !status?.configured ? (
						<p className="text-muted-foreground text-sm">
							Integração não configurada no servidor. Defina{" "}
							<code className="text-foreground">GOOGLE_CLIENT_ID</code> e{" "}
							<code className="text-foreground">GOOGLE_CLIENT_SECRET</code> no
							ambiente.
						</p>
					) : status.connected ? (
						<>
							<div className="space-y-1 text-sm">
								<p>
									<span className="text-muted-foreground">Conta: </span>
									{status.googleAccountEmail}
								</p>
								{status.connectedAt ? (
									<p>
										<span className="text-muted-foreground">Desde: </span>
										{new Date(status.connectedAt).toLocaleString("pt-BR")}
									</p>
								) : null}
							</div>

							{calendarsQuery.isLoading ? (
								<FormSkeleton />
							) : calendarsQuery.isError ? (
								<ErrorState
									message={(calendarsQuery.error as Error).message}
									onRetry={() => calendarsQuery.refetch()}
								/>
							) : (
								<Select
									label={{ text: "Agenda padrão" }}
									helperText="Usada quando o Tipo não tem agenda específica."
									value={status.calendarId || "primary"}
									options={defaultOptions}
									onChange={(e) =>
										defaultCalendarMutation.mutate(e.target.value)
									}
									disabled={defaultCalendarMutation.isPending}
								/>
							)}

							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									className="min-h-11 sm:min-h-10"
									disabled={restoreMutation.isPending}
									onClick={() => restoreMutation.mutate()}
								>
									{restoreMutation.isPending
										? "Restaurando…"
										: "Restaurar agendamentos no Google"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="min-h-11 sm:min-h-10"
									asChild
								>
									<a href="/api/admin/integrations/google-calendar/connect">
										Reconectar
									</a>
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="min-h-11 sm:min-h-10"
									disabled={disconnectMutation.isPending}
									onClick={() => disconnectMutation.mutate()}
								>
									{disconnectMutation.isPending
										? "Desconectando…"
										: "Desconectar"}
								</Button>
							</div>
						</>
					) : (
						<>
							<p className="text-muted-foreground text-sm">
								Ao conectar, o sistema cria e atualiza eventos quando você
								agenda, remarca ou cancela. Se reconectar depois, os
								agendamentos ativos são recriados no Google.
							</p>
							<Button type="button" className="min-h-11 sm:min-h-10" asChild>
								<a href="/api/admin/integrations/google-calendar/connect">
									Conectar Google Agenda
								</a>
							</Button>
						</>
					)}
				</CardContent>
			</Card>

			{status?.connected ? (
				<Card>
					<CardHeader>
						<CardTitle>Tipo → agenda Google</CardTitle>
						<CardDescription>
							Cada tipo (Domiciliar, Ortopédico…) pode ir para uma agenda
							diferente. Deixe em branco para usar a agenda padrão.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{typesQuery.isLoading || calendarsQuery.isLoading ? (
							<FormSkeleton />
						) : typesQuery.isError ? (
							<ErrorState
								message={(typesQuery.error as Error).message}
								onRetry={() => typesQuery.refetch()}
							/>
						) : (
							<ul className="space-y-3">
								{(typesQuery.data ?? []).map((t) => (
									<li
										key={t.id}
										className="grid gap-2 sm:grid-cols-[1fr_1.2fr] sm:items-end"
									>
										<div>
											<p className="text-sm font-medium">{t.name}</p>
											<p className="text-muted-foreground text-xs">
												{t.isActive ? "Ativo" : "Inativo"}
											</p>
										</div>
										<Select
											label={{ text: "Agenda Google" }}
											value={typeMaps[t.id] ?? ""}
											options={calendarOptions}
											onChange={(e) =>
												setTypeMaps((prev) => ({
													...prev,
													[t.id]: e.target.value
												}))
											}
										/>
									</li>
								))}
							</ul>
						)}
						<Button
							type="button"
							className="min-h-11 sm:min-h-10"
							disabled={mappingsMutation.isPending}
							onClick={() => mappingsMutation.mutate()}
						>
							{mappingsMutation.isPending
								? "Salvando…"
								: "Salvar mapeamento"}
						</Button>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<CardTitle>Backup Google Drive</CardTitle>
						{driveStatus?.connected ? (
							<Badge>Conectado</Badge>
						) : (
							<Badge variant="secondary">Não conectado</Badge>
						)}
					</div>
					<CardDescription>
						Cópia diária dos dados da clínica em JSON na pasta “FisioGeovane
						Backups”. Mantém só os últimos{" "}
						{driveStatus?.retentionDays ?? 30} dias (os mais antigos são
						apagados automaticamente).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{driveStatusQuery.isLoading ? (
						<FormSkeleton />
					) : driveStatusQuery.isError ? (
						<ErrorState
							message={(driveStatusQuery.error as Error).message}
							onRetry={() => driveStatusQuery.refetch()}
						/>
					) : !driveStatus?.configured ? (
						<p className="text-muted-foreground text-sm">
							Integração não configurada no servidor. Defina{" "}
							<code className="text-foreground">GOOGLE_CLIENT_ID</code>,{" "}
							<code className="text-foreground">GOOGLE_CLIENT_SECRET</code> e
							ative a Google Drive API. Para o cron, defina também{" "}
							<code className="text-foreground">CRON_SECRET</code>.
						</p>
					) : driveStatus.connected ? (
						<>
							<div className="space-y-1 text-sm">
								<p>
									<span className="text-muted-foreground">Conta: </span>
									{driveStatus.googleAccountEmail}
								</p>
								{driveStatus.connectedAt ? (
									<p>
										<span className="text-muted-foreground">Desde: </span>
										{new Date(driveStatus.connectedAt).toLocaleString("pt-BR")}
									</p>
								) : null}
								{driveStatus.lastRun ? (
									<p>
										<span className="text-muted-foreground">
											Último backup:{" "}
										</span>
										{new Date(driveStatus.lastRun.createdAt).toLocaleString(
											"pt-BR"
										)}{" "}
										·{" "}
										{driveStatus.lastRun.status === "success"
											? "ok"
											: "erro"}
										{driveStatus.lastRun.fileName
											? ` · ${driveStatus.lastRun.fileName}`
											: ""}
										{driveStatus.lastRun.errorMessage
											? ` — ${driveStatus.lastRun.errorMessage}`
											: ""}
									</p>
								) : (
									<p className="text-muted-foreground">
										Nenhum backup executado ainda.
									</p>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									className="min-h-11 sm:min-h-10"
									disabled={runBackupMutation.isPending}
									onClick={() => runBackupMutation.mutate()}
								>
									{runBackupMutation.isPending
										? "Gerando backup…"
										: "Fazer backup agora"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="min-h-11 sm:min-h-10"
									asChild
								>
									<a href="/api/admin/integrations/google-drive/connect">
										Reconectar
									</a>
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="min-h-11 sm:min-h-10"
									disabled={disconnectDriveMutation.isPending}
									onClick={() => disconnectDriveMutation.mutate()}
								>
									{disconnectDriveMutation.isPending
										? "Desconectando…"
										: "Desconectar"}
								</Button>
							</div>
						</>
					) : (
						<>
							<p className="text-muted-foreground text-sm">
								Ao conectar, o app cria a pasta de backups no Drive da conta
								autorizada. O cron diário (Vercel) e o botão “Fazer backup
								agora” usam a mesma lógica. Dados clínicos ficam nessa conta
								Google.
							</p>
							<Button type="button" className="min-h-11 sm:min-h-10" asChild>
								<a href="/api/admin/integrations/google-drive/connect">
									Conectar Google Drive
								</a>
							</Button>
						</>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>WhatsApp / lembretes</CardTitle>
					<CardDescription>Em breve</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Lembretes automáticos ficam para uma etapa futura.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default function IntegrationsPage() {
	return (
		<Suspense
			fallback={
				<div className="space-y-6">
					<div className="space-y-3">
						<h1 className="text-2xl font-medium">Integrações</h1>
						<SettingsNav />
					</div>
					<FormSkeleton />
				</div>
			}
		>
			<IntegrationsInner />
		</Suspense>
	);
}
