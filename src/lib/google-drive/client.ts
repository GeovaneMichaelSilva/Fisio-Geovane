import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleDriveConnections } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { refreshAccessToken } from "@/lib/google-drive/oauth";

import type { Db } from "@/db";

/**
 * Retorna access token válido do Drive para a clínica, renovando se necessário.
 */
export async function getValidDriveAccessToken(
	clinicId: string,
	db: Db = getDb()
): Promise<{
	accessToken: string;
	folderId: string | null;
	connectionId: string;
	googleAccountEmail: string;
} | null> {
	const [conn] = await db
		.select()
		.from(googleDriveConnections)
		.where(eq(googleDriveConnections.clinicId, clinicId))
		.limit(1);

	if (!conn) return null;

	const refreshToken = decryptSecret(conn.refreshTokenEncrypted);
	const skewMs = 60_000;
	const expiresAt = conn.accessTokenExpiresAt?.getTime() ?? 0;
	const hasFreshAccess =
		conn.accessTokenEncrypted && expiresAt - skewMs > Date.now();

	if (hasFreshAccess && conn.accessTokenEncrypted) {
		return {
			accessToken: decryptSecret(conn.accessTokenEncrypted),
			folderId: conn.folderId,
			connectionId: conn.id,
			googleAccountEmail: conn.googleAccountEmail
		};
	}

	const tokens = await refreshAccessToken(refreshToken);
	const accessTokenEncrypted = encryptSecret(tokens.access_token);
	const accessTokenExpiresAt = new Date(
		Date.now() + tokens.expires_in * 1000
	);

	await db
		.update(googleDriveConnections)
		.set({
			accessTokenEncrypted,
			accessTokenExpiresAt,
			updatedAt: new Date()
		})
		.where(eq(googleDriveConnections.id, conn.id));

	return {
		accessToken: tokens.access_token,
		folderId: conn.folderId,
		connectionId: conn.id,
		googleAccountEmail: conn.googleAccountEmail
	};
}
