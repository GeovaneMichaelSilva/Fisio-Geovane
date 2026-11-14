"use client";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState } from "@/components/admin/PageStates";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/Dialog";
import { useGoogleCalendarSyncLogsQuery } from "@/queries/googleIntegrationsQuery";

import type { FC } from "react";

const SOURCE_LABEL: Record<string, string> = {
	webhook: "Aviso Google",
	catch_up: "Catch-up",
	subscribe: "Ao salvar",
	watch_renew: "Watch",
	cron: "Cron",
	handshake: "Handshake"
};

const STATUS_LABEL: Record<string, string> = {
	ok: "ok",
	error: "erro",
	ignored: "ignorado"
};

const OverlaySyncLogsDialog: FC = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" className="min-h-11 sm:min-h-10">
					Ver histórico
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
				<DialogHeader>
					<DialogTitle>Histórico de sincronização</DialogTitle>
					<DialogDescription>
						Avisos do Google, sync e renovação do watch das agendas de overlay.
					</DialogDescription>
				</DialogHeader>
				<OverlaySyncLogsList />
			</DialogContent>
		</Dialog>
	);
};

const OverlaySyncLogsList: FC = () => {
	const logsQuery = useGoogleCalendarSyncLogsQuery({
		refetchOnMount: "always"
	});

	if (logsQuery.isLoading) return <FormSkeleton />;
	if (logsQuery.isError) {
		return (
			<ErrorState
				message={logsQuery.error.message}
				onRetry={() => logsQuery.refetch()}
			/>
		);
	}

	const rows = logsQuery.data ?? [];
	if (rows.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Nenhum evento de sincronização ainda.
			</p>
		);
	}

	return (
		<ul className="max-h-[55vh] space-y-2 overflow-y-auto text-sm">
			{rows.map((row) => (
				<li
					key={row.id}
					className="border-border rounded-lg border px-3 py-2"
				>
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<span className="font-medium">
							{SOURCE_LABEL[row.source] ?? row.source}
							{" · "}
							{STATUS_LABEL[row.status] ?? row.status}
						</span>
						<span className="text-muted-foreground text-xs">
							{new Date(row.createdAt).toLocaleString("pt-BR")}
						</span>
					</div>
					{row.detail ? (
						<p className="text-muted-foreground mt-1 break-words text-xs">
							{row.detail}
						</p>
					) : null}
				</li>
			))}
		</ul>
	);
};

export default OverlaySyncLogsDialog;
