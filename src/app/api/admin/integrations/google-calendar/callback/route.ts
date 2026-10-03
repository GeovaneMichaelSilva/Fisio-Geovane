import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto/secrets";
import {
	exchangeCodeForTokens,
	fetchGoogleAccountEmail,
	parseOAuthState
} from "@/lib/google-calendar/oauth";
import {
	clearClinicGoogleEventLinks,
	clearServiceTypeCalendarMappings
} from "@/lib/google-calendar/sync";

function redirectIntegrations(query: string) {
	const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	return NextResponse.redirect(
		new URL(`/admin/settings/integrations?${query}`, base)
	);
}

/**
 * Callback OAuth Google Agenda — troca code por tokens e persiste na clínica.
 * Limpa vínculos antigos e pede restore no front (pode ser outra conta).
 */
export async function GET(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return redirectIntegrations(
				"google=error&message=" + encodeURIComponent("Faça login novamente.")
			);
		}

		const { searchParams } = new URL(request.url);
		const error = searchParams.get("error");
		if (error) {
			return redirectIntegrations(
				"google=error&message=" +
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
				"google=error&message=" +
					encodeURIComponent("Callback OAuth incompleto.")
			);
		}

		const parsed = parseOAuthState(state);
		if (parsed.userId !== session.user.id) {
			return redirectIntegrations(
				"google=error&message=" +
					encodeURIComponent("Sessão não corresponde ao state OAuth.")
			);
		}

		const tokens = await exchangeCodeForTokens(code);
		if (!tokens.refresh_token) {
			return redirectIntegrations(
				"google=error&message=" +
					encodeURIComponent(
						"Google não retornou refresh_token. Revogue o acesso do app em myaccount.google.com/permissions e tente de novo."
					)
			);
		}

		const email = await fetchGoogleAccountEmail(tokens.access_token);
		const db = getDb();

		const [existing] = await db
			.select({
				id: googleCalendarConnections.id,
				googleAccountEmail: googleCalendarConnections.googleAccountEmail,
				calendarId: googleCalendarConnections.calendarId
			})
			.from(googleCalendarConnections)
			.where(eq(googleCalendarConnections.clinicId, parsed.clinicId))
			.limit(1);

		const accountChanged =
			Boolean(existing) && existing!.googleAccountEmail !== email;

		const values = {
			clinicId: parsed.clinicId,
			connectedByUserId: session.user.id,
			googleAccountEmail: email,
			refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
			accessTokenEncrypted: encryptSecret(tokens.access_token),
			accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
			calendarId: existing?.calendarId || "primary",
			connectedAt: new Date(),
			updatedAt: new Date()
		};

		if (existing) {
			await db
				.update(googleCalendarConnections)
				.set(values)
				.where(eq(googleCalendarConnections.id, existing.id));
		} else {
			await db.insert(googleCalendarConnections).values(values);
		}

		// Eventos antigos podem ser de outra conta — limpa e restaura no front.
		await clearClinicGoogleEventLinks(parsed.clinicId, db);
		if (accountChanged) {
			await clearServiceTypeCalendarMappings(parsed.clinicId, db);
		}

		return redirectIntegrations("google=connected&restore=1");
	} catch (err) {
		console.error(err);
		const message =
			err instanceof Error ? err.message : "Falha ao conectar Google Agenda.";
		return redirectIntegrations(
			"google=error&message=" + encodeURIComponent(message)
		);
	}
}
