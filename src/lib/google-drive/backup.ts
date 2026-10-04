import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
	backupRuns,
	clinics,
	googleDriveConnections,
	patients,
	serviceTypes,
	sessionAudits,
	sessions
} from "@/db/schema";
import { getValidDriveAccessToken } from "@/lib/google-drive/client";
import {
	ensureBackupFolder,
	listBackupFiles,
	trashDriveFile,
	uploadBackupJson
} from "@/lib/google-drive/drive-api";
import {
	BACKUP_RETENTION_DAYS,
	buildBackupFileName,
	filesOlderThanRetention
} from "@/lib/google-drive/retention";

import type { Db } from "@/db";

export const BACKUP_SCHEMA_VERSION = 1;

export type ClinicBackupPayload = {
	version: number;
	exportedAt: string;
	retentionDays: number;
	clinic: {
		id: string;
		displayName: string;
		professionLabel: string;
		licenseNumber: string | null;
		timezone: string;
		defaultSessionDurationMinutes: number;
	};
	serviceTypes: unknown[];
	patients: unknown[];
	sessions: unknown[];
	sessionAudits: unknown[];
};

/**
 * Monta payload JSON de backup da clínica (sem senhas / tokens).
 */
export const buildClinicBackupPayload = async (
	clinicId: string,
	db: Db = getDb()
): Promise<ClinicBackupPayload> => {
	const [clinic] = await db
		.select({
			id: clinics.id,
			displayName: clinics.displayName,
			professionLabel: clinics.professionLabel,
			licenseNumber: clinics.licenseNumber,
			timezone: clinics.timezone,
			defaultSessionDurationMinutes: clinics.defaultSessionDurationMinutes
		})
		.from(clinics)
		.where(eq(clinics.id, clinicId))
		.limit(1);

	if (!clinic) {
		throw new Error("Clínica não encontrada.");
	}

	const [types, patientRows, sessionRows, auditRows] = await Promise.all([
		db.select().from(serviceTypes).where(eq(serviceTypes.clinicId, clinicId)),
		db.select().from(patients).where(eq(patients.clinicId, clinicId)),
		db.select().from(sessions).where(eq(sessions.clinicId, clinicId)),
		db.select().from(sessionAudits).where(eq(sessionAudits.clinicId, clinicId))
	]);

	return {
		version: BACKUP_SCHEMA_VERSION,
		exportedAt: new Date().toISOString(),
		retentionDays: BACKUP_RETENTION_DAYS,
		clinic,
		serviceTypes: types,
		patients: patientRows,
		sessions: sessionRows,
		sessionAudits: auditRows
	};
}

export type BackupRunResult = {
	status: "success" | "error";
	driveFileId?: string;
	fileName?: string;
	bytes?: number;
	deletedOldFiles: number;
	errorMessage?: string;
};

/**
 * Gera backup, sobe no Drive e aplica retenção de 30 dias.
 */
export const runClinicDriveBackup = async (
	clinicId: string,
	trigger: "manual" | "cron",
	db: Db = getDb()
): Promise<BackupRunResult> => {
	let deletedOldFiles = 0;

	try {
		const auth = await getValidDriveAccessToken(clinicId, db);
		if (!auth) {
			throw new Error("Google Drive não conectado.");
		}

		const folderId = await ensureBackupFolder(auth.accessToken, auth.folderId);
		if (folderId !== auth.folderId) {
			await db
				.update(googleDriveConnections)
				.set({ folderId, updatedAt: new Date() })
				.where(eq(googleDriveConnections.id, auth.connectionId));
		}

		const payload = await buildClinicBackupPayload(clinicId, db);
		const jsonBody = JSON.stringify(payload, null, 2);
		const fileName = buildBackupFileName(clinicId);
		const uploaded = await uploadBackupJson(
			auth.accessToken,
			folderId,
			fileName,
			jsonBody
		);

		const existing = await listBackupFiles(auth.accessToken, folderId);
		const stale = filesOlderThanRetention(existing);
		for (const file of stale) {
			try {
				await trashDriveFile(auth.accessToken, file.id);
				deletedOldFiles += 1;
			} catch (err) {
				console.error("Falha ao apagar backup antigo:", file.id, err);
			}
		}

		const result: BackupRunResult = {
			status: "success",
			driveFileId: uploaded.id,
			fileName,
			bytes: uploaded.size,
			deletedOldFiles
		};

		await db.insert(backupRuns).values({
			clinicId,
			status: "success",
			trigger,
			driveFileId: uploaded.id,
			fileName,
			bytes: uploaded.size,
			deletedOldFiles
		});

		return result;
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Falha ao gerar backup.";

		await db.insert(backupRuns).values({
			clinicId,
			status: "error",
			trigger,
			errorMessage,
			deletedOldFiles
		});

		return {
			status: "error",
			deletedOldFiles,
			errorMessage
		};
	}
}

/**
 * Executa backup para todas as clínicas com Drive conectado.
 */
export const runAllClinicDriveBackups = async (
	db: Db = getDb()
): Promise<{
	total: number;
	success: number;
	errors: number;
	results: Array<{ clinicId: string } & BackupRunResult>;
}> => {
	const connections = await db
		.select({ clinicId: googleDriveConnections.clinicId })
		.from(googleDriveConnections);

	const results: Array<{ clinicId: string } & BackupRunResult> = [];
	let success = 0;
	let errors = 0;

	for (const conn of connections) {
		const result = await runClinicDriveBackup(conn.clinicId, "cron", db);
		results.push({ clinicId: conn.clinicId, ...result });
		if (result.status === "success") success += 1;
		else errors += 1;
	}

	return {
		total: connections.length,
		success,
		errors,
		results
	};
}

/**
 * Última execução de backup da clínica.
 */
export const getLatestBackupRun = async (clinicId: string, db: Db = getDb()) => {
	const [run] = await db
		.select({
			id: backupRuns.id,
			status: backupRuns.status,
			trigger: backupRuns.trigger,
			fileName: backupRuns.fileName,
			bytes: backupRuns.bytes,
			errorMessage: backupRuns.errorMessage,
			deletedOldFiles: backupRuns.deletedOldFiles,
			createdAt: backupRuns.createdAt
		})
		.from(backupRuns)
		.where(eq(backupRuns.clinicId, clinicId))
		.orderBy(desc(backupRuns.createdAt))
		.limit(1);

	return run ?? null;
}
