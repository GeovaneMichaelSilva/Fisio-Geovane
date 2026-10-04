"use client";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState } from "@/components/admin/PageStates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";

import type { FC, ReactNode } from "react";
import type { DriveStatus } from "./integrationsApi";

type GoogleDriveSectionProps = {
	driveStatus: DriveStatus | undefined;
	loading: boolean;
	error: Error | null;
	onRetry: () => void;
	backupPending: boolean;
	onBackup: () => void;
	disconnectPending: boolean;
	onDisconnect: () => void;
};

const GoogleDriveSection: FC<GoogleDriveSectionProps> = (props) => {
	const {
		driveStatus,
		loading,
		error,
		onRetry,
		backupPending,
		onBackup,
		disconnectPending,
		onDisconnect
	} = props;

	let cardBody: ReactNode;
	if (loading) {
		cardBody = <FormSkeleton />;
	} else if (error) {
		cardBody = <ErrorState message={error.message} onRetry={onRetry} />;
	} else if (!driveStatus?.configured) {
		cardBody = (
			<p className="text-muted-foreground text-sm">
				Integração não configurada no servidor. Defina{" "}
				<code className="text-foreground">GOOGLE_CLIENT_ID</code>,{" "}
				<code className="text-foreground">GOOGLE_CLIENT_SECRET</code> e ative a
				Google Drive API. Para o cron, defina também{" "}
				<code className="text-foreground">CRON_SECRET</code>.
			</p>
		);
	} else if (driveStatus.connected) {
		let lastRunLine: ReactNode;
		if (driveStatus.lastRun) {
			const run = driveStatus.lastRun;
			lastRunLine = (
				<p>
					<span className="text-muted-foreground">Último backup: </span>
					{new Date(run.createdAt).toLocaleString("pt-BR")} ·{" "}
					{run.status === "success" ? "ok" : "erro"}
					{run.fileName ? ` · ${run.fileName}` : ""}
					{run.errorMessage ? ` — ${run.errorMessage}` : ""}
				</p>
			);
		} else {
			lastRunLine = (
				<p className="text-muted-foreground">Nenhum backup executado ainda.</p>
			);
		}

		cardBody = (
			<div className="space-y-4">
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
					{lastRunLine}
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						className="min-h-11 sm:min-h-10"
						disabled={backupPending}
						onClick={onBackup}
					>
						{backupPending ? "Gerando backup…" : "Fazer backup agora"}
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
						disabled={disconnectPending}
						onClick={onDisconnect}
					>
						{disconnectPending ? "Desconectando…" : "Desconectar"}
					</Button>
				</div>
			</div>
		);
	} else {
		cardBody = (
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">
					Ao conectar, o app cria a pasta de backups no Drive da conta
					autorizada. O cron diário (Vercel) e o botão “Fazer backup agora” usam
					a mesma lógica. Dados clínicos ficam nessa conta Google.
				</p>
				<Button type="button" className="min-h-11 sm:min-h-10" asChild>
					<a href="/api/admin/integrations/google-drive/connect">
						Conectar Google Drive
					</a>
				</Button>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>Conexão e pasta</CardTitle>
					{driveStatus?.connected ? (
						<Badge>Conectado</Badge>
					) : (
						<Badge variant="destructive">Não conectado</Badge>
					)}
				</div>
				<CardDescription>
					JSON diário na pasta “FisioGeovane Backups”. Mantém só os últimos{" "}
					{driveStatus?.retentionDays ?? 30} dias (os mais antigos são apagados
					automaticamente).
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">{cardBody}</CardContent>
		</Card>
	);
};

export default GoogleDriveSection;
