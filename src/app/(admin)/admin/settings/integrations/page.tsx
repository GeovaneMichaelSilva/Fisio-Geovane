"use client";

import { Suspense, useEffect } from "react";
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
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";

type GoogleStatus = {
	configured: boolean;
	connected: boolean;
	googleAccountEmail: string | null;
	connectedAt: string | null;
	calendarId: string | null;
};

async function fetchGoogleStatus(): Promise<GoogleStatus> {
	const res = await fetch("/api/admin/integrations/google-calendar");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar status.");
	return json.data;
}

function IntegrationsInner() {
	usePageTitle("Integrações");
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { isOwner, isLoading: roleLoading } = useClinicRole();

	const statusQuery = useQuery({
		queryKey: ["google-calendar-status"],
		queryFn: fetchGoogleStatus,
		enabled: isOwner
	});

	useEffect(() => {
		const google = searchParams.get("google");
		if (!google) return;
		if (google === "connected") {
			toast.success("Google Agenda conectada.");
			queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
		} else if (google === "error") {
			toast.error(
				searchParams.get("message") || "Falha ao conectar Google Agenda."
			);
		}
		window.history.replaceState({}, "", "/admin/settings/integrations");
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
			toast.success("Google Agenda desconectada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const status = statusQuery.data;

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
					description="Apenas o responsável pode conectar ou desconectar o Google Agenda."
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
						Novos agendamentos e alterações de horário são espelhados na agenda
						Google da conta conectada.
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
							ambiente (Google Cloud Console → OAuth 2.0) e o redirect{" "}
							<code className="text-foreground break-all">
								/api/admin/integrations/google-calendar/callback
							</code>
							.
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
								<p>
									<span className="text-muted-foreground">Calendário: </span>
									{status.calendarId === "primary"
										? "Principal"
										: status.calendarId}
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
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
								agenda, remarca ou cancela atendimentos. O login do sistema
								continua sendo e-mail e senha.
							</p>
							<Button
								type="button"
								className="min-h-11 sm:min-h-10"
								asChild
							>
								<a href="/api/admin/integrations/google-calendar/connect">
									Conectar Google Agenda
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
