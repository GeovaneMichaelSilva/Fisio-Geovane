"use client";

import { RefreshCw } from "lucide-react";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState } from "@/components/admin/PageStates";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import {
	useGoogleCalendarSyncLogsQuery,
	type GoogleCalendarSyncLog
} from "@/queries/googleIntegrationsQuery";
import { cn } from "@/utils";

import type { TagProps } from "@/components/ui/Tag";
import type { FC } from "react";

const SOURCE_LABEL: Record<string, string> = {
	webhook: "Aviso Google",
	catch_up: "Catch-up",
	subscribe: "Ao salvar",
	watch_renew: "Renovação watch",
	cron: "Agendado",
	handshake: "Handshake"
};

const STATUS_META: Record<
	GoogleCalendarSyncLog["status"],
	{
		label: string;
		color: NonNullable<TagProps["color"]>;
	}
> = {
	ok: { label: "Ok", color: "success" },
	error: { label: "Erro", color: "destructive" },
	ignored: { label: "Ignorado", color: "warning" }
};

const DETAIL_LABELS: Record<string, string> = {
	expira: "Expira",
	url: "URL"
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const formatDateTime = (iso: string) =>
	new Date(iso).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});

const formatDetailValue = (value: string) =>
	ISO_DATE_RE.test(value) ? formatDateTime(value) : value;

/** Quebra `expira …; url …` em linhas rotuladas; texto simples fica numa linha só. */
const parseDetailParts = (
	detail: string
): Array<{ label: string | null; value: string }> => {
	const segments = detail
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean);

	if (segments.length <= 1) {
		return [{ label: null, value: detail.trim() }];
	}

	return segments.map((segment) => {
		const spaceIdx = segment.indexOf(" ");
		if (spaceIdx === -1) return { label: null, value: segment };

		const key = segment.slice(0, spaceIdx).toLowerCase();
		const value = segment.slice(spaceIdx + 1).trim();
		const label = DETAIL_LABELS[key];
		if (!label) return { label: null, value: segment };

		return { label, value: formatDetailValue(value) };
	});
};

const OverlaySyncLogsDialog: FC = () => {
	const logsQuery = useGoogleCalendarSyncLogsQuery({
		refetchOnMount: "always"
	});
	const refreshing = logsQuery.isFetching && !logsQuery.isLoading;
	const rows = logsQuery.data ?? [];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="min-h-11 sm:min-h-10"
				>
					Ver histórico
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
				<DialogHeader>
					<DialogTitle>Histórico de sincronização</DialogTitle>
					<DialogDescription>
						Avisos do Google, sync e renovação do watch das agendas de
						overlay.
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-between gap-2 px-4">
					<p className="text-muted-foreground text-xs">
						{!logsQuery.isLoading && !logsQuery.isError
							? `${rows.length} ${rows.length === 1 ? "evento" : "eventos"}`
							: null}
					</p>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="shrink-0"
						onClick={() => logsQuery.refetch()}
						disabled={logsQuery.isFetching}
						aria-label="Atualizar histórico"
						title="Atualizar"
					>
						<RefreshCw className={cn(refreshing && "animate-spin")} />
					</Button>
				</div>
				<DialogBody className="space-y-3">
					{logsQuery.isLoading ? <FormSkeleton /> : null}
					{logsQuery.isError ? (
						<ErrorState
							message={logsQuery.error.message}
							onRetry={() => logsQuery.refetch()}
						/>
					) : null}
					{!logsQuery.isLoading && !logsQuery.isError && rows.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nenhum evento de sincronização ainda.
						</p>
					) : null}
					{!logsQuery.isLoading && !logsQuery.isError && rows.length > 0 ? (
						<ul className="space-y-2">
							{rows.map((row) => (
								<SyncLogItem key={row.id} row={row} />
							))}
						</ul>
					) : null}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};

const SyncLogItem: FC<{ row: GoogleCalendarSyncLog }> = ({ row }) => {
	const status = STATUS_META[row.status] ?? {
		label: row.status,
		color: "default" as const
	};
	const detailParts = row.detail ? parseDetailParts(row.detail) : [];
	const isError = row.status === "error";

	return (
		<li className="border-border rounded-lg border px-3 py-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-1.5">
					<Tag color={status.color}>{status.label}</Tag>
					<Tag variant="outline">
						{SOURCE_LABEL[row.source] ?? row.source}
					</Tag>
				</div>
				<time
					dateTime={row.createdAt}
					className="text-muted-foreground text-xs tabular-nums"
				>
					{formatDateTime(row.createdAt)}
				</time>
			</div>

			{detailParts.length > 0 ? (
				<dl
					className={cn(
						"mt-2.5 space-y-1 text-sm",
						isError ? "text-destructive" : "text-foreground"
					)}
				>
					{detailParts.map((part, index) =>
						part.label ? (
							<div
								key={`${part.label}-${index}`}
								className="flex flex-col gap-0.5 sm:flex-row sm:gap-2"
							>
								<dt className="text-muted-foreground shrink-0 sm:w-16">
									{part.label}
								</dt>
								<dd className="min-w-0 break-all">{part.value}</dd>
							</div>
						) : (
							<div key={`text-${index}`}>
								<dd
									className={cn(isError ? undefined : "text-muted-foreground")}
								>
									{part.value}
								</dd>
							</div>
						)
					)}
				</dl>
			) : null}
		</li>
	);
};

export default OverlaySyncLogsDialog;
