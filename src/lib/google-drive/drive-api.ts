import {
	BACKUP_FILE_PREFIX,
	BACKUP_FOLDER_NAME,
	type DriveFileRef
} from "@/lib/google-drive/retention";

type DriveErrorBody = {
	error?: { message?: string };
};

const driveFetch = async (accessToken: string, path: string, init?: RequestInit) => {
	const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(init?.headers ?? {})
		}
	});
	if (!res.ok) {
		const json = (await res.json().catch(() => ({}))) as DriveErrorBody;
		throw new Error(
			json.error?.message || `Google Drive HTTP ${res.status}`
		);
	}
	return res;
}

/**
 * Garante pasta de backups no Drive; retorna o folderId.
 * Se a pasta salva foi para a lixeira ou sumiu, cria/reusa uma nova.
 */
export const ensureBackupFolder = async (
	accessToken: string,
	existingFolderId: string | null
): Promise<string> => {
	if (existingFolderId) {
		try {
			const res = await driveFetch(
				accessToken,
				`/files/${encodeURIComponent(existingFolderId)}?fields=id,trashed`,
				{ method: "GET" }
			);
			const meta = (await res.json()) as { id?: string; trashed?: boolean };
			// Pasta na lixeira ainda responde 200 — não reutilizar.
			if (meta.id && !meta.trashed) {
				return meta.id;
			}
		} catch {
			// pasta apagada de vez — recria abaixo
		}
	}

	const q = [
		`name='${BACKUP_FOLDER_NAME}'`,
		`mimeType='application/vnd.google-apps.folder'`,
		"trashed=false"
	].join(" and ");

	const listRes = await driveFetch(
		accessToken,
		`/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`,
		{ method: "GET" }
	);
	const listed = (await listRes.json()) as { files?: { id: string }[] };
	if (listed.files?.[0]?.id) {
		return listed.files[0].id;
	}

	const createRes = await driveFetch(accessToken, "/files", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: BACKUP_FOLDER_NAME,
			mimeType: "application/vnd.google-apps.folder"
		})
	});
	const created = (await createRes.json()) as { id: string };
	if (!created.id) throw new Error("Drive não retornou ID da pasta.");
	return created.id;
}

/**
 * Lista arquivos de backup na pasta (prefixo fisio-backup-).
 */
export const listBackupFiles = async (
	accessToken: string,
	folderId: string
): Promise<DriveFileRef[]> => {
	const q = [
		`'${folderId}' in parents`,
		"trashed=false",
		`name contains '${BACKUP_FILE_PREFIX}'`
	].join(" and ");

	const files: DriveFileRef[] = [];
	let pageToken: string | undefined;

	do {
		const params = new URLSearchParams({
			q,
			fields: "nextPageToken,files(id,name,createdTime)",
			pageSize: "100",
			orderBy: "createdTime"
		});
		if (pageToken) params.set("pageToken", pageToken);

		const res = await driveFetch(accessToken, `/files?${params}`, {
			method: "GET"
		});
		const json = (await res.json()) as {
			files?: DriveFileRef[];
			nextPageToken?: string;
		};
		files.push(...(json.files ?? []));
		pageToken = json.nextPageToken;
	} while (pageToken);

	return files;
}

/**
 * Apaga arquivo no Drive (move para lixeira).
 */
export const trashDriveFile = async (accessToken: string, fileId: string) => {
	await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}`, {
		method: "DELETE"
	});
}

/**
 * Faz upload multipart de um JSON no Drive.
 */
export const uploadBackupJson = async (
	accessToken: string,
	folderId: string,
	fileName: string,
	jsonBody: string
): Promise<{ id: string; size: number }> => {
	const metadata = {
		name: fileName,
		parents: [folderId],
		mimeType: "application/json"
	};

	const boundary = `fisio_${Date.now()}`;
	const body =
		`--${boundary}\r\n` +
		`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
		`${JSON.stringify(metadata)}\r\n` +
		`--${boundary}\r\n` +
		`Content-Type: application/json\r\n\r\n` +
		`${jsonBody}\r\n` +
		`--${boundary}--`;

	const res = await fetch(
		"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": `multipart/related; boundary=${boundary}`
			},
			body
		}
	);

	const json = (await res.json()) as {
		id?: string;
		size?: string;
		error?: { message?: string };
	};
	if (!res.ok || !json.id) {
		throw new Error(json.error?.message || `Upload Drive HTTP ${res.status}`);
	}

	return {
		id: json.id,
		size: json.size
			? Number(json.size)
			: new TextEncoder().encode(jsonBody).byteLength
	};
}
