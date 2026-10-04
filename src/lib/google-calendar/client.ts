import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { refreshAccessToken } from "@/lib/google-calendar/oauth";

import type { Db } from "@/db";

/**
 * Retorna access token válido para a clínica, renovando se necessário.
 */
export const getValidAccessToken = async (
	clinicId: string,
	db: Db = getDb()
): Promise<{
	accessToken: string;
	calendarId: string;
	connectionId: string;
} | null> => {
	const [conn] = await db
		.select()
		.from(googleCalendarConnections)
		.where(eq(googleCalendarConnections.clinicId, clinicId))
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
			calendarId: conn.calendarId,
			connectionId: conn.id
		};
	}

	const tokens = await refreshAccessToken(refreshToken);
	const accessTokenEncrypted = encryptSecret(tokens.access_token);
	const accessTokenExpiresAt = new Date(
		Date.now() + tokens.expires_in * 1000
	);

	await db
		.update(googleCalendarConnections)
		.set({
			accessTokenEncrypted,
			accessTokenExpiresAt,
			updatedAt: new Date()
		})
		.where(eq(googleCalendarConnections.id, conn.id));

	return {
		accessToken: tokens.access_token,
		calendarId: conn.calendarId,
		connectionId: conn.id
	};
}
