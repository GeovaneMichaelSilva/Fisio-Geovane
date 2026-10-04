"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/admin/PageStates";
import SettingsNav from "@/components/admin/SettingsNav";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	googleCalendarQueryKeys,
	googleDriveQueryKeys,
	useDisconnectGoogleCalendarMutation,
	useDisconnectGoogleDriveMutation,
	useGoogleCalendarStatusQuery,
	useGoogleCalendarsQuery,
	useGoogleDriveStatusQuery,
	usePatchGoogleCalendarDefaultMutation,
	useRestoreGoogleCalendarMutation,
	useRunGoogleDriveBackupMutation,
	useSaveGoogleCalendarMappingsMutation
} from "@/queries/googleIntegrationsQuery";
import {
	serviceTypeQueryKeys,
	useServiceTypesQuery
} from "@/queries/serviceTypeQuery";

import GoogleCalendarSection from "./GoogleCalendarSection";
import GoogleDriveSection from "./GoogleDriveSection";
import TypeMappingSection from "./TypeMappingSection";

import type { FC } from "react";

const IntegrationsInner: FC = () => {
	usePageTitle("Integrações");
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { isOwner, isLoading: roleLoading } = useClinicRole();
	const [typeMaps, setTypeMaps] = useState<Record<string, string>>({});

	const statusQuery = useGoogleCalendarStatusQuery({
		enabled: isOwner
	});

	const driveStatusQuery = useGoogleDriveStatusQuery({
		enabled: isOwner
	});

	const calendarsQuery = useGoogleCalendarsQuery({
		enabled: Boolean(isOwner && statusQuery.data?.connected)
	});

	const typesQuery = useServiceTypesQuery({
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

	const restoreMutation = useRestoreGoogleCalendarMutation({
		onSuccess: (data) => {
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
			queryClient.invalidateQueries({
				queryKey: googleCalendarQueryKeys.root()
			});
			queryClient.invalidateQueries({
				queryKey: serviceTypeQueryKeys.list()
			});
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
			queryClient.invalidateQueries({
				queryKey: googleDriveQueryKeys.root()
			});
		} else if (drive === "error") {
			toast.error(
				searchParams.get("message") || "Falha ao conectar Google Drive."
			);
		}

		window.history.replaceState({}, "", "/admin/settings/integrations");
		// eslint-disable-next-line react-hooks/exhaustive-deps -- só no retorno OAuth
	}, [searchParams, queryClient]);

	const disconnectMutation = useDisconnectGoogleCalendarMutation({
		onSuccess: () => {
			toast.success("Google Agenda desconectada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const disconnectDriveMutation = useDisconnectGoogleDriveMutation({
		onSuccess: () => {
			toast.success("Google Drive desconectado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const runBackupMutation = useRunGoogleDriveBackupMutation({
		onSuccess: (data) => {
			toast.success(
				`Backup enviado${data.fileName ? `: ${data.fileName}` : "."}` +
					(data.deletedOldFiles > 0
						? ` (${data.deletedOldFiles} antigo(s) removido(s))`
						: "")
			);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const defaultCalendarMutation = usePatchGoogleCalendarDefaultMutation({
		onSuccess: () => {
			toast.success("Agenda padrão atualizada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const mappingsMutation = useSaveGoogleCalendarMappingsMutation({
		onSuccess: () => {
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
					<PageHeader
						title="Integrações"
						description="Conexões externas da clínica."
					/>
					<SettingsNav />
				</div>
				<EmptyState
					title="Acesso restrito"
					description="Apenas o responsável pode gerenciar integrações (Agenda e Drive)."
				/>
			</div>
		);
	}

	let typeMappingNode = null;
	if (status?.connected) {
		typeMappingNode = (
			<TypeMappingSection
				types={typesQuery.data}
				typesLoading={typesQuery.isLoading}
				typesError={typesQuery.isError ? (typesQuery.error as Error) : null}
				onTypesRetry={() => typesQuery.refetch()}
				calendarsLoading={calendarsQuery.isLoading}
				calendarOptions={calendarOptions}
				typeMaps={typeMaps}
				onTypeMapChange={(serviceTypeId, googleCalendarId) =>
					setTypeMaps((prev) => ({
						...prev,
						[serviceTypeId]: googleCalendarId
					}))
				}
				savePending={mappingsMutation.isPending}
				onSave={() =>
					mappingsMutation.mutate(
						Object.entries(typeMaps).map(([serviceTypeId, googleCalendarId]) => ({
							serviceTypeId,
							googleCalendarId: googleCalendarId || null
						}))
					)
				}
			/>
		);
	}

	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<PageHeader
					title="Integrações"
					description="Conexões externas da clínica — agenda operacional e backup."
				/>
				<SettingsNav />
			</div>

			<section className="space-y-4" aria-labelledby="integrations-agenda">
				<div className="space-y-1">
					<h2
						id="integrations-agenda"
						className="text-lg font-medium text-[hsl(158_60%_16%)]"
					>
						Google Agenda
					</h2>
					<p className="text-muted-foreground text-sm">
						Espelha agendamentos da clínica nas agendas Google e define qual
						agenda usar por tipo de atendimento.
					</p>
				</div>
				<GoogleCalendarSection
					status={status}
					statusLoading={statusQuery.isLoading}
					statusError={
						statusQuery.isError ? (statusQuery.error as Error) : null
					}
					onStatusRetry={() => statusQuery.refetch()}
					calendarsLoading={calendarsQuery.isLoading}
					calendarsError={
						calendarsQuery.isError ? (calendarsQuery.error as Error) : null
					}
					onCalendarsRetry={() => calendarsQuery.refetch()}
					defaultOptions={defaultOptions}
					restorePending={restoreMutation.isPending}
					onRestore={() => restoreMutation.mutate()}
					disconnectPending={disconnectMutation.isPending}
					onDisconnect={() => disconnectMutation.mutate()}
					defaultCalendarPending={defaultCalendarMutation.isPending}
					onDefaultCalendarChange={(calendarId) =>
						defaultCalendarMutation.mutate(calendarId)
					}
				/>
				{typeMappingNode}
			</section>

			<section
				className="border-border space-y-4 border-t pt-8"
				aria-labelledby="integrations-backup"
			>
				<div className="space-y-1">
					<h2
						id="integrations-backup"
						className="text-lg font-medium text-[hsl(158_60%_16%)]"
					>
						Backup (Google Drive)
					</h2>
					<p className="text-muted-foreground text-sm">
						Cópia automática dos dados da clínica no Drive. Independente da
						sincronização de agenda.
					</p>
				</div>
				<GoogleDriveSection
					driveStatus={driveStatus}
					loading={driveStatusQuery.isLoading}
					error={
						driveStatusQuery.isError
							? (driveStatusQuery.error as Error)
							: null
					}
					onRetry={() => driveStatusQuery.refetch()}
					backupPending={runBackupMutation.isPending}
					onBackup={() => runBackupMutation.mutate()}
					disconnectPending={disconnectDriveMutation.isPending}
					onDisconnect={() => disconnectDriveMutation.mutate()}
				/>
			</section>
		</div>
	);
};

export default IntegrationsInner;
