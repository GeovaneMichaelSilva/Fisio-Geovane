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
import { Select } from "@/components/ui/Select";

import type { FC, ReactNode } from "react";
import type { GoogleStatus } from "./integrationsApi";

type GoogleCalendarSectionProps = {
	status: GoogleStatus | undefined;
	statusLoading: boolean;
	statusError: Error | null;
	onStatusRetry: () => void;
	calendarsLoading: boolean;
	calendarsError: Error | null;
	onCalendarsRetry: () => void;
	defaultOptions: Array<{ value: string; label: string }>;
	restorePending: boolean;
	onRestore: () => void;
	disconnectPending: boolean;
	onDisconnect: () => void;
	defaultCalendarPending: boolean;
	onDefaultCalendarChange: (calendarId: string) => void;
};

const GoogleCalendarSection: FC<GoogleCalendarSectionProps> = (props) => {
	const {
		status,
		statusLoading,
		statusError,
		onStatusRetry,
		calendarsLoading,
		calendarsError,
		onCalendarsRetry,
		defaultOptions,
		restorePending,
		onRestore,
		disconnectPending,
		onDisconnect,
		defaultCalendarPending,
		onDefaultCalendarChange
	} = props;

	let cardBody: ReactNode;
	if (statusLoading) {
		cardBody = <FormSkeleton />;
	} else if (statusError) {
		cardBody = (
			<ErrorState message={statusError.message} onRetry={onStatusRetry} />
		);
	} else if (!status?.configured) {
		cardBody = (
			<p className="text-muted-foreground text-sm">
				Integração não configurada no servidor. Defina{" "}
				<code className="text-foreground">GOOGLE_CLIENT_ID</code> e{" "}
				<code className="text-foreground">GOOGLE_CLIENT_SECRET</code> no
				ambiente.
			</p>
		);
	} else if (status.connected) {
		let calendarSelect: ReactNode;
		if (calendarsLoading) {
			calendarSelect = <FormSkeleton />;
		} else if (calendarsError) {
			calendarSelect = (
				<ErrorState
					message={calendarsError.message}
					onRetry={onCalendarsRetry}
				/>
			);
		} else {
			calendarSelect = (
				<Select
					label={{ text: "Agenda padrão" }}
					helperText="Usada quando o Tipo não tem agenda específica."
					value={status.calendarId || "primary"}
					options={defaultOptions}
					onChange={(e) => onDefaultCalendarChange(e.target.value)}
					disabled={defaultCalendarPending}
				/>
			);
		}

		cardBody = (
			<div className="space-y-4">
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
				{calendarSelect}
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						className="min-h-11 sm:min-h-10"
						disabled={restorePending}
						onClick={onRestore}
					>
						{restorePending
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
					Ao conectar, o sistema cria e atualiza eventos quando você agenda,
					remarca ou cancela. Se reconectar depois, os agendamentos ativos são
					recriados no Google.
				</p>
				<Button type="button" className="min-h-11 sm:min-h-10" asChild>
					<a href="/api/admin/integrations/google-calendar/connect">
						Conectar Google Agenda
					</a>
				</Button>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>Conexão</CardTitle>
					{status?.connected ? (
						<Badge>Conectado</Badge>
					) : (
						<Badge variant="destructive">Não conectado</Badge>
					)}
				</div>
				<CardDescription>
					Conta Google usada para criar e atualizar eventos. Ao reconectar, o
					sistema restaura os agendamentos ativos.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">{cardBody}</CardContent>
		</Card>
	);
};

export default GoogleCalendarSection;
