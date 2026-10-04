export const BACKUP_RETENTION_DAYS = 30;
export const BACKUP_FOLDER_NAME = "FisioGeovane Backups";
export const BACKUP_FILE_PREFIX = "fisio-backup-";

export type DriveFileRef = {
	id: string;
	name: string;
	createdTime?: string;
};

/**
 * Retorna arquivos com idade maior que retentionDays (a partir de now).
 */
export function filesOlderThanRetention(
	files: DriveFileRef[],
	now: Date = new Date(),
	retentionDays: number = BACKUP_RETENTION_DAYS
): DriveFileRef[] {
	const cutoffMs = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
	return files.filter((f) => {
		if (!f.createdTime) return false;
		const created = Date.parse(f.createdTime);
		if (Number.isNaN(created)) return false;
		return created < cutoffMs;
	});
}

/**
 * Nome do arquivo de backup no Drive.
 */
export function buildBackupFileName(clinicId: string, at: Date = new Date()) {
	const stamp = at.toISOString().replace(/[:.]/g, "-");
	return `${BACKUP_FILE_PREFIX}${clinicId.slice(0, 8)}-${stamp}.json`;
}

/**
 * Autoriza chamada de cron via Bearer CRON_SECRET.
 */
export function authorizeCronRequest(request: Request): boolean {
	const secret = process.env.CRON_SECRET?.trim();
	if (!secret) return false;
	const header = request.headers.get("authorization") ?? "";
	const expected = `Bearer ${secret}`;
	if (header.length !== expected.length) return false;
	// comparação simples (secret curto de servidor); timing-safe não é crítico aqui
	return header === expected;
}
