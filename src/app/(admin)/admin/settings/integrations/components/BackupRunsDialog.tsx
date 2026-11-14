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
import { useGoogleDriveBackupRunsQuery } from "@/queries/googleIntegrationsQuery";

import type { FC } from "react";

const TRIGGER_LABEL: Record<string, string> = {
	manual: "Manual",
	cron: "Cron"
};

const formatBytes = (bytes: number | null) => {
	if (bytes == null) return null;
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const BackupRunsDialog: FC = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" className="min-h-11 sm:min-h-10">
					Ver histórico
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
				<DialogHeader>
					<DialogTitle>Histórico de backup</DialogTitle>
					<DialogDescription>
						Execuções manuais e do cron diário no Google Drive.
					</DialogDescription>
				</DialogHeader>
				<BackupRunsList />
			</DialogContent>
		</Dialog>
	);
};

const BackupRunsList: FC = () => {
	const runsQuery = useGoogleDriveBackupRunsQuery({
		refetchOnMount: "always"
	});

	if (runsQuery.isLoading) return <FormSkeleton />;
	if (runsQuery.isError) {
		return (
			<ErrorState
				message={runsQuery.error.message}
				onRetry={() => runsQuery.refetch()}
			/>
		);
	}

	const rows = runsQuery.data ?? [];
	if (rows.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Nenhum backup executado ainda.
			</p>
		);
	}

	return (
		<ul className="max-h-[55vh] space-y-2 overflow-y-auto text-sm">
			{rows.map((row) => {
				const size = formatBytes(row.bytes);
				const detailParts = [
					row.fileName,
					size,
					row.deletedOldFiles > 0
						? `${row.deletedOldFiles} arquivo(s) antigo(s) removido(s)`
						: null,
					row.errorMessage
				].filter(Boolean);

				return (
					<li
						key={row.id}
						className="border-border rounded-lg border px-3 py-2"
					>
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<span className="font-medium">
								{TRIGGER_LABEL[row.trigger] ?? row.trigger}
								{" · "}
								{row.status === "success" ? "ok" : "erro"}
							</span>
							<span className="text-muted-foreground text-xs">
								{new Date(row.createdAt).toLocaleString("pt-BR")}
							</span>
						</div>
						{detailParts.length > 0 ? (
							<p className="text-muted-foreground mt-1 break-words text-xs">
								{detailParts.join(" · ")}
							</p>
						) : null}
					</li>
				);
			})}
		</ul>
	);
};

export default BackupRunsDialog;
