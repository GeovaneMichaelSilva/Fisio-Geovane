import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { googleDriveConnections } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto/secrets";
import {
	exchangeDriveCodeForTokens,
	fetchGoogleAccountEmail,
	parseOAuthState
} from "@/lib/google-drive/oauth";

const redirectIntegrations = (query: string) => {
	const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	return NextResponse.redirect(
		new URL(`/admin/settings/integrations?${query}`, base)
	);
};

/**
 * Callback OAuth Google Drive — troca code por tokens e persiste na clínica.
 */
export const GET = async (request: Request) => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return redirectIntegrations(
				"drive=error&message=" + encodeURIComponent("Faça login novamente.")
			);
		}

		const { searchParams } = new URL(request.url);
		const error = searchParams.get("error");
		if (error) {
			return redirectIntegrations(
				"drive=error&message=" +
					encodeURIComponent(
						error === "access_denied"
							? "Autorização negada no Google."
							: `Erro Google: ${error}`
					)
			);
		}

		const code = searchParams.get("code");
		const state = searchParams.get("state");
		if (!code || !state) {
			return redirectIntegrations(
				"drive=error&message=" +
					encodeURIComponent("Callback OAuth incompleto.")
			);
		}

		const parsed = parseOAuthState(state);
		if (parsed.userId !== session.user.id) {
			return redirectIntegrations(
				"drive=error&message=" +
					encodeURIComponent("Sessão não corresponde ao state OAuth.")
			);
		}

		const tokens = await exchangeDriveCodeForTokens(code);
		if (!tokens.refresh_token) {
			return redirectIntegrations(
				"drive=error&message=" +
					encodeURIComponent(
						"Google não retornou refresh_token. Revogue o acesso do app em myaccount.google.com/permissions e tente de novo."
					)
			);
		}

		const email = await fetchGoogleAccountEmail(tokens.access_token);
		const db = getDb();

		const [existing] = await db
			.select({
				id: googleDriveConnections.id,
				folderId: googleDriveConnections.folderId
			})
			.from(googleDriveConnections)
			.where(eq(googleDriveConnections.clinicId, parsed.clinicId))
			.limit(1);

		const values = {
			clinicId: parsed.clinicId,
			connectedByUserId: session.user.id,
			googleAccountEmail: email,
			refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
			accessTokenEncrypted: encryptSecret(tokens.access_token),
			accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
			folderId: existing?.folderId ?? null,
			connectedAt: new Date(),
			updatedAt: new Date()
		};

		if (existing) {
			await db
				.update(googleDriveConnections)
				.set(values)
				.where(eq(googleDriveConnections.id, existing.id));
		} else {
			await db.insert(googleDriveConnections).values(values);
		}

		return redirectIntegrations("drive=connected");
	} catch (err) {
		console.error(err);
		const message =
			err instanceof Error ? err.message : "Falha ao conectar Google Drive.";
		return redirectIntegrations(
			"drive=error&message=" + encodeURIComponent(message)
		);
	}
}
