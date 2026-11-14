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
	useGoogleDriveBackupRunsQuery,
	type GoogleDriveBackupRun
} from "@/queries/googleIntegrationsQuery";
import { cn } from "@/utils";

import type { FC } from "react";

const TRIGGER_LABEL: Record<string, string> = {
	manual: "Manual",
	cron: "Agendado"
};

const formatBytes = (bytes: number | null) => {
	if (bytes == null) return null;
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (iso: string) =>
	new Date(iso).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});

const BackupRunsDialog: FC = () => {
	const runsQuery = useGoogleDriveBackupRunsQuery({
		refetchOnMount: "always"
	});
	const refreshing = runsQuery.isFetching && !runsQuery.isLoading;
	const rows = runsQuery.data ?? [];

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
					<DialogTitle>Histórico de backup</DialogTitle>
					<DialogDescription>
						Execuções manuais e do cron diário no Google Drive.
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-between gap-2 px-4">
					<p className="text-muted-foreground text-xs">
						{!runsQuery.isLoading && !runsQuery.isError
							? `${rows.length} ${rows.length === 1 ? "execução" : "execuções"}`
							: null}
					</p>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="shrink-0"
						onClick={() => runsQuery.refetch()}
						disabled={runsQuery.isFetching}
						aria-label="Atualizar histórico"
						title="Atualizar"
					>
						<RefreshCw className={cn(refreshing && "animate-spin")} />
					</Button>
				</div>
				<DialogBody className="space-y-3">
					{runsQuery.isLoading ? <FormSkeleton /> : null}
					{runsQuery.isError ? (
						<ErrorState
							message={runsQuery.error.message}
							onRetry={() => runsQuery.refetch()}
						/>
					) : null}
					{!runsQuery.isLoading && !runsQuery.isError && rows.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nenhum backup executado ainda.
						</p>
					) : null}
					{!runsQuery.isLoading && !runsQuery.isError && rows.length > 0 ? (
						<ul className="space-y-2">
							{rows.map((row) => (
								<BackupRunItem key={row.id} row={row} />
							))}
						</ul>
					) : null}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};

const BackupRunItem: FC<{ row: GoogleDriveBackupRun }> = ({ row }) => {
	const size = formatBytes(row.bytes);
	const isSuccess = row.status === "success";

	return (
		<li className="border-border rounded-lg border px-3 py-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-1.5">
					<Tag color={isSuccess ? "success" : "destructive"}>
						{isSuccess ? "Sucesso" : "Erro"}
					</Tag>
					<Tag variant="outline">
						{TRIGGER_LABEL[row.trigger] ?? row.trigger}
					</Tag>
				</div>
				<time
					dateTime={row.createdAt}
					className="text-muted-foreground text-xs tabular-nums"
				>
					{formatDateTime(row.createdAt)}
				</time>
			</div>

			<dl className="mt-2.5 space-y-1 text-sm">
				{row.fileName ? (
					<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
						<dt className="text-muted-foreground shrink-0 sm:w-24">Arquivo</dt>
						<dd className="min-w-0 font-medium break-all">{row.fileName}</dd>
					</div>
				) : null}
				{size ? (
					<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
						<dt className="text-muted-foreground shrink-0 sm:w-24">Tamanho</dt>
						<dd>{size}</dd>
					</div>
				) : null}
				{row.deletedOldFiles > 0 ? (
					<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
						<dt className="text-muted-foreground shrink-0 sm:w-24">Limpeza</dt>
						<dd>
							{row.deletedOldFiles} arquivo
							{row.deletedOldFiles === 1 ? "" : "s"} antigo
							{row.deletedOldFiles === 1 ? "" : "s"} removido
							{row.deletedOldFiles === 1 ? "" : "s"}
						</dd>
					</div>
				) : null}
				{row.errorMessage ? (
					<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
						<dt className="text-muted-foreground shrink-0 sm:w-24">Erro</dt>
						<dd className="text-destructive break-words">{row.errorMessage}</dd>
					</div>
				) : null}
			</dl>
		</li>
	);
};

export default BackupRunsDialog;
